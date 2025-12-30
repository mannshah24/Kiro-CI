// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KiroGatekeeper
 * @author Kiro-CI Team
 * @notice Prevents deployment of arbitrary bytecode unless there is a valid EAS attestation
 *         linking the requested commit hash to a successful verification performed by the
 *         trusted Kiro Agent. When verification passes, `deploySecurely` will deploy using
 *         CREATE2 (salted with the attestation UID) and return the new address.
 * @dev This contract implements security best practices:
 *      - Ownable for administrative functions
 *      - Pausable for emergency stops
 *      - ReentrancyGuard for protection against reentrancy attacks
 *      - Events for all important state changes
 */

/// @notice EAS interface for fetching attestations (matches Base Sepolia EAS deployment)
interface IEAS {
    struct Attestation {
        bytes32 uid;
        bytes32 schema;
        uint64 time;
        uint64 expirationTime;
        uint64 revocationTime;
        bytes32 refUID;
        address recipient;
        address attester;
        bool revocable;
        bytes data;
    }

    /// @notice Retrieve attestation by uid
    function getAttestation(bytes32 uid) external view returns (Attestation memory);
}

/// @notice Minimal resolver interface used by the gatekeeper to decode attestation payloads
interface IKiroResolver {
    /// @dev decode returns (commitHash, projectId, passedTests)
    function decode(bytes calldata data) external pure returns (bytes32, string memory, bool);
}

// Custom errors for gas efficiency
error UnverifiedCode();
error InvalidAttestation();
error UnauthorizedAttester();
error Create2Failed();
error ZeroAddress();
error AttestationRevoked();
error AttestationExpired();
error BytecodeEmpty();
error InsufficientGas();

contract KiroGatekeeper is Ownable, Pausable, ReentrancyGuard {
    // ============ State Variables ============

    /// @notice EAS registry instance
    IEAS public immutable eas;

    /// @notice Trusted attester address (the Kiro Agent wallet)
    address public trustedAttester;

    /// @notice Expected EAS schema id for Kiro attestations
    bytes32 public trustedSchema;

    /// @notice Resolver that knows how to decode our schema payload
    IKiroResolver public resolver;

    /// @notice Minimum gas required for CREATE2 deployment
    uint256 public constant MIN_GAS_FOR_DEPLOYMENT = 100000;

    /// @notice Track deployed contracts by attestation UID
    mapping(bytes32 => address) public deployedByAttestation;

    /// @notice Track all deployments by commit hash
    mapping(bytes32 => address[]) public deploymentsByCommit;

    /// @notice Total number of successful deployments
    uint256 public totalDeployments;

    // ============ Events ============

    event Deployed(
        address indexed deployed,
        address indexed caller,
        bytes32 indexed attestationUID,
        bytes32 commitHash,
        uint256 gasUsed
    );

    event DeploymentFailed(
        address indexed caller,
        bytes32 indexed attestationUID,
        string reason
    );

    event AttestationValidated(
        bytes32 indexed attestationUID,
        bytes32 indexed commitHash,
        address attester
    );

    event TrustedAttesterUpdated(
        address indexed oldAttester,
        address indexed newAttester
    );

    event TrustedSchemaUpdated(
        bytes32 indexed oldSchema,
        bytes32 indexed newSchema
    );

    event ResolverUpdated(
        address indexed oldResolver,
        address indexed newResolver
    );

    // ============ Constructor ============

    constructor(
        address _eas,
        address _trustedAttester,
        bytes32 _trustedSchema,
        address _resolver,
        address _owner
    ) Ownable(_owner) {
        if (_eas == address(0)) revert ZeroAddress();
        if (_trustedAttester == address(0)) revert ZeroAddress();
        if (_resolver == address(0)) revert ZeroAddress();

        eas = IEAS(_eas);
        trustedAttester = _trustedAttester;
        trustedSchema = _trustedSchema;
        resolver = IKiroResolver(_resolver);
    }

    // ============ External Functions ============

    /**
     * @notice Deploy `bytecode` via CREATE2 if a valid attestation exists for `commitHash`
     * @param bytecode The creation bytecode (constructor args already included)
     * @param commitHash The bytes32 commit hash that must match the attestation's payload
     * @param attestationUID The EAS attestation UID proving verification of the commit
     * @return deployed Address of the deployed contract
     */
    function deploySecurely(
        bytes memory bytecode,
        bytes32 commitHash,
        bytes32 attestationUID
    ) external payable whenNotPaused nonReentrant returns (address deployed) {
        // Pre-checks
        if (bytecode.length == 0) revert BytecodeEmpty();
        if (gasleft() < MIN_GAS_FOR_DEPLOYMENT) revert InsufficientGas();

        uint256 gasStart = gasleft();

        // 1) Retrieve attestation
        IEAS.Attestation memory att = eas.getAttestation(attestationUID);

        // 2) Basic authenticity checks
        if (att.attester != trustedAttester) {
            emit DeploymentFailed(msg.sender, attestationUID, "UnauthorizedAttester");
            revert UnauthorizedAttester();
        }
        if (att.schema != trustedSchema) {
            emit DeploymentFailed(msg.sender, attestationUID, "InvalidAttestation");
            revert InvalidAttestation();
        }

        // 3) Check attestation validity (not revoked, not expired)
        if (att.revocationTime != 0) {
            emit DeploymentFailed(msg.sender, attestationUID, "AttestationRevoked");
            revert AttestationRevoked();
        }
        if (att.expirationTime != 0 && att.expirationTime < block.timestamp) {
            emit DeploymentFailed(msg.sender, attestationUID, "AttestationExpired");
            revert AttestationExpired();
        }

        // 4) Decode payload => (commitHash, projectId, passedTests)
        (bytes32 attCommitHash, , bool passedTests) = resolver.decode(att.data);

        // 5) Validate
        if (attCommitHash != commitHash) {
            emit DeploymentFailed(msg.sender, attestationUID, "CommitHashMismatch");
            revert UnverifiedCode();
        }
        if (!passedTests) {
            emit DeploymentFailed(msg.sender, attestationUID, "TestsNotPassed");
            revert UnverifiedCode();
        }

        emit AttestationValidated(attestationUID, commitHash, att.attester);

        // 6) Deploy with CREATE2
        bytes32 salt = attestationUID;
        address addr;

        assembly {
            let encoded := add(bytecode, 0x20)
            let encodedLen := mload(bytecode)
            addr := create2(callvalue(), encoded, encodedLen, salt)
        }

        if (addr == address(0)) {
            emit DeploymentFailed(msg.sender, attestationUID, "Create2Failed");
            revert Create2Failed();
        }

        // Update state
        deployedByAttestation[attestationUID] = addr;
        deploymentsByCommit[commitHash].push(addr);
        totalDeployments++;

        uint256 gasUsed = gasStart - gasleft();

        emit Deployed(addr, msg.sender, attestationUID, commitHash, gasUsed);
        return addr;
    }

    /// @notice Compute CREATE2 address for given salt and bytecode hash
    function computeAddress(
        bytes32 attestationUID,
        bytes32 bytecodeHash,
        address deployer
    ) public pure returns (address) {
        bytes32 data = keccak256(
            abi.encodePacked(bytes1(0xff), deployer, attestationUID, bytecodeHash)
        );
        return address(uint160(uint256(data)));
    }

    /// @notice Compute CREATE2 address using this contract as deployer
    function computeAddressForSelf(
        bytes32 attestationUID,
        bytes32 bytecodeHash
    ) external view returns (address) {
        return computeAddress(attestationUID, bytecodeHash, address(this));
    }

    /// @notice Get all deployments for a specific commit hash
    function getDeploymentsByCommit(bytes32 commitHash) external view returns (address[] memory) {
        return deploymentsByCommit[commitHash];
    }

    /// @notice Check if an attestation has been used for deployment
    function isAttestationUsed(bytes32 attestationUID) external view returns (bool) {
        return deployedByAttestation[attestationUID] != address(0);
    }

    // ============ Admin Functions ============

    /// @notice Update the trusted attester address
    function updateTrustedAttester(address newAttester) external onlyOwner {
        if (newAttester == address(0)) revert ZeroAddress();
        address oldAttester = trustedAttester;
        trustedAttester = newAttester;
        emit TrustedAttesterUpdated(oldAttester, newAttester);
    }

    /// @notice Update the trusted schema ID
    function updateTrustedSchema(bytes32 newSchema) external onlyOwner {
        bytes32 oldSchema = trustedSchema;
        trustedSchema = newSchema;
        emit TrustedSchemaUpdated(oldSchema, newSchema);
    }

    /// @notice Update the resolver contract address
    function updateResolver(address newResolver) external onlyOwner {
        if (newResolver == address(0)) revert ZeroAddress();
        address oldResolver = address(resolver);
        resolver = IKiroResolver(newResolver);
        emit ResolverUpdated(oldResolver, newResolver);
    }

    /// @notice Pause the contract in case of emergency
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Withdraw any accidentally sent ETH
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }

    /// @notice Allow receiving ETH for deployments
    receive() external payable {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KiroGatekeeper
 * @notice Prevents deployment of arbitrary bytecode unless there is a valid EAS attestation
 *         linking the requested commit hash to a successful verification performed by the
 *         trusted Kiro Agent. When verification passes, `deploySecurely` will deploy using
 *         CREATE2 (salted with the attestation UID) and return the new address.
 *
 * Notes:
 * - This contract expects an EAS-like registry exposing `getAttestation(bytes32)` that returns
 *   an attestation struct. If your EAS deployment uses a different ABI, adapt the `IEAS`
 *   interface accordingly.
 */

interface IEAS {
    struct Attestation {
        address attester;
        bytes32 schema;
        bytes data;
        uint64 time; // optional/timestamp
    }

    /// @notice Retrieve attestation by uid. Adjust to match your EAS deployment ABI if different.
    function getAttestation(bytes32 uid) external view returns (Attestation memory);
}

/// @notice Minimal resolver interface used by the gatekeeper to decode attestation payloads.
interface IKiroResolver {
    /// @dev decode returns (commitHash, projectId, passedTests)
    function decode(bytes calldata data) external pure returns (bytes32, string memory, bool);
}

error UnverifiedCode();
error InvalidAttestation();
error UnauthorizedAttester();
error Create2Failed();

contract KiroGatekeeper {
    /// @notice EAS registry instance
    IEAS public immutable eas;

    /// @notice Trusted attester address (the Kiro Agent wallet)
    address public immutable trustedAttester;

    /// @notice Expected EAS schema id for Kiro attestations
    bytes32 public immutable trustedSchema;

    /// @notice Resolver that knows how to decode our schema payload
    IKiroResolver public immutable resolver;

    event Deployed(address indexed deployed, address indexed caller, bytes32 indexed attestationUID, bytes32 commitHash);

    constructor(address _eas, address _trustedAttester, bytes32 _trustedSchema, address _resolver) {
        require(_eas != address(0), "zero eas");
        require(_trustedAttester != address(0), "zero attester");
        require(_resolver != address(0), "zero resolver");

        eas = IEAS(_eas);
        trustedAttester = _trustedAttester;
        trustedSchema = _trustedSchema;
        resolver = IKiroResolver(_resolver);
    }

    /**
     * @notice Deploy `bytecode` via CREATE2 if a valid attestation exists for `commitHash`.
     * @param bytecode The creation bytecode (constructor args already included).
     * @param commitHash The bytes32 commit hash that must match the attestation's payload.
     * @param attestationUID The EAS attestation UID proving verification of the commit.
     * @return deployed Address of the deployed contract.
     *
     * Verification steps:
     *  1. Fetch attestation from EAS using `attestationUID`.
     *  2. Ensure `attester == trustedAttester`.
     *  3. Ensure `schema == trustedSchema`.
     *  4. Decode att.data via `resolver.decode` and ensure the embedded commitHash matches
     *     and `passedTests == true`.
     *  5. If all checks pass, deploy via CREATE2 using `attestationUID` as salt.
     */
    function deploySecurely(bytes memory bytecode, bytes32 commitHash, bytes32 attestationUID) external payable returns (address deployed) {
        // 1) Retrieve attestation
        IEAS.Attestation memory att = eas.getAttestation(attestationUID);

        // 2) Basic authenticity checks
        if (att.attester != trustedAttester) revert UnauthorizedAttester();
        if (att.schema != trustedSchema) revert InvalidAttestation();

        // 3) Decode payload => (commitHash, projectId, passedTests)
        (bytes32 attCommitHash, , bool passedTests) = resolver.decode(att.data);

        // 4) Validate
        if (attCommitHash != commitHash) revert UnverifiedCode();
        if (!passedTests) revert UnverifiedCode();

        // 5) Deploy with CREATE2
        bytes32 salt = attestationUID;
        address addr;

        assembly {
            let encoded := add(bytecode, 0x20)
            let encodedLen := mload(bytecode)
            addr := create2(callvalue(), encoded, encodedLen, salt)
        }

        if (addr == address(0)) revert Create2Failed();

        emit Deployed(addr, msg.sender, attestationUID, commitHash);
        return addr;
    }

    /// @notice Compute CREATE2 address for given salt and bytecode hash
    function computeAddress(bytes32 attestationUID, bytes32 bytecodeHash, address deployer) public pure returns (address) {
        bytes32 data = keccak256(abi.encodePacked(bytes1(0xff), deployer, attestationUID, bytecodeHash));
        return address(uint160(uint256(data)));
    }
}

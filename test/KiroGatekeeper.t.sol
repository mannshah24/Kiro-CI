// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/KiroGatekeeper.sol";
import "../contracts/KiroResolver.sol";

/**
 * @title MockEAS
 * @notice Mock EAS contract for testing
 */
contract MockEAS {
    mapping(bytes32 => IEAS.Attestation) public attestations;

    function setAttestation(bytes32 uid, IEAS.Attestation memory att) external {
        attestations[uid] = att;
    }

    function getAttestation(bytes32 uid) external view returns (IEAS.Attestation memory) {
        return attestations[uid];
    }
}

/**
 * @title SimpleContract
 * @notice Simple contract for deployment testing
 */
contract SimpleContract {
    uint256 public value;

    constructor(uint256 _value) payable {
        value = _value;
    }
}

contract KiroGatekeeperTest is Test {
    KiroGatekeeper public gatekeeper;
    KiroResolver public resolver;
    MockEAS public mockEAS;

    address public owner;
    address public trustedAttester = address(0x1234);
    bytes32 public trustedSchema = keccak256("kiro-ci-schema");
    
    // Test data
    bytes32 public testCommitHash = keccak256("test-commit-abc123");
    string public testProjectId = "kiro-ci-test";
    bytes32 public testAttestationUID = keccak256("test-attestation-uid");

    // Events to test
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

    function setUp() public {
        // Use a proper address as owner that can receive ETH
        owner = makeAddr("owner");
        
        // Deploy mock EAS
        mockEAS = new MockEAS();
        
        // Deploy resolver
        resolver = new KiroResolver(trustedAttester, owner);
        
        // Deploy gatekeeper
        gatekeeper = new KiroGatekeeper(
            address(mockEAS),
            trustedAttester,
            trustedSchema,
            address(resolver),
            owner
        );
    }

    // ============ Helper Functions ============

    function _createValidAttestation() internal view returns (IEAS.Attestation memory) {
        bytes memory data = abi.encode(testCommitHash, testProjectId, true);
        
        return IEAS.Attestation({
            uid: testAttestationUID,
            schema: trustedSchema,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: trustedAttester,
            revocable: false,
            data: data
        });
    }

    function _getSimpleContractBytecode(uint256 value) internal pure returns (bytes memory) {
        return abi.encodePacked(type(SimpleContract).creationCode, abi.encode(value));
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsCorrectValues() public view {
        assertEq(address(gatekeeper.eas()), address(mockEAS));
        assertEq(gatekeeper.trustedAttester(), trustedAttester);
        assertEq(gatekeeper.trustedSchema(), trustedSchema);
        assertEq(address(gatekeeper.resolver()), address(resolver));
        assertEq(gatekeeper.owner(), owner);
        assertEq(gatekeeper.totalDeployments(), 0);
    }

    function test_Constructor_RevertsOnZeroEAS() public {
        vm.expectRevert(ZeroAddress.selector);
        new KiroGatekeeper(
            address(0),
            trustedAttester,
            trustedSchema,
            address(resolver),
            owner
        );
    }

    function test_Constructor_RevertsOnZeroAttester() public {
        vm.expectRevert(ZeroAddress.selector);
        new KiroGatekeeper(
            address(mockEAS),
            address(0),
            trustedSchema,
            address(resolver),
            owner
        );
    }

    function test_Constructor_RevertsOnZeroResolver() public {
        vm.expectRevert(ZeroAddress.selector);
        new KiroGatekeeper(
            address(mockEAS),
            trustedAttester,
            trustedSchema,
            address(0),
            owner
        );
    }

    // ============ DeploySecurely Tests ============

    function test_DeploySecurely_Success() public {
        // Setup valid attestation
        IEAS.Attestation memory att = _createValidAttestation();
        mockEAS.setAttestation(testAttestationUID, att);
        
        bytes memory bytecode = _getSimpleContractBytecode(42);
        
        // Deploy
        address deployed = gatekeeper.deploySecurely(bytecode, testCommitHash, testAttestationUID);
        
        // Verify deployment
        assertTrue(deployed != address(0));
        assertEq(SimpleContract(deployed).value(), 42);
        assertEq(gatekeeper.totalDeployments(), 1);
        assertEq(gatekeeper.deployedByAttestation(testAttestationUID), deployed);
    }

    function test_DeploySecurely_EmitsEvents() public {
        IEAS.Attestation memory att = _createValidAttestation();
        mockEAS.setAttestation(testAttestationUID, att);
        
        bytes memory bytecode = _getSimpleContractBytecode(42);
        
        vm.expectEmit(true, true, false, true);
        emit AttestationValidated(testAttestationUID, testCommitHash, trustedAttester);
        
        gatekeeper.deploySecurely(bytecode, testCommitHash, testAttestationUID);
    }

    function test_DeploySecurely_RevertsOnEmptyBytecode() public {
        IEAS.Attestation memory att = _createValidAttestation();
        mockEAS.setAttestation(testAttestationUID, att);
        
        vm.expectRevert(BytecodeEmpty.selector);
        gatekeeper.deploySecurely(new bytes(0), testCommitHash, testAttestationUID);
    }

    function test_DeploySecurely_RevertsOnUnauthorizedAttester() public {
        IEAS.Attestation memory att = _createValidAttestation();
        att.attester = address(0x9999); // Wrong attester
        mockEAS.setAttestation(testAttestationUID, att);
        
        bytes memory bytecode = _getSimpleContractBytecode(42);
        
        vm.expectRevert(UnauthorizedAttester.selector);
        gatekeeper.deploySecurely(bytecode, testCommitHash, testAttestationUID);
    }

    function test_DeploySecurely_RevertsOnInvalidSchema() public {
        IEAS.Attestation memory att = _createValidAttestation();
        att.schema = keccak256("wrong-schema"); // Wrong schema
        mockEAS.setAttestation(testAttestationUID, att);
        
        bytes memory bytecode = _getSimpleContractBytecode(42);
        
        vm.expectRevert(InvalidAttestation.selector);
        gatekeeper.deploySecurely(bytecode, testCommitHash, testAttestationUID);
    }

    function test_DeploySecurely_RevertsOnRevokedAttestation() public {
        IEAS.Attestation memory att = _createValidAttestation();
        att.revocationTime = uint64(block.timestamp); // Any non-zero time means revoked
        mockEAS.setAttestation(testAttestationUID, att);
        
        bytes memory bytecode = _getSimpleContractBytecode(42);
        
        vm.expectRevert(AttestationRevoked.selector);
        gatekeeper.deploySecurely(bytecode, testCommitHash, testAttestationUID);
    }

    function test_DeploySecurely_RevertsOnExpiredAttestation() public {
        // Warp to a known timestamp first
        vm.warp(1000000);
        
        IEAS.Attestation memory att = _createValidAttestation();
        att.expirationTime = uint64(block.timestamp - 1); // Expired in the past
        mockEAS.setAttestation(testAttestationUID, att);
        
        bytes memory bytecode = _getSimpleContractBytecode(42);
        
        vm.expectRevert(AttestationExpired.selector);
        gatekeeper.deploySecurely(bytecode, testCommitHash, testAttestationUID);
    }

    function test_DeploySecurely_RevertsOnCommitHashMismatch() public {
        IEAS.Attestation memory att = _createValidAttestation();
        mockEAS.setAttestation(testAttestationUID, att);
        
        bytes memory bytecode = _getSimpleContractBytecode(42);
        bytes32 wrongCommitHash = keccak256("wrong-commit");
        
        vm.expectRevert(UnverifiedCode.selector);
        gatekeeper.deploySecurely(bytecode, wrongCommitHash, testAttestationUID);
    }

    function test_DeploySecurely_RevertsOnFailedTests() public {
        // Create attestation with failed tests
        bytes memory data = abi.encode(testCommitHash, testProjectId, false);
        
        IEAS.Attestation memory att = IEAS.Attestation({
            uid: testAttestationUID,
            schema: trustedSchema,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: trustedAttester,
            revocable: false,
            data: data
        });
        mockEAS.setAttestation(testAttestationUID, att);
        
        bytes memory bytecode = _getSimpleContractBytecode(42);
        
        vm.expectRevert(UnverifiedCode.selector);
        gatekeeper.deploySecurely(bytecode, testCommitHash, testAttestationUID);
    }

    function test_DeploySecurely_RevertsWhenPaused() public {
        IEAS.Attestation memory att = _createValidAttestation();
        mockEAS.setAttestation(testAttestationUID, att);
        
        bytes memory bytecode = _getSimpleContractBytecode(42);
        
        vm.prank(owner);
        gatekeeper.pause();
        
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        gatekeeper.deploySecurely(bytecode, testCommitHash, testAttestationUID);
    }

    function test_DeploySecurely_WithETHValue() public {
        IEAS.Attestation memory att = _createValidAttestation();
        mockEAS.setAttestation(testAttestationUID, att);
        
        // SimpleContract now accepts ETH in constructor (payable)
        bytes memory bytecode = _getSimpleContractBytecode(42);
        
        vm.deal(address(this), 1 ether);
        address deployed = gatekeeper.deploySecurely{value: 0.1 ether}(bytecode, testCommitHash, testAttestationUID);
        
        assertTrue(deployed != address(0));
        assertEq(deployed.balance, 0.1 ether); // Verify ETH was sent to deployed contract
    }

    // ============ ComputeAddress Tests ============

    function test_ComputeAddress_MatchesDeployedAddress() public {
        IEAS.Attestation memory att = _createValidAttestation();
        mockEAS.setAttestation(testAttestationUID, att);
        
        bytes memory bytecode = _getSimpleContractBytecode(42);
        bytes32 bytecodeHash = keccak256(bytecode);
        
        // Compute address before deployment
        address predicted = gatekeeper.computeAddressForSelf(testAttestationUID, bytecodeHash);
        
        // Deploy
        address deployed = gatekeeper.deploySecurely(bytecode, testCommitHash, testAttestationUID);
        
        // Verify
        assertEq(deployed, predicted);
    }

    // ============ Getter Tests ============

    function test_GetDeploymentsByCommit() public {
        IEAS.Attestation memory att = _createValidAttestation();
        mockEAS.setAttestation(testAttestationUID, att);
        
        bytes memory bytecode = _getSimpleContractBytecode(42);
        
        address deployed = gatekeeper.deploySecurely(bytecode, testCommitHash, testAttestationUID);
        
        address[] memory deployments = gatekeeper.getDeploymentsByCommit(testCommitHash);
        assertEq(deployments.length, 1);
        assertEq(deployments[0], deployed);
    }

    function test_IsAttestationUsed() public {
        assertFalse(gatekeeper.isAttestationUsed(testAttestationUID));
        
        IEAS.Attestation memory att = _createValidAttestation();
        mockEAS.setAttestation(testAttestationUID, att);
        
        bytes memory bytecode = _getSimpleContractBytecode(42);
        gatekeeper.deploySecurely(bytecode, testCommitHash, testAttestationUID);
        
        assertTrue(gatekeeper.isAttestationUsed(testAttestationUID));
    }

    // ============ Admin Tests ============

    function test_UpdateTrustedAttester() public {
        address newAttester = address(0x5678);
        
        vm.prank(owner);
        vm.expectEmit(true, true, false, false);
        emit TrustedAttesterUpdated(trustedAttester, newAttester);
        
        gatekeeper.updateTrustedAttester(newAttester);
        
        assertEq(gatekeeper.trustedAttester(), newAttester);
    }

    function test_UpdateTrustedAttester_RevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ZeroAddress.selector);
        gatekeeper.updateTrustedAttester(address(0));
    }

    function test_UpdateTrustedAttester_RevertsForNonOwner() public {
        vm.prank(address(0x9999));
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", address(0x9999)));
        gatekeeper.updateTrustedAttester(address(0x5678));
    }

    function test_UpdateTrustedSchema() public {
        bytes32 newSchema = keccak256("new-schema");
        vm.prank(owner);
        gatekeeper.updateTrustedSchema(newSchema);
        assertEq(gatekeeper.trustedSchema(), newSchema);
    }

    function test_UpdateResolver() public {
        KiroResolver newResolver = new KiroResolver(trustedAttester, owner);
        vm.prank(owner);
        gatekeeper.updateResolver(address(newResolver));
        assertEq(address(gatekeeper.resolver()), address(newResolver));
    }

    function test_UpdateResolver_RevertsOnZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(ZeroAddress.selector);
        gatekeeper.updateResolver(address(0));
    }

    function test_Pause_Unpause() public {
        assertFalse(gatekeeper.paused());
        
        vm.prank(owner);
        gatekeeper.pause();
        assertTrue(gatekeeper.paused());
        
        vm.prank(owner);
        gatekeeper.unpause();
        assertFalse(gatekeeper.paused());
    }

    function test_WithdrawETH() public {
        vm.deal(address(gatekeeper), 1 ether);
        
        uint256 balanceBefore = owner.balance;
        vm.prank(owner);
        gatekeeper.withdrawETH();
        uint256 balanceAfter = owner.balance;
        
        assertEq(balanceAfter - balanceBefore, 1 ether);
        assertEq(address(gatekeeper).balance, 0);
    }

    // ============ Receive Tests ============

    function test_ReceiveETH() public {
        vm.deal(address(this), 1 ether);
        (bool success, ) = address(gatekeeper).call{value: 0.5 ether}("");
        assertTrue(success);
        assertEq(address(gatekeeper).balance, 0.5 ether);
    }

    // ============ Fuzz Tests ============

    function testFuzz_DeploySecurely_DifferentValues(uint256 value) public {
        IEAS.Attestation memory att = _createValidAttestation();
        mockEAS.setAttestation(testAttestationUID, att);
        
        bytes memory bytecode = _getSimpleContractBytecode(value);
        
        address deployed = gatekeeper.deploySecurely(bytecode, testCommitHash, testAttestationUID);
        
        assertEq(SimpleContract(deployed).value(), value);
    }
}

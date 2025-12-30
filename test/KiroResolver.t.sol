// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/KiroResolver.sol";

contract KiroResolverTest is Test {
    KiroResolver public resolver;
    
    address public owner = address(this);
    address public trustedAttester = address(0x1234);
    address public newAttester = address(0x5678);
    
    // Test data
    bytes32 public testCommitHash = keccak256("test-commit-abc123");
    string public testProjectId = "kiro-ci-test";
    bool public testPassed = true;

    event AttestationDecoded(
        bytes32 indexed commitHash,
        string projectId,
        bool passedTests
    );

    event TrustedAttesterUpdated(
        address indexed oldAttester,
        address indexed newAttester
    );

    function setUp() public {
        resolver = new KiroResolver(trustedAttester, owner);
    }

    // ============ Constructor Tests ============

    function test_Constructor_SetsCorrectValues() public view {
        assertEq(resolver.trustedAttester(), trustedAttester);
        assertEq(resolver.owner(), owner);
        assertEq(resolver.totalDecoded(), 0);
    }

    function test_Constructor_RevertsOnZeroAttester() public {
        vm.expectRevert(ResolverZeroAddress.selector);
        new KiroResolver(address(0), owner);
    }

    // ============ Decode Tests ============

    function test_Decode_ValidData() public view {
        bytes memory data = abi.encode(testCommitHash, testProjectId, testPassed);
        
        (bytes32 commitHash, string memory projectId, bool passedTests) = resolver.decode(data);
        
        assertEq(commitHash, testCommitHash);
        assertEq(projectId, testProjectId);
        assertTrue(passedTests);
    }

    function test_Decode_FailedTests() public view {
        bytes memory data = abi.encode(testCommitHash, testProjectId, false);
        
        (bytes32 commitHash, string memory projectId, bool passedTests) = resolver.decode(data);
        
        assertEq(commitHash, testCommitHash);
        assertEq(projectId, testProjectId);
        assertFalse(passedTests);
    }

    function test_Decode_EmptyProjectId() public view {
        bytes memory data = abi.encode(testCommitHash, "", testPassed);
        
        (bytes32 commitHash, string memory projectId, bool passedTests) = resolver.decode(data);
        
        assertEq(commitHash, testCommitHash);
        assertEq(projectId, "");
        assertTrue(passedTests);
    }

    // ============ DecodeAndLog Tests ============

    function test_DecodeAndLog_EmitsEvent() public {
        bytes memory data = abi.encode(testCommitHash, testProjectId, testPassed);
        
        vm.expectEmit(true, false, false, true);
        emit AttestationDecoded(testCommitHash, testProjectId, testPassed);
        
        resolver.decodeAndLog(data);
    }

    function test_DecodeAndLog_IncrementsTotalDecoded() public {
        bytes memory data = abi.encode(testCommitHash, testProjectId, testPassed);
        
        assertEq(resolver.totalDecoded(), 0);
        
        resolver.decodeAndLog(data);
        assertEq(resolver.totalDecoded(), 1);
        
        resolver.decodeAndLog(data);
        assertEq(resolver.totalDecoded(), 2);
    }

    // ============ ValidatePayload Tests ============

    function test_ValidatePayload_ReturnsTrue() public view {
        bytes memory data = abi.encode(testCommitHash, testProjectId, true);
        assertTrue(resolver.validatePayload(data));
    }

    function test_ValidatePayload_ReturnsFalse() public view {
        bytes memory data = abi.encode(testCommitHash, testProjectId, false);
        assertFalse(resolver.validatePayload(data));
    }

    // ============ Encode Tests ============

    function test_Encode_ProducesValidData() public view {
        bytes memory encoded = resolver.encode(testCommitHash, testProjectId, testPassed);
        
        (bytes32 commitHash, string memory projectId, bool passedTests) = resolver.decode(encoded);
        
        assertEq(commitHash, testCommitHash);
        assertEq(projectId, testProjectId);
        assertTrue(passedTests);
    }

    function test_Encode_Decode_Roundtrip() public view {
        bytes memory encoded = resolver.encode(testCommitHash, testProjectId, testPassed);
        (bytes32 decodedHash, string memory decodedProject, bool decodedPassed) = resolver.decode(encoded);
        
        assertEq(decodedHash, testCommitHash);
        assertEq(decodedProject, testProjectId);
        assertEq(decodedPassed, testPassed);
    }

    // ============ IsValidData Tests ============

    function test_IsValidData_ValidData() public view {
        bytes memory data = abi.encode(testCommitHash, testProjectId, testPassed);
        assertTrue(resolver.isValidData(data));
    }

    function test_IsValidData_TooShort() public view {
        bytes memory data = new bytes(50); // Too short
        assertFalse(resolver.isValidData(data));
    }

    // ============ Admin Tests ============

    function test_UpdateTrustedAttester_Success() public {
        vm.expectEmit(true, true, false, false);
        emit TrustedAttesterUpdated(trustedAttester, newAttester);
        
        resolver.updateTrustedAttester(newAttester);
        
        assertEq(resolver.trustedAttester(), newAttester);
    }

    function test_UpdateTrustedAttester_RevertsOnZeroAddress() public {
        vm.expectRevert(ResolverZeroAddress.selector);
        resolver.updateTrustedAttester(address(0));
    }

    function test_UpdateTrustedAttester_RevertsForNonOwner() public {
        vm.prank(address(0x9999));
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", address(0x9999)));
        resolver.updateTrustedAttester(newAttester);
    }

    // ============ Fuzz Tests ============

    function testFuzz_Decode_AnyCommitHash(bytes32 commitHash) public view {
        bytes memory data = abi.encode(commitHash, testProjectId, testPassed);
        (bytes32 decoded, , ) = resolver.decode(data);
        assertEq(decoded, commitHash);
    }

    function testFuzz_Decode_AnyProjectId(string calldata projectId) public view {
        bytes memory data = abi.encode(testCommitHash, projectId, testPassed);
        (, string memory decoded, ) = resolver.decode(data);
        assertEq(decoded, projectId);
    }

    function testFuzz_Encode_Decode_Roundtrip(
        bytes32 commitHash,
        string calldata projectId,
        bool passed
    ) public view {
        bytes memory encoded = resolver.encode(commitHash, projectId, passed);
        (bytes32 decodedHash, string memory decodedProject, bool decodedPassed) = resolver.decode(encoded);
        
        assertEq(decodedHash, commitHash);
        assertEq(decodedProject, projectId);
        assertEq(decodedPassed, passed);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KiroResolver
 * @author Kiro-CI Team
 * @notice Decoder/resolver for the Kiro EAS schema:
 *         (bytes32 commitHash, string projectId, bool passedTests)
 * @dev This helper exposes a pure `decode` that the Gatekeeper can call to interpret
 *      attestation `data`. The resolver can also be registered with EAS as the
 *      schema resolver to validate attestations at creation time.
 */

/// @notice Custom errors for KiroResolver
error ResolverZeroAddress();
error ResolverInvalidDataLength();

contract KiroResolver is Ownable {
    // ============ State Variables ============
    
    /// @notice Trusted attester address (the Kiro Agent wallet)
    address public trustedAttester;
    
    /// @notice Track total attestations decoded (for analytics)
    uint256 public totalDecoded;

    // ============ Events ============

    event AttestationDecoded(
        bytes32 indexed commitHash,
        string projectId,
        bool passedTests
    );

    event TrustedAttesterUpdated(
        address indexed oldAttester,
        address indexed newAttester
    );

    // ============ Constructor ============

    constructor(address _trustedAttester, address _owner) Ownable(_owner) {
        if (_trustedAttester == address(0)) revert ResolverZeroAddress();
        trustedAttester = _trustedAttester;
    }

    // ============ External Functions ============

    /**
     * @notice Decode attestation bytes into (commitHash, projectId, passedTests)
     * @param data The raw attestation data bytes
     * @return commitHash The git commit hash
     * @return projectId The project identifier string
     * @return passedTests Whether all tests passed
     */
    function decode(bytes calldata data) 
        external 
        pure 
        returns (
            bytes32 commitHash, 
            string memory projectId, 
            bool passedTests
        ) 
    {
        (commitHash, projectId, passedTests) = abi.decode(data, (bytes32, string, bool));
    }

    /**
     * @notice Decode and emit event for tracking (use when you want to log decodes)
     * @param data The raw attestation data bytes
     * @return commitHash The git commit hash
     * @return projectId The project identifier string
     * @return passedTests Whether all tests passed
     */
    function decodeAndLog(bytes calldata data) 
        external 
        returns (
            bytes32 commitHash, 
            string memory projectId, 
            bool passedTests
        ) 
    {
        (commitHash, projectId, passedTests) = abi.decode(data, (bytes32, string, bool));
        totalDecoded++;
        emit AttestationDecoded(commitHash, projectId, passedTests);
    }

    /**
     * @notice Validate attestation payload - checks if tests passed
     * @dev Useful if EAS calls a resolver at attestation time
     * @param data The raw attestation data bytes
     * @return True if tests passed
     */
    function validatePayload(bytes calldata data) external pure returns (bool) {
        (, , bool passed) = abi.decode(data, (bytes32, string, bool));
        return passed;
    }

    /**
     * @notice Encode data for creating an attestation
     * @param commitHash The git commit hash
     * @param projectId The project identifier string
     * @param passedTests Whether all tests passed
     * @return Encoded bytes for EAS attestation
     */
    function encode(
        bytes32 commitHash,
        string calldata projectId,
        bool passedTests
    ) external pure returns (bytes memory) {
        return abi.encode(commitHash, projectId, passedTests);
    }

    /**
     * @notice Check if data is valid (can be decoded without error)
     * @param data The raw attestation data bytes
     * @return True if data can be decoded successfully
     */
    function isValidData(bytes calldata data) external view returns (bool) {
        if (data.length < 96) return false; // Minimum length for encoded data
        
        try this.decodeExternal(data) returns (bytes32, string memory, bool) {
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @notice External decode helper for try/catch (internal use)
     */
    function decodeExternal(bytes calldata data) 
        external 
        pure 
        returns (bytes32, string memory, bool) 
    {
        return abi.decode(data, (bytes32, string, bool));
    }

    // ============ Admin Functions ============

    /**
     * @notice Update the trusted attester address
     * @param newAttester The new trusted attester address
     */
    function updateTrustedAttester(address newAttester) external onlyOwner {
        if (newAttester == address(0)) revert ResolverZeroAddress();
        address oldAttester = trustedAttester;
        trustedAttester = newAttester;
        emit TrustedAttesterUpdated(oldAttester, newAttester);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KiroResolver
 * @notice Decoder/resolver for the Kiro EAS schema:
 *         (bytes32 commitHash, string projectId, bool passedTests)
 *
 * This helper exposes a pure `decode` that the Gatekeeper can call to interpret
 * attestation `data`. Optionally the resolver can be registered with EAS as the
 * schema resolver to validate attestations at creation time.
 */

contract KiroResolver {
    address public immutable trustedAttester;

    constructor(address _trustedAttester) {
        require(_trustedAttester != address(0), "zero attester");
        trustedAttester = _trustedAttester;
    }

    /// @notice Decode attestation bytes into (commitHash, projectId, passedTests)
    function decode(bytes calldata data) external pure returns (bytes32 commitHash, string memory projectId, bool passedTests) {
        (commitHash, projectId, passedTests) = abi.decode(data, (bytes32, string, bool));
    }

    /// @notice Optional validator that checks `passedTests == true`.
    /// @dev Useful if EAS calls a resolver at attestation time.
    function validatePayload(bytes calldata data) external pure returns (bool) {
        (, , bool passed) = abi.decode(data, (bytes32, string, bool));
        return passed;
    }
}

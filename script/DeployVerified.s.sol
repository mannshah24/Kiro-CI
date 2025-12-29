// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import { IEAS, Attestation } from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";

/**
 * @title DeployVerified
 * @notice Deployment script that verifies EAS attestation before deploying contracts
 * @dev This demonstrates the "Trustless Deployment Pipeline" - contracts can only
 *      be deployed if they have a valid on-chain attestation proving CI tests passed
 * 
 * Usage:
 *   1. Set ATTESTATION_UID environment variable to your CI attestation UID
 *   2. Run: forge script script/DeployVerified.s.sol:DeployVerified --rpc-url $RPC_URL --broadcast
 * 
 * The script will:
 *   ✓ Fetch the attestation from EAS on Base Sepolia
 *   ✓ Verify it's valid (not revoked, not expired)
 *   ✓ Decode the CI data (commit hash, coverage, tests passed)
 *   ✓ Enforce quality thresholds (coverage >= 90%, no failing tests)
 *   ✓ Only deploy if all checks pass
 */
contract DeployVerified is Script {
    // Base Sepolia EAS Contract
    IEAS constant EAS = IEAS(0xC2679fBD37d54388Ce493F1DB75320D236e1815e);
    
    // Minimum coverage threshold (90%)
    uint8 constant MIN_COVERAGE = 90;
    
    // Maximum attestation age (1 hour)
    uint256 constant MAX_ATTESTATION_AGE = 1 hours;
    
    function run() external {
        console.log("\n========================================");
        console.log("   KIRO-CI VERIFIED DEPLOYMENT");
        console.log("========================================\n");
        
        // Step 1: Load attestation UID from environment
        bytes32 attestationUID = vm.envBytes32("ATTESTATION_UID");
        console.log("Attestation UID:", vm.toString(attestationUID));
        
        // Step 2: Fetch attestation from EAS
        console.log("\n[1/5] Fetching attestation from EAS...");
        Attestation memory attestation = EAS.getAttestation(attestationUID);
        
        // Step 3: Verify attestation exists and is valid
        console.log("[2/5] Verifying attestation validity...");
        require(attestation.uid == attestationUID, "Attestation not found");
        require(attestation.revocationTime == 0, "Attestation has been revoked");
        require(attestation.expirationTime == 0 || attestation.expirationTime > block.timestamp, 
                "Attestation has expired");
        
        // Step 4: Check attestation freshness
        console.log("[3/5] Checking attestation freshness...");
        uint256 attestationAge = block.timestamp - attestation.time;
        require(attestationAge < MAX_ATTESTATION_AGE, 
                string.concat("Attestation too old: ", vm.toString(attestationAge), " seconds"));
        console.log("   Age:", attestationAge, "seconds");
        console.log("   Max age:", MAX_ATTESTATION_AGE, "seconds");
        
        // Step 5: Decode and verify CI data
        console.log("[4/5] Decoding CI attestation data...");
        (
            bytes32 commitHash,
            uint256 timestamp,
            uint16 testsPassed,
            uint16 testsFailed,
            uint8 coverage,
            string memory repoUrl
        ) = abi.decode(attestation.data, (bytes32, uint256, uint16, uint16, uint8, string));
        
        console.log("\n--- CI ATTESTATION DATA ---");
        console.log("Commit Hash:", vm.toString(commitHash));
        console.log("Timestamp:", timestamp);
        console.log("Tests Passed:", testsPassed);
        console.log("Tests Failed:", testsFailed);
        console.log("Coverage:");
        console.log(coverage);
        console.log("Repository:", repoUrl);
        console.log("---------------------------\n");
        
        // Step 6: Enforce quality thresholds
        console.log("[5/5] Enforcing quality thresholds...");
        require(coverage >= MIN_COVERAGE, 
                string.concat("Coverage too low: ", vm.toString(coverage), "% (min: ", vm.toString(MIN_COVERAGE), "%)"));
        require(testsFailed == 0, 
                string.concat("Tests failed: ", vm.toString(testsFailed), " (must be 0)"));
        require(testsPassed > 0, "No tests were run");
        
        console.log("   Coverage:", coverage, "%");
        console.log("   Required minimum:", MIN_COVERAGE, "%");
        console.log("   Tests Failed: 0");
        console.log("   Tests Passed:", testsPassed);
        
        console.log("\n\x1b[32m========================================");
        console.log("  \u2713 ATTESTATION VERIFIED - DEPLOYING");
        console.log("========================================\x1b[0m\n");
        
        // Step 7: Deploy your contracts
        vm.startBroadcast();
        
        // ============================================================
        // INSERT YOUR CONTRACT DEPLOYMENT HERE
        // ============================================================
        // Example:
        // MyContract myContract = new MyContract(arg1, arg2);
        // console.log("Contract deployed at:", address(myContract));
        
        console.log("[DEMO] Simulating contract deployment...");
        console.log("         (Insert your deployment code above)");
        
        vm.stopBroadcast();
        
        console.log("\n\x1b[32m========================================");
        console.log("  \u2713 DEPLOYMENT COMPLETE");
        console.log("========================================\x1b[0m\n");
    }
}

/**
 * @title DeployWithoutVerification (Anti-Pattern Example)
 * @notice This contract demonstrates what NOT to do - deploying without attestation
 * @dev This will be blocked by the Kiro-CI hook if configured properly
 */
contract DeployWithoutVerification is Script {
    function run() external {
        console.log("\n\x1b[31m========================================");
        console.log("  WARNING: UNVERIFIED DEPLOYMENT");
        console.log("========================================\x1b[0m\n");
        
        console.log("\x1b[31mThis deployment bypasses attestation verification!");
        console.log("In a production Kiro-CI setup, this should be blocked.\x1b[0m\n");
        
        vm.startBroadcast();
        
        // Dangerous: deploying without proof of tests passing
        // MyContract myContract = new MyContract();
        
        vm.stopBroadcast();
    }
}

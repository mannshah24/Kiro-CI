// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/KiroResolver.sol";
import "../contracts/KiroGatekeeper.sol";

/**
 * @title DeployGatekeeper
 * @author Kiro-CI Team
 * @notice Deployment script for KiroResolver and KiroGatekeeper contracts
 * @dev Deployment Steps:
 *      1. Validates all environment variables
 *      2. Deploys KiroResolver
 *      3. Deploys KiroGatekeeper with resolver
 *      4. Verifies contracts on Basescan (if API key provided)
 *      5. Saves deployment addresses
 * 
 * Usage:
 *   source .env
 *   forge script script/DeployGatekeeper.s.sol:DeployGatekeeper \
 *     --rpc-url $RPC_URL \
 *     --broadcast \
 *     --verify \
 *     -vvvv
 */
contract DeployGatekeeper is Script {
    // Base Sepolia EAS Contract (official deployment)
    address constant EAS_BASE_SEPOLIA = 0x4200000000000000000000000000000000000021;
    
    // Deployment addresses (will be set during deployment)
    address public deployedResolver;
    address public deployedGatekeeper;

    function run() external {
        console.log("\n");
        console.log("========================================");
        console.log("   KIRO-CI CONTRACT DEPLOYMENT");
        console.log("   Network: Base Sepolia");
        console.log("========================================\n");

        // Step 1: Load and validate environment variables
        console.log("[1/6] Loading environment variables...");
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        console.log("   Deployer:", deployer);
        
        address kiroAgent = vm.envOr("KIRO_AGENT", deployer);
        console.log("   Kiro Agent (Attester):", kiroAgent);
        
        bytes32 schemaId = vm.envOr("SCHEMA_UID", bytes32(0));
        if (schemaId == bytes32(0)) {
            console.log("   WARNING: SCHEMA_UID not set, using placeholder");
            schemaId = keccak256("kiro-ci-placeholder-schema");
        }
        console.log("   Schema ID:", vm.toString(schemaId));
        
        address easRegistry = vm.envOr("EAS_CONTRACT", EAS_BASE_SEPOLIA);
        console.log("   EAS Registry:", easRegistry);

        // Step 2: Check deployer balance
        console.log("\n[2/6] Checking deployer balance...");
        uint256 balance = deployer.balance;
        console.log("   Balance:", balance / 1e18, "ETH");
        
        require(balance > 0.001 ether, "Insufficient balance for deployment. Get testnet ETH from faucet.");

        // Step 3: Estimate gas
        console.log("\n[3/6] Estimating deployment gas...");
        uint256 gasPrice = tx.gasprice > 0 ? tx.gasprice : 1 gwei;
        uint256 estimatedGas = 2_000_000; // Conservative estimate
        uint256 estimatedCost = estimatedGas * gasPrice;
        console.log("   Estimated gas:", estimatedGas);
        console.log("   Estimated cost:", estimatedCost / 1e18, "ETH");
        
        require(balance > estimatedCost, "Balance may be insufficient for gas");

        // Step 4: Start deployment
        console.log("\n[4/6] Starting deployment...\n");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy KiroResolver
        console.log("   Deploying KiroResolver...");
        KiroResolver resolver = new KiroResolver(kiroAgent, deployer);
        deployedResolver = address(resolver);
        console.log("   KiroResolver deployed at:", deployedResolver);

        // Deploy KiroGatekeeper
        console.log("\n   Deploying KiroGatekeeper...");
        KiroGatekeeper gatekeeper = new KiroGatekeeper(
            easRegistry,
            kiroAgent,
            schemaId,
            deployedResolver,
            deployer
        );
        deployedGatekeeper = address(gatekeeper);
        console.log("   KiroGatekeeper deployed at:", deployedGatekeeper);

        vm.stopBroadcast();

        // Step 5: Verify deployments
        console.log("\n[5/6] Verifying deployments...");
        
        // Verify resolver
        require(resolver.trustedAttester() == kiroAgent, "Resolver: trustedAttester mismatch");
        require(resolver.owner() == deployer, "Resolver: owner mismatch");
        console.log("   KiroResolver verified");
        
        // Verify gatekeeper
        require(address(gatekeeper.eas()) == easRegistry, "Gatekeeper: EAS mismatch");
        require(gatekeeper.trustedAttester() == kiroAgent, "Gatekeeper: trustedAttester mismatch");
        require(gatekeeper.trustedSchema() == schemaId, "Gatekeeper: schema mismatch");
        require(address(gatekeeper.resolver()) == deployedResolver, "Gatekeeper: resolver mismatch");
        require(gatekeeper.owner() == deployer, "Gatekeeper: owner mismatch");
        console.log("   KiroGatekeeper verified");

        // Step 6: Output summary
        console.log("\n[6/6] Deployment Complete!\n");
        console.log("========================================");
        console.log("   DEPLOYMENT SUMMARY");
        console.log("========================================");
        console.log("   Network:          Base Sepolia");
        console.log("   Deployer:        ", deployer);
        console.log("   KiroResolver:    ", deployedResolver);
        console.log("   KiroGatekeeper:  ", deployedGatekeeper);
        console.log("   EAS Registry:    ", easRegistry);
        console.log("   Trusted Attester:", kiroAgent);
        console.log("========================================\n");
        
        console.log("Next Steps:");
        console.log("1. Update .env with deployed addresses");
        console.log("2. Register schema at https://base-sepolia.easscan.org/schema/create");
        console.log("3. Update SCHEMA_UID in .env with your registered schema");
        console.log("4. Verify contracts on Basescan:");
        console.log("   forge verify-contract", deployedResolver, "contracts/KiroResolver.sol:KiroResolver --chain base-sepolia");
        console.log("   forge verify-contract", deployedGatekeeper, "contracts/KiroGatekeeper.sol:KiroGatekeeper --chain base-sepolia\n");
    }
}

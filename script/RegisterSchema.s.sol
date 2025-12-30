// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

/**
 * @title RegisterSchema
 * @author Kiro-CI Team
 * @notice Helper script to register the Kiro-CI schema on EAS
 * @dev The schema format is: bytes32 commitHash, string projectId, bool passedTests
 * 
 * IMPORTANT: This script outputs the schema string and instructions.
 * You should register the schema manually at https://base-sepolia.easscan.org/schema/create
 * because schema registration requires a web3 wallet signature.
 * 
 * Usage:
 *   forge script script/RegisterSchema.s.sol:RegisterSchema -vvvv
 */

interface ISchemaRegistry {
    function register(
        string calldata schema,
        address resolver,
        bool revocable
    ) external returns (bytes32);
}

contract RegisterSchema is Script {
    // Base Sepolia Schema Registry (official deployment)
    address constant SCHEMA_REGISTRY = 0x4200000000000000000000000000000000000020;

    // Our schema definition
    string constant KIRO_SCHEMA = "bytes32 commitHash, string projectId, bool passedTests";

    function run() external view {
        console.log("\n");
        console.log("========================================");
        console.log("   KIRO-CI SCHEMA REGISTRATION");
        console.log("========================================\n");

        console.log("Schema Registry Address:", SCHEMA_REGISTRY);
        console.log("\n");
        
        console.log("Your Schema Definition:");
        console.log("------------------------");
        console.log(KIRO_SCHEMA);
        console.log("\n");

        console.log("Schema Components:");
        console.log("  - bytes32 commitHash  : Git commit hash (keccak256 of commit SHA)");
        console.log("  - string projectId    : Project identifier");
        console.log("  - bool passedTests    : Whether all tests passed");
        console.log("\n");

        // Calculate expected schema UID (for reference)
        bytes32 expectedUID = keccak256(
            abi.encodePacked(
                KIRO_SCHEMA,
                address(0), // No resolver
                true        // Revocable
            )
        );
        
        console.log("Expected Schema UID (approximate):", vm.toString(expectedUID));
        console.log("\n");
        
        console.log("========================================");
        console.log("   REGISTRATION INSTRUCTIONS");
        console.log("========================================\n");
        
        console.log("1. Go to: https://base-sepolia.easscan.org/schema/create\n");
        
        console.log("2. Connect your wallet (the Kiro Agent wallet)\n");
        
        console.log("3. Fill in the form:");
        console.log("   - Schema: bytes32 commitHash, string projectId, bool passedTests");
        console.log("   - Resolver: 0x0000000000000000000000000000000000000000 (none)");
        console.log("   - Revocable: Yes (recommended for flexibility)\n");
        
        console.log("4. Click 'Register Schema' and sign the transaction\n");
        
        console.log("5. Copy the Schema UID from the confirmation\n");
        
        console.log("6. Update your .env file:");
        console.log("   SCHEMA_UID=0x<your_schema_uid>\n");
        
        console.log("7. Update .kiro/config.json with the same Schema UID\n");
        
        console.log("========================================\n");
        
        console.log("Alternative: Register via Script (requires broadcast)");
        console.log("---------------------------------------------------");
        console.log("If you prefer to register programmatically, run:");
        console.log("  forge script script/RegisterSchema.s.sol:RegisterSchemaOnChain \\");
        console.log("    --rpc-url $RPC_URL \\");
        console.log("    --broadcast \\");
        console.log("    -vvvv\n");
    }
}

/**
 * @title RegisterSchemaOnChain
 * @notice Actually registers the schema on-chain (requires private key)
 */
contract RegisterSchemaOnChain is Script {
    address constant SCHEMA_REGISTRY = 0x4200000000000000000000000000000000000020;
    string constant KIRO_SCHEMA = "bytes32 commitHash, string projectId, bool passedTests";

    function run() external {
        console.log("\n========================================");
        console.log("   REGISTERING SCHEMA ON-CHAIN");
        console.log("========================================\n");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployer:", deployer);
        console.log("Schema:", KIRO_SCHEMA);
        console.log("\n");

        vm.startBroadcast(deployerPrivateKey);

        ISchemaRegistry registry = ISchemaRegistry(SCHEMA_REGISTRY);
        
        bytes32 schemaUID = registry.register(
            KIRO_SCHEMA,
            address(0), // No resolver
            true        // Revocable
        );

        vm.stopBroadcast();

        console.log("========================================");
        console.log("   SCHEMA REGISTERED SUCCESSFULLY!");
        console.log("========================================");
        console.log("Schema UID:", vm.toString(schemaUID));
        console.log("\n");
        console.log("Next steps:");
        console.log("1. Copy this Schema UID to your .env file:");
        console.log("   SCHEMA_UID=", vm.toString(schemaUID));
        console.log("\n");
        console.log("2. View your schema at:");
        console.log("   https://base-sepolia.easscan.org/schema/view/", vm.toString(schemaUID));
        console.log("========================================\n");
    }
}

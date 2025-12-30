// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/KiroResolver.sol";
import "../contracts/KiroGatekeeper.sol";

contract DeployGatekeeper is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);

        address easRegistry = vm.envAddress("EAS_REGISTRY");
        address kiroAgent = vm.envAddress("KIRO_AGENT");
        bytes32 schemaId = vm.envBytes32("KIRO_SCHEMA_ID");

        // Deploy resolver (to decode attestation payloads)
        KiroResolver resolver = new KiroResolver(kiroAgent);
        console.log("KiroResolver deployed at:", address(resolver));

        // Deploy gatekeeper
        KiroGatekeeper gatekeeper = new KiroGatekeeper(easRegistry, kiroAgent, schemaId, address(resolver));
        console.log("KiroGatekeeper deployed at:", address(gatekeeper));

        vm.stopBroadcast();
    }
}

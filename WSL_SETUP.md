# Kiro-CI Setup Guide for WSL

## Step 1: Install Foundry in WSL

```bash
# Install Foundry (Forge, Cast, Anvil)
curl -L https://foundry.paradigm.xyz | bash

# Reload your shell
source ~/.bashrc  # or source ~/.zshrc if using zsh

# Install Foundry binaries
foundryup

# Verify installation
forge --version
cast --version
```

## Step 2: Initialize Foundry Project

```bash
# Navigate to project directory (adjust path for WSL)
cd "/mnt/c/Users/Dhruv Patel/OneDrive/Desktop/New folder"

# Initialize git if not already done
git init

# Install Foundry dependencies
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install ethereum-attestation-service/eas-contracts --no-commit

# Build contracts (will create out/ directory)
forge build
```

## Step 3: Setup Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env file (use nano or vim)
nano .env

# Add your values:
# PRIVATE_KEY=0xyour_private_key_here
# RPC_URL=https://sepolia.base.org
# EAS_CONTRACT=0xC2679fBD37d54388Ce493F1DB75320D236e1815e
# SCHEMA_UID=0x... (get from EASScan after registering schema)
```

## Step 4: Get Base Sepolia Test ETH

```bash
# Your wallet address
cast wallet address $PRIVATE_KEY

# Visit faucet (copy this URL to browser):
# https://faucet.quicknode.com/base/sepolia
```

## Step 5: Create and Test Demo Contracts

```bash
# Create a vulnerable treasury contract for demo
cat > contracts/Treasury.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Treasury {
    mapping(address => uint256) public balances;
    
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }
    
    // VULNERABLE: No reentrancy protection
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount;
    }
}
EOF

# Create test file
cat > test/Treasury.t.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../contracts/Treasury.sol";

contract TreasuryTest is Test {
    Treasury public treasury;
    
    function setUp() public {
        treasury = new Treasury();
    }
    
    function testDeposit() public {
        treasury.deposit{value: 1 ether}();
        assertEq(treasury.balances(address(this)), 1 ether);
    }
    
    function testWithdraw() public {
        treasury.deposit{value: 2 ether}();
        treasury.withdraw(1 ether);
        assertEq(treasury.balances(address(this)), 1 ether);
    }
}
EOF

# Run tests
forge test
forge test -vvv  # Verbose output
```

## Step 6: Register EAS Schema (One-time setup)

```bash
# Install Cast for blockchain interactions
# (already installed with Foundry)

# Get your wallet address
cast wallet address --private-key $PRIVATE_KEY

# Visit EAS Schema Registry UI:
echo "Go to: https://base-sepolia.easscan.org/schema/create"
echo ""
echo "Schema String:"
echo "bytes32 commitHash,uint256 timestamp,uint16 testsPassed,uint16 testsFailed,uint8 coverage,string repoUrl"
echo ""
echo "Resolver: 0x0000000000000000000000000000000000000000"
echo "Revocable: false"

# After registering, copy the Schema UID and add to .env
```

## Step 7: Test Attestation Minting (Optional)

```bash
# Create a simple attestation test script
cat > script/TestAttestation.s.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";

contract TestAttestation is Script {
    function run() external {
        console.log("Testing EAS connection...");
        console.log("Network:", block.chainid);
        console.log("Deployer:", msg.sender);
    }
}
EOF

# Run script
forge script script/TestAttestation.s.sol --rpc-url $RPC_URL
```

## Step 8: Deploy Verified Contract

```bash
# Set attestation UID in environment (from Kiro-CI hook output)
export ATTESTATION_UID=0x...

# Dry run (simulate deployment)
forge script script/DeployVerified.s.sol:DeployVerified \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Actual deployment
forge script script/DeployVerified.s.sol:DeployVerified \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

## Step 9: Useful Forge Commands

```bash
# Build contracts
forge build

# Run all tests
forge test

# Run specific test
forge test --match-test testDeposit

# Run tests with gas report
forge test --gas-report

# Get coverage
forge coverage

# Format Solidity files
forge fmt

# Clean build artifacts
forge clean

# Check contract size
forge build --sizes

# Verify contract on Etherscan
forge verify-contract <CONTRACT_ADDRESS> \
  contracts/YourContract.sol:YourContract \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY
```

## Step 10: Useful Cast Commands

```bash
# Get balance
cast balance <ADDRESS> --rpc-url $RPC_URL

# Get block number
cast block-number --rpc-url $RPC_URL

# Get transaction receipt
cast receipt <TX_HASH> --rpc-url $RPC_URL

# Call contract (read)
cast call <CONTRACT_ADDRESS> "balanceOf(address)" <YOUR_ADDRESS> --rpc-url $RPC_URL

# Send transaction (write)
cast send <CONTRACT_ADDRESS> \
  "transfer(address,uint256)" <TO_ADDRESS> 1000000000000000000 \
  --private-key $PRIVATE_KEY \
  --rpc-url $RPC_URL

# Get gas price
cast gas-price --rpc-url $RPC_URL

# Convert units
cast to-wei 1 ether
cast from-wei 1000000000000000000

# Generate wallet
cast wallet new

# Get wallet address from private key
cast wallet address --private-key $PRIVATE_KEY

# Sign message
cast wallet sign "Hello World" --private-key $PRIVATE_KEY
```

## Step 11: EAS-Specific Commands

```bash
# Get attestation (using cast)
cast call 0xC2679fBD37d54388Ce493F1DB75320D236e1815e \
  "getAttestation(bytes32)" <ATTESTATION_UID> \
  --rpc-url $RPC_URL

# Check if attestation is valid
cast call 0xC2679fBD37d54388Ce493F1DB75320D236e1815e \
  "isAttestationValid(bytes32)" <ATTESTATION_UID> \
  --rpc-url $RPC_URL
```

## Step 12: Install Node Dependencies (for Kiro Hook)

```bash
# Install npm packages
npm install

# Or if you prefer yarn
yarn install

# Install ts-node for TypeScript execution
npm install -g ts-node

# Test the hook manually
npm run agent
```

## Troubleshooting

### If forge is not found after installation:
```bash
source ~/.bashrc
# or
source ~/.zshrc
# or restart terminal
```

### If you get permission errors:
```bash
chmod +x ~/.foundry/bin/*
```

### If builds fail due to missing dependencies:
```bash
forge install foundry-rs/forge-std --no-commit --force
forge install OpenZeppelin/openzeppelin-contracts@v4.9.0 --no-commit --force
```

### If you need to update Foundry:
```bash
foundryup
```

### Check Foundry config:
```bash
cat foundry.toml
```

## Quick Reference Card

```bash
# Development Cycle
forge build              # Compile contracts
forge test              # Run tests
forge test -vvv         # Verbose tests
forge coverage          # Coverage report
forge fmt               # Format code

# Deployment
forge script script/DeployVerified.s.sol --broadcast

# Blockchain Interaction
cast call <addr> "func()"           # Read
cast send <addr> "func()" --private-key $PK  # Write
cast balance <addr>                 # Get balance
cast block-number                   # Current block

# Wallet Management
cast wallet new                     # Generate wallet
cast wallet address --private-key $PK  # Get address

# Utilities
cast to-wei 1 ether                # Unit conversion
cast from-wei 1000000000000000000  # Unit conversion
cast keccak "string"               # Hash string
```

## Next Steps

1. Install Foundry in WSL ✅
2. Install dependencies ✅
3. Create demo contracts ✅
4. Run tests ✅
5. Register EAS schema ✅
6. Test the Kiro hook ✅
7. Record demo video 🎥
8. Submit to hackathon 🏆

Good luck! 🚀

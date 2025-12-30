# 🏠 Deploy and Test Locally (No Testnet ETH Required)

If you can't access faucets, you can run everything locally for free!

## 🚀 Option 1: Use Anvil Local Testnet (Recommended)

Anvil gives you a local blockchain with pre-funded accounts - **no real or testnet ETH needed**!

### Step 1: Start Local Blockchain

```bash
# In WSL terminal
cd "/mnt/c/Users/Dhruv Patel/OneDrive/Desktop/New folder"

# Start Anvil (local blockchain)
anvil
```

This will output:
- 10 pre-funded accounts with 10,000 ETH each
- Private keys for each account
- Local RPC: http://127.0.0.1:8545

### Step 2: Use Anvil Account

Copy one of the private keys from Anvil output, then:

```bash
# In another WSL terminal
cd "/mnt/c/Users/Dhruv Patel/OneDrive/Desktop/New folder"

# Deploy to local network
forge script script/DeployGatekeeper.s.sol:DeployGatekeeper \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast \
  -vvvv
```

### Step 3: Test Everything

```bash
# Run all tests
forge test -vvv

# Test with forked Base Sepolia (simulates real network)
forge test --fork-url https://sepolia.base.org -vvv
```

---

## 🔄 Option 2: Fork Base Sepolia Locally

Test against real Base Sepolia data without spending ETH:

```bash
# In WSL
cd "/mnt/c/Users/Dhruv Patel/OneDrive/Desktop/New folder"

# Start forked network (uses real Base Sepolia state)
anvil --fork-url https://sepolia.base.org

# In another terminal, deploy to fork
forge script script/DeployGatekeeper.s.sol:DeployGatekeeper \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast \
  -vvvv
```

This simulates deploying to real Base Sepolia but uses local test ETH!

---

## 🎮 Option 3: Use Hardhat Network (Alternative)

If you prefer Hardhat:

```bash
# In CMD
cd "c:\Users\Dhruv Patel\OneDrive\Desktop\New folder"
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Start Hardhat network
npx hardhat node
```

---

## 🧪 Option 4: Just Run Tests (No Deployment Needed)

You can develop and test everything without deploying:

```bash
# In WSL
cd "/mnt/c/Users/Dhruv Patel/OneDrive/Desktop/New folder"

# Run all tests
forge test -vvv

# Run specific test
forge test --match-contract KiroGatekeeperTest -vvvv

# Check coverage
forge coverage

# Run gas benchmarks
forge test --gas-report
```

All tests pass without any ETH!

---

## 📊 Option 5: Run Demo (No Deployment)

```bash
# In CMD
cd "c:\Users\Dhruv Patel\OneDrive\Desktop\New folder"
node demo.js
```

This shows the full workflow simulation without blockchain deployment.

---

## 🌐 When You're Ready for Real Testnet

Later, when you get testnet ETH (which is FREE from faucets), deploy to real Base Sepolia:

```bash
# In WSL
source .env  # Make sure your .env has real values

forge script script/DeployGatekeeper.s.sol:DeployGatekeeper \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

---

## 💡 Summary

You can do **95% of development locally** without any ETH:

✅ Write contracts  
✅ Run all tests (53 tests pass!)  
✅ Test deployments locally  
✅ Simulate mainnet conditions with forks  
✅ Run demo  
✅ Develop frontend  

❌ Only need testnet ETH for: actual Base Sepolia deployment

---

## 🎯 Recommended Workflow

1. **Develop locally** (use Anvil - no ETH needed)
2. **Test thoroughly** (forge test - no ETH needed)
3. **Deploy to local fork** (test with real data - no ETH needed)
4. **Get FREE testnet ETH** (any faucet - takes 2 minutes)
5. **Deploy to real Base Sepolia**

---

## 🆘 Quick Commands Summary

```bash
# Terminal 1: Start local blockchain
anvil

# Terminal 2: Deploy locally
forge script script/DeployGatekeeper.s.sol:DeployGatekeeper \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast

# Run tests (no network needed)
forge test -vvv

# Demo (no network needed)
node demo.js
```

**You can start developing RIGHT NOW with zero ETH!** 🚀

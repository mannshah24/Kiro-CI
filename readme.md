# 🔐 Kiro-CI: Trustless Deployment Pipeline

> **Local-First CI with AI-Powered Auto-Fix and On-Chain Attestations**

Kiro-CI is a revolutionary smart contract deployment pipeline that ensures code quality through AI-powered auto-fixing and cryptographic attestations on Base Sepolia.

## 🌟 Features

- **🤖 AI Auto-Fix**: Automatically detects and fixes common vulnerabilities (reentrancy, overflow, access control)
- **🔐 On-Chain Attestations**: Every successful CI run creates an EAS attestation on Base Sepolia
- **🚀 Secure Deployment**: Contracts can only be deployed with valid attestations
- **📊 Live Dashboard**: Real-time monitoring of attestations and deployments

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Git Commit    │────▶│   Kiro Agent    │────▶│  EAS Attestation│
│   (Pre-hook)    │     │   (AI Auto-Fix) │     │  (Base Sepolia) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Deployed       │◀────│  KiroGatekeeper │◀────│  Verified Code  │
│  Contract       │     │  (CREATE2)      │     │  + Attestation  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Foundry](https://book.getfoundry.sh/) (for smart contract development)
- WSL (Windows Subsystem for Linux) - for Windows users

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# In CMD (Windows)
npm install

# In WSL (for Foundry)
cd "/mnt/c/Users/Dhruv Patel/OneDrive/Desktop/New folder"
foundryup
forge install
```

### 2. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
# - PRIVATE_KEY: Your wallet private key
# - KIRO_AGENT: Your wallet address
# - RPC_URL: Base Sepolia RPC
```

### 3. Get Testnet ETH (FREE)

You need Base Sepolia testnet ETH to deploy contracts. Choose any faucet below:

**🚰 Multiple FREE Faucet Options:**

1. **QuickNode** (No account needed): https://faucet.quicknode.com/base/sepolia
   - Amount: 0.05 ETH per request
   
2. **Alchemy** (Recommended - Free account): https://www.alchemy.com/faucets/base-sepolia
   - Amount: 0.1 ETH per day
   - Requires: Free Alchemy account
   
3. **Base Official**: https://portal.cdp.coinbase.com/products/faucet
   - Amount: 0.1 ETH per day
   - Requires: Coinbase account
   
4. **LearnWeb3**: https://learnweb3.io/faucets/base_sepolia
   - Amount: 0.05 ETH
   - Requires: Free account

5. **Bridge from Ethereum Sepolia** (Alternative):
   - Get ETH Sepolia from: https://sepoliafaucet.com/
   - Bridge to Base Sepolia: https://bridge.base.org/

**Verify your balance:**
```bash
# In WSL
cast balance YOUR_ADDRESS --rpc-url https://sepolia.base.org
```

### 4. Register EAS Schema

```bash
# View schema registration instructions
forge script script/RegisterSchema.s.sol:RegisterSchema -vvvv

# Or register via web UI at:
# https://base-sepolia.easscan.org/schema/create
# Schema: bytes32 commitHash, string projectId, bool passedTests
```

### 5. Deploy Contracts

```bash
# In WSL
source .env
forge script script/DeployGatekeeper.s.sol:DeployGatekeeper \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

### 6. Run Demo

```bash
# In CMD
npm install
node demo.js
```

## 📁 Project Structure

```
├── contracts/
│   ├── KiroGatekeeper.sol    # Main deployment gatekeeper
│   └── KiroResolver.sol      # Attestation data decoder
├── script/
│   ├── DeployGatekeeper.s.sol # Deployment script
│   └── RegisterSchema.s.sol   # Schema registration helper
├── test/
│   ├── KiroGatekeeper.t.sol  # Gatekeeper tests
│   └── KiroResolver.t.sol    # Resolver tests
├── web/                      # Frontend dashboard
├── .kiro/                    # CI configuration
└── demo.js                   # Demo runner
```

## 🔧 Contracts

### KiroGatekeeper

The main contract that gates deployments based on EAS attestations:

- **deploySecurely**: Deploy bytecode only with valid attestation
- **computeAddress**: Predict CREATE2 deployment address
- **Admin functions**: Update attester, schema, resolver; pause/unpause

### KiroResolver

Decodes and validates attestation data:

- **decode**: Extract commitHash, projectId, passedTests from attestation
- **encode**: Create attestation data for EAS
- **validatePayload**: Check if tests passed

## 🧪 Testing

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-contract KiroGatekeeperTest

# Generate coverage
forge coverage
```

## 🌐 Base Sepolia Addresses

| Contract | Address |
|----------|---------|
| EAS | `0x4200000000000000000000000000000000000021` |
| Schema Registry | `0x4200000000000000000000000000000000000020` |
| Your KiroResolver | *Deploy and update .env* |
| Your KiroGatekeeper | *Deploy and update .env* |

## 📖 Resources

- [EAS Documentation](https://docs.attest.sh/)
- [Base Sepolia EASScan](https://base-sepolia.easscan.org/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Base Sepolia Faucet](https://faucet.quicknode.com/base/sepolia)

## 🔐 Security

- Never commit private keys to version control
- Use separate wallets for testnet and mainnet
- Audit contracts before mainnet deployment
- Consider timelocks for admin functions in production

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ by the Kiro-CI Team**









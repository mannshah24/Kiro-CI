# 🔐 Kiro-CI: AI-Powered Trustless Deployment Pipeline

[![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=Ethereum&logoColor=white)](https://ethereum.org/)
[![Solidity](https://img.shields.io/badge/Solidity-e6e6e6?style=for-the-badge&logo=solidity&logoColor=black)](https://soliditylang.org/)
[![Base](https://img.shields.io/badge/Base-0052FF?style=for-the-badge&logo=coinbase&logoColor=white)](https://base.org/)
[![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> **🏆 Built for Hackxios 2K25 - ETHIndia Track**
> 
> **Revolutionizing Smart Contract Deployments with AI Auto-Fix & On-Chain Attestations**

## 🎯 Problem Statement

Traditional CI/CD pipelines for smart contracts suffer from:
- ❌ Manual security reviews that miss vulnerabilities
- ❌ No cryptographic proof of code quality
- ❌ Centralized trust in deployment gatekeepers
- ❌ Expensive audits for every deployment

## 💡 Solution

**Kiro-CI** is an AI-powered, trustless deployment pipeline that:
- ✅ Automatically detects and fixes vulnerabilities using AI
- ✅ Creates immutable on-chain attestations via Ethereum Attestation Service (EAS)
- ✅ Enables verifiable, permissionless smart contract deployments
- ✅ Provides real-time dashboard for attestation monitoring

## 🌟 Key Features

### 🤖 AI-Powered Auto-Fix
- Detects common vulnerabilities (reentrancy, overflow, access control issues)
- Automatically generates secure code fixes
- Validates fixes against best practices

### 🔐 On-Chain Attestations
- Every successful CI run creates an EAS attestation on Base Sepolia
- Stores commit hash, project ID, and test results on-chain
- Immutable proof of code quality

### 🚀 Trustless Deployment
- Smart contracts can only be deployed with valid attestations
- Uses CREATE2 for deterministic addresses
- No centralized gatekeepers required

### 📊 Live Dashboard
- Real-time monitoring of attestations
- GraphQL integration with EAS
- Beautiful Next.js frontend

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

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity 0.8.20**: Core contract language
- **Foundry**: Development framework
- **OpenZeppelin**: Security patterns (Ownable, Pausable, ReentrancyGuard)
- **EAS (Ethereum Attestation Service)**: On-chain attestations

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Styling
- **GraphQL**: EAS data querying

### Blockchain
- **Base Sepolia**: Testnet deployment
- **EAS Contract**: `0x4200000000000000000000000000000000000021`
- **Schema Registry**: `0x4200000000000000000000000000000000000020`

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- Foundry (for smart contracts)
- MetaMask or any Web3 wallet

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd kiro-ci

# Install dependencies
npm install

# Install Foundry dependencies (in WSL or Linux)
forge install
```

### Environment Setup


```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values:
# PRIVATE_KEY=your_wallet_private_key
# KIRO_AGENT=your_wallet_address
# RPC_URL=https://sepolia.base.org
# EAS_CONTRACT=0x4200000000000000000000000000000000000021
# SCHEMA_UID=<your_registered_schema_uid>
```

### Build & Test

```bash
# Compile contracts
forge build

# Run tests (53 tests)
forge test -vv

# Check coverage
forge coverage
```

### Deploy to Base Sepolia

```bash
# Deploy smart contracts
forge script script/DeployGatekeeper.s.sol:DeployGatekeeper \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

### Run Frontend

```bash
cd web
npm install
npm run dev

# Open http://localhost:3000
```

## 📁 Project Structure

```
kiro-ci/
├── contracts/              # Smart contracts
│   ├── KiroGatekeeper.sol # Main deployment gatekeeper
│   └── KiroResolver.sol   # Attestation data decoder
├── script/                # Deployment scripts
│   ├── DeployGatekeeper.s.sol
│   └── RegisterSchema.s.sol
├── test/                  # Contract tests (53 tests)
│   ├── KiroGatekeeper.t.sol
│   └── KiroResolver.t.sol
├── web/                   # Next.js frontend
│   ├── app/              # App Router
│   ├── components/       # React components
│   └── public/          # Static assets
├── .kiro/                # CI configuration
│   └── config.json      # Agent settings
└── demo.js              # Demo script
```

## 🔧 Smart Contracts

### KiroGatekeeper

Main contract that validates attestations and deploys contracts using CREATE2.

**Key Functions:**
- `deploySecurely(bytes32 attestationUID, bytes32 salt, bytes memory bytecode)`: Deploy with attestation
- `computeAddress(bytes32 attestationUID, bytes32 salt, bytes memory bytecode)`: Predict address
- `pause()` / `unpause()`: Emergency controls
- `updateAttester(address newAttester)`: Change trusted attester
- `updateSchemaUID(bytes32 newSchemaUID)`: Update EAS schema

**Security Features:**
- OpenZeppelin Ownable, Pausable, ReentrancyGuard
- Attestation validation (revoked, expired, attester)
- Custom errors for gas optimization
- Event logging for transparency

### KiroResolver

Utility contract for EAS attestation data encoding/decoding.

**Key Functions:**
- `decode(bytes memory data)`: Extract commitHash, projectId, passedTests
- `encode(bytes32 commitHash, string memory projectId, bool passedTests)`: Create attestation data
- `validatePayload(bytes memory data)`: Check data validity

### Test Coverage

✅ **53 Tests Passing** (100% success rate)

**KiroGatekeeper Tests (31):**
- Constructor validation
- Deployment with valid/invalid attestations
- Revoked/expired attestation handling
- Admin functions (pause, update)
- Fuzz testing for security

**KiroResolver Tests (22):**
- Encode/decode roundtrip
- Validation logic
- Edge cases and fuzz tests

## 🎨 Frontend Dashboard

**Features:**
- Real-time attestation monitoring
- GraphQL integration with EAS
- Network status indicator
- Responsive design with TailwindCSS

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- EAS GraphQL API

## 📊 Demo

Run the full demo to see Kiro-CI in action:

```bash
node demo.js
```

**Demo Flow:**
1. Connects to Base Sepolia
2. Checks EAS integration
3. Validates sample attestation
4. Computes deployment address
5. Shows successful deployment simulation

## 🔗 Important Links

### Deployed Contracts
- **KiroGatekeeper**: `[To be deployed]`
- **KiroResolver**: `[To be deployed]`
- **EAS Schema**: `[To be registered]`

### Base Sepolia Resources
- **Explorer**: https://sepolia.basescan.org/
- **EAS Explorer**: https://base-sepolia.easscan.org/
- **Faucet**: https://faucet.quicknode.com/base/sepolia
- **Bridge**: https://bridge.base.org/

## 🧪 Testing

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vv

# Run specific test
forge test --match-test testDeploySuccessfully

# Gas report
forge test --gas-report

# Coverage
forge coverage
```

## 🛡️ Security

### Audited Patterns
- ✅ OpenZeppelin contracts (Ownable, Pausable, ReentrancyGuard)
- ✅ Custom errors for gas optimization
- ✅ Checks-Effects-Interactions pattern
- ✅ Comprehensive test coverage

### Known Limitations
- Relies on trusted attester (can be decentralized with DAO)
- CREATE2 salt must be unique per attestation
- No contract upgrade mechanism (intentional for immutability)

## 🤝 Contributing

Contributions are welcome! Please check [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

Built with ❤️ for **Hackxios 2K25** - ETHIndia Track

## 🙏 Acknowledgments

- [Ethereum Attestation Service (EAS)](https://attest.sh/) for on-chain attestations
- [Base](https://base.org/) for the L2 infrastructure
- [OpenZeppelin](https://www.openzeppelin.com/) for security patterns
- [Foundry](https://book.getfoundry.sh/) for the development framework
- ETHIndia community for inspiration

## 📧 Contact

For questions or feedback:
- GitHub Issues: [Create an issue](../../issues)
- Twitter: [@YourHandle]
- Discord: [Your Discord]

---

**⚡ Built on Base | 🔐 Secured by EAS | 🤖 Powered by AI**
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









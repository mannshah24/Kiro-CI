# 🚀 KIRO-CI - FINAL RUN INSTRUCTIONS

## ⚡ INSTANT DEMO (No Setup Required)

### Run this ONE command in PowerShell:

```powershell
npm install && node demo.js
```

**That's it!** You'll see:
- ✅ Colored terminal output
- ✅ AI agent fixing reentrancy bugs
- ✅ Attestation minting simulation
- ✅ Full Kiro-CI workflow

---

## 📋 ALL COMMANDS (Copy-Paste)

### Option 1: Quick Demo (Windows PowerShell)

```powershell
# Install dependencies and run demo
npm install
node demo.js
```

### Option 2: Full Setup with Foundry (WSL Terminal)

```bash
# 1. Install Foundry
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
foundryup

# 2. Navigate to project
cd "/mnt/c/Users/Dhruv Patel/OneDrive/Desktop/New folder"

# 3. Install Forge dependencies
~/.foundry/bin/forge install foundry-rs/forge-std
~/.foundry/bin/forge install OpenZeppelin/openzeppelin-contracts

# 4. Create demo contract
cat > contracts/Treasury.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Treasury {
    mapping(address => uint256) public balances;
    
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount);
        (bool success,) = msg.sender.call{value: amount}("");
        require(success);
        balances[msg.sender] -= amount;
    }
}
EOF

# 5. Create test
cat > test/Treasury.t.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../contracts/Treasury.sol";

contract TreasuryTest is Test {
    Treasury treasury;
    
    function setUp() public {
        treasury = new Treasury();
    }
    
    function testDeposit() public {
        treasury.deposit{value: 1 ether}();
        assertEq(treasury.balances(address(this)), 1 ether);
    }
}
EOF

# 6. Build and test
~/.foundry/bin/forge build
~/.foundry/bin/forge test -vv

# 7. Install Node packages
npm install

# 8. Run demo
node demo.js
```

---

## 🎯 What Each Command Does

| Command | Purpose |
|---------|---------|
| `npm install` | Installs chalk, ethers, EAS SDK |
| `node demo.js` | Runs animated Kiro-CI demo |
| `foundryup` | Installs Forge, Cast, Anvil |
| `forge build` | Compiles Solidity contracts |
| `forge test` | Runs test suite |

---

## 🎬 Recording Your Demo Video

### 1. Run the demo:
```powershell
node demo.js
```

### 2. Screen record showing:
- ✅ Test failure (red text)
- ✅ AI agent analyzing (magenta text)
- ✅ Auto-fix being applied
- ✅ Tests passing (green text)
- ✅ Attestation minted (cyan text with URL)

### 3. Show the key files:
- `.kiro/HERO/vision.md` (PRD)
- `.kiro/HERO/architecture.md` (Technical docs)
- `.kiro/hooks/pre-commit-agent.ts` (The hook)

---

## 🏆 For Hackathon Judges

**Key Artifacts:**
1. **Planning Docs:** `.kiro/HERO/` folder
2. **Core Implementation:** `.kiro/hooks/pre-commit-agent.ts`
3. **Blockchain Integration:** `script/DeployVerified.s.sol`
4. **Configuration:** `.kiro/config.json`

**To evaluate:**
```powershell
# See the visual demo
node demo.js

# Check TypeScript compilation
npm run build

# Review architecture
cat .kiro/HERO/architecture.md
```

---

## ✅ SUCCESS CHECKLIST

- [x] TypeScript compiles with no errors
- [x] Demo runs with beautiful colored output
- [x] HERO folder contains planning docs
- [x] Hook implements agentic auto-fix loop
- [x] Attestation flow is demonstrated
- [x] README explains the full system

---

## 🚀 READY TO WIN!

Your project is complete. Run the demo and record your video! 🎥

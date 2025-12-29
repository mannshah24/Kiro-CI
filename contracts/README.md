# Kiro-CI Demo Contracts

This directory contains example Solidity contracts for demonstrating the Kiro-CI pipeline.

## Example Contracts

### 1. Treasury.sol (Reentrancy Demo)
A vulnerable treasury contract that the AI agent will fix by adding ReentrancyGuard.

### 2. Token.sol (Overflow Demo)
A token contract that demonstrates integer overflow protection via Solidity 0.8+.

### 3. Governance.sol (Access Control Demo)
A governance contract that the AI agent will protect with Ownable access controls.

## Creating Demo Contracts

To test Kiro-CI, create intentionally vulnerable contracts:

```solidity
// contracts/Treasury.sol
pragma solidity ^0.8.19;

contract Treasury {
    mapping(address => uint256) public balances;
    
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }
    
    // VULNERABLE: No reentrancy protection
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount);
        (bool success,) = msg.sender.call{value: amount}("");
        require(success);
        balances[msg.sender] -= amount; // State change AFTER external call
    }
}
```

Then commit:

```bash
git add contracts/Treasury.sol
git commit -m "Add Treasury"
```

Watch Kiro-CI auto-fix the vulnerability! 🎉

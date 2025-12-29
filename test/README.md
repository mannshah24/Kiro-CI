# Kiro-CI Test Suite

This directory contains Foundry tests for Kiro-CI demo contracts.

## Test Structure

```
test/
├── Treasury.t.sol       # Reentrancy tests
├── Token.t.sol          # Overflow tests
└── Governance.t.sol     # Access control tests
```

## Running Tests

```bash
# Run all tests
forge test

# Run specific test file
forge test --match-path test/Treasury.t.sol

# Run with verbosity
forge test -vvv

# Generate coverage report
forge coverage
```

## Writing Tests

Foundry tests use the standard Forge testing framework:

```solidity
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
    
    // This test should FAIL initially, triggering the AI agent
    function testReentrancyProtection() public {
        // Test that reentrancy attack is prevented
    }
}
```

## CI Integration

These tests are automatically run by the Kiro-CI agent on every commit. If tests fail, the agent will attempt to fix the issues automatically.

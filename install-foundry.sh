#!/bin/bash
# Kiro-CI Foundry Setup Script for WSL

echo "🔧 Installing Foundry in WSL..."

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash

# Source the shell config to get foundryup in PATH
export PATH="$HOME/.foundry/bin:$PATH"

# Install Foundry binaries
foundryup

# Verify installation
echo ""
echo "✅ Checking Foundry installation..."
$HOME/.foundry/bin/forge --version
$HOME/.foundry/bin/cast --version

echo ""
echo "✅ Foundry installed successfully!"
echo ""
echo "Now run these commands:"
echo "  source ~/.bashrc"
echo "  cd '/mnt/c/Users/Dhruv Patel/OneDrive/Desktop/New folder'"
echo "  ~/.foundry/bin/forge install foundry-rs/forge-std"
echo "  ~/.foundry/bin/forge install OpenZeppelin/openzeppelin-contracts"
echo "  ~/.foundry/bin/forge build"

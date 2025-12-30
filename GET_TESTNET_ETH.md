# 🚰 How to Get Base Sepolia Testnet ETH (100% FREE)

## ⚡ Quick Guide - Choose Your Method

All methods below are **completely free** - you just need to create accounts (which are also free).

---

## 🎯 Method 1: QuickNode Faucet (EASIEST - No Account)

**Best for:** Quick start, no registration needed

1. Go to: https://faucet.quicknode.com/base/sepolia
2. Paste your wallet address
3. Complete CAPTCHA
4. Click "Continue"
5. Receive **0.05 ETH** instantly

✅ **Pros:** No account needed, instant
❌ **Cons:** Smaller amount (0.05 ETH)

---

## 🏆 Method 2: Alchemy Faucet (RECOMMENDED)

**Best for:** Larger amount, reliable

1. Go to: https://www.alchemy.com/faucets/base-sepolia
2. Sign up for free Alchemy account (use Google/GitHub for quick signup)
3. Paste your wallet address
4. Click "Send Me ETH"
5. Receive **0.1 ETH** per day

✅ **Pros:** Larger amount (0.1 ETH), daily refills, reliable
❌ **Cons:** Requires free account

**Your Alchemy account also gives you:**
- Free RPC endpoints (better than public RPCs)
- API access for your dApp
- Analytics dashboard

---

## 🌉 Method 3: Bridge from Ethereum Sepolia

**Best for:** If you can't access Base faucets

1. **Get Ethereum Sepolia ETH first:**
   - https://sepoliafaucet.com/ (No account)
   - https://sepolia-faucet.pk910.de/ (PoW faucet)
   - https://www.alchemy.com/faucets/ethereum-sepolia (With account)

2. **Bridge to Base Sepolia:**
   - Go to: https://bridge.base.org/
   - Connect wallet (MetaMask/Coinbase Wallet)
   - Switch to "Sepolia Testnet"
   - Enter amount to bridge
   - Confirm transaction
   - Wait ~3-5 minutes for bridge

✅ **Pros:** Works when Base faucets are rate-limited
❌ **Cons:** Takes longer (bridge time)

---

## 🔗 Method 4: Base Official Faucet

**Best for:** Official source

1. Go to: https://portal.cdp.coinbase.com/products/faucet
2. Sign in with Coinbase account (or create free account)
3. Select "Base Sepolia"
4. Enter your wallet address
5. Receive **0.1 ETH**

✅ **Pros:** Official, reliable
❌ **Cons:** Requires Coinbase account

---

## 📚 Method 5: LearnWeb3 Faucet

**Best for:** Learning resources + testnet ETH

1. Go to: https://learnweb3.io/faucets/base_sepolia
2. Create free LearnWeb3 account
3. Complete quick verification
4. Request **0.05 ETH**

✅ **Pros:** Educational platform, supportive community
❌ **Cons:** Requires account + verification

---

## 🎓 Method 6: Request from Community

**Best for:** When all else fails

1. **Base Discord:** https://discord.gg/buildonbase
   - Go to #faucet channel
   - Post your address
   - Community members often help

2. **Faucet Aggregators:**
   - https://faucetlink.to/base-sepolia

---

## ✅ Verify You Received ETH

After requesting from any faucet, verify your balance:

### Option A: Using Cast (in WSL)
```bash
cast balance YOUR_ADDRESS --rpc-url https://sepolia.base.org
```

### Option B: Using BaseScan
Go to: https://sepolia.basescan.org/address/YOUR_ADDRESS

### Option C: Using MetaMask
1. Add Base Sepolia network to MetaMask
2. Switch to Base Sepolia network
3. Check balance

---

## 📝 Setting Up Your Wallet

If you don't have a wallet address yet:

### Create New Wallet with Foundry Cast:
```bash
# In WSL
cast wallet new

# This will output:
# - Address: 0x...
# - Private Key: 0x...
# 
# SAVE THESE SECURELY!
```

### Or Use MetaMask:
1. Install MetaMask browser extension
2. Create new wallet
3. Save seed phrase securely
4. Copy your address (starts with 0x...)

---

## 💰 How Much ETH Do You Need?

For deploying Kiro-CI contracts:

- **KiroResolver deployment:** ~0.001 ETH
- **KiroGatekeeper deployment:** ~0.002 ETH
- **Schema registration:** ~0.0005 ETH
- **Testing/transactions:** ~0.0005 ETH

**Total needed:** ~0.004 ETH (any faucet gives you more than enough!)

---

## ⚠️ Troubleshooting

### "Faucet says I already claimed today"
- Try a different faucet from the list
- Use the bridge method (Method 3)
- Wait 24 hours and try again

### "Transaction failed"
- Make sure you're on Base Sepolia network (Chain ID: 84532)
- Check you have enough ETH for gas
- Verify RPC URL: https://sepolia.base.org

### "Address already funded"
Some faucets track addresses. Solutions:
- Create a new wallet address
- Try a different faucet
- Use the bridge method

---

## 🔐 Security Reminders

- **NEVER share your private key**
- **ONLY use these addresses for testnet** (never send real money)
- Keep separate wallets for testnet and mainnet
- These are TESTNET tokens - they have NO real value

---

## 📞 Need Help?

If you're still having trouble getting testnet ETH:

1. Check Base Discord: https://discord.gg/buildonbase
2. Try all 6 methods listed above
3. Check if faucets are working: https://faucet.link/

**Remember:** All these methods are 100% free - you never need to pay for testnet ETH!

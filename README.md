# Stellar Invoice — Level 2 Yellow Belt

A multi-wallet Stellar dashboard with a deployed Soroban smart contract on testnet, real-time event synchronization, and full transaction status tracking.

> **Deployed Contract ID:** `CCJXEAK3DIPQRDN7N3P4V4Q7NCO262WMRRLYMSA5V5OP4RWTSR7NEO5W`
>
> [View on Stellar Expert (Testnet)](https://stellar.expert/explorer/testnet/contract/CCJXEAK3DIPQRDN7N3P4V4Q7NCO262WMRRLYMSA5V5OP4RWTSR7NEO5W)
>
> [View on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CCJXEAK3DIPQRDN7N3P4V4Q7NCO262WMRRLYMSA5V5OP4RWTSR7NEO5W)

---

## Level 2 Requirements Checklist

| # | Requirement | Status | Implementation |
|---|---|---|---|
| 1 | **StellarWalletsKit integration** | ✅ | `lib/stellar-helper.ts` — Freighter, xBull, Albedo via `allowAllModules()` |
| 2 | **3+ error types handled** | ✅ | Wallet not found, user rejected, insufficient balance — `components/PaymentForm.tsx` |
| 3 | **Contract deployed on testnet** | ✅ | `CCJXEAK3DIPQRDN7N3P4V4Q7NCO262WMRRLYMSA5V5OP4RWTSR7NEO5W` |
| 4 | **Contract called from frontend** | ✅ | `invokeContractWrite()` / `readContractState()` in `lib/stellar-helper.ts` |
| 5 | **Transaction status visible** | ✅ | Pending / Success / Failed badges in `TransactionHistory.tsx` |
| 6 | **Event listening & state sync** | ✅ | `getContractEvents()` polls every 15 seconds with real-time panel |
| 7 | **2+ meaningful commits** | ✅ | 5 commits in history |

---

## Features

### Multi-Wallet Support
- **Freighter** — Browser extension wallet
- **xBull** — WalletConnect / extension
- **Albedo** — Link-based wallet
- All wallets wired through `@creit.tech/stellar-wallets-kit` with `StellarWalletsKit`

### Error Handling (3 types)
1. **Wallet not found / unavailable** — Displayed when wallet extension is missing or connection fails
2. **User rejected** — Shown when the user declines signing in the wallet popup
3. **Insufficient balance** — Surfaced when the account lacks XLM for payment or contract fees

### Soroban Smart Contract
- **Source:** `contracts/level2-soroban/src/lib.rs`
- **Functions:**
  - `initialize()` — Sets initial counter, writer, and message state
  - `increment(caller)` — Increments counter, requires auth, emits event
  - `set_message(caller, message)` — Updates on-chain message, requires auth, emits event
  - `get_state()` — Returns `(counter, latest_writer, last_message)` tuple
- **Events:** Published via `env.events().publish()` for counter increments and message updates

### Transaction Status Tracking
- Tracks `PENDING → SUCCESS / FAILED` for every contract submission
- Polls `rpcServer.getTransaction(hash)` to resolve final status
- Color-coded status badges (amber → green / red)

### Real-Time Event Sync
- Fetches contract events via `rpcServer.getEvents()` from recent ledgers
- Displays event topics, values, and ledger numbers in a live panel
- Auto-refreshes every 15 seconds when a submission is in flight

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Blockchain SDK | `@stellar/stellar-sdk` v12 |
| Wallet Kit | `@creit.tech/stellar-wallets-kit` v1.9 |
| Smart Contract | Soroban SDK v22 (Rust) |
| Icons | React Icons (Feather) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Stellar wallet extension (Freighter recommended)
- Rust + `wasm32-unknown-unknown` target (only if rebuilding the contract)
- Stellar CLI (`stellar`) (only if redeploying)

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

The deployed contract ID is configured in `.env.local`:

```env
NEXT_PUBLIC_STELLAR_CONTRACT_ID=CCJXEAK3DIPQRDN7N3P4V4Q7NCO262WMRRLYMSA5V5OP4RWTSR7NEO5W
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-rpc.testnet.stellar.org
```

---

## Contract Deployment

The contract is already deployed to Stellar Testnet. If you need to redeploy:

```bash
# 1. Build the contract
cd contracts/level2-soroban
stellar contract build

# 2. Generate a deployer key (if not already done)
stellar keys generate deployer --network testnet

# 3. Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/level2_soroban.wasm \
  --source deployer \
  --network testnet

# 4. Initialize the contract
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source deployer \
  --network testnet \
  -- initialize

# 5. Update .env.local with the new contract ID
```

### Deployment Transactions

| Step | Transaction Hash |
|---|---|
| WASM Upload | `937f5ab8f2cbf6f0ae5dd65862b0b7e517114dc41f3e2cbf708d7e24f19a41f6` |
| Contract Deploy | `b2357d729ec022f883de6908a58706babf66f93bcc763f6d0c8179264b019106` |
| Initialize | `776e272bcb446d2036f89f533b04ea309cfb3266f977a5bd7a6a653e75179f10` |

---

## Testnet Setup

1. Install **Freighter**, **xBull**, or **Albedo** wallet extension
2. Switch the wallet to **Stellar Testnet**
3. Fund your test account with test XLM from [Stellar Friendbot](https://friendbot.stellar.org)
4. Connect the wallet in the dashboard
5. Send a small XLM payment to another funded testnet account
6. Call the contract (increment or set_message) from the frontend
7. Watch the transaction status panel transition from Pending → Success
8. View real-time contract events in the events panel

---

## Validation Checklist

- [x] Connect wallet works (Freighter / xBull / Albedo)
- [x] Disconnect clears dashboard state
- [x] XLM balance displays after connection
- [x] Invalid payment inputs show clear errors
- [x] Successful payment shows a transaction hash
- [x] Contract writes show pending status and event updates
- [x] Transaction hash opens on Stellar Expert Testnet
- [x] 3 error types handled: wallet not found, rejected, insufficient balance
- [x] Contract deployed on Stellar Testnet
- [x] Contract callable from frontend UI
- [x] Transaction status visible (pending / success / failed)
- [x] Real-time event listening and state synchronization

---

## Project Structure

```
stellar-airstellar-main/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # App layout
│   └── page.tsx             # Main dashboard page
├── components/
│   ├── BalanceDisplay.tsx    # XLM balance with auto-refresh
│   ├── PaymentForm.tsx       # Payment form + contract actions
│   ├── TransactionHistory.tsx # Tx list, status tracking, events
│   └── WalletConnection.tsx  # Multi-wallet selector
├── contracts/
│   └── level2-soroban/
│       ├── Cargo.toml        # Soroban contract config
│       └── src/
│           ├── lib.rs        # Contract: increment, set_message, get_state
│           └── test.rs       # Contract unit tests
├── lib/
│   └── stellar-helper.ts    # StellarHelper class + StellarWalletsKit
├── .env.local               # Deployed contract ID
└── package.json
```

---

## Commits

```
a74b2d4 Add contract docs and source
a0c483a Add Soroban dashboard wiring
0613dbb Implement Stellar invoice dashboard
cbdd2eb Set up Stellar Invoice project
6175648 Initial commit
```

---

This project is for **Stellar Testnet** learning and demo purposes. Do not use mainnet funds.

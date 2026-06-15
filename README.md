# Stellar Multi-Wallet Soroban Dashboard

This project now covers the Level 2 Stellar learning path: multi-wallet integration, deployed Soroban contract wiring, frontend contract calls, transaction status tracking, and live event/state synchronization.

## Features

- Stellar Wallets Kit wallet selection for Freighter, xBull, and Albedo
- Wallet disconnect and address copy controls
- Stellar Testnet balance fetch for native XLM
- XLM invoice payment form with recipient, amount, and optional memo
- Soroban contract interaction from the frontend
- Pending, success, and failed transaction state display
- Contract event polling and dashboard synchronization
- Responsive testnet dashboard UI

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Stellar SDK
- Stellar Wallets Kit
- React Icons

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Testnet Setup

1. Install a supported wallet extension or mobile wallet: Freighter, xBull, or Albedo.
2. Switch the wallet to Stellar Testnet.
3. Fund your test account with test XLM from the Stellar Laboratory friendbot.
4. Deploy the included Soroban contract to Testnet and set `NEXT_PUBLIC_STELLAR_CONTRACT_ID`.
5. Connect the wallet in the dashboard.
6. Send a small XLM payment to another funded Testnet account.
7. Call the contract from the frontend and verify the status/event panels update.

## Contract Deployment

The app is wired to a Testnet Soroban contract address from `NEXT_PUBLIC_STELLAR_CONTRACT_ID`. To finish the deployment requirement, deploy the included contract source to Testnet, then paste the returned contract id into that environment variable.

Recommended flow:

1. Build the contract with Soroban CLI.
2. Deploy it to Stellar Testnet.
3. Copy the resulting `C...` contract id into `.env.local` as `NEXT_PUBLIC_STELLAR_CONTRACT_ID`.
4. Restart the app.

## Validation Checklist

- Connect wallet works.
- Disconnect clears the dashboard state.
- XLM balance displays after connection.
- Invalid payment inputs show clear errors.
- Successful payment shows a transaction hash.
- Contract writes show pending status and event updates.
- Transaction hash opens on Stellar Expert Testnet.

## Commits

Make at least two commits while finishing the level, for example:

```bash
git commit -m "Add Soroban contract dashboard wiring"
git commit -m "Document testnet deployment and event sync"
```

This project is for Testnet learning and demo purposes. Do not use mainnet funds.

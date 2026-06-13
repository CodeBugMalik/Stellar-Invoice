# Stellar Invoice

Stellar Invoice is a focused Level 1 Stellar Testnet payment dashboard. It connects a Freighter-compatible wallet, fetches the connected account's XLM balance, sends XLM payments, and displays transaction confirmation details.

## Features

- Freighter wallet connection through Stellar Wallets Kit
- Wallet disconnect and address copy controls
- Stellar Testnet balance fetch for native XLM
- XLM invoice payment form with recipient, amount, and optional memo
- Success and failure feedback for payment attempts
- Transaction hash links to Stellar Expert Testnet
- Recent transaction list for the connected account
- Responsive professional dashboard UI

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

1. Install the Freighter wallet browser extension.
2. Switch Freighter to Stellar Testnet.
3. Fund your test account with test XLM from the Stellar Laboratory friendbot.
4. Connect the wallet in Stellar Invoice.
5. Send a small XLM payment to another funded Testnet account.

## Validation Checklist

- Connect wallet works.
- Disconnect clears the dashboard state.
- XLM balance displays after connection.
- Invalid payment inputs show clear errors.
- Successful payment shows a transaction hash.
- Transaction hash opens on Stellar Expert Testnet.

This project is for Testnet learning and demo purposes. Do not use mainnet funds.

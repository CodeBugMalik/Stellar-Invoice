# Contributing to Stellar Invoice

Thanks for helping improve Stellar Invoice. This project is a small Stellar Testnet dashboard for wallet connection, XLM balance checks, invoice-style payments, and transaction feedback.

## Development Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000` or the port printed by Next.js.

## Contribution Guidelines

- Keep the app focused on Stellar Testnet invoice payments.
- Use TypeScript for all UI and Stellar integration changes.
- Keep wallet actions inside client components or browser-only helpers.
- Do not add marketplace, booking, or unrelated product flows.
- Show clear loading, success, and error states for wallet and payment actions.
- Never test with mainnet funds.

## Testing Checklist

- `npm run lint`
- `npm run build`
- Connect a Freighter-compatible wallet on Testnet
- Disconnect and confirm the UI resets
- Fetch and refresh XLM balance
- Send a small XLM testnet payment
- Confirm the transaction hash opens on Stellar Expert Testnet
- Test invalid recipient and invalid amount errors

## Commit Messages

Use short, descriptive commit messages:

```bash
git commit -m "Implement invoice payment dashboard"
git commit -m "Document Stellar Invoice setup"
```

## Pull Requests

Include:

- What changed
- Why it changed
- Screenshots for UI changes
- Validation steps performed

## Notes

This is a learning/demo project. Keep the code approachable and avoid unnecessary dependencies.

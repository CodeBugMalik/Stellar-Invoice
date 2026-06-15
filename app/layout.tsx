import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stellar Multi-Wallet Soroban Dashboard',
  description: 'Multi-wallet Stellar Testnet dashboard with Soroban contract calls, status tracking, and live event sync.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

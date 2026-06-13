'use client';

import { useMemo, useState } from 'react';
import BalanceDisplay from '@/components/BalanceDisplay';
import PaymentForm from '@/components/PaymentForm';
import TransactionHistory from '@/components/TransactionHistory';
import WalletConnection from '@/components/WalletConnection';
import { stellar } from '@/lib/stellar-helper';
import {
  FiActivity,
  FiCheckCircle,
  FiCreditCard,
  FiExternalLink,
  FiFileText,
  FiLock,
  FiSend,
} from 'react-icons/fi';

type TransactionResult = {
  status: 'success' | 'error';
  message: string;
  hash?: string;
};

export default function StellarInvoicePage() {
  const [publicKey, setPublicKey] = useState('');
  const [latestResult, setLatestResult] = useState<TransactionResult | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const shortAddress = useMemo(() => {
    return publicKey ? stellar.formatAddress(publicKey, 6, 6) : 'Not connected';
  }, [publicKey]);

  const handleDisconnect = () => {
    setPublicKey('');
    setLatestResult(null);
  };

  const handlePaymentSuccess = (hash: string) => {
    setLatestResult({
      status: 'success',
      message: 'Invoice payment confirmed on Stellar Testnet.',
      hash,
    });
    setRefreshKey((value) => value + 1);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
              <FiFileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-normal text-white">
                Stellar Invoice
              </h1>
              <p className="text-sm text-slate-400">
                XLM invoice payments on Stellar Testnet
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Testnet active
            </div>
            <WalletConnection onConnect={setPublicKey} onDisconnect={handleDisconnect} />
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-sm font-medium uppercase tracking-wide text-cyan-300">
                    Level 1 dashboard
                  </p>
                  <h2 className="max-w-2xl text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                    Create and pay Stellar invoices with a Freighter wallet.
                  </h2>
                </div>
                <FiCreditCard className="hidden h-10 w-10 text-cyan-300 sm:block" />
              </div>

              <p className="max-w-2xl text-base leading-7 text-slate-300">
                Connect a Stellar Testnet wallet, check your XLM balance, send an
                invoice payment, and review confirmation details from the same
                workspace.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: FiLock, label: 'Freighter wallet', value: 'Connect / disconnect' },
                  { icon: FiActivity, label: 'Balance', value: 'Live XLM fetch' },
                  { icon: FiSend, label: 'Payment', value: 'Signed testnet transfer' },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                    <item.icon className="mb-3 h-5 w-5 text-cyan-300" />
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {publicKey ? (
              <BalanceDisplay publicKey={publicKey} refreshKey={refreshKey} />
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 p-6">
                <p className="text-sm font-medium text-white">Wallet required</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Connect Freighter on Stellar Testnet to load your XLM balance
                  and enable invoice payments.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm font-medium text-slate-400">Connected account</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <code className="break-all rounded-md bg-slate-950 px-3 py-2 font-mono text-sm text-cyan-200">
                  {shortAddress}
                </code>
                {publicKey && (
                  <a
                    href={stellar.getExplorerLink(publicKey, 'account')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 hover:text-cyan-200"
                  >
                    Stellar Expert
                    <FiExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {latestResult && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5">
                <div className="flex gap-3">
                  <FiCheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-300" />
                  <div>
                    <p className="font-medium text-emerald-100">{latestResult.message}</p>
                    {latestResult.hash && (
                      <a
                        href={stellar.getExplorerLink(latestResult.hash, 'tx')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex max-w-full items-center gap-2 text-sm text-emerald-200 hover:text-white"
                      >
                        <span className="truncate font-mono">{latestResult.hash}</span>
                        <FiExternalLink className="h-4 w-4 flex-shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            <PaymentForm publicKey={publicKey} onSuccess={handlePaymentSuccess} />
          </div>
        </div>

        {publicKey && (
          <div className="mt-6">
            <TransactionHistory publicKey={publicKey} refreshKey={refreshKey} />
          </div>
        )}
      </section>

      <footer className="border-t border-slate-800 px-4 py-6 text-center text-sm text-slate-500">
        Stellar Invoice runs on Stellar Testnet. Use test XLM only.
      </footer>
    </main>
  );
}

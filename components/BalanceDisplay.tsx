'use client';

import { useEffect, useState } from 'react';
import { stellar } from '@/lib/stellar-helper';
import { FiCreditCard, FiRefreshCw } from 'react-icons/fi';

interface BalanceDisplayProps {
  publicKey: string;
  refreshKey?: number;
}

export default function BalanceDisplay({ publicKey, refreshKey = 0 }: BalanceDisplayProps) {
  const [balance, setBalance] = useState<{ xlm: string; assets: Array<{ code: string; issuer: string; balance: string }> }>({
    xlm: '0',
    assets: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    loadBalance();

    const interval = window.setInterval(loadBalance, 30000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, refreshKey]);

  const loadBalance = async () => {
    try {
      setLoading(true);
      setError('');
      const nextBalance = await stellar.getBalance(publicKey);
      setBalance(nextBalance);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'Unable to load balance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
            <FiCreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Wallet balance</h2>
            <p className="text-sm text-slate-400">Stellar Testnet XLM</p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadBalance}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-medium text-slate-300 hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
        <p className="text-sm text-slate-400">Available XLM</p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <p className="text-4xl font-semibold tracking-normal text-white">
            {formatBalance(balance.xlm)}
          </p>
          <p className="pb-1 text-lg text-cyan-300">XLM</p>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {lastUpdated ? `Last updated ${lastUpdated}` : 'Balance will load after wallet connection.'}
        </p>
      </div>

      {balance.assets.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-sm font-medium text-slate-300">Other assets</p>
          <div className="space-y-2">
            {balance.assets.map((asset) => (
              <div
                key={`${asset.code}-${asset.issuer}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950 p-3"
              >
                <div>
                  <p className="font-medium text-white">{asset.code}</p>
                  <p className="font-mono text-xs text-slate-500">
                    {stellar.formatAddress(asset.issuer, 6, 6)}
                  </p>
                </div>
                <p className="font-mono text-sm text-slate-200">{formatBalance(asset.balance)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function formatBalance(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '0.0000000';
  }

  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  });
}

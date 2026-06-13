'use client';

import { useState } from 'react';
import { stellar } from '@/lib/stellar-helper';
import { FiCheck, FiCopy, FiCreditCard, FiLogOut } from 'react-icons/fi';

interface WalletConnectionProps {
  onConnect: (publicKey: string) => void;
  onDisconnect: () => void;
}

export default function WalletConnection({ onConnect, onDisconnect }: WalletConnectionProps) {
  const [publicKey, setPublicKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError('');
      const key = await stellar.connectWallet();
      setPublicKey(key);
      onConnect(key);
    } catch (err: any) {
      setError(err.message || 'Unable to connect wallet.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    stellar.disconnect();
    setPublicKey('');
    setError('');
    onDisconnect();
  };

  const handleCopy = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  if (!publicKey) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleConnect}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
          ) : (
            <FiCreditCard className="h-4 w-4" />
          )}
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>
        {error && <p className="max-w-xs text-sm text-red-300">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 hover:border-cyan-400"
          title="Copy connected address"
        >
          {copied ? <FiCheck className="h-4 w-4 text-emerald-300" /> : <FiCopy className="h-4 w-4" />}
          <span className="font-mono">{stellar.formatAddress(publicKey, 4, 4)}</span>
        </button>
        <button
          type="button"
          onClick={handleDisconnect}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-medium text-slate-300 hover:border-red-400 hover:text-red-200"
        >
          <FiLogOut className="h-4 w-4" />
          Disconnect
        </button>
      </div>
    </div>
  );
}

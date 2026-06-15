'use client';

import { useEffect, useMemo, useState } from 'react';
import { stellar, type ContractEventRecord, type ContractSubmission } from '@/lib/stellar-helper';
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiClock,
  FiExternalLink,
  FiRefreshCw,
  FiSearch,
} from 'react-icons/fi';

interface Transaction {
  id: string;
  type: string;
  amount?: string;
  asset?: string;
  from?: string;
  to?: string;
  createdAt: string;
  hash: string;
}

interface TransactionHistoryProps {
  publicKey: string;
  refreshKey?: number;
  contractId?: string;
  submissionHash?: string;
  onStatusChange?: (status: 'idle' | 'pending' | 'success' | 'failed') => void;
}

export default function TransactionHistory({ publicKey, refreshKey = 0, contractId, submissionHash, onStatusChange }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<ContractEventRecord[]>([]);
  const [submissions, setSubmissions] = useState<ContractSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTransactions();
    loadContractData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, refreshKey]);

  useEffect(() => {
    if (!submissionHash) return;

    const interval = window.setInterval(() => {
      loadContractData();
    }, 15000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionHash, contractId]);

  const loadTransactions = async () => {
    try {
      setRefreshing(true);
      setError('');
      const nextTransactions = await stellar.getRecentTransactions(publicKey, 12);
      setTransactions(nextTransactions);
    } catch (err: any) {
      setError(err.message || 'Unable to load transactions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadContractData = async () => {
    if (!contractId) return;

    try {
      const [nextEvents, nextStatus] = await Promise.all([
        stellar.getContractEvents(contractId, 8),
        submissionHash ? stellar.pollContractStatus(submissionHash) : Promise.resolve(null),
      ]);

      setEvents(nextEvents);
      if (nextStatus) {
        setSubmissions((current) => [nextStatus, ...current].slice(0, 6));
        onStatusChange?.(nextStatus.status.toLowerCase() as 'pending' | 'success' | 'failed');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load contract data.');
    }
  };

  const filteredTransactions = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return transactions;

    return transactions.filter((transaction) => {
      return [transaction.hash, transaction.from, transaction.to, transaction.asset]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    });
  }, [search, transactions]);

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Recent transactions</h2>
          <p className="text-sm text-slate-400">Latest payments for the connected account.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search hash or address"
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none sm:w-64"
            />
          </label>
          <button
            type="button"
            onClick={loadTransactions}
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm font-medium text-slate-300 hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {contractId && (
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
              <FiClock className="h-4 w-4" />
              Transaction status
            </div>
            <div className="mt-3 space-y-2">
              {submissions.length === 0 ? (
                <p className="text-sm text-slate-500">No contract submissions yet.</p>
              ) : (
                submissions.map((submission) => (
                  <div key={submission.hash} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-white">{submission.action}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${submission.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-200' : submission.status === 'FAILED' ? 'bg-red-500/20 text-red-200' : 'bg-amber-500/20 text-amber-200'}`}>
                        {submission.status}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-slate-500">{stellar.formatAddress(submission.hash, 8, 8)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
              <FiClock className="h-4 w-4" />
              Real-time events
            </div>
            <div className="mt-3 space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-slate-500">No contract events captured yet.</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-white">{event.topic.join(' / ') || 'contract-event'}</span>
                      <span className="text-xs text-slate-500">Ledger {event.ledger}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{JSON.stringify(event.value)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-lg bg-slate-800" />
          ))}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center">
          <p className="font-medium text-white">No transactions found</p>
          <p className="mt-2 text-sm text-slate-400">
            Send a payment or adjust your search to see results.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800 overflow-hidden rounded-lg border border-slate-800">
          {filteredTransactions.map((transaction) => {
            const sent = transaction.from === publicKey;
            const counterparty = sent ? transaction.to : transaction.from;

            return (
              <div key={transaction.id} className="flex flex-col gap-4 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div
                    className={`mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                      sent ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'
                    }`}
                  >
                    {sent ? <FiArrowUpRight className="h-5 w-5" /> : <FiArrowDownLeft className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white">{sent ? 'Sent payment' : 'Received payment'}</p>
                    <p className="mt-1 truncate font-mono text-xs text-slate-500">
                      {counterparty ? stellar.formatAddress(counterparty, 8, 8) : 'Unknown account'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className={`font-mono text-sm font-semibold ${sent ? 'text-amber-200' : 'text-emerald-200'}`}>
                      {sent ? '-' : '+'}
                      {transaction.amount || '0'} {transaction.asset || 'XLM'}
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      {stellar.formatAddress(transaction.hash, 8, 8)}
                    </p>
                  </div>
                  <a
                    href={stellar.getExplorerLink(transaction.hash, 'tx')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-700 text-slate-300 hover:border-cyan-400 hover:text-cyan-200"
                    title="Open transaction on Stellar Expert"
                  >
                    <FiExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

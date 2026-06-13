'use client';

import { useState } from 'react';
import { stellar } from '@/lib/stellar-helper';
import { FiAlertCircle, FiCheckCircle, FiExternalLink, FiSend } from 'react-icons/fi';

interface PaymentFormProps {
  publicKey: string;
  onSuccess?: (hash: string) => void;
}

type FormErrors = {
  recipient?: string;
  amount?: string;
};

type AlertState = {
  type: 'success' | 'error';
  message: string;
  hash?: string;
};

export default function PaymentForm({ publicKey, onSuccess }: PaymentFormProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [alert, setAlert] = useState<AlertState | null>(null);

  const validateForm = () => {
    const nextErrors: FormErrors = {};
    const trimmedRecipient = recipient.trim();
    const trimmedAmount = amount.trim();
    const parsedAmount = Number(trimmedAmount);

    if (!publicKey) {
      nextErrors.recipient = 'Connect your wallet before sending a payment.';
    }

    if (!trimmedRecipient) {
      nextErrors.recipient = 'Recipient address is required.';
    } else if (!/^G[A-Z0-9]{55}$/.test(trimmedRecipient)) {
      nextErrors.recipient = 'Enter a valid Stellar public key starting with G.';
    }

    if (!trimmedAmount) {
      nextErrors.amount = 'Amount is required.';
    } else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = 'Amount must be greater than 0.';
    } else if (parsedAmount < 0.0000001) {
      nextErrors.amount = 'Minimum payment is 0.0000001 XLM.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setAlert(null);

      const result = await stellar.sendPayment({
        from: publicKey,
        to: recipient.trim(),
        amount: amount.trim(),
        memo: memo.trim() || undefined,
      });

      if (!result.success) {
        throw new Error('The Stellar network did not confirm this transaction.');
      }

      setAlert({
        type: 'success',
        message: 'Payment sent successfully.',
        hash: result.hash,
      });
      setRecipient('');
      setAmount('');
      setMemo('');
      setErrors({});
      onSuccess?.(result.hash);
    } catch (err: any) {
      setAlert({
        type: 'error',
        message: normalizePaymentError(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
          <FiSend className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Pay an invoice</h2>
          <p className="text-sm text-slate-400">Send XLM on Stellar Testnet.</p>
        </div>
      </div>

      {alert && (
        <div
          className={`mb-5 rounded-lg border p-4 ${
            alert.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
              : 'border-red-500/30 bg-red-500/10 text-red-100'
          }`}
        >
          <div className="flex gap-3">
            {alert.type === 'success' ? (
              <FiCheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            ) : (
              <FiAlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-medium">{alert.message}</p>
              {alert.hash && (
                <a
                  href={stellar.getExplorerLink(alert.hash, 'tx')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex max-w-full items-center gap-2 text-sm hover:text-white"
                >
                  <span className="truncate font-mono">{alert.hash}</span>
                  <FiExternalLink className="h-4 w-4 flex-shrink-0" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Recipient address" error={errors.recipient}>
          <input
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="G..."
            className="field-input font-mono text-sm"
            disabled={loading}
          />
        </Field>

        <Field label="Amount (XLM)" error={errors.amount}>
          <input
            type="number"
            min="0"
            step="0.0000001"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="10.0000000"
            className="field-input"
            disabled={loading}
          />
        </Field>

        <Field label="Invoice note / memo">
          <input
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="Invoice #1001"
            maxLength={28}
            className="field-input"
            disabled={loading}
          />
        </Field>

        <button
          type="submit"
          disabled={!publicKey || loading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
          ) : (
            <FiSend className="h-4 w-4" />
          )}
          {loading ? 'Waiting for wallet signature...' : 'Send XLM payment'}
        </button>
      </form>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Transactions are irreversible. Check the recipient address before signing
        in your wallet.
      </p>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      {children}
      {error && <span className="mt-2 block text-sm text-red-300">{error}</span>}
    </label>
  );
}

function normalizePaymentError(error: any) {
  const message = String(error?.message || 'Payment failed. Please try again.');

  if (message.toLowerCase().includes('insufficient')) {
    return 'Payment failed because the source account has insufficient XLM.';
  }

  if (message.toLowerCase().includes('destination')) {
    return 'Payment failed because the destination account is invalid or unfunded.';
  }

  if (message.toLowerCase().includes('rejected')) {
    return 'Payment was rejected in the wallet.';
  }

  return message;
}

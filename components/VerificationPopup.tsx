"use client";

import React, { useState } from "react";
import { X, Loader2, Send, KeyRound } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
}

export default function VerificationPopup({ open, onClose, onVerify, onResend }: Props) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleVerify = async () => {
    setError("");
    setVerifying(true);
    try {
      await onVerify(code);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResending(true);
    try {
      await onResend();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Verify</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          A verification code has been sent to your email. Enter it below.
        </p>

        <input
          type="text"
          placeholder="000000"
          className="w-full text-center text-2xl tracking-[12px] font-mono px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-500"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          autoFocus
        />

        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={handleVerify}
            disabled={code.length !== 6 || verifying}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 rounded-xl font-medium transition-all active:scale-95"
          >
            {verifying ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
            {verifying ? "Verifying..." : "Verify Code"}
          </button>
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-2 transition-colors"
          >
            {resending ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
            {resending ? "Sending..." : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  );
}

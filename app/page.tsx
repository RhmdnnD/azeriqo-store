"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, RefreshCw, Shield, ArrowRight, Store as StoreIcon } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [stats, setStats] = useState<{ available: number; sold: number } | null>(null);
  const [user, setUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => (res.ok ? res.json() : null))
      .then(data => setUser(data))
      .catch(() => setUser(null));
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => { if (data.available !== undefined) setStats(data); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Azeriqo Store</h1>
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={() => router.push("/store")}
              className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all"
            >
              Go to Store
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push("/login")}
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push("/login")}
                className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl">
          <div className="mx-auto w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
            <Shield size={32} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
            Account Store
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-lg mx-auto">
            Securely manage, sell, and organize your digital accounts in one place.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-10">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <ShoppingCart size={18} />
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats !== null ? stats.available : "—"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Available</p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <RefreshCw size={18} />
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats !== null ? stats.sold : "—"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Sold</p>
            </div>
          </div>

          <button
            onClick={() => router.push(user ? "/store" : "/login")}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium text-base transition-all shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30 active:scale-95"
          >
            <StoreIcon size={20} />
            {user ? "Open Store" : "Enter Store"}
            <ArrowRight size={18} />
          </button>
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-slate-400 dark:text-slate-500">
        <p>© {new Date().getFullYear()} Azeriqo Store</p>
      </footer>
    </div>
  );
}

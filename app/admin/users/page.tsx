"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { ShieldCheck, User as UserIcon, Loader2, KeyRound, Check, Search } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "WORKER" | "USER";
  emailVerified: string | null;
  createdAt: string;
}

const roleStyles: Record<string, string> = {
  ADMIN: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  WORKER: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  USER: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/users")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled) return;
        if (!data) { router.push("/login?redirect=/admin/users"); return; }
        setUsers(data);
      })
      .catch(() => { if (!cancelled) router.push("/login"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [router]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as UserData["role"] } : u));
      setSuccessMsg("Role updated");
    }
  };

  const handleResetPassword = async (userId: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    if (res.ok) {
      setResettingId(null);
      setNewPassword("");
      setSuccessMsg("Password reset successfully");
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 p-6 md:p-10 max-w-6xl">
        <div className="space-y-6 animate-in fade-in duration-700">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">User Management</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Manage users, roles, and passwords.</p>
            </div>
          </header>

          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <Check size={16} />
              {successMsg}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center text-slate-400 dark:text-slate-500">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>Loading users...</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Email</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Role</th>
                    <th className="text-left px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Verified</th>
                    <th className="text-right px-5 py-3 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">{u.name}</td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                      <td className="px-5 py-4">
                        {u.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            <ShieldCheck size={12} /> ADMIN
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                            className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500/20 ${roleStyles[u.role]}`}
                          >
                            <option value="WORKER">WORKER</option>
                            <option value="USER">USER</option>
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${u.emailVerified ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                          {u.emailVerified ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {resettingId === u.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <input
                              type="text"
                              placeholder="New password"
                              className="w-32 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              autoFocus
                            />
                            <button
                              onClick={() => handleResetPassword(u.id)}
                              disabled={!newPassword}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg transition-colors"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setResettingId(u.id); setNewPassword(""); }}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                          >
                            <KeyRound size={14} />
                            Reset Password
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                  <UserIcon className="mx-auto mb-3" size={40} />
                  <p>No users found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

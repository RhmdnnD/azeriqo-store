"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { 
  Plus, 
  Copy, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  Check, 
  Search,
  ShoppingCart,
  Shield,
  User,
  Lock,
  Loader2,
  Folder
} from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Account {
  id: string;
  username: string;
  password: string;
  status: "available" | "sold";
  category: Category | null;
  createdAt: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "WORKER" | "USER";
}

export default function AccountStore() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    categoryId: "",
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/auth/me").then(r => r.ok ? r.json() : null),
      fetch("/api/categories").then(r => r.ok ? r.json() : []),
    ])
      .then(([userData, cats]) => {
        if (cancelled) return;
        if (!userData) { router.push("/login?redirect=/store"); return; }
        setUser(userData);
        if (Array.isArray(cats)) setCategories(cats);
        return fetch("/api/accounts");
      })
      .then(res => {
        if (res) return res.json();
      })
      .then(data => {
        if (cancelled) return;
        if (Array.isArray(data)) setAccounts(data);
      })
      .catch(() => { if (!cancelled) router.push("/login?redirect=/store"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [router]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (Array.isArray(data)) setAccounts(data);
    } catch (e) {
      console.error("Failed to fetch accounts", e);
    }
  };

  const canDelete = user?.role === "ADMIN";
  const canEdit = user?.role === "ADMIN" || user?.role === "WORKER";
  const canToggle = canEdit;
  const canAdd = canEdit;

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let retVal = "";
    for (let i = 0; i < 8; i++) {
      retVal += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: retVal });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, string> = {
        username: formData.username,
        password: formData.password,
      };
      if (formData.categoryId) payload.categoryId = formData.categoryId;

      if (editingId) {
        const res = await fetch(`/api/accounts/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setEditingId(null);
          fetchAccounts();
        }
      } else {
        const res = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          fetchAccounts();
        }
      }
      setFormData({ username: "", password: "", categoryId: "" });
      setIsAdding(false);
    } catch (e) {
      console.error("Operation failed", e);
    }
  };

  const handleEdit = (account: Account) => {
    setFormData({
      username: account.username,
      password: account.password,
      categoryId: account.category?.id || "",
    });
    setEditingId(account.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this account?")) {
      try {
        const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
        if (res.ok) fetchAccounts();
      } catch (e) {
        console.error("Delete failed", e);
      }
    }
  };

  const toggleStatus = async (account: Account) => {
    const newStatus = account.status === "available" ? "sold" : "available";
    try {
      const res = await fetch(`/api/accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchAccounts();
    } catch (e) {
      console.error("Status toggle failed", e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus({ ...copyStatus, [id]: true });
    setTimeout(() => setCopyStatus({ ...copyStatus, [id]: false }), 2000);
  };

  const visibleAccounts = accounts.filter(acc => {
    const term = searchTerm.toLowerCase();
    return !term || acc.username.toLowerCase().includes(term) ||
      (acc.category?.name || "").toLowerCase().includes(term);
  });

  const grouped = visibleAccounts.reduce<Record<string, { category: Category | null; accounts: Account[] }>>((acc, acct) => {
    const key = acct.category?.id || "__uncategorized";
    if (!acc[key]) {
      acc[key] = { category: acct.category || null, accounts: [] };
    }
    acc[key].accounts.push(acct);
    return acc;
  }, {});

  const groupOrder = Object.entries(grouped).sort(([aKey, a], [bKey, b]) => {
    if (aKey === "__uncategorized") return 1;
    if (bKey === "__uncategorized") return -1;
    return (a.category?.name || "").localeCompare(b.category?.name || "");
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 p-6 md:p-10 max-w-5xl">
        <div className="space-y-8 animate-in fade-in duration-700">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Store</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and sell your digital accounts.</p>
            </div>
            {canAdd && (
              <button 
                onClick={() => {
                  setIsAdding(!isAdding);
                  if (!isAdding) {
                    setEditingId(null);
                    setFormData({ username: "", password: "", categoryId: "" });
                  }
                }}
                className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95"
              >
                {isAdding ? "Cancel" : <><Plus size={20} /> Add Account</>}
              </button>
            )}
          </header>

          {isAdding && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm animate-in slide-in-from-top-4 duration-300">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                {editingId ? "Edit Account" : "Add New Account"}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Username / Email</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <input
                      required
                      type="text"
                      placeholder="username@example.com"
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                      <input
                        required
                        type="text"
                        placeholder="8-character code"
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={generatePassword}
                      title="Generate Password"
                      className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 rounded-xl transition-colors"
                    >
                      <RefreshCw size={20} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</label>
                  <div className="relative">
                    <Folder className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                    <select
                      value={formData.categoryId}
                      onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    >
                      <option value="">No category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="md:col-span-3 pt-2">
                  <button
                    type="submit"
                    className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium transition-all"
                  >
                    {editingId ? "Update Account" : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search by username or category..."
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>Loading accounts from database...</p>
            </div>
          ) : visibleAccounts.length > 0 ? (
            <div className="space-y-10">
              {groupOrder.map(([key, { category, accounts: groupAccounts }]) => (
                <section key={key}>
                  <div className="flex items-center gap-3 mb-4">
                    {category ? (
                      <>
                        <Folder size={20} className="text-indigo-500" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{category.name}</h2>
                      </>
                    ) : (
                      <>
                        <Folder size={20} className="text-slate-400" />
                        <h2 className="text-xl font-bold text-slate-500 dark:text-slate-400">Uncategorized</h2>
                      </>
                    )}
                    <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                      {groupAccounts.length} account{groupAccounts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupAccounts.map(account => (
                      <div 
                        key={account.id}
                        className={`group bg-white dark:bg-slate-800 border ${account.status === 'sold' ? 'opacity-75' : 'border-slate-200 dark:border-slate-700'} p-5 rounded-2xl shadow-sm hover:shadow-md dark:hover:shadow-slate-900/50 transition-all border-l-4 ${account.status === 'available' ? 'border-l-emerald-500' : 'border-l-slate-400 dark:border-l-slate-600'}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              {account.username}
                              {account.status === 'sold' && (
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                                  Sold
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Added {new Date(account.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                              <button 
                                onClick={() => handleEdit(account)}
                                className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button 
                                onClick={() => handleDelete(account.id)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-xl">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <User size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{account.username}</span>
                            </div>
                            <button 
                              onClick={() => copyToClipboard(account.username, account.id + '-u')}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            >
                              {copyStatus[account.id + '-u'] ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>

                          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-xl">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Lock size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">••••••••</span>
                            </div>
                            <button 
                              onClick={() => copyToClipboard(account.password, account.id + '-p')}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            >
                              {copyStatus[account.id + '-p'] ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                          {canToggle ? (
                            <button 
                              onClick={() => toggleStatus(account)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                account.status === 'available' 
                                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' 
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                              }`}
                            >
                              {account.status === 'available' ? (
                                <><ShoppingCart size={14} /> Mark as Sold</>
                              ) : (
                                <><RefreshCw size={14} /> Put Back to Sale</>
                              )}
                            </button>
                          ) : (
                            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                              account.status === 'available' 
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}>
                              {account.status === 'available' ? (
                                <><ShoppingCart size={14} /> Available</>
                              ) : (
                                <><RefreshCw size={14} /> Sold</>
                              )}
                            </span>
                          )}
                          
                          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs">
                            <Shield size={14} />
                            <span>Secure Storage</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-3xl">
              <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-500 mb-4">
                <Shield size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No accounts found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                {searchTerm ? "Try adjusting your search" : "Start by adding your first account to the store."}
              </p>
            </div>
          )}

          <footer className="pt-8 border-t border-slate-200 dark:border-slate-700 text-center text-slate-400 dark:text-slate-500 text-xs">
            <p>© {new Date().getFullYear()} Azeriqo Store. Securely stored in database.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

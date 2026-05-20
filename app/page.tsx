"use client";

import React, { useState, useEffect } from "react";
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
  Tag,
  Loader2
} from "lucide-react";

// Types
interface Account {
  id: string;
  name: string;
  username: string;
  password: string;
  status: "available" | "sold";
  createdAt: string;
}

export default function AccountStore() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copyStatus, setCopyStatus] = useState<Record<string, boolean>>({});

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
  });

  // Fetch from DB
  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAccounts(data);
      }
    } catch (e) {
      console.error("Failed to fetch accounts", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0, n = charset.length; i < 16; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    setFormData({ ...formData, password: retVal });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await fetch(`/api/accounts/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setEditingId(null);
          fetchAccounts();
        }
      } else {
        const res = await fetch("/api/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          fetchAccounts();
        }
      }
      setFormData({ name: "", username: "", password: "" });
      setIsAdding(false);
    } catch (e) {
      console.error("Operation failed", e);
    }
  };

  const handleEdit = (account: Account) => {
    setFormData({
      name: account.name,
      username: account.username,
      password: account.password,
    });
    setEditingId(account.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this account?")) {
      try {
        const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchAccounts();
        }
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
      if (res.ok) {
        fetchAccounts();
      }
    } catch (e) {
      console.error("Status toggle failed", e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus({ ...copyStatus, [id]: true });
    setTimeout(() => {
      setCopyStatus({ ...copyStatus, [id]: false });
    }, 2000);
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Azeriqo Store</h1>
          <p className="text-slate-500 mt-1">Manage and sell your digital accounts with ease.</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(!isAdding);
            if (!isAdding) {
              setEditingId(null);
              setFormData({ name: "", username: "", password: "" });
            }
          }}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-indigo-200 active:scale-95"
        >
          {isAdding ? "Cancel" : <><Plus size={20} /> Add Account</>}
        </button>
      </header>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm animate-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
            {editingId ? "Edit Account" : "Add New Account"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Account Name</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type="text"
                  placeholder="e.g. Netflix Premium"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Username / Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  required
                  type="text"
                  placeholder="username@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Password</label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    required
                    type="text"
                    placeholder="password123"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={generatePassword}
                  title="Generate Random Password"
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </div>
            <div className="md:col-span-3 pt-2">
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-medium transition-all"
              >
                {editingId ? "Update Account" : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filters */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search by name or username..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Account List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="md:col-span-2 py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p>Loading accounts from database...</p>
          </div>
        ) : filteredAccounts.length > 0 ? (
          filteredAccounts.map(account => (
            <div 
              key={account.id}
              className={`group bg-white border ${account.status === 'sold' ? 'opacity-75' : 'border-slate-200'} p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border-l-4 ${account.status === 'available' ? 'border-l-emerald-500' : 'border-l-slate-400'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    {account.name}
                    {account.status === 'sold' && (
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        Sold
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Added on {new Date(account.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(account)}
                    className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(account.id)}
                    className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <User size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700 truncate">{account.username}</span>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(account.username, account.id + '-u')}
                    className="text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {copyStatus[account.id + '-u'] ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Lock size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700 truncate">••••••••••••••••</span>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(account.password, account.id + '-p')}
                    className="text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {copyStatus[account.id + '-p'] ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button 
                  onClick={() => toggleStatus(account)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    account.status === 'available' 
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {account.status === 'available' ? (
                    <><ShoppingCart size={14} /> Mark as Sold</>
                  ) : (
                    <><RefreshCw size={14} /> Put Back to Sale</>
                  )}
                </button>
                
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <Shield size={14} />
                  <span>Secure Storage</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="md:col-span-2 py-20 text-center bg-white border border-dashed border-slate-300 rounded-3xl">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
              <Shield size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No accounts found</h3>
            <p className="text-slate-500 max-w-xs mx-auto">
              {searchTerm ? "Try adjusting your search terms" : "Start by adding your first account to the store."}
            </p>
          </div>
        )}
      </div>

      <footer className="pt-8 border-t border-slate-200 text-center text-slate-400 text-xs">
        <p>© {new Date().getFullYear()} Azeriqo Store. Securely stored in database.</p>
      </footer>
    </div>
  );
}

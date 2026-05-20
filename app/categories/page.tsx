"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, Loader2, Folder } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Category {
  id: string;
  name: string;
  _count: { accounts: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (e) {
      console.error("Failed to fetch categories", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => { if (!cancelled && Array.isArray(data)) setCategories(data); })
      .catch(e => { if (!cancelled) console.error("Failed to fetch categories", e); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        setNewName("");
        fetchCategories();
      }
    } catch (e) {
      console.error("Failed to add category", e);
    }
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditName("");
        fetchCategories();
      }
    } catch (e) {
      console.error("Failed to rename category", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCategories();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (e) {
      console.error("Failed to delete category", e);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 p-6 md:p-10 max-w-5xl">
        <div className="space-y-8 animate-in fade-in duration-700">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Categories</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Manage account categories.</p>
            </div>
          </header>

          <form onSubmit={handleAdd} className="flex gap-3">
            <input
              required
              type="text"
              placeholder="New category name..."
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95"
            >
              <Plus size={18} /> Add
            </button>
          </form>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm divide-y divide-slate-100 dark:divide-slate-700">
            {loading ? (
              <div className="py-16 flex flex-col items-center text-slate-400 dark:text-slate-500">
                <Loader2 className="animate-spin mb-2" size={28} />
                <p>Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                <Folder className="mx-auto mb-3" size={40} />
                <p>No categories yet. Add one above.</p>
              </div>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between px-5 py-4">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-3">
                      <input
                        autoFocus
                        type="text"
                        className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleRename(cat.id); if (e.key === "Escape") setEditingId(null); }}
                      />
                      <button onClick={() => handleRename(cat.id)} className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 flex-1">
                      <Folder size={18} className="text-slate-400 dark:text-slate-500" />
                      <span className="font-medium text-slate-900 dark:text-slate-100">{cat.name}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {cat._count.accounts} account{cat._count.accounts !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                      className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors"
                      title="Rename"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

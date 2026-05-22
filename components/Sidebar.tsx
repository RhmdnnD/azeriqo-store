"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Store, Folder, LogOut, Sun, Moon, ShieldCheck, Wrench, User, Users } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "WORKER" | "USER";
}

const roleIcons: Record<string, React.ReactNode> = {
  ADMIN: <ShieldCheck size={14} />,
  WORKER: <Wrench size={14} />,
  USER: <User size={14} />,
};

const roleColors: Record<string, string> = {
  ADMIN: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30",
  WORKER: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30",
  USER: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
};

function getInitialTheme(): "dark" | "light" {
  if (typeof window !== "undefined") {
    return (localStorage.getItem("theme") as "dark" | "light") || "dark";
  }
  return "dark";
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (!cancelled) setUser(data); })
      .catch(() => { if (!cancelled) setUser(null); });
    return () => { cancelled = true; };
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (!user) return null;

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => router.push("/")}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          Azeriqo Store
        </button>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleColors[user.role]}`}>
              {roleIcons[user.role]}
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {user.role !== "USER" && (
          <>
            <button
              onClick={() => router.push("/store")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === "/store"
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <Store size={18} />
              Store
            </button>
            <button
              onClick={() => router.push("/categories")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === "/categories"
                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <Folder size={18} />
              Categories
            </button>
          </>
        )}
        {user.role === "ADMIN" && (
          <button
            onClick={() => router.push("/admin/users")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname.startsWith("/admin")
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Users size={18} />
            Users
          </button>
        )}
        <button
          onClick={() => router.push("/profile")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname === "/profile"
              ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          }`}
        >
          <User size={18} />
          Profile
        </button>
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-700 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

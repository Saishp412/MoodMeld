"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircle,
  BarChart3,
  Activity,
  Lightbulb,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: MessageCircle, label: "AI Companion", href: "/dashboard/companion" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Activity, label: "Activities", href: "/dashboard/activities" },
  { icon: Lightbulb, label: "Recommendations", href: "/dashboard/recommendations" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, token, loadFromStorage, logout } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    loadFromStorage();
    setAuthChecked(true);
  }, [loadFromStorage]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (authChecked && !token) {
      window.location.href = "/auth/login";
    }
  }, [authChecked, token]);

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  // Get user initials for avatar
  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "U";

  // Show nothing while checking auth
  if (!authChecked || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center noise-bg">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex noise-bg">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`
          fixed md:sticky top-0 h-screen z-50 flex flex-col 
          border-r border-white/[0.04] bg-[#08080d]/95 backdrop-blur-xl
          transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 opacity-80" />
              <div className="absolute inset-[2px] rounded-[6px] bg-[#08080d] flex items-center justify-center">
                <span className="text-sm font-bold gradient-text">M</span>
              </div>
            </div>
            {!collapsed && (
              <motion.span
                className="text-base font-semibold text-white/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                MoodMeld
              </motion.span>
            )}
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-white/30 hover:text-white/60"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  active
                    ? "bg-violet-500/10 text-violet-300 border border-violet-500/15"
                    : "text-white/35 hover:text-white/60 hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-white/[0.04]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/25 hover:text-white/50 hover:bg-white/[0.03] transition-all"
          >
            <ChevronLeft
              size={18}
              className={`transition-transform flex-shrink-0 ${collapsed ? "rotate-180" : ""}`}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/25 hover:text-red-400/60 hover:bg-red-500/[0.04] transition-all mt-1"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 border-b border-white/[0.04] bg-[#0a0a0f]/60 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden text-white/40 hover:text-white/70"
            >
              <Menu size={22} />
            </button>
            <div className="relative hidden sm:block">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
              />
              <input
                type="text"
                placeholder="Search..."
                className="bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-4 py-2 text-sm text-white/70 placeholder-white/20 focus:outline-none focus:border-violet-500/30 w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* AI Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-400/80">AI Active</span>
            </div>

            {/* Notifications */}
            <button className="relative w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-white/30 hover:text-white/60 transition-all">
              <Bell size={16} />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-violet-500 border-2 border-[#0a0a0f]" />
            </button>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
              <span className="text-xs font-semibold text-white">{userInitial}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

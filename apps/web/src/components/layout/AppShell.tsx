'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import {
  Shield,
  Radar,
  CreditCard,
  FileSpreadsheet,
  ScanLine,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  Upload,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then((items) => {
          setUnreadCount(items.filter((n) => !n.isRead).length);
        })
        .catch(() => {});
    }
  }, [user, pathname]);

  const navItems = [
    { label: 'Overview', href: '/', icon: Shield },
    { label: 'Deduction Radar', href: '/radar', icon: Radar },
    { label: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
    { label: 'Mandates & AutoPay', href: '/mandates', icon: CreditCard },
    { label: 'Import Statement', href: '/import', icon: Upload },
    { label: 'Pattern Detection', href: '/detection', icon: ScanLine },
    { label: 'Transactions', href: '/transactions', icon: Receipt },
    { label: 'Spend Analytics', href: '/insights', icon: BarChart3 },
    {
      label: 'Alerts',
      href: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  // Get current active title for breadcrumb
  const currentItem = navItems.find((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
  );

  return (
    <div className="min-h-screen bg-black bg-grid-vercel text-[#EDEDED] flex flex-col md:flex-row antialiased selection:bg-white selection:text-black">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#0A0A0A] border-r border-[#222222] z-30">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo / Project Switcher */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-[#222222]">
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* Minimalist Vercel-style geometric mark */}
              <div className="w-7 h-7 rounded-md bg-white text-black flex items-center justify-center font-mono font-bold text-xs tracking-tighter transition-transform group-hover:scale-105">
                ▲
              </div>
              <div>
                <span className="font-semibold text-sm tracking-tight text-white block">
                  subguard
                </span>
                <span className="block text-[10px] font-mono text-[#888888] uppercase tracking-wider">
                  Recurring Guardian
                </span>
              </div>
            </Link>

            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#111111] border border-[#27272A] text-[10px] font-mono text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>live</span>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="px-4 pt-4 pb-2">
            <Link
              href="/subscriptions?action=new"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-md bg-white text-black hover:bg-neutral-200 transition-colors min-h-[38px] shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Commitment</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
            <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors min-h-[38px] ${
                    isActive
                      ? 'bg-[#171717] text-white border border-[#27272A] font-semibold'
                      : 'text-[#888888] hover:text-white hover:bg-[#111111] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-sm bg-red-950 text-red-400 border border-red-800/50">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-3.5 border-t border-[#222222] flex items-center justify-between bg-[#0A0A0A]">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-medium text-white truncate font-mono">
                {user?.name || user?.email}
              </p>
              <p className="text-[10px] text-[#888888] truncate font-mono">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              aria-label="Log out"
              title="Log out"
              className="p-1.5 text-[#888888] hover:text-white hover:bg-[#141414] rounded-md transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center border border-transparent hover:border-[#27272A]"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#222222] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center font-mono font-bold text-xs">
            ▲
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">
            subguard
          </span>
          <span className="text-[10px] font-mono text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded">
            prod
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="p-2 text-[#888888] hover:text-white relative min-w-[38px] min-h-[38px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-black" />
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="p-2 text-[#888888] hover:text-white min-w-[38px] min-h-[38px] flex items-center justify-center"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex justify-end">
          <div className="w-4/5 max-w-xs bg-[#0A0A0A] border-l border-[#222222] h-full flex flex-col p-4 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-[#222222]">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-400">Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 min-h-[36px] min-w-[36px] flex items-center justify-center text-zinc-400 hover:text-white"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md min-h-[40px] ${
                      isActive
                        ? 'bg-[#171717] text-white border border-[#27272A]'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-red-950 text-red-400 border border-red-800">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-[#222222] flex items-center justify-between">
              <span className="text-xs text-zinc-400 truncate font-mono">{user?.email}</span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="text-xs text-red-400 font-mono py-1.5 px-3 rounded hover:bg-red-950/40"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-w-0 pb-16 md:pb-8">
        {/* Desktop Top Breadcrumb & Status Bar */}
        <div className="hidden md:flex items-center justify-between px-6 lg:px-8 h-14 border-b border-[#222222] bg-[#0A0A0A]/60 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="text-zinc-500">subguard</span>
            <span className="text-zinc-600">/</span>
            <span className="text-white font-medium">{currentItem?.label.toLowerCase() || 'dashboard'}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/radar"
              className="text-[11px] font-mono text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>14-day horizon</span>
            </Link>
            <span className="text-zinc-700">|</span>
            <Link
              href="/subscriptions?action=new"
              className="text-xs font-medium text-black bg-white hover:bg-neutral-200 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </Link>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

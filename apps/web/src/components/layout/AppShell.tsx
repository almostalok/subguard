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
  Sparkles,
  Receipt,
  PieChart,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Upload,
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
    { label: 'Dashboard', href: '/', icon: Shield },
    { label: 'Deduction Radar', href: '/radar', icon: Radar },
    { label: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
    { label: 'Mandates & AutoPay', href: '/mandates', icon: CreditCard },
    { label: 'Import Statement', href: '/import', icon: Upload },
    { label: 'Recurrence Detection', href: '/detection', icon: Sparkles },
    { label: 'Transactions', href: '/transactions', icon: Receipt },
    { label: 'Insights', href: '/insights', icon: PieChart },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { label: 'Settings & Data', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-surface border-r border-border z-30">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-6 h-16 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
              SG
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-primary">
                SubGuard
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-muted font-medium">
                Recurring Guardian
              </span>
            </div>
          </div>

          {/* Quick Action */}
          <div className="px-4 pt-4 pb-2">
            <Link
              href="/subscriptions?action=new"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-hover shadow-xs transition-colors min-h-[44px]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Commitment</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
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
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${
                    isActive
                      ? 'bg-surface-hover text-primary font-semibold'
                      : 'text-muted hover:text-primary hover:bg-surface-subtle'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-status-risk text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-border flex items-center justify-between bg-surface-subtle/50">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-primary truncate">
                {user?.name || user?.email}
              </p>
              <p className="text-[11px] text-muted truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              aria-label="Log out"
              title="Log out"
              className="p-2 text-muted hover:text-primary hover:bg-surface-subtle rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary text-white flex items-center justify-center font-bold text-xs">
            SG
          </div>
          <span className="font-semibold text-sm tracking-tight text-primary">
            SubGuard
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="p-2 text-muted hover:text-primary relative min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-status-risk" />
            )}
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="p-2 text-muted hover:text-primary min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-4/5 max-w-xs bg-surface h-full flex flex-col p-4 shadow-xl">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="font-semibold text-sm text-primary">Navigation</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
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
                    className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg min-h-[44px] ${
                      isActive
                        ? 'bg-surface-hover text-primary font-semibold'
                        : 'text-muted hover:text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-status-risk text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted truncate">{user?.email}</span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="text-xs text-status-risk font-medium py-2 px-3 min-h-[44px]"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-w-0 pb-16 md:pb-8">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

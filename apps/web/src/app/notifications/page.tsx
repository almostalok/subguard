'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api-client';
import { NotificationDto } from '@subguard/types';
import { Card, Button, Badge } from '@subguard/ui';
import { Bell, Check, CheckCheck, Clock, RefreshCw } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const items = await api.getNotifications();
      setNotifications(items);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerProcess = async () => {
    setIsProcessing(true);
    try {
      await api.triggerProcessNotifications();
      await loadNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
              Notification Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Advance warning alerts, trial expirations, and due date reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="w-4 h-4 mr-1.5" />
              <span>Mark All Read</span>
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            isLoading={isProcessing}
            onClick={handleTriggerProcess}
            title="Scan commitments and generate due reminders"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            <span>Check Due Reminders</span>
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface border border-border rounded-xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <Bell className="w-8 h-8 text-muted mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-primary">Notification center is clear</h3>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            When renewals or trial expirations approach, your proactive reminders will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 bg-surface border rounded-xl shadow-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                n.isRead ? 'border-border opacity-75' : 'border-primary/40 bg-surface-hover/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    n.isRead
                      ? 'bg-surface-subtle text-muted'
                      : 'bg-status-risk-bg text-status-risk border border-status-risk-border'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-primary">{n.title}</h3>
                    {!n.isRead && <Badge variant="risk">New</Badge>}
                  </div>
                  <p className="text-xs text-muted mt-1 leading-relaxed max-w-xl">
                    {n.message}
                  </p>
                  <span className="text-[11px] text-muted block mt-1">
                    {n.scheduledAt.slice(0, 10)}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <div className="flex justify-end sm:justify-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkRead(n.id)}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    <span>Mark Read</span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

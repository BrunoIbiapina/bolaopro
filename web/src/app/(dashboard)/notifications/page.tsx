'use client';

import { useNotifications, useMarkNotificationRead, useDeleteNotification, useMarkAllNotificationsRead } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { formatRelativeDate } from '@/lib/utils';
import { Bell, Trash2, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: deleteNotification } = useDeleteNotification();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  if (isLoading) {
    return <CardSkeleton />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-50">Notificações</h1>
          <p className="text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} não lidas` : 'Você está em dia'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllRead()}
            className="gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar como lidas
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 cursor-pointer transition-colors ${
                !notification.read
                  ? 'bg-brand-950/20 border-brand-500/50'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex-1"
                  onClick={() => !notification.read && markRead(notification.id)}
                >
                  <h3 className="font-semibold text-gray-50">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatRelativeDate(notification.createdAt)}
                  </p>
                </div>

                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="p-2 hover:bg-surface-light rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="Sem notificações"
          description="Você não tem notificações no momento"
        />
      )}
    </div>
  );
}

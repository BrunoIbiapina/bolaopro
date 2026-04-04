'use client';

import { useState, useEffect } from 'react';
import { useNotifications, useMarkNotificationRead, useDeleteNotification, useMarkAllNotificationsRead } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { formatRelativeDate } from '@/lib/utils';
import { Bell, Trash2, CheckCheck, X, Sparkles, Vote } from 'lucide-react';
import Link from 'next/link';

const BANNER_KEY = 'feat_notifications_v1';
const CAUSAS_BANNER_KEY = 'feat_causas_notif_v1';

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: deleteNotification } = useDeleteNotification();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();
  const [showBanner, setShowBanner] = useState(false);
  const [showCausasBanner, setShowCausasBanner] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(BANNER_KEY)) setShowBanner(true);
    if (!localStorage.getItem(CAUSAS_BANNER_KEY)) setShowCausasBanner(true);
  }, []);

  const dismissBanner = () => {
    localStorage.setItem(BANNER_KEY, '1');
    setShowBanner(false);
  };

  const dismissCausasBanner = () => {
    localStorage.setItem(CAUSAS_BANNER_KEY, '1');
    setShowCausasBanner(false);
  };

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
      <div className="space-y-3">
        {/* Novidade: Causas — aparece uma vez */}
        {showCausasBanner && (
          <Card className="p-4 border-purple-500/40 bg-gradient-to-r from-purple-900/20 to-brand-900/10 overflow-hidden relative">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Vote className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Novidade
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-50">Conheça as Causas</h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    Crie apostas sobre qualquer assunto — eleições, clima, esportes. Vote com amigos e veja quem acerta mais.
                  </p>
                  <Link
                    href="/causas"
                    onClick={dismissCausasBanner}
                    className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Explorar causas →
                  </Link>
                </div>
              </div>
              <button
                onClick={dismissCausasBanner}
                className="p-2 hover:bg-surface-light rounded-lg transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-gray-500 hover:text-gray-300" />
              </button>
            </div>
          </Card>
        )}

        {/* Notificação de boas-vindas — aparece uma vez */}
        {showBanner && (
          <Card className="p-4 bg-brand-950/20 border-brand-500/50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-50">Bem-vindo às notificações</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Você recebe alertas aqui quando um resultado de partida for registrado, seu palpite for confirmado ou um pagamento for processado.
                </p>
                <p className="text-xs text-gray-500 mt-2">agora</p>
              </div>
              <button
                onClick={dismissBanner}
                className="p-2 hover:bg-surface-light rounded-lg transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
              </button>
            </div>
          </Card>
        )}

        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 cursor-pointer transition-colors ${
                !notification.read ? 'bg-brand-950/20 border-brand-500/50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex-1"
                  onClick={() => !notification.read && markRead(notification.id)}
                >
                  <h3 className="font-semibold text-gray-50">{notification.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
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
          ))
        ) : !showBanner ? (
          <EmptyState
            icon={Bell}
            title="Sem notificações"
            description="Você não tem notificações no momento"
          />
        ) : null}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pool } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './status-badge';
import { Users, Trophy, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDeletePool } from '@/hooks/use-pools';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface PoolCardProps {
  pool: Pool & { myMemberStatus?: string | null };
}

export function PoolCard({ pool }: PoolCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { mutate: deletePool, isPending: deleting } = useDeletePool();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showBlockedMsg, setShowBlockedMsg] = useState(false);

  const isOrganizer = pool.organizerId === user?.id;
  const isConfirmed = (pool as any).myMemberStatus === 'CONFIRMED';

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isConfirmed) {
      setShowBlockedMsg(true);
      setTimeout(() => setShowBlockedMsg(false), 3000);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deletePool(pool.id, { onSuccess: () => router.refresh() });
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <div className="relative h-full">
      <Link href={`/pools/${pool.id}`} className="block h-full">
        <Card className={cn(
          'h-full cursor-pointer transition-all hover:border-brand-600 hover:shadow-lg hover:shadow-brand-600/20',
          showConfirm && 'border-red-500/40',
        )}>
          <CardContent className="p-5 flex flex-col h-full gap-0">

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-50 truncate">{pool.name}</p>
                <p className="text-sm text-gray-400 mt-0.5 truncate">{pool.championship?.name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={pool.status} />
                {isOrganizer && (
                  <button
                    onClick={handleDeleteClick}
                    className={cn(
                      'flex items-center justify-center size-7 rounded-md border transition-colors',
                      isConfirmed
                        ? 'border-surface-lighter text-gray-600 cursor-not-allowed'
                        : 'border-surface-lighter text-gray-500 hover:border-red-500/50 hover:text-red-400 hover:bg-red-500/10',
                    )}
                    title={isConfirmed ? 'Pagamento confirmado — não é possível excluir' : 'Excluir bolão'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Description — zona de altura fixa para manter alinhamento ── */}
            <div className="mt-3 h-9 flex items-start">
              {pool.description ? (
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{pool.description}</p>
              ) : null}
            </div>

            {/* ── Stats — empurrados para baixo com mt-auto ── */}
            <div className="mt-auto pt-3 border-t border-surface-lighter/40 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Por cota</p>
                  <p className="text-sm font-semibold text-brand-400">
                    {pool.entryFee > 0 ? formatCurrency(pool.entryFee) : 'Grátis'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Participantes</p>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-100">
                      {pool.memberCount || 0}/{pool.maxParticipants}
                    </p>
                  </div>
                </div>
              </div>

              {(pool as any).position && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-brand-950/30 border border-brand-900/30">
                  <Trophy className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                  <span className="text-xs text-brand-300">{(pool as any).position}º lugar</span>
                </div>
              )}
            </div>

            {/* ── Mensagem de bloqueio ── */}
            {showBlockedMsg && (
              <div className="flex items-start gap-2 p-2.5 mt-3 rounded-lg bg-surface border border-surface-lighter">
                <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-300">
                  Seu pagamento foi confirmado, não é possível excluir o bolão.
                </p>
              </div>
            )}

            {/* ── Confirmação inline ── */}
            {showConfirm && (
              <div className="space-y-2 pt-3 mt-3 border-t border-surface-lighter">
                <p className="text-sm text-gray-200 font-medium">Excluir este bolão?</p>
                <p className="text-xs text-gray-500">Esta ação não pode ser desfeita.</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={handleCancel}>
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    disabled={deleting}
                    onClick={handleConfirm}
                  >
                    {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Excluir'}
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

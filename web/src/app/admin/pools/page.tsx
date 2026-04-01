'use client';

import { useState } from 'react';
import { useAdminPools, useAdminUpdatePoolStatus } from '@/hooks/use-pools';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Users, Trophy, Search, Eye, CheckCircle2, Lock, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'OPEN', label: 'Abertos' },
  { value: 'CLOSED', label: 'Fechados' },
  { value: 'FINISHED', label: 'Finalizados' },
];

const statusConfig: Record<string, { label: string; variant: 'success' | 'error' | 'default' | 'info' }> = {
  OPEN:     { label: 'Aberto',     variant: 'success' },
  CLOSED:   { label: 'Fechado',    variant: 'error' },
  FINISHED: { label: 'Finalizado', variant: 'default' },
};

export default function AdminPoolsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [confirmAction, setConfirmAction] = useState<{ poolId: string; status: string; name: string } | null>(null);

  const { data: pools, isLoading } = useAdminPools({
    status: statusFilter,
    search: search.length >= 2 ? search : undefined,
  });
  const { mutate: updateStatus, isPending: updating } = useAdminUpdatePoolStatus();

  const handleStatusChange = (poolId: string, status: string, name: string) => {
    setConfirmAction({ poolId, status, name });
  };

  const confirmStatusChange = () => {
    if (!confirmAction) return;
    updateStatus(
      { poolId: confirmAction.poolId, status: confirmAction.status },
      { onSuccess: () => setConfirmAction(null) },
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-gray-400 hover:text-gray-200 transition-colors">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-50">Todos os Bolões</h1>
          <p className="text-sm text-gray-400">Gerencie e monitore todos os bolões da plataforma</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500 pointer-events-none" />
          <Input
            placeholder="Buscar por nome, organizador ou campeonato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === opt.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface border border-surface-lighter text-gray-400 hover:text-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <Card className="w-full max-w-sm border-brand-500/30">
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm font-bold text-gray-100">Confirmar alteração</p>
                <p className="text-xs text-gray-400 mt-1">
                  Alterar status do bolão <span className="text-gray-200 font-semibold">"{confirmAction.name}"</span> para{' '}
                  <span className="text-brand-400 font-semibold">{statusConfig[confirmAction.status]?.label}</span>?
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmAction(null)}>
                  Cancelar
                </Button>
                <Button size="sm" className="flex-1" onClick={confirmStatusChange} disabled={updating}>
                  {updating ? <Loader2 className="size-4 animate-spin" /> : 'Confirmar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : !pools?.length ? (
        <div className="text-center py-16 text-gray-500">
          <Trophy className="size-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum bolão encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pools.map((pool) => {
            const cfg = statusConfig[pool.status] ?? { label: pool.status, variant: 'default' as const };
            const isFree = pool.entryFee === 0;
            return (
              <Card key={pool.id} className="hover:border-brand-500/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-100 truncate">{pool.name}</p>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        {!isFree && (
                          <span className="text-xs text-brand-400 font-semibold">{formatCurrency(pool.entryFee)}/cota</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {pool.championship && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Trophy className="size-3" />
                            {pool.championship.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="size-3" />
                          {pool.memberCount}/{pool.maxParticipants}
                        </span>
                        <span className="text-xs text-gray-600">
                          por <span className="text-gray-400">{pool.organizer.fullName}</span>
                        </span>
                        <span className="text-xs text-gray-600">
                          {format(new Date(pool.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {/* Ver bolão */}
                      <Link href={`/pools/${pool.id}`}>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                          <Eye className="size-3.5" />
                          Ver
                        </Button>
                      </Link>

                      {/* Mudar status */}
                      {pool.status !== 'OPEN' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs text-green-400 border-green-500/30 hover:bg-green-500/10"
                          onClick={() => handleStatusChange(pool.id, 'OPEN', pool.name)}
                        >
                          <CheckCircle2 className="size-3.5" />
                          Reabrir
                        </Button>
                      )}
                      {pool.status === 'OPEN' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
                          onClick={() => handleStatusChange(pool.id, 'CLOSED', pool.name)}
                        >
                          <Lock className="size-3.5" />
                          Fechar
                        </Button>
                      )}
                      {pool.status !== 'FINISHED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs text-gray-400 border-gray-600/40 hover:bg-gray-700/30"
                          onClick={() => handleStatusChange(pool.id, 'FINISHED', pool.name)}
                        >
                          <XCircle className="size-3.5" />
                          Finalizar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-600 text-center">
        {pools?.length ?? 0} bolão(ões) encontrado(s)
      </p>
    </div>
  );
}

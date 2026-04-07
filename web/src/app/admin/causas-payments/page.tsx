'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, Clock, XCircle, Search,
  ArrowLeft, Banknote, AlertCircle, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  useAdminAllCausaPayments,
  useConfirmCausaPayment,
  useRejectCausaPayment,
} from '@/hooks/use-causas';
import { AvatarWithInitials } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';

// ─── Status config ─────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Pendente',
    className: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    icon: <Clock className="size-3" />,
  },
  PAID: {
    label: 'Confirmado',
    className: 'text-green-400 bg-green-500/10 border-green-500/20',
    icon: <CheckCircle2 className="size-3" />,
  },
  FAILED: {
    label: 'Rejeitado',
    className: 'text-red-400 bg-red-500/10 border-red-500/20',
    icon: <XCircle className="size-3" />,
  },
};

function StatusBadge({ status, notifiedAt }: { status: string; notifiedAt?: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border', cfg.className)}>
      {cfg.icon}
      {cfg.label}
      {status === 'PENDING' && notifiedAt && (
        <span className="ml-0.5 text-yellow-300 font-bold">*</span>
      )}
    </span>
  );
}

// ─── Status tabs ───────────────────────────────────────────────

const STATUS_TABS = [
  { value: undefined, label: 'Todos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'PAID', label: 'Confirmados' },
  { value: 'FAILED', label: 'Rejeitados' },
] as const;

// ─── Page ─────────────────────────────────────────────────────

export default function AdminCausasPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');

  const { data: payments, isLoading } = useAdminAllCausaPayments(statusFilter);
  const confirmMutation = useConfirmCausaPayment();
  const rejectMutation = useRejectCausaPayment();

  const filtered = (payments ?? []).filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.user.fullName.toLowerCase().includes(q) ||
      p.user.email.toLowerCase().includes(q) ||
      p.causa.title.toLowerCase().includes(q)
    );
  });

  // Mark pending-with-notification first
  const sorted = [...filtered].sort((a, b) => {
    const aNotified = a.notifiedAt ? 1 : 0;
    const bNotified = b.notifiedAt ? 1 : 0;
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
    return bNotified - aNotified || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pendingCount = (payments ?? []).filter((p) => p.status === 'PENDING').length;
  const notifiedCount = (payments ?? []).filter((p) => p.status === 'PENDING' && p.notifiedAt).length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-50 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-amber-400" />
            Pagamentos de Causas
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
            {notifiedCount > 0 && (
              <span className="ml-2 text-yellow-400 font-semibold">
                · {notifiedCount} avisou que pagou
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Abas de status */}
        <div className="flex gap-1 bg-gray-800 p-1 rounded-lg">
          {STATUS_TABS.map((tab) => (
            <button
              key={String(tab.value)}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                'text-xs py-1.5 px-3 rounded-md font-medium transition-all',
                statusFilter === tab.value
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Busca */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, email ou causa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Banknote className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum pagamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((payment) => (
            <div
              key={payment.id}
              className={cn(
                'bg-gray-800/60 border rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3',
                payment.status === 'PENDING' && payment.notifiedAt
                  ? 'border-yellow-500/30 bg-yellow-500/5'
                  : 'border-gray-700/50',
              )}
            >
              {/* Usuário */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <AvatarWithInitials
                  src={payment.user.avatar}
                  name={payment.user.fullName}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate">
                    {payment.user.fullName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{payment.user.email}</p>
                </div>
              </div>

              {/* Causa */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/causas/${payment.causaId}`}
                  className="text-xs text-blue-400 hover:text-blue-300 truncate block transition-colors"
                >
                  {payment.causa.title}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5">
                  R$ {payment.amount.toFixed(2)}
                  {payment.numCotas > 1 && ` · ${payment.numCotas} cotas`}
                </p>
              </div>

              {/* Chave PIX do usuário */}
              {payment.user.pixKey && (
                <div className="hidden lg:block min-w-0">
                  <p className="text-xs text-gray-500">Chave PIX:</p>
                  <p className="text-xs text-gray-300 font-mono truncate max-w-[140px]">
                    {payment.user.pixKey}
                  </p>
                </div>
              )}

              {/* Datas */}
              <div className="hidden xl:block text-right min-w-[100px]">
                {payment.notifiedAt && (
                  <p className="text-xs text-yellow-400 flex items-center gap-1 justify-end">
                    <AlertCircle className="w-3 h-3" />
                    Avisou {formatDate(payment.notifiedAt)}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDate(payment.createdAt)}
                </p>
              </div>

              {/* Status */}
              <StatusBadge status={payment.status} notifiedAt={payment.notifiedAt} />

              {/* Ações */}
              {payment.status === 'PENDING' && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs"
                    onClick={() => confirmMutation.mutate({ causaId: payment.causaId, userId: payment.userId })}
                    disabled={confirmMutation.isPending}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-red-700 text-red-400 hover:bg-red-900/20 h-8 px-3 text-xs"
                    onClick={() => rejectMutation.mutate({ causaId: payment.causaId, userId: payment.userId })}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

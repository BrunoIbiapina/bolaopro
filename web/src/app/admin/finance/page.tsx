'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Search,
  TrendingUp,
  Layers,
  XCircle,
  Ban,
  Filter,
  CalendarDays,
  ChevronDown,
  Users,
  AlertCircle,
  FileCheck,
  Trophy,
  Copy,
  Check,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  useFinanceKpis,
  usePoolsWithPayments,
  useAdminAllPayments,
  useAdminMembersStatus,
  useAdminConfirmPayment,
  useAdminRejectPayment,
} from '@/hooks/use-payments';
import { useMyPools } from '@/hooks/use-pools';
import { useRanking, useMarkPrizePaid, useUnmarkPrizePaid } from '@/hooks/use-ranking';
import { AvatarWithInitials } from '@/components/ui/avatar';
import { toast } from 'sonner';

// ─── Status badge ──────────────────────────────────────────────────────────────
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
    label: 'Falhou',
    className: 'text-red-400 bg-red-500/10 border-red-500/20',
    icon: <XCircle className="size-3" />,
  },
  REFUNDED: {
    label: 'Estornado',
    className: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    icon: <XCircle className="size-3" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border', cfg.className)}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-50">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <div className={cn('size-11 rounded-xl flex items-center justify-center shrink-0', iconClass)}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Status tabs ───────────────────────────────────────────────────────────────
const TABS = [
  { key: 'ALL', label: 'Todos' },
  { key: 'PENDING', label: 'Pendentes' },
  { key: 'PAID', label: 'Confirmados' },
  { key: 'FAILED', label: 'Falhos' },
];

// ─── Members view ──────────────────────────────────────────────────────────────
const MEMBER_STATUS_CFG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  NOT_REQUESTED: {
    label: 'Sem solicitação',
    className: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    icon: <AlertCircle className="size-3" />,
  },
  PENDING: {
    label: 'Aguardando confirmação',
    className: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    icon: <Clock className="size-3" />,
  },
  PAID: {
    label: 'Confirmado',
    className: 'text-green-400 bg-green-500/10 border-green-500/20',
    icon: <CheckCircle2 className="size-3" />,
  },
  FAILED: {
    label: 'Não confirmado',
    className: 'text-red-400 bg-red-500/10 border-red-500/20',
    icon: <XCircle className="size-3" />,
  },
};

function MemberStatusBadge({ status }: { status: string }) {
  const cfg = MEMBER_STATUS_CFG[status] ?? MEMBER_STATUS_CFG.NOT_REQUESTED;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border', cfg.className)}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─── Copy PIX button ──────────────────────────────────────────────────────────
function CopyPixButton({ pixKey }: { pixKey: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      toast.success('Chave PIX copiada!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar');
    }
  };
  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5 border-brand-500/40 text-brand-400 hover:bg-brand-500/10"
      onClick={handleCopy}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {copied ? 'Copiado!' : 'Copiar PIX'}
    </Button>
  );
}

// ─── Pool winners card ────────────────────────────────────────────────────────
function PoolWinnersCard({ poolId, poolName, entryFee }: { poolId: string; poolName: string; entryFee: number }) {
  const { data: rankingData, isLoading } = useRanking(poolId);
  const { mutate: markPaid, isPending: marking } = useMarkPrizePaid(poolId);
  const { mutate: unmarkPaid, isPending: unmarking } = useUnmarkPrizePaid(poolId);
  const [markingId, setMarkingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-brand-400" />
        </CardContent>
      </Card>
    );
  }

  if (!rankingData) return null;

  const { totalPot, prizePerLeader, leadersCount, hasWinner, noWinnerReason, ranking } = rankingData;
  const winners = hasWinner ? ranking.filter((r) => r.potentialPrize > 0) : [];
  const platformFeeEst = totalPot * 0.05;
  const distributablePrize = totalPot - platformFeeEst;

  return (
    <Card>
      {/* Pool header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-surface-lighter/50">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-yellow-400" />
            <p className="font-semibold text-gray-100">{poolName}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formatCurrency(entryFee)} por cota · Prêmio total: {formatCurrency(totalPot)}
          </p>
        </div>

        {hasWinner ? (
          <span className="text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2.5 py-0.5">
            {leadersCount} ganhador{leadersCount !== 1 ? 'es' : ''}
          </span>
        ) : (
          <span className="text-xs font-semibold text-gray-400 bg-gray-500/10 border border-gray-500/20 rounded-full px-2.5 py-0.5">
            Sem vencedor
          </span>
        )}
      </div>

      <CardContent className="pt-4 pb-5 space-y-4">
        {/* Sem vencedor */}
        {!hasWinner && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
            <AlertTriangle className="size-4 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-300">Prêmio retido pelo sistema</p>
              <p className="text-xs text-gray-500 mt-0.5">{noWinnerReason}</p>
              <p className="text-xs text-gray-500 mt-0.5">Valor retido: <span className="font-semibold text-gray-300">{formatCurrency(totalPot)}</span></p>
            </div>
          </div>
        )}

        {/* Resumo da divisão */}
        {hasWinner && (
          <div className="rounded-lg bg-surface/60 border border-surface-lighter/60 p-3 text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Total arrecadado</span>
              <span className="text-gray-200 font-medium">{formatCurrency(totalPot)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxa da plataforma (5% est.)</span>
              <span className="text-red-400">− {formatCurrency(platformFeeEst)}</span>
            </div>
            <div className="flex justify-between border-t border-surface-lighter/60 pt-1 mt-1">
              <span className="font-semibold text-gray-200">Distribuível</span>
              <span className="text-green-400 font-bold">{formatCurrency(distributablePrize)}</span>
            </div>
            {leadersCount > 1 && (
              <p className="text-brand-400 pt-0.5">
                ÷ {leadersCount} ganhadores = <span className="font-bold">{formatCurrency(prizePerLeader)}</span> cada
              </p>
            )}
          </div>
        )}

        {/* Lista de ganhadores */}
        {hasWinner && winners.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ganhadores</p>
            {winners.map((entry) => {
              const isPaid = !!entry.prizePaidAt;
              const isProcessing = markingId === entry.user.id && (marking || unmarking);
              return (
                <div
                  key={entry.user.id}
                  className={cn(
                    'rounded-lg border p-3',
                    isPaid
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-surface/40 border-surface-lighter/40',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <AvatarWithInitials name={entry.user.fullName} src={entry.user.avatar} />
                      {entry.position === 1 && !isPaid && (
                        <span className="absolute -top-1 -right-1 text-xs">🥇</span>
                      )}
                      {isPaid && (
                        <span className="absolute -top-1 -right-1 size-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="size-2.5 text-white" />
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-100 truncate">{entry.user.fullName}</p>
                      <p className="text-xs text-gray-500">{entry.totalScore} pts · {entry.correctResults} acerto{entry.correctResults !== 1 ? 's' : ''} exato{entry.correctResults !== 1 ? 's' : ''}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-green-400">{formatCurrency(entry.potentialPrize)}</p>
                      {isPaid && entry.prizePaidAt && (
                        <p className="text-xs text-gray-500">Pago em {formatDate(entry.prizePaidAt)}</p>
                      )}
                    </div>
                  </div>

                  {/* PIX info */}
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    {entry.user.pixKey ? (
                      <>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-surface/60 rounded-md px-2.5 py-1.5 border border-surface-lighter/60">
                          <Wallet className="size-3 text-brand-400 shrink-0" />
                          <span className="text-xs text-gray-300 font-mono truncate">{entry.user.pixKey}</span>
                        </div>
                        <CopyPixButton pixKey={entry.user.pixKey} />
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-2.5 py-1.5">
                        <AlertTriangle className="size-3 shrink-0" />
                        PIX não cadastrado — solicite ao participante
                      </div>
                    )}
                  </div>

                  {/* Mark as paid */}
                  <div className="mt-2.5 flex justify-end">
                    {isPaid ? (
                      <button
                        disabled={isProcessing}
                        className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                        onClick={() => {
                          setMarkingId(entry.user.id);
                          unmarkPaid({ winnerId: entry.user.id }, { onSettled: () => setMarkingId(null) });
                        }}
                      >
                        {isProcessing ? <Loader2 className="size-3 animate-spin inline" /> : '↩ Desfazer pagamento'}
                      </button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isProcessing}
                        className="gap-1.5 bg-green-600 hover:bg-green-500 text-white"
                        onClick={() => {
                          setMarkingId(entry.user.id);
                          markPaid(
                            { winnerId: entry.user.id, prizeAmount: entry.potentialPrize },
                            { onSettled: () => setMarkingId(null) }
                          );
                        }}
                      >
                        {isProcessing ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                        Marcar como pago
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Winners (Apuração) tab ───────────────────────────────────────────────────
function WinnersTab() {
  const { data: pools, isLoading } = useMyPools();
  const finishedPools = useMemo(
    () => (pools ?? []).filter((p) => p.status === 'FINISHED'),
    [pools],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-brand-400" />
      </div>
    );
  }

  if (finishedPools.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="size-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
            <Trophy className="size-6 text-yellow-400" />
          </div>
          <p className="font-semibold text-gray-200">Nenhum bolão finalizado</p>
          <p className="text-sm text-gray-500">
            Quando um bolão for encerrado, os ganhadores aparecem aqui com os dados para pagamento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 text-sm text-gray-300">
        <p className="font-semibold text-brand-300 mb-1">Como usar esta tela</p>
        <p className="text-xs text-gray-400">
          Para cada ganhador: (1) copie a chave PIX, (2) abra seu app bancário e faça a transferência, (3) volte aqui e clique "Marcar como pago". O sistema registra o pagamento com auditoria.
        </p>
      </div>
      {finishedPools.map((pool) => (
        <PoolWinnersCard
          key={pool.id}
          poolId={pool.id}
          poolName={pool.name}
          entryFee={pool.entryFee}
        />
      ))}
    </div>
  );
}

function MembersTab({ searchQuery }: { searchQuery: string }) {
  const { data: pools, isLoading } = useAdminMembersStatus();
  const { mutate: confirmPayment, isPending: confirming } = useAdminConfirmPayment();
  const { mutate: rejectPayment, isPending: rejecting } = useAdminRejectPayment();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!pools) return [];
    const q = searchQuery.toLowerCase();
    return pools.map((p) => ({
      ...p,
      members: p.members.filter(
        (m) =>
          !q ||
          m.user.fullName.toLowerCase().includes(q) ||
          m.user.email.toLowerCase().includes(q) ||
          p.pool.name.toLowerCase().includes(q),
      ),
    })).filter((p) => p.members.length > 0);
  }, [pools, searchQuery]);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-brand-400" /></div>;

  if (!filtered.length) return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <div className="size-12 bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle2 className="size-6 text-green-400" />
        </div>
        <p className="font-semibold text-gray-200">Tudo confirmado!</p>
        <p className="text-sm text-gray-500">{searchQuery ? 'Nenhum resultado para essa busca.' : 'Não há bolões com pagamentos pendentes.'}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5">
      {filtered.map(({ pool, members }) => (
        <Card key={pool.id}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-surface-lighter/50">
            <div>
              <p className="font-semibold text-gray-100">{pool.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatCurrency(pool.entryFee)} por cota · {members.filter(m => m.paymentStatus !== 'PAID').length} com pendência
              </p>
            </div>
            <span className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2.5 py-0.5">
              {members.filter(m => m.paymentStatus !== 'PAID').length} pendente{members.filter(m => m.paymentStatus !== 'PAID').length !== 1 ? 's' : ''}
            </span>
          </div>

          <CardContent className="pt-3 pb-4 space-y-2">
            {members.map((m) => {
              const rowId = `${pool.id}-${m.userId}`;
              const isConfirming = confirmingId === rowId && confirming;
              const isRejecting = rejectingId === rowId && rejecting;
              const userNotified = !!m.userNotifiedAt;
              return (
                <div key={m.userId} className={cn(
                  'rounded-lg border overflow-hidden',
                  m.paymentStatus === 'PAID'
                    ? 'bg-green-500/5 border-green-500/15'
                    : userNotified
                      ? 'bg-brand-500/5 border-brand-500/20'
                      : 'bg-surface/40 border-surface-lighter/40',
                )}>
                  {/* Faixa "Usuário avisou que pagou" */}
                  {userNotified && m.paymentStatus !== 'PAID' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/15 border-b border-brand-500/20">
                      <CheckCircle2 className="size-3 text-brand-400 shrink-0" />
                      <p className="text-xs font-medium text-brand-300">
                        Usuário avisou que realizou o pagamento · {formatDate(m.userNotifiedAt!)}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3">
                    <AvatarWithInitials name={m.user.fullName} src={m.user.avatar ?? undefined} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-100 truncate">{m.user.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{m.user.email}</p>
                    </div>
                    <div className="text-right shrink-0 mr-2">
                      <p className="text-sm font-bold text-gray-100">{formatCurrency(m.expectedAmount)}</p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        {m.hasProof && (
                          <span title="Comprovante enviado" className="flex items-center gap-0.5 text-xs text-brand-400">
                            <FileCheck className="size-3" /> Comprovante
                          </span>
                        )}
                        {!m.hasProof && m.requestedAt && (
                          <p className="text-xs text-gray-500">{formatDate(m.requestedAt)}</p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {m.paymentStatus === 'PAID' ? (
                        <MemberStatusBadge status="PAID" />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <MemberStatusBadge status={m.paymentStatus} />
                          {m.paymentStatus !== 'NOT_REQUESTED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isRejecting}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500 gap-1"
                              onClick={() => { setRejectingId(rowId); rejectPayment({ poolId: pool.id, userId: m.userId }, { onSettled: () => setRejectingId(null) }); }}
                            >
                              {isRejecting ? <Loader2 className="size-3 animate-spin" /> : <Ban className="size-3" />}
                              Recusar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            disabled={isConfirming}
                            className={cn('gap-1', userNotified && 'bg-brand-600 hover:bg-brand-500')}
                            onClick={() => { setConfirmingId(rowId); confirmPayment({ poolId: pool.id, userId: m.userId }, { onSettled: () => setConfirmingId(null) }); }}
                          >
                            {isConfirming ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                            {userNotified ? 'Confirmar pagamento' : 'Confirmar'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function FinancePage() {
  const [mainView, setMainView] = useState<'payments' | 'members' | 'winners'>('members');
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedPool, setSelectedPool] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const { data: kpis, isLoading: loadingKpis } = useFinanceKpis();
  const { data: poolsList } = usePoolsWithPayments();
  const { data: payments, isLoading: loadingPayments } = useAdminAllPayments({
    status: activeTab === 'ALL' ? undefined : activeTab,
    search: search || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    poolId: selectedPool || undefined,
  });
  const { mutate: confirmPayment, isPending: confirming } = useAdminConfirmPayment();
  const { mutate: rejectPayment, isPending: rejecting } = useAdminRejectPayment();

  const handleConfirm = (poolId: string, userId: string, paymentId: string) => {
    setConfirmingId(paymentId);
    confirmPayment({ poolId, userId }, { onSettled: () => setConfirmingId(null) });
  };

  const handleReject = (poolId: string, userId: string, paymentId: string) => {
    setRejectingId(paymentId);
    rejectPayment({ poolId, userId }, { onSettled: () => setRejectingId(null) });
  };

  const hasFilters = !!selectedPool || !!startDate || !!endDate;

  // Group by pool for display
  const grouped = useMemo(() => {
    if (!payments) return [];
    const map: Record<string, { pool: { id: string; name: string; entryFee: number }; items: typeof payments }> = {};
    for (const p of payments) {
      if (!map[p.poolId]) map[p.poolId] = { pool: p.pool, items: [] };
      map[p.poolId].items.push(p);
    }
    return Object.values(map);
  }, [payments]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-50">Financeiro</h1>
        <p className="text-sm text-gray-400 mt-1">Acompanhe todos os pagamentos dos bolões</p>
      </div>

      {/* View switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setMainView('members')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
            mainView === 'members'
              ? 'bg-brand-600/20 border-brand-500/50 text-brand-400'
              : 'border-surface-lighter text-gray-400 hover:text-gray-200 hover:border-gray-600',
          )}
        >
          <Users className="size-4" />
          Membros por bolão
        </button>
        <button
          onClick={() => setMainView('payments')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
            mainView === 'payments'
              ? 'bg-brand-600/20 border-brand-500/50 text-brand-400'
              : 'border-surface-lighter text-gray-400 hover:text-gray-200 hover:border-gray-600',
          )}
        >
          <CreditCard className="size-4" />
          Histórico de pagamentos
        </button>
        <button
          onClick={() => setMainView('winners')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
            mainView === 'winners'
              ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
              : 'border-surface-lighter text-gray-400 hover:text-gray-200 hover:border-gray-600',
          )}
        >
          <Trophy className="size-4" />
          Apuração & Prêmios
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total recebido"
          value={loadingKpis ? '—' : formatCurrency(kpis?.totalReceived ?? 0)}
          sub={`${kpis?.totalPaidCount ?? 0} confirmados`}
          icon={<TrendingUp className="size-5 text-green-400" />}
          iconClass="bg-green-500/10"
        />
        <KpiCard
          label="Aguardando"
          value={loadingKpis ? '—' : formatCurrency(kpis?.totalPending ?? 0)}
          sub={`${kpis?.totalPendingCount ?? 0} pendentes`}
          icon={<Clock className="size-5 text-yellow-400" />}
          iconClass="bg-yellow-500/10"
        />
        <KpiCard
          label="Bolões ativos"
          value={loadingKpis ? '—' : String(kpis?.activePools ?? 0)}
          sub="com movimentação"
          icon={<Layers className="size-5 text-brand-400" />}
          iconClass="bg-brand-600/10"
        />
        <KpiCard
          label="Falhos / Estornos"
          value={loadingKpis ? '—' : String(kpis?.totalFailedCount ?? 0)}
          icon={<XCircle className="size-5 text-red-400" />}
          iconClass="bg-red-500/10"
        />
      </div>

      {/* Apuração & Prêmios */}
      {mainView === 'winners' && <WinnersTab />}

      {/* Members view — visão completa para confirmação manual */}
      {mainView === 'members' && (
        <>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
            <Input
              placeholder="Buscar participante ou bolão…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <MembersTab searchQuery={search} />
        </>
      )}

      {/* Histórico de pagamentos */}
      {mainView === 'payments' && (
      <>
      <div className="flex flex-col gap-3">

        {/* Status tabs */}
        <div className="flex items-center gap-1 border-b border-surface-lighter">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === t.key
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200',
              )}
            >
              {t.label}
              {t.key !== 'ALL' && payments !== undefined && (
                <span className="ml-1.5 text-xs text-gray-500">
                  ({payments.filter((p) => t.key === 'ALL' || p.status === t.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search + filter toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
            <Input
              placeholder="Buscar participante, e-mail ou bolão…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className={cn('gap-1.5', hasFilters && 'border-brand-500 text-brand-400')}
            onClick={() => setShowFilters((v) => !v)}
          >
            <Filter className="size-4" />
            Filtros
            {hasFilters && (
              <span className="size-4 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center font-bold">
                {[selectedPool, startDate, endDate].filter(Boolean).length}
              </span>
            )}
            <ChevronDown className={cn('size-3 transition-transform', showFilters && 'rotate-180')} />
          </Button>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-surface-lighter bg-surface/40">
            {/* Pool filter */}
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <label className="text-xs text-gray-400">Bolão</label>
              <select
                value={selectedPool}
                onChange={(e) => setSelectedPool(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Todos os bolões</option>
                {(poolsList ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Data início</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-500" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Data fim</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-500" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Clear */}
            {hasFilters && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-200"
                  onClick={() => { setSelectedPool(''); setStartDate(''); setEndDate(''); }}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {loadingPayments ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-brand-400" />
        </div>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="size-12 bg-surface rounded-full flex items-center justify-center">
              <CreditCard className="size-6 text-gray-500" />
            </div>
            <p className="font-semibold text-gray-200">Nenhum resultado</p>
            <p className="text-sm text-gray-500">
              {search || hasFilters
                ? 'Tente ajustar os filtros.'
                : activeTab === 'PENDING'
                  ? 'Não há pagamentos pendentes.'
                  : 'Nenhum pagamento registrado ainda.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ pool, items }) => (
            <Card key={pool.id}>

              {/* Pool header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-surface-lighter/50">
                <div>
                  <p className="font-semibold text-gray-100">{pool.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatCurrency(pool.entryFee)} por cota · {items.length} registro{items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Recebido neste bolão</p>
                  <p className="text-sm font-bold text-green-400">
                    {formatCurrency(items.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0))}
                  </p>
                </div>
              </div>

              {/* Payments list */}
              <CardContent className="pt-3 pb-4 space-y-2">
                {items.map((payment) => {
                  const isConfirming = confirmingId === payment.id && confirming;
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-surface/40 border border-surface-lighter/40"
                    >
                      <AvatarWithInitials
                        name={payment.user.fullName}
                        src={payment.user.avatar ?? undefined}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-100 truncate">
                          {payment.user.fullName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{payment.user.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-100">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.status === 'PAID' && payment.paidAt
                            ? `Confirmado ${formatDate(payment.paidAt)}`
                            : `Solicitado ${formatDate(payment.createdAt)}`}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2 justify-end">
                        {payment.status === 'PENDING' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={rejectingId === payment.id && rejecting}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500 gap-1.5"
                              onClick={() => handleReject(payment.poolId, payment.userId, payment.id)}
                            >
                              {rejectingId === payment.id && rejecting ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Ban className="size-3.5" />
                              )}
                              Não pago
                            </Button>
                            <Button
                              size="sm"
                              disabled={isConfirming}
                              onClick={() => handleConfirm(payment.poolId, payment.userId, payment.id)}
                            >
                              {isConfirming ? (
                                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                              ) : (
                                <CheckCircle2 className="size-3.5 mr-1.5" />
                              )}
                              Confirmar
                            </Button>
                          </>
                        ) : (
                          <StatusBadge status={payment.status} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}

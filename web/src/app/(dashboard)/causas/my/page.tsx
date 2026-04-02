'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Trophy, Clock, Check, X, Vote,
  Target, ChevronRight, CreditCard,
  CheckCircle2, AlertTriangle, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useMyCausas,
  CAUSA_CATEGORY_LABELS, CAUSA_STATUS_LABELS, formatDeadline,
  type Causa,
} from '@/hooks/use-causas';

// ─── Card de causa participada ────────────────────────────────

function MyCausaCard({ causa, myVote }: { causa: Causa; myVote?: any }) {
  const router = useRouter();
  const cat = CAUSA_CATEGORY_LABELS[causa.category];
  const status = CAUSA_STATUS_LABELS[causa.status];

  const hasPayment = causa.entryFee > 0 && myVote;
  const paymentStatus = myVote?.paymentStatus;
  const isPaid        = paymentStatus === 'PAID';
  const isPending     = paymentStatus === 'PENDING';
  const isFailed      = paymentStatus === 'FAILED';

  return (
    <div
      onClick={() => router.push(`/causas/${causa.id}`)}
      className="group bg-surface border border-surface-lighter rounded-xl p-4 cursor-pointer hover:border-blue-500/50 hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
    >
      {/* Topo */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1.5 min-w-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${cat.color}`}>
            {cat.label}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Badge resultado */}
        {myVote != null && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
            myVote.isCorrect === true  ? 'bg-green-500/10 text-green-400'
            : myVote.isCorrect === false ? 'bg-red-500/10 text-red-400'
            : 'bg-gray-800 text-gray-400'
          }`}>
            {myVote.isCorrect === true  ? <><Check className="w-3 h-3" /> Acertou!</>
            : myVote.isCorrect === false ? <><X className="w-3 h-3" /> Errou</>
            : <><Clock className="w-3 h-3" /> Votei</>}
          </span>
        )}
      </div>

      {/* Título */}
      <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-blue-400 transition-colors line-clamp-2">
        {causa.title}
      </h3>

      {/* Meu voto */}
      {myVote?.option?.label && (
        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
          <Target className="w-3 h-3 shrink-0" />
          Meu voto: <span className="text-gray-300 font-medium">{myVote.option.label}</span>
        </p>
      )}
      {myVote?.numericValue != null && (
        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
          <Target className="w-3 h-3 shrink-0" />
          Palpite: <span className="text-gray-300 font-medium">{myVote.numericValue} {causa.numericUnit ?? ''}</span>
        </p>
      )}

      {/* Status de pagamento */}
      {hasPayment && (
        <div className={`mt-2.5 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg w-fit ${
          isPaid    ? 'bg-green-500/10 text-green-400'
          : isFailed  ? 'bg-red-500/10 text-red-400'
          : isPending ? 'bg-yellow-500/10 text-yellow-400'
          : 'bg-gray-800 text-gray-500'
        }`}>
          {isPaid    ? <><CheckCircle2 className="w-3 h-3" /> Pago</>
          : isFailed  ? <><AlertTriangle className="w-3 h-3" /> Não confirmado</>
          : isPending ? <><CreditCard className="w-3 h-3" /> Aguardando pagamento</>
          : <><Clock className="w-3 h-3" /> Pendente</>}
        </div>
      )}

      {/* Rodapé */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-800 text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span>{causa._count.votes} voto{causa._count.votes !== 1 ? 's' : ''}</span>
          {causa.status === 'OPEN' && (
            <span className="flex items-center gap-1 text-orange-400">
              <Clock className="w-3 h-3" /> {formatDeadline(causa.deadlineAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {myVote?.prizeAmount > 0 && (
            <span className="flex items-center gap-1 text-green-400">
              <Trophy className="w-3 h-3" /> R$ {Number(myVote.prizeAmount).toFixed(2)}
            </span>
          )}
          {isPaid && <Lock className="w-3 h-3 text-gray-600" />}
          <ChevronRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 transition-colors" />
        </div>
      </div>
    </div>
  );
}

// ─── Card de causa criada ──────────────────────────────────────

function CreatedCausaCard({ causa }: { causa: Causa }) {
  const router = useRouter();
  const cat = CAUSA_CATEGORY_LABELS[causa.category];
  const status = CAUSA_STATUS_LABELS[causa.status];

  return (
    <div
      onClick={() => router.push(`/causas/${causa.id}`)}
      className="group bg-surface border border-surface-lighter rounded-xl p-4 cursor-pointer hover:border-blue-500/50 hover:shadow-lg hover:shadow-black/20 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}>
            {cat.label}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
            {status.label}
          </span>
          {causa.entryFee > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
              R$ {causa.entryFee.toFixed(0)}/cota
            </span>
          )}
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-gray-700 group-hover:text-gray-400 transition-colors shrink-0 mt-0.5" />
      </div>

      <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-blue-400 transition-colors line-clamp-2 mb-3">
        {causa.title}
      </h3>

      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800 pt-2.5">
        <span>{causa._count.votes} participante{causa._count.votes !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          {causa.entryFee > 0 && causa.prizePool > 0 && (
            <span className="text-amber-400 flex items-center gap-1">
              <Trophy className="w-3 h-3" /> R$ {causa.prizePool.toFixed(2)}
            </span>
          )}
          {causa.status === 'OPEN' && (
            <span className="flex items-center gap-1 text-orange-400">
              <Clock className="w-3 h-3" /> {formatDeadline(causa.deadlineAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página ────────────────────────────────────────────────────

export default function MyCausasPage() {
  const { data, isLoading } = useMyCausas();
  const [tab, setTab] = useState<'voted' | 'created'>('voted');

  const votedItems   = data?.voted   ?? [];
  const createdItems = data?.created ?? [];
  const items = tab === 'voted' ? votedItems : createdItems;

  // Estatísticas rápidas
  const correctCount = votedItems.filter((c: any) => c.myVote?.isCorrect === true).length;
  const pendingPayments = votedItems.filter(
    (c: any) => c.myVote?.paymentStatus === 'PENDING' && c.entryFee > 0
  ).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Minhas Causas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Histórico de participações e causas criadas</p>
        </div>
        <Link href="/causas/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Nova
          </Button>
        </Link>
      </div>

      {/* KPIs rápidos */}
      {!isLoading && (votedItems.length > 0 || createdItems.length > 0) && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Votei',    value: votedItems.length,   color: 'text-blue-400' },
            { label: 'Acertei',  value: correctCount,        color: 'text-green-400' },
            { label: 'Criei',    value: createdItems.length, color: 'text-violet-400' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-surface border border-surface-lighter rounded-xl p-3 text-center">
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Aviso de pagamentos pendentes */}
      {pendingPayments > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <CreditCard className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-300">
            Você tem <strong>{pendingPayments}</strong> pagamento{pendingPayments > 1 ? 's' : ''} pendente{pendingPayments > 1 ? 's' : ''} de confirmação.
          </p>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 p-1 rounded-lg">
        {[
          { value: 'voted',   label: `Votei`, count: votedItems.length },
          { value: 'created', label: `Criei`, count: createdItems.length },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value as any)}
            className={`flex-1 text-sm py-1.5 px-3 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
              tab === t.value
                ? 'bg-gray-700 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              tab === t.value ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Vote className="w-7 h-7 text-gray-500" />
          </div>
          <p className="text-white font-semibold">
            {tab === 'voted' ? 'Você ainda não votou em nenhuma causa.' : 'Você ainda não criou nenhuma causa.'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {tab === 'voted' ? 'Explore o feed e faça suas previsões.' : 'Crie uma causa e desafie seus amigos.'}
          </p>
          <Link href={tab === 'created' ? '/causas/new' : '/causas'}>
            <Button size="sm" className="mt-4 gap-1.5">
              <Plus className="w-4 h-4" />
              {tab === 'created' ? 'Criar causa' : 'Explorar causas'}
            </Button>
          </Link>
        </div>
      )}

      {/* Lista */}
      {!isLoading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((causa: any) =>
            tab === 'voted' ? (
              <MyCausaCard key={causa.id} causa={causa} myVote={causa.myVote} />
            ) : (
              <CreatedCausaCard key={causa.id} causa={causa} />
            )
          )}
        </div>
      )}
    </div>
  );
}

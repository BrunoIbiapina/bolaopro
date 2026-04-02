'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trophy, Clock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useMyCausas,
  CAUSA_CATEGORY_LABELS, CAUSA_STATUS_LABELS, formatDeadline,
  type Causa,
} from '@/hooks/use-causas';

function MyCausaCard({ causa, myVote }: { causa: Causa; myVote?: any }) {
  const router = useRouter();
  const cat = CAUSA_CATEGORY_LABELS[causa.category];
  const status = CAUSA_STATUS_LABELS[causa.status];

  return (
    <div
      onClick={() => router.push(`/causas/${causa.id}`)}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}>
            {cat.emoji} {cat.label}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
            {status.label}
          </span>
        </div>
        {myVote != null && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
            myVote.isCorrect === true ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
            : myVote.isCorrect === false ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {myVote.isCorrect === true ? <><Check className="w-3 h-3" /> Acertou!</>
            : myVote.isCorrect === false ? <><X className="w-3 h-3" /> Errou</>
            : <><Clock className="w-3 h-3" /> Votei</>}
          </span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
        {causa.title}
      </h3>
      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{causa._count.votes} votos</span>
        {causa.status === 'OPEN' && (
          <span className="flex items-center gap-1 text-orange-500">
            <Clock className="w-3 h-3" /> {formatDeadline(causa.deadlineAt)}
          </span>
        )}
        {myVote?.prizeAmount > 0 && (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Trophy className="w-3 h-3" /> R$ {myVote.prizeAmount.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function MyCausasPage() {
  const { data, isLoading } = useMyCausas();
  const [tab, setTab] = useState<'created' | 'voted'>('voted');

  const items = tab === 'created' ? data?.created ?? [] : data?.voted ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Minhas Causas</h1>
        <Link href="/causas/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Nova
          </Button>
        </Link>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {[
          { value: 'voted',   label: `Votei (${data?.voted.length ?? 0})` },
          { value: 'created', label: `Criei (${data?.created.length ?? 0})` },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value as any)}
            className={`flex-1 text-sm py-1.5 px-3 rounded-md font-medium transition-all ${
              tab === t.value
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🗳️</p>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {tab === 'voted' ? 'Você ainda não votou em nenhuma causa.' : 'Você ainda não criou nenhuma causa.'}
          </p>
          <Link href={tab === 'created' ? '/causas/new' : '/causas'}>
            <Button size="sm" className="mt-4">
              {tab === 'created' ? 'Criar causa' : 'Explorar causas'}
            </Button>
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {items.map((causa: any) => (
          <MyCausaCard
            key={causa.id}
            causa={causa}
            myVote={tab === 'voted' ? causa.myVote : undefined}
          />
        ))}
      </div>
    </div>
  );
}

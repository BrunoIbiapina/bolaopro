'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Search, Clock, Users, Trophy, Lock, Globe,
  Vote, Landmark, Dumbbell, Cloud, Clapperboard,
  Briefcase, Theater, Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useCausasFeed,
  type CausaCategory,
  type CausasFilters,
  CAUSA_CATEGORY_LABELS,
  CAUSA_STATUS_LABELS,
  formatDeadline,
  type Causa,
} from '@/hooks/use-causas';

// ─── Ícones por categoria ─────────────────────────────────────

const CATEGORY_ICONS: Record<CausaCategory, React.ElementType> = {
  POLITICA:       Landmark,
  ESPORTE:        Dumbbell,
  CLIMA:          Cloud,
  ENTRETENIMENTO: Clapperboard,
  NEGOCIOS:       Briefcase,
  CULTURA:        Theater,
  OUTROS:         Lightbulb,
};

// ─── CausaCard ────────────────────────────────────────────────

function CausaCard({ causa }: { causa: Causa }) {
  const router = useRouter();
  const cat = CAUSA_CATEGORY_LABELS[causa.category];
  const status = CAUSA_STATUS_LABELS[causa.status];
  const totalVotes = causa._count.votes;
  const deadline = formatDeadline(causa.deadlineAt);
  const isPaid = causa.entryFee > 0;
  const CategoryIcon = CATEGORY_ICONS[causa.category];
  const isResolved = causa.status === 'RESOLVED';
  const topOptions = causa.options.slice(0, 3);

  // Cor de destaque por status
  const accentClass = isResolved
    ? 'from-indigo-500/10 to-purple-500/5 border-indigo-500/20 hover:border-indigo-400/40'
    : causa.status === 'CLOSED'
    ? 'from-gray-500/5 to-gray-500/5 border-gray-700/40 hover:border-gray-600/60'
    : 'from-blue-500/5 to-transparent border-gray-200 dark:border-gray-800 hover:border-blue-400/60 dark:hover:border-blue-500/50';

  return (
    <div
      onClick={() => router.push(`/causas/${causa.id}`)}
      className={`group relative bg-gradient-to-br dark:bg-gray-900/80 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${accentClass}`}
    >
      {/* Faixa lateral colorida por categoria */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${cat.color.replace('text-', 'bg-').replace(/bg-\S+\/\d+\s/, '').split(' ')[0]}`} />

      <div className="pl-4 pr-4 pt-4 pb-3">
        {/* Topo: badges + visibilidade */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>
              <CategoryIcon className="w-3 h-3" />
              {cat.label}
            </span>
            <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
              {status.label}
            </span>
            {isPaid && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Trophy className="w-2.5 h-2.5" />
                R$ {causa.entryFee.toFixed(0)}/cota
              </span>
            )}
          </div>
          {causa.visibility === 'PRIVATE'
            ? <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            : <Globe className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
          }
        </div>

        {/* Título */}
        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {causa.title}
        </h3>

        {/* Opções com barras */}
        {(causa.type === 'BINARY' || causa.type === 'CHOICE') && topOptions.length > 0 && (
          <div className="space-y-2 mb-3">
            {topOptions.map((opt, i) => {
              const pct = opt.percentage ?? 0;
              const colors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-orange-500'];
              const barColor = isResolved && causa.resolvedOptionId === opt.id ? 'bg-green-500' : colors[i % colors.length];
              return (
                <div key={opt.id} className="space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate flex items-center gap-1">
                      {opt.emoji && <span>{opt.emoji}</span>}
                      {opt.label}
                      {isResolved && causa.resolvedOptionId === opt.id && (
                        <Trophy className="w-3 h-3 text-green-500 ml-0.5" />
                      )}
                    </span>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {opt.percentage != null ? `${opt.percentage}%` : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {causa.type === 'NUMERIC' && (
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-400 dark:text-gray-500">
            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 font-medium">
              # Previsão numérica {causa.numericUnit ? `· ${causa.numericUnit}` : ''}
            </span>
          </div>
        )}

        {/* Rodapé */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800/60">
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span className="font-medium">{totalVotes}</span>
              {totalVotes !== 1 ? ' votos' : ' voto'}
            </span>
            {isPaid && causa.prizePool > 0 && (
              <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                <Trophy className="w-3 h-3" />
                R$ {causa.prizePool.toFixed(2)}
              </span>
            )}
          </div>

          {causa.status === 'OPEN' && (
            <span className="flex items-center gap-1 text-xs font-medium text-orange-500 dark:text-orange-400">
              <Clock className="w-3 h-3" />
              {deadline}
            </span>
          )}
          {isResolved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-indigo-500 dark:text-indigo-400">
              <Trophy className="w-3 h-3" />
              Resultado disponível
            </span>
          )}
          {causa.status === 'CLOSED' && (
            <span className="text-xs text-gray-400">Aguardando resultado</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filtros ──────────────────────────────────────────────────

const STATUS_TABS = [
  { value: 'OPEN',     label: 'Abertas' },
  { value: 'RESOLVED', label: 'Resolvidas' },
  { value: 'ALL',      label: 'Todas' },
] as const;

const SORT_OPTIONS = [
  { value: 'newest',   label: 'Mais recentes' },
  { value: 'deadline', label: 'Encerrando logo' },
  { value: 'popular',  label: 'Mais votadas' },
] as const;

// ─── Página ───────────────────────────────────────────────────

export default function CausasPage() {
  const [filters, setFilters] = useState<CausasFilters>({
    status: 'OPEN',
    sortBy: 'newest',
    page: 1,
    limit: 20,
  });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CausaCategory | undefined>();

  const { data, isLoading, isError, refetch } = useCausasFeed({
    ...filters,
    category: selectedCategory,
    search: search.trim() || undefined,
  });

  const setStatus  = (s: typeof filters.status)  => setFilters((f) => ({ ...f, status: s,  page: 1 }));
  const setSortBy  = (s: typeof filters.sortBy)   => setFilters((f) => ({ ...f, sortBy: s,  page: 1 }));
  const setPage    = (p: number)                   => setFilters((f) => ({ ...f, page: p }));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Causas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Faça suas previsões sobre qualquer assunto
          </p>
        </div>
        <Link href="/causas/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            Criar
          </Button>
        </Link>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar causas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Abas de status */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value as any)}
            className={`flex-1 text-sm py-1.5 px-3 rounded-md font-medium transition-all ${
              filters.status === tab.value
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros de categoria */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory(undefined)}
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
            !selectedCategory
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400'
          }`}
        >
          <Vote className="w-3 h-3" />
          Todas
        </button>
        {(Object.keys(CAUSA_CATEGORY_LABELS) as CausaCategory[]).map((cat) => {
          const meta = CAUSA_CATEGORY_LABELS[cat];
          const Icon = CATEGORY_ICONS[cat];
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? undefined : cat)}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400'
              }`}
            >
              <Icon className="w-3 h-3" />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Ordenação */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Ordenar:</span>
        <div className="flex gap-1">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value as any)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                filters.sortBy === opt.value
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skeletons */}
      {isLoading && (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Erro */}
      {isError && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="font-medium">Não foi possível carregar as causas.</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Lista */}
      {!isLoading && !isError && data && (
        <>
          {data.items.length === 0 ? (
            <div className="text-center py-16">
              <Vote className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhuma causa encontrada</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Que tal criar a primeira?</p>
              <Link href="/causas/new">
                <Button size="sm" className="mt-4 gap-1.5">
                  <Plus className="w-4 h-4" /> Criar causa
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {data.items.map((causa) => (
                <CausaCard key={causa.id} causa={causa} />
              ))}
            </div>
          )}

          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline" size="sm"
                disabled={filters.page === 1}
                onClick={() => setPage((filters.page ?? 1) - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {filters.page} / {data.pages}
              </span>
              <Button
                variant="outline" size="sm"
                disabled={filters.page === data.pages}
                onClick={() => setPage((filters.page ?? 1) + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

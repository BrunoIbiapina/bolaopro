'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Search, Clock, Users, Trophy, Lock, Globe,
  Vote, Landmark, Dumbbell, Cloud, Clapperboard,
  Briefcase, Theater, Lightbulb, ChevronDown,
  TrendingUp, SlidersHorizontal, Sparkles, Bell,
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

// ─── Ícones por categoria ──────────────────────────────────────

const CATEGORY_ICONS: Record<CausaCategory, React.ElementType> = {
  POLITICA:       Landmark,
  ESPORTE:        Dumbbell,
  CLIMA:          Cloud,
  ENTRETENIMENTO: Clapperboard,
  NEGOCIOS:       Briefcase,
  CULTURA:        Theater,
  OUTROS:         Lightbulb,
};

// ─── Cores de acento por categoria ───────────────────────────

const CATEGORY_ACCENT: Record<CausaCategory, string> = {
  POLITICA:       'border-l-blue-500',
  ESPORTE:        'border-l-green-500',
  CLIMA:          'border-l-sky-400',
  ENTRETENIMENTO: 'border-l-pink-500',
  NEGOCIOS:       'border-l-amber-500',
  CULTURA:        'border-l-violet-500',
  OUTROS:         'border-l-gray-400',
};

// ─── CausaCard ─────────────────────────────────────────────────

function CausaCard({ causa }: { causa: Causa }) {
  const router = useRouter();
  const cat = CAUSA_CATEGORY_LABELS[causa.category];
  const status = CAUSA_STATUS_LABELS[causa.status];
  const totalVotes = causa._count.votes;
  const isPaid = causa.entryFee > 0;
  const CategoryIcon = CATEGORY_ICONS[causa.category];
  const accentBorder = CATEGORY_ACCENT[causa.category];

  const topOptions = causa.options.slice(0, 3);

  return (
    <div
      onClick={() => router.push(`/causas/${causa.id}`)}
      className={`group bg-surface border border-surface-lighter rounded-xl p-4 cursor-pointer hover:border-blue-500/50 hover:shadow-lg hover:shadow-black/20 transition-all duration-200 border-l-4 ${accentBorder}`}
    >
      {/* Topo: badges + visibilidade */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${cat.color}`}>
            <CategoryIcon className="w-3 h-3 shrink-0" />
            {cat.label}
          </span>
          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${status.color}`}>
            {status.label}
          </span>
          {isPaid && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 whitespace-nowrap">
              <Trophy className="w-3 h-3" />
              R$ {causa.entryFee.toFixed(0)}/cota
            </span>
          )}
        </div>
        <div className="shrink-0 mt-0.5">
          {causa.visibility === 'PRIVATE'
            ? <Lock className="w-3.5 h-3.5 text-gray-500" />
            : <Globe className="w-3.5 h-3.5 text-gray-600" />
          }
        </div>
      </div>

      {/* Título */}
      <h3 className="font-semibold text-white text-sm leading-snug mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
        {causa.title}
      </h3>

      {/* Barras de opções */}
      {(causa.type === 'BINARY' || causa.type === 'CHOICE') && topOptions.length > 0 && (
        <div className="space-y-2 mb-3">
          {topOptions.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 truncate w-20 shrink-0 text-right">{opt.label}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${opt.percentage ?? 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right tabular-nums shrink-0">
                {opt.percentage != null ? `${opt.percentage}%` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {causa.type === 'NUMERIC' && (
        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Previsão numérica · {causa.numericUnit ?? 'valor'}
        </p>
      )}

      {/* Rodapé */}
      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800 pt-2.5 mt-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {totalVotes} voto{totalVotes !== 1 ? 's' : ''}
          </span>
          {isPaid && causa.prizePool > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <Trophy className="w-3 h-3" />
              R$ {causa.prizePool.toFixed(2)}
            </span>
          )}
        </div>
        {causa.status === 'OPEN' && (
          <span className="flex items-center gap-1 text-orange-400">
            <Clock className="w-3 h-3" />
            {formatDeadline(causa.deadlineAt)}
          </span>
        )}
        {causa.status === 'RESOLVED' && (
          <span className="flex items-center gap-1 text-emerald-400">
            <Trophy className="w-3 h-3" />
            Resolvida
          </span>
        )}
        {causa.status === 'CLOSED' && (
          <span className="text-gray-500">Encerrada</span>
        )}
        {causa.status === 'SCHEDULED' && (
          <span className="flex items-center gap-1 text-violet-400">
            <Bell className="w-3 h-3" />
            Em Breve
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Card especial "Em Breve" (featured + scheduled) ──────────

function ScheduledFeaturedCard({ causa }: { causa: Causa }) {
  const router = useRouter();
  const cat = CAUSA_CATEGORY_LABELS[causa.category];
  const CategoryIcon = CATEGORY_ICONS[causa.category];

  return (
    <div
      onClick={() => router.push(`/causas/${causa.id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/60 to-gray-900 p-5 transition-all duration-300 hover:border-violet-400/60 hover:shadow-xl hover:shadow-violet-500/10 sm:col-span-2"
    >
      {/* Glow decorativo */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl" />

      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Badge Em Breve */}
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 animate-pulse">
            <Sparkles className="w-3 h-3" />
            Em Breve
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}>
            <CategoryIcon className="w-3 h-3" />
            {cat.label}
          </span>
        </div>
        <Globe className="w-3.5 h-3.5 text-gray-500 shrink-0" />
      </div>

      <h3 className="text-base font-bold text-white leading-snug mb-2 group-hover:text-violet-300 transition-colors">
        {causa.title}
      </h3>
      {causa.description && (
        <p className="text-sm text-gray-400 line-clamp-2 mb-4">{causa.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-violet-500/20 pt-3">
        <span className="flex items-center gap-1">
          <Bell className="w-3 h-3 text-violet-400" />
          <span className="text-violet-300">Votação em breve — fique ligado!</span>
        </span>
        {causa.entryFee > 0 && (
          <span className="flex items-center gap-1 text-amber-400">
            <Trophy className="w-3 h-3" />
            R$ {causa.entryFee.toFixed(0)}/cota
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Filtros ───────────────────────────────────────────────────

const STATUS_TABS = [
  { value: 'OPEN',     label: 'Abertas' },
  { value: 'RESOLVED', label: 'Resolvidas' },
  { value: 'ALL',      label: 'Todas' },
] as const;

const SORT_OPTIONS = [
  { value: 'newest',   label: 'Mais recentes' },
  { value: 'deadline', label: 'Encerra logo' },
  { value: 'popular',  label: 'Mais votadas' },
] as const;

// ─── Página ────────────────────────────────────────────────────

export default function CausasPage() {
  const [filters, setFilters] = useState<CausasFilters>({
    status: 'OPEN',
    sortBy: 'newest',
    page: 1,
    limit: 20,
  });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CausaCategory | undefined>();
  const [showSort, setShowSort] = useState(false);

  const { data, isLoading, isError, refetch } = useCausasFeed({
    ...filters,
    category: selectedCategory,
    search: search.trim() || undefined,
  });

  const setStatus  = (s: typeof filters.status) => setFilters((f) => ({ ...f, status: s, page: 1 }));
  const setSortBy  = (s: typeof filters.sortBy) => { setFilters((f) => ({ ...f, sortBy: s, page: 1 })); setShowSort(false); };
  const setPage    = (p: number)                 => setFilters((f) => ({ ...f, page: p }));

  const currentSort = SORT_OPTIONS.find((o) => o.value === filters.sortBy);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Causas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Faça suas previsões sobre qualquer assunto</p>
        </div>
        <Link href="/causas/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Criar</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </Link>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Buscar causas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs de status + ordenação */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 p-1 rounded-lg flex-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value as any)}
              className={`flex-1 text-sm py-1.5 px-2 rounded-md font-medium transition-all ${
                filters.status === tab.value
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dropdown de ordenação */}
        <div className="relative">
          <button
            onClick={() => setShowSort((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-400 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 hover:text-gray-200 transition-all whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{currentSort?.label}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-20 min-w-[160px] overflow-hidden">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value as any)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    filters.sortBy === opt.value
                      ? 'bg-blue-600/20 text-blue-400 font-medium'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chips de categoria — scroll horizontal */}
      <div className="relative">
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-950 to-transparent z-10 pointer-events-none rounded-r-lg" />
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setSelectedCategory(undefined)}
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap shrink-0 ${
              !selectedCategory
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
            }`}
          >
            <Vote className="w-3 h-3" />
            Todas
          </button>
          {(Object.keys(CAUSA_CATEGORY_LABELS) as CausaCategory[]).map((cat) => {
            const meta = CAUSA_CATEGORY_LABELS[cat];
            const Icon = CATEGORY_ICONS[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(isSelected ? undefined : cat)}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Skeletons */}
      {isLoading && (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-surface rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Erro */}
      {isError && (
        <div className="text-center py-12 text-gray-500">
          <p className="font-medium">Não foi possível carregar as causas.</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Lista */}
      {!isLoading && !isError && data && (
        <>
          {(() => {
            // Separar featured scheduled do resto
            const featured  = data.items.filter((c) => c.status === 'SCHEDULED' && c.isFeatured);
            const remaining = data.items.filter((c) => !(c.status === 'SCHEDULED' && c.isFeatured));

            if (data.items.length === 0 && featured.length === 0) return (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <Vote className="w-7 h-7 text-gray-500" />
                </div>
                <p className="text-white font-semibold">Nenhuma causa encontrada</p>
                <p className="text-sm text-gray-500 mt-1">
                  {search ? 'Tente outros termos de busca.' : 'Que tal criar a primeira?'}
                </p>
                {!search && (
                  <Link href="/causas/new">
                    <Button size="sm" className="mt-4 gap-1.5">
                      <Plus className="w-4 h-4" /> Criar causa
                    </Button>
                  </Link>
                )}
              </div>
            );

            return (
              <div className="space-y-4">
                {/* Featured scheduled no topo */}
                {featured.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {featured.map((causa) => (
                      <ScheduledFeaturedCard key={causa.id} causa={causa} />
                    ))}
                  </div>
                )}

                {remaining.length > 0 && (
                  <>
                    <p className="text-xs text-gray-600">
                      {remaining.length} causa{remaining.length !== 1 ? 's' : ''}
                      {selectedCategory && ` · ${CAUSA_CATEGORY_LABELS[selectedCategory].label}`}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {remaining.map((causa) => (
                        <CausaCard key={causa.id} causa={causa} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline" size="sm"
                disabled={filters.page === 1}
                onClick={() => setPage((filters.page ?? 1) - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-500">
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

      {/* Fechar dropdown ao clicar fora */}
      {showSort && (
        <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
      )}
    </div>
  );
}

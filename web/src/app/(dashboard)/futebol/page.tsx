'use client';

import { useState } from 'react';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePublicMatches, usePublicStandings, FdMatch } from '@/hooks/use-football-data';
import { Loader2, CalendarDays, BarChart3, CircleDot, TrendingUp } from 'lucide-react';

// Competições exibidas na página
const COMPETITIONS = [
  { code: 'BSA', name: 'Brasileirão', shortName: 'Série A', color: 'from-green-600 to-green-800' },
  { code: 'WC',  name: 'Copa do Mundo', shortName: 'FIFA WC', color: 'from-yellow-600 to-yellow-800' },
  { code: 'CL',  name: 'Champions', shortName: 'UEFA CL', color: 'from-blue-600 to-blue-800' },
  { code: 'PL',  name: 'Premier League', shortName: 'PL', color: 'from-purple-700 to-purple-900' },
];

function dateLabel(utcDate: string): string {
  const d = parseISO(utcDate);
  if (isToday(d)) return 'Hoje';
  if (isTomorrow(d)) return 'Amanhã';
  return format(d, "EEE, dd/MM", { locale: ptBR });
}

function statusLabel(status: string) {
  switch (status) {
    case 'IN_PLAY': return { text: 'Ao vivo', color: 'text-green-400 bg-green-500/15' };
    case 'PAUSED':  return { text: 'Intervalo', color: 'text-yellow-400 bg-yellow-500/15' };
    case 'FINISHED': return { text: 'Encerrado', color: 'text-gray-400 bg-gray-700/50' };
    case 'POSTPONED': return { text: 'Adiado', color: 'text-orange-400 bg-orange-500/15' };
    default: return null;
  }
}

// ── Match Card ────────────────────────────────────────────────────────────────
function MatchCard({ match }: { match: FdMatch }) {
  const st = statusLabel(match.status);
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
  const isFinished = match.status === 'FINISHED';
  const hasScore = isLive || isFinished;

  return (
    <div className={`rounded-xl border bg-surface p-3 transition-colors ${isLive ? 'border-green-500/30' : 'border-surface-lighter'}`}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] text-gray-500">
          {format(parseISO(match.utcDate), "HH:mm", { locale: ptBR })}
          {match.matchday ? ` · Rodada ${match.matchday}` : ''}
        </span>
        {st && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${st.color}`}>
            {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />}
            {st.text}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Home team */}
        <div className="flex flex-1 items-center gap-2 justify-end min-w-0">
          <span className={`text-sm font-semibold truncate ${hasScore && match.score.winner === 'HOME_TEAM' ? 'text-white' : 'text-gray-300'}`}>
            {match.homeTeam?.shortName || match.homeTeam?.name}
          </span>
          {match.homeTeam?.crest
            ? <img src={match.homeTeam.crest} alt="" className="w-7 h-7 object-contain shrink-0" />
            : <div className="w-7 h-7 rounded-full bg-surface-lighter flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-gray-400">{match.homeTeam?.tla}</span>
              </div>
          }
        </div>

        {/* Score or VS */}
        <div className="shrink-0 w-14 text-center">
          {hasScore ? (
            <span className={`text-base font-bold tabular-nums ${isLive ? 'text-green-300' : 'text-gray-50'}`}>
              {match.score.fullTime.home ?? 0} – {match.score.fullTime.away ?? 0}
            </span>
          ) : (
            <span className="text-xs text-gray-500 font-medium">VS</span>
          )}
        </div>

        {/* Away team */}
        <div className="flex flex-1 items-center gap-2 justify-start min-w-0">
          {match.awayTeam?.crest
            ? <img src={match.awayTeam.crest} alt="" className="w-7 h-7 object-contain shrink-0" />
            : <div className="w-7 h-7 rounded-full bg-surface-lighter flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-gray-400">{match.awayTeam?.tla}</span>
              </div>
          }
          <span className={`text-sm font-semibold truncate ${hasScore && match.score.winner === 'AWAY_TEAM' ? 'text-white' : 'text-gray-300'}`}>
            {match.awayTeam?.shortName || match.awayTeam?.name}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Matches Tab ───────────────────────────────────────────────────────────────
function MatchesSection({ code }: { code: string }) {
  const { data: matches, isLoading, error } = usePublicMatches(code);

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  if (error || !matches) return (
    <div className="text-center py-12">
      <CircleDot className="w-10 h-10 text-gray-600 mx-auto mb-3" />
      <p className="text-sm text-gray-400">Não foi possível carregar as partidas.</p>
      <p className="text-xs text-gray-600 mt-1">Tente novamente em alguns instantes.</p>
    </div>
  );

  if (matches.length === 0) return (
    <div className="text-center py-12">
      <CalendarDays className="w-10 h-10 text-gray-600 mx-auto mb-3" />
      <p className="text-sm text-gray-400">Nenhuma partida nos próximos 7 dias.</p>
    </div>
  );

  // Agrupar por data
  const groups: Record<string, FdMatch[]> = {};
  matches.forEach((m) => {
    const key = dateLabel(m.utcDate);
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });

  return (
    <div className="space-y-5">
      {Object.entries(groups).map(([label, group]) => (
        <div key={label}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
          <div className="space-y-2">
            {group.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Standings Tab ─────────────────────────────────────────────────────────────
function StandingsSection({ code }: { code: string }) {
  const { data, isLoading, error } = usePublicStandings(code);

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  if (error || !data) return (
    <div className="text-center py-12">
      <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
      <p className="text-sm text-gray-400">Classificação não disponível para este campeonato.</p>
    </div>
  );

  // Pega o grupo TOTAL ou o primeiro grupo disponível
  const standings = data.standings ?? [];
  const totalGroup = standings.find((s: any) => s.type === 'TOTAL') ?? standings[0];
  if (!totalGroup) return (
    <div className="text-center py-12">
      <p className="text-sm text-gray-400">Dados de classificação indisponíveis.</p>
    </div>
  );

  const table: any[] = totalGroup.table ?? [];

  return (
    <div className="rounded-xl border border-surface-lighter overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2.5rem] gap-1 px-3 py-2 bg-surface-lighter/40 border-b border-surface-lighter">
        <span className="text-[10px] font-semibold text-gray-500 text-center">#</span>
        <span className="text-[10px] font-semibold text-gray-500">Time</span>
        <span className="text-[10px] font-semibold text-gray-500 text-center">J</span>
        <span className="text-[10px] font-semibold text-gray-500 text-center">SG</span>
        <span className="text-[10px] font-semibold text-gray-500 text-center">%</span>
        <span className="text-[10px] font-semibold text-brand-400 text-center">PTS</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-surface-lighter/60">
        {table.map((row: any) => {
          const pos = row.position;
          // Cores de zona: top4 = Champions, top6 = Europa, bottom3 = rebaixamento
          const zoneColor =
            pos <= 4 ? 'border-l-2 border-l-blue-500' :
            pos <= 6 ? 'border-l-2 border-l-green-500' :
            pos >= table.length - 2 ? 'border-l-2 border-l-red-500' :
            'border-l-2 border-l-transparent';

          const winPct = row.playedGames > 0
            ? Math.round((row.won / row.playedGames) * 100)
            : 0;

          return (
            <div
              key={row.team.id}
              className={`grid grid-cols-[2rem_1fr_2rem_2rem_2rem_2.5rem] gap-1 px-3 py-2.5 items-center bg-surface hover:bg-surface-lighter/30 transition-colors ${zoneColor}`}
            >
              <span className="text-xs font-bold text-gray-400 text-center tabular-nums">{pos}</span>

              <div className="flex items-center gap-1.5 min-w-0">
                {row.team.crest
                  ? <img src={row.team.crest} alt="" className="w-5 h-5 object-contain shrink-0" />
                  : <div className="w-5 h-5 rounded-full bg-surface-lighter shrink-0" />
                }
                <span className="text-xs font-medium text-gray-200 truncate">{row.team.shortName || row.team.name}</span>
              </div>

              <span className="text-xs text-gray-400 text-center tabular-nums">{row.playedGames}</span>
              <span className={`text-xs text-center tabular-nums font-medium ${row.goalDifference > 0 ? 'text-green-400' : row.goalDifference < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {row.goalDifference > 0 ? '+' : ''}{row.goalDifference}
              </span>
              <span className="text-xs text-gray-400 text-center tabular-nums">{winPct}%</span>
              <span className="text-sm font-bold text-brand-400 text-center tabular-nums">{row.points}</span>
            </div>
          );
        })}
      </div>

      {/* Legenda zones - só BSA tem sentido */}
      {code === 'BSA' && (
        <div className="px-3 py-2 bg-surface border-t border-surface-lighter flex flex-wrap gap-3">
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="w-2 h-2 rounded-sm bg-blue-500" /> Libertadores
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="w-2 h-2 rounded-sm bg-green-500" /> Sul-Americana
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <span className="w-2 h-2 rounded-sm bg-red-500" /> Rebaixamento
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FutebolPage() {
  const [activeComp, setActiveComp] = useState('BSA');
  const [activeTab, setActiveTab] = useState<'matches' | 'standings'>('matches');
  const comp = COMPETITIONS.find((c) => c.code === activeComp) ?? COMPETITIONS[0];

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-50 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600/15 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          Futebol
        </h1>
        <p className="text-gray-400 text-sm mt-1">Partidas e classificação ao vivo</p>
      </div>

      {/* Competition selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
        {COMPETITIONS.map((c) => (
          <button
            key={c.code}
            onClick={() => setActiveComp(c.code)}
            className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
              activeComp === c.code
                ? 'border-brand-500 bg-brand-500/15 text-brand-300'
                : 'border-surface-lighter bg-surface text-gray-400 hover:border-gray-600'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-surface border border-surface-lighter">
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'matches'
              ? 'bg-brand-500/20 text-brand-300'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Jogos
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'standings'
              ? 'bg-brand-500/20 text-brand-300'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Tabela
        </button>
      </div>

      {/* Content */}
      {activeTab === 'matches'
        ? <MatchesSection code={activeComp} />
        : <StandingsSection code={activeComp} />
      }
    </div>
  );
}

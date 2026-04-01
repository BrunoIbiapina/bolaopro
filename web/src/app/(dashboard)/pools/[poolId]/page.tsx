'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { usePool, usePoolMembers, useLeavePool, usePrizeInfo, useDeletePool, useUpdateMemberStatus, useUpdatePool } from '@/hooks/use-pools';
import { usePredictions, useSavePredictions, useGroupPredictions, useCancelPredictions } from '@/hooks/use-predictions';
import { usePaymentStatus, useGeneratePayment, useUploadPaymentProof, useNotifyPaymentSent } from '@/hooks/use-payments';
import { usePoolMatches } from '@/hooks/use-matches';
import { useRanking } from '@/hooks/use-ranking';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { AvatarWithInitials } from '@/components/ui/avatar';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { format, isPast, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Trophy, Lock, CheckCircle2, Clock, CreditCard, Loader2, Copy, TrendingUp, AlertTriangle, Pencil, Trash2, Target, Eye, Upload, ImageIcon, ExternalLink, Star, X, BarChart3, Flame, Medal, ClipboardList, Banknote, Share2 } from 'lucide-react';
import { ShareModal } from '@/components/shared/share-modal';
import { toast } from 'sonner';
import Link from 'next/link';
import { UserRole } from '@/types';

// ─── Score Input ─────────────────────────────────────────────────────────────
function ScoreInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      value={value}
      onChange={(e) => {
        const v = e.target.value.replace(/[^0-9]/g, '');
        onChange(v);
      }}
      disabled={disabled}
      className="w-12 h-10 text-center text-lg font-bold rounded-lg border border-surface-lighter bg-surface/80 text-gray-50 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-inset focus:ring-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
    />
  );
}

// ─── Match Countdown ─────────────────────────────────────────────────────────
function MatchCountdown({ scheduledAt }: { scheduledAt: string }) {
  const [diff, setDiff] = useState(() => new Date(scheduledAt).getTime() - Date.now());

  useEffect(() => {
    if (diff <= 0) return;
    const tick = () => setDiff(new Date(scheduledAt).getTime() - Date.now());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  if (diff <= 0) return null;

  const totalSecs = Math.floor(diff / 1000);
  const days  = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins  = Math.floor((totalSecs % 3600) / 60);
  const secs  = totalSecs % 60;

  let label: string;
  let urgent = false;

  if (days >= 1) {
    label = `${days}d ${hours}h`;
  } else if (hours >= 1) {
    label = `${hours}h ${String(mins).padStart(2, '0')}min`;
  } else if (mins >= 1) {
    label = `${mins}min ${String(secs).padStart(2, '0')}s`;
    if (mins < 30) urgent = true;
  } else {
    label = `${secs}s`;
    urgent = true;
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${urgent ? 'text-orange-400' : 'text-brand-400'}`}>
      <Clock className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}

// ─── Match Row ────────────────────────────────────────────────────────────────
function MatchRow({ match, homeScore, awayScore, onChange }: {
  match: any; homeScore: string; awayScore: string;
  onChange: (home: string, away: string) => void;
}) {
  const locked = isPast(addMinutes(new Date(match.scheduledAt), -15));
  const isFinished = match.status === 'FINISHED';
  const isLive = match.status === 'LIVE';

  return (
    <div className={`rounded-xl border p-3 ${locked ? 'border-surface-lighter opacity-70' : 'border-surface-lighter hover:border-brand-500/40'}`}>
      <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
        <span>{match.roundId || ''}</span>
        <span className="flex items-center gap-1.5">
          {isLive && <span className="flex items-center gap-1 text-red-400 font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse"/>Ao vivo</span>}
          {isFinished && 'Encerrado'}
          {!isLive && !isFinished && (
            <>
              <span>{format(new Date(match.scheduledAt), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
              {!locked && <MatchCountdown scheduledAt={match.scheduledAt} />}
            </>
          )}
          {locked && !isFinished && <Lock className="h-3 w-3 ml-1" />}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 justify-end">
          <span className="text-sm font-semibold text-gray-100 text-right truncate">{match.homeTeam?.name}</span>
          {match.homeTeam?.logo
            ? <img src={match.homeTeam.logo} alt="" className="h-7 w-7 object-contain shrink-0" />
            : <div className="h-7 w-7 rounded-full bg-surface-light flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">{match.homeTeam?.code}</div>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isFinished
            ? <><div className="w-11 h-9 flex items-center justify-center text-lg font-bold text-gray-300 rounded-lg bg-surface border border-surface-lighter">{match.homeScoreResult ?? '-'}</div><span className="text-gray-500 text-xs">x</span><div className="w-11 h-9 flex items-center justify-center text-lg font-bold text-gray-300 rounded-lg bg-surface border border-surface-lighter">{match.awayScoreResult ?? '-'}</div></>
            : <><ScoreInput value={homeScore} onChange={(v) => onChange(v, awayScore)} disabled={locked} /><span className="text-gray-500 text-xs">x</span><ScoreInput value={awayScore} onChange={(v) => onChange(homeScore, v)} disabled={locked} /></>}
        </div>
        <div className="flex flex-1 items-center gap-2 justify-start">
          {match.awayTeam?.logo
            ? <img src={match.awayTeam.logo} alt="" className="h-7 w-7 object-contain shrink-0" />
            : <div className="h-7 w-7 rounded-full bg-surface-light flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">{match.awayTeam?.code}</div>}
          <span className="text-sm font-semibold text-gray-100 text-left truncate">{match.awayTeam?.name}</span>
        </div>
      </div>
      {isFinished && (homeScore !== '' || awayScore !== '') && (
        <p className="text-xs text-center text-gray-500 mt-1.5">Seu palpite: {homeScore || '-'} x {awayScore || '-'}</p>
      )}
    </div>
  );
}

// ─── Prediction result helpers ────────────────────────────────────────────────
function getPredictionOutcome(
  homeResult: number, awayResult: number,
  homePred: number, awayPred: number,
): 'exact' | 'miss' {
  if (homeResult === homePred && awayResult === awayPred) return 'exact';
  return 'miss';
}

const OUTCOME_CONFIG = {
  exact: { label: 'Exato! +10 pts', className: 'bg-green-500/15 border-green-500/30 text-green-400', icon: <Star className="size-3" /> },
  miss:  { label: 'Errou',          className: 'bg-gray-500/10  border-gray-600/20   text-gray-500',  icon: <X    className="size-3" /> },
};

// ─── My Results Section ───────────────────────────────────────────────────────
function MyResultsSection({ poolId, userId }: { poolId: string; userId: string }) {
  const { data: rankingData } = useRanking(poolId);
  const { data: groupData }   = useGroupPredictions(poolId);

  if (!rankingData || !groupData) return null;
  if (groupData.myStatus !== 'CONFIRMED') return null;

  const myEntry = rankingData.ranking.find((r) => r.user.id === userId);
  const finishedMatches = groupData.matches.filter(
    ({ match }) => match.status === 'FINISHED' &&
      match.homeScoreResult !== null && match.homeScoreResult !== undefined,
  );

  if (finishedMatches.length === 0) return null;

  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className="space-y-3">
      {/* Posição atual */}
      {myEntry && (
        <div className={cn(
          'rounded-2xl border p-4',
          myEntry.position === 1 && myEntry.totalScore > 0
            ? 'border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 to-amber-600/5'
            : 'border-brand-500/20 bg-brand-500/5',
        )}>
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-black/30 flex flex-col items-center justify-center shrink-0">
              <span className="text-2xl leading-none">{medals[myEntry.position] ?? `${myEntry.position}º`}</span>
              {!medals[myEntry.position] && <span className="text-xs text-gray-500 mt-0.5">lugar</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">Minha posição</p>
              <p className="font-bold text-gray-100">
                {myEntry.position === 1 && myEntry.totalScore > 0
                  ? '🏆 Você está liderando!'
                  : `${myEntry.position}º lugar`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {myEntry.correctResults} placar{myEntry.correctResults !== 1 ? 'es' : ''} exato{myEntry.correctResults !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-brand-400">{myEntry.totalScore}</p>
              <p className="text-xs text-gray-500">pontos</p>
              {myEntry.potentialPrize > 0 && (
                <p className="text-xs font-semibold text-green-400 mt-0.5">{formatCurrency(myEntry.potentialPrize)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Partidas encerradas com meus palpites */}
      <div className="rounded-2xl border border-surface-lighter overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-surface/60 border-b border-surface-lighter">
          <BarChart3 className="size-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-200">Meus resultados</p>
          <span className="ml-auto text-xs text-gray-500">{finishedMatches.length} jogo{finishedMatches.length !== 1 ? 's' : ''} encerrado{finishedMatches.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="divide-y divide-surface-lighter/50">
          {finishedMatches.map(({ match, predictions }) => {
            const myPreds = predictions.filter((p) => p.userId === userId);
            const homeR = match.homeScoreResult!;
            const awayR = match.awayScoreResult!;

            return (
              <div key={match.id} className="px-4 py-3">
                {/* Match result */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {match.homeTeam?.logo && <img src={match.homeTeam.logo} alt="" className="size-5 object-contain" />}
                    <span className="text-sm font-medium text-gray-200 truncate max-w-[80px]">{match.homeTeam?.name}</span>
                  </div>
                  <div className="px-3 text-center shrink-0">
                    <span className="text-sm font-bold text-gray-100 tabular-nums">{homeR} × {awayR}</span>
                    {match.roundId && <p className="text-[10px] text-gray-600">{match.roundId}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-medium text-gray-200 truncate max-w-[80px]">{match.awayTeam?.name}</span>
                    {match.awayTeam?.logo && <img src={match.awayTeam.logo} alt="" className="size-5 object-contain" />}
                  </div>
                </div>

                {/* My predictions */}
                {myPreds.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center">Sem palpite registrado</p>
                ) : (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {myPreds.map((pred) => {
                      const outcome = getPredictionOutcome(homeR, awayR, pred.homeScore, pred.awayScore);
                      const cfg = OUTCOME_CONFIG[outcome];
                      return (
                        <div key={pred.cotaIndex} className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium', cfg.className)}>
                          {cfg.icon}
                          <span className="tabular-nums">{pred.homeScore} × {pred.awayScore}</span>
                          <span className="opacity-70">· {cfg.label}</span>
                          {myPreds.length > 1 && <span className="opacity-50">cota {pred.cotaIndex + 1}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Matches Section ─────────────────────────────────────────────────────────
// Mostra todas as partidas do bolão com times, horário e placar (quando disponível)
function MatchesSection({ poolId, isAdmin, championshipId }: { poolId: string; isAdmin: boolean; championshipId?: string }) {
  const { data: matches, isLoading } = usePoolMatches(poolId);

  if (isLoading) return null;

  const now = new Date();
  const lockThreshold = 15 * 60 * 1000;

  // Empty state
  if (!matches || matches.length === 0) {
    return (
      <div className="rounded-xl border border-surface-lighter bg-surface/30 p-5 text-center space-y-3">
        <div className="size-12 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto">
          <span className="text-2xl">⚽</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-300">Nenhuma partida cadastrada</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isAdmin
              ? 'Cadastre as partidas para que os participantes possam fazer seus palpites.'
              : 'O administrador ainda não cadastrou as partidas deste bolão.'}
          </p>
        </div>
        {isAdmin && championshipId && (
          <Link
            href={`/admin/matches?championship=${championshipId}&fromPool=${poolId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            <ExternalLink className="size-3" />
            Cadastrar partidas agora
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
        <Trophy className="size-3.5" />
        Partidas do bolão ({matches.length})
      </p>
      <div className="rounded-xl border border-surface-lighter overflow-hidden divide-y divide-surface-lighter">
        {matches.map((match: any) => {
          const isFinished = match.status === 'FINISHED';
          const isLive     = match.status === 'LIVE';
          const hasScore   = isFinished && match.homeScoreResult !== null && match.homeScoreResult !== undefined;
          const isLocked   = !isFinished && !isLive &&
            now.getTime() > new Date(match.scheduledAt).getTime() - lockThreshold;

          return (
            <div key={match.id} className="flex items-center gap-2 px-3 py-3 bg-surface/30 hover:bg-surface/50 transition-colors">
              {/* Status / data */}
              <div className="w-14 shrink-0 text-center">
                {isLive ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                    <span className="size-1.5 rounded-full bg-red-400 animate-pulse" />
                    AO VIVO
                  </span>
                ) : isFinished ? (
                  <span className="text-[10px] text-gray-500 font-medium">Encerrado</span>
                ) : (
                  <span className="text-[10px] text-gray-500 leading-tight text-center block">
                    {format(new Date(match.scheduledAt), "dd/MM\nHH:mm", { locale: ptBR })}
                  </span>
                )}
              </div>

              {/* Home team */}
              <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                <span className={`text-xs font-semibold truncate text-right ${isFinished ? 'text-gray-300' : 'text-gray-100'}`}>
                  {match.homeTeam?.name}
                </span>
                {match.homeTeam?.logo ? (
                  <img src={match.homeTeam.logo} alt="" className="size-6 object-contain shrink-0" />
                ) : (
                  <div className="size-6 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-gray-300">{match.homeTeam?.code?.slice(0, 3)}</span>
                  </div>
                )}
              </div>

              {/* Placar ou vs */}
              <div className="w-14 shrink-0 text-center">
                {hasScore ? (
                  <span className="text-sm font-extrabold text-white tabular-nums">
                    {match.homeScoreResult} <span className="text-gray-500">×</span> {match.awayScoreResult}
                  </span>
                ) : isLive && match.homeScoreResult !== null && match.homeScoreResult !== undefined ? (
                  <span className="text-sm font-extrabold text-red-300 tabular-nums">
                    {match.homeScoreResult} <span className="text-gray-500">×</span> {match.awayScoreResult}
                  </span>
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    {isLocked && <Lock className="size-3 text-gray-600" />}
                    {!isLocked && <span className="text-xs text-gray-600">×</span>}
                  </div>
                )}
              </div>

              {/* Away team */}
              <div className="flex items-center gap-1.5 flex-1 justify-start min-w-0">
                {match.awayTeam?.logo ? (
                  <img src={match.awayTeam.logo} alt="" className="size-6 object-contain shrink-0" />
                ) : (
                  <div className="size-6 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-gray-300">{match.awayTeam?.code?.slice(0, 3)}</span>
                  </div>
                )}
                <span className={`text-xs font-semibold truncate ${isFinished ? 'text-gray-300' : 'text-gray-100'}`}>
                  {match.awayTeam?.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Live Dashboard ───────────────────────────────────────────────────────────
function LiveDashboard({ poolId, userId }: { poolId: string; userId: string }) {
  const { data: matches } = usePoolMatches(poolId);
  const { data: ranking } = useRanking(poolId);

  if (!matches || !ranking) return null;

  const liveMatches    = matches.filter((m: any) => m.status === 'LIVE');
  const finishedMatches = matches.filter(
    (m: any) => m.status === 'FINISHED' &&
      (m.homeScoreResult !== null && m.homeScoreResult !== undefined),
  );
  const activeMatches = [...liveMatches, ...finishedMatches];

  if (activeMatches.length === 0) return null;

  const hasScores    = ranking.ranking.some((r) => r.totalScore > 0);
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const top3 = ranking.ranking.slice(0, 3);
  const myEntry = ranking.ranking.find((r) => r.user.id === userId);

  return (
    <div className="rounded-2xl border border-surface-lighter overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-surface/80 border-b border-surface-lighter">
        <Flame className="size-4 text-orange-400" />
        <p className="text-sm font-semibold text-gray-100">Ao vivo · Bolão em andamento</p>
        {liveMatches.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-red-400 font-semibold">
            <span className="size-1.5 rounded-full bg-red-400 animate-pulse" />
            {liveMatches.length} ao vivo
          </span>
        )}
      </div>

      <div className="divide-y divide-surface-lighter/50">
        {/* ── Placares ── */}
        <div className="p-4 space-y-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Placares</p>
          <div className="space-y-2">
            {activeMatches.map((match: any) => {
              const isLive = match.status === 'LIVE';
              const homeScore = match.homeScoreResult ?? match.homeTeamScore;
              const awayScore = match.awayScoreResult ?? match.awayTeamScore;
              return (
                <div
                  key={match.id}
                  className={cn(
                    'rounded-xl border overflow-hidden',
                    isLive ? 'border-red-500/30' : 'border-surface-lighter',
                  )}
                >
                  {/* Status bar */}
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-1.5',
                    isLive ? 'bg-red-500/10' : 'bg-surface/60',
                  )}>
                    {isLive ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                        <span className="size-1.5 rounded-full bg-red-400 animate-pulse" />Ao vivo
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Encerrado</span>
                    )}
                    {match.roundId && (
                      <span className="text-[10px] text-gray-600">· {match.roundId}</span>
                    )}
                  </div>

                  {/* Teams + score */}
                  <div className="flex items-center px-3 py-2.5 gap-2">
                    {/* Home */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                      <span className="text-sm font-semibold text-gray-100 truncate text-right">{match.homeTeam?.name}</span>
                      {match.homeTeam?.logo
                        ? <img src={match.homeTeam.logo} alt="" className="size-6 object-contain shrink-0" />
                        : <div className="size-6 rounded-full bg-surface-light flex items-center justify-center text-[10px] font-bold text-gray-300 shrink-0">{match.homeTeam?.code}</div>}
                    </div>
                    {/* Score */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={cn(
                        'w-9 h-9 flex items-center justify-center text-lg font-bold rounded-lg border tabular-nums',
                        isLive ? 'text-red-300 border-red-500/30 bg-red-500/10' : 'text-white border-surface-lighter bg-surface',
                      )}>{homeScore ?? '-'}</span>
                      <span className="text-gray-500 text-xs font-medium">×</span>
                      <span className={cn(
                        'w-9 h-9 flex items-center justify-center text-lg font-bold rounded-lg border tabular-nums',
                        isLive ? 'text-red-300 border-red-500/30 bg-red-500/10' : 'text-white border-surface-lighter bg-surface',
                      )}>{awayScore ?? '-'}</span>
                    </div>
                    {/* Away */}
                    <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
                      {match.awayTeam?.logo
                        ? <img src={match.awayTeam.logo} alt="" className="size-6 object-contain shrink-0" />
                        : <div className="size-6 rounded-full bg-surface-light flex items-center justify-center text-[10px] font-bold text-gray-300 shrink-0">{match.awayTeam?.code}</div>}
                      <span className="text-sm font-semibold text-gray-100 truncate">{match.awayTeam?.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Classificação ── */}
        {top3.length > 0 && (
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Classificação atual
              </p>
              {hasScores && ranking.totalPot > 0 && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">
                    {ranking.leadersCount} líder{ranking.leadersCount !== 1 ? 'es' : ''}
                  </span>
                  <span className="font-semibold text-green-400">
                    {formatCurrency(ranking.prizePerLeader)} / pessoa
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              {top3.map((entry) => {
                const isMe = entry.user.id === userId;
                const isLeader = entry.position === 1 && hasScores;
                return (
                  <div
                    key={entry.user.id}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl border',
                      isLeader ? 'border-yellow-500/30 bg-yellow-500/5' :
                      isMe ? 'border-brand-500/25 bg-brand-500/5' :
                      'border-surface-lighter bg-surface/30',
                    )}
                  >
                    <div className="w-7 text-center shrink-0">
                      {medals[entry.position]
                        ? <span className="text-base">{medals[entry.position]}</span>
                        : <span className="text-xs font-bold text-gray-500">{entry.position}º</span>}
                    </div>
                    <AvatarWithInitials name={entry.user.fullName} src={entry.user.avatar} className="size-7 text-[11px] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-100 truncate">
                        {entry.user.fullName}
                        {isMe && <span className="ml-1 text-[11px] text-brand-400">(você)</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {entry.correctResults > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-green-400">
                            <Star className="size-2.5" />{entry.correctResults} exato{entry.correctResults !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn('text-base font-bold', hasScores ? 'text-brand-400' : 'text-gray-600')}>
                        {entry.totalScore} <span className="text-xs font-normal text-gray-500">pts</span>
                      </p>
                      {entry.potentialPrize > 0 && (
                        <p className="text-[11px] font-semibold text-green-400">{formatCurrency(entry.potentialPrize)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Minha posição se não estiver no top 3 */}
            {myEntry && myEntry.position > 3 && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-brand-500/25 bg-brand-500/5 mt-2">
                <div className="w-7 text-center shrink-0">
                  <span className="text-xs font-bold text-gray-400">{myEntry.position}º</span>
                </div>
                <AvatarWithInitials name={myEntry.user.fullName} src={myEntry.user.avatar} className="size-7 text-[11px] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate">
                    {myEntry.user.fullName} <span className="text-[11px] text-brand-400">(você)</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-brand-400">
                    {myEntry.totalScore} <span className="text-xs font-normal text-gray-500">pts</span>
                  </p>
                  {myEntry.potentialPrize > 0 && (
                    <p className="text-[11px] font-semibold text-green-400">{formatCurrency(myEntry.potentialPrize)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Resumo do prêmio */}
            {hasScores && ranking.totalPot > 0 && (
              <div className="flex items-center justify-between gap-3 mt-3 px-3 py-2.5 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <div className="flex items-center gap-1.5">
                  <Medal className="size-4 text-yellow-400 shrink-0" />
                  <p className="text-xs font-medium text-yellow-300">
                    {ranking.leadersCount > 1
                      ? `${ranking.leadersCount} empatados dividem o prêmio`
                      : 'Líder leva tudo'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-yellow-400">{formatCurrency(ranking.prizePerLeader)}</p>
                  <p className="text-[10px] text-gray-500">por vencedor</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Final Result Banner ──────────────────────────────────────────────────────
function FinalResultBanner({ poolId, userId }: { poolId: string; userId: string }) {
  const { data: rankingData } = useRanking(poolId);
  usePoolMembers(poolId);

  if (!rankingData) return null;

  const { hasWinner, noWinnerReason, ranking, totalPot, prizePerLeader, leadersCount } = rankingData;

  // Se ninguém ganhou (nenhum acerto)
  if (!hasWinner) {
    return (
      <div className="rounded-2xl border border-gray-500/30 bg-gray-500/10 p-5">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-gray-600/30 flex items-center justify-center shrink-0">
            <span className="text-xl">😔</span>
          </div>
          <div>
            <p className="text-base font-bold text-gray-200">Bolão encerrado — sem ganhadores</p>
            <p className="text-sm text-gray-400 mt-1">{noWinnerReason ?? 'Nenhum participante acertou qualquer resultado.'}</p>
            {totalPot > 0 && (
              <p className="text-xs text-gray-500 mt-2">O prêmio acumulado de <span className="text-yellow-400 font-semibold">{formatCurrency(totalPot)}</span> foi retido pelo sistema.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Há ganhadores — buscar os líderes
  const leaders = ranking.filter((r) => r.position === 1 && r.totalScore > 0);
  if (leaders.length === 0) return null;

  const isIWinner = leaders.some((l) => l.user.id === userId);

  if (leaders.length === 1) {
    const winner = leaders[0];
    const isMe = winner.user.id === userId;
    return (
      <div className={`rounded-2xl border p-5 ${isMe
        ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/15 to-amber-600/10'
        : 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-600/5'
      }`}>
        <div className="flex items-start gap-3">
          <div className="size-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center shrink-0 text-2xl">
            🏆
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1">Bolão encerrado · Ganhador</p>
            <p className="text-lg font-bold text-gray-50 truncate">
              {isMe ? '🎉 Você ganhou!' : winner.user.fullName}
            </p>
            {prizePerLeader > 0 && (
              <p className={`text-2xl font-bold mt-1 ${isMe ? 'text-yellow-300' : 'text-yellow-400'}`}>
                {formatCurrency(prizePerLeader)}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-gray-400">
              <span>{winner.totalScore} pontos</span>
              <span>·</span>
              <span>{winner.correctResults} placar{winner.correctResults !== 1 ? 'es' : ''} exato{winner.correctResults !== 1 ? 's' : ''}</span>
              {winner.user.pixKey && isMe && (
                <span className="text-green-400">PIX: {winner.user.pixKey}</span>
              )}
            </div>
            {winner.prizePaidAt && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-green-400">
                <CheckCircle2 className="size-3.5 shrink-0" />
                Prêmio enviado em {format(new Date(winner.prizePaidAt), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Múltiplos ganhadores
  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-600/5 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">🤝</span>
        <div>
          <p className="text-base font-bold text-yellow-300">
            {isIWinner ? '🎉 Você está entre os ganhadores!' : `${leadersCount} ganhadores empatados`}
          </p>
          {prizePerLeader > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">
              {formatCurrency(prizePerLeader)} por pessoa · {formatCurrency(totalPot)} total em caixa
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {leaders.map((winner) => {
          const isMe = winner.user.id === userId;
          return (
            <div key={winner.user.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${isMe ? 'border-yellow-500/40 bg-yellow-500/10' : 'border-yellow-500/20 bg-yellow-500/5'}`}>
              <AvatarWithInitials name={winner.user.fullName} src={winner.user.avatar} className="size-8 text-xs shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-100 truncate">
                  {winner.user.fullName}{isMe && <span className="ml-1 text-yellow-400">(você)</span>}
                </p>
                <p className="text-xs text-gray-500">{winner.totalScore} pts · {winner.correctResults} exato{winner.correctResults !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-right shrink-0">
                {prizePerLeader > 0 && <p className="text-sm font-bold text-yellow-400">{formatCurrency(prizePerLeader)}</p>}
                {winner.prizePaidAt && <p className="text-xs text-green-400">✓ Pago</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Prize Banner ─────────────────────────────────────────────────────────────
function PrizeBanner({ poolId, onGoToPayment }: { poolId: string; onGoToPayment: () => void }) {
  const { data: prize } = usePrizeInfo(poolId);

  if (!prize || prize.entryFee === 0) return null;

  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-amber-600/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-5 w-5 text-yellow-400" />
        <p className="text-sm font-semibold text-yellow-300">Prêmio em jogo</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-black/30 p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">💰 Total em caixa</p>
          <p className="text-2xl font-bold text-yellow-400">{formatCurrency(prize.totalPot)}</p>
          <p className="text-xs text-gray-500 mt-0.5">{prize.confirmedMembers} participante(s) · {prize.totalCotas} cota(s)</p>
        </div>
        <div className="rounded-xl bg-black/30 p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">🏆 Se ganhar sozinho</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(prize.potentialWinIfAlone)}</p>
          <p className="text-xs text-gray-500 mt-0.5">sua entrada: {formatCurrency(prize.myContribution)}</p>
        </div>
      </div>
      {prize.myStatus === 'PENDING' && (
        <button
          onClick={onGoToPayment}
          className="w-full flex items-center justify-center gap-2 mt-3 py-2 px-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs font-medium text-yellow-400 hover:bg-yellow-500/20 transition-colors"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Seu pagamento ainda não foi confirmado — ir para Pagamento
        </button>
      )}
    </div>
  );
}

type ScoreMap = Record<string, { homeScore: string; awayScore: string }>;

// ─── Predictions Tab ──────────────────────────────────────────────────────────
function PredictionsTab({ poolId, member }: { poolId: string; member: any }) {
  const { data: matches, isLoading: loadingMatches } = usePoolMatches(poolId);
  const { data: myPredictions, isLoading: loadingPreds } = usePredictions(poolId);
  const { mutate: save, isPending: saving } = useSavePredictions();
  const { mutate: cancelPreds, isPending: cancelling } = useCancelPredictions();

  const numCotas = member?.numCotas ?? 1;
  const isConfirmed = member?.status === 'CONFIRMED';

  // scores = valores actuais nos inputs
  const [scores, setScores] = useState<Record<number, ScoreMap>>({});
  // savedSnapshot = o que estava no servidor quando foi confirmado o save
  const [savedSnapshot, setSavedSnapshot] = useState<Record<number, ScoreMap>>({});
  const [activeCota, setActiveCota] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Inicializar scores e savedSnapshot quando predictions chegam do servidor
  useEffect(() => {
    if (!myPredictions) return;
    const init: Record<number, ScoreMap> = {};
    myPredictions.forEach((p: any) => {
      const ci = p.cotaIndex ?? 0;
      if (!init[ci]) init[ci] = {};
      init[ci][p.matchId] = { homeScore: String(p.homeScore ?? ''), awayScore: String(p.awayScore ?? '') };
    });
    setScores(init);
    setSavedSnapshot(init); // snapshot = o que veio do servidor
  }, [myPredictions]);

  const handleChange = (matchId: string, home: string, away: string) => {
    setScores((prev) => ({
      ...prev,
      [activeCota]: { ...(prev[activeCota] ?? {}), [matchId]: { homeScore: home, awayScore: away } },
    }));
  };

  // Verificar se um palpite mudou em relação ao snapshot salvo
  const isDirty = (cotaIndex: number, matchId: string): boolean => {
    const current = scores[cotaIndex]?.[matchId];
    const saved = savedSnapshot[cotaIndex]?.[matchId];
    if (!current && !saved) return false;
    if (!current || !saved) return !!(current?.homeScore || current?.awayScore);
    return current.homeScore !== saved.homeScore || current.awayScore !== saved.awayScore;
  };

  // Há algum palpite preenchido e alterado na cota ativa?
  const hasDirtyPredictions = Object.entries(scores[activeCota] ?? {}).some(
    ([matchId, v]) => v.homeScore !== '' && v.awayScore !== '' && isDirty(activeCota, matchId)
  );
  // Há algum palpite salvo na cota ativa?
  const hasSavedPredictions = Object.keys(savedSnapshot[activeCota] ?? {}).length > 0;

  const handleSave = () => {
    const cotaScores = scores[activeCota] ?? {};
    const predictions = Object.entries(cotaScores)
      .filter(([, v]) => v.homeScore !== '' && v.awayScore !== '')
      .map(([matchId, v]) => ({
        matchId,
        homeScore: Number(v.homeScore),
        awayScore: Number(v.awayScore),
        cotaIndex: activeCota,
      }));

    if (!predictions.length) { toast.error('Preencha pelo menos um palpite'); return; }

    save({ poolId, predictions }, {
      onSuccess: () => {
        setSavedSnapshot((prev) => ({
          ...prev,
          [activeCota]: { ...(scores[activeCota] ?? {}) },
        }));
        setEditMode(false);
      },
    });
  };

  if (loadingMatches || loadingPreds) return <CardSkeleton />;

  if (!matches?.length) return <EmptyState icon={Trophy} title="Nenhuma partida" description="O administrador ainda não cadastrou partidas neste campeonato" />;

  const isMatchOpen = (m: any) => {
    if (m.status === 'FINISHED' || m.status === 'LIVE') return false;
    const lockTime = new Date(new Date(m.scheduledAt).getTime() - 15 * 60 * 1000);
    return new Date() <= lockTime;
  };

  const finished = matches.filter((m: any) => m.status === 'FINISHED');
  const live = matches.filter((m: any) => m.status === 'LIVE');
  const open = matches.filter((m: any) => isMatchOpen(m));
  const locked = matches.filter((m: any) => {
    if (m.status === 'FINISHED' || m.status === 'LIVE') return false;
    const lockTime = new Date(new Date(m.scheduledAt).getTime() - 15 * 60 * 1000);
    return new Date() > lockTime;
  });

  return (
    <div className="space-y-4">
      {/* Aviso para PENDING — pode palpitar mas só entra no grupo após pagamento */}
      {!isConfirmed && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 flex items-start gap-2.5">
          <Clock className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-300">Pagamento pendente</p>
            <p className="text-xs text-yellow-400/80 mt-0.5">Seus palpites ficam salvos, mas só aparecem para o grupo após confirmar o pagamento na aba 💳</p>
          </div>
        </div>
      )}

      {/* Cota selector */}
      {numCotas > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: numCotas }, (_, i) => i).map((ci) => {
            const snap = savedSnapshot[ci] ?? {};
            const saved = Object.keys(snap).length;
            const dirty = Object.entries(scores[ci] ?? {}).some(
              ([mid, v]) => v.homeScore !== '' && v.awayScore !== '' && isDirty(ci, mid)
            );
            return (
              <button key={ci} onClick={() => setActiveCota(ci)}
                className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors relative ${
                  activeCota === ci ? 'border-brand-500 bg-brand-600/20 text-brand-300' : 'border-surface-lighter text-gray-400 hover:border-gray-500'
                }`}>
                Cota {ci + 1}
                {dirty
                  ? <span className="ml-1 text-xs text-orange-400">●</span>
                  : saved > 0
                  ? <span className="ml-1 text-xs text-green-400">✓</span>
                  : null}
              </button>
            );
          })}
        </div>
      )}

      {/* Resumo dos palpites salvos */}
      {hasSavedPredictions && !hasDirtyPredictions && !editMode && (
        <div className="rounded-xl border border-surface-lighter overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-lighter bg-surface/40">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <p className="text-sm font-semibold text-gray-100">
                Palpites salvos{numCotas > 1 ? ` — Cota ${activeCota + 1}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {/* Excluir só para PENDING (confirmados não podem cancelar palpites) */}
              {!isConfirmed && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Excluir
                </Button>
              )}
              {/* Editar disponível para todos enquanto houver partidas abertas */}
              {open.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Editar
                </Button>
              )}
            </div>
          </div>

          {/* Lista de palpites */}
          <div className="divide-y divide-surface-lighter/50">
            {Object.entries(savedSnapshot[activeCota] ?? {}).map(([matchId, s]) => {
              const match = matches.find((m: any) => m.id === matchId);
              if (!match) return null;
              return (
                <div key={matchId} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm text-gray-300 truncate flex-1 mr-3">
                    {match.homeTeam?.name} <span className="text-gray-500">vs</span> {match.awayTeam?.name}
                  </span>
                  <span className="font-mono font-bold text-sm text-gray-100 shrink-0">
                    {s.homeScore} × {s.awayScore}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Confirmação de exclusão inline */}
          {showCancelConfirm && !isConfirmed && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-surface-lighter bg-surface/60">
              <p className="text-sm text-gray-300">
                Excluir palpites{numCotas > 1 ? ` da Cota ${activeCota + 1}` : ''}?
              </p>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setShowCancelConfirm(false)}>
                  Não
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={cancelling}
                  onClick={() => {
                    cancelPreds({ poolId, cotaIndex: activeCota }, {
                      onSuccess: () => {
                        setSavedSnapshot((p) => { const n = { ...p }; delete n[activeCota]; return n; });
                        setScores((p) => { const n = { ...p }; delete n[activeCota]; return n; });
                        setShowCancelConfirm(false);
                      },
                    });
                  }}
                >
                  {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Excluir'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info: pagamento confirmado e ainda há partidas abertas para palpitar */}
      {isConfirmed && open.length > 0 && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
          <p className="text-xs text-green-300 leading-relaxed">
            Pagamento confirmado ✓ — você pode palpitar até 15 minutos antes de cada partida.
          </p>
        </div>
      )}
      {/* Info: todas as partidas já estão encerradas/bloqueadas */}
      {isConfirmed && open.length === 0 && hasSavedPredictions && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
          <p className="text-xs text-green-300 leading-relaxed">
            Palpites registrados — o prazo para alterações foi encerrado.
          </p>
        </div>
      )}

      {/* Partidas abertas para palpite — disponível para PENDING e CONFIRMED */}
      {open.length > 0 && (!hasSavedPredictions || hasDirtyPredictions || editMode) && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Próximas partidas</p>
          {open.map((m: any) => {
            const s = scores[activeCota]?.[m.id] ?? { homeScore: '', awayScore: '' };
            const dirty = isDirty(activeCota, m.id);
            return (
              <div key={m.id} className={`relative ${dirty ? 'ring-1 ring-orange-500/30 rounded-xl' : ''}`}>
                {dirty && (
                  <span className="absolute top-2 right-2 z-10 text-xs text-orange-400 font-semibold">não salvo</span>
                )}
                <MatchRow match={m} homeScore={s.homeScore} awayScore={s.awayScore} onChange={(h, a) => handleChange(m.id, h, a)} />
              </div>
            );
          })}

          {/* Botão de salvar com estado visual claro */}
          <button
            onClick={handleSave}
            disabled={saving || !hasDirtyPredictions && hasSavedPredictions}
            className={`w-full mt-2 py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              saving
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : hasDirtyPredictions
                ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</>
            ) : hasDirtyPredictions ? (
              <>{numCotas > 1 ? `Salvar Palpites — Cota ${activeCota + 1}` : 'Salvar Palpites'}</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" />Palpites já salvos</>
            )}
          </button>

        </div>
      )}

      {/* Partidas ao vivo */}
      {live.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
            Ao vivo agora
          </p>
          {live.map((m: any) => {
            const s = scores[activeCota]?.[m.id] ?? { homeScore: '', awayScore: '' };
            return <MatchRow key={m.id} match={m} homeScore={s.homeScore} awayScore={s.awayScore} onChange={() => {}} />;
          })}
        </div>
      )}

      {/* Partidas bloqueadas */}
      {locked.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Lock className="h-3 w-3" /> Palpites encerrados
            </p>
            <p className="text-xs text-gray-600">Prazo: 15 min antes do jogo</p>
          </div>
          {locked.map((m: any) => {
            const s = savedSnapshot[activeCota]?.[m.id];
            const lockTime = new Date(new Date(m.scheduledAt).getTime() - 15 * 60 * 1000);
            return (
              <div key={m.id} className="rounded-xl border border-surface-lighter p-3 opacity-60">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>{m.roundId || ''}</span>
                  <span className="flex items-center gap-1">
                    Encerrou às {format(lockTime, "HH:mm", { locale: ptBR })}
                    <Lock className="h-3 w-3 ml-1" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="text-sm text-gray-300">{m.homeTeam?.name}</span>
                    {m.homeTeam?.logo && <img src={m.homeTeam.logo} alt="" className="h-6 w-6 object-contain" />}
                  </div>
                  <div className="px-4 text-center">
                    {s ? (
                      <span className="text-sm font-bold text-gray-300">{s.homeScore} × {s.awayScore}</span>
                    ) : (
                      <span className="text-xs text-gray-600">sem palpite</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    {m.awayTeam?.logo && <img src={m.awayTeam.logo} alt="" className="h-6 w-6 object-contain" />}
                    <span className="text-sm text-gray-300">{m.awayTeam?.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Partidas encerradas (com resultado) */}
      {finished.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Partidas encerradas</p>
          {finished.map((m: any) => {
            const s = scores[activeCota]?.[m.id] ?? { homeScore: '', awayScore: '' };
            return <MatchRow key={m.id} match={m} homeScore={s.homeScore} awayScore={s.awayScore} onChange={() => {}} />;
          })}
        </div>
      )}

      {/* Nenhuma partida aberta */}
      {open.length === 0 && live.length === 0 && locked.length === 0 && (
        <div className="rounded-xl border border-gray-600/30 bg-gray-500/10 p-5 text-center">
          <Lock className="h-7 w-7 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-300">Nenhuma partida disponível</p>
          <p className="text-xs text-gray-500 mt-1">Aguarde as partidas serem cadastradas pelo organizador</p>
        </div>
      )}
    </div>
  );
}

// ─── Group Predictions Tab ────────────────────────────────────────────────────
function GroupPredictionsTab({ poolId, userId }: { poolId: string; userId: string }) {
  const { data, isLoading } = useGroupPredictions(poolId);

  if (isLoading) return <CardSkeleton />;

  if (!data) return null;

  const { myStatus, confirmedCount, matches } = data;
  const amIPending = myStatus === 'PENDING';

  if (confirmedCount === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum palpite ainda"
        description="Os palpites dos participantes confirmados aparecerão aqui"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner para PENDING */}
      {amIPending && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 flex items-start gap-2.5">
          <Clock className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-400/80">Seus palpites entrarão nesta lista após confirmar o pagamento</p>
        </div>
      )}

      <p className="text-xs text-gray-500">{confirmedCount} participante(s) confirmado(s)</p>

      {matches.map(({ match, predictions }) => {
        if (!predictions.length) return null;

        const isFinished = match.status === 'FINISHED';
        const isLive = match.status === 'LIVE';

        return (
          <div key={match.id} className="rounded-xl border border-surface-lighter overflow-hidden">
            {/* Match header */}
            <div className="bg-surface/60 px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-gray-500">{match.roundId || ''}</span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  {isLive && (
                    <span className="flex items-center gap-1 text-red-400 font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />Ao vivo
                    </span>
                  )}
                  {isFinished && <span className="text-gray-500">Encerrado</span>}
                  {!isLive && !isFinished && (
                    <>
                      <span>{format(new Date(match.scheduledAt), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                      <MatchCountdown scheduledAt={match.scheduledAt} />
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-1.5 flex-1 justify-end">
                  {match.homeTeam?.logo
                    ? <img src={match.homeTeam.logo} alt="" className="h-6 w-6 object-contain" />
                    : <div className="h-6 w-6 rounded-full bg-surface-light flex items-center justify-center text-xs font-bold text-gray-300">{match.homeTeam?.code}</div>}
                  <span className="text-sm font-semibold text-gray-100 text-right">{match.homeTeam?.name}</span>
                </div>
                {isFinished && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="w-8 h-8 flex items-center justify-center text-base font-bold text-white rounded bg-surface border border-surface-lighter">{match.homeScoreResult ?? '-'}</span>
                    <span className="text-gray-600 text-xs">×</span>
                    <span className="w-8 h-8 flex items-center justify-center text-base font-bold text-white rounded bg-surface border border-surface-lighter">{match.awayScoreResult ?? '-'}</span>
                  </div>
                )}
                {!isFinished && <span className="text-gray-600 shrink-0">vs</span>}
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-sm font-semibold text-gray-100">{match.awayTeam?.name}</span>
                  {match.awayTeam?.logo
                    ? <img src={match.awayTeam.logo} alt="" className="h-6 w-6 object-contain" />
                    : <div className="h-6 w-6 rounded-full bg-surface-light flex items-center justify-center text-xs font-bold text-gray-300">{match.awayTeam?.code}</div>}
                </div>
              </div>
            </div>

            {/* Member predictions */}
            <div className="divide-y divide-surface-lighter/50">
              {predictions.map((p) => {
                const isMe = p.userId === userId;
                const homeScore = p.homeScore;
                const awayScore = p.awayScore;

                const hitExact = isFinished &&
                  match.homeScoreResult != null && match.awayScoreResult != null &&
                  homeScore === match.homeScoreResult && awayScore === match.awayScoreResult;

                return (
                  <div
                    key={`${p.userId}-${p.cotaIndex}`}
                    className={`flex items-center gap-3 px-4 py-2.5 ${isMe ? 'bg-brand-600/10' : ''}`}
                  >
                    <AvatarWithInitials name={p.user.fullName} src={p.user.avatar} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">
                        {p.user.fullName}
                        {isMe && <span className="ml-1 text-xs text-brand-400">(você)</span>}
                      </p>
                      {p.cotaIndex > 0 && (
                        <p className="text-xs text-gray-500">Cota {p.cotaIndex + 1}</p>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 shrink-0 ${hitExact ? 'text-green-400' : 'text-gray-300'}`}>
                      <span className="font-mono font-bold text-base">{homeScore}</span>
                      <span className="text-gray-500 text-xs">×</span>
                      <span className="font-mono font-bold text-base">{awayScore}</span>
                      {hitExact && <CheckCircle2 className="h-3.5 w-3.5 ml-0.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Payment Tab ──────────────────────────────────────────────────────────────
function PaymentTab({
  poolId, isOrganizer, myMember, isAdmin,
}: { poolId: string; isOrganizer: boolean; myMember: any; isAdmin?: boolean }) {
  const router = useRouter();
  const { data: payment, isLoading } = usePaymentStatus(poolId);
  const { mutate: generate, isPending: generating } = useGeneratePayment();
  const { mutate: notifyPaid, isPending: notifying } = useNotifyPaymentSent();
  const { mutate: upload, isPending: uploading } = useUploadPaymentProof();
  const { mutate: leave, isPending: leaving } = useLeavePool();
  const { mutate: deletePool, isPending: deleting } = useDeletePool();
  const { mutate: updateMember, isPending: confirmingOwn } = useUpdateMemberStatus();
  const { mutate: updatePool, isPending: savingPixKey } = useUpdatePool();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pixData, setPixData] = useState<{ payload: string; qr: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [notified, setNotified] = useState(false);
  const [pixKeyInput, setPixKeyInput] = useState('');

  if (isLoading) return <CardSkeleton />;
  if (!payment) return null;

  const isPaid = payment.paymentStatus === 'PAID';
  const isFree = payment.entryFee === 0;
  const isPendingMember = myMember?.status === 'PENDING';
  const canCancel = !isOrganizer && isPendingMember;
  // Admin que foi adicionado incorretamente como membro pode se remover
  const canLeaveAsAdmin = isAdmin && isOrganizer && !!myMember && payment.paymentStatus !== 'NOT_MEMBER';

  // Payload PIX vem do backend (status ou generate response)
  const activePixPayload = pixData?.payload ?? payment.pixPayload;
  const activeQrCode = pixData?.qr ?? payment.qrCodeBase64;

  const handleGenerate = () => {
    generate(poolId, {
      onSuccess: (data) => {
        if (data.pixPayload && data.qrCodeBase64) {
          setPixData({ payload: data.pixPayload, qr: data.qrCodeBase64 });
        }
      },
    });
  };

  const handleCopy = () => {
    if (activePixPayload) {
      navigator.clipboard.writeText(activePixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload({ poolId, file });
  };

  const handleCancel = () => {
    leave(poolId, { onSuccess: () => router.push('/pools') });
  };

  return (
    <div className="space-y-4">

      {/* ── Status card ── */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-300">
            {isFree ? 'Minha participação' : 'Meu pagamento'}
          </p>

          {/* Bolão gratuito */}
          {isFree && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-300">Bolão gratuito</p>
                <p className="text-xs text-gray-400 mt-0.5">Nenhum pagamento necessário — participação confirmada automaticamente.</p>
              </div>
            </div>
          )}

          {/* Bolão pago */}
          {!isFree && (
            <>
              {/* Resumo valor */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-surface-lighter">
                <div>
                  <p className="text-xs text-gray-500">{payment.numCotas} cota{payment.numCotas > 1 ? 's' : ''} × {formatCurrency(payment.entryFee)}</p>
                  <p className="text-2xl font-bold text-brand-400 mt-0.5">{formatCurrency(payment.totalAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  {isPaid
                    ? <span className="flex items-center gap-1 text-sm font-semibold text-green-400"><CheckCircle2 className="h-3.5 w-3.5" /> Confirmado</span>
                    : payment.paymentStatus === 'PENDING'
                      ? <span className="flex items-center gap-1 text-sm font-semibold text-yellow-400"><Clock className="h-3.5 w-3.5" /> Aguardando</span>
                      : payment.paymentStatus === 'FAILED'
                        ? <span className="flex items-center gap-1 text-sm font-semibold text-red-400"><AlertTriangle className="h-3.5 w-3.5" /> Não confirmado</span>
                        : <span className="flex items-center gap-1 text-sm font-semibold text-gray-400"><Clock className="h-3.5 w-3.5" /> Pendente</span>}
                </div>
              </div>

              {/* Pago e confirmado */}
              {isPaid && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-300">Pagamento confirmado</p>
                    {payment.paidAt && <p className="text-xs text-gray-400 mt-0.5">em {formatDate(payment.paidAt)}</p>}
                  </div>
                </div>
              )}

              {/* Pagamento rejeitado */}
              {payment.paymentStatus === 'FAILED' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">Seu pagamento não foi confirmado. Entre em contato com o organizador.</p>
                </div>
              )}

              {/* Organizador PENDING — pode auto-confirmar (ele controla os pagamentos do bolão) */}
              {isOrganizer && !isPaid && myMember?.status === 'PENDING' && (
                <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Banknote className="h-4 w-4 text-brand-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-brand-300">Confirme sua própria participação</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Como organizador, você controla o bolão. Após realizar seu pagamento, clique abaixo para confirmar sua entrada.
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => updateMember({ poolId, memberId: myMember.userId, status: 'CONFIRMED' })}
                    disabled={confirmingOwn}
                  >
                    {confirmingOwn
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Confirmando...</>
                      : <><CheckCircle2 className="h-4 w-4" /> Confirmar minha participação</>}
                  </Button>
                </div>
              )}

              {/* PIX não configurado — organizador pode configurar */}
              {!payment.hasPixKey && !isPaid && isOrganizer && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Banknote className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-300">Configure sua chave PIX</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Informe sua chave PIX para que os participantes possam pagar a entrada do bolão.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={pixKeyInput}
                      onChange={(e) => setPixKeyInput(e.target.value)}
                      placeholder="CPF, email, celular ou chave aleatória"
                      className="flex-1 text-sm"
                    />
                    <Button
                      size="sm"
                      disabled={!pixKeyInput.trim() || savingPixKey}
                      onClick={() => updatePool({ poolId, data: { pixKey: pixKeyInput.trim() } as any }, {
                        onSuccess: () => setPixKeyInput(''),
                      })}
                    >
                      {savingPixKey ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                    </Button>
                  </div>
                </div>
              )}

              {/* PIX não configurado — aviso para participantes */}
              {!payment.hasPixKey && !isPaid && !isOrganizer && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-300">Pagamento não disponível</p>
                    <p className="text-xs text-gray-400 mt-0.5">O organizador ainda não configurou a chave PIX. Aguarde ou entre em contato.</p>
                  </div>
                </div>
              )}

              {/* Botão para solicitar / exibir PIX */}
              {!isOrganizer && !isPaid && payment.hasPixKey && payment.paymentStatus === 'NOT_REQUESTED' && (
                <Button className="w-full" onClick={handleGenerate} disabled={generating}>
                  {generating
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando...</>
                    : <><CreditCard className="h-4 w-4 mr-2" /> Gerar instruções de pagamento</>}
                </Button>
              )}

              {/* QR Code PIX */}
              {!isPaid && (activePixPayload || payment.paymentStatus === 'PENDING') && (
                <>
                  {activeQrCode ? (
                    <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white">
                      <img src={activeQrCode} alt="QR Code PIX" className="w-48 h-48" />
                      <p className="text-xs text-gray-700 font-medium">Escaneie para pagar via PIX</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface border border-surface-lighter">
                      <ImageIcon className="h-10 w-10 text-gray-600" />
                      <p className="text-xs text-gray-500">QR Code não disponível — use o Pix Copia e Cola abaixo</p>
                    </div>
                  )}

                  {/* Pix Copia e Cola */}
                  {activePixPayload && (
                    <div className="rounded-xl border border-surface-lighter overflow-hidden">
                      <div className="px-3 py-2 bg-surface/60 border-b border-surface-lighter">
                        <p className="text-xs font-semibold text-gray-300">Pix Copia e Cola</p>
                      </div>
                      <div className="flex items-center gap-2 p-3">
                        <p className="flex-1 text-xs text-gray-400 font-mono break-all line-clamp-2 leading-relaxed">
                          {activePixPayload}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className={cn('shrink-0 gap-1.5 transition-colors', copied && 'border-green-500 text-green-400')}
                          onClick={handleCopy}
                        >
                          {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? 'Copiado!' : 'Copiar'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Instrução + botão de confirmação */}
                  {notified || payment.paymentStatus === 'PENDING' ? (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <Clock className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-yellow-300">Pagamento enviado para análise</p>
                        <p className="text-xs text-yellow-400/70 mt-0.5">Aguarde a confirmação do administrador. Você receberá uma notificação em breve.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Instrução contextual */}
                      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-brand-500/10 border border-brand-500/20">
                        <CheckCircle2 className="h-4 w-4 text-brand-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-brand-300 leading-relaxed">
                          Após realizar o PIX, clique no botão abaixo para avisar o administrador e ter seu pagamento confirmado.
                        </p>
                      </div>
                      <Button
                        className="w-full gap-2"
                        onClick={() => notifyPaid(poolId, { onSuccess: () => setNotified(true) })}
                        disabled={notifying}
                      >
                        {notifying
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                          : <><CheckCircle2 className="h-4 w-4" /> Já realizei o pagamento</>}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Upload de comprovante */}
              {!isPaid && payment.paymentStatus === 'PENDING' && (
                <div>
                  <p className="text-xs font-medium text-gray-400 mb-2">Comprovante de pagamento (opcional)</p>
                  {payment.paymentProofUrl ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                      <p className="text-xs text-green-300 flex-1">Comprovante enviado</p>
                      <a
                        href={payment.paymentProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
                      >
                        <ExternalLink className="h-3 w-3" /> Ver
                      </a>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 w-full h-11 rounded-lg border border-dashed border-surface-lighter text-gray-500 hover:border-brand-500/50 hover:text-gray-300 cursor-pointer transition-colors text-sm">
                      {uploading
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                        : <><Upload className="h-4 w-4" /> Anexar comprovante</>}
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.webp"
                        className="sr-only"
                        disabled={uploading}
                        onChange={handleProofUpload}
                      />
                    </label>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Cancelar inscrição */}
      {canCancel && (
        <Card className="border-red-500/20">
          <CardContent className="p-4">
            {!showCancelConfirm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-200">Cancelar inscrição</p>
                  <p className="text-xs text-gray-500 mt-0.5">Disponível enquanto o pagamento não for confirmado</p>
                </div>
                <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500" onClick={() => setShowCancelConfirm(true)}>
                  Cancelar inscrição
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-300">Confirmar cancelamento?</p>
                    <p className="text-xs text-gray-400 mt-0.5">Você sairá do bolão. Após confirmar o pagamento, não será mais possível cancelar.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowCancelConfirm(false)}>Não, ficar</Button>
                  <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleCancel} disabled={leaving}>
                    {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sim, cancelar'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin removendo participação indevida */}
      {canLeaveAsAdmin && (
        <Card className="border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-yellow-300">Sua participação como admin</p>
                <p className="text-xs text-gray-500 mt-0.5">Você foi adicionado antes do fix. Remova para não contar como participante.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 shrink-0"
                disabled={leaving}
                onClick={handleCancel}
              >
                {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Me remover'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Excluir bolão */}
      {isOrganizer && (
        <Card className="border-red-500/20">
          <CardContent className="p-4">
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-200">Excluir bolão</p>
                  <p className="text-xs text-gray-500 mt-0.5">Disponível enquanto nenhum participante confirmou o pagamento</p>
                </div>
                <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500" onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-300">Excluir o bolão permanentemente?</p>
                    <p className="text-xs text-gray-400 mt-0.5">Todos os palpites e dados serão removidos. Esta ação não pode ser desfeita.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    disabled={deleting}
                    onClick={() => deletePool(poolId, { onSuccess: () => router.push('/pools') })}
                  >
                    {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Sim, excluir'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Results Tab ──────────────────────────────────────────────────────────────
function ResultsTab({ poolId, userId }: { poolId: string; userId: string }) {
  const { data: groupData, isLoading: loadingGroup } = useGroupPredictions(poolId);
  const { data: rankingData, isLoading: loadingRanking } = useRanking(poolId);

  if (loadingGroup || loadingRanking) return <CardSkeleton />;
  if (!groupData || !rankingData) return null;

  const finishedMatches = groupData.matches.filter(
    ({ match }) => match.status === 'FINISHED' &&
      match.homeScoreResult !== null && match.homeScoreResult !== undefined,
  );

  if (finishedMatches.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Nenhum jogo encerrado ainda"
        description="Os resultados aparecem aqui assim que as partidas forem finalizadas"
      />
    );
  }

  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  // Collect all unique members who have predictions
  const memberSet = new Map<string, { id: string; fullName: string; avatar?: string | null }>();
  groupData.matches.forEach(({ predictions }) => {
    predictions.forEach((p) => {
      if (!memberSet.has(p.userId)) memberSet.set(p.userId, p.user);
    });
  });
  const members = Array.from(memberSet.values());

  return (
    <div className="space-y-5">
      {/* ── Placar geral ── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Placar geral</p>
        {rankingData.ranking.map((entry) => {
          const isMe = entry.user.id === userId;
          const isLeader = entry.position === 1 && entry.totalScore > 0;

          // Só exato ou errou
          let exact = 0; let miss = 0;
          finishedMatches.forEach(({ match, predictions }) => {
            const homeR = match.homeScoreResult!;
            const awayR = match.awayScoreResult!;
            predictions.filter((p) => p.userId === entry.user.id).forEach((p) => {
              if (getPredictionOutcome(homeR, awayR, p.homeScore, p.awayScore) === 'exact') exact++;
              else miss++;
            });
          });

          return (
            <div key={entry.user.id} className={cn(
              'flex items-center gap-3 p-3 rounded-xl border transition-colors',
              isLeader ? 'border-yellow-500/40 bg-yellow-500/5' :
              isMe ? 'border-brand-500/30 bg-brand-500/5' :
              'border-surface-lighter bg-surface/30',
            )}>
              <div className="w-8 text-center shrink-0">
                {medals[entry.position]
                  ? <span className="text-lg">{medals[entry.position]}</span>
                  : <span className="text-sm font-bold text-gray-400">{entry.position}º</span>}
              </div>
              <AvatarWithInitials name={entry.user.fullName} src={entry.user.avatar} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-100 truncate">
                  {entry.user.fullName}
                  {isMe && <span className="ml-1.5 text-xs text-brand-400">(você)</span>}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {exact > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-400">
                      <Star className="size-2.5" />{exact} exato{exact !== 1 ? 's' : ''}
                    </span>
                  )}
                  {miss > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
                      <X className="size-2.5" />{miss}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-brand-400">{entry.totalScore} <span className="text-xs font-normal text-gray-500">pts</span></p>
                {entry.potentialPrize > 0 && (
                  <p className="text-xs font-semibold text-green-400">{formatCurrency(entry.potentialPrize)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Partidas encerradas ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Partidas & Palpites</p>
        {finishedMatches.map(({ match, predictions }) => {
          const homeR = match.homeScoreResult!;
          const awayR = match.awayScoreResult!;
          return (
            <Card key={match.id} className="overflow-hidden">
              {/* Match header */}
              <div className="bg-surface/60 px-4 py-3 border-b border-surface-lighter/50">
                <div className="flex items-center justify-between mb-2">
                  {match.roundId && <span className="text-xs text-gray-500">{match.roundId}</span>}
                  <span className="text-xs text-gray-600 ml-auto">Encerrado</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {match.homeTeam?.logo && <img src={match.homeTeam.logo} alt="" className="size-7 object-contain" />}
                    <span className="text-sm font-semibold text-gray-100 text-right truncate max-w-[90px]">{match.homeTeam?.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 px-2">
                    <span className="size-9 flex items-center justify-center text-lg font-bold text-white rounded-lg bg-surface border border-surface-lighter">{homeR}</span>
                    <span className="text-gray-600 text-xs">×</span>
                    <span className="size-9 flex items-center justify-center text-lg font-bold text-white rounded-lg bg-surface border border-surface-lighter">{awayR}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-semibold text-gray-100 truncate max-w-[90px]">{match.awayTeam?.name}</span>
                    {match.awayTeam?.logo && <img src={match.awayTeam.logo} alt="" className="size-7 object-contain" />}
                  </div>
                </div>
              </div>

              {/* Member predictions grid */}
              <CardContent className="pt-3 pb-3 space-y-1.5">
                {members.map((member) => {
                  const memberPreds = predictions.filter((p) => p.userId === member.id);
                  const isMe = member.id === userId;
                  if (memberPreds.length === 0) {
                    return (
                      <div key={member.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg opacity-40">
                        <AvatarWithInitials name={member.fullName} src={member.avatar ?? undefined} className="size-6 text-[10px]" />
                        <p className="text-xs text-gray-500 flex-1 truncate">{member.fullName}{isMe && ' (você)'}</p>
                        <p className="text-xs text-gray-600">—</p>
                      </div>
                    );
                  }
                  return (
                    <div key={member.id} className={cn(
                      'flex items-center gap-2.5 px-2 py-1.5 rounded-lg',
                      isMe ? 'bg-brand-500/8' : '',
                    )}>
                      <AvatarWithInitials name={member.fullName} src={member.avatar ?? undefined} className="size-6 text-[10px]" />
                      <p className="text-xs font-medium text-gray-200 flex-1 truncate">
                        {member.fullName}{isMe && <span className="ml-1 text-brand-400">(você)</span>}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {memberPreds.map((p) => {
                          const outcome = getPredictionOutcome(homeR, awayR, p.homeScore, p.awayScore);
                          const cfg = OUTCOME_CONFIG[outcome];
                          return (
                            <span key={p.cotaIndex} className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold tabular-nums', cfg.className)}>
                              {cfg.icon}
                              {p.homeScore}×{p.awayScore}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Ranking Tab ──────────────────────────────────────────────────────────────
function RankingTab({ poolId, userId }: { poolId: string; userId: string }) {
  const { data: result, isLoading } = useRanking(poolId);

  if (isLoading) return <CardSkeleton />;

  const ranking = result?.ranking ?? [];
  const hasStarted = ranking.some((r) => r.totalScore > 0);

  if (!ranking.length) {
    return <EmptyState icon={Trophy} title="Ranking ainda vazio" description="O ranking atualiza automaticamente quando os jogos forem encerrados" />;
  }

  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className="space-y-3">
      {/* Prêmio por posição */}
      {result && result.totalPot > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-center">
              <p className="text-xs text-gray-400">💰 Total em caixa</p>
              <p className="text-lg font-bold text-yellow-400">{formatCurrency(result.totalPot)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">🏆 Ganhadores agora</p>
              <p className="text-lg font-bold text-gray-100">{hasStarted ? result.leadersCount : '—'}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">💵 Prêmio p/ ganhador</p>
              <p className="text-lg font-bold text-green-400">
                {hasStarted ? formatCurrency(result.prizePerLeader) : '—'}
              </p>
            </div>
          </div>
          {!hasStarted && (
            <p className="text-xs text-gray-500 text-center mt-2">O prêmio será distribuído assim que os jogos iniciarem</p>
          )}
          {hasStarted && result.leadersCount > 1 && (
            <p className="text-xs text-gray-500 text-center mt-2">Prêmio dividido entre {result.leadersCount} líderes empatados</p>
          )}
        </div>
      )}

      {/* Lista do ranking */}
      {ranking.map((entry) => {
        const isMe = entry.user.id === userId;
        const isLeader = entry.position === 1 && entry.totalScore > 0;
        return (
          <div key={entry.user.id}
            className={`flex items-center gap-3 rounded-xl border p-3 ${isLeader ? 'border-yellow-500/40 bg-yellow-500/5' : isMe ? 'border-brand-500/30 bg-brand-600/5' : 'border-surface-lighter bg-surface/40'}`}>
            <div className="w-8 text-center">
              {medals[entry.position] ?? <span className="text-sm font-bold text-gray-400">{entry.position}º</span>}
            </div>
            <AvatarWithInitials name={entry.user.fullName} src={entry.user.avatar} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-100 truncate">
                {entry.user.fullName} {isMe && <span className="text-xs text-brand-400">(você)</span>}
              </p>
              <p className="text-xs text-gray-500">{entry.totalPredictions} palpite(s) · {entry.correctResults} exato(s)</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-brand-400">{entry.totalScore} <span className="text-xs font-normal text-gray-500">pts</span></p>
              {entry.potentialPrize > 0 && (
                <p className="text-xs font-semibold text-green-400">{formatCurrency(entry.potentialPrize)}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Members Tab ─────────────────────────────────────────────────────────────
function MembersTab({ poolId, members, isOrganizer, currentUserId }: {
  poolId: string; members: any[]; isOrganizer: boolean; currentUserId: string;
}) {
  const { mutate: updateMember, isPending: updating } = useUpdateMemberStatus();

  if (!members.length) {
    return <EmptyState icon={Users} title="Sem participantes" description="Compartilhe o código do bolão para convidar pessoas" />;
  }

  const pendingMembers = members.filter((m) => m.status === 'PENDING');
  const confirmedMembers = members.filter((m) => m.status === 'CONFIRMED');

  return (
    <div className="space-y-4">
      {/* Pendentes — destaque para o organizador confirmar */}
      {isOrganizer && pendingMembers.length > 0 && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-yellow-500/10">
            <Clock className="size-4 text-yellow-400 shrink-0" />
            <p className="text-sm font-semibold text-yellow-300">{pendingMembers.length} aguardando confirmação</p>
          </div>
          <div className="divide-y divide-yellow-500/10">
            {pendingMembers.map((m: any) => (
              <div key={m.userId} className="flex items-center gap-3 px-4 py-3">
                <AvatarWithInitials name={m.user.fullName} src={m.user.avatar} className="size-8 text-xs shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate">
                    {m.user.fullName}
                    {m.userId === currentUserId && <span className="ml-1 text-xs text-brand-400">(você)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{m.numCotas ?? 1} cota(s)</p>
                </div>
                {m.user.pixKey && (
                  <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[100px]">{m.user.pixKey}</span>
                )}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-500 text-white"
                    disabled={updating}
                    onClick={() => updateMember({ poolId, memberId: m.userId, status: 'CONFIRMED' })}
                  >
                    <CheckCircle2 className="size-3 mr-1" />Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    disabled={updating}
                    onClick={() => updateMember({ poolId, memberId: m.userId, status: 'REJECTED' })}
                  >
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmados */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />Participantes confirmados ({confirmedMembers.length})
        </CardTitle></CardHeader>
        <CardContent>
          {confirmedMembers.length > 0 ? (
            <div className="space-y-2">
              {confirmedMembers.map((m: any) => (
                <div key={m.userId} className="flex items-center justify-between p-3 rounded-lg bg-surface/40">
                  <div className="flex items-center gap-3">
                    <AvatarWithInitials name={m.user.fullName} src={m.user.avatar} />
                    <div>
                      <p className="text-sm font-medium text-gray-100">
                        {m.user.fullName}
                        {m.userId === currentUserId && <span className="ml-1 text-xs text-brand-400">(você)</span>}
                      </p>
                      <p className="text-xs text-gray-500">{m.numCotas ?? 1} cota(s) · entrou {formatDate(m.joinedAt)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                    ✓ Confirmado
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Nenhum participante confirmado ainda</p>
          )}
        </CardContent>
      </Card>

      {/* Pendentes para não-organizadores */}
      {!isOrganizer && pendingMembers.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-400 font-normal">
            Aguardando confirmação ({pendingMembers.length})
          </CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingMembers.map((m: any) => (
                <div key={m.userId} className="flex items-center justify-between p-3 rounded-lg bg-surface/40 opacity-70">
                  <div className="flex items-center gap-3">
                    <AvatarWithInitials name={m.user.fullName} src={m.user.avatar} />
                    <p className="text-sm text-gray-300">{m.user.fullName}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">⏳ Pendente</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PoolDetailsPage() {
  const params = useParams();
  const poolId = params.poolId as string;
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('predictions');

  const { data: pool, isLoading } = usePool(poolId);
  const { data: members } = usePoolMembers(poolId);

  // Todos os hooks ANTES dos returns condicionais (regra dos hooks)
  const [showShareModal, setShowShareModal] = useState(false);

  // Bolão finalizado abre diretamente em Resultados
  useEffect(() => {
    if (pool?.status === 'FINISHED') setActiveTab('results');
  }, [pool?.status]);

  if (isLoading) return <CardSkeleton />;
  if (!pool) return <EmptyState icon={Trophy} title="Bolão não encontrado" description="" />;

  const myMember = members?.find((m: any) => m.userId === user?.id);
  const isOrganizer = pool.organizerId === user?.id;
  const isConfirmed = myMember?.status === 'CONFIRMED';

return (
    <div className="space-y-5 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-50">{pool.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-sm">
            <span className="text-gray-400">{pool.championship?.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pool.status === 'OPEN' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {pool.status === 'OPEN' ? 'Aberto' : pool.status === 'CLOSED' ? 'Fechado' : 'Finalizado'}
            </span>
            {myMember && !isConfirmed && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">Pagamento pendente</span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 rounded-xl border border-brand-500/40 bg-brand-500/10 hover:bg-brand-500/20 px-4 py-2.5 text-sm font-semibold text-brand-300 hover:text-brand-200 transition-colors shrink-0"
        >
          <Share2 className="h-4 w-4" />
          Compartilhar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Por cota</p>
          <p className="text-xl font-bold text-brand-400">{pool.entryFee > 0 ? formatCurrency(pool.entryFee) : 'Grátis'}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Participantes</p>
          <p className="text-xl font-bold text-gray-50">{pool.memberCount || 0}/{pool.maxParticipants}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Cotas/pessoa</p>
          <p className="text-xl font-bold text-gray-50">até {pool.cotasPerParticipant ?? 1}</p>
        </CardContent></Card>
      </div>

      {/* Banner de resultado final — bolão encerrado */}
      {pool.status === 'FINISHED' && user && (
        <FinalResultBanner poolId={poolId} userId={user.id} />
      )}

      {/* Atalho admin — registrar/editar resultados das partidas */}
      {user?.role === UserRole.ADMIN && pool.championshipId && (
        <Link
          href={`/admin/matches?championship=${pool.championshipId}&fromPool=${poolId}`}
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-brand-500/25 bg-brand-500/5 hover:bg-brand-500/10 hover:border-brand-500/40 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0">
              <ClipboardList className="size-4 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-300">Gerenciar resultados das partidas</p>
              <p className="text-xs text-gray-500">Registre ou corrija o placar — o ranking atualiza automaticamente</p>
            </div>
          </div>
          <ExternalLink className="size-4 text-gray-500 group-hover:text-brand-400 transition-colors shrink-0" />
        </Link>
      )}

      {/* Live Dashboard — placares + classificação em tempo real (só se não finalizado) */}
      {user && pool.status !== 'FINISHED' && <LiveDashboard poolId={poolId} userId={user.id} />}

      {/* Prize Banner — só mostra se bolão tem entrada paga e está aberto/fechado */}
      {user && pool.status !== 'FINISHED' && <PrizeBanner poolId={poolId} onGoToPayment={() => setActiveTab('payment')} />}

      {/* Meus Resultados — só mostra se confirmado e há partidas encerradas e bolão não finalizado */}
      {user && isConfirmed && pool.status !== 'FINISHED' && <MyResultsSection poolId={poolId} userId={user.id} />}

      {/* Partidas do bolão — sempre visível, mostra placar quando disponível */}
      <MatchesSection
        poolId={poolId}
        isAdmin={user?.role === UserRole.ADMIN}
        championshipId={(pool as any).championshipId}
      />

      {/* Tabs — barra rolável no mobile */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="predictions" className="shrink-0 gap-1.5">
            <Target className="h-3.5 w-3.5 shrink-0" />
            Palpites
          </TabsTrigger>
          <TabsTrigger value="group" className="shrink-0 gap-1.5">
            <Eye className="h-3.5 w-3.5 shrink-0" />
            Grupo
          </TabsTrigger>
          <TabsTrigger value="results" className="shrink-0 gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 shrink-0" />
            Resultados
          </TabsTrigger>
          <TabsTrigger value="payment" className="shrink-0 gap-1.5">
            <CreditCard className="h-3.5 w-3.5 shrink-0" />
            Pagamento
          </TabsTrigger>
          <TabsTrigger value="ranking" className="shrink-0 gap-1.5">
            <Trophy className="h-3.5 w-3.5 shrink-0" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="members" className="shrink-0 gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            Membros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="mt-4">
          <PredictionsTab poolId={poolId} member={myMember} />
        </TabsContent>

        <TabsContent value="group" className="mt-4">
          <GroupPredictionsTab poolId={poolId} userId={user?.id ?? ''} />
        </TabsContent>

        <TabsContent value="results" className="mt-4">
          <ResultsTab poolId={poolId} userId={user?.id ?? ''} />
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          <PaymentTab poolId={poolId} isOrganizer={isOrganizer} myMember={myMember} isAdmin={user?.role === UserRole.ADMIN} />
        </TabsContent>

        <TabsContent value="ranking" className="mt-4">
          <RankingTab poolId={poolId} userId={user?.id ?? ''} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <MembersTab poolId={poolId} members={members ?? []} isOrganizer={isOrganizer} currentUserId={user?.id ?? ''} />
        </TabsContent>
      </Tabs>

      {/* Share modal */}
      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        pool={pool}
      />
    </div>
  );
}

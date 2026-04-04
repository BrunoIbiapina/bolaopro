'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useFdCompetitions,
  useFdMatches,
  useImportMatch,
  useSyncLiveScores,
  FdMatch,
} from '@/hooks/use-football-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'destructive' | 'outline' | 'secondary' }> = {
  SCHEDULED: { label: 'Agendado', variant: 'outline' },
  TIMED: { label: 'Agendado', variant: 'outline' },
  IN_PLAY: { label: '🔴 Ao Vivo', variant: 'default' },
  PAUSED: { label: '⏸ Intervalo', variant: 'secondary' },
  FINISHED: { label: 'Finalizado', variant: 'secondary' },
  CANCELLED: { label: 'Cancelado', variant: 'destructive' },
  POSTPONED: { label: 'Adiado', variant: 'destructive' },
};

function MatchCard({ match, competitionCode }: { match: FdMatch; competitionCode: string }) {
  const router = useRouter();
  const importMatch = useImportMatch();
  const statusInfo = STATUS_LABELS[match.status] ?? { label: match.status, variant: 'outline' as const };

  const scoreLabel =
    match.score.fullTime.home !== null
      ? `${match.score.fullTime.home} - ${match.score.fullTime.away}`
      : match.status === 'IN_PLAY' || match.status === 'PAUSED'
      ? `${match.score.halfTime.home ?? 0} - ${match.score.halfTime.away ?? 0}`
      : null;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      {/* Teams */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <div className="flex flex-col items-center gap-1 w-10 shrink-0">
          {match.homeTeam.crest ? (
            <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="h-8 w-8 object-contain" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
              {match.homeTeam.tla}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center flex-1 min-w-0">
          <div className="flex items-center gap-1 w-full justify-center text-sm font-medium truncate">
            <span className="truncate text-right flex-1">{match.homeTeam.shortName || match.homeTeam.name}</span>
            {scoreLabel ? (
              <span className="mx-1 font-bold text-base shrink-0">{scoreLabel}</span>
            ) : (
              <span className="mx-1 text-muted-foreground text-xs shrink-0">vs</span>
            )}
            <span className="truncate text-left flex-1">{match.awayTeam.shortName || match.awayTeam.name}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>
            <span className="text-xs text-muted-foreground">
              {match.matchday ? `Rodada ${match.matchday} · ` : ''}
              {format(new Date(match.utcDate), "dd/MM 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 w-10 shrink-0">
          {match.awayTeam.crest ? (
            <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="h-8 w-8 object-contain" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
              {match.awayTeam.tla}
            </div>
          )}
        </div>
      </div>

      {/* Import button */}
      <Button
        size="sm"
        disabled={importMatch.isPending}
        onClick={() =>
          importMatch.mutate(
            { externalMatchId: match.id, competitionCode },
            {
              onSuccess: (imported: any) => {
                router.push(
                  `/pools/new?matchId=${imported.id}&championshipId=${imported.championshipId}`,
                );
              },
            },
          )
        }
        className="shrink-0"
      >
        {importMatch.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Importar → Criar Bolão'
        )}
      </Button>
    </div>
  );
}

export default function ImportMatchesPage() {
  const [selectedCode, setSelectedCode] = useState('');
  const [filterStatus, setFilterStatus] = useState<'SCHEDULED' | 'LIVE' | 'FINISHED' | ''>('SCHEDULED');

  const { data: competitions, isLoading: loadingComps } = useFdCompetitions();
  const { data: matches, isLoading: loadingMatches, error } = useFdMatches(
    selectedCode,
    filterStatus || undefined,
  );
  const syncLive = useSyncLiveScores();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Importar Partidas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Selecione um campeonato para ver as partidas disponíveis na API externa
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncLive.mutate()}
          disabled={syncLive.isPending}
        >
          {syncLive.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          🔄 Sync ao vivo
        </Button>
      </div>

      {/* Competition selector */}
      <div className="flex flex-wrap gap-2">
        {loadingComps ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          competitions?.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelectedCode(c.code)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedCode === c.code
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-accent'
              }`}
            >
              <span>{c.flag}</span>
              <span>{c.name}</span>
            </button>
          ))
        )}
      </div>

      {selectedCode && (
        <>
          {/* Status filter */}
          <div className="flex gap-2">
            {(['SCHEDULED', 'LIVE', 'FINISHED', ''] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={filterStatus === s ? 'default' : 'outline'}
                onClick={() => setFilterStatus(s)}
              >
                {s === '' ? 'Todos' : s === 'SCHEDULED' ? 'Agendados' : s === 'LIVE' ? '🔴 Ao Vivo' : 'Finalizados'}
              </Button>
            ))}
          </div>

          {/* Matches list */}
          {loadingMatches ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {(error as any)?.response?.data?.message || 'Erro ao carregar partidas. Verifique se a chave FOOTBALL_DATA_API_KEY está configurada no .env do servidor.'}
            </div>
          ) : !matches?.length ? (
            <div className="rounded-lg border bg-muted/30 p-8 text-center text-muted-foreground">
              Nenhuma partida encontrada para os filtros selecionados
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{matches.length} partida(s) encontrada(s)</p>
              <div className="grid gap-2">
                {matches.map((m) => (
                  <MatchCard key={m.id} match={m} competitionCode={selectedCode} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!selectedCode && (
        <div className="rounded-lg border bg-muted/30 p-12 text-center text-muted-foreground">
          Selecione um campeonato acima para ver as partidas disponíveis
        </div>
      )}
    </div>
  );
}

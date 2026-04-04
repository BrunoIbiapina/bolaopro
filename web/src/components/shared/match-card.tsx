import { Match, MatchStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from './status-badge';
import { formatDate } from '@/lib/utils';

interface MatchCardProps {
  match: Match;
  showResult?: boolean;
}

export function MatchCard({ match, showResult = false }: MatchCardProps) {
  const isLive = match.status === MatchStatus.LIVE;
  const isFinished = match.status === MatchStatus.FINISHED;

  return (
    <Card className={`${isLive ? 'border-brand-500 shadow-lg shadow-brand-500/20' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400">
            Rodada {match.roundNumber}
          </p>
          <StatusBadge status={match.status} icon={false} />
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-gray-50">
              {match.homeTeam?.abbreviation || 'TBD'}
            </p>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-2">
            {isFinished && showResult ? (
              <div className="font-mono text-lg font-bold text-gray-50">
                {match.homeTeamScore} - {match.awayTeamScore}
              </div>
            ) : (
              <p className="text-xs text-gray-400">vs</p>
            )}
            <p className="text-xs text-gray-400">
              {formatDate(match.scheduledAt, 'dd/MM HH:mm')}
            </p>
          </div>

          {/* Away Team */}
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold text-gray-50">
              {match.awayTeam?.abbreviation || 'TBD'}
            </p>
          </div>
        </div>

        {isLive && (
          <div className="mt-3 flex items-center justify-center gap-2 text-brand-400 text-xs font-semibold">
            <div className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
            AO VIVO
          </div>
        )}
      </CardContent>
    </Card>
  );
}

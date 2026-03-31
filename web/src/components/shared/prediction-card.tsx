import { Match, PredictionStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './status-badge';
import { formatDate } from '@/lib/utils';

interface PredictionCardProps {
  match: Match;
  homeScore?: number;
  awayScore?: number;
  onHomeScoreChange?: (score: number) => void;
  onAwayScoreChange?: (score: number) => void;
  isLocked?: boolean;
  status?: PredictionStatus;
  result?: boolean;
}

export function PredictionCard({
  match,
  homeScore,
  awayScore,
  onHomeScoreChange,
  onAwayScoreChange,
  isLocked = false,
  status,
}: PredictionCardProps) {
  const isFinished = match.status === 'FINISHED';

  return (
    <Card className={isLocked ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with round and status */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">
              Rodada {match.roundNumber}
            </span>
            {status && <StatusBadge status={status} icon={false} />}
          </div>

          {/* Match info */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400">
              {formatDate(match.scheduledAt, 'dd/MM HH:mm')}
            </p>

            {/* Score inputs */}
            <div className="flex items-center gap-3">
              {/* Home Team */}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-50 mb-2">
                  {match.homeTeam?.name || 'TBD'}
                </p>
                <Input
                  type="number"
                  min="0"
                  max="9"
                  value={homeScore ?? ''}
                  onChange={(e) =>
                    onHomeScoreChange?.(parseInt(e.target.value) || 0)
                  }
                  disabled={isLocked || isFinished}
                  placeholder="0"
                  className="font-mono text-center text-lg font-bold"
                />
              </div>

              {/* vs */}
              <div className="flex flex-col items-center justify-between h-20 text-gray-400">
                <span>vs</span>
              </div>

              {/* Away Team */}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-50 mb-2">
                  {match.awayTeam?.name || 'TBD'}
                </p>
                <Input
                  type="number"
                  min="0"
                  max="9"
                  value={awayScore ?? ''}
                  onChange={(e) =>
                    onAwayScoreChange?.(parseInt(e.target.value) || 0)
                  }
                  disabled={isLocked || isFinished}
                  placeholder="0"
                  className="font-mono text-center text-lg font-bold"
                />
              </div>
            </div>

            {/* Result if finished */}
            {isFinished && (
              <div className="mt-4 p-3 bg-surface-light rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Resultado</p>
                <p className="font-mono font-bold text-lg">
                  {match.homeTeamScore} - {match.awayTeamScore}
                </p>
              </div>
            )}

            {isLocked && (
              <Badge variant="warning" className="w-full justify-center">
                Palpite Trancado
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

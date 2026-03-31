import { Standing } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { AvatarWithInitials } from '@/components/ui/avatar';

interface RankingTableProps {
  standings: Standing[];
  currentUserId?: string;
}

export function RankingTable({
  standings,
  currentUserId,
}: RankingTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Pos</TableHead>
          <TableHead>Participante</TableHead>
          <TableHead className="text-right">Pontos</TableHead>
          <TableHead className="text-right">Acertos</TableHead>
          <TableHead className="text-right">Acurácia</TableHead>
          <TableHead className="text-center">Trend</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {standings.map((standing) => {
          const isCurrentUser = standing.userId === currentUserId;
          const isMedalist = standing.position <= 3;

          return (
            <TableRow
              key={standing.userId}
              className={`${isCurrentUser ? 'bg-brand-950/30 hover:bg-brand-950/50' : ''}`}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  {isMedalist ? (
                    <Trophy
                      className={`w-5 h-5 ${
                        standing.position === 1
                          ? 'text-yellow-500'
                          : standing.position === 2
                            ? 'text-gray-300'
                            : 'text-orange-600'
                      }`}
                    />
                  ) : (
                    <span className="font-semibold text-gray-50">
                      {standing.position}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <AvatarWithInitials name={standing.user.fullName} />
                  <div>
                    <p className="font-semibold text-gray-50">
                      {standing.user.fullName}
                    </p>
                    {isCurrentUser && (
                      <Badge variant="info" className="text-xs mt-1">
                        Você
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-bold text-brand-400">
                {standing.points}
              </TableCell>
              <TableCell className="text-right">
                {standing.matchesCorrect}/{standing.matchesPlayed}
              </TableCell>
              <TableCell className="text-right">
                {(standing.accuracy * 100).toFixed(1)}%
              </TableCell>
              <TableCell className="text-center">
                {standing.trend === 'up' && (
                  <TrendingUp className="w-4 h-4 text-green-400 mx-auto" />
                )}
                {standing.trend === 'down' && (
                  <TrendingDown className="w-4 h-4 text-red-400 mx-auto" />
                )}
                {standing.trend === 'stable' && (
                  <div className="w-4 h-4 bg-gray-400 rounded-full mx-auto" />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

import { Injectable } from '@nestjs/common';

export interface RankingEntry {
  userId: string;
  totalScore: number;
  correctResults: number;
  correctWinners: number;
  predictions: number;
}

@Injectable()
export class TiebreakerEngine {
  sort(entries: RankingEntry[]): RankingEntry[] {
    return entries.sort((a, b) => {
      // Quem tem mais pontos (= mais placares exatos) fica na frente.
      // Empate perfeito → mesma posição, prêmio dividido igualmente.
      return b.totalScore - a.totalScore;
    });
  }
}

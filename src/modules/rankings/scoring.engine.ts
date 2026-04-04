import { Injectable } from '@nestjs/common';

export interface PredictionData {
  homeScore: number;
  awayScore: number;
  knockoutWinnerId?: string;
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  winnerId?: string;
}

@Injectable()
export class ScoringEngine {
  calculateScore(prediction: PredictionData, result: MatchResult): number {
    if (!result) {
      return 0;
    }

    // Só pontua quem acertar o placar exato
    if (
      prediction.homeScore === result.homeScore &&
      prediction.awayScore === result.awayScore
    ) {
      return 10;
    }

    return 0;
  }

}

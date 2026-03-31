import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

// Competitions available on free plan
export const FREE_COMPETITIONS = [
  { code: 'BSA', name: 'Brasileirão Série A', country: 'Brasil', flag: '🇧🇷' },
  { code: 'CL', name: 'UEFA Champions League', country: 'Europa', flag: '🏆' },
  { code: 'PL', name: 'Premier League', country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'PD', name: 'La Liga', country: 'Espanha', flag: '🇪🇸' },
  { code: 'SA', name: 'Serie A', country: 'Itália', flag: '🇮🇹' },
  { code: 'BL1', name: 'Bundesliga', country: 'Alemanha', flag: '🇩🇪' },
  { code: 'FL1', name: 'Ligue 1', country: 'França', flag: '🇫🇷' },
  { code: 'PPL', name: 'Primeira Liga', country: 'Portugal', flag: '🇵🇹' },
  { code: 'EC', name: 'Campeonato Europeu', country: 'Europa', flag: '🇪🇺' },
  { code: 'WC', name: 'Copa do Mundo', country: 'Mundial', flag: '🌍' },
];

export interface ApiTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  country?: string;
}

export interface ApiMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string;
  homeTeam: ApiTeam;
  awayTeam: ApiTeam;
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  competition: { name: string; code: string };
}

@Injectable()
export class FootballDataService {
  private readonly logger = new Logger(FootballDataService.name);
  private client: AxiosInstance | null = null;

  private getClient(): AxiosInstance {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) throw new Error('FOOTBALL_DATA_API_KEY não configurada');

    if (!this.client) {
      this.client = axios.create({
        baseURL: 'https://api.football-data.org/v4',
        headers: { 'X-Auth-Token': apiKey },
        timeout: 10000,
      });
    }
    return this.client;
  }

  getAvailableCompetitions() {
    return FREE_COMPETITIONS;
  }

  async getMatchesByCompetition(code: string, status?: 'SCHEDULED' | 'LIVE' | 'FINISHED'): Promise<ApiMatch[]> {
    const client = this.getClient();
    const params: Record<string, string> = {};
    if (status) params.status = status;

    try {
      const response = await client.get(`/competitions/${code}/matches`, { params });
      return (response.data.matches as ApiMatch[]) ?? [];
    } catch (err: any) {
      this.logger.error(`Erro ao buscar partidas de ${code}: ${err?.message}`);
      throw new Error(err?.response?.data?.message || 'Erro ao buscar partidas da API externa');
    }
  }

  async getLiveMatches(): Promise<ApiMatch[]> {
    const client = this.getClient();
    try {
      const response = await client.get('/matches', { params: { status: 'IN_PLAY,PAUSED' } });
      return (response.data.matches as ApiMatch[]) ?? [];
    } catch (err: any) {
      this.logger.error(`Erro ao buscar partidas ao vivo: ${err?.message}`);
      return [];
    }
  }

  async getMatchById(matchId: number): Promise<ApiMatch | null> {
    const client = this.getClient();
    try {
      const response = await client.get(`/matches/${matchId}`);
      return response.data as ApiMatch;
    } catch {
      return null;
    }
  }
}

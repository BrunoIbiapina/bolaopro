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

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class FootballDataService {
  private readonly logger = new Logger(FootballDataService.name);
  private client: AxiosInstance | null = null;
  private cache = new Map<string, CacheEntry<any>>();

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

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

  async getStandings(code: string): Promise<any> {
    const cacheKey = `standings:${code}`;
    const cached = this.getCache<any>(cacheKey);
    if (cached) {
      this.logger.debug(`[cache hit] standings ${code}`);
      return cached;
    }

    const client = this.getClient();
    try {
      const response = await client.get(`/competitions/${code}/standings`);
      this.setCache(cacheKey, response.data, 30 * 60 * 1000); // 30 min
      return response.data;
    } catch (err: any) {
      this.logger.error(`Erro ao buscar classificação de ${code}: ${err?.message}`);
      throw new Error(err?.response?.data?.message || 'Erro ao buscar classificação');
    }
  }

  async getUpcomingMatches(code: string): Promise<ApiMatch[]> {
    const cacheKey = `matches:${code}`;
    const cached = this.getCache<ApiMatch[]>(cacheKey);
    if (cached) {
      this.logger.debug(`[cache hit] matches ${code}`);
      return cached;
    }

    const client = this.getClient();

    // Estratégia 1: data range -1 dia até +14 dias (margem de fuso horário)
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 1);
    const dateTo = new Date();
    dateTo.setDate(dateTo.getDate() + 14);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    try {
      const response = await client.get(`/competitions/${code}/matches`, {
        params: { dateFrom: fmt(dateFrom), dateTo: fmt(dateTo) },
      });
      const matches = (response.data.matches as ApiMatch[]) ?? [];

      // Se veio vazio, tenta estratégia 2: últimas partidas + ao vivo + agendadas sem filtro de data
      if (matches.length === 0) {
        const fallback = await client.get(`/competitions/${code}/matches`, {
          params: { status: 'SCHEDULED,TIMED,IN_PLAY,PAUSED,FINISHED' },
        });
        const all = (fallback.data.matches as ApiMatch[]) ?? [];
        const finished = all.filter(m => m.status === 'FINISHED').slice(-5);
        const live = all.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED');
        const scheduled = all.filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED').slice(0, 10);
        const result = [...finished, ...live, ...scheduled];
        this.setCache(cacheKey, result, 5 * 60 * 1000); // 5 min
        return result;
      }

      this.setCache(cacheKey, matches, 5 * 60 * 1000); // 5 min
      return matches;
    } catch (err: any) {
      this.logger.error(
        `Erro ao buscar partidas de ${code}: ${err?.message} | status: ${err?.response?.status} | data: ${JSON.stringify(err?.response?.data)}`,
      );
      throw new Error(err?.response?.data?.message || `Erro ao buscar partidas de ${code}`);
    }
  }
}

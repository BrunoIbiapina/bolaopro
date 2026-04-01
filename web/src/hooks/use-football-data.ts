'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface FdCompetition {
  code: string;
  name: string;
  country: string;
  flag: string;
}

export interface FdTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  country?: string;
}

export interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: {
    winner: string | null;
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  competition: { name: string; code: string };
}

export function useFdCompetitions() {
  return useQuery({
    queryKey: ['fd-competitions'],
    queryFn: async () => {
      const response = await api.get<FdCompetition[]>('/admin/football-data/competitions');
      return response.data;
    },
    staleTime: Infinity,
  });
}

export function useFdMatches(code: string, status?: 'SCHEDULED' | 'LIVE' | 'FINISHED') {
  return useQuery({
    queryKey: ['fd-matches', code, status],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      const response = await api.get<FdMatch[]>(
        `/admin/football-data/competitions/${code}/matches`,
        { params },
      );
      return response.data;
    },
    enabled: !!code,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

// ── Public endpoints (any authenticated user) ──────────────────────────────

export function usePublicCompetitions() {
  return useQuery({
    queryKey: ['public-fd-competitions'],
    queryFn: async () => {
      const response = await api.get<FdCompetition[]>('/futebol/competitions');
      return response.data;
    },
    staleTime: Infinity,
  });
}

export function usePublicMatches(code: string) {
  return useQuery({
    queryKey: ['public-fd-matches', code],
    queryFn: async () => {
      const response = await api.get<FdMatch[]>(`/futebol/competitions/${code}/matches`);
      return response.data;
    },
    enabled: !!code,
    staleTime: 1000 * 60,        // 1 min
    refetchInterval: 1000 * 60,  // re-busca a cada 60s automaticamente
    refetchIntervalInBackground: false, // pausa se a aba estiver em background
  });
}

export function usePublicStandings(code: string) {
  return useQuery({
    queryKey: ['public-fd-standings', code],
    queryFn: async () => {
      const response = await api.get(`/futebol/competitions/${code}/standings`);
      return response.data;
    },
    enabled: !!code,
    staleTime: 1000 * 60 * 30, // 30 min — tabela não muda tão rápido
  });
}

export function useImportMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { externalMatchId: number; competitionCode: string }) => {
      const response = await api.post('/admin/football-data/import', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Partida importada com sucesso!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Erro ao importar partida');
    },
  });
}

export function useSyncLiveScores() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/football-data/sync-live');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      toast.success(`${data.synced} partida(s) ao vivo atualizadas`);
    },
    onError: () => {
      toast.error('Erro ao sincronizar partidas ao vivo');
    },
  });
}

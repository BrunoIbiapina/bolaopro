'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Match } from '@/types';
import { toast } from 'sonner';

export function useMatches(championshipId?: string) {
  return useQuery({
    queryKey: ['matches', championshipId],
    queryFn: async () => {
      const params = championshipId ? { championshipId } : {};
      const response = await api.get<Match[]>('/admin/matches', { params });
      return response.data;
    },
  });
}

// Partidas específicas de um bolão (ou todas do campeonato se não houver seleção)
export function usePoolMatches(poolId: string) {
  return useQuery({
    queryKey: ['pool-matches', poolId],
    queryFn: async () => {
      const response = await api.get<Match[]>(`/pools/${poolId}/matches`);
      return response.data;
    },
    enabled: !!poolId,
    staleTime: 0,
  });
}

// Partidas de um campeonato para seleção (usa endpoint admin)
export function useChampionshipMatchesForSelection(championshipId: string) {
  return useQuery({
    queryKey: ['matches-for-selection', championshipId],
    queryFn: async () => {
      const response = await api.get<Match[]>('/admin/matches', {
        params: { championshipId },
      });
      return response.data;
    },
    enabled: !!championshipId,
  });
}

export function useCreateMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      championshipId: string;
      homeTeamId: string;
      awayTeamId: string;
      scheduledAt: string;
      roundId?: string;
    }) => {
      const response = await api.post<Match>('/admin/matches', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['matches-for-selection'] });
      toast.success('Jogo adicionado!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erro ao criar partida'));
    },
  });
}

export function useDeleteMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: string) => {
      await api.delete(`/admin/matches/${matchId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['matches-for-selection'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erro ao excluir jogo'));
    },
  });
}

export function useRegisterResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { matchId: string; homeScore: number; awayScore: number }) => {
      const response = await api.patch(`/admin/matches/${data.matchId}/result`, {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['pool-matches'] });
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      queryClient.invalidateQueries({ queryKey: ['group-predictions'] });
      toast.success('Resultado registrado!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erro ao registrar resultado'));
    },
  });
}

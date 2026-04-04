'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface PredictionItem {
  matchId: string;
  homeScore: number;
  awayScore: number;
  cotaIndex?: number;
  knockoutWinnerId?: string;
}

export interface SavedPrediction {
  id: string;
  poolId: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  cotaIndex: number;
  knockoutWinnerId?: string;
  createdAt: string;
  updatedAt: string;
  match?: {
    id: string;
    homeTeam?: { id: string; name: string; code: string; logo?: string };
    awayTeam?: { id: string; name: string; code: string; logo?: string };
    scheduledAt: string;
    status: string;
    homeScoreResult?: number;
    awayScoreResult?: number;
  };
}

export interface GroupMatchPrediction {
  userId: string;
  user: { id: string; fullName: string; avatar?: string };
  homeScore: number;
  awayScore: number;
  cotaIndex: number;
}

export interface GroupMatch {
  match: {
    id: string;
    homeTeam?: { id: string; name: string; code: string; logo?: string };
    awayTeam?: { id: string; name: string; code: string; logo?: string };
    scheduledAt: string;
    status: string;
    roundId?: string;
    homeScoreResult?: number;
    awayScoreResult?: number;
  };
  predictions: GroupMatchPrediction[];
}

export interface GroupPredictionsResponse {
  myStatus: string;
  confirmedCount: number;
  matches: GroupMatch[];
}

export function useGroupPredictions(poolId: string) {
  return useQuery({
    queryKey: ['predictions', poolId, 'group'],
    queryFn: async () => {
      const response = await api.get<GroupPredictionsResponse>(`/pools/${poolId}/predictions/group`);
      return response.data;
    },
    enabled: !!poolId,
    refetchInterval: 30_000,
  });
}

export function useCancelPredictions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ poolId, cotaIndex }: { poolId: string; cotaIndex: number }) => {
      const response = await api.delete(`/pools/${poolId}/predictions/cota/${cotaIndex}`);
      return response.data as { message: string; deleted: number };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['predictions', variables.poolId] });
      toast.success(`🗑️ ${data.deleted} palpite(s) cancelado(s)`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erro ao cancelar palpites'));
    },
  });
}

export function usePredictions(poolId: string) {
  return useQuery({
    queryKey: ['predictions', poolId],
    queryFn: async () => {
      const response = await api.get<SavedPrediction[]>(`/pools/${poolId}/predictions`);
      return response.data;
    },
    enabled: !!poolId,
    staleTime: 0, // sempre refetch quando invalidado
  });
}

export function useSavePredictions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      poolId,
      predictions,
    }: {
      poolId: string;
      predictions: PredictionItem[];
    }) => {
      const response = await api.put(`/pools/${poolId}/predictions/batch`, { predictions });
      return response.data as { message: string; saved: number; skipped: number };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['predictions', variables.poolId] });
      if (data.saved > 0) {
        const msg = data.skipped > 0
          ? `✅ ${data.saved} salvo(s) · ⚠️ ${data.skipped} bloqueado(s) (partida já iniciada)`
          : `✅ ${data.saved} palpite(s) salvo(s)!`;
        toast.success(msg);
      } else {
        toast.warning('⚠️ Todos os palpites estão bloqueados — as partidas já iniciaram');
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erro ao salvar palpites'));
    },
  });
}

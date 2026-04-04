'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface RankingEntry {
  position: number;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatar?: string;
    pixKey?: string | null;
  };
  totalScore: number;
  correctResults: number;
  correctWinners: number;
  totalPredictions: number;
  numCotas: number;
  memberStatus: string;
  potentialPrize: number;
  prizePaidAt: string | null;
  prizeAmount: number | null;
}

export interface RankingResponse {
  totalPot: number;
  totalCotas: number;
  confirmedMembers: number;
  prizePerLeader: number;
  leadersCount: number;
  hasWinner: boolean;
  noWinnerReason: string | null;
  ranking: RankingEntry[];
}

export function useRanking(poolId: string) {
  return useQuery({
    queryKey: ['ranking', poolId],
    queryFn: async () => {
      const response = await api.get<RankingResponse>(`/pools/${poolId}/ranking`);
      return response.data;
    },
    enabled: !!poolId,
    refetchInterval: 60_000,
  });
}

export function useMarkPrizePaid(poolId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ winnerId, prizeAmount }: { winnerId: string; prizeAmount: number }) => {
      const res = await api.patch(`/pools/${poolId}/winners/${winnerId}/prize-paid`, { prizeAmount });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking', poolId] });
    },
  });
}

export function useUnmarkPrizePaid(poolId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ winnerId }: { winnerId: string }) => {
      const res = await api.delete(`/pools/${poolId}/winners/${winnerId}/prize-paid`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking', poolId] });
    },
  });
}

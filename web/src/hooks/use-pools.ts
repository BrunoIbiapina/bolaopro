'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Pool, PoolMember } from '@/types';
import { toast } from 'sonner';

export function useMyPools(type?: 'participating' | 'organizing') {
  return useQuery({
    queryKey: ['pools', type],
    queryFn: async () => {
      const params = type ? { type } : {};
      const response = await api.get<Pool[]>('/pools', { params });
      return response.data;
    },
  });
}

export function usePool(poolId: string) {
  return useQuery({
    queryKey: ['pools', poolId],
    queryFn: async () => {
      const response = await api.get<Pool>(`/pools/${poolId}`);
      return response.data;
    },
    enabled: !!poolId,
  });
}

export function usePoolMembers(poolId: string) {
  return useQuery({
    queryKey: ['pools', poolId, 'members'],
    queryFn: async () => {
      const response = await api.get<PoolMember[]>(
        `/pools/${poolId}/members`
      );
      return response.data;
    },
    enabled: !!poolId,
  });
}

export function useCreatePool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Pool>) => {
      const response = await api.post<Pool>('/pools', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools'] });
      toast.success('Bolão criado com sucesso!');
    },
  });
}

export function usePoolByCode(code: string) {
  return useQuery({
    queryKey: ['pools', 'invite', code],
    queryFn: async () => {
      const response = await api.get(`/pools/invite/${code}`);
      return response.data as {
        id: string;
        name: string;
        description?: string;
        entryFee: number;
        maxParticipants: number;
        cotasPerParticipant: number;
        status: string;
        championship?: { id: string; name: string };
        organizer: { id: string; fullName: string };
        memberCount: number;
      };
    },
    enabled: code.trim().length >= 6,
    retry: false,
  });
}

export function useAvailablePools() {
  return useQuery({
    queryKey: ['pools', 'available'],
    queryFn: async () => {
      const response = await api.get<Pool[]>('/pools/available');
      return response.data;
    },
  });
}

export function useJoinByCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ inviteCode, numCotas }: { inviteCode: string; numCotas?: number }) => {
      const response = await api.post('/pools/join', { inviteCode, numCotas: numCotas ?? 1 });
      return response.data as Pool & { numCotas: number; totalAmount: number };
    },
    onSuccess: (data) => {
      // Limpa cache de pagamento e palpites para garantir estado limpo ao entrar num pool
      queryClient.removeQueries({ queryKey: ['payment', data.id] });
      queryClient.removeQueries({ queryKey: ['predictions', data.id] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
      const msg = data.entryFee > 0
        ? `Inscrito! Pague R$ ${data.totalAmount?.toFixed(2)} para confirmar.`
        : `Você entrou no bolão "${data.name}"!`;
      toast.success(msg);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Código inválido ou bolão cheio');
    },
  });
}

export function useJoinPool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ poolId, inviteCode }: { poolId: string; inviteCode: string }) => {
      const response = await api.post(`/pools/${poolId}/join`, { inviteCode });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools'] });
      toast.success('Você entrou no bolão!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Erro ao entrar no bolão');
    },
  });
}

export function useUpdatePool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      poolId,
      data,
    }: {
      poolId: string;
      data: Partial<Pool>;
    }) => {
      const response = await api.patch<Pool>(`/pools/${poolId}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pools', data.id] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
      toast.success('Bolão atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar bolão');
    },
  });
}

export function useDeletePool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (poolId: string) => {
      await api.delete(`/pools/${poolId}`);
      return poolId;
    },
    onSuccess: (poolId) => {
      // Remove todo cache relacionado ao pool excluído
      queryClient.removeQueries({ queryKey: ['pools', poolId] });
      queryClient.removeQueries({ queryKey: ['payment', poolId] });
      queryClient.removeQueries({ queryKey: ['predictions', poolId] });
      queryClient.removeQueries({ queryKey: ['pools', poolId, 'members'] });
      queryClient.removeQueries({ queryKey: ['pools', poolId, 'prize'] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
      // Atualiza visão do admin para remover pendências do pool excluído
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Bolão excluído');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Erro ao excluir bolão');
    },
  });
}

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ poolId, memberId, status }: { poolId: string; memberId: string; status: string }) => {
      const response = await api.patch(`/pools/${poolId}/members/${memberId}`, { status });
      return response.data;
    },
    onSuccess: (_, { poolId }) => {
      queryClient.invalidateQueries({ queryKey: ['pools', poolId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['pools', poolId] });
      queryClient.invalidateQueries({ queryKey: ['payment', poolId] });
      toast.success('Status atualizado!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Erro ao atualizar status');
    },
  });
}

export function useLeavePool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (poolId: string) => {
      await api.post(`/pools/${poolId}/leave`, {});
      return poolId;
    },
    onSuccess: (poolId) => {
      // Limpa cache de pagamento e palpites ao sair do pool
      queryClient.removeQueries({ queryKey: ['payment', poolId] });
      queryClient.removeQueries({ queryKey: ['predictions', poolId] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
      toast.success('Inscrição cancelada com sucesso');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Erro ao sair do bolão');
    },
  });
}

export function usePrizeInfo(poolId: string) {
  return useQuery({
    queryKey: ['pools', poolId, 'prize'],
    queryFn: async () => {
      const response = await api.get<{
        totalPot: number;
        confirmedMembers: number;
        totalCotas: number;
        entryFee: number;
        myContribution: number;
        potentialWinIfAlone: number;
        myStatus: string | null;
      }>(`/pools/${poolId}/prize`);
      return response.data;
    },
    enabled: !!poolId,
    refetchInterval: 30_000, // atualiza a cada 30s
  });
}

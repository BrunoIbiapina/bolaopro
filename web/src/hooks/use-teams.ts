'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Team } from '@/types';
import { toast } from 'sonner';

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await api.get<Team[]>('/admin/teams');
      return response.data;
    },
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; code: string; logo?: string; country?: string }) => {
      const response = await api.post<Team>('/admin/teams', data);
      return response.data;
    },
    onSuccess: (newTeam) => {
      queryClient.setQueryData(['teams'], (old: Team[] | undefined) =>
        old ? [...old, newTeam].sort((a, b) => a.name.localeCompare(b.name)) : [newTeam],
      );
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Time criado!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erro ao criar time'));
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Team> }) => {
      const response = await api.patch<Team>(`/admin/teams/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Time atualizado!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erro ao atualizar time'));
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/teams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Time removido!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erro ao remover time'));
    },
  });
}

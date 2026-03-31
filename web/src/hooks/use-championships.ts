'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Championship } from '@/types';
import { toast } from 'sonner';

export function useChampionships() {
  return useQuery({
    queryKey: ['championships'],
    queryFn: async () => {
      const response = await api.get<Championship[]>('/admin/championships');
      return response.data;
    },
  });
}

export function useChampionship(id: string) {
  return useQuery({
    queryKey: ['championships', id],
    queryFn: async () => {
      const response = await api.get<Championship>(`/admin/championships/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateChampionship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; code: string; description?: string; startDate?: string; endDate?: string }) => {
      const response = await api.post<Championship>('/admin/championships', data);
      return response.data;
    },
    onSuccess: (newChamp) => {
      // Adiciona imediatamente ao cache para o select aparecer sem esperar o refetch
      queryClient.setQueryData(['championships'], (old: Championship[] | undefined) =>
        old ? [...old, newChamp] : [newChamp],
      );
      // Refetch em background para sincronizar com servidor
      queryClient.invalidateQueries({ queryKey: ['championships'] });
      toast.success('Campeonato criado com sucesso!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erro ao criar campeonato'));
    },
  });
}

export function useDeleteChampionship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/championships/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['championships'] });
      toast.success('Campeonato removido!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erro ao remover campeonato'));
    },
  });
}

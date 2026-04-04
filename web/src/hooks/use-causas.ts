'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────

export type CausaCategory =
  | 'POLITICA' | 'ESPORTE' | 'CLIMA'
  | 'ENTRETENIMENTO' | 'NEGOCIOS' | 'CULTURA' | 'OUTROS';

export type CausaType = 'BINARY' | 'CHOICE' | 'NUMERIC';
export type CausaStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'RESOLVED' | 'CANCELLED';
export type CausaVisibility = 'PUBLIC' | 'PRIVATE';
export type NumericMatchMode = 'EXACT' | 'CLOSEST';

export interface CausaOption {
  id: string;
  causaId: string;
  label: string;
  emoji?: string;
  order: number;
  voteCount?: number | null;
  cotasCount?: number | null;
  percentage?: number | null;
}

export interface Causa {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  category: CausaCategory;
  type: CausaType;
  status: CausaStatus;
  visibility: CausaVisibility;
  inviteCode: string;
  deadlineAt: string;
  resolvesAt?: string;
  creatorId: string;
  creator: { id: string; fullName: string; avatar?: string };
  resolvedOptionId?: string;
  resolvedOption?: CausaOption;
  resolvedNumericValue?: number;
  resolvedAt?: string;
  resolvedBy?: string;
  entryFee: number;
  cotasPerParticipant: number;
  prizePool: number;
  platformFeePercent: number;
  platformFeeAmount: number;
  maxVoters?: number;
  hideVoteCount: boolean;
  allowComments: boolean;
  numericUnit?: string;
  numericMatchMode: NumericMatchMode;
  options: CausaOption[];
  _count: { votes: number };
  createdAt: string;
  updatedAt: string;
}

export interface CausaVote {
  id: string;
  causaId: string;
  userId: string;
  optionId?: string;
  option?: CausaOption;
  numericValue?: number;
  numCotas: number;
  amount: number;
  isCorrect?: boolean | null;
  prizeAmount?: number;
  createdAt: string;
}

export interface CausasFeedResponse {
  items: Causa[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CausasFilters {
  category?: CausaCategory;
  type?: CausaType;
  status?: 'OPEN' | 'CLOSED' | 'RESOLVED' | 'ALL';
  search?: string;
  sortBy?: 'newest' | 'deadline' | 'popular';
  page?: number;
  limit?: number;
}

export interface CreateCausaPayload {
  title: string;
  description?: string;
  imageUrl?: string;
  category: CausaCategory;
  type: CausaType;
  visibility: CausaVisibility;
  deadlineAt: string;
  resolvesAt?: string;
  entryFee?: number;
  cotasPerParticipant?: number;
  maxVoters?: number;
  hideVoteCount?: boolean;
  allowComments?: boolean;
  numericUnit?: string;
  numericMatchMode?: NumericMatchMode;
  options?: { label: string; emoji?: string; order: number }[];
}

export interface VotePayload {
  optionId?: string;
  numericValue?: number;
  numCotas?: number;
}

export interface ResolvePayload {
  winningOptionId?: string;
  numericResult?: number;
}

// ─── Keys ────────────────────────────────────────────────────

export const causaKeys = {
  all: ['causas'] as const,
  feed: (filters: CausasFilters) => ['causas', 'feed', filters] as const,
  detail: (id: string) => ['causas', id] as const,
  votes: (id: string) => ['causas', id, 'votes'] as const,
  myVote: (id: string) => ['causas', id, 'my-vote'] as const,
  leaderboard: (id: string) => ['causas', id, 'leaderboard'] as const,
  my: ['causas', 'my'] as const,
  invite: (code: string) => ['causas', 'invite', code] as const,
};

// ─── Hooks de leitura ─────────────────────────────────────────

export function useCausasFeed(filters: CausasFilters = {}) {
  return useQuery<CausasFeedResponse>({
    queryKey: causaKeys.feed(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));
      const { data } = await api.get(`/causas?${params.toString()}`);
      return data;
    },
    staleTime: 30_000,
  });
}

export function useCausa(id: string | null) {
  return useQuery<Causa>({
    queryKey: causaKeys.detail(id ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/causas/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCausaByInvite(code: string | null) {
  return useQuery<Causa>({
    queryKey: causaKeys.invite(code ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/causas/invite/${code}`);
      return data;
    },
    enabled: !!code,
  });
}

export function useCausaVotes(id: string | null) {
  return useQuery({
    queryKey: causaKeys.votes(id ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/causas/${id}/votes`);
      return data as { totalVotes: number; options: CausaOption[] };
    },
    enabled: !!id,
    refetchInterval: 30_000,
  });
}

export function useMyVote(causaId: string | null) {
  return useQuery<CausaVote | null>({
    queryKey: causaKeys.myVote(causaId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/causas/${causaId}/my-vote`);
      return data;
    },
    enabled: !!causaId,
  });
}

export function useCausaLeaderboard(id: string | null) {
  return useQuery({
    queryKey: causaKeys.leaderboard(id ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/causas/${id}/leaderboard`);
      return data as Array<{
        rank: number;
        user: { id: string; fullName: string; avatar?: string };
        numCotas: number;
        prizeAmount?: number;
        votedAt: string;
      }>;
    },
    enabled: !!id,
  });
}

export function useMyCausas() {
  return useQuery({
    queryKey: causaKeys.my,
    queryFn: async () => {
      const { data } = await api.get('/causas/my');
      return data as { created: Causa[]; voted: Causa[] };
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────

export function useCreateCausa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCausaPayload) => {
      const { data } = await api.post('/causas', payload);
      return data as Causa;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: causaKeys.all });
      toast.success('Causa criada com sucesso!');
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Erro ao criar causa');
    },
  });
}

export function usePublishCausa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (causaId: string) => {
      const { data } = await api.post(`/causas/${causaId}/publish`);
      return data as Causa;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: causaKeys.detail(data.id) });
      qc.invalidateQueries({ queryKey: causaKeys.my });
      toast.success('Causa publicada!');
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Erro ao publicar');
    },
  });
}

export function useVoteCausa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ causaId, payload }: { causaId: string; payload: VotePayload }) => {
      const { data } = await api.post(`/causas/${causaId}/vote`, payload);
      return data as CausaVote;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: causaKeys.votes(vars.causaId) });
      qc.invalidateQueries({ queryKey: causaKeys.myVote(vars.causaId) });
      qc.invalidateQueries({ queryKey: causaKeys.detail(vars.causaId) });
      toast.success('Voto registrado!');
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Erro ao votar');
    },
  });
}

export function useCreatorJoin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ causaId, payload }: { causaId: string; payload: VotePayload }) => {
      const { data } = await api.post(`/causas/${causaId}/creator-join`, payload);
      return data as CausaVote;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: causaKeys.votes(vars.causaId) });
      qc.invalidateQueries({ queryKey: causaKeys.myVote(vars.causaId) });
      toast.success('Você entrou na causa!');
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Erro ao participar');
    },
  });
}

export function useRemoveVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (causaId: string) => {
      await api.delete(`/causas/${causaId}/vote`);
    },
    onSuccess: (_, causaId) => {
      qc.invalidateQueries({ queryKey: causaKeys.votes(causaId) });
      qc.invalidateQueries({ queryKey: causaKeys.myVote(causaId) });
      toast.success('Voto removido');
    },
  });
}

export function useResolveCausa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ causaId, payload }: { causaId: string; payload: ResolvePayload }) => {
      const { data } = await api.post(`/causas/${causaId}/resolve`, payload);
      return data as Causa;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: causaKeys.detail(data.id) });
      qc.invalidateQueries({ queryKey: causaKeys.votes(data.id) });
      qc.invalidateQueries({ queryKey: causaKeys.leaderboard(data.id) });
      qc.invalidateQueries({ queryKey: causaKeys.my });
      toast.success('Causa resolvida!');
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Erro ao resolver');
    },
  });
}

export function useCancelCausa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (causaId: string) => {
      const { data } = await api.post(`/causas/${causaId}/cancel`);
      return data as Causa;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: causaKeys.all });
      toast.success('Causa cancelada');
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Erro ao cancelar');
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────

export const CAUSA_CATEGORY_LABELS: Record<CausaCategory, { label: string; color: string }> = {
  POLITICA:       { label: 'Política',       color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  ESPORTE:        { label: 'Esporte',         color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  CLIMA:          { label: 'Clima',           color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' },
  ENTRETENIMENTO: { label: 'Entretenimento',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  NEGOCIOS:       { label: 'Negócios',        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  CULTURA:        { label: 'Cultura',         color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  OUTROS:         { label: 'Outros',          color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

export const CAUSA_STATUS_LABELS: Record<CausaStatus, { label: string; color: string }> = {
  DRAFT:     { label: 'Rascunho',  color: 'bg-gray-100 text-gray-600' },
  OPEN:      { label: 'Aberta',    color: 'bg-green-100 text-green-700' },
  CLOSED:    { label: 'Encerrada', color: 'bg-orange-100 text-orange-700' },
  RESOLVED:  { label: 'Resolvida', color: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
};

export function formatDeadline(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Encerrado';
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return `${Math.floor(diff / 60_000)}min`;
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

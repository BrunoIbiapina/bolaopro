'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export function usePaymentStatus(poolId: string) {
  return useQuery({
    queryKey: ['payment', poolId],
    queryFn: async () => {
      const response = await api.get(`/pools/${poolId}/payment`);
      return response.data as {
        poolId: string;
        userId: string;
        entryFee: number;
        numCotas: number;
        totalAmount: number;
        paymentStatus: 'NOT_REQUESTED' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
        paymentId: string | null;
        paidAt: string | null;
        pixPayload: string | null;
        qrCodeBase64: string | null;
        paymentProofUrl: string | null;
        hasPixKey: boolean;
      };
    },
    enabled: !!poolId,
  });
}

export function useGeneratePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (poolId: string) => {
      const response = await api.post(`/pools/${poolId}/payment/generate`);
      return response.data as {
        paymentLink: string | null;
        amount: number;
        status: string;
        pixPayload: string | null;
        qrCodeBase64: string | null;
      };
    },
    onSuccess: (data, poolId) => {
      queryClient.invalidateQueries({ queryKey: ['payment', poolId] });
      if (data.status === 'FREE') {
        toast.success('Bolão gratuito confirmado!');
      } else if (data.status === 'PENDING') {
        toast.success('Solicitação enviada! Aguarde a confirmação do administrador.');
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Erro ao gerar pagamento');
    },
  });
}

// Admin/organizer: manually confirm payment for a user
export function useConfirmPaymentManual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ poolId, userId }: { poolId: string; userId: string }) => {
      const response = await api.post(`/pools/${poolId}/payment/confirm/${userId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment', variables.poolId] });
      queryClient.invalidateQueries({ queryKey: ['payments-all', variables.poolId] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
      toast.success('Pagamento confirmado!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Erro ao confirmar pagamento');
    },
  });
}

export function useAllPayments(poolId: string) {
  return useQuery({
    queryKey: ['payments-all', poolId],
    queryFn: async () => {
      const response = await api.get(`/pools/${poolId}/payment/all-payments`);
      return response.data as Array<{
        id: string;
        userId: string;
        amount: number;
        status: string;
        paidAt: string | null;
        user: { id: string; fullName: string; email: string };
      }>;
    },
    enabled: !!poolId,
  });
}

// Admin: finance KPIs
export function useFinanceKpis() {
  return useQuery({
    queryKey: ['admin', 'finance', 'kpis'],
    queryFn: async () => {
      const response = await api.get('/admin/payments/kpis');
      return response.data as {
        totalReceived: number;
        totalPaidCount: number;
        totalPending: number;
        totalPendingCount: number;
        totalFailedCount: number;
        activePools: number;
      };
    },
    refetchInterval: 30_000,
  });
}

// Admin: pools that have at least one payment
export function usePoolsWithPayments() {
  return useQuery({
    queryKey: ['admin', 'finance', 'pools-list'],
    queryFn: async () => {
      const response = await api.get('/admin/payments/pools-list');
      return response.data as Array<{ id: string; name: string }>;
    },
  });
}

// Admin: all pool members with payment status (for manual confirmation)
export function useAdminMembersStatus() {
  return useQuery({
    queryKey: ['admin', 'finance', 'members-status'],
    queryFn: async () => {
      const response = await api.get('/admin/payments/members-status');
      return response.data as Array<{
        pool: { id: string; name: string; entryFee: number };
        pendingCount: number;
        members: Array<{
          userId: string;
          user: { id: string; fullName: string; email: string; avatar: string | null };
          memberStatus: string;
          numCotas: number;
          expectedAmount: number;
          paymentStatus: string;
          paidAt: string | null;
          requestedAt: string | null;
          hasProof: boolean;
          userNotifiedAt: string | null;
        }>;
      }>;
    },
    refetchInterval: 30_000,
  });
}

// Admin: all payments with filters
export function useAdminAllPayments(filters: {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  poolId?: string;
}) {
  return useQuery({
    queryKey: ['admin', 'finance', 'payments', filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.poolId) params.poolId = filters.poolId;
      const response = await api.get('/admin/payments', { params });
      return response.data as Array<{
        id: string;
        userId: string;
        poolId: string;
        amount: number;
        status: string;
        paidAt: string | null;
        createdAt: string;
        transactionId: string | null;
        user: { id: string; fullName: string; email: string; avatar: string | null };
        pool: { id: string; name: string; entryFee: number };
      }>;
    },
    refetchInterval: 30_000,
  });
}

// Admin: list all pending payments across all pools
export function useAdminPendingPayments() {
  return useQuery({
    queryKey: ['admin', 'payments', 'pending'],
    queryFn: async () => {
      const response = await api.get('/admin/payments/pending');
      return response.data as Array<{
        id: string;
        userId: string;
        poolId: string;
        amount: number;
        status: string;
        createdAt: string;
        user: { id: string; fullName: string; email: string; avatar: string | null };
        pool: { id: string; name: string; entryFee: number };
      }>;
    },
    refetchInterval: 30_000,
  });
}

// User confirms they've sent the payment — notifies admin
export function useNotifyPaymentSent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (poolId: string) => {
      const response = await api.post(`/pools/${poolId}/payment/notify-paid`);
      return response.data as { message: string };
    },
    onSuccess: (_, poolId) => {
      queryClient.invalidateQueries({ queryKey: ['payment', poolId] });
      toast.success('Admin notificado! Aguarde a confirmação.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Erro ao notificar pagamento');
    },
  });
}

// Upload payment proof (comprovante)
export function useUploadPaymentProof() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ poolId, file }: { poolId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/pools/${poolId}/payment/proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data as { message: string; proofUrl: string };
    },
    onSuccess: (_, { poolId }) => {
      queryClient.invalidateQueries({ queryKey: ['payment', poolId] });
      toast.success('Comprovante enviado!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Erro ao enviar comprovante');
    },
  });
}

// Admin: reject / mark as not completed
export function useAdminRejectPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ poolId, userId }: { poolId: string; userId: string }) => {
      const response = await api.post(`/admin/payments/${poolId}/reject/${userId}`);
      return response.data;
    },
    onSuccess: (_, { poolId }) => {
      // Atualiza visão admin (membros + histórico + KPIs)
      queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] });
      // Atualiza cache de pagamento do usuário para ele ver "Não confirmado"
      queryClient.invalidateQueries({ queryKey: ['payment', poolId] });
      // Atualiza lista de bolões (status do membro)
      queryClient.invalidateQueries({ queryKey: ['pools'] });
      toast.success('Pagamento marcado como não confirmado');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Erro ao rejeitar pagamento');
    },
  });
}

// Admin: confirm a payment manually
export function useAdminConfirmPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ poolId, userId }: { poolId: string; userId: string }) => {
      const response = await api.post(`/admin/payments/${poolId}/confirm/${userId}`);
      return response.data;
    },
    onSuccess: (_, { poolId }) => {
      // Atualiza visão admin (membros + histórico + KPIs)
      queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] });
      // Atualiza cache de pagamento do usuário para ele ver "Confirmado"
      queryClient.invalidateQueries({ queryKey: ['payment', poolId] });
      // Atualiza lista de bolões e membros (status CONFIRMED)
      queryClient.invalidateQueries({ queryKey: ['pools'] });
      toast.success('Pagamento confirmado! O participante foi notificado.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(msg || 'Erro ao confirmar pagamento');
    },
  });
}

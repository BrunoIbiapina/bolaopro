import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date, pattern: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, pattern, { locale: ptBR });
}

export function formatDateWithTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

export function formatRelativeDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(dateObj, new Date(), {
    addSuffix: true,
    locale: ptBR,
  });
}

export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    success: 'text-green-400 bg-green-950',
    error: 'text-red-400 bg-red-950',
    warning: 'text-amber-400 bg-amber-950',
    info: 'text-blue-400 bg-blue-950',
    pending: 'text-amber-400 bg-amber-950',
    completed: 'text-green-400 bg-green-950',
    failed: 'text-red-400 bg-red-950',
  };
  return colors[status.toLowerCase()] || 'text-gray-400 bg-gray-950';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: 'Aberto',
    CLOSED: 'Fechado',
    RUNNING: 'Em andamento',
    FINISHED: 'Finalizado',
    SCHEDULED: 'Agendado',
    LIVE: 'Ao vivo',
    CANCELLED: 'Cancelado',
    PENDING: 'Pendente',
    LOCKED: 'Trancado',
    MISSED: 'Perdido',
    COMPLETED: 'Concluído',
    FAILED: 'Falhou',
    REFUNDED: 'Reembolsado',
  };
  return labels[status] || status;
}

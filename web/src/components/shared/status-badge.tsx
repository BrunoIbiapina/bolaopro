import { Badge } from '@/components/ui/badge';
import { getStatusLabel } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  PlayCircle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  icon?: boolean;
}

const statusConfig: Record<string, {
  variant: 'default' | 'success' | 'error' | 'warning' | 'info';
  icon: React.ReactNode;
}> = {
  COMPLETED: { variant: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  FINISHED: { variant: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  SUCCESS: { variant: 'success', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  PENDING: { variant: 'warning', icon: <Clock className="w-3.5 h-3.5" /> },
  OPEN: { variant: 'info', icon: <PlayCircle className="w-3.5 h-3.5" /> },
  RUNNING: { variant: 'info', icon: <PlayCircle className="w-3.5 h-3.5" /> },
  LIVE: { variant: 'info', icon: <PlayCircle className="w-3.5 h-3.5" /> },
  FAILED: { variant: 'error', icon: <XCircle className="w-3.5 h-3.5" /> },
  CANCELLED: { variant: 'error', icon: <XCircle className="w-3.5 h-3.5" /> },
  MISSED: { variant: 'error', icon: <XCircle className="w-3.5 h-3.5" /> },
  ERROR: { variant: 'error', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  LOCKED: { variant: 'warning', icon: <Clock className="w-3.5 h-3.5" /> },
  CLOSED: { variant: 'warning', icon: <Clock className="w-3.5 h-3.5" /> },
};

export function StatusBadge({
  status,
  variant: customVariant,
  icon = true,
}: StatusBadgeProps) {
  const config = statusConfig[status] || {
    variant: 'default' as const,
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  };

  const variant = customVariant || config.variant;
  const label = getStatusLabel(status);

  return (
    <Badge variant={variant} className="flex items-center gap-1.5">
      {icon && config.icon}
      {label}
    </Badge>
  );
}

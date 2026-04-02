'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, Users, Trophy, Share2, Check, Lock,
  Globe, ChevronRight, CheckCircle2, XCircle, Medal,
  QrCode, Bell, AlertTriangle, CreditCard, Copy,
  Upload, ExternalLink, ImageIcon, Loader2, X,
  TrendingUp, Target, Sparkles, PlayCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import {
  useCausa, useCausaVotes, useMyVote,
  useCausaLeaderboard, useVoteCausa, useCreatorJoin,
  useRemoveVote, useCancelCausa, useOpenScheduledCausa,
  useNotifyPaid, useConfirmCausaPayment, useRejectCausaPayment,
  usePendingCausaPayments, useUploadCausaProof,
  CAUSA_CATEGORY_LABELS, CAUSA_STATUS_LABELS, formatDeadline,
  type CausaOption, type CausaVote,
} from '@/hooks/use-causas';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Barra de opção ───────────────────────────────────────────

function OptionBar({
  option, isSelected, isWinner, isResolved, onVote, disabled,
}: {
  option: CausaOption;
  isSelected: boolean;
  isWinner: boolean;
  isResolved: boolean;
  totalVotes: number;
  onVote: () => void;
  disabled: boolean;
}) {
  const pct = option.percentage ?? 0;
  return (
    <button
      onClick={onVote}
      disabled={disabled || isResolved}
      className={cn(
        'w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden',
        isWinner
          ? 'border-emerald-500/60 bg-emerald-500/10'
          : isSelected
          ? 'border-blue-500/60 bg-blue-500/10'
          : isResolved
          ? 'border-gray-800 opacity-50'
          : 'border-gray-800 hover:border-gray-600 bg-surface',
        (disabled && !isResolved) ? 'cursor-default' : 'cursor-pointer',
      )}
    >
      {/* Barra de progresso como background */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 rounded-xl transition-all duration-700 opacity-10',
          isWinner ? 'bg-emerald-500' : isSelected ? 'bg-blue-500' : 'bg-gray-500',
        )}
        style={{ width: `${pct}%` }}
      />

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {option.emoji && <span className="text-lg shrink-0">{option.emoji}</span>}
          <div className="min-w-0">
            <span className="font-semibold text-sm text-white block truncate">
              {option.label}
            </span>
            {isSelected && !isResolved && (
              <span className="text-xs text-blue-400">seu voto</span>
            )}
            {isWinner && (
              <span className="text-xs text-emerald-400 flex items-center gap-0.5">
                <Trophy className="w-3 h-3" /> Vencedora
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-white tabular-nums">
            {option.percentage != null ? `${option.percentage}%` : '—'}
          </p>
          {option.voteCount != null && (
            <p className="text-xs text-gray-500">
              {option.voteCount} voto{option.voteCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Card de pagamento ─────────────────────────────────────────

function CausaPaymentCard({
  causaId, myVote, isCreator,
}: {
  causaId: string;
  myVote: CausaVote & { qrCodeBase64?: string | null };
  isCreator: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [notified, setNotified] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const notifyPaidMutation  = useNotifyPaid();
  const removeVoteMutation  = useRemoveVote();
  const uploadProofMutation = useUploadCausaProof();

  const isPaid    = myVote.paymentStatus === 'PAID';
  const isFailed  = myVote.paymentStatus === 'FAILED';
  const isPending = myVote.paymentStatus === 'PENDING';
  const isFree    = myVote.amount === 0;

  const handleCopy = () => {
    if (myVote.pixPayload) {
      navigator.clipboard.writeText(myVote.pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadProofMutation.mutate({ causaId, file });
  };

  const handleLeave = () => {
    removeVoteMutation.mutate(causaId, {
      onSuccess: () => router.push('/causas'),
    });
  };

  if (isFree) return null;

  return (
    <div className="bg-surface border border-surface-lighter rounded-2xl p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
        <CreditCard className="w-4 h-4 text-gray-400" />
        Meu pagamento
      </p>

      {/* Resumo valor + status */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/60 border border-gray-800">
        <div>
          <p className="text-xs text-gray-500">
            {myVote.numCotas} cota{myVote.numCotas > 1 ? 's' : ''} × {formatCurrency(myVote.amount / myVote.numCotas)}
          </p>
          <p className="text-2xl font-bold text-blue-400 mt-0.5">{formatCurrency(myVote.amount)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          {isPaid ? (
            <span className="flex items-center gap-1 text-sm font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado
            </span>
          ) : isPending ? (
            <span className="flex items-center gap-1 text-sm font-semibold text-yellow-400">
              <Clock className="w-3.5 h-3.5" /> Aguardando
            </span>
          ) : isFailed ? (
            <span className="flex items-center gap-1 text-sm font-semibold text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" /> Recusado
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm font-semibold text-gray-400">
              <Clock className="w-3.5 h-3.5" /> Pendente
            </span>
          )}
        </div>
      </div>

      {/* Pago */}
      {isPaid && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">Pagamento confirmado</p>
            {myVote.paidAt && (
              <p className="text-xs text-gray-400 mt-0.5">
                em {new Date(myVote.paidAt).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Rejeitado */}
      {isFailed && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-300 leading-relaxed">
            Pagamento não confirmado. Entre em contato com o criador.
          </p>
        </div>
      )}

      {/* Aguardando confirmação */}
      {isPending && myVote.notifiedAt && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <Clock className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-300">Pagamento enviado para análise</p>
            <p className="text-xs text-yellow-400/60 mt-0.5">Aguarde a confirmação do criador.</p>
          </div>
        </div>
      )}

      {/* QR Code */}
      {!isPaid && myVote.qrCodeBase64 && (
        <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 border border-gray-800">
          <img src={myVote.qrCodeBase64} alt="QR Code PIX" className="w-44 h-44 rounded-xl" />
          <p className="text-xs text-gray-500">Escaneie para pagar via PIX</p>
        </div>
      )}

      {!isPaid && !myVote.qrCodeBase64 && myVote.pixPayload && (
        <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-surface border border-gray-800">
          <QrCode className="w-10 h-10 text-gray-600" />
          <p className="text-xs text-gray-500">Use o Pix Copia e Cola abaixo</p>
        </div>
      )}

      {/* Pix copia e cola */}
      {!isPaid && myVote.pixPayload && (
        <div className="rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-3 py-2 bg-gray-900/60 border-b border-gray-800">
            <p className="text-xs font-semibold text-gray-400">Pix Copia e Cola</p>
          </div>
          <div className="flex items-center gap-2 p-3">
            <p className="flex-1 text-xs text-gray-500 font-mono break-all line-clamp-2 leading-relaxed">
              {myVote.pixPayload}
            </p>
            <Button
              size="sm"
              variant="outline"
              className={cn('shrink-0 gap-1.5 transition-colors', copied && 'border-emerald-500 text-emerald-400')}
              onClick={handleCopy}
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>
        </div>
      )}

      {/* Botão notificar */}
      {!isPaid && myVote.pixPayload && (
        <>
          {notified || myVote.notifiedAt ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
              <p className="text-xs text-yellow-300">Aguardando confirmação do criador.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-300 leading-relaxed">
                  Após realizar o PIX, avise o criador para confirmar sua participação.
                </p>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => notifyPaidMutation.mutate(causaId, { onSuccess: () => setNotified(true) })}
                disabled={notifyPaidMutation.isPending}
              >
                {notifyPaidMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                  : <><CheckCircle2 className="w-4 h-4" /> Já realizei o pagamento</>}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Upload comprovante */}
      {!isPaid && isPending && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Comprovante (opcional)</p>
          {(myVote as any).paymentProofUrl ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300 flex-1">Comprovante enviado</p>
              <a
                href={(myVote as any).paymentProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="w-3 h-3" /> Ver
              </a>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-dashed border-gray-700 text-gray-500 hover:border-blue-500/50 hover:text-gray-300 cursor-pointer transition-colors text-sm">
              {uploadProofMutation.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                : <><Upload className="w-4 h-4" /> Anexar comprovante</>}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.webp"
                className="sr-only"
                disabled={uploadProofMutation.isPending}
                onChange={handleProofUpload}
                ref={fileRef}
              />
            </label>
          )}
        </div>
      )}

      {/* Cancelar participação */}
      {!isPaid && !isCreator && (
        <div className="border-t border-gray-800 pt-4">
          {!showCancelConfirm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Cancelar participação</p>
                <p className="text-xs text-gray-600 mt-0.5">Disponível antes da confirmação</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-800 text-red-400 hover:bg-red-500/10"
                onClick={() => setShowCancelConfirm(true)}
              >
                Sair
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Confirmar saída?</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Seu voto será removido. Após confirmação do pagamento não é possível sair.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShowCancelConfirm(false)}>
                  Ficar
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleLeave}
                  disabled={removeVoteMutation.isPending}
                >
                  {removeVoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, sair'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voto travado */}
      {isPaid && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-900/60 border border-gray-800">
          <Lock className="w-4 h-4 text-gray-600 shrink-0" />
          <p className="text-xs text-gray-500">Pagamento confirmado — voto bloqueado.</p>
        </div>
      )}
    </div>
  );
}

// ─── Confirmação de pagamentos (criador) ───────────────────────

function CreatorPaymentsSection({ causaId }: { causaId: string }) {
  const { data: pending } = usePendingCausaPayments(causaId);
  const confirmMutation = useConfirmCausaPayment();
  const rejectMutation  = useRejectCausaPayment();
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!pending?.length) return null;

  return (
    <div className="bg-surface border border-amber-500/30 rounded-2xl p-5 space-y-3">
      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
        <Bell className="w-3.5 h-3.5" />
        Aguardando confirmação ({pending.length})
      </p>
      <div className="space-y-2">
        {pending.map((pmt) => {
          const isProcessing = processingId === pmt.id;
          return (
            <div key={pmt.id} className="flex items-center gap-3 bg-gray-900/60 rounded-xl px-3 py-2.5 border border-gray-800">
              {pmt.user.avatar
                ? <img src={pmt.user.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" />
                : <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">{pmt.user.fullName[0]}</div>
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{pmt.user.fullName}</p>
                <p className="text-xs text-gray-500 truncate">
                  {pmt.option?.label ?? (pmt.numericValue != null ? `Palpite: ${pmt.numericValue}` : '—')}
                  {' · '}{formatCurrency(pmt.amount)}
                  {pmt.notifiedAt && <span className="text-amber-400 ml-1">· notificou</span>}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-800 text-red-400 hover:bg-red-500/10 h-7 text-xs px-2"
                  disabled={isProcessing && rejectMutation.isPending}
                  onClick={() => {
                    setProcessingId(pmt.id);
                    rejectMutation.mutate({ causaId, userId: pmt.userId }, { onSettled: () => setProcessingId(null) });
                  }}
                >
                  {isProcessing && rejectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs px-2 gap-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={isProcessing && confirmMutation.isPending}
                  onClick={() => {
                    setProcessingId(pmt.id);
                    confirmMutation.mutate({ causaId, userId: pmt.userId }, { onSettled: () => setProcessingId(null) });
                  }}
                >
                  {isProcessing && confirmMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────

export default function CausaDetailPage() {
  const { causaId } = useParams<{ causaId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const joinParam = searchParams.get('join');
  const [showJoinPrompt, setShowJoinPrompt] = useState(joinParam === '1');
  const [numericInput, setNumericInput] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [votingCotas, setVotingCotas] = useState(1);

  const { data: causa, isLoading, isError } = useCausa(causaId);
  const { data: votesData, refetch: refetchVotes } = useCausaVotes(causaId);
  const { data: myVote } = useMyVote(causaId);
  const { data: leaderboard } = useCausaLeaderboard(
    causa?.status === 'RESOLVED' ? causaId : null,
  );

  const isCreator = user?.id === causa?.creatorId;
  const isAdmin   = user?.role === 'ADMIN';

  const voteMutation           = useVoteCausa();
  const creatorJoinMutation    = useCreatorJoin();
  const removeVoteMutation     = useRemoveVote();
  const cancelMutation         = useCancelCausa();
  const openScheduledMutation  = useOpenScheduledCausa();

  const isScheduled       = causa?.status === 'SCHEDULED';
  const canResolve        = (isCreator || isAdmin) && (causa?.status === 'OPEN' || causa?.status === 'CLOSED');
  const hasDeadlinePassed = causa ? new Date() > new Date(causa.deadlineAt) : false;
  const isOpenAndActive   = causa?.status === 'OPEN' && !hasDeadlinePassed;

  const isPaid    = myVote?.paymentStatus === 'PAID';
  const isPending = myVote?.paymentStatus === 'PENDING';

  useEffect(() => {
    if (myVote?.optionId)    setSelectedOptionId(myVote.optionId);
    if (myVote?.numericValue != null) setNumericInput(String(myVote.numericValue));
    if (myVote?.numCotas)    setVotingCotas(myVote.numCotas);
  }, [myVote]);

  const handleVote = async (optionId?: string) => {
    if (!isOpenAndActive) return;
    if (isPaid) {
      toast.error('Pagamento confirmado — voto não pode ser alterado.');
      return;
    }
    const payload: any = { numCotas: votingCotas };
    if (optionId) payload.optionId = optionId;
    if (causa?.type === 'NUMERIC') {
      const val = parseFloat(numericInput);
      if (isNaN(val)) return;
      payload.numericValue = val;
    }
    if (isCreator) {
      await creatorJoinMutation.mutateAsync({ causaId, payload });
      setShowJoinPrompt(false);
    } else {
      if (optionId) setSelectedOptionId(optionId);
      await voteMutation.mutateAsync({ causaId, payload });
    }
    refetchVotes();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 w-32 bg-surface rounded animate-pulse" />
        <div className="h-48 bg-surface rounded-2xl animate-pulse" />
        <div className="h-32 bg-surface rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError || !causa) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Causa não encontrada.</p>
        <Link href="/causas"><Button variant="ghost" size="sm" className="mt-3">← Voltar</Button></Link>
      </div>
    );
  }

  const cat        = CAUSA_CATEGORY_LABELS[causa.category];
  const statusMeta = CAUSA_STATUS_LABELS[causa.status];
  const options    = votesData?.options ?? causa.options;
  const totalVotes = votesData?.totalVotes ?? causa._count.votes;

  // Sticky CTA: mostra quando causa aberta + sem voto + sem pagamento pendente
  const showStickyVote = isOpenAndActive && !myVote && (causa.type === 'BINARY' || causa.type === 'CHOICE');

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-28 sm:pb-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex items-center gap-2">
            {canResolve && (
              <Link href={`/causas/${causaId}/resolve`}>
                <Button size="sm" variant="outline" className="gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Resolver</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copiado!'); }}
              className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-surface transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card principal */}
        <div className="bg-surface border border-surface-lighter rounded-2xl p-5 space-y-4">
          {/* Badges */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}>
                {cat.label}
              </span>
              <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${statusMeta.color}`}>
                {statusMeta.label}
              </span>
            </div>
            {causa.visibility === 'PRIVATE'
              ? <Lock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              : <Globe className="w-3.5 h-3.5 text-gray-600 shrink-0" />
            }
          </div>

          <h1 className="text-lg font-bold text-white leading-snug">{causa.title}</h1>
          {causa.description && (
            <p className="text-sm text-gray-500 leading-relaxed">{causa.description}</p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {totalVotes} voto{totalVotes !== 1 ? 's' : ''}
            </span>
            {causa.status === 'OPEN' && !hasDeadlinePassed && (
              <span className="flex items-center gap-1 text-orange-400">
                <Clock className="w-3.5 h-3.5" />
                Encerra em {formatDeadline(causa.deadlineAt)}
              </span>
            )}
            {causa.entryFee > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <Trophy className="w-3.5 h-3.5" />
                Prize: {formatCurrency(causa.prizePool)}
              </span>
            )}
            <span className="text-xs text-gray-600">por {causa.creator.fullName}</span>
          </div>
        </div>

        {/* Banner "Em Breve" */}
        {isScheduled && (
          <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/60 to-gray-900 p-5">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
            <div className="relative flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-violet-300" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">Votação em breve!</p>
                <p className="text-sm text-gray-400 mt-1">
                  Esta causa ainda não está aberta para votação. Fique de olho — em breve você poderá fazer sua previsão.
                </p>
              </div>
            </div>
            {/* Botão para criador/admin abrir */}
            {(isCreator || isAdmin) && (
              <div className="mt-4 pt-4 border-t border-violet-500/20">
                <p className="text-xs text-gray-500 mb-2">Você é o criador — quando quiser abrir para votação:</p>
                <Button
                  size="sm"
                  className="gap-2 bg-violet-600 hover:bg-violet-700"
                  onClick={() => openScheduledMutation.mutate(causaId)}
                  disabled={openScheduledMutation.isPending}
                >
                  {openScheduledMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Abrindo...</>
                    : <><PlayCircle className="w-4 h-4" /> Abrir votação agora</>}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Pagamento — aparece imediatamente se há voto com taxa */}
        {myVote && causa.entryFee > 0 && (
          <CausaPaymentCard
            causaId={causaId}
            myVote={myVote as any}
            isCreator={isCreator}
          />
        )}

        {/* Banner resultado */}
        {causa.status === 'RESOLVED' && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5" />
              <span className="font-bold text-lg">Resultado!</span>
            </div>
            {causa.resolvedOption && (
              <p className="text-blue-100">Vencedora: <strong className="text-white">{causa.resolvedOption.label}</strong></p>
            )}
            {causa.resolvedNumericValue != null && (
              <p className="text-blue-100">Resultado: <strong className="text-white">{causa.resolvedNumericValue} {causa.numericUnit ?? ''}</strong></p>
            )}
            {myVote != null && (
              <div className={`mt-3 p-3 rounded-xl flex items-center gap-2 ${myVote.isCorrect ? 'bg-white/20' : 'bg-black/20'}`}>
                {myVote.isCorrect
                  ? <><CheckCircle2 className="w-4 h-4 shrink-0" /><p className="font-semibold">Você acertou!{myVote.prizeAmount ? ` Prêmio: ${formatCurrency(Number(myVote.prizeAmount))}` : ''}</p></>
                  : <><XCircle className="w-4 h-4 shrink-0" /><p>Você errou desta vez.</p></>
                }
              </div>
            )}
          </div>
        )}

        {/* Modal: criador quer participar */}
        {showJoinPrompt && causa.status === 'OPEN' && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
            <p className="text-sm font-medium text-amber-300 mb-3">
              Deseja participar da sua própria causa?
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowJoinPrompt(false)}>Sim, participar</Button>
              <Button size="sm" variant="outline" onClick={() => setShowJoinPrompt(false)}>Não</Button>
            </div>
          </div>
        )}

        {/* Aviso: voto não conta sem pagamento */}
        {isPending && causa.entryFee > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <Clock className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-sm text-yellow-300 leading-relaxed">
              Seu voto <strong>só será contabilizado após a confirmação</strong> do pagamento.
            </p>
          </div>
        )}

        {/* Votação — BINARY / CHOICE */}
        {(causa.type === 'BINARY' || causa.type === 'CHOICE') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                {causa.status === 'RESOLVED' ? 'Resultado por opção' : 'Vote na sua previsão'}
              </h2>
              {isPaid && isOpenAndActive && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Lock className="w-3 h-3" /> Bloqueado
                </span>
              )}
            </div>

            <div className="space-y-2">
              {options.map((opt) => (
                <OptionBar
                  key={opt.id}
                  option={opt}
                  isSelected={myVote?.optionId === opt.id || selectedOptionId === opt.id}
                  isWinner={causa.resolvedOptionId === opt.id}
                  isResolved={causa.status === 'RESOLVED'}
                  totalVotes={totalVotes}
                  onVote={() => handleVote(opt.id)}
                  disabled={!isOpenAndActive || !!isPaid || voteMutation.isPending || creatorJoinMutation.isPending}
                />
              ))}
            </div>

            {/* Seletor de cotas (só sem voto) */}
            {isOpenAndActive && causa.entryFee > 0 && !myVote && (
              <div className="bg-surface border border-surface-lighter rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-3">
                  Cotas — {formatCurrency(causa.entryFee)}/cota · máx. {causa.cotasPerParticipant}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {Array.from({ length: causa.cotasPerParticipant }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setVotingCotas(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                        votingCotas === n
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <span className="text-sm font-semibold text-white ml-1">
                    = {formatCurrency(causa.entryFee * votingCotas)}
                  </span>
                </div>
              </div>
            )}

            {/* Retirar voto */}
            {myVote && isOpenAndActive && !isPaid && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 w-full"
                onClick={() => {
                  if (causa.entryFee > 0) {
                    toast.info('Use "Sair" no card de pagamento acima.');
                  } else {
                    removeVoteMutation.mutate(causaId);
                  }
                }}
                disabled={removeVoteMutation.isPending}
              >
                Retirar voto
              </Button>
            )}

            {myVote && isOpenAndActive && isPaid && (
              <button
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-600 cursor-default"
                onClick={() => toast.error('Pagamento confirmado — não é possível retirar o voto.')}
              >
                <Lock className="w-3 h-3" /> Voto bloqueado
              </button>
            )}
          </div>
        )}

        {/* Votação — NUMERIC */}
        {causa.type === 'NUMERIC' && (
          <div className="bg-surface border border-surface-lighter rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                {causa.status === 'RESOLVED' ? 'Resultado' : 'Sua previsão'}
              </h2>
              {isPaid && isOpenAndActive && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Lock className="w-3 h-3" /> Bloqueado
                </span>
              )}
            </div>

            {causa.status === 'RESOLVED' ? (
              <p className="text-3xl font-bold text-white">
                {causa.resolvedNumericValue}{' '}
                <span className="text-base font-normal text-gray-400">{causa.numericUnit}</span>
              </p>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={`Seu palpite em ${causa.numericUnit ?? 'número'}...`}
                  value={numericInput}
                  onChange={(e) => setNumericInput(e.target.value)}
                  disabled={!isOpenAndActive || isPaid}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleVote()}
                  disabled={!isOpenAndActive || isPaid || !numericInput || voteMutation.isPending}
                  className="shrink-0"
                >
                  {voteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : myVote ? 'Atualizar' : 'Votar'}
                </Button>
              </div>
            )}

            {myVote?.numericValue != null && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-900/60 border border-gray-800">
                <Target className="w-4 h-4 text-gray-500 shrink-0" />
                <p className="text-sm text-gray-400">
                  Seu palpite: <strong className="text-white">{myVote.numericValue} {causa.numericUnit}</strong>
                  {myVote.isCorrect === true  && <CheckCircle2 className="w-3.5 h-3.5 inline ml-1.5 text-emerald-400" />}
                  {myVote.isCorrect === false && <XCircle className="w-3.5 h-3.5 inline ml-1.5 text-red-400" />}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Confirmação de pagamentos (criador/admin) */}
        {(isCreator || isAdmin) && (
          <CreatorPaymentsSection causaId={causaId} />
        )}

        {/* Leaderboard */}
        {causa.status === 'RESOLVED' && leaderboard && leaderboard.length > 0 && (
          <div className="bg-surface border border-surface-lighter rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" /> Acertadores ({leaderboard.length})
            </h2>
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((entry) => (
                <div key={entry.user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-900/60 transition-colors">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    entry.rank === 1 ? 'bg-yellow-400 text-yellow-900'
                    : entry.rank === 2 ? 'bg-gray-400 text-gray-900'
                    : entry.rank === 3 ? 'bg-amber-600 text-white'
                    : 'bg-gray-800 text-gray-400'
                  }`}>
                    {entry.rank <= 3 ? <Medal className="w-3.5 h-3.5" /> : entry.rank}
                  </span>
                  {entry.user.avatar
                    ? <img src={entry.user.avatar} className="w-7 h-7 rounded-full object-cover" />
                    : <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">{entry.user.fullName[0]}</div>
                  }
                  <span className="text-sm text-gray-300 flex-1">
                    {entry.user.fullName}
                    {entry.numCotas > 1 && <span className="text-xs text-gray-500 ml-1">({entry.numCotas} cotas)</span>}
                  </span>
                  {entry.prizeAmount && (
                    <span className="text-sm font-semibold text-emerald-400">
                      {formatCurrency(Number(entry.prizeAmount))}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações do criador */}
        {isCreator && causa.status !== 'RESOLVED' && causa.status !== 'CANCELLED' && (
          <div className="bg-surface border border-surface-lighter rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Ações do criador
            </p>
            {canResolve && (
              <Link href={`/causas/${causaId}/resolve`} className="block">
                <Button size="sm" className="w-full gap-1.5 mb-2">
                  <Trophy className="w-4 h-4" /> Definir resultado
                </Button>
              </Link>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full text-red-400 border-red-800 hover:bg-red-500/10"
              onClick={() => {
                if (confirm('Cancelar esta causa? Os participantes serão notificados.')) {
                  cancelMutation.mutate(causaId);
                  router.push('/causas');
                }
              }}
              disabled={cancelMutation.isPending}
            >
              Cancelar causa
            </Button>
          </div>
        )}
      </div>

      {/* Sticky CTA no mobile — só quando causa aberta e sem voto */}
      {showStickyVote && (
        <div className="fixed bottom-0 left-0 right-0 sm:hidden z-30 bg-gray-950/95 backdrop-blur border-t border-gray-800 px-4 py-3 safe-bottom">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <div className="flex-1">
              <p className="text-xs text-gray-500">Entrar na causa</p>
              {causa.entryFee > 0 ? (
                <p className="text-sm font-bold text-white">{formatCurrency(causa.entryFee * votingCotas)} / {votingCotas} cota{votingCotas > 1 ? 's' : ''}</p>
              ) : (
                <p className="text-sm font-bold text-white">Participação gratuita</p>
              )}
            </div>
            <Button
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => {
                document.getElementById('voting-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <Target className="w-4 h-4" /> Votar agora
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

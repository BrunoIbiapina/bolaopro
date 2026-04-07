'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, Users, Trophy, Share2, Check, X,
  Lock, Globe, ChevronRight, CheckCircle2, XCircle, Medal,
  Copy, MessageCircle, QrCode, Banknote, AlertCircle, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import {
  useCausa, useCausaVotes, useMyVote,
  useCausaLeaderboard, useVoteCausa, useCreatorJoin,
  useRemoveVote, useCancelCausa, useCausaParticipants,
  useCausaPayment, useGenerateCausaPayment, useNotifyCausaPaid,
  CAUSA_CATEGORY_LABELS, CAUSA_STATUS_LABELS, formatDeadline,
  type CausaOption,
} from '@/hooks/use-causas';

// ─── Modal de compartilhamento ───────────────────────────────

function ShareModal({
  causa,
  onClose,
}: {
  causa: any;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/causas/invite/${causa.inviteCode}`
    : '';

  const cat = CAUSA_CATEGORY_LABELS[causa.category as keyof typeof CAUSA_CATEGORY_LABELS];

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: causa.title,
        text: `Participe da causa: ${causa.title}`,
        url: inviteUrl,
      });
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Participe da causa: *${causa.title}*\n${inviteUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-6 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex items-start justify-between mb-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur`}>
              {cat?.emoji} {cat?.label}
            </span>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-lg font-bold leading-snug mb-3">{causa.title}</h2>
          <div className="flex items-center gap-4 text-sm text-blue-100">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {causa._count.votes} participante{causa._count.votes !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDeadline(causa.deadlineAt)}
            </span>
            {causa.entryFee > 0 && (
              <span className="flex items-center gap-1 text-yellow-300 font-semibold">
                <Trophy className="w-3.5 h-3.5" />
                R$ {causa.prizePool.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Link + botões */}
        <div className="p-5 space-y-4">
          {/* Link copiável */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Link de convite
            </p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5">
              <span className="text-sm text-gray-600 dark:text-gray-300 flex-1 truncate">{inviteUrl}</span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${
                  copied
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Ações de share */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
            {'share' in navigator ? (
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
            ) : (
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copiar link
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Barra de progresso por opção ────────────────────────────

function OptionBar({
  option,
  isSelected,
  isWinner,
  isResolved,
  totalVotes,
  onVote,
  disabled,
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
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        isWinner
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : isResolved
          ? 'border-gray-200 dark:border-gray-700 opacity-60'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
      } ${disabled && !isResolved ? 'cursor-default' : ''}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 font-medium text-sm text-gray-800 dark:text-white">
          {option.emoji && <span>{option.emoji}</span>}
          {option.label}
          {isSelected && !isResolved && (
            <span className="ml-1 text-xs text-blue-600 dark:text-blue-400 font-normal">(seu voto)</span>
          )}
          {isWinner && (
            <span className="ml-1 inline-flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400">
              <Trophy className="w-3 h-3" /> Vencedora
            </span>
          )}
        </span>
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          {option.percentage != null ? `${option.percentage}%` : '—'}
        </span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isWinner ? 'bg-green-500' : isSelected ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {option.voteCount != null && (
        <p className="text-xs text-gray-400 mt-1">
          {option.voteCount} voto{option.voteCount !== 1 ? 's' : ''}
          {(option.cotasCount ?? 0) > option.voteCount
            ? ` · ${option.cotasCount} cotas`
            : ''}
        </p>
      )}
    </button>
  );
}

// ─── Página de detalhe ────────────────────────────────────────

export default function CausaDetailPage() {
  const { causaId } = useParams<{ causaId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const joinParam = searchParams.get('join');
  const [showJoinPrompt, setShowJoinPrompt] = useState(joinParam === '1');
  const [showShareModal, setShowShareModal] = useState(false);
  const [numericInput, setNumericInput] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [votingCotas, setVotingCotas] = useState(1);

  const { data: causa, isLoading, isError } = useCausa(causaId);
  const { data: votesData, refetch: refetchVotes } = useCausaVotes(causaId);
  const { data: myVote } = useMyVote(causaId);
  const { data: leaderboard } = useCausaLeaderboard(
    causa?.status === 'RESOLVED' ? causaId : null,
  );

  const voteMutation = useVoteCausa();
  const creatorJoinMutation = useCreatorJoin();
  const removeVoteMutation = useRemoveVote();
  const cancelMutation = useCancelCausa();
  const { data: participants } = useCausaParticipants(causaId);

  // Payment
  const isPaidCausa = (causa?.entryFee ?? 0) > 0;
  const { data: paymentData } = useCausaPayment(isPaidCausa && !!user ? causaId : null);
  const generatePayment = useGenerateCausaPayment();
  const notifyPaid = useNotifyCausaPaid();
  const [copiedPix, setCopiedPix] = useState(false);

  const isCreator = user?.id === causa?.creatorId;
  const isAdmin = user?.role === 'ADMIN';
  const canResolve = (isCreator || isAdmin) && (causa?.status === 'OPEN' || causa?.status === 'CLOSED');
  const canVote = causa?.status === 'OPEN' && !isCreator;
  const hasDeadlinePassed = causa ? new Date() > new Date(causa.deadlineAt) : false;
  const isOpenAndActive = causa?.status === 'OPEN' && !hasDeadlinePassed;

  // Inicializar seleção com meu voto atual
  useEffect(() => {
    if (myVote?.optionId) setSelectedOptionId(myVote.optionId);
    if (myVote?.numericValue != null) setNumericInput(String(myVote.numericValue));
    if (myVote?.numCotas) setVotingCotas(myVote.numCotas);
  }, [myVote]);

  const handleVote = async (optionId?: string) => {
    if (!isOpenAndActive) return;

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

  const handleCopyPix = () => {
    if (paymentData?.pixPayload) {
      navigator.clipboard.writeText(paymentData.pixPayload);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError || !causa) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-gray-400">Causa não encontrada.</p>
        <Link href="/causas"><Button variant="ghost" size="sm" className="mt-3">← Voltar</Button></Link>
      </div>
    );
  }

  const cat = CAUSA_CATEGORY_LABELS[causa.category];
  const statusMeta = CAUSA_STATUS_LABELS[causa.status];
  const options = votesData?.options ?? causa.options;
  const totalVotes = votesData?.totalVotes ?? causa._count.votes;
  const myVoteOptionId = myVote?.optionId;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {showShareModal && (
        <ShareModal causa={causa} onClose={() => setShowShareModal(false)} />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-center gap-2">
          {canResolve && (
            <Link href={`/causas/${causaId}/resolve`}>
              <Button size="sm" variant="outline">
                Resolver <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          )}
          <button
            onClick={() => setShowShareModal(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card principal */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}>
              {cat.emoji} {cat.label}
            </span>
            <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
          </div>
          {causa.visibility === 'PRIVATE' ? (
            <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          )}
        </div>

        <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
          {causa.title}
        </h1>
        {causa.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{causa.description}</p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {totalVotes} voto{totalVotes !== 1 ? 's' : ''}
          </span>
          {causa.status === 'OPEN' && !hasDeadlinePassed && (
            <span className="flex items-center gap-1 text-orange-500">
              <Clock className="w-3.5 h-3.5" />
              Encerra em {formatDeadline(causa.deadlineAt)}
            </span>
          )}
          {causa.entryFee > 0 && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Trophy className="w-3.5 h-3.5" />
              Prize: R$ {causa.prizePool.toFixed(2)}
            </span>
          )}
          <span className="text-xs text-gray-400">por {causa.creator.fullName}</span>
        </div>
      </div>

      {/* Banner de resolução */}
      {causa.status === 'RESOLVED' && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5" />
            <span className="font-bold text-lg">Resultado!</span>
          </div>
          {causa.resolvedOption && (
            <p className="text-blue-100">
              Vencedora: <strong>{causa.resolvedOption.emoji} {causa.resolvedOption.label}</strong>
            </p>
          )}
          {causa.resolvedNumericValue != null && (
            <p className="text-blue-100">
              Resultado: <strong>{causa.resolvedNumericValue} {causa.numericUnit ?? ''}</strong>
            </p>
          )}

          {/* Meu resultado */}
          {myVote != null && (
            <div className={`mt-3 p-3 rounded-xl flex items-center gap-2 ${myVote.isCorrect ? 'bg-green-500/30' : 'bg-white/10'}`}>
              {myVote.isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <p className="font-semibold">Você acertou!{myVote.prizeAmount ? ` Prêmio: R$ ${myVote.prizeAmount.toFixed(2)}` : ''}</p>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  <p>Você errou desta vez.</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: criador quer participar */}
      {showJoinPrompt && causa.status === 'OPEN' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-3">
            Deseja participar da sua própria causa?
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => {
              if (causa.type === 'BINARY' || causa.type === 'CHOICE') {
                // Rola para opções
                setShowJoinPrompt(false);
              }
            }}>
              Sim, participar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowJoinPrompt(false)}>
              Não
            </Button>
          </div>
        </div>
      )}

      {/* Votação — BINARY / CHOICE */}
      {(causa.type === 'BINARY' || causa.type === 'CHOICE') && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {causa.status === 'RESOLVED' ? 'Resultado por opção' : 'Vote na sua previsão'}
          </h2>
          <div className="space-y-2">
            {options.map((opt) => (
              <OptionBar
                key={opt.id}
                option={opt}
                isSelected={myVoteOptionId === opt.id || selectedOptionId === opt.id}
                isWinner={causa.resolvedOptionId === opt.id}
                isResolved={causa.status === 'RESOLVED'}
                totalVotes={totalVotes}
                onVote={() => handleVote(opt.id)}
                disabled={!isOpenAndActive || voteMutation.isPending || creatorJoinMutation.isPending}
              />
            ))}
          </div>

          {/* Cotas */}
          {isOpenAndActive && !hasDeadlinePassed && causa.entryFee > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Cotas (R$ {causa.entryFee.toFixed(2)}/cota · máx. {causa.cotasPerParticipant})
              </p>
              <div className="flex gap-2">
                {Array.from({ length: causa.cotasPerParticipant }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setVotingCotas(n)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                      votingCotas === n
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <span className="text-xs text-gray-400 self-center ml-1">
                  = R$ {(causa.entryFee * votingCotas).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {myVote && isOpenAndActive && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 w-full"
              onClick={() => removeVoteMutation.mutate(causaId)}
              disabled={removeVoteMutation.isPending}
            >
              Retirar voto
            </Button>
          )}
        </div>
      )}

      {/* Votação — NUMERIC */}
      {causa.type === 'NUMERIC' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {causa.status === 'RESOLVED' ? 'Resultado' : 'Sua previsão'}
          </h2>
          {causa.status === 'RESOLVED' ? (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {causa.resolvedNumericValue} <span className="text-base font-normal text-gray-400">{causa.numericUnit}</span>
            </p>
          ) : (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={`Seu palpite em ${causa.numericUnit ?? 'número'}...`}
                value={numericInput}
                onChange={(e) => setNumericInput(e.target.value)}
                disabled={!isOpenAndActive}
                className="flex-1"
              />
              <Button
                onClick={() => handleVote()}
                disabled={!isOpenAndActive || !numericInput || voteMutation.isPending}
              >
                {myVote ? 'Atualizar' : 'Votar'}
              </Button>
            </div>
          )}
          {myVote?.numericValue != null && (
            <p className="text-xs text-gray-400">
              Seu palpite: <strong className="text-gray-700 dark:text-gray-300">{myVote.numericValue} {causa.numericUnit}</strong>
              {myVote.isCorrect === true && <CheckCircle2 className="w-3 h-3 inline ml-1 text-green-500" />}
              {myVote.isCorrect === false && <XCircle className="w-3 h-3 inline ml-1 text-red-400" />}
            </p>
          )}
        </div>
      )}

      {/* Pagamento PIX */}
      {isPaidCausa && myVote && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <Banknote className="w-4 h-4" /> Pagamento
          </h2>

          {/* Sem pagamento gerado ainda */}
          {(!paymentData || paymentData.paymentStatus === 'NOT_REQUESTED') && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Valor a pagar: <strong className="text-gray-900 dark:text-white">
                  R$ {(causa.entryFee * (myVote.numCotas ?? 1)).toFixed(2)}
                </strong>
                {(myVote.numCotas ?? 1) > 1 && (
                  <span className="text-xs text-gray-400 ml-1">({myVote.numCotas} cotas)</span>
                )}
              </p>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => generatePayment.mutate(causaId)}
                disabled={generatePayment.isPending}
              >
                <QrCode className="w-4 h-4" />
                Gerar PIX para pagar
              </Button>
            </div>
          )}

          {/* Pagamento gerado — pendente */}
          {paymentData && paymentData.paymentStatus === 'PENDING' && paymentData.pixPayload && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {paymentData.notifiedAt
                  ? 'Aguardando confirmação do administrador'
                  : 'Pagamento pendente — copie o código PIX abaixo'}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  PIX Copia e Cola
                </p>
                <div className="flex items-start gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-1 break-all font-mono leading-relaxed">
                    {paymentData.pixPayload}
                  </span>
                  <button
                    onClick={handleCopyPix}
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0 mt-0.5 ${
                      copiedPix
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200'
                    }`}
                  >
                    {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPix ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Chave PIX: <span className="font-medium text-gray-600 dark:text-gray-300">{paymentData.pixKey}</span>
                  {' · '}Valor: <strong>R$ {paymentData.amount?.toFixed(2)}</strong>
                </p>
              </div>

              {!paymentData.notifiedAt && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1.5"
                  onClick={() => notifyPaid.mutate(causaId)}
                  disabled={notifyPaid.isPending}
                >
                  <Check className="w-4 h-4" />
                  Já paguei — avisar admin
                </Button>
              )}
            </div>
          )}

          {/* Pagamento confirmado */}
          {paymentData && paymentData.paymentStatus === 'PAID' && (
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">Pagamento confirmado</p>
                <p className="text-xs text-green-600/70 dark:text-green-500 mt-0.5">
                  Seu voto está bloqueado e garantido.
                </p>
              </div>
            </div>
          )}

          {/* Pagamento rejeitado */}
          {paymentData && paymentData.paymentStatus === 'FAILED' && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Pagamento não confirmado</p>
                <p className="text-xs text-red-500/70 dark:text-red-400/70 mt-0.5">Entre em contato com o organizador.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {causa.status === 'RESOLVED' && leaderboard && leaderboard.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <Trophy className="w-4 h-4" /> Acertadores ({leaderboard.length})
          </h2>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((entry) => (
              <div key={entry.user.id} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  entry.rank === 1 ? 'bg-yellow-400 text-yellow-900'
                  : entry.rank === 2 ? 'bg-gray-300 text-gray-700'
                  : entry.rank === 3 ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                }`}>
                  {entry.rank <= 3 ? <Medal className="w-3 h-3" /> : entry.rank}
                </span>
                {entry.user.avatar ? (
                  <img src={entry.user.avatar} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-bold text-blue-600">
                    {entry.user.fullName[0]}
                  </div>
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  {entry.user.fullName}
                  {entry.numCotas > 1 && <span className="text-xs text-gray-400 ml-1">({entry.numCotas} cotas)</span>}
                </span>
                {entry.prizeAmount && (
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    R$ {entry.prizeAmount.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participantes */}
      {participants && participants.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Participantes ({participants.length})
          </h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {participants.map((p) => (
              <div
                key={p.userId}
                className={`flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 ${
                  p.isCorrect === true
                    ? 'opacity-100'
                    : p.isCorrect === false
                    ? 'opacity-60'
                    : ''
                }`}
              >
                {/* Avatar */}
                {p.user.avatar ? (
                  <img src={p.user.avatar} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">
                    {p.user.fullName[0]}
                  </div>
                )}

                {/* Nome */}
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                  {p.user.fullName}
                  {p.numCotas > 1 && (
                    <span className="text-xs text-gray-400 ml-1">({p.numCotas}x)</span>
                  )}
                </span>

                {/* Voto */}
                {p.optionEmoji || p.optionLabel ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 flex-shrink-0">
                    {p.optionEmoji && <span className="mr-1">{p.optionEmoji}</span>}
                    {p.optionLabel}
                  </span>
                ) : p.numericValue != null ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 flex-shrink-0">
                    {p.numericValue} {causa.numericUnit ?? ''}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 flex-shrink-0">votou</span>
                )}

                {/* Resultado (só após resolução) */}
                {p.isCorrect === true && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    {p.prizeAmount ? `R$ ${p.prizeAmount.toFixed(2)}` : 'Acertou'}
                  </span>
                )}
                {p.isCorrect === false && (
                  <span className="flex items-center gap-1 text-xs text-red-400 flex-shrink-0">
                    <X className="w-3.5 h-3.5" /> Errou
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ações do criador */}
      {isCreator && causa.status !== 'RESOLVED' && causa.status !== 'CANCELLED' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Ações do criador
          </p>
          {canResolve && (
            <Link href={`/causas/${causaId}/resolve`}>
              <Button size="sm" className="w-full mb-2 gap-1.5">
                <Trophy className="w-4 h-4" /> Definir resultado
              </Button>
            </Link>
          )}
          <Button
            size="sm"
            variant="outline"
            className="w-full text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
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
  );
}

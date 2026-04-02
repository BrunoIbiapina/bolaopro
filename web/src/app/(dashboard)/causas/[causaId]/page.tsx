'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, Users, Trophy, Share2, Check, X,
  Crown, Lock, Globe, AlertCircle, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import {
  useCausa, useCausaVotes, useMyVote,
  useCausaLeaderboard, useVoteCausa, useCreatorJoin,
  useRemoveVote, useCancelCausa,
  CAUSA_CATEGORY_LABELS, CAUSA_STATUS_LABELS, formatDeadline,
  type CausaOption,
} from '@/hooks/use-causas';

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
            onClick={() => navigator.clipboard.writeText(window.location.href)}
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
            <div className={`mt-3 p-3 rounded-xl ${myVote.isCorrect ? 'bg-green-500/30' : 'bg-white/10'}`}>
              {myVote.isCorrect ? (
                <p className="font-semibold">🎉 Você acertou!{myVote.prizeAmount ? ` Prêmio: R$ ${myVote.prizeAmount.toFixed(2)}` : ''}</p>
              ) : (
                <p>😔 Você errou desta vez.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: criador quer participar */}
      {showJoinPrompt && causa.status === 'OPEN' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-3">
            💡 Deseja participar da sua própria causa?
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
              {myVote.isCorrect === true && ' ✅'}
              {myVote.isCorrect === false && ' ❌'}
            </p>
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
                  {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : entry.rank}
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

      {/* Ações do criador */}
      {isCreator && causa.status !== 'RESOLVED' && causa.status !== 'CANCELLED' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Ações do criador
          </p>
          {canResolve && (
            <Link href={`/causas/${causaId}/resolve`}>
              <Button size="sm" className="w-full mb-2">
                🏆 Definir resultado
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

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCausa, useCausaVotes, useResolveCausa } from '@/hooks/use-causas';
import { useAuth } from '@/hooks/use-auth';

export default function ResolveCausaPage() {
  const { causaId } = useParams<{ causaId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const { data: causa, isLoading } = useCausa(causaId);
  const { data: votesData } = useCausaVotes(causaId);
  const resolveMutation = useResolveCausa();

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [numericResult, setNumericResult] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (isLoading || !causa) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const isCreator = user?.id === causa.creatorId;
  const isAdmin = user?.role === 'ADMIN';
  if (!isCreator && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Sem permissão.</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  if (causa.status === 'RESOLVED') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Trophy className="w-8 h-8 text-blue-500 mx-auto mb-3" />
        <p className="text-gray-700 dark:text-gray-300 font-medium">Causa já resolvida.</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => router.push(`/causas/${causaId}`)}>
          Ver resultado
        </Button>
      </div>
    );
  }

  const options = votesData?.options ?? causa.options;
  const totalVotes = votesData?.totalVotes ?? causa._count.votes;

  const handleResolve = async () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    const payload: any = {};
    if (causa.type === 'BINARY' || causa.type === 'CHOICE') {
      if (!selectedOptionId) return;
      payload.winningOptionId = selectedOptionId;
    } else {
      const val = parseFloat(numericResult);
      if (isNaN(val)) return;
      payload.numericResult = val;
    }

    await resolveMutation.mutateAsync({ causaId, payload });
    router.push(`/causas/${causaId}`);
  };

  const canConfirm =
    (causa.type === 'BINARY' || causa.type === 'CHOICE') ? !!selectedOptionId
    : numericResult !== '' && !isNaN(parseFloat(numericResult));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Definir resultado
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{causa.title}</p>
      </div>

      {/* Resumo de votos */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex items-center gap-3 text-sm">
        <span className="text-gray-500 dark:text-gray-400">Total de votos:</span>
        <span className="font-bold text-gray-800 dark:text-white">{totalVotes}</span>
        {causa.entryFee > 0 && (
          <>
            <span className="text-gray-400">·</span>
            <span className="text-amber-600 dark:text-amber-400">Prize: R$ {causa.prizePool.toFixed(2)}</span>
          </>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Qual foi o resultado?
        </p>

        {/* BINARY / CHOICE */}
        {(causa.type === 'BINARY' || causa.type === 'CHOICE') && (
          <div className="space-y-2">
            {options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              const pct = opt.percentage ?? 0;
              return (
                <button
                  key={opt.id}
                  onClick={() => { setSelectedOptionId(opt.id); setConfirmed(false); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 font-medium text-sm text-gray-800 dark:text-white">
                      {opt.emoji && <span>{opt.emoji}</span>}
                      {opt.label}
                      {isSelected && <Trophy className="w-3.5 h-3.5 text-green-500 ml-1" />}
                    </span>
                    <span className="text-sm text-gray-500">{opt.percentage != null ? `${pct}%` : '—'}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isSelected ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {opt.voteCount != null && (
                    <p className="text-xs text-gray-400 mt-1">{opt.voteCount} voto{opt.voteCount !== 1 ? 's' : ''}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* NUMERIC */}
        {causa.type === 'NUMERIC' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Digite o valor real do resultado:
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Valor exato..."
                value={numericResult}
                onChange={(e) => { setNumericResult(e.target.value); setConfirmed(false); }}
                className="flex-1"
              />
              {causa.numericUnit && (
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{causa.numericUnit}</span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Modo: {causa.numericMatchMode === 'EXACT' ? '⚠️ Exato — só ganha quem acertou o número certo' : '📍 Mais próximo — ganha quem chegou mais perto'}
            </p>
          </div>
        )}

        {/* Aviso de sem acertadores */}
        {causa.type === 'NUMERIC' && causa.numericMatchMode === 'EXACT' && causa.entryFee > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
            Se nenhum participante acertou o número exato, o prize pool (R$ {causa.prizePool.toFixed(2)}) ficará para a plataforma.
          </div>
        )}

        {/* Botão de confirmar */}
        {!confirmed ? (
          <Button
            className="w-full"
            disabled={!canConfirm || resolveMutation.isPending}
            onClick={handleResolve}
          >
            Confirmar resultado
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
              ⚠️ Atenção: após confirmar, o resultado <strong>não pode ser alterado</strong>. Tem certeza?
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmed(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleResolve}
                disabled={resolveMutation.isPending}
              >
                {resolveMutation.isPending ? 'Resolvendo...' : '✅ Confirmar'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, AlertTriangle, Target, Check, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCausa, useCausaVotes, useResolveCausa } from '@/hooks/use-causas';
import { useAuth } from '@/hooks/use-auth';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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
        <div className="h-48 bg-surface rounded-2xl animate-pulse" />
      </div>
    );
  }

  const isCreator = user?.id === causa.creatorId;
  const isAdmin   = user?.role === 'ADMIN';

  if (!isCreator && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">Sem permissão.</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  if (causa.status === 'RESOLVED') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-7 h-7 text-blue-400" />
        </div>
        <p className="text-white font-semibold">Causa já resolvida.</p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => router.push(`/causas/${causaId}`)}>
          Ver resultado
        </Button>
      </div>
    );
  }

  const options    = votesData?.options ?? causa.options;
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
    (causa.type === 'BINARY' || causa.type === 'CHOICE')
      ? !!selectedOptionId
      : numericResult !== '' && !isNaN(parseFloat(numericResult));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" /> Definir resultado
        </h1>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{causa.title}</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-surface-lighter rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-white">{totalVotes}</p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> Participantes
          </p>
        </div>
        {causa.entryFee > 0 ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{formatCurrency(causa.prizePool)}</p>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3" /> Prize pool
            </p>
          </div>
        ) : (
          <div className="bg-surface border border-surface-lighter rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-gray-400">Gratuita</p>
            <p className="text-xs text-gray-600 mt-0.5">Sem prize pool</p>
          </div>
        )}
      </div>

      {/* Card de seleção */}
      <div className="bg-surface border border-surface-lighter rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-gray-300">
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
                  className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden ${
                    isSelected
                      ? 'border-emerald-500/60 bg-emerald-500/10'
                      : 'border-gray-800 hover:border-gray-600 bg-gray-900/40'
                  }`}
                >
                  {/* Background progress */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 rounded-xl transition-all duration-700 opacity-10 ${isSelected ? 'bg-emerald-500' : 'bg-gray-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {opt.emoji && <span className="text-lg shrink-0">{opt.emoji}</span>}
                      <div>
                        <span className="font-semibold text-sm text-white">
                          {opt.label}
                        </span>
                        {isSelected && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Trophy className="w-3 h-3 text-emerald-400" />
                            <span className="text-xs text-emerald-400">Vencedora</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-white tabular-nums">
                        {opt.percentage != null ? `${pct}%` : '—'}
                      </p>
                      {opt.voteCount != null && (
                        <p className="text-xs text-gray-500">{opt.voteCount} voto{opt.voteCount !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* NUMERIC */}
        {causa.type === 'NUMERIC' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
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
                <span className="text-sm text-gray-400 whitespace-nowrap px-3 py-2 bg-surface border border-surface-lighter rounded-lg">
                  {causa.numericUnit}
                </span>
              )}
            </div>
            <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs ${
              causa.numericMatchMode === 'EXACT'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
            }`}>
              <Target className="w-3.5 h-3.5 shrink-0" />
              {causa.numericMatchMode === 'EXACT'
                ? 'Modo Exato — só ganha quem acertou o número certo'
                : 'Modo Mais Próximo — ganha quem chegou mais perto'
              }
            </div>
          </div>
        )}

        {/* Aviso sem acertadores */}
        {causa.type === 'NUMERIC' && causa.numericMatchMode === 'EXACT' && causa.entryFee > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Se ninguém acertou o número exato, o prize pool ({formatCurrency(causa.prizePool)}) ficará para a plataforma.
            </span>
          </div>
        )}

        {/* Botão */}
        {!confirmed ? (
          <Button
            className="w-full gap-2"
            disabled={!canConfirm || resolveMutation.isPending}
            onClick={handleResolve}
          >
            Confirmar resultado
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Após confirmar, o resultado <strong>não pode ser alterado</strong>. Tem certeza?
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmed(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                onClick={handleResolve}
                disabled={resolveMutation.isPending}
              >
                {resolveMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Resolvendo...</>
                  : <><Check className="w-4 h-4" /> Confirmar</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

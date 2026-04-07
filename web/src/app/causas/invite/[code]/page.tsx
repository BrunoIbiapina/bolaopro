'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCausaByInvite, useVoteCausa } from '@/hooks/use-causas';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Loader2,
  AlertTriangle,
  Search,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  Clock,
  Users,
  Trophy,
  Lock,
  Globe,
} from 'lucide-react';
import { useState, useEffect } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; emoji: string; color: string }> = {
  POLITICA:       { label: 'Política',        emoji: '🏛️', color: 'bg-blue-500/10 text-blue-400' },
  ESPORTE:        { label: 'Esportes',        emoji: '⚽', color: 'bg-green-500/10 text-green-400' },
  CLIMA:          { label: 'Clima',           emoji: '🌤️', color: 'bg-sky-500/10 text-sky-400' },
  ENTRETENIMENTO: { label: 'Entretenimento',  emoji: '🎬', color: 'bg-purple-500/10 text-purple-400' },
  NEGOCIOS:       { label: 'Negócios',        emoji: '💼', color: 'bg-yellow-500/10 text-yellow-400' },
  CULTURA:        { label: 'Cultura',         emoji: '🎭', color: 'bg-pink-500/10 text-pink-400' },
  OUTROS:         { label: 'Outros',          emoji: '🔮', color: 'bg-gray-500/10 text-gray-400' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: 'Rascunho',  color: 'bg-gray-500/10 text-gray-400' },
  OPEN:      { label: 'Aberta',    color: 'bg-green-500/10 text-green-400' },
  CLOSED:    { label: 'Fechada',   color: 'bg-red-500/10 text-red-400' },
  RESOLVED:  { label: 'Resolvida', color: 'bg-brand-500/10 text-brand-400' },
  CANCELLED: { label: 'Cancelada', color: 'bg-gray-500/10 text-gray-500' },
};

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-950 via-gray-900 to-gray-950">
      <div className="text-center space-y-4">
        <Loader2 className="size-10 text-brand-400 animate-spin mx-auto" />
        <p className="text-gray-400 text-sm">Carregando causa...</p>
      </div>
    </div>
  );
}

// ─── Error ────────────────────────────────────────────────────────────────────

function ErrorScreen({ message, onHome }: { message: string; onHome: () => void }) {
  const isNotFound = /not found|não encontrada|inválido/i.test(message);
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-gray-900 to-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-0">
        <div className="rounded-t-3xl bg-gray-800/60 border border-gray-700/40 p-8 text-center space-y-5">
          <div className="size-20 rounded-2xl bg-gray-800 border border-gray-700/60 flex items-center justify-center mx-auto">
            {isNotFound ? <Search className="size-9 text-gray-400" /> : <AlertTriangle className="size-9 text-yellow-500" />}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              {isNotFound ? 'Causa não encontrada' : 'Link indisponível'}
            </p>
            <h1 className="text-2xl font-extrabold text-white">
              {isNotFound ? 'Este convite não existe' : 'Algo deu errado'}
            </h1>
            <p className="text-sm text-gray-400">{isNotFound ? 'O link pode ter expirado ou a causa foi removida.' : message}</p>
          </div>
        </div>
        <div className="rounded-b-3xl bg-gray-900/90 border border-gray-700/20 border-t-0 px-6 pb-8 pt-5">
          <button
            onClick={onHome}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold"
          >
            <Trophy className="size-5" /> Ver causas
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CausaInvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: causa, isLoading, error } = useCausaByInvite(code);
  const { mutate: vote, isPending: voting } = useVoteCausa();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);

  // Salvar código pendente para depois do login
  const savePending = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingCausaInvite', code);
    }
  };

  // Se acabou de fazer login e tem invite pendente, não precisa redirecionar
  useEffect(() => {
    if (!isAuthenticated || !causa) return;
    const pending = typeof window !== 'undefined' ? localStorage.getItem('pendingCausaInvite') : null;
    if (pending === code) localStorage.removeItem('pendingCausaInvite');
  }, [isAuthenticated, causa, code]);

  if (isLoading || authLoading) return <LoadingScreen />;
  if (error || !causa) return <ErrorScreen message={(error as any)?.response?.data?.message ?? 'Causa não encontrada'} onHome={() => router.push('/')} />;

  const cat = CATEGORY_META[causa.category] ?? CATEGORY_META.OTHER;
  const statusMeta = STATUS_META[causa.status] ?? STATUS_META.OPEN;
  const isOpen = causa.status === 'OPEN';
  const isFree = causa.entryFee === 0;
  const deadline = new Date(causa.deadlineAt);
  const isExpired = deadline < new Date();

  const canVote = isOpen && !isExpired && !voted;

  const handleVote = () => {
    if (!isAuthenticated) {
      savePending();
      router.push(`/login?redirect=/causas/invite/${code}`);
      return;
    }
    if (!selectedOption) return;
    vote(
      { causaId: causa.id, payload: { optionId: selectedOption, numCotas: 1 } },
      {
        onSuccess: () => {
          setVoted(true);
          setTimeout(() => router.push(`/causas/${causa.id}`), 1500);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-0">

        {/* ── Header ── */}
        <div className="rounded-t-3xl bg-gradient-to-br from-brand-600/20 to-brand-900/30 border border-brand-500/20 p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg shadow-brand-900/50 flex items-center justify-center">
              <span className="text-3xl">{cat.emoji}</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-2">
              Você foi convidado!
            </p>
            <h1 className="text-2xl font-extrabold text-white leading-tight">{causa.title}</h1>
            {causa.description && (
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">{causa.description}</p>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${cat.color}`}>
              {cat.emoji} {cat.label}
            </span>
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${statusMeta.color}`}>
              {statusMeta.label}
            </span>
            {causa.visibility === 'PRIVATE'
              ? <span className="inline-flex items-center gap-1 text-xs text-gray-400"><Lock className="size-3" /> Privada</span>
              : <span className="inline-flex items-center gap-1 text-xs text-gray-400"><Globe className="size-3" /> Pública</span>}
          </div>
        </div>

        {/* ── Info ── */}
        <div className="bg-gray-900/80 backdrop-blur border-x border-brand-500/10 px-6 py-5 space-y-5">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-gray-800/60 border border-gray-700/40 p-3 text-center">
              <p className="text-[10px] text-gray-400 mb-1">Entrada</p>
              <p className={`text-lg font-extrabold ${isFree ? 'text-green-400' : 'text-brand-400'}`}>
                {isFree ? 'Grátis' : formatCurrency(causa.entryFee)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-800/60 border border-gray-700/40 p-3 text-center">
              <p className="text-[10px] text-gray-400 mb-1">Votantes</p>
              <p className="text-lg font-extrabold text-white">
                {causa.options.reduce((acc, o) => acc + (o.voteCount ?? 0), 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-800/60 border border-gray-700/40 p-3 text-center">
              <p className="text-[10px] text-gray-400 mb-1">Prazo</p>
              <p className="text-sm font-bold text-white leading-tight">
                {format(deadline, 'dd/MM', { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Opções de voto */}
          {isOpen && !isExpired && causa.options.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Escolha sua opção
              </p>
              {causa.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  disabled={!canVote}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left ${
                    selectedOption === opt.id
                      ? 'border-brand-500 bg-brand-500/10 text-white'
                      : 'border-gray-700/40 bg-gray-800/40 text-gray-300 hover:border-gray-600 hover:bg-gray-800/60'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {opt.emoji && <span className="text-xl shrink-0">{opt.emoji}</span>}
                  <span className="font-medium text-sm flex-1">{opt.label}</span>
                  {selectedOption === opt.id && <CheckCircle2 className="size-4 text-brand-400 shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Prazo expirado */}
          {isExpired && isOpen && (
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 flex items-start gap-3">
              <Clock className="size-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-300">Prazo encerrado</p>
                <p className="text-xs text-orange-400/80 mt-0.5">O prazo para votar nesta causa já passou.</p>
              </div>
            </div>
          )}

          {/* Causa não está aberta */}
          {!isOpen && (
            <div className="rounded-xl border border-gray-700/30 bg-gray-800/20 p-4 flex items-start gap-3">
              <AlertTriangle className="size-4 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-300">
                  {causa.status === 'RESOLVED' ? 'Causa resolvida' : causa.status === 'CANCELLED' ? 'Causa cancelada' : 'Causa fechada'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Não é mais possível votar nesta causa.</p>
              </div>
            </div>
          )}

          {/* Sucesso */}
          {voted && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 flex items-center gap-3">
              <CheckCircle2 className="size-5 text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-300">Voto registrado!</p>
                <p className="text-xs text-green-400/70 mt-0.5">Redirecionando...</p>
              </div>
            </div>
          )}

          {/* Criador */}
          <div className="flex items-center gap-2 pt-1">
            <Users className="size-3.5 text-gray-500 shrink-0" />
            <p className="text-xs text-gray-500">
              Criada por <span className="text-gray-400 font-medium">{causa.creator.fullName}</span>
            </p>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="rounded-b-3xl bg-gray-900/90 border border-brand-500/10 border-t-0 px-6 pb-8 pt-5 space-y-3">
          {canVote && !voted && (
            <>
              <button
                onClick={handleVote}
                disabled={voting || (!isAuthenticated ? false : !selectedOption)}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-base shadow-lg shadow-brand-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {voting ? (
                  <><Loader2 className="size-5 animate-spin" /> Votando...</>
                ) : isAuthenticated ? (
                  <>{selectedOption ? <>Confirmar voto <ArrowRight className="size-4" /></> : 'Selecione uma opção acima'}</>
                ) : (
                  <><UserPlus className="size-4" /> Criar conta e votar <ArrowRight className="size-4" /></>
                )}
              </button>

              {!isAuthenticated && (
                <p className="text-xs text-gray-500 text-center">
                  Já tem conta?{' '}
                  <button
                    onClick={() => { savePending(); router.push(`/login?redirect=/causas/invite/${code}`); }}
                    className="text-brand-400 hover:text-brand-300 font-medium"
                  >
                    Fazer login
                  </button>
                </p>
              )}
            </>
          )}

          {(!canVote || voted) && !voted && (
            <button
              onClick={() => router.push(isAuthenticated ? `/causas/${causa.id}` : '/')}
              className="w-full py-3.5 rounded-2xl border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 font-medium transition-colors text-sm"
            >
              {isAuthenticated ? 'Ver detalhes da causa' : 'Explorar causas'}
            </button>
          )}

          <p className="text-center text-xs text-gray-600 pt-1">
            Powered by <span className="text-brand-500 font-semibold">Bolão Pro</span>
          </p>
        </div>

      </div>
    </div>
  );
}

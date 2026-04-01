'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useJoinByCode } from '@/hooks/use-pools';
import api from '@/lib/api';
import { Pool } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Users, Trophy, Lock, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Calendar, Clock, Search, UserPlus, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ─── Status helpers ────────────────────────────────────────────────────────────
function getPoolStatus(pool: Pool) {
  const isFull = (pool.memberCount ?? 0) >= pool.maxParticipants;
  if (pool.status === 'FINISHED') return { label: 'Encerrado', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: Lock };
  if (pool.status === 'CLOSED')   return { label: 'Fechado', color: 'text-red-400', bg: 'bg-red-500/20', icon: Lock };
  if (isFull)                      return { label: 'Cheio', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: Users };
  return { label: 'Aberto', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle2 };
}

function canJoin(pool: Pool & { allMatchesLocked?: boolean }) {
  if (pool.status !== 'OPEN') return false;
  if ((pool.memberCount ?? 0) >= pool.maxParticipants) return false;
  if (pool.allMatchesLocked) return false;
  return true;
}

// ─── Loading screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-950 via-gray-900 to-gray-950">
      <div className="text-center space-y-4">
        <span className="block text-5xl animate-ball-roll mx-auto w-fit">⚽</span>
        <p className="text-gray-400 text-sm">Carregando convite...</p>
      </div>
    </div>
  );
}

// ─── Error screen ──────────────────────────────────────────────────────────────
function ErrorScreen({ message, onHome }: { message: string; onHome: () => void }) {
  const isNotFound = /not found|não encontrado|inválido|expirado/i.test(message);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-0">

        {/* Header card */}
        <div className="rounded-t-3xl bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/40 p-8 text-center space-y-5">
          {/* Ícone */}
          <div className="flex justify-center">
            <div className="size-20 rounded-2xl bg-gray-800 border border-gray-700/60 flex items-center justify-center shadow-lg">
              {isNotFound
                ? <Search className="size-9 text-gray-400" />
                : <AlertTriangle className="size-9 text-yellow-500" />}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              {isNotFound ? 'Bolão não encontrado' : 'Link indisponível'}
            </p>
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              {isNotFound ? 'Este bolão não existe mais' : 'Algo deu errado'}
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              {isNotFound
                ? 'O link de convite pode ter expirado, o bolão foi encerrado ou removido pelo organizador.'
                : message}
            </p>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-gray-900/80 backdrop-blur border-x border-gray-700/20 px-6 py-5">
          <div className="rounded-xl bg-gray-800/50 border border-gray-700/30 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="size-4 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 leading-relaxed">
              Se você recebeu este link de alguém, peça para essa pessoa compartilhar um novo convite atualizado.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-b-3xl bg-gray-900/90 border border-gray-700/20 border-t-0 px-6 pb-8 pt-5 space-y-3">
          <button
            onClick={onHome}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-base shadow-lg shadow-brand-900/50 transition-all"
          >
            <Trophy className="size-5" />
            Ver outros bolões
          </button>
          <p className="text-center text-xs text-gray-600 pt-1">
            Powered by <span className="text-brand-500 font-semibold">Bolão Pro</span>
          </p>
        </div>

      </div>
    </div>
  );
}

// ─── Main invite page ──────────────────────────────────────────────────────────
export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const { isAuthenticated, isLoading: authLoading, user, updateUser } = useAuth();
  const { mutate: joinByCode, isPending: joining } = useJoinByCode();

  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [showPixStep, setShowPixStep] = useState(false);
  const [pixInput, setPixInput] = useState('');
  const [savingPix, setSavingPix] = useState(false);

  // Fetch pool info (public endpoint)
  useEffect(() => {
    if (authLoading) return;

    api.get<Pool>(`/pools/invite/${code}`)
      .then((r) => setPool(r.data))
      .catch((e) => setError(e?.response?.data?.message || 'Convite inválido ou expirado'))
      .finally(() => setLoading(false));
  }, [code, authLoading]);

  // Se já está autenticado e acabou de fazer login com redirect — tenta entrar direto
  useEffect(() => {
    const pending = typeof window !== 'undefined'
      ? localStorage.getItem('pendingInviteCode')
      : null;

    if (isAuthenticated && pending === code && pool && canJoin(pool)) {
      localStorage.removeItem('pendingInviteCode');
      handleJoin();
    }
  }, [isAuthenticated, pool]);

  const doJoin = () => {
    joinByCode(
      { inviteCode: code, numCotas: 1 },
      {
        onSuccess: (data) => {
          setJoined(true);
          setTimeout(() => router.push(`/pools/${(data as any).poolId || (data as any).id}`), 1200);
        },
      },
    );
  };

  const handleJoin = () => {
    if (!pool) return;

    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingInviteCode', code);
      }
      router.push(`/register?redirect=/invite/${code}`);
      return;
    }

    // Se bolão pago e usuário não tem PIX cadastrado → pede antes de entrar
    if (pool.entryFee > 0 && !user?.pixKey) {
      setShowPixStep(true);
      return;
    }

    doJoin();
  };

  const handleSavePixAndJoin = async () => {
    if (!pixInput.trim()) return;
    setSavingPix(true);
    try {
      const response = await api.patch('/users/me', { pixKey: pixInput.trim() });
      updateUser(response.data);
      setShowPixStep(false);
      doJoin();
    } catch {
      // continua e tenta entrar mesmo assim
      setShowPixStep(false);
      doJoin();
    } finally {
      setSavingPix(false);
    }
  };

  if (loading || authLoading) return <LoadingScreen />;
  if (error || !pool) return <ErrorScreen message={error ?? 'Bolão não encontrado'} onHome={() => router.push('/')} />;

  const allMatchesLocked = (pool as any).allMatchesLocked === true;
  const status = getPoolStatus(pool);
  const StatusIcon = status.icon;
  const joinable = canJoin(pool as any);
  const isFree = pool.entryFee === 0;

  // Calcular % de vagas preenchidas
  const fillPct = Math.min(100, Math.round(((pool.memberCount ?? 0) / pool.maxParticipants) * 100));

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center px-4 py-12">

      {/* Card central */}
      <div className="w-full max-w-md space-y-0">

        {/* ── Header card ── */}
        <div className="rounded-t-3xl bg-gradient-to-br from-brand-600/30 to-brand-900/40 border border-brand-500/20 p-8 text-center space-y-4">

          {/* Logo / ícone */}
          <div className="flex justify-center">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg shadow-brand-900/50 flex items-center justify-center">
              <Trophy className="size-8 text-white" />
            </div>
          </div>

          {/* Título convidativo */}
          <div>
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-2">
              Você foi convidado!
            </p>
            <h1 className="text-3xl font-extrabold text-white leading-tight">
              {pool.name}
            </h1>
            {pool.championship?.name && (
              <p className="text-sm text-brand-300 mt-1.5 flex items-center justify-center gap-1.5">
                <Trophy className="size-3.5 shrink-0" />
                {pool.championship.name}
              </p>
            )}
          </div>

          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.bg} ${status.color} border-current/20`}>
            <StatusIcon className="size-3" />
            {status.label}
          </span>
        </div>

        {/* ── Info card ── */}
        <div className="bg-gray-900/80 backdrop-blur border-x border-brand-500/10 px-6 py-5 space-y-5">

          {/* Grid de stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gray-800/60 border border-gray-700/40 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Entrada por cota</p>
              <p className={`text-2xl font-extrabold ${isFree ? 'text-green-400' : 'text-brand-400'}`}>
                {isFree ? 'Grátis' : formatCurrency(pool.entryFee)}
              </p>
            </div>
            <div className="rounded-2xl bg-gray-800/60 border border-gray-700/40 p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Participantes</p>
              <p className="text-2xl font-extrabold text-white">
                {pool.memberCount ?? 0}
                <span className="text-gray-500 text-base font-normal">/{pool.maxParticipants}</span>
              </p>
            </div>
          </div>

          {/* Barra de progresso de vagas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1"><Users className="size-3" /> Vagas preenchidas</span>
              <span className="font-semibold text-gray-400">{fillPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${fillPct >= 90 ? 'bg-orange-500' : fillPct >= 60 ? 'bg-yellow-500' : 'bg-brand-500'}`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
          </div>

          {/* Partidas do bolão */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Partidas
            </p>
            {(pool as any).matches?.length > 0 ? (
              <div className="rounded-xl border border-gray-700/40 overflow-hidden divide-y divide-gray-800/60">
                {(pool as any).matches.slice(0, 6).map((match: any) => {
                  const isLocked = match.status === 'FINISHED' || match.status === 'LIVE' ||
                    new Date().getTime() > new Date(match.scheduledAt).getTime() - 15 * 60 * 1000;
                  return (
                    <div key={match.id} className="flex items-center gap-2 px-3 py-2.5 bg-gray-800/30">
                      {/* Data */}
                      <span className="text-[10px] text-gray-500 shrink-0 w-16 text-center leading-tight">
                        {format(new Date(match.scheduledAt), "dd/MM\nHH:mm", { locale: ptBR })}
                      </span>
                      {/* Times */}
                      <div className="flex flex-1 items-center justify-center gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                          {match.homeTeam?.logo
                            ? <img src={match.homeTeam.logo} alt="" className="size-5 object-contain shrink-0" />
                            : <div className="size-5 rounded-full bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-300 shrink-0">{match.homeTeam?.code}</div>}
                          <span className="text-xs font-semibold text-gray-200 truncate text-right">{match.homeTeam?.name}</span>
                        </div>
                        <span className="text-gray-600 text-xs shrink-0">vs</span>
                        <div className="flex items-center gap-1.5 flex-1 justify-start min-w-0">
                          <span className="text-xs font-semibold text-gray-200 truncate">{match.awayTeam?.name}</span>
                          {match.awayTeam?.logo
                            ? <img src={match.awayTeam.logo} alt="" className="size-5 object-contain shrink-0" />
                            : <div className="size-5 rounded-full bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-300 shrink-0">{match.awayTeam?.code}</div>}
                        </div>
                      </div>
                      {/* Status */}
                      {isLocked && (
                        <Lock className="size-3 text-gray-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
                {(pool as any).matches.length > 6 && (
                  <div className="px-3 py-2 bg-gray-800/20 text-center">
                    <span className="text-xs text-gray-500">+{(pool as any).matches.length - 6} partidas</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-700/30 bg-gray-800/20 px-4 py-4 flex items-center gap-3">
                <Clock className="size-4 text-gray-500 shrink-0" />
                <p className="text-xs text-gray-500">As partidas serão divulgadas em breve pelo organizador.</p>
              </div>
            )}
          </div>

          {/* Descrição */}
          {pool.description && (
            <p className="text-sm text-gray-400 leading-relaxed text-center">
              {pool.description}
            </p>
          )}

          {/* Regras (snippet) */}
          {pool.rules && (
            <div className="rounded-xl bg-gray-800/50 border border-gray-700/30 px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 mb-1">Regras</p>
              <p className="text-xs text-gray-500 line-clamp-3">{pool.rules}</p>
            </div>
          )}

          {/* Aviso: palpites de todas as partidas já encerrados */}
          {allMatchesLocked && pool.status === 'OPEN' && (
            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/8 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="size-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-orange-300">Palpites já encerrados</p>
                  <p className="text-xs text-orange-400/80 mt-1 leading-relaxed">
                    Todas as partidas deste bolão já iniciaram ou estão a menos de 15 minutos do início.
                    Não é possível entrar pois você não poderia fazer nenhum palpite.
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 px-4 py-3 text-xs text-orange-300/80 flex items-start gap-2">
                <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
                Caso queira participar de um novo bolão, peça ao organizador que crie um com partidas futuras.
              </div>
            </div>
          )}

          {/* Aviso de bolão indisponível (outros motivos) */}
          {!joinable && !allMatchesLocked && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
              <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">
                  {pool.status === 'FINISHED'
                    ? 'Bolão encerrado'
                    : pool.status === 'CLOSED'
                    ? 'Inscrições fechadas'
                    : 'Bolão lotado'}
                </p>
                <p className="text-xs text-red-400/80 mt-0.5">
                  {pool.status === 'FINISHED'
                    ? 'Este bolão já foi finalizado e não aceita novos participantes.'
                    : pool.status === 'CLOSED'
                    ? 'O organizador fechou as inscrições.'
                    : 'Todas as vagas foram preenchidas.'}
                </p>
              </div>
            </div>
          )}

          {/* Sucesso ao entrar */}
          {joined && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 flex items-center gap-3">
              <CheckCircle2 className="size-5 text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-300">Você entrou no bolão!</p>
                <p className="text-xs text-green-400/70 mt-0.5">Redirecionando...</p>
              </div>
            </div>
          )}
        </div>

        {/* ── CTA card ── */}
        <div className="rounded-b-3xl bg-gray-900/90 border border-brand-500/10 border-t-0 px-6 pb-8 pt-5 space-y-3">

          {joinable && !joined && (
            <>
              {/* Passo PIX — aparece se bolão é pago e usuário não tem PIX */}
              {showPixStep ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center shrink-0">
                        <Banknote className="size-4 text-brand-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-100">Sua chave PIX</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Necessária para receber o prêmio caso você vença. Pode alterar depois no perfil.
                        </p>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={pixInput}
                      onChange={(e) => setPixInput(e.target.value)}
                      placeholder="CPF, email, telefone ou chave aleatória"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowPixStep(false)}
                        className="flex-1 py-2.5 rounded-xl border border-gray-600 text-sm text-gray-400 hover:border-gray-500 transition-colors"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={handleSavePixAndJoin}
                        disabled={!pixInput.trim() || savingPix}
                        className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
                      >
                        {savingPix ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : <>Confirmar e entrar <ArrowRight className="size-4" /></>}
                      </button>
                    </div>
                    <p className="text-center text-xs text-gray-600">
                      ou{' '}
                      <button
                        onClick={() => { setShowPixStep(false); doJoin(); }}
                        className="text-gray-500 underline hover:text-gray-400"
                      >
                        entrar sem informar agora
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-base shadow-lg shadow-brand-900/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {joining ? (
                      <><Loader2 className="size-5 animate-spin" /> Entrando...</>
                    ) : isAuthenticated ? (
                      <>Entrar no bolão <ArrowRight className="size-4" /></>
                    ) : (
                      <><UserPlus className="size-4" /> Criar conta e entrar <ArrowRight className="size-4" /></>
                    )}
                  </button>

                  {!isAuthenticated && (
                    <p className="text-xs text-gray-500 text-center">
                      Já tem conta?{' '}
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') localStorage.setItem('pendingInviteCode', code);
                          router.push(`/login?redirect=/invite/${code}`);
                        }}
                        className="text-brand-400 hover:text-brand-300 font-medium"
                      >
                        Fazer login
                      </button>
                    </p>
                  )}
                </>
              )}
            </>
          )}

          {!joinable && !joined && (
            <button
              onClick={() => router.push('/')}
              className="w-full py-3.5 rounded-2xl border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 font-medium transition-colors text-sm"
            >
              Ver outros bolões
            </button>
          )}

          {/* Branding */}
          <p className="text-center text-xs text-gray-600 pt-1">
            Powered by <span className="text-brand-500 font-semibold">Bolão Pro</span>
          </p>
        </div>
      </div>
    </div>
  );
}

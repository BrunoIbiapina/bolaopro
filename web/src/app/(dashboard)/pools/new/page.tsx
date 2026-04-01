'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePool } from '@/hooks/use-pools';
import { useChampionships, useCreateChampionship } from '@/hooks/use-championships';
import { useChampionshipMatchesForSelection, useCreateMatch } from '@/hooks/use-matches';
import { useTeams, useCreateTeam } from '@/hooks/use-teams';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, CheckSquare, Square, Trophy, Info, AlertTriangle, Lock, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShareModal } from '@/components/shared/share-modal';
import { Pool } from '@/types';

const schema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  championshipId: z.string().min(1, 'Selecione um campeonato'),
  entryFee: z.coerce.number().min(0, 'Taxa deve ser positiva'),
  maxParticipants: z.coerce.number().min(2, 'Mínimo 2 participantes').max(100),
  cotasPerParticipant: z.coerce.number().min(1).max(10).default(1),
  organizerCotas: z.coerce.number().min(0).max(10).default(1),
  rules: z.string().optional(),
  pixKey: z.string().optional(),
});

type CreatePoolForm = z.infer<typeof schema>;

export default function NewPoolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const championshipIdParam = searchParams.get('championshipId') ?? '';

  const { user } = useAuth();
  const isAdmin = (user as any)?.role === 'ADMIN';
  const { mutate: createPool, isPending } = useCreatePool();
  const { data: championships, isLoading: loadingChamps } = useChampionships();
  const { mutate: createChampionship, isPending: creatingChamp } = useCreateChampionship();
  const { mutate: createMatch, isPending: creatingMatch } = useCreateMatch();
  const { data: teams, refetch: refetchTeams } = useTeams();
  const { mutate: createTeam, isPending: creatingTeam } = useCreateTeam();

  const [showNewChamp, setShowNewChamp] = useState(false);
  const [newChampName, setNewChampName] = useState('');
  const [newChampCode, setNewChampCode] = useState('');

  const [showNewMatch, setShowNewMatch] = useState(false);
  const [newMatchHome, setNewMatchHome] = useState('');
  const [newMatchAway, setNewMatchAway] = useState('');
  const [newMatchDate, setNewMatchDate] = useState('');
  const [newMatchRound, setNewMatchRound] = useState('');

  // Criação inline de time (home ou away)
  const [newTeamFor, setNewTeamFor] = useState<'home' | 'away' | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCode, setNewTeamCode] = useState('');

  const [step, setStep] = useState<'basic' | 'matches' | 'advanced'>('basic');
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);

  const [createdPool, setCreatedPool] = useState<Pool | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const form = useForm<CreatePoolForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      championshipId: championshipIdParam,
      entryFee: 0,
      maxParticipants: 10,
      cotasPerParticipant: 1,
      organizerCotas: 1,
      rules: '',
    },
  });

  const watchedChampionshipId = form.watch('championshipId');
  const { data: champMatches, isLoading: loadingChampMatches } = useChampionshipMatchesForSelection(watchedChampionshipId);

  useEffect(() => {
    if (championshipIdParam) form.setValue('championshipId', championshipIdParam);
  }, [championshipIdParam]);

  // Reset match selection when championship changes
  useEffect(() => {
    setSelectedMatchIds([]);
  }, [watchedChampionshipId]);

  // Debug: Log teams when they load
  useEffect(() => {
    if (teams && teams.length > 0) {
      console.log('✓ Times carregados:', teams.map(t => ({
        name: t.name,
        id: t.id,
        isValidUUID: isValidUUID(t.id),
      })));
    } else if (teams?.length === 0) {
      console.warn('⚠ Nenhum time carregado');
    }
  }, [teams]);

  // Debug: Log championship selection
  useEffect(() => {
    if (watchedChampionshipId) {
      console.log(`✓ Campeonato selecionado:`, {
        id: watchedChampionshipId,
        isValidUUID: isValidUUID(watchedChampionshipId),
      });
    }
  }, [watchedChampionshipId]);

  // UUID validation helper
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const toggleMatch = (id: string) => {
    // Não permite selecionar partidas encerradas
    const match = (champMatches ?? []).find((m: any) => m.id === id);
    if (match?.status === 'FINISHED') return;
    setSelectedMatchIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  // Partidas disponíveis (não encerradas) para seleção
  const availableMatches = (champMatches ?? []).filter((m: any) => m.status !== 'FINISHED');
  const allMatchesFinished =
    (champMatches ?? []).length > 0 &&
    (champMatches ?? []).every((m: any) => m.status === 'FINISHED');

  const onSubmit = (data: CreatePoolForm) => {
    createPool(
      {
        name: data.name,
        description: data.description,
        championshipId: data.championshipId,
        entryFee: Number(data.entryFee),
        maxParticipants: Number(data.maxParticipants),
        cotasPerParticipant: Number(data.cotasPerParticipant ?? 1),
        organizerCotas: Number(data.organizerCotas ?? 1),
        rules: data.rules,
        pixKey: data.pixKey || undefined,
        matchIds: selectedMatchIds.length > 0 ? selectedMatchIds : undefined,
      } as any,
      {
        onSuccess: (pool) => {
          setCreatedPool(pool as Pool);
          setShowShareModal(true);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message;
          toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Erro ao criar bolão'));
        },
      },
    );
  };

  const stepLabel = step === 'basic' ? 'Informações Básicas' : step === 'matches' ? 'Escolher Partidas' : 'Configurações Avançadas';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/pools" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-50">
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-50">Criar Novo Bolão</h1>
        <p className="text-gray-400 mt-1">Configure as opções do seu bolão</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(['basic', 'matches', 'advanced'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step === s ? 'bg-brand-500 text-white' : i < ['basic', 'matches', 'advanced'].indexOf(step) ? 'bg-brand-500/30 text-brand-400' : 'bg-surface-lighter text-gray-500'
            }`}>
              {i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${step === s ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
              {s === 'basic' ? 'Básico' : s === 'matches' ? 'Partidas' : 'Avançado'}
            </span>
            {i < 2 && <div className="w-8 h-px bg-surface-lighter" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{stepLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* ── Step 1: Basic ── */}
            {step === 'basic' && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-50 block mb-2">Nome do Bolão *</label>
                  <Input
                    placeholder="Ex: Brasileirão dos Amigos"
                    {...form.register('name')}
                    disabled={isPending}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-red-400 mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-50 block mb-2">Descrição (opcional)</label>
                  <Input
                    placeholder="Descreva o bolão..."
                    {...form.register('description')}
                    disabled={isPending}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-50">Campeonato *</label>
                    <button
                      type="button"
                      onClick={() => setShowNewChamp((v) => !v)}
                      className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
                    >
                      {showNewChamp ? <><X className="size-3" /> Cancelar</> : <><Plus className="size-3" /> Criar novo</>}
                    </button>
                  </div>

                  {showNewChamp ? (
                    <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4 space-y-3">
                      <p className="text-xs font-semibold text-brand-300">Novo campeonato</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Input
                            placeholder="Nome do campeonato"
                            value={newChampName}
                            onChange={(e) => {
                              setNewChampName(e.target.value);
                              if (!newChampCode) setNewChampCode(e.target.value.slice(0, 6).toUpperCase().replace(/\s/g, '_'));
                            }}
                            disabled={creatingChamp}
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Código (ex: BRA24)"
                            value={newChampCode}
                            onChange={(e) => setNewChampCode(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                            disabled={creatingChamp}
                            maxLength={10}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={creatingChamp || !newChampName.trim() || !newChampCode.trim()}
                        onClick={() => {
                          createChampionship(
                            { name: newChampName.trim(), code: newChampCode.trim() },
                            {
                              onSuccess: (champ) => {
                                form.setValue('championshipId', champ.id);
                                setShowNewChamp(false);
                                setNewChampName('');
                                setNewChampCode('');
                              },
                            },
                          );
                        }}
                        className="w-full"
                      >
                        {creatingChamp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Criar e selecionar
                      </Button>
                    </div>
                  ) : (
                    <Select
                      {...form.register('championshipId')}
                      disabled={isPending || loadingChamps}
                    >
                      <option value="">
                        {loadingChamps ? 'Carregando...' : 'Selecione um campeonato'}
                      </option>
                      {championships?.map((camp) => (
                        <option key={camp.id} value={camp.id}>{camp.name}</option>
                      ))}
                    </Select>
                  )}
                  {form.formState.errors.championshipId && (
                    <p className="text-xs text-red-400 mt-1">{form.formState.errors.championshipId.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-50 block mb-2">Taxa por Cota (R$)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register('entryFee', { valueAsNumber: true })}
                      disabled={isPending}
                    />
                    {form.formState.errors.entryFee && (
                      <p className="text-xs text-red-400 mt-1">{form.formState.errors.entryFee.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-50 block mb-2">Máx. Participantes</label>
                    <Input
                      type="number"
                      min="2"
                      placeholder="10"
                      {...form.register('maxParticipants', { valueAsNumber: true })}
                      disabled={isPending}
                    />
                    {form.formState.errors.maxParticipants && (
                      <p className="text-xs text-red-400 mt-1">{form.formState.errors.maxParticipants.message}</p>
                    )}
                  </div>
                </div>

                {/* Cotas por participante */}
                <div>
                  <label className="text-sm font-medium text-gray-50 block mb-2">
                    Máx. cotas por participante
                    <span className="ml-2 text-xs text-gray-500 font-normal">quantas cartelas cada pessoa pode comprar</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                      const val = Number(form.watch('cotasPerParticipant') || 1);
                      return (
                        <button key={n} type="button"
                          onClick={() => {
                            form.setValue('cotasPerParticipant', n);
                            const orgCotas = Number(form.getValues('organizerCotas') || 1);
                            if (orgCotas > n) form.setValue('organizerCotas', n);
                          }}
                          className={`flex-1 rounded-lg border py-2 text-sm font-bold transition-colors ${
                            val === n ? 'border-brand-500 bg-brand-600/20 text-brand-300' : 'border-surface-lighter text-gray-400 hover:border-gray-500'
                          }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Participação do organizador — oculto para admin */}
                {!isAdmin && (() => {
                  const wantsToParticipate = Number(form.watch('organizerCotas') ?? 1) > 0;
                  return (
                    <div className="space-y-3">
                      {/* Pergunta: participar ou só criar? */}
                      <div>
                        <p className="text-sm font-medium text-gray-50 mb-2">Você quer participar do bolão?</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => form.setValue('organizerCotas', 1)}
                            className={`rounded-xl border py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                              wantsToParticipate
                                ? 'border-brand-500 bg-brand-600/20 text-brand-300'
                                : 'border-surface-lighter text-gray-400 hover:border-gray-500'
                            }`}
                          >
                            <span>⚽</span> Sim, quero participar
                          </button>
                          <button
                            type="button"
                            onClick={() => form.setValue('organizerCotas', 0)}
                            className={`rounded-xl border py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                              !wantsToParticipate
                                ? 'border-gray-500 bg-gray-700/30 text-gray-200'
                                : 'border-surface-lighter text-gray-400 hover:border-gray-500'
                            }`}
                          >
                            <span>🛠️</span> Só criar o bolão
                          </button>
                        </div>
                      </div>

                      {/* Quantidade de cotas — só aparece se quiser participar */}
                      {wantsToParticipate && (
                        <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-brand-300">Quantas cotas você quer?</p>
                            <p className="text-xs text-gray-400 mt-0.5">Cada cota = uma cartela de palpites separada</p>
                          </div>
                          <div className="flex gap-2">
                            {Array.from({ length: Number(form.watch('cotasPerParticipant') || 1) }, (_, i) => i + 1).map((n) => {
                              const val = Number(form.watch('organizerCotas') || 1);
                              return (
                                <button key={n} type="button"
                                  onClick={() => form.setValue('organizerCotas', n)}
                                  className={`flex-1 rounded-lg border py-2.5 text-sm font-bold transition-colors ${
                                    val === n ? 'border-brand-500 bg-brand-600/20 text-brand-300' : 'border-surface-lighter text-gray-400 hover:border-brand-500/50'
                                  }`}
                                >
                                  {n}
                                </button>
                              );
                            })}
                          </div>
                          {Number(form.watch('entryFee') || 0) > 0 && (
                            <p className="text-xs text-gray-400 text-center">
                              Sua entrada: <span className="text-brand-300 font-semibold">
                                R$ {(Number(form.watch('entryFee') || 0) * Number(form.watch('organizerCotas') || 1)).toFixed(2)}
                              </span>
                              {' '}({Number(form.watch('organizerCotas') || 1)}× R$ {Number(form.watch('entryFee') || 0).toFixed(2)})
                            </p>
                          )}
                        </div>
                      )}

                      {/* Aviso quando escolhe "só criar" */}
                      {!wantsToParticipate && (
                        <div className="rounded-xl border border-gray-600/30 bg-gray-800/30 px-4 py-3 flex items-start gap-2.5">
                          <span className="text-base shrink-0 mt-0.5">ℹ️</span>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            Você será o organizador mas não participará. Poderá entrar no bolão depois pelo link de convite.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isPending}>
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={async () => {
                      const valid = await form.trigger(['name', 'championshipId', 'entryFee', 'maxParticipants']);
                      if (valid) setStep('matches');
                    }}
                    disabled={isPending}
                  >
                    Próximo →
                  </Button>
                </div>
              </>
            )}

            {/* ── Step 2: Matches ── */}
            {step === 'matches' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-100">Partidas do bolão</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {selectedMatchIds.length === 0
                        ? 'Nenhuma selecionada — todas serão incluídas'
                        : `${selectedMatchIds.length} selecionada(s)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {availableMatches.length > 0 && (
                      <>
                        <button type="button" onClick={() => setSelectedMatchIds(availableMatches.map((m: any) => m.id))} className="text-xs text-brand-400 hover:text-brand-300">Todas</button>
                        <span className="text-gray-600">·</span>
                        <button type="button" onClick={() => setSelectedMatchIds([])} className="text-xs text-gray-500 hover:text-gray-300">Limpar</button>
                        <span className="text-gray-600">·</span>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => { setShowNewMatch(v => !v); }}
                      className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
                    >
                      <Plus className="size-3" /> Adicionar
                    </button>
                  </div>
                </div>

                {/* Form inline para criar nova partida */}
                {showNewMatch && watchedChampionshipId && (
                  <div className="rounded-xl border border-brand-500/30 bg-brand-500/5 p-4 space-y-3">
                    <p className="text-xs font-semibold text-brand-300 uppercase tracking-wide">Nova partida</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['home', 'away'] as const).map((side) => {
                        const value = side === 'home' ? newMatchHome : newMatchAway;
                        const setter = side === 'home' ? setNewMatchHome : setNewMatchAway;
                        const label = side === 'home' ? 'Time da casa' : 'Time visitante';
                        return (
                          <div key={side}>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs text-gray-400">{label}</label>
                              <button
                                type="button"
                                onClick={() => { setNewTeamFor(side); setNewTeamName(''); setNewTeamCode(''); }}
                                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-0.5"
                              >
                                <Plus className="size-3" /> Novo
                              </button>
                            </div>
                            {newTeamFor === side ? (
                              <div className="space-y-1.5">
                                <input
                                  autoFocus
                                  type="text"
                                  placeholder="Nome do time"
                                  value={newTeamName}
                                  onChange={e => setNewTeamName(e.target.value)}
                                  className="w-full rounded-lg border border-brand-500/50 bg-surface px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-brand-500"
                                />
                                <input
                                  type="text"
                                  placeholder="Sigla (ex: FLA)"
                                  maxLength={5}
                                  value={newTeamCode}
                                  onChange={e => setNewTeamCode(e.target.value.toUpperCase())}
                                  className="w-full rounded-lg border border-surface-lighter bg-surface px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-brand-500"
                                />
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setNewTeamFor(null)}
                                    className="flex-1 py-1.5 rounded-lg text-xs text-gray-400 border border-surface-lighter hover:border-gray-500 transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!newTeamName.trim() || !newTeamCode.trim() || creatingTeam}
                                    onClick={() => {
                                      createTeam(
                                        { name: newTeamName.trim(), code: newTeamCode.trim() },
                                        {
                                          onSuccess: (team: any) => {
                                            console.log('✓ Time criado:', {
                                              name: team.name,
                                              id: team.id,
                                              idType: typeof team.id,
                                              isValidUUID: team.id ? isValidUUID(team.id) : false,
                                            });
                                            if (!team.id) {
                                              console.error('✗ ERRO: Time criado mas sem ID');
                                              toast.error('Erro: Time criado mas sem ID');
                                              return;
                                            }
                                            if (!isValidUUID(team.id)) {
                                              console.error(`✗ ERRO: ID não é um UUID válido: "${team.id}"`);
                                              toast.error(`Erro: ID do time inválido: ${team.id}`);
                                              return;
                                            }
                                            setter(team.id);
                                            setNewTeamFor(null);
                                            refetchTeams();
                                            toast.success(`${team.name} criado!`);
                                          },
                                          onError: (error: any) => {
                                            console.error('✗ Erro ao criar time:', {
                                              status: error?.response?.status,
                                              data: error?.response?.data,
                                              message: error?.message,
                                            });
                                            toast.error(`Erro ao criar time: ${error?.response?.data?.message || error.message}`);
                                          }
                                        }
                                      );
                                    }}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center gap-1"
                                  >
                                    {creatingTeam ? <Loader2 className="size-3 animate-spin" /> : <><Plus className="size-3" /> Criar</>}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <select
                                value={value}
                                onChange={e => setter(e.target.value)}
                                className="w-full rounded-lg border border-surface-lighter bg-surface px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-500"
                              >
                                <option value="">Selecionar...</option>
                                {(teams ?? []).map((t: any) => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Data e hora</label>
                        <input
                          type="datetime-local"
                          value={newMatchDate}
                          onChange={e => setNewMatchDate(e.target.value)}
                          className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-500 ${
                            newMatchDate && new Date(newMatchDate) < new Date(Date.now() + 30 * 60 * 1000)
                              ? 'border-orange-500/60'
                              : 'border-surface-lighter'
                          }`}
                        />
                        {newMatchDate && new Date(newMatchDate) < new Date() && (
                          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                            <AlertTriangle className="size-3 shrink-0" /> Horário já passou — palpites estarão encerrados
                          </p>
                        )}
                        {newMatchDate && new Date(newMatchDate) >= new Date() && new Date(newMatchDate) < new Date(Date.now() + 30 * 60 * 1000) && (
                          <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                            <AlertTriangle className="size-3 shrink-0" /> Menos de 30 min — palpites logo serão encerrados
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Rodada (opcional)</label>
                        <input
                          type="text"
                          placeholder="ex: Rodada 1"
                          value={newMatchRound}
                          onChange={e => setNewMatchRound(e.target.value)}
                          className="w-full rounded-lg border border-surface-lighter bg-surface px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setShowNewMatch(false); setNewMatchHome(''); setNewMatchAway(''); setNewMatchDate(''); setNewMatchRound(''); }}
                        className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 border border-surface-lighter hover:border-gray-500 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={!watchedChampionshipId || !newMatchHome || !newMatchAway || !newMatchDate || newMatchHome === newMatchAway || creatingMatch}
                        onClick={() => {
                          // Validação completa com mensagens descritivas
                          console.log('=== Iniciando validação de partida ===');
                          console.log('Valores brutos:', {
                            watchedChampionshipId: `"${watchedChampionshipId}"`,
                            newMatchHome: `"${newMatchHome}"`,
                            newMatchAway: `"${newMatchAway}"`,
                            newMatchDate: `"${newMatchDate}"`,
                          });

                          // Verificar se os valores estão vazios
                          if (!watchedChampionshipId?.trim()) {
                            console.error('❌ Erro: championshipId vazio');
                            toast.error('Selecione um campeonato');
                            return;
                          }
                          if (!newMatchHome?.trim()) {
                            console.error('❌ Erro: homeTeamId vazio');
                            toast.error('Selecione o time da casa');
                            return;
                          }
                          if (!newMatchAway?.trim()) {
                            console.error('❌ Erro: awayTeamId vazio');
                            toast.error('Selecione o time visitante');
                            return;
                          }
                          if (!newMatchDate?.trim()) {
                            console.error('❌ Erro: scheduledAt vazio');
                            toast.error('Selecione a data e hora');
                            return;
                          }

                          // Validar se são UUIDs válidos
                          const champIdValid = isValidUUID(watchedChampionshipId);
                          const homeIdValid = isValidUUID(newMatchHome);
                          const awayIdValid = isValidUUID(newMatchAway);

                          console.log('Validação UUID:', {
                            championshipId: champIdValid ? '✓ válido' : `✗ INVÁLIDO: "${watchedChampionshipId}"`,
                            homeTeamId: homeIdValid ? '✓ válido' : `✗ INVÁLIDO: "${newMatchHome}"`,
                            awayTeamId: awayIdValid ? '✓ válido' : `✗ INVÁLIDO: "${newMatchAway}"`,
                          });

                          if (!champIdValid) {
                            toast.error(`Campeonato inválido: ${watchedChampionshipId}`);
                            return;
                          }
                          if (!homeIdValid) {
                            toast.error(`Time da casa inválido: ${newMatchHome}`);
                            return;
                          }
                          if (!awayIdValid) {
                            toast.error(`Time visitante inválido: ${newMatchAway}`);
                            return;
                          }

                          // Se passou em todas as validações, enviar
                          const matchData = {
                            championshipId: watchedChampionshipId,
                            homeTeamId: newMatchHome,
                            awayTeamId: newMatchAway,
                            scheduledAt: new Date(newMatchDate).toISOString(),
                            roundId: newMatchRound || undefined,
                          };

                          console.log('✓ Todas as validações passaram. Enviando:', matchData);

                          createMatch(matchData, {
                            onSuccess: (match: any) => {
                              console.log('✓ Partida criada com sucesso:', match);
                              setShowNewMatch(false);
                              setNewMatchHome('');
                              setNewMatchAway('');
                              setNewMatchDate('');
                              setNewMatchRound('');
                              setSelectedMatchIds(prev => [...prev, match.id]);
                            },
                            onError: (err: any) => {
                              console.error('✗ Erro ao criar partida:', {
                                status: err?.response?.status,
                                data: err?.response?.data,
                                message: err?.message,
                              });
                            },
                          });
                        }}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-1.5"
                      >
                        {creatingMatch ? <><Loader2 className="size-3 animate-spin" /> Criando...</> : <><Plus className="size-3" /> Criar partida</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Aviso: todos os jogos do campeonato já encerraram */}
                {allMatchesFinished && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-300">Campeonato encerrado</p>
                      <p className="text-xs text-red-400/80 mt-0.5">Todas as partidas deste campeonato já foram encerradas. Não é possível criar um bolão.</p>
                    </div>
                  </div>
                )}

                {loadingChampMatches ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando partidas...
                  </div>
                ) : (champMatches ?? []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-600/40 p-6 text-center space-y-2">
                    <Trophy className="h-8 w-8 text-gray-600 mx-auto" />
                    <p className="text-sm font-medium text-gray-300">Nenhuma partida cadastrada</p>
                    <p className="text-xs text-gray-500">O administrador ainda não adicionou jogos para este campeonato.</p>
                    <div className="flex items-center gap-1.5 justify-center mt-1 text-xs text-gray-500">
                      <Info className="size-3" />
                      Você pode continuar — todas as partidas futuras serão incluídas automaticamente.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {(champMatches ?? []).map((m: any) => {
                      const selected = selectedMatchIds.includes(m.id);
                      const finished = m.status === 'FINISHED';
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => !finished && toggleMatch(m.id)}
                          disabled={finished}
                          className={`w-full rounded-xl border p-3 transition-colors flex items-center gap-3 text-left ${
                            finished
                              ? 'border-surface-lighter opacity-50 cursor-not-allowed'
                              : selected
                              ? 'border-brand-500 bg-brand-600/10'
                              : 'border-surface-lighter hover:border-gray-500'
                          }`}
                        >
                          {finished
                            ? <Lock className="h-4 w-4 text-gray-600 shrink-0" />
                            : selected
                            ? <CheckSquare className="h-4 w-4 text-brand-400 shrink-0" />
                            : <Square className="h-4 w-4 text-gray-600 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 justify-between">
                              <p className={`text-sm font-semibold truncate ${finished ? 'text-gray-500' : 'text-gray-100'}`}>
                                {m.homeTeam?.name} <span className="text-gray-500 font-normal">vs</span> {m.awayTeam?.name}
                              </p>
                              <div className="flex items-center gap-2 shrink-0">
                                {finished && (
                                  <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded-full">
                                    {m.homeScoreResult !== null ? `${m.homeScoreResult}–${m.awayScoreResult}` : 'Encerrada'}
                                  </span>
                                )}
                                {m.roundId && <span className="text-xs text-gray-500">{m.roundId}</span>}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {format(new Date(m.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="secondary" onClick={() => setStep('basic')} disabled={isPending}>
                    ← Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep('advanced')}
                    disabled={isPending || allMatchesFinished}
                    title={allMatchesFinished ? 'Não é possível criar bolão com campeonato encerrado' : undefined}
                  >
                    Próximo →
                  </Button>
                </div>
              </>
            )}

            {/* ── Step 3: Advanced ── */}
            {step === 'advanced' && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-50 block mb-2">Regras (opcional)</label>
                  <textarea
                    placeholder="Digite aqui as regras especiais do seu bolão..."
                    {...form.register('rules')}
                    disabled={isPending}
                    rows={5}
                    className="flex w-full rounded-lg border border-surface-lighter bg-surface/50 px-3 py-2 text-sm text-gray-50 placeholder:text-gray-500 transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Info: pagamentos vão para a chave PIX fixa do sistema */}
                {(form.watch('entryFee') ?? 0) > 0 && (
                  <div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-4 flex items-start gap-3">
                    <Info className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-brand-300">Pagamentos via PIX do sistema</p>
                      <p className="text-xs text-gray-400 mt-0.5">Os participantes receberão a chave PIX do sistema para realizar o pagamento.</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="secondary" onClick={() => setStep('matches')} disabled={isPending}>
                    ← Voltar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Criando...</>
                      : 'Criar Bolão'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Share modal — aparece após criar o bolão */}
      {createdPool && (
        <ShareModal
          open={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            router.push(`/pools/${createdPool.id}`);
          }}
          pool={createdPool}
        />
      )}
    </div>
  );
}

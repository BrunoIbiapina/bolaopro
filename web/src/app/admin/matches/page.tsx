'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, X, Pencil, CheckCircle2, Trophy, ArrowLeft } from 'lucide-react';
import { useMatches, useCreateMatch, useRegisterResult } from '@/hooks/use-matches';
import { useTeams } from '@/hooks/use-teams';
import { useChampionships } from '@/hooks/use-championships';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

type MatchForm = { championshipId: string; homeTeamId: string; awayTeamId: string; scheduledAt: string; roundId: string };
type ResultForm = { homeScore: string; awayScore: string };

const statusLabel: Record<string, string> = { SCHEDULED: 'Agendado', LIVE: 'Ao vivo', FINISHED: 'Finalizado', CANCELLED: 'Cancelado' };
const statusVariant: Record<string, 'default' | 'success' | 'error' | 'info'> = { SCHEDULED: 'info', LIVE: 'error', FINISHED: 'success', CANCELLED: 'default' };

export default function MatchesPage() {
  const searchParams = useSearchParams();
  const fromPool = searchParams.get('fromPool');       // poolId para voltar
  const fromChamp = searchParams.get('championship'); // pré-filtro de campeonato

  const [showForm, setShowForm] = useState(false);
  const [resultMatchId, setResultMatchId] = useState<string | null>(null);
  const [filterChamp, setFilterChamp] = useState(fromChamp ?? '');

  const { data: matches, isLoading } = useMatches(filterChamp || undefined);
  const { data: teams } = useTeams();
  const { data: championships } = useChampionships();
  const { mutate: createMatch, isPending } = useCreateMatch();
  const { mutate: registerResult, isPending: savingResult } = useRegisterResult();

  const form = useForm<MatchForm>({ defaultValues: { championshipId: '', homeTeamId: '', awayTeamId: '', scheduledAt: '', roundId: '' } });
  const resultForm = useForm<ResultForm>({ defaultValues: { homeScore: '0', awayScore: '0' } });

  const onSubmit = (data: MatchForm) => {
    createMatch(
      { ...data, roundId: data.roundId || undefined },
      { onSuccess: () => { setShowForm(false); form.reset(); } }
    );
  };

  const onSubmitResult = (data: ResultForm) => {
    if (!resultMatchId) return;
    registerResult(
      { matchId: resultMatchId, homeScore: Number(data.homeScore), awayScore: Number(data.awayScore) },
      { onSuccess: () => { setResultMatchId(null); resultForm.reset(); } }
    );
  };

  const openResultForm = (matchId: string) => {
    const match = matches?.find((m) => m.id === matchId);
    setResultMatchId(matchId);
    setShowForm(false);
    // Pré-preenche com resultado atual se já existir
    const currentHome = match?.homeScoreResult ?? match?.homeTeamScore ?? 0;
    const currentAway = match?.awayScoreResult ?? match?.awayTeamScore ?? 0;
    resultForm.reset({ homeScore: String(currentHome), awayScore: String(currentAway) });
  };

  const selectedMatch = matches?.find((m) => m.id === resultMatchId);
  const isEditing = selectedMatch?.status === 'FINISHED';

  return (
    <div className="space-y-6">
      {/* Voltar ao bolão quando veio de um pool */}
      {fromPool && (
        <Link
          href={`/pools/${fromPool}`}
          className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Voltar ao bolão
        </Link>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-50">Partidas</h1>
          {fromPool && (
            <p className="text-sm text-gray-400 mt-1">
              Filtrando pelo campeonato do bolão — registre ou corrija resultados abaixo
            </p>
          )}
        </div>
        <Button className="gap-2" onClick={() => { setShowForm(true); setResultMatchId(null); }}>
          <Plus className="w-4 h-4" /> Nova Partida
        </Button>
      </div>

      {/* Create Match Form */}
      {showForm && (
        <Card className="border-brand-500/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Nova Partida</CardTitle>
            <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-50" /></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-50 block mb-2">Campeonato *</label>
                <Select {...form.register('championshipId', { required: true })}>
                  <option value="">Selecione...</option>
                  {championships?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">Time da Casa *</label>
                <Select {...form.register('homeTeamId', { required: true })}>
                  <option value="">Selecione...</option>
                  {teams?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">Time Visitante *</label>
                <Select {...form.register('awayTeamId', { required: true })}>
                  <option value="">Selecione...</option>
                  {teams?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">Data/Hora *</label>
                <Input type="datetime-local" {...form.register('scheduledAt', { required: true })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">Rodada (opcional)</label>
                <Input placeholder="Ex: Rodada 1" {...form.register('roundId')} />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : 'Criar Partida'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Register / Edit Result Form */}
      {resultMatchId && selectedMatch && (
        <Card className={`border-2 ${isEditing ? 'border-yellow-500/50' : 'border-green-500/50'}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-3">
              <div className={`size-9 rounded-xl flex items-center justify-center ${isEditing ? 'bg-yellow-500/15' : 'bg-green-500/15'}`}>
                {isEditing
                  ? <Pencil className="size-4 text-yellow-400" />
                  : <CheckCircle2 className="size-4 text-green-400" />}
              </div>
              <div>
                <CardTitle className="text-base">
                  {isEditing ? 'Corrigir resultado' : 'Registrar resultado'}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedMatch.homeTeam?.name ?? '?'} vs {selectedMatch.awayTeam?.name ?? '?'}
                  {selectedMatch.roundId && ` · ${selectedMatch.roundId}`}
                </p>
              </div>
            </div>
            <button onClick={() => setResultMatchId(null)}>
              <X className="w-5 h-5 text-gray-400 hover:text-gray-50" />
            </button>
          </CardHeader>
          <CardContent>
            {isEditing && (
              <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Trophy className="size-3.5 text-yellow-400 shrink-0" />
                <p className="text-xs text-yellow-300">
                  Resultado atual: <span className="font-bold font-mono">
                    {selectedMatch.homeScoreResult ?? selectedMatch.homeTeamScore} × {selectedMatch.awayScoreResult ?? selectedMatch.awayTeamScore}
                  </span> — altere abaixo e confirme para recalcular o ranking.
                </p>
              </div>
            )}
            <form onSubmit={resultForm.handleSubmit(onSubmitResult)}>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    {selectedMatch.homeTeam?.name ?? 'Casa'}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    className="text-center text-2xl font-bold h-14"
                    {...resultForm.register('homeScore', { required: true, min: 0 })}
                  />
                </div>
                <span className="text-3xl font-bold text-gray-500 mb-3">×</span>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                    {selectedMatch.awayTeam?.name ?? 'Visitante'}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    className="text-center text-2xl font-bold h-14"
                    {...resultForm.register('awayScore', { required: true, min: 0 })}
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={savingResult}
                className={`w-full mt-4 gap-2 ${isEditing ? 'bg-yellow-600 hover:bg-yellow-500' : ''}`}
              >
                {savingResult
                  ? 'Salvando...'
                  : isEditing
                  ? <><Pencil className="size-4" /> Atualizar resultado e recalcular ranking</>
                  : <><CheckCircle2 className="size-4" /> Confirmar resultado e encerrar partida</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <Select value={filterChamp} onChange={(e) => setFilterChamp(e.target.value)}>
            <option value="">Todos os campeonatos</option>
            {championships?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Partidas ({matches?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400 text-sm text-center py-8">Carregando...</p>
          ) : !matches?.length ? (
            <p className="text-gray-400 text-sm text-center py-8">Nenhuma partida encontrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partida</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => {
                  const homeScore = match.homeScoreResult ?? match.homeTeamScore;
                  const awayScore = match.awayScoreResult ?? match.awayTeamScore;
                  const isSelected = match.id === resultMatchId;
                  const isFinished = match.status === 'FINISHED';

                  return (
                    <TableRow key={match.id} className={isSelected ? 'bg-surface-light' : ''}>
                      <TableCell className="font-semibold text-gray-50">
                        <span>{match.homeTeam?.name ?? '?'}</span>
                        <span className="text-gray-500 mx-1.5">vs</span>
                        <span>{match.awayTeam?.name ?? '?'}</span>
                        {match.roundId && (
                          <span className="ml-2 text-xs text-gray-500 font-normal">{match.roundId}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {format(new Date(match.scheduledAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {homeScore != null ? (
                          <span className="font-mono font-bold text-brand-400">{homeScore} × {awayScore}</span>
                        ) : (
                          <span className="text-gray-500 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[match.status] ?? 'default'}>
                          {statusLabel[match.status] ?? match.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => openResultForm(match.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isFinished
                              ? 'hover:bg-yellow-500/10 text-yellow-400 hover:text-yellow-300'
                              : 'hover:bg-green-500/10 text-green-400 hover:text-green-300'
                          }`}
                          title={isFinished ? 'Corrigir resultado' : 'Registrar resultado'}
                        >
                          {isFinished
                            ? <Pencil className="w-4 h-4" />
                            : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

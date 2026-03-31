'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { useChampionships, useCreateChampionship, useDeleteChampionship } from '@/hooks/use-championships';

type ChampionshipForm = { name: string; code: string; description: string; startDate: string; endDate: string };

const statusLabel: Record<string, string> = { UPCOMING: 'Em breve', RUNNING: 'Em andamento', FINISHED: 'Finalizado' };
const statusVariant: Record<string, 'default' | 'success' | 'info'> = { UPCOMING: 'info', RUNNING: 'success', FINISHED: 'default' };

export default function ChampionshipsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: championships, isLoading } = useChampionships();
  const { mutate: createChampionship, isPending } = useCreateChampionship();
  const { mutate: deleteChampionship } = useDeleteChampionship();

  const form = useForm<ChampionshipForm>({ defaultValues: { name: '', code: '', description: '', startDate: '', endDate: '' } });

  const filtered = (championships ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.abbreviation ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (data: ChampionshipForm) => {
    createChampionship(
      {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description || undefined,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      },
      { onSuccess: () => { setShowForm(false); form.reset(); } }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-50">Campeonatos</h1>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Novo Campeonato
        </Button>
      </div>

      {showForm && (
        <Card className="border-brand-500/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Novo Campeonato</CardTitle>
            <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-50" /></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">Nome *</label>
                <Input placeholder="Ex: Brasileirão 2026" {...form.register('name', { required: true })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">Código *</label>
                <Input placeholder="Ex: BR2026" maxLength={10} {...form.register('code', { required: true })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">Data Início</label>
                <Input type="date" {...form.register('startDate')} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">Data Fim</label>
                <Input type="date" {...form.register('endDate')} />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-50 block mb-2">Descrição (opcional)</label>
                <Input placeholder="Descrição do campeonato..." {...form.register('description')} />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : 'Criar Campeonato'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <Input placeholder="Buscar campeonatos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Campeonatos Cadastrados ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400 text-sm text-center py-8">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Nenhum campeonato encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((champ) => (
                  <TableRow key={champ.id}>
                    <TableCell className="font-semibold text-gray-50">{champ.name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-surface-light rounded text-sm font-mono">{champ.abbreviation}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[champ.status] ?? 'default'}>
                        {statusLabel[champ.status] ?? champ.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => { if (confirm(`Remover "${champ.name}"?`)) deleteChampionship(champ.id); }}
                        className="p-2 hover:bg-surface-light rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

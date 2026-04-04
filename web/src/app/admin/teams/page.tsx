'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { useTeams, useCreateTeam, useDeleteTeam } from '@/hooks/use-teams';

type TeamForm = { name: string; code: string; country: string; logo: string };

export default function TeamsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: teams, isLoading } = useTeams();
  const { mutate: createTeam, isPending } = useCreateTeam();
  const { mutate: deleteTeam } = useDeleteTeam();

  const form = useForm<TeamForm>({ defaultValues: { name: '', code: '', country: 'Brasil', logo: '' } });

  const filteredTeams = (teams ?? []).filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.abbreviation ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (data: TeamForm) => {
    createTeam(
      { name: data.name, code: data.code.toUpperCase(), country: data.country || undefined, logo: data.logo || undefined },
      { onSuccess: () => { setShowForm(false); form.reset(); } }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-50">Times</h1>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Novo Time
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card className="border-brand-500/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Novo Time</CardTitle>
            <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-50" /></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">Nome *</label>
                <Input placeholder="Ex: Flamengo" {...form.register('name', { required: true })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">Código (sigla) *</label>
                <Input placeholder="Ex: FLA" maxLength={5} {...form.register('code', { required: true })} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">País</label>
                <Input placeholder="Ex: Brasil" {...form.register('country')} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-50 block mb-2">URL do Logo (opcional)</label>
                <Input placeholder="https://..." {...form.register('logo')} />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Salvando...' : 'Criar Time'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <Input placeholder="Buscar times..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Times Cadastrados ({filteredTeams.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-gray-400 text-sm text-center py-8">Carregando...</p>
          ) : filteredTeams.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Nenhum time encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-semibold text-gray-50">{team.name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-surface-light rounded text-sm font-mono">{team.abbreviation}</span>
                    </TableCell>
                    <TableCell>{team.country ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => { if (confirm(`Remover ${team.name}?`)) deleteTeam(team.id); }}
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

'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useMyPools } from '@/hooks/use-pools';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PoolCard } from '@/components/shared/pool-card';
import { FullPageSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Trophy, Plus, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: pools, isLoading } = useMyPools();

  if (isLoading) {
    return <FullPageSkeleton />;
  }

  const activePools = pools?.filter((p) => p.status !== 'FINISHED') || [];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-50">
          Bem-vindo de volta, {user?.fullName?.split(' ')[0]}!
        </h1>
        <p className="text-gray-400">
          Acompanhe seus bolões e atualize seus palpites
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Bolões Ativos</p>
                <p className="text-3xl font-bold text-gray-50 mt-1">
                  {activePools.length}
                </p>
              </div>
              <Trophy className="w-8 h-8 text-brand-400 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Posição Média</p>
                <p className="text-3xl font-bold text-gray-50 mt-1">
                  {activePools.length > 0
                    ? (activePools.reduce((acc, p) => acc + (p.position || 0), 0) / activePools.length).toFixed(1)
                    : '-'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-brand-400 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-brand-500/30 hover:border-brand-500/50 transition-colors">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center h-full">
            <div className="size-10 rounded-full bg-brand-500/10 flex items-center justify-center">
              <Plus className="size-5 text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-100">Novo Bolão</p>
              <p className="text-xs text-gray-500 mt-0.5">Crie um bolão com seus amigos</p>
            </div>
            <Link href="/pools/new">
              <Button size="sm" className="gap-1.5">
                <Plus data-icon="inline-start" />
                Criar agora
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Active Pools */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-50">Seus Bolões</h2>
          <Link href="/pools">
            <Button variant="ghost" size="sm">
              Ver todos
            </Button>
          </Link>
        </div>

        {activePools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePools.slice(0, 6).map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Trophy}
            title="Nenhum bolão ativo"
            description="Crie seu primeiro bolão ou peça convite para amigos"
            action={{
              label: 'Criar bolão',
              onClick: () => window.location.href = '/pools/new',
            }}
          />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Próximas Rodadas</CardTitle>
            <CardDescription>
              Você tem {activePools.length} rodadas para fazer palpites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              Acesse seus bolões para fazer ou atualizar seus palpites antes dos jogos começarem.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dica de Hoje</CardTitle>
            <CardDescription>
              Analise os jogos com cuidado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              Quanto mais informação você tiver sobre os times e jogadores, melhor será sua previsão.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

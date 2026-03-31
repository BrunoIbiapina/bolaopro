'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useMyPools, useAvailablePools, useJoinByCode, usePoolByCode } from '@/hooks/use-pools';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { PoolCard } from '@/components/shared/pool-card';
import { FullPageSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { PoolStatus } from '@/types';
import { Plus, Trophy, Search, Users, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

function JoinModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('');
  const [confirmedCode, setConfirmedCode] = useState('');
  const [numCotas, setNumCotas] = useState(1);
  const { data: poolInfo, isLoading: loadingPool, isError: codeError } = usePoolByCode(confirmedCode);
  const { mutate: joinByCode, isPending: joining } = useJoinByCode();
  const router = useRouter();

  const maxCotas = poolInfo?.cotasPerParticipant ?? 1;
  const step = confirmedCode && poolInfo ? 'cotas' : 'code';

  // Resetar cotas quando muda o pool
  const handleVerify = () => {
    if (code.trim().length < 4) return;
    setNumCotas(1);
    setConfirmedCode(code.trim().toUpperCase());
  };

  const handleJoin = () => {
    if (!poolInfo) return;
    joinByCode(
      { inviteCode: confirmedCode, numCotas },
      {
        onSuccess: (pool) => {
          onClose();
          router.push(`/pools/${pool.id}`);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-surface-lighter bg-surface p-6 shadow-xl mx-4 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-50">Entrar em um bolão</h2>
          <p className="text-sm text-gray-400 mt-1">Peça o código de convite ao organizador</p>
        </div>

        {/* Step 1: Código */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Código de convite</label>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: aB3xY9kL"
              value={code}
              onChange={(e) => { setCode(e.target.value); setConfirmedCode(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              autoFocus
              className="font-mono tracking-wider"
            />
            <Button variant="outline" onClick={handleVerify} disabled={loadingPool || code.trim().length < 4}>
              {loadingPool ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
            </Button>
          </div>
          {codeError && confirmedCode && (
            <p className="text-xs text-red-400 mt-1">Código inválido ou bolão não encontrado</p>
          )}
        </div>

        {/* Step 2: Pool info + cotas (só aparece após validar código) */}
        {poolInfo && (
          <>
            <div className="rounded-xl border border-brand-500/30 bg-brand-600/10 p-3 space-y-1">
              <p className="text-sm font-semibold text-gray-100">{poolInfo.name}</p>
              {poolInfo.championship && (
                <p className="text-xs text-gray-400">{poolInfo.championship.name}</p>
              )}
              <div className="flex items-center gap-3 mt-1 text-xs flex-wrap">
                <span className="text-brand-300 font-semibold">
                  {poolInfo.entryFee > 0 ? `R$ ${poolInfo.entryFee.toFixed(2)} / cota` : 'Grátis'}
                </span>
                <span className="text-gray-400">{poolInfo.memberCount}/{poolInfo.maxParticipants} participantes</span>
                {maxCotas > 1 && <span className="text-gray-400">até {maxCotas} cotas</span>}
              </div>
              <p className="text-xs text-gray-500">por {poolInfo.organizer?.fullName}</p>
            </div>

            {/* Seletor de cotas — só mostra se o bolão permite mais de 1 */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Quantas cotas você quer?
                <span className="ml-1 text-gray-500">(cada cota = uma cartela de palpites)</span>
              </label>
              <div className="flex items-center gap-2">
                {Array.from({ length: maxCotas }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumCotas(n)}
                    className={`flex-1 rounded-lg border py-2.5 text-sm font-bold transition-colors ${
                      numCotas === n
                        ? 'border-brand-500 bg-brand-600/20 text-brand-300'
                        : 'border-surface-lighter text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {poolInfo.entryFee > 0 && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Total a pagar: <span className="text-brand-300 font-semibold">R$ {(poolInfo.entryFee * numCotas).toFixed(2)}</span>
                  {' '}({numCotas} × R$ {poolInfo.entryFee.toFixed(2)})
                </p>
              )}
            </div>
          </>
        )}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} className="flex-1" disabled={joining}>
            Cancelar
          </Button>
          <Button
            onClick={poolInfo ? handleJoin : handleVerify}
            className="flex-1"
            disabled={joining || loadingPool || code.trim().length < 4}
          >
            {joining
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : poolInfo
              ? `Entrar com ${numCotas} cota${numCotas > 1 ? 's' : ''}`
              : 'Buscar bolão'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AvailablePoolCard({ pool }: { pool: any }) {
  const router = useRouter();
  const [numCotas, setNumCotas] = useState(1);
  const maxCotas = pool.cotasPerParticipant ?? 1;
  const { mutate: joinByCode, isPending } = useJoinByCode();

  return (
    <Card className="hover:border-brand-500/50 transition-colors">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-50 truncate">{pool.name}</h3>
            {pool.description && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{pool.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{pool.memberCount}/{pool.maxParticipants}</span>
              <span>{pool.championship?.name}</span>
              <span className="text-brand-400 font-medium">{pool.entryFee > 0 ? `R$ ${pool.entryFee.toFixed(2)}/cota` : 'Grátis'}</span>
              {maxCotas > 1 && <span>até {maxCotas} cotas</span>}
            </div>
            <p className="text-xs text-gray-500 mt-1">por {pool.organizer?.fullName}</p>
          </div>
        </div>

        <div className="space-y-2">
          {maxCotas > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 shrink-0">Cotas:</span>
              <div className="flex gap-1 overflow-x-auto scrollbar-none flex-1">
                {Array.from({ length: maxCotas }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setNumCotas(n)}
                    className={`min-w-[28px] h-7 rounded text-xs font-bold border transition-colors shrink-0 ${
                      numCotas === n ? 'border-brand-500 bg-brand-600/20 text-brand-300' : 'border-surface-lighter text-gray-400'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Button size="sm" className="w-full" disabled={isPending} onClick={() =>
            joinByCode({ inviteCode: pool.inviteCode, numCotas }, { onSuccess: (p) => router.push(`/pools/${p.id}`) })
          }>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : pool.entryFee > 0 ? `Entrar · R$ ${(pool.entryFee * numCotas).toFixed(2)}` : 'Entrar grátis'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PoolsPage() {
  const { user } = useAuth();
  const { data: pools, isLoading } = useMyPools();
  const { data: available, isLoading: loadingAvailable } = useAvailablePools();
  const [showJoinModal, setShowJoinModal] = useState(false);

  if (isLoading) return <FullPageSkeleton />;

  const myPools = pools || [];
  const finished = myPools.filter((p) => p.status === PoolStatus.FINISHED);
  const active = myPools.filter((p) => p.status !== PoolStatus.FINISHED);

  return (
    <div className="space-y-6">
      {showJoinModal && <JoinModal onClose={() => setShowJoinModal(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-50">Bolões</h1>
          <p className="text-gray-400 mt-1">Seus bolões e disponíveis para entrar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowJoinModal(true)}>
            <Search className="w-4 h-4 mr-2" />
            Código de convite
          </Button>
          <Link href="/pools/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Criar Bolão
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">Meus Bolões ({active.length})</TabsTrigger>
          <TabsTrigger value="available">Descobrir {available?.length ? `(${available.length})` : ''}</TabsTrigger>
          <TabsTrigger value="finished">Finalizados ({finished.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-4">
          {active.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {active.map((pool) => <PoolCard key={pool.id} pool={pool} />)}
            </div>
          ) : (
            <EmptyState icon={Trophy} title="Nenhum bolão ainda"
              description="Crie um bolão ou entre em um com o código de convite"
              action={{ label: 'Criar bolão', onClick: () => window.location.href = '/pools/new' }} />
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {loadingAvailable ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
          ) : available?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {available.map((pool) => <AvailablePoolCard key={pool.id} pool={pool} />)}
            </div>
          ) : (
            <EmptyState icon={Search} title="Nenhum bolão disponível"
              description="Não há bolões abertos. Peça um código ou crie o seu!"
              action={{ label: 'Criar bolão', onClick: () => window.location.href = '/pools/new' }} />
          )}
        </TabsContent>

        <TabsContent value="finished" className="space-y-4">
          {finished.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {finished.map((pool) => <PoolCard key={pool.id} pool={pool} />)}
            </div>
          ) : (
            <EmptyState icon={Trophy} title="Nenhum finalizado" description="Bolões finalizados aparecerão aqui" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

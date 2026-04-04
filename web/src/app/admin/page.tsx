'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Zap, BookOpen, TrendingUp, Trophy } from 'lucide-react';

const adminCards = [
  { href: '/admin/pools', label: 'Bolões', icon: Trophy, description: 'Ver, fechar e finalizar todos os bolões' },
  { href: '/admin/teams', label: 'Times', icon: Users, description: 'Gerenciar times cadastrados' },
  { href: '/admin/championships', label: 'Campeonatos', icon: Zap, description: 'Gerenciar campeonatos' },
  { href: '/admin/matches', label: 'Partidas', icon: BookOpen, description: 'Gerenciar partidas e resultados' },
  { href: '/admin/finance', label: 'Pagamentos', icon: TrendingUp, description: 'Confirmar pagamentos pendentes' },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-50">Administração</h1>
        <p className="text-gray-400 mt-1">Painel de controle do Bolão Pro</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="hover:border-brand-500/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{card.label}</CardTitle>
                    <p className="text-sm text-gray-400">{card.description}</p>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

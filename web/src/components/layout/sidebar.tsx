'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Trophy,
  Bell,
  Settings,
  Users,
  Shield,
  Zap,
  TrendingUp,
  BookOpen,
  Download,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';

const MAIN_ROUTES = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/pools', label: 'Meus Bolões', icon: Trophy },
  { href: '/futebol', label: 'Futebol', icon: TrendingUp },
  { href: '/notifications', label: 'Notificações', icon: Bell },
  { href: '/profile', label: 'Perfil', icon: Settings },
];

const ADMIN_ROUTES = [
  { href: '/admin', label: 'Admin', icon: Shield },
  { href: '/admin/teams', label: 'Times', icon: Users },
  { href: '/admin/championships', label: 'Campeonatos', icon: Zap },
  { href: '/admin/matches', label: 'Partidas', icon: BookOpen },
  { href: '/admin/finance', label: 'Finanças', icon: TrendingUp },
  { href: '/admin/import-matches', label: 'Importar Partidas', icon: Download },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <aside className="hidden md:block fixed left-0 top-16 h-[calc(100vh-64px)] w-64 border-r border-surface-lighter bg-surface/80 backdrop-blur-sm overflow-y-auto">
      <nav className="space-y-1 p-4">
        {/* Main Routes */}
        <div>
          {MAIN_ROUTES.map((route) => {
            const Icon = route.icon;
            const isActive = pathname === route.href;

            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600/20 text-brand-300 border-l-2 border-brand-500'
                    : 'text-gray-400 hover:bg-surface-light hover:text-gray-50'
                )}
              >
                <Icon className="w-5 h-5" />
                {route.label}
              </Link>
            );
          })}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="my-4 border-t border-surface-lighter" />
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Administração
              </p>
            </div>
            {ADMIN_ROUTES.map((route) => {
              const Icon = route.icon;
              const isActive = route.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(route.href);

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-600/20 text-brand-300 border-l-2 border-brand-500'
                      : 'text-gray-400 hover:bg-surface-light hover:text-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {route.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Trophy,
  TrendingUp,
  Bell,
  User,
  Vote,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ROUTES = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/pools', label: 'Bolões', icon: Trophy },
  { href: '/futebol', label: 'Futebol', icon: TrendingUp },
  { href: '/causas', label: 'Causas', icon: Vote },
  { href: '/notifications', label: 'Alertas', icon: Bell },
  { href: '/profile', label: 'Perfil', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-surface-lighter bg-surface/80 backdrop-blur-sm md:hidden">
      <div className="flex items-center justify-around h-14 overflow-x-auto scrollbar-none px-1">
        {ROUTES.map((route) => {
          const Icon = route.icon;
          const isActive = route.href === '/'
            ? pathname === '/'
            : pathname.startsWith(route.href);

          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'flex flex-col items-center justify-center min-w-[52px] h-full gap-0.5 px-1 transition-colors',
                isActive
                  ? 'text-brand-400'
                  : 'text-gray-400'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{route.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

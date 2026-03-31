'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Trophy,
  Zap,
  Bell,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ROUTES = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/pools', label: 'Bolões', icon: Trophy },
  { href: '/notifications', label: 'Alertas', icon: Bell },
  { href: '/profile', label: 'Perfil', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-surface-lighter bg-surface/80 backdrop-blur-sm md:hidden">
      <div className="flex items-center justify-around h-16">
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
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                isActive
                  ? 'text-brand-400'
                  : 'text-gray-400'
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{route.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

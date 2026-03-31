'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useUnreadNotificationsCount } from '@/hooks/use-notifications';
import { AvatarWithInitials } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, logout } = useAuth();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  return (
    <header className="sticky top-0 z-40 border-b border-surface-lighter bg-surface/80 backdrop-blur-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">BP</span>
          </div>
          <span className="font-bold text-lg text-gray-50 hidden sm:block">
            Bolão Pro
          </span>
        </Link>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative p-2 hover:bg-surface-light rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-400" />
            {unreadCount > 0 && (
              <Badge
                variant="error"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
              >
                {unreadCount}
              </Badge>
            )}
          </Link>

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownTrigger className="flex items-center gap-2 p-1 hover:bg-surface-light rounded-lg transition-colors">
                <AvatarWithInitials
                  name={user.fullName}
                  src={user.avatarUrl}
                />
              </DropdownTrigger>
              <DropdownContent>
                <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold text-gray-50">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <DropdownSeparator />
                <DropdownItem>
                  <Link href="/profile" className="block w-full">Perfil</Link>
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem
                  onClick={logout}
                  className="text-red-400 hover:text-red-300"
                >
                  Sair
                </DropdownItem>
              </DropdownContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

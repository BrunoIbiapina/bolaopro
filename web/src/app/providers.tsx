'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/contexts/auth-context';
import { Toast } from '@/components/ui/toast';
import { NavigationProgress } from '@/components/shared/navigation-progress';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationProgress />
          {children}
          <Toast />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

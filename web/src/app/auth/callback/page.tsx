'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setTokens } from '@/lib/auth';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');
    const redirect = searchParams.get('redirect') ?? '/';

    if (!token || !refresh) {
      setStatus('error');
      setError('Token inválido. Tente novamente.');
      return;
    }

    // Salva os tokens nos cookies
    setTokens(token, refresh);

    // Normaliza o redirect (evita string 'null' ou caminhos inválidos)
    const redirectTo = (!redirect || redirect === 'null' || redirect === 'undefined') ? '/' : redirect;

    // NÃO usa api.get() aqui — o interceptor do axios pode chamar clearTokens()
    // em caso de 401 e redirecionar para /login, criando o bug do "login duplo".
    // Os tokens já estão salvos nos cookies, então basta redirecionar.
    setStatus('success');
    setTimeout(() => { window.location.href = redirectTo; }, 600);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-950 via-gray-900 to-gray-950 px-4">
      <div className="w-full max-w-xs text-center space-y-5">

        {status === 'loading' && (
          <>
            <div className="size-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto">
              <Loader2 className="size-8 text-brand-400 animate-spin" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-white">Entrando com Google...</p>
              <p className="text-sm text-gray-400">Aguarde um momento</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="size-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-8 text-green-400" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-white">Login realizado!</p>
              <p className="text-sm text-gray-400">Redirecionando...</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="size-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="size-8 text-red-400" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-white">Erro no login</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors text-sm"
            >
              Tentar novamente
            </button>
          </>
        )}

        <p className="text-xs text-gray-600">
          Powered by <span className="text-brand-500 font-semibold">Bolão Pro</span>
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackContent />
    </Suspense>
  );
}

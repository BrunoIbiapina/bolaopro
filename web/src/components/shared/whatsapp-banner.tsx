'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, MessageCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const STORAGE_KEY = 'whatsapp_promo_v1';

export function WhatsAppBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Não mostra se já foi dispensado
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Não mostra se WhatsApp já está ativo
    if ((user as any)?.whatsappOptIn) return;
    setVisible(true);
  }, [user]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  const hasPhone = !!(user as any)?.phone;

  return (
    <div className="relative rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-600/10 via-green-500/5 to-transparent p-4 overflow-hidden">
      {/* Glow */}
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-green-500/10 blur-2xl pointer-events-none" />

      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className="shrink-0 w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-green-400" />
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 bg-green-500/15 px-1.5 py-0.5 rounded-md">
              Novidade
            </span>
          </div>

          <p className="text-sm font-semibold text-gray-50">
            Receba notificações pelo WhatsApp
          </p>

          <ul className="mt-1.5 space-y-0.5">
            {[
              'Resultado de causas e bolões',
              'Lembrete antes de fechar palpites',
              'Confirmação de pagamento',
              'Quando alguém entra no seu bolão',
            ].map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-xs text-gray-400">
                <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="/profile"
            onClick={dismiss}
            className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-green-400 hover:text-green-300 transition-colors"
          >
            {hasPhone ? 'Ativar notificações no perfil' : 'Cadastrar número e ativar'}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Fechar */}
        <button
          onClick={dismiss}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

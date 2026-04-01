'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, TrendingUp, ArrowRight } from 'lucide-react';

interface NewFeatureBannerProps {
  storageKey: string;       // chave única no localStorage
  icon?: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export function NewFeatureBanner({
  storageKey,
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: NewFeatureBannerProps) {
  const [visible, setVisible] = useState(false);

  // Só mostra depois de montar no cliente (evita hydration mismatch)
  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) setVisible(true);
  }, [storageKey]);

  const dismiss = () => {
    localStorage.setItem(storageKey, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-600/10 via-brand-500/5 to-transparent p-4 overflow-hidden">
      {/* Glow decorativo */}
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-brand-500/10 blur-2xl pointer-events-none" />

      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
          {icon ?? <TrendingUp className="w-5 h-5 text-brand-400" />}
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400 bg-brand-500/15 px-1.5 py-0.5 rounded-md">
              Novidade
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-50">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>

          <Link
            href={ctaHref}
            onClick={dismiss}
            className="inline-flex items-center gap-1 mt-2.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            {ctaLabel}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Fechar */}
        <button
          onClick={dismiss}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 w-4" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * NavigationProgress — barra verde fina no topo + bolinha que aparecem
 * sempre que o pathname muda (troca de página).
 * Adicione <NavigationProgress /> no Providers ou layout raiz.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    // Mostra a barra
    setVisible(true);

    // Esconde após a animação de 3 s completar
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 2800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] pointer-events-none">
      {/* Barra de progresso */}
      <div className="relative h-[3px] w-full overflow-hidden">
        <div className="absolute top-0 left-0 h-full bg-brand-500 animate-nav-bar rounded-r-full" />
      </div>

      {/* Bolinha no final da barra */}
      <div
        className="absolute top-0 h-[3px] flex items-center"
        style={{ animation: 'nav-bar 3s ease-in-out forwards', right: 0 }}
      >
        <div className="size-2.5 rounded-full bg-brand-400 shadow-lg shadow-brand-500/60 -translate-y-[3px]" />
      </div>
    </div>
  );
}

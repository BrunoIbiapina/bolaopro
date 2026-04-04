'use client';

/**
 * PageLoader — overlay de tela cheia com bola de futebol rolando.
 * Usado em qualquer navegação que possa demorar: login Google, redirecionamentos, etc.
 */

interface PageLoaderProps {
  message?: string;
  submessage?: string;
}

export function PageLoader({
  message = 'Carregando...',
  submessage,
}: PageLoaderProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">

      {/* Área da bola rolando */}
      <div className="relative flex items-center justify-center w-24 h-24 mb-6">

        {/* Sombra no chão que pulsa conforme a bola rola */}
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-2 rounded-full bg-black/40"
          style={{
            animation: 'ball-roll 1.2s ease-in-out infinite',
            filter: 'blur(3px)',
          }}
        />

        {/* Bola ⚽ rolando */}
        <span
          className="text-5xl select-none"
          style={{ animation: 'ball-roll 1.2s ease-in-out infinite', display: 'inline-block' }}
        >
          ⚽
        </span>
      </div>

      {/* Textos */}
      <p className="text-lg font-bold text-white">{message}</p>
      {submessage && (
        <p className="text-sm text-gray-400 mt-1">{submessage}</p>
      )}

      {/* Pontinhos animados */}
      <div className="flex items-center gap-1.5 mt-5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-brand-500"
            style={{
              animation: `ball-spin 1s ease-in-out infinite`,
              animationDelay: `${i * 0.18}s`,
              display: 'inline-block',
            }}
          />
        ))}
      </div>
    </div>
  );
}

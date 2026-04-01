'use client';

import { useState, useEffect, useRef } from 'react';
import { X, CheckCheck, Link2, Share2, Trophy, Users, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MatchInfo {
  id: string;
  scheduledAt: string;
  status: string;
  homeTeam?: { name: string; code?: string; logo?: string | null } | null;
  awayTeam?: { name: string; code?: string; logo?: string | null } | null;
}

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  pool: {
    name: string;
    inviteCode: string;
    entryFee: number;
    maxParticipants: number;
    memberCount?: number;
    championship?: { name: string } | null;
    matches?: MatchInfo[];
  };
}

export function ShareModal({ open, onClose, pool }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/invite/${pool.inviteCode}`
      : `/invite/${pool.inviteCode}`;

  const whatsappText = [
    `⚽ *${pool.name}*`,
    pool.championship?.name ? `🏆 ${pool.championship.name}` : '',
    pool.entryFee > 0
      ? `💰 Entrada: ${formatCurrency(pool.entryFee)} por cota`
      : '🎉 Bolão gratuito!',
    `👥 Vagas: ${pool.memberCount ?? 0}/${pool.maxParticipants}`,
    '',
    'Entre pelo link e participe comigo:',
    inviteUrl,
  ]
    .filter(Boolean)
    .join('\n');

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = inviteUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const isFree = pool.entryFee === 0;
  const fillPct = Math.min(100, Math.round(((pool.memberCount ?? 0) / pool.maxParticipants) * 100));

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full max-w-sm bg-gray-900 rounded-3xl shadow-2xl border border-gray-700/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-brand-600/30 to-brand-900/40 border-b border-brand-500/20 px-6 pt-6 pb-5">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 size-8 flex items-center justify-center rounded-full bg-gray-800/60 hover:bg-gray-700/60 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg flex items-center justify-center shrink-0">
              <span className="text-2xl">⚽</span>
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Share2 className="size-3" /> Compartilhar
              </p>
              <h2 className="text-lg font-bold text-white leading-snug line-clamp-2">
                {pool.name}
              </h2>
              {pool.championship?.name && (
                <p className="text-xs text-brand-300 mt-1 flex items-center gap-1">
                  <Trophy className="size-3 shrink-0" />
                  {pool.championship.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="px-6 pt-4 pb-3 flex items-center gap-4 border-b border-gray-800">
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Entrada</p>
            <p className={`text-base font-bold ${isFree ? 'text-green-400' : 'text-brand-400'}`}>
              {isFree ? 'Grátis' : formatCurrency(pool.entryFee)}
            </p>
          </div>
          <div className="w-px h-8 bg-gray-800" />
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Participantes</p>
            <p className="text-base font-bold text-white flex items-center justify-center gap-1">
              <Users className="size-3.5 text-gray-400" />
              {pool.memberCount ?? 0}
              <span className="text-gray-500 text-sm font-normal">/{pool.maxParticipants}</span>
            </p>
          </div>
          <div className="w-px h-8 bg-gray-800" />
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Vagas</p>
            <p className={`text-base font-bold ${fillPct >= 90 ? 'text-orange-400' : fillPct >= 60 ? 'text-yellow-400' : 'text-green-400'}`}>
              {100 - fillPct}%
            </p>
          </div>
        </div>

        {/* Matches preview */}
        {pool.matches && pool.matches.length > 0 && (
          <div className="px-6 pt-4 pb-2 space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Partidas ({pool.matches.length})
            </p>
            <div className="rounded-xl border border-gray-700/40 overflow-hidden divide-y divide-gray-800/60">
              {pool.matches.slice(0, 4).map((match) => (
                <div key={match.id} className="flex items-center gap-2 px-3 py-2 bg-gray-800/30">
                  <span className="text-[10px] text-gray-500 shrink-0 w-14 text-center leading-tight">
                    {format(new Date(match.scheduledAt), "dd/MM\nHH:mm", { locale: ptBR })}
                  </span>
                  <div className="flex flex-1 items-center justify-center gap-1.5 min-w-0">
                    <div className="flex items-center gap-1 flex-1 justify-end min-w-0">
                      {match.homeTeam?.logo ? (
                        <img src={match.homeTeam.logo} alt="" className="size-4 object-contain shrink-0" />
                      ) : (
                        <span className="text-[9px] font-bold text-gray-400 shrink-0">{match.homeTeam?.code}</span>
                      )}
                      <span className="text-[11px] font-semibold text-gray-200 truncate text-right">{match.homeTeam?.name}</span>
                    </div>
                    <span className="text-gray-600 text-[10px] shrink-0">×</span>
                    <div className="flex items-center gap-1 flex-1 justify-start min-w-0">
                      <span className="text-[11px] font-semibold text-gray-200 truncate">{match.awayTeam?.name}</span>
                      {match.awayTeam?.logo ? (
                        <img src={match.awayTeam.logo} alt="" className="size-4 object-contain shrink-0" />
                      ) : (
                        <span className="text-[9px] font-bold text-gray-400 shrink-0">{match.awayTeam?.code}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {pool.matches.length > 4 && (
                <div className="px-3 py-1.5 bg-gray-800/20 text-center">
                  <span className="text-[10px] text-gray-500">+{pool.matches.length - 4} partidas</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Share actions */}
        <div className="px-6 py-5 space-y-3">

          {/* WhatsApp button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-base transition-colors shadow-lg shadow-green-900/30"
          >
            {/* WhatsApp SVG icon */}
            <svg viewBox="0 0 24 24" className="size-5 fill-white shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Compartilhar no WhatsApp
          </a>

          {/* Copy link */}
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl border font-semibold text-sm transition-all ${
              copied
                ? 'border-green-500/50 bg-green-500/10 text-green-400'
                : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white'
            }`}
          >
            {copied ? (
              <><CheckCheck className="size-4" /> Link copiado!</>
            ) : (
              <><Link2 className="size-4" /> Copiar link de convite</>
            )}
          </button>

          {/* Link preview */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/40 border border-gray-700/40">
            <Link2 className="size-3.5 text-gray-500 shrink-0" />
            <p className="text-xs text-gray-500 truncate flex-1">{inviteUrl}</p>
          </div>
        </div>

        {/* Branding */}
        <div className="text-center pb-5 -mt-2">
          <p className="text-xs text-gray-600">
            Powered by <span className="text-brand-500 font-semibold">Bolão Pro</span>
          </p>
        </div>
      </div>
    </div>
  );
}

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Convite para Bolão';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default async function Image({ params }: { params: { code: string } }) {
  let pool: any = null;

  try {
    const res = await fetch(`${API_URL}/pools/invite/${params.code}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const json = await res.json();
      pool = json.data ?? json;
    }
  } catch {}

  const name = pool?.name ?? 'Bolão';
  const championship = pool?.championship?.name ?? 'Bolão Pro';
  const entryFee = pool?.entryFee > 0
    ? `R$ ${Number(pool.entryFee).toFixed(2)}`
    : 'Gratuito';
  const members = pool ? `${pool.memberCount ?? 0}/${pool.maxParticipants}` : '—';
  const code = params.code;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          fontFamily: 'sans-serif',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Background decorativo */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px',
          }}>
            ⚽
          </div>
          <span style={{ color: '#a5b4fc', fontSize: '20px', fontWeight: '600', letterSpacing: '2px' }}>
            BOLÃO PRO
          </span>
        </div>

        {/* Título principal */}
        <div style={{
          fontSize: name.length > 25 ? '52px' : '64px',
          fontWeight: '800',
          color: '#f8fafc',
          lineHeight: '1.1',
          marginBottom: '16px',
          display: 'flex',
        }}>
          {name}
        </div>

        {/* Campeonato */}
        <div style={{
          fontSize: '26px',
          color: '#94a3b8',
          marginBottom: '48px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          🏆 {championship}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '48px' }}>
          {[
            { label: 'ENTRADA', value: entryFee, color: '#34d399' },
            { label: 'PARTICIPANTES', value: members, color: '#60a5fa' },
            { label: 'CÓDIGO', value: code, color: '#a78bfa' },
          ].map((stat) => (
            <div key={stat.label} style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', letterSpacing: '1.5px' }}>
                {stat.label}
              </span>
              <span style={{ fontSize: '30px', fontWeight: '800', color: stat.color }}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          borderRadius: '16px',
          padding: '20px 32px',
          width: 'fit-content',
        }}>
          <span style={{ color: 'white', fontSize: '22px', fontWeight: '700' }}>
            Entrar no bolão agora →
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}

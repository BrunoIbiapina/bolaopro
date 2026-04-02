import { Metadata } from 'next';
import InvitePageClient from './InvitePageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface Props {
  params: { code: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/pools/invite/${params.code}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error('Pool not found');

    const pool = await res.json();
    const data = pool.data ?? pool;

    const title = `${data.name} — Bolão Pro`;
    const entryFee = data.entryFee > 0 ? `R$ ${Number(data.entryFee).toFixed(2)}` : 'Gratuito';
    const spots = `${data.memberCount ?? 0}/${data.maxParticipants} participantes`;
    const description = `${data.championship?.name ?? 'Bolão'} · Entrada: ${entryFee} · ${spots}. Entre agora!`;
    const ogImageUrl = `${FRONTEND_URL}/invite/${params.code}/opengraph-image`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${FRONTEND_URL}/invite/${params.code}`,
        siteName: 'Bolão Pro',
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return {
      title: 'Convite para Bolão — Bolão Pro',
      description: 'Você foi convidado para participar de um bolão no Bolão Pro!',
    };
  }
}

export default function InvitePage() {
  return <InvitePageClient />;
}

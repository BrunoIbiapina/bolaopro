/**
 * Script para criar a causa "Eleições Presidenciais 2026" como Em Breve (SCHEDULED + featured)
 * Uso: cd server && npx ts-node prisma/seed-eleicoes.ts
 */

import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  // Pegar o primeiro admin do sistema
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, fullName: true, email: true },
  });

  if (!admin) {
    console.error('❌  Nenhum usuário ADMIN encontrado. Crie um admin primeiro.');
    process.exit(1);
  }

  console.log(`✅  Admin encontrado: ${admin.fullName} (${admin.email})`);

  // Verificar se já existe
  const existing = await prisma.causa.findFirst({
    where: { title: { contains: 'Eleições Presidenciais 2026' } },
  });

  if (existing) {
    console.log(`⚠️   Causa já existe: ${existing.id} — status: ${existing.status}`);
    console.log('    Para recriar, delete a causa existente primeiro.');
    process.exit(0);
  }

  const causa = await prisma.causa.create({
    data: {
      title:       'Presidenciáveis 2026 — Quem leva?',
      description: 'A maior disputa do país está chegando. Quem você acha que vai cravar o cargo de presidente do Brasil nas Eleições 2026? Registre sua previsão e acompanhe o que o pessoal está achando.',
      category:    'POLITICA',
      type:        'CHOICE',
      status:      'SCHEDULED' as any,
      visibility:  'PUBLIC',
      inviteCode:  nanoid(8),
      deadlineAt:  new Date('2026-10-04T22:00:00-03:00'), // Dia da eleição (1º turno)
      entryFee:    0,
      cotasPerParticipant: 1,
      isFeatured:  true,
      hideVoteCount: false,
      allowComments: true,
      numericMatchMode: 'CLOSEST',
      creatorId:   admin.id,
      options: {
        create: [
          { label: 'Lula (PT)',               order: 0 },
          { label: 'Bolsonaro (PL)',           order: 1 },
          { label: 'Tarcísio de Freitas',      order: 2 },
          { label: 'Outro / 2º turno',         order: 3 },
        ],
      },
    },
    include: {
      options: true,
      creator: { select: { fullName: true } },
    },
  });

  console.log('\n🗳️  Causa criada com sucesso!');
  console.log(`   ID:       ${causa.id}`);
  console.log(`   Título:   ${causa.title}`);
  console.log(`   Status:   ${causa.status}  (Em Breve — fixada no topo)`);
  console.log(`   Criador:  ${causa.creator.fullName}`);
  console.log(`   Opções:   ${causa.options.map((o) => o.label).join(' | ')}`);
  console.log(`\n   Acesse:  /causas/${causa.id}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

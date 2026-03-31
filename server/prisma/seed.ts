import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  const passwordHash = await bcrypt.hash('Admin@2026', 10);

  // =============================================
  // 1. USUÁRIOS
  // =============================================
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bolaopro.com.br' },
    update: {},
    create: {
      email: 'admin@bolaopro.com.br',
      password: passwordHash,
      fullName: 'Administrador',
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✅ Admin criado:', admin.email);

  const bruno = await prisma.user.upsert({
    where: { email: 'bruno@bolaopro.com.br' },
    update: {},
    create: {
      email: 'bruno@bolaopro.com.br',
      password: passwordHash,
      fullName: 'Bruno Ibiapina',
      role: 'USER',
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✅ Usuário criado:', bruno.email);

  const maria = await prisma.user.upsert({
    where: { email: 'maria@exemplo.com' },
    update: {},
    create: {
      email: 'maria@exemplo.com',
      password: passwordHash,
      fullName: 'Maria Silva',
      role: 'USER',
      emailVerifiedAt: new Date(),
    },
  });

  const joao = await prisma.user.upsert({
    where: { email: 'joao@exemplo.com' },
    update: {},
    create: {
      email: 'joao@exemplo.com',
      password: passwordHash,
      fullName: 'João Santos',
      role: 'USER',
      emailVerifiedAt: new Date(),
    },
  });

  const ana = await prisma.user.upsert({
    where: { email: 'ana@exemplo.com' },
    update: {},
    create: {
      email: 'ana@exemplo.com',
      password: passwordHash,
      fullName: 'Ana Oliveira',
      role: 'USER',
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✅ 3 participantes criados');

  // =============================================
  // 2. TIMES
  // =============================================
  const teams = await Promise.all([
    prisma.team.upsert({
      where: { code: 'FLA' },
      update: {},
      create: { name: 'Flamengo', code: 'FLA', country: 'Brasil' },
    }),
    prisma.team.upsert({
      where: { code: 'PAL' },
      update: {},
      create: { name: 'Palmeiras', code: 'PAL', country: 'Brasil' },
    }),
    prisma.team.upsert({
      where: { code: 'COR' },
      update: {},
      create: { name: 'Corinthians', code: 'COR', country: 'Brasil' },
    }),
    prisma.team.upsert({
      where: { code: 'SAO' },
      update: {},
      create: { name: 'São Paulo', code: 'SAO', country: 'Brasil' },
    }),
    prisma.team.upsert({
      where: { code: 'GRE' },
      update: {},
      create: { name: 'Grêmio', code: 'GRE', country: 'Brasil' },
    }),
    prisma.team.upsert({
      where: { code: 'INT' },
      update: {},
      create: { name: 'Internacional', code: 'INT', country: 'Brasil' },
    }),
    prisma.team.upsert({
      where: { code: 'FLU' },
      update: {},
      create: { name: 'Fluminense', code: 'FLU', country: 'Brasil' },
    }),
    prisma.team.upsert({
      where: { code: 'BOT' },
      update: {},
      create: { name: 'Botafogo', code: 'BOT', country: 'Brasil' },
    }),
  ]);
  const [flamengo, palmeiras, corinthians, saoPaulo, gremio, inter, fluminense, botafogo] = teams;
  console.log('✅ 8 times criados');

  // =============================================
  // 3. CAMPEONATO
  // =============================================
  const brasileirao = await prisma.championship.upsert({
    where: { code: 'BRASILEIRAO-2026' },
    update: {},
    create: {
      name: 'Brasileirão Série A 2026',
      code: 'BRASILEIRAO-2026',
      description: 'Campeonato Brasileiro Série A - Temporada 2026',
      startDate: new Date('2026-04-12'),
      endDate: new Date('2026-12-07'),
    },
  });
  console.log('✅ Campeonato criado:', brasileirao.name);

  // =============================================
  // 4. PARTIDAS (Rodada 1)
  // =============================================
  // Use dates in the future for testing
  const round1Date = new Date('2026-04-12T16:00:00-03:00');
  const round1Date2 = new Date('2026-04-12T18:30:00-03:00');
  const round1Date3 = new Date('2026-04-12T20:00:00-03:00');
  const round1Date4 = new Date('2026-04-12T20:00:00-03:00');

  const matches = await Promise.all([
    prisma.match.create({
      data: {
        championshipId: brasileirao.id,
        homeTeamId: flamengo.id,
        awayTeamId: palmeiras.id,
        scheduledAt: round1Date,
        roundId: 'rodada-1',
      },
    }),
    prisma.match.create({
      data: {
        championshipId: brasileirao.id,
        homeTeamId: corinthians.id,
        awayTeamId: saoPaulo.id,
        scheduledAt: round1Date2,
        roundId: 'rodada-1',
      },
    }),
    prisma.match.create({
      data: {
        championshipId: brasileirao.id,
        homeTeamId: gremio.id,
        awayTeamId: inter.id,
        scheduledAt: round1Date3,
        roundId: 'rodada-1',
      },
    }),
    prisma.match.create({
      data: {
        championshipId: brasileirao.id,
        homeTeamId: fluminense.id,
        awayTeamId: botafogo.id,
        scheduledAt: round1Date4,
        roundId: 'rodada-1',
      },
    }),
  ]);
  console.log('✅ 4 partidas da Rodada 1 criadas');

  // =============================================
  // 5. BOLÃO
  // =============================================
  const pool = await prisma.pool.create({
    data: {
      name: 'Bolão dos Amigos - Brasileirão 2026',
      description: 'Bolão entre amigos para o Brasileirão 2026. Placar exato: 10pts, Vencedor: 3pts, Empate: 2pts.',
      organizerId: bruno.id,
      championshipId: brasileirao.id,
      inviteCode: 'AMIGOS26',
      entryFee: 50.0,
      maxParticipants: 20,
      status: 'OPEN',
      rules: JSON.stringify({
        exactScorePoints: 10,
        correctWinnerPoints: 3,
        correctDrawPoints: 2,
        knockoutBonusPoints: 5,
        lockMinutesBefore: 0,
      }),
    },
  });
  console.log('✅ Bolão criado:', pool.name);

  // =============================================
  // 6. MEMBROS DO BOLÃO
  // =============================================
  await Promise.all([
    prisma.poolMember.create({
      data: { poolId: pool.id, userId: bruno.id, status: 'CONFIRMED' },
    }),
    prisma.poolMember.create({
      data: { poolId: pool.id, userId: maria.id, status: 'CONFIRMED' },
    }),
    prisma.poolMember.create({
      data: { poolId: pool.id, userId: joao.id, status: 'CONFIRMED' },
    }),
    prisma.poolMember.create({
      data: { poolId: pool.id, userId: ana.id, status: 'PENDING' },
    }),
  ]);
  console.log('✅ 4 membros adicionados ao bolão');

  // =============================================
  // 7. PAGAMENTOS
  // =============================================
  await Promise.all([
    prisma.payment.create({
      data: {
        poolId: pool.id,
        userId: bruno.id,
        amount: 50.0,
        status: 'PAID',
        paidAt: new Date(),
      },
    }),
    prisma.payment.create({
      data: {
        poolId: pool.id,
        userId: maria.id,
        amount: 50.0,
        status: 'PAID',
        paidAt: new Date(),
      },
    }),
    prisma.payment.create({
      data: {
        poolId: pool.id,
        userId: joao.id,
        amount: 50.0,
        status: 'PAID',
        paidAt: new Date(),
      },
    }),
    prisma.payment.create({
      data: {
        poolId: pool.id,
        userId: ana.id,
        amount: 50.0,
        status: 'PENDING',
      },
    }),
  ]);
  console.log('✅ 4 pagamentos criados (3 pagos, 1 pendente)');

  // =============================================
  // 8. PALPITES (Bruno e Maria para Rodada 1)
  // =============================================
  await Promise.all([
    // Bruno: Flamengo 2x1 Palmeiras
    prisma.prediction.create({
      data: {
        poolId: pool.id,
        userId: bruno.id,
        matchId: matches[0].id,
        homeScore: 2,
        awayScore: 1,
      },
    }),
    // Bruno: Corinthians 1x1 São Paulo
    prisma.prediction.create({
      data: {
        poolId: pool.id,
        userId: bruno.id,
        matchId: matches[1].id,
        homeScore: 1,
        awayScore: 1,
      },
    }),
    // Maria: Flamengo 1x0 Palmeiras
    prisma.prediction.create({
      data: {
        poolId: pool.id,
        userId: maria.id,
        matchId: matches[0].id,
        homeScore: 1,
        awayScore: 0,
      },
    }),
    // Maria: Corinthians 0x2 São Paulo
    prisma.prediction.create({
      data: {
        poolId: pool.id,
        userId: maria.id,
        matchId: matches[1].id,
        homeScore: 0,
        awayScore: 2,
      },
    }),
  ]);
  console.log('✅ 4 palpites criados');

  // =============================================
  // 9. NOTIFICAÇÕES
  // =============================================
  await prisma.notification.create({
    data: {
      userId: bruno.id,
      poolId: pool.id,
      title: 'Bolão criado com sucesso!',
      message: 'Seu bolão "Bolão dos Amigos - Brasileirão 2026" está aberto para inscrições.',
      type: 'POOL_CREATED',
    },
  });
  await prisma.notification.create({
    data: {
      userId: maria.id,
      poolId: pool.id,
      title: 'Convite para bolão',
      message: 'Você foi convidado para o "Bolão dos Amigos - Brasileirão 2026".',
      type: 'POOL_INVITE',
    },
  });
  console.log('✅ Notificações criadas');

  // =============================================
  // RESUMO
  // =============================================
  console.log('\n========================================');
  console.log('🎉 Seed concluído com sucesso!');
  console.log('========================================');
  console.log('👤 Admin: admin@bolaopro.com.br');
  console.log('👤 Organizador: bruno@bolaopro.com.br');
  console.log('👤 Participantes: maria, joao, ana');
  console.log('⚽ Times: 8 times brasileiros');
  console.log('🏆 Campeonato: Brasileirão 2026');
  console.log('🎯 Bolão: Bolão dos Amigos (código: AMIGOS26)');
  console.log('📋 Partidas: 4 jogos da Rodada 1');
  console.log('💰 Pagamentos: 3 pagos + 1 pendente');
  console.log('🔮 Palpites: 4 registrados');
  console.log('🔑 Senha de todos: Admin@2026');
  console.log('========================================\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

# 🗳️ Módulo Causas — Documento de Estrutura Completo

> **Status:** ✅ Decisões confirmadas — Pronto para implementação
> **Data:** 2026-04-01
> **Autor:** Bruno (Bolão Pro)

---

## 0. Decisões de Produto Confirmadas

| # | Questão | Decisão |
|---|---------|---------|
| 1 | **Taxa de entrada** | Por cota (igual aos bolões) — usuário pode comprar N cotas por causa |
| 2 | **Mobile nav** | 6 itens — Causas entra sem remover nenhum |
| 3 | **Criador vota na própria causa?** | Não diretamente — mas ao publicar, sistema pergunta "Deseja participar?" (igual ao fluxo de bolões) |
| 4 | **Sem acertador (NUMERIC exato)** | 100% fica para o sistema (10% taxa normal + 90% "prêmio por dificuldade") |
| 5 | **Modelo de receita da plataforma** | 10% fixo sobre prize pool em toda causa com taxa — ver seção 4.6 |

---

## 1. Visão do Produto

### O que é?

**Causas** é um sistema de previsões abertas dentro do Bolão Pro. Qualquer usuário pode criar uma **"causa"** — uma pergunta sobre qualquer evento real — e outros usuários votam em qual resultado acreditam que vai acontecer.

Exemplos reais do cotidiano:
- "Quem vai ganhar a eleição para governador de SP? → Candidato A / Candidato B"
- "Vai chover hoje à noite em Curitiba? → Sim / Não"
- "Qual time vai ser campeão do Brasileirão 2026? → 8 opções"
- "Quantos gols o Flamengo vai fazer no clássico? → número exato"
- "Brasil vai se classificar para a Copa? → Sim / Não"

### Diferença dos Bolões Esportivos

| Bolões | Causas |
|--------|--------|
| Vinculado a campeonato/partidas | Qualquer tema (política, clima, cultura...) |
| Admin cria, usuários entram | Qualquer usuário cria |
| Resultado vem de API esportiva | Resultado resolvido manualmente pelo criador |
| Score exato do jogo | Múltipla escolha, Sim/Não ou Numérico |
| Privado por padrão | Público por padrão (opcional privado) |

### Por que faz sentido no Bolão Pro?

Aumenta o engajamento fora do calendário esportivo. Usuários que já usam o app para bolões passam a usar também para apostas entre amigos sobre qualquer assunto — eleição, BBB, clima, negócios. Mantém o usuário ativo no app 7 dias por semana.

---

## 2. Conceitos e Entidades

### 2.1 Causa
A entidade principal. Uma pergunta/evento com prazo e opções de resposta.

**Campos:**
- `id`, `title`, `description?`
- `category` — enum: POLITICA, ESPORTE, CLIMA, ENTRETENIMENTO, NEGOCIOS, CULTURA, OUTROS
- `type` — enum: BINARY, CHOICE, NUMERIC
- `status` — enum: DRAFT, OPEN, CLOSED, RESOLVED, CANCELLED
- `visibility` — enum: PUBLIC, PRIVATE
- `inviteCode` — código único para causas privadas
- `deadlineAt` — data/hora de encerramento das votações
- `resolvesAt` — data/hora prevista do resultado (informativo)
- `creatorId` — usuário que criou
- `resolvedOptionId?` — opção vencedora (após resolução)
- `resolvedNumericValue?` — valor numérico vencedor (tipo NUMERIC)
- `resolvedAt?` — quando foi resolvida
- `resolvedBy?` — quem resolveu (criador ou admin)
- `entryFee` — valor por cota (0 = gratuito)
- `cotasPerParticipant` — máximo de cotas por participante (default: 1)
- `prizePool` — total arrecadado **já líquido** (após separar taxa da plataforma)
- `platformFeePercent` — % da plataforma (default: 10)
- `platformFeeAmount` — valor bruto separado para o sistema (registrado para auditoria)
- `maxVoters?` — limite de participantes (opcional)
- `allowComments` — habilitar comentários
- `imageUrl?` — imagem ilustrativa da causa

### 2.2 CausaOption
As opções de resposta de uma causa BINARY ou CHOICE.

**Campos:**
- `id`, `causaId`, `label` (ex: "Candidato A"), `emoji?` (ex: "🗳️"), `order`
- Para BINARY: gerado automaticamente ("Sim" e "Não")
- Para CHOICE: até 8 opções definidas pelo criador
- Para NUMERIC: não existe — usuário digita um número

### 2.3 CausaVote
O voto de um usuário em uma causa.

**Campos:**
- `id`, `causaId`, `userId`
- `optionId?` — para BINARY/CHOICE
- `numericValue?` — para NUMERIC (ex: 3 gols)
- `numCotas` — quantidade de cotas compradas (default: 1, máx: `cotasPerParticipant`)
- `amount` — valor total pago (`entryFee × numCotas`)
- `isCorrect?` — preenchido após resolução
- `prizeAmount?` — prêmio recebido (preenchido após resolução com acertadores)
- `paidAt?` — data do pagamento do prêmio
- `createdAt`, `updatedAt` (permite alterar voto/cotas antes do deadline)

### 2.4 CausaComment *(fase 2)*
Comentários na causa para discussão entre participantes.

---

## 3. Tipos de Causa

### BINARY (Sim/Não)
```
Vai chover hoje à noite? → [Sim] [Não]
```
- Criador define só a pergunta
- Sistema cria opções "Sim" e "Não" automaticamente
- Mais simples, mais rápido de criar

### CHOICE (Múltipla Escolha)
```
Quem vai ganhar o Brasileirão? → [Flamengo] [Palmeiras] [Grêmio] [Corinthians] ...
```
- Criador define 2 a 8 opções
- Cada opção pode ter emoji e label
- Resultado: uma das opções é declarada vencedora

### NUMERIC (Valor Numérico)
```
Quantos gols no clássico? → [___ gols]
```
- Criador define a pergunta e unidade (gols, pontos, %, votos...)
- Usuário digita um número inteiro (ou decimal, configurável)
- Resultado: quem acertou o número exato OU mais próximo (configurável)
- Modo "exato": só ganha quem acertou o número certo
- Modo "mais próximo": ganha quem chegou mais perto

---

## 4. Regras de Negócio

### 4.1 Criação
- Qualquer usuário autenticado pode criar uma causa
- DRAFT: salvo mas não publicado (visível só pro criador)
- OPEN: publicado e aceitando votos
- Prazo mínimo de 1 hora para deadline
- Prazo máximo de 365 dias para deadline
- Causa pública: aparece no feed global de causas
- Causa privada: só acessível via inviteCode ou link de convite

### 4.2 Votação
- Cada usuário vota **uma vez** por causa
- Voto pode ser **alterado** enquanto a causa estiver OPEN e antes do deadline
- Após deadline ou status CLOSED: votos bloqueados
- Causa com `entryFee > 0`: usuário paga para votar (via PIX, integração com módulo de pagamentos)
- Causa gratuita: voto imediato sem pagamento

### 4.3 Encerramento
- Sistema fecha votação automaticamente quando `deadlineAt` passa (via cron job)
- Status muda de OPEN → CLOSED automaticamente
- Criador pode fechar manualmente a qualquer momento
- Admin pode fechar/cancelar qualquer causa

### 4.4 Resolução
- Só o **criador** ou um **ADMIN** pode resolver uma causa
- Resolução define a opção vencedora (ou valor numérico)
- Sistema marca automaticamente `isCorrect = true` nos votos corretos
- Se `entryFee > 0`: distribui prêmio entre os acertadores (igual ao módulo de pools)
- Causa RESOLVED é imutável — resultado não pode ser alterado
- Causa pode ser CANCELLED: sem resolução, sem vencedor, entryFee devolvido

### 4.5 Sistema de Cotas (causas com taxa)
Igual ao módulo de bolões — participante pode comprar mais de uma cota para aumentar o peso do seu voto no prêmio.

- `entryFee` = valor por cota (ex: R$ 10,00)
- `cotasPerParticipant` = máximo de cotas por pessoa (definido pelo criador, ex: 3)
- `amount` do voto = `entryFee × numCotas`
- Mais cotas = maior fatia proporcional do prêmio se acertar

**Exemplo:**
```
Causa: "Quem ganha o Brasileirão?" — R$ 10/cota, máx 3 cotas
Prize pool bruto: R$ 500,00

Taxa plataforma (10%):  R$  50,00  → vai para o sistema
Prize pool líquido:     R$ 450,00  → para os acertadores

Acertadores:
  Maria    — 3 cotas → recebe R$ 450 × (3/5) = R$ 270,00
  João     — 2 cotas → recebe R$ 450 × (2/5) = R$ 180,00
```

### 4.6 Modelo de Receita da Plataforma ✅ CONFIRMADO

**Regra universal:** A plataforma sempre retém **10% do prize pool bruto** de toda causa com taxa, independente do resultado.

| Cenário | Destino do prize pool |
|---------|----------------------|
| Com acertadores | 10% sistema + 90% dividido proporcionalmente pelas cotas dos acertadores |
| Sem acertadores (NUMERIC exato) | 10% taxa normal + 90% bônus = **100% para o sistema** |
| Causa CANCELLED | 100% devolvido aos participantes (0% para sistema) |
| Causa gratuita | Sem prize pool, sem taxa |

**Lógica no código (`causas-resolution.service.ts`):**
```typescript
const grossPool = votes.reduce((sum, v) => sum + v.amount, 0)
const platformFee = grossPool * (causa.platformFeePercent / 100) // ex: 10%
const netPool = grossPool - platformFee

const winners = votes.filter(v => v.isCorrect)

if (winners.length === 0) {
  // Sem acertadores: tudo para o sistema
  await this.systemRevenue.record(causa.id, grossPool, 'NO_WINNER')
} else {
  // Distribui proporcionalmente pelas cotas
  const totalWinnerCotas = winners.reduce((sum, v) => sum + v.numCotas, 0)
  for (const winner of winners) {
    const prize = netPool * (winner.numCotas / totalWinnerCotas)
    await this.payPrize(winner.userId, prize, causa.id)
  }
  await this.systemRevenue.record(causa.id, platformFee, 'PLATFORM_FEE')
}
```

**Por que 10%?** É o ponto de equilíbrio entre atratividade para o usuário e sustentabilidade. Plataformas similares cobram entre 5% e 20%.

### 4.7 Criador Participando da Própria Causa ✅ CONFIRMADO
Ao publicar uma causa (DRAFT → OPEN), o sistema exibe modal:

```
"Deseja participar da sua própria causa?
 [Sim, quero participar] [Não, apenas criar]"
```

- Se aceitar → redirecionado para o fluxo de voto normal
- Criador vota com as mesmas regras dos outros participantes
- Resultado: sem conflito de interesse pois o criador não resolve sem auditoria (admin pode sempre revisar)

### 4.8 Visibilidade do Resultado

- Contagem de votos por opção: visível para todos ANTES do deadline (sem revelar quem votou em quê)
- Ou: ocultar contagem até o deadline (modo "surpresa") — opção do criador
- Após resolução: resultado público com placar completo e ranking de acertadores

---

## 5. Status da Causa — Fluxo de Estados

```
                  ┌──────────┐
                  │  DRAFT   │  (rascunho, só criador vê)
                  └────┬─────┘
                       │ publica
                  ┌────▼─────┐
         ┌────────│   OPEN   │──────────────┐
         │        └────┬─────┘              │
         │             │ deadline passa      │ criador cancela
         │        ┌────▼─────┐         ┌────▼──────┐
         │        │  CLOSED  │         │ CANCELLED │
         │        └────┬─────┘         └───────────┘
         │             │ criador/admin resolve
         │        ┌────▼──────┐
         └────────│ RESOLVED  │
                  └───────────┘
```

---

## 6. Modelo de Banco de Dados (Prisma)

```prisma
// ─── Enums ───────────────────────────────────────────────────

enum CausaCategory {
  POLITICA
  ESPORTE
  CLIMA
  ENTRETENIMENTO
  NEGOCIOS
  CULTURA
  OUTROS
}

enum CausaType {
  BINARY    // Sim / Não
  CHOICE    // múltipla escolha (2-8 opções)
  NUMERIC   // valor numérico
}

enum CausaStatus {
  DRAFT
  OPEN
  CLOSED
  RESOLVED
  CANCELLED
}

enum CausaVisibility {
  PUBLIC
  PRIVATE
}

enum NumericMatchMode {
  EXACT      // apenas acerto exato ganha
  CLOSEST    // quem chegou mais perto ganha
}

// ─── Modelos ─────────────────────────────────────────────────

model Causa {
  id                   String          @id @default(cuid())
  title                String
  description          String?
  imageUrl             String?
  category             CausaCategory   @default(OUTROS)
  type                 CausaType
  status               CausaStatus     @default(DRAFT)
  visibility           CausaVisibility @default(PUBLIC)
  inviteCode           String          @unique @default(cuid())
  deadlineAt           DateTime
  resolvesAt           DateTime?
  creatorId            String
  creator              User            @relation("causaCreator", fields: [creatorId], references: [id], onDelete: Cascade)
  resolvedOptionId     String?
  resolvedOption       CausaOption?    @relation("resolvedOption", fields: [resolvedOptionId], references: [id])
  resolvedNumericValue Float?
  resolvedAt           DateTime?
  resolvedBy           String?
  entryFee             Float           @default(0)
  cotasPerParticipant  Int             @default(1)
  prizePool            Float           @default(0)    // líquido (sem taxa plataforma)
  platformFeePercent   Float           @default(10)   // % da plataforma
  platformFeeAmount    Float           @default(0)    // R$ separado para sistema
  maxVoters            Int?
  hideVoteCount        Boolean         @default(false) // modo surpresa
  allowComments        Boolean         @default(true)
  numericUnit          String?         // ex: "gols", "%", "pontos"
  numericMatchMode     NumericMatchMode @default(CLOSEST)
  createdAt            DateTime        @default(now())
  updatedAt            DateTime        @updatedAt

  options    CausaOption[]
  votes      CausaVote[]

  @@index([creatorId])
  @@index([status])
  @@index([category])
  @@index([deadlineAt])
  @@index([inviteCode])
  @@index([visibility, status])
}

model CausaOption {
  id        String   @id @default(cuid())
  causaId   String
  causa     Causa    @relation(fields: [causaId], references: [id], onDelete: Cascade)
  label     String
  emoji     String?
  order     Int      @default(0)
  createdAt DateTime @default(now())

  votes           CausaVote[]
  resolvedCausas  Causa[]     @relation("resolvedOption")

  @@index([causaId])
}

model CausaVote {
  id           String   @id @default(cuid())
  causaId      String
  causa        Causa    @relation(fields: [causaId], references: [id], onDelete: Cascade)
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  optionId     String?
  option       CausaOption? @relation(fields: [optionId], references: [id])
  numericValue Float?
  numCotas     Int      @default(1)   // cotas compradas
  amount       Float    @default(0)   // entryFee × numCotas
  isCorrect    Boolean?               // null = pendente, true/false após resolução
  prizeAmount  Float?                 // prêmio recebido (proporcional às cotas)
  paidAt       DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([causaId, userId])
  @@index([causaId])
  @@index([userId])
  @@index([isCorrect])
}
```

**Relacionamentos a adicionar no model `User`:**
```prisma
causasCreated  Causa[]      @relation("causaCreator")
causaVotes     CausaVote[]
```

---

## 7. Arquitetura Backend (NestJS)

### 7.1 Estrutura de Módulo

```
server/src/modules/causas/
├── causas.module.ts
├── causas.controller.ts          # endpoints autenticados
├── causas-public.controller.ts   # endpoints públicos (feed)
├── causas.service.ts
├── causas-votes.service.ts       # lógica de votos
├── causas-resolution.service.ts  # lógica de resolução e prêmios
├── causas.scheduler.ts           # cron para fechar causas no deadline
└── dto/
    ├── create-causa.dto.ts
    ├── update-causa.dto.ts
    ├── vote-causa.dto.ts
    └── resolve-causa.dto.ts
```

### 7.2 Endpoints da API

#### Públicos (sem autenticação)
```
GET  /causas                     # feed público (paginado, filtros)
GET  /causas/:id                 # detalhes de uma causa pública
GET  /causas/invite/:code        # buscar causa por código de convite
```

#### Autenticados (Bearer token)
```
# Causas
POST   /causas                   # criar nova causa
GET    /causas/my                # minhas causas (criadas + votadas)
PATCH  /causas/:id               # editar causa (só DRAFT ou antes do deadline)
DELETE /causas/:id               # cancelar causa (DRAFT/OPEN → CANCELLED)
POST   /causas/:id/publish       # DRAFT → OPEN
POST   /causas/:id/close         # OPEN → CLOSED (encerrar manualmente)
POST   /causas/:id/resolve       # CLOSED/OPEN → RESOLVED (com resultado)

# Votos
POST   /causas/:id/vote          # votar / alterar voto
DELETE /causas/:id/vote          # retirar voto (antes do deadline)
GET    /causas/:id/votes         # ver votos (resumo por opção)
GET    /causas/:id/leaderboard   # ranking de acertadores (após resolução)
GET    /causas/:id/my-vote       # ver meu voto atual
```

#### Admin
```
GET    /admin/causas             # todas as causas
PATCH  /admin/causas/:id/cancel  # cancelar qualquer causa
POST   /admin/causas/:id/resolve # resolver como admin
```

### 7.3 Query Filters para o Feed Público
```
GET /causas?page=1&limit=20
  &category=POLITICA
  &type=BINARY
  &status=OPEN
  &search=eleição
  &sortBy=deadline|popular|newest
```

### 7.4 Cron Job — Auto-fechamento
```typescript
// causas.scheduler.ts
@Cron('*/5 * * * *') // a cada 5 minutos
async closeExpiredCausas() {
  await this.prisma.causa.updateMany({
    where: { status: 'OPEN', deadlineAt: { lte: new Date() } },
    data: { status: 'CLOSED' }
  })
}
```

---

## 8. Arquitetura Frontend (Next.js)

### 8.1 Estrutura de Páginas

```
web/src/app/(dashboard)/causas/
├── page.tsx                    # Feed de causas (lista pública + filtros)
├── new/
│   └── page.tsx                # Criar nova causa (wizard multi-step)
├── [causaId]/
│   ├── page.tsx                # Detalhes + votação
│   └── resolve/
│       └── page.tsx            # Página de resolução (criador/admin)
└── my/
    └── page.tsx                # Minhas causas (criadas + votadas)
```

### 8.2 Componentes Principais

```
web/src/components/causas/
├── causa-card.tsx              # Card do feed (título, opções, prazo, contagem)
├── causa-vote-form.tsx         # Formulário de votação (binary/choice/numeric)
├── causa-result-banner.tsx     # Banner de resultado após resolução
├── causa-options-bar.tsx       # Barra de progresso por opção (%)
├── causa-countdown.tsx         # Contador regressivo até deadline
├── causa-leaderboard.tsx       # Ranking de acertadores
├── causa-category-badge.tsx    # Badge colorido por categoria
├── causa-status-badge.tsx      # Badge de status (aberta, encerrada...)
└── causa-filters.tsx           # Filtros do feed
```

### 8.3 Hooks

```
web/src/hooks/
└── use-causas.ts
    ├── useCausasFeed(filters)       # feed público com paginação
    ├── useCausa(id)                 # detalhes de uma causa
    ├── useMyCausas()                # causas do usuário logado
    ├── useMyVote(causaId)           # meu voto atual
    ├── useCausaVotes(causaId)       # contagem de votos por opção
    ├── useCausaLeaderboard(causaId) # ranking
    ├── useVoteCausa()               # mutation: votar
    ├── useCreateCausa()             # mutation: criar
    └── useResolveCausa()            # mutation: resolver
```

---

## 9. UX — Fluxos de Tela

### 9.1 Feed de Causas (`/causas`)

```
┌─────────────────────────────────────────┐
│  🗳️ Causas                    [+ Criar] │
│                                          │
│  [Todas] [Política] [Esporte] [Clima]   │
│  [Abertas ▼]  [Popular ▼]               │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ 🗳️ POLÍTICA          ⏱ 2h 30m   │    │
│  │ Quem vai ganhar a eleição de SP? │    │
│  │ ████████░░ Candidato A  63%      │    │
│  │ ██░░░░░░░░ Candidato B  37%      │    │
│  │ 847 votos · Gratuito             │    │
│  │                    [Votar →]     │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │ 🌧️ CLIMA             ⏱ 8h       │    │
│  │ Vai chover em Curitiba hoje?     │    │
│  │ ██████░░░░ Sim        58%        │    │
│  │ ████░░░░░░ Não        42%        │    │
│  │ 231 votos · Gratuito             │    │
│  │                    [✓ Votei]     │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 9.2 Criar Causa — Wizard 3 passos

**Passo 1 — Básico**
```
Título da causa *
[Quem vai ganhar a eleição para governador...    ]

Descrição (opcional)
[Eleição 1º turno, 2026...                       ]

Categoria *
[🗳️ Política ▼]

Imagem (opcional)
[📷 Adicionar imagem]
```

**Passo 2 — Tipo e Opções**
```
Tipo da previsão *
┌──────────┐  ┌────────────┐  ┌──────────┐
│ ✓ Sim/   │  │  Múltipla  │  │ Numérico │
│   Não    │  │  Escolha   │  │          │
└──────────┘  └────────────┘  └──────────┘

(se CHOICE selecionado)
Opções *
[🗳️] [Candidato A        ] [×]
[🗳️] [Candidato B        ] [×]
[+ Adicionar opção]  (máx. 8)

(se NUMERIC selecionado)
Unidade  [gols          ]
Modo     [◉ Mais próximo  ○ Exato]
```

**Passo 3 — Configurações**
```
Prazo para votação *
[01/04/2026  ▼]  [23:59  ▼]

Data prevista do resultado (opcional)
[02/04/2026  ▼]

Visibilidade
[◉ Pública — aparece no feed]
[○ Privada — só via link]

Taxa de entrada
[R$ 0,00          ]
(0 = gratuito, participação livre)

[○] Ocultar contagem até o prazo
[✓] Permitir comentários

              [← Voltar]  [Publicar →]
```

### 9.3 Detalhes da Causa (`/causas/[id]`)

```
┌─────────────────────────────────────────┐
│  ← Voltar    🗳️ POLÍTICA     [Compartilhar]│
│                                          │
│  Quem vai ganhar a eleição               │
│  para governador de SP?                  │
│                                          │
│  por @brunoibiapina · 847 participantes  │
│                                          │
│  ⏱️ Encerra em 2h 30min                  │
│                                          │
│  ─────────── VOTAR ──────────────────   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  🗳️ Candidato A                  │   │
│  │  ████████████░░░░░  63% (534)    │   │
│  │              [Votar nessa opção] │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  🗳️ Candidato B                  │   │
│  │  ██████░░░░░░░░░░░  37% (313)    │   │
│  │              [Votar nessa opção] │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ─────── COMENTÁRIOS (23) ───────────   │
└─────────────────────────────────────────┘
```

### 9.4 Estado Após Votação (feedback imediato)

```
  ✅ Voto registrado!
  Você votou em: 🗳️ Candidato A
  Resultado previsto: 02/04/2026
  [Alterar voto]  [Compartilhar]
```

### 9.5 Estado RESOLVED (resultado)

```
  🏆 RESULTADO
  ━━━━━━━━━━━━━━━━━━━━━━
  ✅ Candidato A GANHOU!
  ━━━━━━━━━━━━━━━━━━━━━━

  Você acertou! 🎉   (ou "Você errou 😔")

  534 pessoas acertaram de 847 votantes
  Taxa de acerto: 63%

  ─── TOP ACERTADORES ─────────────────
  1. @maria_silva      ✅ Acertou
  2. @joao_santos      ✅ Acertou
  ...
```

---

## 10. Navegação — Integração ao App

### Sidebar (desktop)
```typescript
// sidebar.tsx — adicionar após /futebol
{ href: '/causas', label: 'Causas', icon: Vote }
```

### Mobile Nav
```typescript
// mobile-nav.tsx — passa de 5 para 6 itens (ou reorganizar)
// Sugestão: colocar "Causas" no lugar de um item menos usado
// ou expandir para scroll horizontal
{ href: '/causas', label: 'Causas', icon: Vote }
```

### Home Dashboard
- Widget "Causas em alta" no dashboard principal (top 3 causas abertas com mais votos)
- Banner one-shot para apresentar a feature (igual ao que fizemos para Futebol)

---

## 11. Casos de Uso Detalhados

### UC-01: Criar causa BINARY gratuita
1. Usuário acessa `/causas/new`
2. Preenche título: "Vai chover hoje à noite em Curitiba?"
3. Seleciona categoria: CLIMA
4. Seleciona tipo: BINARY → sistema cria opções "Sim" / "Não" automaticamente
5. Define deadline: hoje às 18:00
6. Mantém visibilidade pública e taxa 0
7. Clica "Publicar" → causa criada como OPEN
8. Redirecionado para `/causas/[id]`

### UC-02: Votar em causa pública
1. Usuário vê causa no feed
2. Clica em "Votar →"
3. Vê a página de detalhes com barra de progresso (se não oculto)
4. Clica na opção desejada
5. Sistema registra voto instantaneamente (otimistic update)
6. UI muda para mostrar voto registrado + opção de alterar

### UC-03: Resolver causa (criador)
1. Causa está CLOSED (deadline passou) ou OPEN ainda
2. Criador acessa `/causas/[id]/resolve`
3. Vê resumo: total de votos por opção
4. Seleciona a opção vencedora (ou digita valor numérico)
5. Clica "Confirmar resultado"
6. Sistema: status → RESOLVED, marca isCorrect nos votos, distribui prêmio se taxa > 0
7. Notificação enviada para todos os votantes

### UC-04: Causa privada entre amigos
1. Criador cria causa com visibility: PRIVATE
2. Sistema gera inviteCode único
3. Criador compartilha link: `bolao.app/causas/invite/ABC123`
4. Amigos acessam link → redirecionados para `/causas/[id]` com contexto de convite
5. Causa não aparece no feed público

### UC-05: Causa com taxa e cotas (R$ 10,00/cota, máx 3 cotas)
1. Criador define entryFee: 10.00, cotasPerParticipant: 3
2. Ao publicar → modal "Deseja participar da sua própria causa?"
3. Usuário entra na causa, seleciona opção + quantidade de cotas (1, 2 ou 3)
4. Fluxo de pagamento PIX: R$ 10 × numCotas
5. Após confirmação: voto registrado com numCotas e amount
6. Resolução: sistema separa 10% para plataforma, distribui 90% entre acertadores proporcional às cotas
7. Pagamento do prêmio via transferência (mesmo módulo de payments)

### UC-06: NUMERIC sem acertador
1. Causa: "Quantos gols no Fla-Flu?" com modo EXACT e entryFee R$ 5
2. 100 votos de R$ 5 = R$ 500 bruto
3. Resultado: 3 gols. Ninguém votou exatamente 3
4. Sistema: plataforma recebe R$ 500 (R$ 50 taxa normal + R$ 450 bônus sem acertador)
5. Evento registrado em SystemRevenue com reason: 'NO_WINNER'
6. Todos os participantes são notificados: "Ninguém acertou. O prêmio ficou com a casa."

---

## 12. Fases de Implementação

### Fase 1 — MVP Core (implementar primeiro)
- [ ] Schema Prisma: Causa, CausaOption, CausaVote
- [ ] Migration: `20260401_add_causas`
- [ ] NestJS: `CausasModule` com CRUD básico
- [ ] Endpoints: criar, listar, votar, resolver
- [ ] Cron: auto-fechamento por deadline
- [ ] Frontend: feed `/causas`, criar `/causas/new`, detalhes `/causas/[id]`
- [ ] Integração sidebar/mobile-nav
- [ ] Banner one-shot no dashboard

### Fase 2 — Engajamento
- [ ] Comentários (CausaComment model)
- [ ] Notificações: resultado disponível, prazo se encerrando
- [ ] Widget "Causas em alta" no dashboard
- [ ] Compartilhamento social (OG image por causa)
- [ ] Página `/causas/my` com histórico e estatísticas

### Fase 3 — Monetização
- [ ] Causas com taxa (entryFee > 0)
- [ ] Integração pagamentos PIX (reuso do módulo payments)
- [ ] Distribuição de prêmios automática após resolução
- [ ] Extrato financeiro de causas no perfil

### Fase 4 — Recursos Avançados
- [ ] Causa NUMERIC com modo mais próximo
- [ ] Leaderboard global (usuário com mais acertos históricos)
- [ ] "Streaks" — quantas causas seguidas o usuário acertou
- [ ] Categorias em destaque (admin configura)
- [ ] API pública de causas para embed

---

## 13. Contrato de API — DTOs

### CreateCausaDto
```typescript
class CreateCausaDto {
  @IsString() @MaxLength(200)       title: string
  @IsOptional() @IsString()         description?: string
  @IsOptional() @IsUrl()            imageUrl?: string
  @IsEnum(CausaCategory)            category: CausaCategory
  @IsEnum(CausaType)                type: CausaType
  @IsEnum(CausaVisibility)          visibility: CausaVisibility
  @IsDateString()                   deadlineAt: string
  @IsOptional() @IsDateString()     resolvesAt?: string
  @IsOptional() @IsNumber() @Min(0) entryFee?: number         // default: 0
  @IsOptional() @IsInt() @Min(1) @Max(10) cotasPerParticipant?: number  // default: 1
  @IsOptional() @IsInt()            maxVoters?: number
  @IsOptional() @IsBoolean()        hideVoteCount?: boolean
  @IsOptional() @IsBoolean()        allowComments?: boolean
  @IsOptional() @IsString()         numericUnit?: string
  @IsOptional() @IsEnum(NumericMatchMode) numericMatchMode?: NumericMatchMode

  // apenas para CHOICE:
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CausaOptionDto)
  options?: CausaOptionDto[]
}

class CausaOptionDto {
  @IsString() @MaxLength(100)  label: string
  @IsOptional() @IsString()    emoji?: string
  @IsInt() @Min(0)             order: number
}
```

### VoteCausaDto
```typescript
class VoteCausaDto {
  // para BINARY e CHOICE:
  @IsOptional() @IsString()  optionId?: string
  // para NUMERIC:
  @IsOptional() @IsNumber()  numericValue?: number
  // cotas (para causas com entryFee > 0):
  @IsOptional() @IsInt() @Min(1) numCotas?: number  // default: 1
}
```

### ResolveCausaDto
```typescript
class ResolveCausaDto {
  // para BINARY e CHOICE:
  @IsOptional() @IsString()  winningOptionId?: string
  // para NUMERIC:
  @IsOptional() @IsNumber()  numericResult?: number
}
```

---

## 14. Segurança e Validações

- Usuário só pode votar em causas OPEN e antes do deadline
- Criador não pode votar na própria causa
- Resolução só por criador ou ADMIN
- Causa RESOLVED não pode ser alterada
- Rate limit: máximo 10 causas criadas por usuário por dia (evitar spam)
- Moderação: admin pode cancelar qualquer causa sem explicação
- Causas com conteúdo impróprio: flag `isFlagged` para revisão manual (fase 2)
- Causas privadas: inviteCode não aparece em listagens públicas, não é indexável

---

## 15. Índices de Performance

```sql
-- Busca no feed com filtros (query mais comum)
CREATE INDEX idx_causa_visibility_status ON "Causa" ("visibility", "status");
CREATE INDEX idx_causa_category ON "Causa" ("category");
CREATE INDEX idx_causa_deadline ON "Causa" ("deadlineAt");
CREATE INDEX idx_causa_creator ON "Causa" ("creatorId");

-- Votos
CREATE INDEX idx_causavote_causa ON "CausaVote" ("causaId");
CREATE INDEX idx_causavote_user ON "CausaVote" ("userId");

-- Invite code lookup
CREATE INDEX idx_causa_invite ON "Causa" ("inviteCode");
```

---

## 16. Checklist Pré-Implementação

- [x] Taxa de entrada: por cota (igual bolões) ✅
- [x] Mobile nav: 6 itens, Causas entra sem remover nada ✅
- [x] Criador vota: não direto — modal "deseja participar?" ao publicar ✅
- [x] Sem acertador NUMERIC: 100% para o sistema ✅
- [x] Modelo de receita: 10% fixo sobre prize pool bruto ✅
- [ ] Confirmar ícone para "Causas" na nav — sugestão: `Vote` (urna) ou `Scale` (balança) do lucide-react

---

## 17. Ordem de Implementação — Fase 1 (MVP)

Sequência recomendada para minimizar retrabalho:

```
1. Schema Prisma + migration
   └─ novos enums, models Causa / CausaOption / CausaVote
   └─ adicionar relações ao model User

2. NestJS — causas.module.ts (registro)
3. NestJS — DTOs (create, vote, resolve)
4. NestJS — causas.service.ts (CRUD: criar, listar, buscar)
5. NestJS — causas-votes.service.ts (votar, alterar voto, my-vote)
6. NestJS — causas-resolution.service.ts (resolver, distribuir prêmio)
7. NestJS — causas.scheduler.ts (cron auto-fechamento)
8. NestJS — controllers (público + autenticado)
9. NestJS — registrar no app.module.ts

10. Frontend — hooks (useCausasFeed, useCausa, useVoteCausa, etc.)
11. Frontend — /causas (feed com filtros)
12. Frontend — /causas/new (wizard 3 passos)
13. Frontend — /causas/[id] (detalhes + votação)
14. Frontend — /causas/[id]/resolve (resolução)
15. Frontend — sidebar + mobile-nav (+ ícone Causas)
16. Frontend — banner one-shot no dashboard
17. Frontend — /causas/my (histórico pessoal)
```

---

*Documento atualizado em 2026-04-01. Todas as decisões de produto confirmadas. Pronto para implementação.*

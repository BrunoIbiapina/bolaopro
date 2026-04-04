# Bolão Pro - Estrutura do Projeto Frontend

## Visão Geral

Projeto Next.js 14 completo com TypeScript, Tailwind CSS e arquitetura componentizada. Sistema de autenticação com JWT, gerenciamento de estado com TanStack Query, e interface dark mode por padrão.

## Estrutura de Arquivos

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                        # Root layout com providers
│   │   ├── page.tsx                          # Landing page
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                    # Auth layout wrapper
│   │   │   ├── login/page.tsx                # Página de login
│   │   │   ├── register/page.tsx             # Página de registro
│   │   │   └── forgot-password/page.tsx      # Recuperação de senha
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                    # Dashboard layout
│   │   │   ├── page.tsx                      # Dashboard principal
│   │   │   ├── pools/
│   │   │   │   ├── page.tsx                  # Lista de bolões
│   │   │   │   ├── new/page.tsx              # Criar novo bolão
│   │   │   │   └── [poolId]/page.tsx         # Detalhes do bolão
│   │   │   ├── notifications/page.tsx        # Notificações
│   │   │   └── profile/page.tsx              # Perfil do usuário
│   │   ├── (admin)/
│   │   │   ├── layout.tsx                    # Admin layout
│   │   │   ├── page.tsx                      # Dashboard admin
│   │   │   ├── teams/page.tsx                # Gerenciar times
│   │   │   ├── championships/page.tsx        # Gerenciar campeonatos
│   │   │   ├── matches/page.tsx              # Gerenciar partidas
│   │   │   └── finance/page.tsx              # Finanças e pagamentos
│   │   └── invite/[code]/page.tsx            # Página de convite público
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx                    # Componente Button
│   │   │   ├── input.tsx                     # Componente Input
│   │   │   ├── card.tsx                      # Card e subcomponentes
│   │   │   ├── badge.tsx                     # Badge com variantes
│   │   │   ├── table.tsx                     # Table e subcomponentes
│   │   │   ├── dialog.tsx                    # Modal/Dialog
│   │   │   ├── select.tsx                    # Select customizado
│   │   │   ├── tabs.tsx                      # Tabs com context
│   │   │   ├── skeleton.tsx                  # Loading skeleton
│   │   │   ├── avatar.tsx                    # Avatar com fallback
│   │   │   ├── dropdown-menu.tsx             # Dropdown menu
│   │   │   └── toast.tsx                     # Toast provider (Sonner)
│   │   │
│   │   ├── layout/
│   │   │   ├── header.tsx                    # Header com menu
│   │   │   ├── sidebar.tsx                   # Sidebar nav
│   │   │   ├── mobile-nav.tsx                # Bottom nav (mobile)
│   │   │   ├── dashboard-layout.tsx          # Layout wrapper
│   │   │   └── auth-layout.tsx               # Auth centered layout
│   │   │
│   │   └── shared/
│   │       ├── status-badge.tsx              # Badge de status
│   │       ├── empty-state.tsx               # Empty state component
│   │       ├── loading-skeleton.tsx          # Loading skeletons
│   │       ├── pool-card.tsx                 # Card de bolão
│   │       ├── match-card.tsx                # Card de partida
│   │       ├── ranking-table.tsx             # Tabela de ranking
│   │       ├── champion-screen.tsx           # Tela de campeão
│   │       └── prediction-card.tsx           # Card de palpite
│   │
│   ├── contexts/
│   │   └── auth-context.tsx                  # Contexto de autenticação
│   │
│   ├── hooks/
│   │   ├── use-auth.ts                       # Hook de autenticação
│   │   ├── use-pools.ts                      # Hooks de bolões
│   │   ├── use-predictions.ts                # Hooks de palpites
│   │   ├── use-ranking.ts                    # Hook de ranking
│   │   └── use-notifications.ts              # Hooks de notificações
│   │
│   ├── lib/
│   │   ├── api.ts                            # Axios com interceptors
│   │   ├── auth.ts                           # Token management
│   │   ├── query-client.ts                   # TanStack Query config
│   │   └── utils.ts                          # Utilitários (cn, formatters, etc)
│   │
│   ├── types/
│   │   └── index.ts                          # Todas as interfaces TypeScript
│   │
│   └── styles/
│       └── globals.css                       # Tailwind e estilos globais
│
├── public/
│   └── (assets estáticos)
│
├── package.json                              # Dependências do projeto
├── tsconfig.json                             # Configuração TypeScript
├── tailwind.config.ts                        # Configuração Tailwind
├── postcss.config.js                         # Configuração PostCSS
├── next.config.js                            # Configuração Next.js
├── .eslintrc.json                            # ESLint config
├── .gitignore                                # Git ignore
├── .env.example                              # Exemplo de env vars
├── README.md                                 # Documentação
└── PROJECT_STRUCTURE.md                      # Este arquivo
```

## Componentes por Camada

### UI Components (Reutilizáveis)
- Button (default, secondary, outline, ghost, destructive)
- Input (com validação de estado)
- Card (CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- Badge (success, error, warning, info, default)
- Table (TableHeader, TableBody, TableRow, TableHead, TableCell)
- Dialog (DialogTrigger, DialogContent, DialogHeader, DialogFooter, etc)
- Select (com chevron icon)
- Tabs (com context interno)
- Skeleton (shimmer animation)
- Avatar (com fallback de iniciais)
- DropdownMenu (com auto-close)
- Toast (Sonner provider)

### Layout Components
- Header (com notificações e menu de usuário)
- Sidebar (com rotas admin condicionais)
- MobileNav (bottom nav responsivo)
- DashboardLayout (wrapper com guard de auth)
- AuthLayout (centered card layout)

### Shared Components
- StatusBadge (mapeamento de status com ícones)
- EmptyState (estado vazio customizável)
- LoadingSkeleton (vários tipos de skeleton)
- PoolCard (card de bolão com info)
- MatchCard (card de partida)
- RankingTable (tabela de ranking)
- ChampionScreen (tela de celebração)
- PredictionCard (card de palpite)

## Padrões de Código

### API Integration
```typescript
// src/lib/api.ts - Configuração centralizada
// - Axios instance com baseURL
// - Request interceptor para JWT
// - Response interceptor para 401 + refresh token
// - Queue de requisições enquanto refaz token
```

### State Management
```typescript
// TanStack Query para data fetching
// - useQuery() para leitura
// - useMutation() para escrita
// - Refetch automático
// - Revalidação em sucesso/erro
```

### Autenticação
```typescript
// JWT com refresh token
// - Access token (1h) em cookie HTTP-only
// - Refresh token (7d) em cookie seguro
// - Refresh automático
// - Logout limpa tokens
```

### Validação de Forms
```typescript
// React Hook Form + Zod
// - Type-safe forms
// - Validação em tempo real
// - Mensagens de erro inline
```

## Páginas Públicas

### Landing Page (/)
- Hero com call-to-action
- Como funciona (4 passos)
- Seção de features
- Footer

### Autenticação
- Login (/login)
- Registro (/register)
- Recuperação de senha (/forgot-password)
- Verificação de email (/verify-email/[token])

### Convite Público
- Página de convite (/invite/[code])
- Mostra info do bolão
- CTA para entrar (cria conta se needed)

## Páginas Autenticadas

### Dashboard
- Dashboard principal (/dashboard)
  - KPIs (bolões ativos, posição média)
  - Quick actions
  - Lista de bolões ativos
  - Stats e dicas

- Meus Bolões (/pools)
  - Tabs: Participando / Organizando / Finalizados
  - Pool cards grid
  - Botão criar bolão

- Criar Bolão (/pools/new)
  - Step 1: Informações básicas
  - Step 2: Regras e configuração
  - Validação com Zod

- Detalhes do Bolão (/pools/[poolId])
  - Header com status
  - Info cards (taxa, participantes, status)
  - Tabs: Palpites / Ranking / Jogos / Participantes / Pagamento
  - Tabela de participantes

- Notificações (/notifications)
  - Lista de notificações
  - Read/unread states
  - Delete individual
  - Mark all as read

- Perfil (/profile)
  - Avatar + nome + email
  - Edição de dados pessoais
  - Mudança de senha
  - Logout

## Páginas Admin

### Admin Dashboard (/admin)
- KPI cards (usuários, bolões, campeonatos, receita)
- Atividade recente

### Gerenciamento
- Times (/admin/teams)
  - CRUD com table
  - Busca

- Campeonatos (/admin/championships)
  - CRUD com table
  - Status badges

- Partidas (/admin/matches)
  - Lista com filtros
  - Registrar resultado
  - Status (SCHEDULED/LIVE/FINISHED)

- Finanças (/admin/finance)
  - KPIs (total, pendente, transações)
  - Tabela de pagamentos com filtros
  - Status e método de pagamento

## Design System

### Cores
```
brand: Escala de verde (50-900)
  - brand-500: #22c55e (principal)
  - brand-600: #16a34a (hover)
  - brand-700: #15803d (active)

surface: Grays para componentes
  - DEFAULT: #111827
  - light: #1F2937
  - lighter: #374151

background: #0A0F1C (deep navy)

text:
  - gray-50: primário (#F9FAFB)
  - gray-400: secundário (#9CA3AF)
  - gray-500: terciário (#6B7280)

status:
  - success: green
  - error: red
  - warning: amber
  - info: blue
```

### Tipografia
- Inter: Body text (400, 500, 600, 700, 800)
- JetBrains Mono: Números e códigos (400, 500, 600, 700)

### Espaçamento
Tailwind padrão (múltiplos de 4px)

### Breakpoints
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

## Dependências Principais

```json
{
  "next": "^14.1.0",
  "react": "^18.2.0",
  "@tanstack/react-query": "^5.17.0",
  "axios": "^1.6.5",
  "react-hook-form": "^7.49.3",
  "zod": "^3.22.4",
  "tailwindcss": "^3.4.1",
  "lucide-react": "^0.309.0",
  "sonner": "^1.3.1",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "js-cookie": "^3.0.5",
  "date-fns": "^3.3.0"
}
```

## Como Começar

1. Instalar dependências
```bash
npm install
```

2. Configurar env
```bash
cp .env.example .env.local
```

3. Rodar dev server
```bash
npm run dev
```

4. Acessar http://localhost:3000

## Build e Deploy

```bash
# Build
npm run build

# Start
npm start

# Lint
npm run lint
```

## Checklist de Implementação

✅ Autenticação (login, register, forgot-password)
✅ Dashboard com KPIs
✅ CRUD de bolões
✅ Sistema de palpites
✅ Ranking com trending
✅ Notificações
✅ Perfil de usuário
✅ Painel admin completo
✅ Invite público
✅ Responsive design
✅ Dark mode
✅ Type safety completo
✅ Validação de forms
✅ Toast notifications
✅ Loading states
✅ Error handling

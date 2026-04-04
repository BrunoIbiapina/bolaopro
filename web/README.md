# Bolão Pro - Frontend

Plataforma de bolão esportivo social entre amigos com interface premium e dark mode padrão.

## Tecnologias

- **Next.js 14** - Framework React com SSR/SSG
- **React 18** - Biblioteca UI
- **TypeScript** - Type safety
- **Tailwind CSS 3** - Utility-first CSS
- **TanStack Query** - State management e data fetching
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **Zod** - Schema validation
- **Lucide React** - Icons
- **Sonner** - Toast notifications
- **js-cookie** - Cookie management

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse http://localhost:3000

## Estrutura de Pastas

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── (auth)/            # Páginas de autenticação (layout wrapper)
│   ├── (dashboard)/       # Páginas do dashboard
│   ├── (admin)/           # Páginas administrativas
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Componentes base (button, card, etc)
│   ├── layout/            # Layout components (header, sidebar, etc)
│   └── shared/            # Componentes reutilizáveis (pool-card, etc)
├── contexts/              # React contexts (auth, etc)
├── hooks/                 # Custom React hooks
├── lib/                   # Utilitários (API, auth, utils, etc)
├── types/                 # TypeScript interfaces
└── styles/                # CSS global
```

## Páginas Implementadas

### Públicas
- `/` - Landing page
- `/login` - Login
- `/register` - Registro
- `/forgot-password` - Recuperar senha
- `/invite/[code]` - Convite de bolão

### Dashboard
- `/dashboard` - Dashboard principal
- `/pools` - Meus bolões
- `/pools/new` - Criar bolão
- `/pools/[poolId]` - Detalhes do bolão
- `/notifications` - Notificações
- `/profile` - Perfil do usuário

### Admin
- `/admin` - Dashboard admin
- `/admin/teams` - Gerenciar times
- `/admin/championships` - Gerenciar campeonatos
- `/admin/matches` - Gerenciar partidas
- `/admin/finance` - Finanças e pagamentos

## Recursos Implementados

✅ Sistema completo de autenticação com JWT
✅ Layout responsivo (desktop + mobile)
✅ Dark mode por padrão
✅ Componentes UI customizados e acessíveis
✅ Forms com validação (Zod + React Hook Form)
✅ State management com TanStack Query
✅ Notificações com Sonner
✅ Integração com API backend
✅ Gerenciamento de pooling de bolões
✅ Dashboard com KPIs
✅ Painel administrativo
✅ Ranking de usuários

## Padrões de Código

### API Client
```typescript
import api from '@/lib/api';

// GET
const { data } = await api.get('/endpoint');

// POST
await api.post('/endpoint', { data });

// PATCH
await api.patch('/endpoint/:id', { data });
```

### Hooks
```typescript
import { useAuth } from '@/hooks/use-auth';
import { useMyPools } from '@/hooks/use-pools';

const { user, login, logout } = useAuth();
const { data: pools, isLoading } = useMyPools();
```

### Componentes
```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

<Card>
  <CardContent>
    <Button variant="primary">Clique aqui</Button>
  </CardContent>
</Card>
```

## Variáveis de Ambiente

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Build e Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Desenvolvimento

```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## Autenticação

O sistema usa JWT com refresh token:

1. Access Token (1 hora) - Armazenado em cookie HTTP-only
2. Refresh Token (7 dias) - Armazenado em cookie seguro
3. Refresh automático quando access token expira
4. Logout limpa ambos os tokens

## Design System

### Cores
- **Primary**: Brand Green (#10B981)
- **Background**: Deep Navy (#0A0F1C)
- **Surface**: Dark Gray (#111827)
- **Text Primary**: Gray 50 (#F9FAFB)
- **Text Secondary**: Gray 400 (#9CA3AF)

### Tipografia
- **Sans**: Inter (corpo de texto)
- **Mono**: JetBrains Mono (números e códigos)

### Espaçamento
Baseado em rem com escala de 4px (Tailwind padrão)

## Licença

Propriedade do Bolão Pro

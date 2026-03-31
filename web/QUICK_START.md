# Bolão Pro - Quick Start Guide

## 1. Configuração Inicial

```bash
# Entrar no diretório
cd /sessions/brave-hopeful-clarke/mnt/bolao/web

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env.local
```

## 2. Configurar Backend URL

Edite `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## 3. Rodar Development Server

```bash
npm run dev
```

Acesse: http://localhost:3000

## 4. Contas de Teste

### Admin
- Email: admin@example.com
- Senha: admin123456

### Usuário Regular
- Email: user@example.com
- Senha: user123456

## 5. Páginas Disponíveis

### Landing & Auth
- `/` - Landing page
- `/login` - Fazer login
- `/register` - Criar conta
- `/forgot-password` - Recuperar senha

### Dashboard
- `/dashboard` - Home do usuário
- `/pools` - Meus bolões
- `/pools/new` - Criar novo bolão
- `/pools/[poolId]` - Ver bolão
- `/notifications` - Notificações
- `/profile` - Perfil

### Admin (require admin role)
- `/admin` - Dashboard
- `/admin/teams` - Times
- `/admin/championships` - Campeonatos
- `/admin/matches` - Partidas
- `/admin/finance` - Finanças

### Público
- `/invite/[code]` - Página de convite

## 6. Estrutura de Pastas

```
src/
├── app/           - Páginas (routing)
├── components/    - Componentes React
├── contexts/      - Contextos (auth)
├── hooks/         - Custom hooks
├── lib/           - Utilitários
├── types/         - TypeScript types
└── styles/        - CSS global
```

## 7. Build para Produção

```bash
npm run build
npm start
```

## 8. Lint

```bash
npm run lint
```

## 9. Variáveis de Ambiente

```
NEXT_PUBLIC_API_URL - URL da API backend
```

## 10. Stack Resumido

- Next.js 14 (App Router)
- TypeScript
- React 18
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod (validação)
- Axios
- Lucide React (ícones)
- Sonner (toasts)

## Dicas Úteis

### Adicionar nova página
1. Criar arquivo em `src/app/novo-path/page.tsx`
2. Usar componentes de `src/components/`

### Adicionar novo componente
1. Criar em `src/components/shared/seu-componente.tsx`
2. Importar tipos de `src/types/`
3. Usar componentes base de `src/components/ui/`

### Adicionar novo hook
1. Criar em `src/hooks/use-seu-hook.ts`
2. Usar `api` de `src/lib/api.ts`
3. Usar `useMutation` ou `useQuery` do TanStack Query

### API Call
```typescript
import api from '@/lib/api';

const { data } = await api.get('/endpoint');
await api.post('/endpoint', data);
```

### Componente Tipado
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pool } from '@/types';

interface MyComponentProps {
  pool: Pool;
}

export function MyComponent({ pool }: MyComponentProps) {
  return <Card>...</Card>;
}
```

### Form com Validação
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
});

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });
}
```

## Troubleshooting

### Erro de CORS
- Verificar se backend está rodando na porta 3001
- Verificar NEXT_PUBLIC_API_URL em .env.local

### Erro de tipo TypeScript
- Verificar se interfaces estão em `src/types/index.ts`
- Usar `npm run build` para validar antes de deploy

### Componentes não aparecem
- Verificar imports relativos em `@/`
- Verificar se componentes estão exportados corretamente

## Próximos Passos

1. Conectar com backend real
2. Implementar WebSocket para real-time
3. Adicionar testes (Jest, React Testing Library)
4. Setup de CI/CD
5. Deploy (Vercel, AWS, etc)

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)

## Suporte

Consulte:
- README.md - Documentação completa
- PROJECT_STRUCTURE.md - Estrutura detalhada
- IMPLEMENTATION_SUMMARY.md - Resumo do projeto

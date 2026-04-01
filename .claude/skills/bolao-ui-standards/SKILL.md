# Bolão Pro — UI Standards Skill

Este skill define os padrões visuais e de código para todas as tarefas de UI no projeto **Bolão Pro**. Leia este arquivo inteiro antes de criar ou modificar qualquer componente.

---

## Stack de UI

- **React** com Next.js 14 App Router
- **Tailwind CSS** com `darkMode: 'class'`
- **Lucide React** para todos os ícones
- **Sonner** para toasts
- Componentes base em `web/src/components/ui/`

---

## Regra #1 — NUNCA use emoji como elemento de UI

**Emojis são proibidos em:**
- Botões e CTAs
- Ícones decorativos de seção/card
- Labels e badges
- Empty states
- Títulos e subtítulos de UI

**Use sempre Lucide icons no lugar:**

| Intenção | Emoji errado | Lucide correto |
|---|---|---|
| Futebol / bolão | `⚽` | `<Trophy />` ou `<CircleDot />` |
| Ferramenta / configuração | `🛠️` | `<Wrench />` ou `<Settings />` |
| Informação | `ℹ️` | `<Info />` |
| Busca / não encontrado | `🔍` | `<Search />` ou `<SearchX />` |
| Aviso | `⚠️` | `<AlertTriangle />` |
| Novo usuário / entrar | `👋` | `<UserPlus />` |
| Usuário participando | — | `<UserCheck />` |
| Dinheiro | `💰` | `<Banknote />` ou `<DollarSign />` |
| Troféu / vencedor | `🏆` | `<Trophy />` |
| Sucesso | `✅` | `<CheckCircle2 />` |
| Erro | `❌` | `<XCircle />` |
| Cadeado | `🔒` | `<Lock />` |

**Exceção permitida:** emojis em **conteúdo de texto compartilhado** (ex: mensagem de WhatsApp em `share-modal.tsx`) são aceitáveis, pois fazem parte do conteúdo, não da interface.

**Exceção permitida:** medalhas `🥇🥈🥉` em rankings/placar (convenção do esporte, contexto de celebração). Mesmo assim, prefira usar componentes quando possível.

**Exceção permitida:** a bola rolante `⚽` no `LoadingScreen` e `page-loader.tsx` é um efeito de animação intencional com `animate-ball-roll`, não um ícone decorativo. Pode ser mantida.

---

## Regra #2 — Padrão de ícones em botões

Ícones em botões sempre via Lucide, com tamanho `w-4 h-4` ou `size-4`:

```tsx
// ✅ Correto
<button className="...flex items-center gap-2...">
  <UserCheck className="w-4 h-4" />
  Sim, quero participar
</button>

// ❌ Errado
<button>
  <span>⚽</span> Sim, quero participar
</button>
```

---

## Regra #3 — Ícones em containers decorativos

Para ícones de seção/card, use um container com opacidade da cor brand:

```tsx
// ✅ Padrão do projeto
<div className="w-8 h-8 rounded-lg bg-brand-600/15 flex items-center justify-center">
  <Trophy className="w-4 h-4 text-brand-400" />
</div>

// ❌ Errado
<span className="text-2xl">🏆</span>
```

---

## Regra #4 — Empty states

Empty states usam ícone Lucide num container cinza, nunca emoji solto:

```tsx
// ✅ Correto
<div className="text-center py-12 space-y-3">
  <div className="w-14 h-14 rounded-2xl bg-surface-light flex items-center justify-center mx-auto">
    <CalendarOff className="w-7 h-7 text-gray-500" />
  </div>
  <p className="text-sm text-gray-400">Nenhuma partida cadastrada ainda.</p>
</div>

// ❌ Errado
<div className="text-center">
  <span className="text-4xl">😔</span>
  <p>Nenhuma partida</p>
</div>
```

---

## Regra #5 — Variantes de botão e link

Use os componentes de UI do projeto:

```tsx
import { Button } from '@/components/ui/button';

// Variantes disponíveis: default | secondary | destructive | outline | ghost
<Button variant="default">Salvar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="destructive">Excluir</Button>
```

Para ações destrutivas suaves (ex: logout), prefira um `<button>` com bordas manuais em vez do `<Button variant="destructive">` gritante:

```tsx
<button className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-medium transition-all text-sm">
  <LogOut className="w-4 h-4" />
  Sair da conta
</button>
```

---

## Regra #6 — Cores e tokens

Use **sempre** os tokens do Tailwind config, nunca hex direto:

| Token | Uso |
|---|---|
| `bg-background` | Fundo da página |
| `bg-surface` | Cards e painéis |
| `bg-surface-light` | Bordas e divisores leves |
| `bg-surface-lighter` | Hover states |
| `text-gray-50` | Texto principal |
| `text-gray-400` | Texto secundário / labels |
| `text-gray-500` | Texto terciário / placeholders |
| `text-brand-300/400` | Destaques, links, ícones ativos |
| `border-surface-light` | Bordas padrão |
| `border-brand-500/20` | Bordas de seções brand |

---

## Regra #7 — Não use formatação excessiva em respostas

Ao criar UI para este projeto, **não use headers, bullet points excessivos ou emojis nas respostas de texto** ao usuário. Responda de forma concisa e direta, mostrando o código.

---

## Checklist antes de entregar UI

Antes de fazer commit de qualquer componente de UI, verifique:

- [ ] Nenhum emoji como ícone de botão, seção, badge ou empty state
- [ ] Todos os ícones são componentes Lucide importados
- [ ] Cores usam tokens Tailwind (não hex direto)
- [ ] Botões destrutivos usam variante suave quando adequado
- [ ] Empty states têm container de ícone estruturado

---

## Arquivos de referência no projeto

- `web/tailwind.config.ts` — tokens de cor e animações
- `web/src/components/ui/` — componentes base (Button, Input, Card, etc.)
- `web/src/styles/globals.css` — variáveis CSS de tema (light/dark)
- `web/src/app/(dashboard)/profile/page.tsx` — exemplo de página bem estruturada com ícones Lucide

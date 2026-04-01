# Dark / Light Mode — Skill de Implementação

Este skill define o padrão para implementar modo escuro/claro em apps Tailwind **sem precisar adicionar `dark:` em nenhum componente existente**.

A técnica usa **inversão semântica da escala de cinza via CSS custom properties**, fazendo com que todos os `text-gray-*`, `bg-gray-*`, `border-gray-*` se adaptem automaticamente ao tema.

---

## Princípio

Em um app construído para dark mode:
- `text-gray-50` = texto quase branco (legível em fundo escuro)
- `bg-gray-800` = fundo escuro de cards/inputs
- `text-gray-400` = texto secundário cinza claro

Em light mode, queremos o **inverso semântico**:
- `text-gray-50` = texto quase preto (legível em fundo claro)
- `bg-gray-800` = fundo muito claro de cards/inputs
- `text-gray-400` = texto secundário cinza escuro

**Solução**: redefinir as variáveis `--gray-*` no `:root` (light) com os valores invertidos, e no `.dark` com os valores originais do Tailwind.

---

## Passos de implementação

### 1. Instalar `next-themes`

```bash
npm install next-themes
```

### 2. Adicionar ThemeProvider em `providers.tsx` (ou equivalente)

```tsx
import { ThemeProvider } from 'next-themes';

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}
```

### 3. Adicionar `suppressHydrationWarning` no `<html>` do layout

```tsx
<html lang="pt-BR" suppressHydrationWarning>
```

### 4. Configurar `tailwind.config.ts` — redefinir a paleta gray para usar CSS vars

```ts
theme: {
  extend: {
    colors: {
      gray: {
        50:  'rgb(var(--gray-50) / <alpha-value>)',
        100: 'rgb(var(--gray-100) / <alpha-value>)',
        200: 'rgb(var(--gray-200) / <alpha-value>)',
        300: 'rgb(var(--gray-300) / <alpha-value>)',
        400: 'rgb(var(--gray-400) / <alpha-value>)',
        500: 'rgb(var(--gray-500) / <alpha-value>)',
        600: 'rgb(var(--gray-600) / <alpha-value>)',
        700: 'rgb(var(--gray-700) / <alpha-value>)',
        800: 'rgb(var(--gray-800) / <alpha-value>)',
        900: 'rgb(var(--gray-900) / <alpha-value>)',
        950: 'rgb(var(--gray-950) / <alpha-value>)',
      },
      // Cores de superfície também via CSS vars:
      surface: {
        DEFAULT: 'var(--color-surface)',
        light: 'var(--color-surface-light)',
        lighter: 'var(--color-surface-lighter)',
      },
      background: 'var(--color-background)',
    },
  },
}
```

> **Por que `<alpha-value>`?** Permite usar modificadores de opacidade como `bg-gray-800/60` mesmo com CSS vars.

### 5. Definir variáveis em `globals.css`

```css
:root {
  /* Light mode — grays invertidos (gray-50 = escuro, gray-950 = claro) */
  --gray-50:  3 7 18;
  --gray-100: 17 24 39;
  --gray-200: 31 41 55;
  --gray-300: 55 65 81;
  --gray-400: 75 85 99;
  --gray-500: 107 114 128;
  --gray-600: 156 163 175;
  --gray-700: 209 213 219;
  --gray-800: 229 231 235;
  --gray-900: 243 244 246;
  --gray-950: 249 250 251;

  /* Superfícies claras */
  --color-background: #f0f4f8;
  --color-surface: #ffffff;
  --color-surface-light: #e8edf2;
  --color-surface-lighter: #d1dae4;
}

.dark {
  /* Dark mode — escala original do Tailwind */
  --gray-50:  249 250 251;
  --gray-100: 243 244 246;
  --gray-200: 229 231 235;
  --gray-300: 209 213 219;
  --gray-400: 156 163 175;
  --gray-500: 107 114 128;
  --gray-600: 75 85 99;
  --gray-700: 55 65 81;
  --gray-800: 31 41 55;
  --gray-900: 17 24 39;
  --gray-950: 3 7 18;

  /* Superfícies escuras */
  --color-background: #0A0F1C;
  --color-surface: #111827;
  --color-surface-light: #1F2937;
  --color-surface-lighter: #374151;
}

html, body {
  @apply bg-background text-gray-50 font-sans;
}
```

### 6. Botão de toggle (colocar onde quiser na UI)

```tsx
'use client';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-700 bg-surface-light hover:bg-surface-lighter transition-all text-sm"
    >
      {theme === 'dark'
        ? <><Sun className="w-4 h-4 text-yellow-400" /> Claro</>
        : <><Moon className="w-4 h-4 text-brand-400" /> Escuro</>}
    </button>
  );
}
```

---

## Como funciona a inversão

| Classe | Dark mode | Light mode |
|---|---|---|
| `text-gray-50` | #F9FAFB (quase branco) | #030712 (quase preto) |
| `text-gray-400` | #9CA3AF (cinza médio-claro) | #4B5563 (cinza médio-escuro) |
| `bg-gray-800` | #1F2937 (fundo escuro) | #E5E7EB (fundo muito claro) |
| `bg-gray-900` | #111827 (fundo muito escuro) | #F3F4F6 (fundo ultra-claro) |
| `border-gray-700/40` | tom escuro semi-opaco | tom claríssimo semi-opaco |

---

## O que NÃO muda com esta técnica

- Cores `brand-*` (verde) — intencionais, ficam iguais em ambos os modos
- Cores `red-*`, `yellow-*`, `orange-*`, `green-*` — semânticas, ficam iguais
- Gradientes com cores hardcoded — precisam de `dark:` manual se necessário

---

## Checklist de validação

Após implementar, verificar em ambos os modos:

- [ ] Fundo da página legível (bg-background muda)
- [ ] Texto principal visível (text-gray-50 = escuro no light)
- [ ] Texto secundário (text-gray-400) com contraste suficiente
- [ ] Cards e inputs (bg-surface, bg-gray-800) distinguíveis do fundo
- [ ] Bordas (border-surface-light, border-gray-700) visíveis
- [ ] Inputs com texto legível (text-gray-100 = quase preto no light mode)
- [ ] Botões com contraste adequado
- [ ] Scrollbar visível em ambos os modos

---

## Casos especiais que precisam de atenção manual

**Inputs nativos** (datetime-local, select, etc.) podem ignorar o tema do sistema e mostrar fundo branco com texto branco em dark mode. Adicione `color-scheme: dark` no CSS se necessário:

```css
.dark input[type="datetime-local"],
.dark select {
  color-scheme: dark;
}
```

**Imagens com fundo branco** podem ser muito "estourantes" no dark mode. Use `dark:opacity-90` se necessário.

**Cores hardcoded em strings** como `className="bg-white text-black"` não serão afetadas pelas CSS vars — use sempre os tokens (bg-surface, text-gray-50, etc.).

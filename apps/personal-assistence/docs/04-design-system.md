# 04 — Design System

Base: **shadcn/ui** + inspiração **Magic UI** / **21st.dev**.
Estética: dark-first, minimal, acentos em gradiente violeta, superfícies zinc.

---

## Fontes

| Papel | Família | Uso |
|-------|---------|-----|
| UI / corpo | **Geist Sans** | Texto geral, labels, navegação, botões |
| Dados / tempo | **Geist Mono** | Horas, durações, IDs, métricas numéricas |

Ambas já integradas via `next/font` no `layout.tsx`.

### Regras tipográficas

```css
/* Métricas e valores numéricos */
.metric-value {
  font-family: var(--font-geist-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

/* Colunas de tempo na tabela */
.table-time {
  font-family: var(--font-geist-mono);
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
}
```

### Escala

| Elemento | Tamanho | Peso |
|----------|---------|------|
| Page title | `text-2xl` | `font-semibold` |
| Card title | `text-sm` | `font-medium` |
| Body | `text-sm` | `font-normal` |
| Metric value | `text-3xl` | `font-semibold` (mono) |
| Table header | `text-xs` | `font-medium uppercase tracking-wider` |
| Muted / hint | `text-xs` | `font-normal` |

**Regra:** no MVP, usar apenas Geist Sans + Geist Mono. Sem fontes display.

---

## Paleta de cores

Tokens em **OKLCH**, compatíveis com Tailwind CSS 4 e shadcn.

### Dark mode (padrão)

```css
:root {
  --background: oklch(0.13 0.005 285);
  --foreground: oklch(0.98 0 0);

  --card: oklch(0.16 0.006 285);
  --card-foreground: oklch(0.98 0 0);

  --popover: oklch(0.16 0.006 285);
  --popover-foreground: oklch(0.98 0 0);

  --primary: oklch(0.65 0.22 285);
  --primary-foreground: oklch(0.98 0 0);

  --secondary: oklch(0.22 0.006 285);
  --secondary-foreground: oklch(0.98 0 0);

  --muted: oklch(0.22 0.006 285);
  --muted-foreground: oklch(0.65 0.01 285);

  --accent: oklch(0.22 0.006 285);
  --accent-foreground: oklch(0.98 0 0);

  --destructive: oklch(0.60 0.22 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border: oklch(0.28 0.008 285 / 60%);
  --input: oklch(0.28 0.008 285 / 60%);
  --ring: oklch(0.65 0.22 285 / 50%);

  --radius: 0.625rem;
}
```

### Light mode

```css
.light {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.15 0.005 285);

  --card: oklch(1 0 0);
  --card-foreground: oklch(0.15 0.005 285);

  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.15 0.005 285);

  --primary: oklch(0.55 0.22 285);
  --primary-foreground: oklch(0.98 0 0);

  --secondary: oklch(0.96 0.005 285);
  --secondary-foreground: oklch(0.15 0.005 285);

  --muted: oklch(0.96 0.005 285);
  --muted-foreground: oklch(0.50 0.01 285);

  --accent: oklch(0.96 0.005 285);
  --accent-foreground: oklch(0.15 0.005 285);

  --destructive: oklch(0.55 0.22 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border: oklch(0.90 0.005 285);
  --input: oklch(0.90 0.005 285);
  --ring: oklch(0.55 0.22 285 / 50%);
}
```

### Cores semânticas (status)

```css
:root {
  --status-open: oklch(0.75 0.15 85);      /* âmbar — tarefa aberta */
  --status-closed: oklch(0.70 0.17 160);    /* esmeralda — finalizada */
  --accent-whatsapp: oklch(0.65 0.18 145); /* verde suave — contexto WhatsApp */
}
```

### Gradiente de acento (Magic UI)

Uso pontual: borda de card principal, highlights, avatar.

```css
:root {
  --gradient-primary: linear-gradient(
    135deg,
    oklch(0.65 0.22 285) 0%,
    oklch(0.60 0.20 320) 50%,
    oklch(0.55 0.18 250) 100%
  );
}
```

### Charts

```css
:root {
  --chart-1: oklch(0.65 0.22 285);  /* violet — horas hoje */
  --chart-2: oklch(0.70 0.17 160);  /* emerald — horas semana */
  --chart-3: oklch(0.75 0.15 85);   /* amber — tarefas abertas */
  --chart-4: oklch(0.60 0.20 320);  /* purple — comparação */
  --chart-5: oklch(0.55 0.18 250);  /* indigo — histórico */
}
```

---

## Ícones

**Lucide React** — único set de ícones no MVP.

```bash
npm install lucide-react
```

### Mapa de ícones

| Contexto | Ícone |
|----------|-------|
| Dashboard | `LayoutDashboard` |
| Tarefa aberta | `CircleDot` |
| Tarefa finalizada | `CheckCircle2` |
| Tempo / duração | `Clock` |
| Timer ativo | `Timer` |
| Métricas do dia | `CalendarDays` |
| Métricas da semana | `BarChart3` |
| Filtro de período | `CalendarRange` |
| Auth / login | `LogIn` |
| Logout | `LogOut` |
| WhatsApp (indicador) | `MessageCircle` |
| Loading | `Loader2` + `animate-spin` |
| Empty state | `ClipboardList` |
| Sidebar toggle | `PanelLeft` |

### Tamanhos

| Contexto | Classe |
|----------|--------|
| Inline / botões | `size-4` |
| Nav / cards | `size-5` |
| Empty states | `size-6 stroke-[1.5]` |

**Não usar:** logo oficial do WhatsApp, emojis como ícones de status, múltiplos sets de ícones.

---

## Componentes

### shadcn/ui (base)

Instalar via CLI:

```bash
npx shadcn@latest init
npx shadcn@latest add button card table badge input separator skeleton tabs
```

Componentes necessários no MVP:

| Componente | Uso |
|------------|-----|
| `Button` | Ações, auth, filtros |
| `Card` | Métricas, containers |
| `Table` | Listagem de tarefas |
| `Badge` | Status (Aberta / Finalizada) |
| `Input` | Formulário de auth |
| `Separator` | Divisores visuais |
| `Skeleton` | Loading states |
| `Tabs` | Filtro Hoje / 7 dias |

### Magic UI (acentos)

Adicionar seletivamente para efeitos visuais:

| Componente | Uso sugerido |
|------------|--------------|
| `animated-theme-toggler` | Toggle dark/light no dashboard |
| `number-ticker` | Animação nos cards de métricas |
| `shimmer-button` | CTA principal em /auth |
| `border-beam` | Borda animada no card de métrica principal |

Instalar via Magic UI MCP ou CLI:

```bash
npx shadcn@latest add "https://magicui.design/r/number-ticker"
```

---

## Layout do Dashboard

```
┌─────────────────────────────────────────────────┐
│  Sidebar (nav)  │  Main content                 │
│                 │                               │
│  Logo           │  ┌─────────┐ ┌─────────┐      │
│  Dashboard      │  │ Hoje    │ │ Semana  │      │
│  ─────────      │  │ 5h 23m  │ │ 32h 10m │      │
│  Theme toggle   │  └─────────┘ └─────────┘      │
│  Logout         │                               │
│                 │  [Hoje] [Últimos 7 dias]      │
│                 │                               │
│                 │  ┌───────────────────────────┐│
│                 │  │ TaskTable                 ││
│                 │  │ ID | Desc | Início | ...  ││
│                 │  └───────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Badges de status

| Status | Variante | Cor |
|--------|----------|-----|
| Aberta | `default` com `--status-open` | Âmbar |
| Finalizada | `secondary` com `--status-closed` | Esmeralda |

---

## Layout de /auth

```
┌─────────────────────────────────┐
│                                 │
│         ┌─────────────┐         │
│         │  Logo       │         │
│         │             │         │
│         │  E-mail     │         │
│         │  [________] │         │
│         │             │         │
│         │  [Entrar]   │  ← shimmer-button
│         │             │         │
│         └─────────────┘         │
│                                 │
└─────────────────────────────────┘
```

Card centralizado, fundo `--background`, card com `--card` e borda sutil.

---

## Princípios

1. **Dark-first** — tema escuro como padrão; light mode via toggle
2. **Dados legíveis** — Geist Mono + tabular-nums em colunas de tempo
3. **Gradiente com moderação** — apenas em acentos, não em toda a UI
4. **Consistência** — um set de ícones (Lucide), uma escala neutra (Zinc/OKLCH)
5. **shadcn como base** — Magic UI apenas para efeitos pontuais

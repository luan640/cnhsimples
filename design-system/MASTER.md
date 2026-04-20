# CNH Simples — Design System MASTER

> Fonte da verdade para todas as decisões de UI/UX da plataforma.
> Mobile-first (375px base) com suporte a desktop. Consultar antes de implementar qualquer tela.

---

## Padrão de Produto

**Tipo:** Marketplace / Booking App  
**Foco:** Busca de instrutores + agendamento + pagamento  
**Público:** Adultos brasileiros (18–45 anos), celular como dispositivo principal  
**Tom:** Confiante, acessível, moderno, sem intimidar  

---

## Paleta de Cores

> Sidebar e botões seguem o design system do **Supabase** (fonte oficial: `packages/ui/build/css/source/global.css`).  
> Área de conteúdo usa azul confiança + laranja CTA para identidade própria da plataforma.

---

### Tokens do Supabase — Sidebar e Botões

O Supabase usa **slate-dark** para sidebar e **verde esmeralda** como brand. Extraído diretamente do repositório oficial.

```css
/* ─── SIDEBAR (Supabase dark sidebar — slate-dark scale) ─── */
--sidebar-bg:            #1c1c1c;   /* slate-dark-100 — fundo do sidebar */
--sidebar-bg-hover:      #242424;   /* slate-dark-200 — hover de item */
--sidebar-bg-active:     #2a2a2a;   /* slate-dark-300 — item ativo */
--sidebar-border:        #333333;   /* slate-dark-400 — divider interno */
--sidebar-text:          #a1a1aa;   /* foreground-muted — texto inativo */
--sidebar-text-active:   #f4f4f5;   /* foreground-default — texto ativo */
--sidebar-brand:         #3ECF8E;   /* brand green Supabase — ícone/indicador ativo */

/* ─── BOTÕES (Supabase button style) ─── */
--btn-primary-bg:        #3ECF8E;   /* Verde Supabase — botão primário */
--btn-primary-bg-hover:  #2BBF7E;   /* Verde mais escuro no hover */
--btn-primary-text:      #0F172A;   /* Texto escuro sobre verde (contraste 7:1) */
--btn-primary-radius:    6px;        /* border-radius Supabase (--borderradius-lg) */

--btn-secondary-bg:      transparent;
--btn-secondary-border:  #333333;
--btn-secondary-text:    #f4f4f5;
--btn-secondary-radius:  6px;

--btn-ghost-text:        #a1a1aa;
--btn-ghost-hover-bg:    #242424;

--btn-danger-bg:         #DC2626;
--btn-danger-text:       #FFFFFF;
```

### Tokens de Conteúdo — Identidade CNH Simples

```css
/* globals.css / tailwind tokens */
--color-primary:         #0284C7;   /* Azul — links, destaques de conteúdo */
--color-primary-dark:    #0369A1;   /* Hover do primary */
--color-primary-light:   #E0F2FE;   /* Backgrounds leves, badges */

--color-cta:             #F97316;   /* Laranja — CTA do aluno (Agendar, Pagar) */
--color-cta-dark:        #EA6C0A;   /* Hover do CTA */

--color-accent:          #3ECF8E;   /* Verde Supabase — slot disponível, sucesso, saldo */
--color-accent-dark:     #2BBF7E;   /* Hover / variação */
--color-accent-light:    #D1FAE5;   /* Background de estado positivo */

--color-background:      #F8FAFC;   /* Fundo global (slate-50) */
--color-surface:         #FFFFFF;   /* Cards, modais, inputs */
--color-surface-muted:   #F1F5F9;   /* Seções alternadas (slate-100) */

--color-text:            #0F172A;   /* Texto principal (slate-900) */
--color-text-muted:      #64748B;   /* Texto secundário (slate-500) */
--color-text-inverse:    #FFFFFF;   /* Texto sobre fundos escuros */

--color-border:          #E2E8F0;   /* Bordas de cards e inputs (slate-200) */
--color-border-strong:   #CBD5E1;   /* Dividers com mais ênfase (slate-300) */

--color-error:           #DC2626;   /* Erro, slot indisponível */
--color-error-light:     #FEE2E2;   /* Background de erro */
--color-warning:         #F59E0B;   /* Atenção — mensalidade próxima do vencimento */
--color-warning-light:   #FEF3C7;

--color-disabled:        #CBD5E1;   /* Elementos desabilitados */
--color-overlay:         rgba(0,0,0,0.45); /* Scrim de modais */
```

### Uso por contexto

| Contexto | Token |
|----------|-------|
| Botão primário (instrutor — mensalidade, salvar) | `primary` |
| Botão CTA do aluno (Agendar, Pagar) | `cta` |
| Slot disponível na agenda | `accent` |
| Slot ocupado | `primary-light` + texto `primary` |
| Slot bloqueado / indisponível | `error-light` + texto `error` |
| Saldo na carteira | `accent` |
| Mensalidade vencida / alerta | `warning` |
| Status de saque pendente | `warning` |
| Status de saque aprovado | `accent` |
| Status de saque rejeitado | `error` |

---

## Tipografia

> Supabase usa **Inter** exclusivamente (`--font-family-body: Inter` — fonte oficial do repositório).  
> Adotamos o mesmo para máxima consistência visual.

**Toda tipografia:** `Inter` — igual ao Supabase Studio  

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
```

```js
// tailwind.config.ts
fontFamily: {
  sans:    ['Inter', 'sans-serif'],  // default em tudo
  heading: ['Inter', 'sans-serif'],  // headings também Inter, diferenciado por peso
  mono:    ['JetBrains Mono', 'monospace'], // para campos de código/CPF/CNH
}
```

### Escala tipográfica

| Token | Tamanho | Peso | Uso |
|-------|---------|------|-----|
| `text-display` | 32px / 2rem | 700 (Poppins) | Títulos de hero |
| `text-h1` | 24px / 1.5rem | 600 (Poppins) | Títulos de página |
| `text-h2` | 20px / 1.25rem | 600 (Poppins) | Subtítulos de seção |
| `text-h3` | 18px / 1.125rem | 500 (Poppins) | Títulos de card |
| `text-body` | 16px / 1rem | 400 (Inter) | Texto corrido — mínimo mobile |
| `text-sm` | 14px / 0.875rem | 400 (Inter) | Labels, metadados |
| `text-xs` | 12px / 0.75rem | 500 (Inter) | Badges, timestamps — nunca body |

> Regra: nunca usar texto abaixo de 12px. Body mínimo: 16px (evita zoom automático iOS).  
> `line-height`: 1.5 para body, 1.3 para headings.

---

## Espaçamento

Sistema base **4px** com múltiplos de 4 e 8:

```
4px  → gap-1   (micro — ícone + label)
8px  → gap-2   (espaço interno de badge, tag)
12px → gap-3   (padding interno de input)
16px → gap-4   (padding padrão de card, seção mobile)
24px → gap-6   (espaço entre cards)
32px → gap-8   (espaço entre seções)
48px → gap-12  (seções de página)
64px → gap-16  (separação maior — hero)
```

**Padding de tela:** `px-4` (16px) no mobile, `px-6` (24px) no tablet, `px-8` (32px) no desktop.

---

## Bordas e Sombras

> Border radius segue a escala oficial do Supabase (`--borderradius-sm: 4px`, `--borderradius-lg: 8px`, `--borderradius-xl: 16px`).

```css
/* Border radius — escala Supabase */
--radius-xs:   4px;    /* badges, tags (borderradius-sm) */
--radius-sm:   6px;    /* botões, inputs (borderradius-lg) */
--radius-md:   8px;    /* cards compactos */
--radius-lg:   12px;   /* cards padrão */
--radius-xl:   16px;   /* modais, bottom sheets (borderradius-xl) */
--radius-full: 9999px; /* avatars */

/* Sombras — elevação consistente */
--shadow-card:   0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
--shadow-raised: 0 4px 12px rgba(0,0,0,0.10);
--shadow-modal:  0 20px 40px rgba(0,0,0,0.15);
```

---

## Animações

| Tipo | Duração | Easing |
|------|---------|--------|
| Micro-interações (hover, press) | 150ms | ease-out |
| Transições de estado (expand, collapse) | 250ms | ease-in-out |
| Modais e bottom sheets | 300ms | ease-out |
| Skeleton / shimmer | 1.5s | linear (loop) |

> Sempre implementar `prefers-reduced-motion: reduce` desativando animações decorativas.

---

## Breakpoints

```js
// tailwind.config.ts
screens: {
  sm:  '375px',   // base mobile
  md:  '768px',   // tablet
  lg:  '1024px',  // desktop pequeno
  xl:  '1440px',  // desktop largo
}
```

**Mobile-first**: todas as classes base são para 375px. Classes `md:` e `lg:` sobrescrevem.

---

## Navegação

### Mobile (< 768px)
**Bottom Navigation Bar** com 4 itens (ícone + label):

| Perfil | Itens |
|--------|-------|
| Aluno | Buscar · Minhas Aulas · Perfil |
| Instrutor | Painel · Agenda · Carteira · Perfil |

### Desktop (≥ 1024px)
**Sidebar fixa** à esquerda (240px) com os mesmos itens.

> Nunca misturar top nav + bottom nav no mesmo breakpoint.

---

## Componentes — padrões visuais

### Botões (estilo Supabase)

> Supabase usa `border-radius: 6px`, `font: Inter 500`, sem pill. Adotamos o mesmo.

```
Primário (verde Supabase):  bg-[#3ECF8E]  text-[#0F172A]  rounded-[6px]  px-4 py-2  text-sm font-medium  hover:bg-[#2BBF7E]
CTA do aluno (laranja):     bg-[#F97316]  text-white       rounded-[6px]  px-4 py-2  text-sm font-semibold hover:bg-[#EA6C0A]
Secundário:                 border border-[#333]  text-[#f4f4f5]  bg-transparent  rounded-[6px]  px-4 py-2  text-sm
Ghost:                      text-[#a1a1aa]  bg-transparent  hover:bg-[#242424]  rounded-[6px]  px-4 py-2
Destrutivo:                 bg-[#DC2626]  text-white  rounded-[6px]  px-4 py-2  text-sm font-medium
Desabilitado:               opacity-50  cursor-not-allowed  pointer-events-none
```

> Tamanho mínimo de toque em mobile: **44×44px** (ampliar hit area via padding ou wrapper).

> Tamanho mínimo de toque: **44×44px** em mobile.

### Cards de Instrutor (busca do aluno)

```
bg-surface  rounded-lg  shadow-card  p-4
├── Foto (64px avatar  rounded-full)
├── Nome (text-h3)
├── Avaliação (estrelas + número)
├── Categoria CNH (badge: A / B / A+B)
├── Bairro + distância (text-sm text-muted)
├── Valor/hora (text-h3 text-primary font-semibold)
└── Botão "Ver horários" (CTA laranja  w-full)
```

### Slots de Agenda

```
Disponível:     bg-accent-light   text-accent    border border-accent   rounded-md
Agendado:       bg-primary-light  text-primary   border border-primary  rounded-md
Concluído:      bg-surface-muted  text-text-muted                       rounded-md
Bloqueado:      bg-error-light    text-error     border border-error    rounded-md
```

### Badges de Status

```
Ativo:          bg-accent-light    text-accent    text-xs font-medium px-2 py-0.5 rounded-full
Pendente:       bg-warning-light   text-warning   text-xs font-medium px-2 py-0.5 rounded-full
Suspenso:       bg-error-light     text-error     text-xs font-medium px-2 py-0.5 rounded-full
```

### Inputs

```
border border-border  rounded-sm  px-3 py-3  text-body  bg-surface
focus: border-primary  ring-2 ring-primary/20
error: border-error    ring-2 ring-error/20
label: text-sm font-medium text-text  mb-1
helper: text-xs text-text-muted  mt-1
error-msg: text-xs text-error  mt-1
```

---

## Ícones

**Biblioteca:** Lucide React (`lucide-react`) — traço uniforme, stroke 1.5px.  
**Tamanhos padrão:** 16px (inline), 20px (labels/nav), 24px (ações principais).  
> Nunca usar emojis como ícones de interface.

---

## Gráficos (Painel do Instrutor)

**Biblioteca:** Recharts  
**Paleta de dados:**

```
Série 1 (aulas/receita):     #0284C7  (primary)
Série 2 (comparativo):       #059669  (accent)
Série 3 (cancelamentos):     #DC2626  (error)
Série 4 (pendentes):         #F59E0B  (warning)
Grid lines:                  #E0F0F8  (border — baixo contraste)
Tooltip background:          #0F172A  texto #FFFFFF
```

---

## Estados vazios

Todo estado vazio deve ter:
1. Ícone ilustrativo (Lucide, 48px, `text-text-muted`)
2. Título curto (`text-h3`)
3. Descrição explicativa (`text-sm text-muted`)
4. Ação sugerida (botão ou link)

Exemplo: *"Nenhuma aula agendada — Explore instrutores disponíveis perto de você"*

---

## Acessibilidade (mínimos obrigatórios)

- Contraste texto/fundo: mínimo **4.5:1** (WCAG AA)
- Tamanho mínimo de toque: **44×44px**
- Todos inputs com `<label>` associado
- Erros com `aria-live="polite"` ou `role="alert"`
- Foco visível: `ring-2 ring-primary` em todos elementos interativos
- Cores nunca são o único indicador de estado (sempre + ícone ou texto)

---

## Anti-padrões (nunca fazer)

- Hex direto no código (usar sempre tokens)
- Emojis como ícones
- Texto abaixo de 12px
- Botões sem feedback visual de press/loading
- Inputs com placeholder como único label
- Erros apenas no topo do formulário
- Misturar bottom nav + top nav no mesmo breakpoint
- Creditar carteira antes da aula ser confirmada como concluída

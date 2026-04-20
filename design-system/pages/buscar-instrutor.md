# Tela Buscar Instrutor — CNH Simples
> Inspiração: Preply "Find Tutor" page. Mobile-first. Consultar MASTER.md para tokens.

---

## Objetivo da Tela
Permitir ao aluno encontrar e escolher um instrutor com base em localização, preço, avaliação e categoria de CNH.

**Rota:** `/buscar` ou `/instrutores`  
**Acesso:** público (sem login) para visualizar. Login obrigatório para agendar.

---

## Layout Desktop (≥ 1024px)

```
┌────────────────────────────────────────────────────────┐
│ NAVBAR                                                 │
├──────────────────┬─────────────────────────────────────┤
│                  │  Heading + ordenação                │
│  SIDEBAR         │  ─────────────────────────────────  │
│  DE FILTROS      │  [Card] [Card] [Card]               │
│  (240px fixo)    │  [Card] [Card] [Card]               │
│                  │  [Card] [Card] [Card]               │
│                  │  ─────────────────────────────────  │
│                  │  Paginação                          │
└──────────────────┴─────────────────────────────────────┘
```

---

## Layout Mobile (< 768px)

```
┌────────────────────────────┐
│ [🔍 Buscar...] [⚙ Filtros] │  ← barra sticky no topo
├────────────────────────────┤
│ Ordenar: ▾ Melhor avaliação│
├────────────────────────────┤
│ [Card instrutor]           │
│ [Card instrutor]           │
│ [Card instrutor]           │
│ ...                        │
└────────────────────────────┘
```
Filtros no mobile: **bottom sheet** deslizável (ao clicar em ⚙ Filtros)

---

## Sidebar de Filtros

```
┌─────────────────────────┐
│  Filtrar instrutores    │  ← Inter 600, 14px
│                         │
│  📍 Localização         │
│  [Campo CEP/bairro    ] │
│  Raio: ○5km ●10km ○20km │
│                         │
│  🚗 Categoria de CNH    │
│  ☑ Categoria B (carro)  │
│  ☑ Categoria A (moto)   │
│                         │
│  💰 Valor por aula      │
│  R$──●────────── R$300  │  ← range slider
│  R$50 até R$150         │
│                         │
│  ⭐ Avaliação mínima    │
│  ○ Qualquer  ●4+  ○4.5+ │
│                         │
│  📅 Disponibilidade     │
│  [Seg] [Ter] [Qua]      │
│  [Qui] [Sex] [Sáb] [Dom]│
│                         │
│  🎯 Objetivo da aula    │
│  ☐ Tirar CNH            │
│  ☐ Perder medo          │
│  ☐ Exame DETRAN         │
│  ☐ Praticar             │
│                         │
│  [Limpar filtros]       │
└─────────────────────────┘
```

**Visual da sidebar:**
- Fundo: `#FFFFFF`, borda direita `1px solid #E2E8F0`
- Cada seção separada por `border-b border-[#E2E8F0]` + `py-4`
- Labels: Inter 500, 13px, `text-[#0F172A]`
- Checkboxes/radios: cor `#3ECF8E` quando marcado (verde Supabase)

---

## Header da Listagem

```
┌────────────────────────────────────────────────┐
│  47 instrutores disponíveis perto de você      │  ← contagem dinâmica
│                                                │
│  Ordenar por: [Melhor avaliação ▾]             │
│  Opções: Melhor avaliação / Menor preço /      │
│           Maior preço / Mais próximo           │
└────────────────────────────────────────────────┘
```

---

## Card de Instrutor

Inspirado no card do Preply, adaptado para instrutores de direção.

```
┌──────────────────────────────────────────────────┐
│  ┌──────┐  João Silva              ⭐ 4.9 (38)   │
│  │ foto │  Categoria B · Meireles               │
│  │ 64px │  📍 3.2 km de você       [Super Inst.] │  ← badge verde
│  └──────┘                                        │
│                                                  │
│  "Instrutor paciente, especializado em           │
│  quem tem medo de dirigir. +5 anos..."           │  ← bio truncada (2 linhas)
│                                                  │
│  🏆 142 aulas  ·  👥 38 alunos formados          │
│                                                  │
│  R$ 80/aula                                      │  ← Inter 700, 18px, text-primary
│                                                  │
│  [Ver horários disponíveis]                      │  ← botão CTA laranja, w-full
└──────────────────────────────────────────────────┘
```

**Especificações do card:**
- Container: `bg-white rounded-[12px] shadow-card p-4 border border-[#E2E8F0]`
- Hover: `shadow-raised border-[#3ECF8E]` (transição 150ms)
- Foto: `64px × 64px rounded-full object-cover`
- Nome: Inter 600, 16px, `text-[#0F172A]`
- Categoria + bairro: Inter 400, 13px, `text-[#64748B]`
- Distância: Inter 400, 13px, ícone MapPin Lucide 14px
- Bio: Inter 400, 14px, `text-[#475569]`, `line-clamp-2`
- Preço: Inter 700, 18px, `text-[#0284C7]`
- Botão: `bg-[#F97316] text-white rounded-[6px] py-2 px-4 text-sm font-medium w-full`

**Badges:**
- `Super Instrutor`: `bg-[#D1FAE5] text-[#065F46]` (top avaliado + muitas aulas)
- `Novo`: `bg-[#FEF3C7] text-[#92400E]`
- `Em alta`: `bg-[#E0F2FE] text-[#0369A1]` (muitos agendamentos recentes)

---

## Grid de Cards

- Desktop: 3 colunas (`grid-cols-3 gap-6`)
- Tablet: 2 colunas (`grid-cols-2 gap-4`)
- Mobile: 1 coluna (`grid-cols-1 gap-4`)

---

## Skeleton Loading

Enquanto carrega, exibir 6 cards com shimmer:
- `bg-gray-200 rounded animate-pulse` nos campos de texto e foto

---

## Estado Vazio

```
┌────────────────────────────────────┐
│  🔍                                │
│  Nenhum instrutor encontrado       │
│  para esses filtros.               │
│                                    │
│  Tente ampliar o raio de busca     │
│  ou remover alguns filtros.        │
│                                    │
│  [Limpar filtros]                  │
└────────────────────────────────────┘
```

---

## Paginação

- 12 cards por página (mobile) / 18 cards por página (desktop)
- Paginação numérica: `← 1 2 3 ... 12 →`
- Botões: `rounded-[6px] border border-[#E2E8F0]`
- Ativo: `bg-[#3ECF8E] text-[#0F172A]`

---

## Regras de Negócio
- Só aparecem instrutores com `status = ativo` e mensalidade em dia
- Ordenação padrão: por distância + avaliação combinados
- Filtro de localização usa lat/long do aluno (se logado) ou do CEP digitado
- Badge "Super Instrutor": avaliação ≥ 4.8 e ≥ 50 aulas concluídas
- Badge "Em alta": ≥ 5 agendamentos nos últimos 7 dias
- Instrutor sem avaliações: exibe "Novo" e aparece ao final da listagem

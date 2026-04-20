# Tela Inicial (Homepage) — CNH Simples
> Inspiração: Preply homepage. Mobile-first. Consultar MASTER.md para tokens.

---

## Objetivo da Tela
Converter visitante em aluno (busca de instrutor) ou atrair novos instrutores (CTA secundário).  
A busca de instrutor é o **único CTA primário** do hero.

---

## Estrutura Geral (top → bottom)

### 1. Navbar (fixo no topo)
```
[Logo CNH Simples]          [Encontrar Instrutor] [Seja Instrutor] [Entrar]
```
- Mobile: hamburger menu + botão "Entrar" visível
- Fundo: transparente no hero, `#1c1c1c` (sidebar dark) ao rolar

---

### 2. Hero Section (acima do fold — tela cheia no mobile)

**Layout:** texto à esquerda + imagem à direita (desktop) | empilhado (mobile)

```
┌────────────────────────────────────────────┐
│                                            │
│  Aprenda a dirigir com                     │
│  quem entende de verdade.                  │  ← headline: Inter 700, 40px desktop / 28px mobile
│                                            │
│  Instrutores autônomos credenciados        │  ← subtítulo: Inter 400, 18px, text-muted
│  perto de você em Fortaleza.               │
│                                            │
│  ┌─────────────────────────────────────┐   │
│  │ 📍 Seu CEP ou bairro...   [Buscar]  │   │  ← campo de busca principal (CTA laranja)
│  └─────────────────────────────────────┘   │
│                                            │
│  🚗 Categoria B    🏍️ Categoria A          │  ← filtros rápidos abaixo do campo
│                                            │
└────────────────────────────────────────────┘
```

**Regras:**
- Campo de busca: aceita CEP ou nome do bairro → redireciona para /instrutores com filtro aplicado
- Botão "Buscar": `bg-[#F97316]` (laranja CTA), `rounded-[6px]`, Inter 500
- Imagem: foto real de aula de direção (instrutor + aluno no carro) — não ilustração
- Background hero: branco ou gradiente muito sutil `#F8FAFC → #FFFFFF`

---

### 3. Social Proof (números) — logo abaixo do hero

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  +50          │  4.9★         │  +200         │  100%         │
│  Instrutores  │  Avaliação    │  Alunos       │  Credenciados │
│  ativos       │  média        │  formados     │  DETRAN-CE    │
└──────────────┴──────────────┴──────────────┴──────────────┘
```
- 4 métricas em row (scroll horizontal no mobile se necessário)
- Número: Inter 700, 28px, `text-[#3ECF8E]` (verde Supabase)
- Label: Inter 400, 14px, `text-muted`

---

### 4. Como Funciona (3 passos)

```
① Encontre      → ② Agende       → ③ Dirija
seu instrutor      um horário        com confiança
```
- Ícones Lucide (24px, `text-[#3ECF8E]`)
- Cada passo: ícone + título (Inter 600, 16px) + descrição curta (Inter 400, 14px, muted)
- Layout: 3 colunas desktop / lista vertical mobile

---

### 5. Instrutores em Destaque

```
Heading: "Conheça alguns instrutores"
Subheading: "Todos credenciados pelo DETRAN-CE"

[Card] [Card] [Card] [Card]  ← scroll horizontal no mobile (snap)
```
- 4 cards de instrutor (mesmos cards da tela de busca)
- Botão: "Ver todos os instrutores" → `/instrutores`

---

### 6. Para Instrutores (CTA secundário)

```
┌─────────────────────────────────────────────┐
│  Você é instrutor autônomo?                 │
│  Conecte-se com alunos em Fortaleza.        │
│                                             │
│  [Cadastre-se como instrutor]               │  ← botão verde Supabase #3ECF8E
└─────────────────────────────────────────────┘
```
- Fundo: `#1c1c1c` (dark sidebar Supabase) para contraste
- Texto: `#f4f4f5`
- Listar 3 benefícios rápidos: defina seus horários / receba online / sem taxa de matrícula

---

### 7. Depoimentos

- 3 cards de avaliação real (nome, foto, nota, texto curto)
- Fundo: `#F1F5F9` (surface-muted)

---

### 8. Footer

```
[Logo]  Sobre  Termos  Privacidade  Contato
© 2025 CNH Simples — Fortaleza, CE
```

---

## Regras de Negócio na Tela
- Instrutor NÃO aparece na home se mensalidade vencida
- Instrutores em destaque = melhor avaliação + ativos
- Busca por CEP → usa lat/long via Nominatim → redireciona para /instrutores?lat=X&lng=Y

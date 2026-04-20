# Telas de Login e Cadastro — CNH Simples
> Diferente do Preply (login unificado), CNH Simples separa o fluxo de aluno e instrutor desde o início.

---

## Decisão de Design

O Preply usa login unificado (detecta o tipo de conta pelo e-mail).  
No CNH Simples, **a separação é explícita e visual** porque:
- Aluno: fluxo simples, Google login, sem documentação
- Instrutor: fluxo complexo, upload de documentos, pagamento de mensalidade

Manter juntos confundiria o usuário e diluiria o CTA.

---

## Tela de Entrada (escolha de perfil)

Exibida ao clicar em "Entrar" na navbar ou ao tentar acessar área restrita.

```
┌─────────────────────────────────────────────┐
│                                             │
│          [Logo CNH Simples]                 │
│                                             │
│      Bem-vindo! Como você quer entrar?      │  ← Inter 600, 22px
│                                             │
│  ┌──────────────┐    ┌──────────────────┐   │
│  │  🎓           │    │  🚗               │   │
│  │  Sou Aluno   │    │  Sou Instrutor   │   │
│  │              │    │                  │   │
│  │  Grátis      │    │  Plano mensal    │   │
│  └──────────────┘    └──────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Cards de seleção:**
- Borda: `border border-[#333]`, `rounded-[8px]`
- Hover/selecionado: `border-[#3ECF8E]` + sombra sutil
- Ícone: Lucide, 32px, `text-[#3ECF8E]`
- Título: Inter 600, 18px
- Subtítulo: Inter 400, 13px, muted

Clicar em um card abre o respectivo modal/página de login.

---

## Login do Aluno

**Rota:** `/login/aluno`  
**Layout:** card centralizado, fundo `#F8FAFC`, logo no topo

```
┌─────────────────────────────────┐
│        [Logo CNH Simples]       │
│                                 │
│   Entrar como Aluno             │  ← Inter 700, 22px
│                                 │
│  ┌─────────────────────────┐    │
│  │  G  Continuar com Google│    │  ← botão branco, borda #E2E8F0, texto #0F172A
│  └─────────────────────────┘    │
│                                 │
│  ─────────── ou ───────────     │
│                                 │
│  E-mail                         │
│  ┌─────────────────────────┐    │
│  │ seu@email.com           │    │
│  └─────────────────────────┘    │
│                                 │
│  Senha                          │
│  ┌─────────────────────────┐    │
│  │ ••••••••          👁    │    │
│  └─────────────────────────┘    │
│                                 │
│  [Esqueci minha senha]          │  ← link pequeno, direita
│                                 │
│  ┌─────────────────────────┐    │
│  │       Entrar            │    │  ← bg-[#3ECF8E], texto escuro, rounded-[6px]
│  └─────────────────────────┘    │
│                                 │
│  Não tem conta?  Cadastre-se    │  ← link → /cadastro/aluno
│                                 │
│  ← Voltar  (trocar para Instrutor)│
└─────────────────────────────────┘
```

**Autenticação:** Supabase Auth — Google OAuth + e-mail/senha  
**Após login:** redireciona para `/buscar` (tela de busca de instrutores)

---

## Login do Instrutor

**Rota:** `/login/instrutor`  
**Layout:** card centralizado, mesmo estilo do aluno

```
┌─────────────────────────────────┐
│        [Logo CNH Simples]       │
│                                 │
│   Entrar como Instrutor         │  ← Inter 700, 22px
│                                 │
│  E-mail                         │
│  ┌─────────────────────────┐    │
│  │ seu@email.com           │    │
│  └─────────────────────────┘    │
│                                 │
│  Senha                          │
│  ┌─────────────────────────┐    │
│  │ ••••••••          👁    │    │
│  └─────────────────────────┘    │
│                                 │
│  [Esqueci minha senha]          │
│                                 │
│  ┌─────────────────────────┐    │
│  │       Entrar            │    │  ← bg-[#3ECF8E]
│  └─────────────────────────┘    │
│                                 │
│  Não tem conta?  Quero me       │
│  cadastrar como instrutor →     │  ← link → /cadastro/instrutor
│                                 │
│  ← Voltar  (trocar para Aluno)  │
└─────────────────────────────────┘
```

**Sem Google login para instrutor** — exige validação de documentos; e-mail/senha é mais controlável.  
**Após login:** redireciona para `/painel` (dashboard do instrutor)

**Estados pós-login instrutor:**
- `docs_pending` → tela de upload de documentos
- `docs_rejected` → tela de reenvio com motivo
- `mensalidade_pendente` → tela de pagamento de mensalidade
- `ativo` → `/painel`

---

## Cadastro do Aluno

**Rota:** `/cadastro/aluno`  
Fluxo em 2 etapas:

**Etapa 1 — Conta**
- Google OAuth (preenche nome + foto automaticamente) OU e-mail + senha
- CPF, telefone, data de nascimento

**Etapa 2 — Perfil de aprendizado**
- CEP → bairro preenchido automaticamente
- Já tem CNH? (sim/não)
- Categoria de interesse (A/B/A+B)
- Objetivo das aulas (múltipla escolha)

Progress bar no topo: `● ─ ○` (etapa 1 de 2)

---

## Cadastro do Instrutor

**Rota:** `/cadastro/instrutor`  
Fluxo em 4 etapas com progress bar:

```
① Conta → ② Dados profissionais → ③ Localização → ④ Documentos
```

Detalhes de cada etapa: ver `CLAUDE.md → Formulário de Cadastro do Instrutor`.  
Ao finalizar: status `em_analise` → aguardar aprovação do Adm por e-mail.

---

## Regras Visuais Comuns (login/cadastro)

- Card centralizado: `max-w-md`, `rounded-[12px]`, `shadow-modal`, `bg-white`, `p-8`
- Fundo da página: `#F8FAFC`
- Input height: mínimo `44px` (touch target)
- Label acima do input (nunca placeholder como label)
- Erro: texto vermelho `text-[#DC2626]` abaixo do campo
- Botão principal: largura total `w-full`, altura `44px`, `bg-[#3ECF8E]`
- Link "Voltar / trocar tipo": pequeno, muted, no rodapé do card

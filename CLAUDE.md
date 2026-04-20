# CNH Simples — Plataforma de Conexão Instrutor x Aluno

## Visão Geral

Marketplace que conecta **instrutores autônomos de direção** com **alunos**, gerenciando agendamento, pagamentos e repasses de forma centralizada.

- **Região de atuação inicial:** Fortaleza e Região Metropolitana (CE)
- **Gateway de pagamento:** Mercado Pago
- **Conta receptora:** Conta PJ do administrador da plataforma
- **Transferência ao instrutor:** Manual (PIX/TED feito pelo administrador)

---

## Atores do Sistema

| Ator | Descrição |
|------|-----------|
| **Instrutor** | Profissional autônomo credenciado pelo DETRAN-CE. Paga mensalidade para estar na plataforma. |
| **Aluno** | Usuário que busca aulas de direção. Acesso gratuito à plataforma. |
| **Administrador** | Gerencia a plataforma, aprova saques, monitora carteiras, realiza transferências manuais. |

---

## Regras de Negócio

### Instrutores
- Devem se cadastrar e pagar uma **mensalidade** para aparecer na plataforma e receber alunos.
- Instrutor com mensalidade vencida não aparece nas buscas / não recebe novos agendamentos.
- Cada instrutor tem uma **Carteira** interna com saldo disponível para saque.
- O instrutor pode solicitar **saque** a qualquer momento.
- O saque é **aprovado manualmente** pelo administrador.
- Ao aprovar o saque, o sistema subtrai o valor da carteira do instrutor.

### Alunos
- Cadastro e acesso **gratuito**.
- Escolhe um instrutor disponível na plataforma.
- Visualiza os **slots de horários disponíveis** (grade por hora) na agenda do instrutor.
- Realiza o pagamento pela plataforma no momento do agendamento.

### Pagamentos e Split
- **Todo pagamento do aluno vai para a conta PJ do administrador** via Mercado Pago.
- Cada aula tem um percentual definido de split:
  - **Parte da plataforma** → entra na carteira/receita da plataforma.
  - **Parte do instrutor** → entra na carteira virtual do instrutor (saldo a receber).
- O percentual de split é configurável pelo administrador.
- Não há transferência automática ao instrutor — apenas registro de saldo na carteira virtual.

### Carteiras
| Carteira | Quem controla | O que entra | O que sai |
|----------|--------------|-------------|-----------|
| Carteira do Instrutor | Sistema + Adm | Parte do split de cada aula | Saques aprovados pelo Adm |
| Carteira da Plataforma | Adm | Parte do split + mensalidades | Custos operacionais (controle manual) |

### Saques
1. Instrutor solicita saque informando valor (≤ saldo disponível).
2. Administrador revisa e aprova ou rejeita.
3. Ao aprovar: o sistema registra a transferência e subtrai o valor da carteira do instrutor.
4. A transferência bancária em si é feita **manualmente** pelo administrador (PIX/TED).

---

## Fluxos Principais

### Fluxo 1 — Cadastro do Instrutor
```
Instrutor se registra
  → Preenche perfil (nome, foto, bio, bairros/regiões de atendimento, valor/hora, categoria CNH)
  → Envia documentação para validação pelo Adm (ver seção "Documentação do Instrutor")
  → Adm valida documentação → conta liberada
  → Instrutor paga mensalidade via Mercado Pago
  → Conta ativada → aparece na plataforma
```

### Fluxo 2 — Agendamento pelo Aluno
```
Aluno se cadastra (gratuito)
  → Busca instrutores (filtros: região, preço, avaliação, categoria)
  → Escolhe instrutor → visualiza agenda (slots por hora)
  → Seleciona slot disponível
  → Realiza pagamento (cartão, PIX via Mercado Pago) → vai para conta PJ do Adm
  → Slot bloqueado na agenda do instrutor
  → Sistema registra split: crédito na carteira do instrutor + carteira da plataforma
  → Notificação para instrutor e aluno
```

### Fluxo 3 — Conclusão da Aula e Repasse
```
Aula realizada (confirmada pelo instrutor ou automaticamente após horário)
  → Sistema aplica split percentual sobre o valor da aula
  → Parte instrutor → creditada na Carteira Virtual do Instrutor
  → Parte plataforma → creditada na Carteira da Plataforma
```

### Fluxo 4 — Saque do Instrutor
```
Instrutor solicita saque
  → Informa valor ≤ saldo disponível
  → Adm recebe notificação
  → Adm aprova (ou rejeita com justificativa)
  → Sistema subtrai valor da carteira do instrutor
  → Adm realiza transferência manual (PIX/TED) via banco
```

---

## Documentação Exigida do Instrutor (DETRAN / Legislação Federal)

> Fonte: Regulamentação de instrutores autônomos de trânsito — Lei Federal / SENATRAN (2025)

### Requisitos Pessoais
- Ter no mínimo **21 anos de idade**
- Possuir **CNH válida** compatível com a categoria que irá lecionar:
  - Categoria **A** → aulas de moto
  - Categoria **B** → aulas de carro
- Habilitado há pelo menos **2 anos** na categoria
- **Sem penalidade** de suspensão ou cassação da CNH
- **Sem infrações gravíssimas** nos 12 meses anteriores ao credenciamento


### Credenciamento no DETRAN
- Registro junto ao **DETRAN-CE** com autorização para exercer a atividade
- Nome registrado no **Ministério dos Transportes**
- **Carteira de Identificação Profissional** de instrutor autônomo (emitida gratuitamente pela SENATRAN)

### Documentos a Enviar na Plataforma (validação pelo Adm)
| Documento | Observação |
|-----------|-----------|
| RG / CNH (frente e verso) | Documento de identidade |
| CPF | Pode ser o da CNH |
| CNH válida | Compatível com categoria de ensino |
| Credencial/Autorização do DETRAN-CE | Comprovando estar habilitado a dar aulas |

---

## Formulário de Cadastro do Instrutor

### Dados Pessoais
| Campo | Tipo | Validação / Observação |
|-------|------|------------------------|
| Nome completo | texto | Obrigatório |
| Data de nascimento | data | Obrigatório — validar idade mínima 21 anos |
| CPF | texto | Obrigatório — formato 000.000.000-00, único no sistema |
| E-mail | email | Obrigatório — único, usado para login (Supabase Auth) |
| Senha | senha | Obrigatório — mín. 8 caracteres |
| Telefone / WhatsApp | texto | Obrigatório — formato (85) 9XXXX-XXXX |
| Foto de perfil | imagem | Obrigatório — upload para Supabase Storage |

### Localização (via CEP + Nominatim)
| Campo | Tipo | Observação |
|-------|------|-----------|
| CEP | texto | Obrigatório — dispara busca no Nominatim ao sair do campo |
| Logradouro | texto | Preenchido automaticamente via CEP |
| Número | texto | Preenchido pelo instrutor |
| Bairro | texto | Preenchido automaticamente via CEP |
| Cidade | texto | Preenchido automaticamente — fixo: Fortaleza ou cidades da RM |
| Estado | texto | Fixo: CE |
| Latitude | decimal | Gerado pelo Nominatim — salvo no banco, não exibido |
| Longitude | decimal | Gerado pelo Nominatim — salvo no banco, não exibido |
| Raio de atendimento (km) | número | Instrutor define o raio a partir de sua localização (ex.: 5, 10, 15 km) |

> **Fluxo Nominatim:** ao informar o CEP → `GET https://nominatim.openstreetmap.org/search?postalcode={CEP}&country=Brazil&format=json&addressdetails=1` → preenche logradouro/bairro/cidade → salva lat/long. O aluno ao buscar instructores usa sua própria localização e o sistema filtra por distância usando lat/long.

### Dados Profissionais
| Campo | Tipo | Observação |
|-------|------|-----------|
| Categoria da CNH | seleção | A (moto), B (carro), A+B |
| Número da CNH | texto | Obrigatório |
| Validade da CNH | data | Obrigatório — alertar se próxima do vencimento |
| Número do Registro DETRAN | texto | Número da **Credencial de Instrutor Autônomo** emitida pelo DETRAN-CE / SENATRAN |
| Validade da Credencial DETRAN | data | Credencial é renovada anualmente (válida até 31/dez de cada ano) |
| Valor por aula (R$) | decimal | Obrigatório — definido pelo próprio instrutor |
| Biografia / Apresentação | texto longo | Opcional — exibido no perfil público |
| Anos de experiência | número | Opcional |

### Dados Bancários (para saque)
| Campo | Tipo | Observação |
|-------|------|-----------|
| Tipo de chave PIX | seleção | CPF, e-mail, telefone, chave aleatória |
| Chave PIX | texto | Obrigatório para solicitar saques |

### Upload de Documentos
| Documento | Formato aceito | Obrigatório | Observação |
|-----------|---------------|-------------|-----------|
| CNH (frente e verso) | JPG, PNG, PDF | Sim | Validada pelo Adm |
| **Credencial de Instrutor Autônomo** (emitida pelo DETRAN-CE/SENATRAN) | JPG, PNG, PDF | Sim | Documento oficial que comprova credenciamento; renovado anualmente |

> **Sobre a Credencial DETRAN:** documento oficial denominado **"Credencial de Instrutor Autônomo de Trânsito"** (também chamada Carteira de Identificação Profissional — CIP), emitida pela SENATRAN/DETRAN após aprovação no curso de formação e registro. Tem validade anual (até 31/dez). É o crachá que o instrutor porta durante as aulas.

### Status do Cadastro
O cadastro passa pelos seguintes estados antes de ser ativado:
```
em_analise → documentos_aprovados → mensalidade_paga → ativo
                ↓
           documentos_reprovados (Adm informa motivo → instrutor reenvia)
```

---

### Documentos Obrigatórios Durante as Aulas (responsabilidade do instrutor)
- CNH válida
- Credencial de instrutor (crachá do DETRAN)
- Licença de Aprendizagem Veicular do aluno
- CRLV do veículo utilizado

### Requisitos do Veículo de Ensino
- Pode ser do instrutor ou do aluno
- Deve estar dentro do limite de idade permitido pelo DETRAN
- Adesivo/identificação de veículo de ensino
- Seguro em dia
- Manutenção em conformidade com o CTB
- Aulas devem ser informadas ao DETRAN regional

---

## Cadastro e Perfil do Aluno

### Autenticação
- Login via **Google (Gmail)** — OAuth pelo Supabase Auth (sem senha para criar)
- Alternativamente: e-mail + senha (para quem não usa Gmail)

### Dados do Perfil (preenchidos após primeiro login)
| Campo | Tipo | Validação / Observação |
|-------|------|------------------------|
| Nome completo | texto | Pré-preenchido com o nome do Google, editável |
| CPF | texto | Obrigatório — formato 000.000.000-00, único |
| Data de nascimento | data | Obrigatório |
| Telefone / WhatsApp | texto | Obrigatório — (85) 9XXXX-XXXX |
| Foto | imagem | Pré-preenchida com foto do Google, editável |

### Localização
| Campo | Tipo | Observação |
|-------|------|-----------|
| CEP | texto | Obrigatório — dispara busca no Nominatim |
| Bairro | texto | Preenchido automaticamente via CEP |
| Cidade | texto | Preenchido automaticamente |
| Latitude | decimal | Gerado pelo Nominatim — usado para calcular distância até instrutores |
| Longitude | decimal | Gerado pelo Nominatim |

> Localização usada para **ordenar instrutores por proximidade** na busca.

### Perfil de Aprendizado
| Campo | Tipo | Opções |
|-------|------|--------|
| Já possui CNH? | seleção | Sim / Não |
| Categoria de interesse | seleção | A (moto), B (carro), A+B |
| Objetivo das aulas | múltipla escolha | Ver opções abaixo |

**Opções de objetivo (múltipla escolha):**
- Tirar a CNH pela primeira vez
- Passar no exame prático do DETRAN
- Perder o medo de dirigir
- Praticar após longo tempo sem dirigir
- Aprender a dirigir em situações específicas (estacionamento, rodovia, noturno)
- Outro (campo livre)

> O objetivo é exibido para o instrutor antes da aula, ajudando na preparação. Também pode ser usado como filtro de busca no futuro.

### Tela do Aluno (pós-cadastro)
Sem dashboard. Acesso restrito a:

1. **Buscar instrutor** — filtros: categoria, distância, faixa de preço, avaliação (tela principal)
2. **Histórico de aulas** — lista simples de aulas agendadas, concluídas e canceladas com data, instrutor e valor
3. **Meu perfil** — editar dados pessoais e objetivo das aulas

> Sem gráficos, indicadores ou carteira. Fluxo do aluno é intencionalmente simples: buscar → agendar → pagar → acompanhar.

---

## Painel do Instrutor (Dashboard)

Tela principal do instrutor após login. Dividida em seções: **Resumo**, **Gráficos**, **Agenda**, **Histórico** e **Carteira**.

---

### Indicadores (cards de topo)

| Indicador | Descrição |
|-----------|-----------|
| Aulas hoje | Quantidade de aulas agendadas para o dia atual |
| Aulas no mês | Total de aulas realizadas no mês corrente |
| Receita do mês | Valor total (parte do instrutor) creditado no mês |
| Saldo disponível | Saldo atual na carteira virtual para saque |
| Avaliação média | Média das notas recebidas dos alunos (estrelas) |
| Próxima aula | Horário e nome do aluno da próxima aula |

---

### Gráficos

| Gráfico | Tipo | Dados |
|---------|------|-------|
| Aulas por período | Linha ou barras | Quantidade de aulas por dia/semana/mês (filtro de período) |
| Receita por período | Barras | Valor recebido por semana/mês |
| Distribuição por status | Pizza/Donut | Aulas concluídas vs. canceladas vs. agendadas |
| Alunos novos vs. recorrentes | Barras empilhadas | Distinção entre alunos que voltam e novos |
| Avaliações recebidas | Barras | Distribuição de notas (1 a 5 estrelas) |

> Biblioteca recomendada: **Recharts** (funciona nativamente com React/Next.js, leve e customizável).

---

### Agenda (Gestão de Slots)

- Visualização em **calendário semanal e mensal** (componente shadcn/ui Calendar + grade customizada)
- Instrutor pode **abrir e fechar slots** por hora em qualquer dia
- Slots com cores distintas: disponível (verde), agendado (azul), concluído (cinza), cancelado (vermelho)
- Ao clicar em um slot agendado: ver nome do aluno, telefone, status e ação (confirmar conclusão / cancelar)
- Opção de **bloquear dias inteiros** (ex.: feriados, folga)
- Opção de **copiar disponibilidade** de uma semana para outra

---

### Histórico de Aulas

Tabela paginada com filtros:

| Coluna | Descrição |
|--------|-----------|
| Data/Hora | Data e horário da aula |
| Aluno | Nome do aluno |
| Categoria | A ou B |
| Duração | Em horas |
| Valor da aula | Total cobrado |
| Sua parte | Valor creditado na carteira (após split) |
| Status | Concluída / Cancelada / Agendada |
| Avaliação | Nota dada pelo aluno (se houver) |

Filtros disponíveis: período (data inicial/final), status, categoria.
Export para CSV — a definir.

---

### Histórico da Carteira

Extrato de todas as movimentações da carteira virtual:

| Coluna | Descrição |
|--------|-----------|
| Data | Data da transação |
| Descrição | Ex.: "Aula concluída — João Silva" ou "Saque aprovado" |
| Tipo | Crédito (entrada) ou Débito (saída) |
| Valor | Valor da movimentação |
| Saldo após | Saldo da carteira após a transação |

---

### Gestão de Saques

- Exibe **saldo disponível** em destaque
- Botão **"Solicitar Saque"** → modal com:
  - Valor a sacar (máximo = saldo disponível)
  - Chave PIX cadastrada (exibida, com opção de editar)
  - Confirmação
- Histórico de saques com status: pendente / aprovado / rejeitado + motivo da rejeição

---

### Gestão do Perfil

- Editar foto, bio, valor por hora, raio de atendimento
- Atualizar chave PIX
- Reenviar documentos (caso rejeitados pelo Adm)
- Ver status da mensalidade e data de vencimento
- Botão para renovar mensalidade

---

## Entidades de Dados (conceitual)

- **User** (base): id, name, email, password, role (admin | instructor | student), auth_provider (email | google), created_at
- **StudentProfile**: user_id, full_name, cpf, birth_date, phone, photo_url, cep, neighborhood, city, latitude, longitude, has_cnh (bool), category_interest (A|B|AB), lesson_goals (array), created_at
- **InstructorProfile**: user_id, full_name, cpf, birth_date, phone, photo_url, bio, hourly_rate, experience_years, category (A|B|AB), cnh_number, cnh_expires_at, detran_credential_number, detran_credential_expires_at, cep, street, number, neighborhood, city, state, latitude, longitude, service_radius_km, pix_key_type, pix_key, rating, status (pending | docs_rejected | docs_approved | active | inactive | suspended)
- **InstructorDocument**: instructor_id, type (cnh | detran_credential), file_url, verified, verified_at, rejected_reason
- **Subscription** (mensalidade): instructor_id, plan, value, status, expires_at, mp_payment_id
- **AvailabilitySlot**: instructor_id, date, hour, status (available | booked)
- **Booking** (agendamento): student_id, instructor_id, slot_id, value, status (pending | confirmed | completed | cancelled), payment_id
- **Payment**: booking_id, total_amount, platform_amount, instructor_amount, status, mp_payment_id, paid_at
- **Wallet** (carteira): owner_id, owner_type (instructor | platform), balance
- **WithdrawalRequest** (saque): instructor_id, amount, pix_key, status (pending | approved | rejected), processed_at, admin_note
- **WalletTransaction**: wallet_id, type (credit | debit), amount, description, reference_id, created_at

---

## Design System

Documentado em `design-system/` — consultar antes de implementar qualquer tela.

| Arquivo | Conteúdo |
|---------|---------|
| `design-system/MASTER.md` | Tokens de cor, tipografia, espaçamento, botões, sidebar |
| `design-system/pages/home.md` | Homepage — hero, social proof, como funciona, CTA instrutor |
| `design-system/pages/login.md` | Login/cadastro separado aluno × instrutor |
| `design-system/pages/buscar-instrutor.md` | Listagem de instrutores — filtros, cards, grid (estilo Preply) |
| `design-system/images.md` | Banco de imagens gratuitas (Unsplash/Pixabay) por seção + como usar no Next.js |

| Decisão | Escolha |
|---------|---------|
| Padrão de produto | Marketplace / Booking App |
| Foco de layout | **Mobile-first** (375px base), responsivo até desktop |
| Navegação mobile | **Bottom Navigation Bar** (≤4 itens) |
| Navegação desktop | **Sidebar fixa** (240px) |
| Sidebar e botões | **Estilo Supabase** — dark sidebar slate + verde `#3ECF8E` |
| Fonte (toda plataforma) | **Inter** — igual ao Supabase Studio |
| Brand / botão primário | `#3ECF8E` — verde Supabase |
| Cor CTA do aluno | `#F97316` — laranja (Agendar, Pagar) |
| Fundo global | `#F8FAFC` — slate-50 |
| Ícones | **Lucide React** — stroke 1.5px, nunca emojis |
| Gráficos | **Recharts** |
| Border radius padrão | 12px (cards), 9999px (botões pill) |

---

## Decisões de Arquitetura

| Decisão | Escolha |
|---------|---------|
| Gateway de pagamento | **Mercado Pago** |
| Conta receptora | **Conta PJ do Administrador** |
| Transferência ao instrutor | **Manual** (PIX/TED pelo Adm) |
| Região inicial | **Fortaleza e Região Metropolitana (CE)** |
| Banco de dados | **Supabase** (PostgreSQL + Auth + Storage + RLS) |
| Full-stack | **Next.js 14+ (App Router)** — frontend + API Routes |
| UI | **Tailwind CSS + shadcn/ui** |
| Linguagem | **TypeScript** |
| Pagamentos | **Mercado Pago SDK (Node.js)** + Webhooks |
| Autenticação | **Supabase Auth** (e-mail/senha + magic link) |
| Notificações | A definir |
| Hospedagem | **Vercel** (app) + **Supabase** (banco/storage) |

---

## Percentual de Split (padrão inicial)
- **Plataforma:** 20%
- **Instrutor:** 80%
> Configurável pelo administrador globalmente ou por plano.

---

## Premissas Importantes

1. **Pagamento 100% centralizado na conta PJ do Adm** — Mercado Pago não faz split automático para o instrutor.
2. **Carteira do instrutor é virtual** — representa saldo a receber, não dinheiro em conta bancária própria.
3. **Validação de documentação é manual** — Adm valida docs do instrutor antes de ativar o perfil.
4. **Região restrita a Fortaleza + Região Metropolitana** em fase inicial.
5. **Instrutor deve estar credenciado pelo DETRAN-CE** — a plataforma não credencia, apenas valida o documento.
6. **Aula só conta após ser confirmada como realizada** — crédito na carteira ocorre após conclusão, não no agendamento.
7. **Double-booking impossível** — slot é bloqueado imediatamente após pagamento confirmado.
8. **Mensalidade vencida** — instrutor some das buscas mas mantém acesso ao painel e saldo para saque.
9. **Saque mínimo** — a definir pelo Adm (sugestão: R$ 50,00).
10. **Cancelamentos** — política a definir (prazo para cancelar, reembolso, penalidades).

---

## Notas Importantes para Desenvolvimento
- Nunca creditar na carteira do instrutor antes da aula ser confirmada como realizada.
- Bloqueio de slot deve ser imediato após pagamento confirmado (evitar double-booking).
- Saque só pode ser solicitado se saldo ≥ valor solicitado.
- Instrutor com mensalidade vencida: bloquear novos agendamentos, manter acesso ao painel.
- Todo fluxo de pagamento passa pelo Mercado Pago → conta PJ Adm.
- Nunca transferir automaticamente para o instrutor — sempre aguardar aprovação manual.

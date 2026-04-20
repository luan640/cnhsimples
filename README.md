# cnhsimples

## Fluxo de assinatura do instrutor

- O onboarding inicial do instrutor so termina depois de `cadastro -> documentos -> mensalidade aprovada`.
- Enquanto a mensalidade nao estiver `approved`, o instrutor continua no wizard de pendencia.
- Depois da aprovacao da mensalidade, a home do painel nao deve mais exibir o CTA `Pagar mensalidade`.
- Para assinatura `approved`, a home mostra apenas o resumo do plano e um CTA de gerenciamento.
- Para assinatura `pending`, o sistema deve reaproveitar o checkout existente em vez de criar uma nova cobranca.
- O backend bloqueia a criacao de nova assinatura quando ja existe uma assinatura `approved` vigente.
- O checkout hospedado da mensalidade usa `MERCADO_PAGO_PREAPPROVAL_PLAN_ID`.
- O cancelamento real da assinatura e feito na tela `/planos`, via rota backend dedicada, com update da `preapproval` no Mercado Pago e sincronizacao do status local para `cancelled`.
- Assinatura `cancelled` continua dando acesso somente ate `expires_at`; depois dessa data, o instrutor volta ao wizard na etapa de mensalidade.

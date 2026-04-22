import { NextRequest, NextResponse } from 'next/server'

import { getInstructorProfile } from '@/lib/instructors/dashboard'
import { createInstructorMembershipPayment } from '@/lib/instructors/subscriptions'
import { createClient } from '@/lib/supabase/server'

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function extractError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'object' && error) {
    const message = Reflect.get(error, 'message')
    if (typeof message === 'string' && message.trim()) return message
    const cause = Reflect.get(error, 'cause')
    if (cause instanceof Error && cause.message.trim()) return cause.message
  }

  return 'Falha ao processar pagamento da mensalidade.'
}

function translateMercadoPagoError(message: string): string {
  const normalized = message.trim()
  const lower = normalized.toLowerCase()

  const exactMap: Record<string, string> = {
    'Invalid card_number_validation': 'Numero do cartao invalido. Revise os dados e tente novamente.',
    'Invalid cardholder_name': 'Nome do titular invalido. Revise os dados e tente novamente.',
    'Invalid security_code': 'Codigo de seguranca invalido. Revise os dados e tente novamente.',
    'Invalid expiration_month': 'Mes de validade invalido. Revise os dados do cartao.',
    'Invalid expiration_year': 'Ano de validade invalido. Revise os dados do cartao.',
    'Invalid expiration_date': 'Data de validade invalida. Revise os dados do cartao.',
    'Invalid identification_number': 'CPF do titular invalido. Revise os dados e tente novamente.',
    'Invalid identification_type': 'Tipo de documento invalido. Revise os dados e tente novamente.',
    'Invalid payment_method_id': 'Metodo de pagamento invalido. Tente novamente.',
    'Invalid installments': 'Quantidade de parcelas invalida. Tente novamente.',
    'Invalid issuer_id': 'Banco emissor invalido. Tente novamente.',
    'Invalid card_token_id': 'Nao foi possivel validar o cartao. Gere os dados novamente e tente outra vez.',
    'Invalid token': 'Nao foi possivel validar o cartao. Gere os dados novamente e tente outra vez.',
  }

  if (exactMap[normalized]) {
    return exactMap[normalized]
  }

  if (lower.includes('token')) {
    return 'Nao foi possivel validar o cartao. Gere os dados novamente e tente outra vez.'
  }

  if (lower.includes('card')) {
    return 'Pagamento recusado. Revise os dados do cartao ou tente outro cartao.'
  }

  return normalized
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return errorResponse('Sessao expirada.', 401)
  }

  if (user.user_metadata?.role !== 'instructor') {
    return errorResponse('Apenas instrutores podem pagar mensalidade.', 403)
  }

  const profile = await getInstructorProfile(user.id)

  if (!profile) {
    return errorResponse('Perfil do instrutor nao encontrado.', 404)
  }

  if (profile.status !== 'docs_approved' && profile.status !== 'active') {
    return errorResponse('A mensalidade so pode ser paga apos a aprovacao documental.', 400)
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return errorResponse('Corpo da requisicao invalido.', 400)
  }

  const cardToken = typeof body.card_token === 'string' ? body.card_token : ''
  const cardPaymentMethodId =
    typeof body.card_payment_method_id === 'string' ? body.card_payment_method_id : ''
  const payerEmail =
    typeof body.payer_email === 'string' && body.payer_email.trim()
      ? body.payer_email.trim()
      : user.email ?? ''
  const payerIdentificationType =
    typeof body.payer_identification_type === 'string' ? body.payer_identification_type : 'CPF'
  const payerIdentificationNumber =
    typeof body.payer_identification_number === 'string' ? body.payer_identification_number : ''

  if (!cardToken) {
    return errorResponse('Token do cartao nao fornecido.', 400)
  }

  if (!cardPaymentMethodId) {
    return errorResponse('ID do metodo de pagamento do cartao nao fornecido.', 400)
  }

  if (!payerEmail) {
    return errorResponse('E-mail do pagador nao informado.', 400)
  }

  if (!payerIdentificationNumber.trim()) {
    return errorResponse('Documento do titular nao informado.', 400)
  }

  try {
    const result = await createInstructorMembershipPayment({
      instructorId: profile.id,
      payerEmail,
      cardToken,
      cardPaymentMethodId,
      cardIssuerId:
        typeof body.card_issuer_id === 'string' || typeof body.card_issuer_id === 'number'
          ? body.card_issuer_id
          : null,
      cardInstallments: typeof body.card_installments === 'number' ? body.card_installments : 1,
      payerIdentificationType,
      payerIdentificationNumber,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = translateMercadoPagoError(extractError(error))
    console.error('[instructor-membership/create] Error:', error)

    if (message.toLowerCase().includes('processamento')) {
      return errorResponse(message, 409)
    }

    if (message.toLowerCase().includes('cartao') || message.toLowerCase().includes('token')) {
      return errorResponse(message, 422)
    }

    if (message.toLowerCase().includes('ativa')) {
      return errorResponse(message, 409)
    }

    return errorResponse(message, 500)
  }
}

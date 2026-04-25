import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBookingGroupPayment } from '@/lib/bookings/payments'

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function extractError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'object' && error) {
    const msg = Reflect.get(error as object, 'message')
    if (typeof msg === 'string' && msg.trim()) return msg
    const cause = Reflect.get(error as object, 'cause')
    if (cause instanceof Error) return cause.message
  }
  return 'Falha ao processar pagamento.'
}

function translateMercadoPagoError(message: string): string {
  const normalized = message.trim()
  const lower = normalized.toLowerCase()

  const exactMap: Record<string, string> = {
    'Invalid card_number_validation': 'Número do cartão inválido. Revise os dados e tente novamente.',
    'Invalid cardholder_name': 'Nome do titular inválido. Revise os dados e tente novamente.',
    'Invalid security_code': 'Código de segurança inválido. Revise os dados e tente novamente.',
    'Invalid expiration_month': 'Mês de validade inválido. Revise os dados do cartão.',
    'Invalid expiration_year': 'Ano de validade inválido. Revise os dados do cartão.',
    'Invalid expiration_date': 'Data de validade inválida. Revise os dados do cartão.',
    'Invalid identification_number': 'CPF do titular inválido. Revise os dados e tente novamente.',
    'Invalid identification_type': 'Tipo de documento inválido. Revise os dados e tente novamente.',
    'Invalid payment_method_id': 'Método de pagamento inválido. Tente novamente.',
    'Invalid installments': 'Quantidade de parcelas inválida. Tente novamente.',
    'Invalid issuer_id': 'Banco emissor inválido. Tente novamente.',
    'Invalid card_token_id': 'Não foi possível validar o cartão. Gere os dados novamente e tente outra vez.',
    'Invalid token': 'Não foi possível validar o cartão. Gere os dados novamente e tente outra vez.',
  }

  if (exactMap[normalized]) {
    return exactMap[normalized]
  }

  if (lower.includes('card_number_validation')) {
    return 'Número do cartão inválido. Revise os dados e tente novamente.'
  }

  if (lower.includes('security_code')) {
    return 'Código de segurança inválido. Revise os dados e tente novamente.'
  }

  if (lower.includes('cardholder_name')) {
    return 'Nome do titular inválido. Revise os dados e tente novamente.'
  }

  if (lower.includes('expiration')) {
    return 'Data de validade inválida. Revise os dados do cartão.'
  }

  if (lower.includes('identification_number')) {
    return 'CPF do titular inválido. Revise os dados e tente novamente.'
  }

  if (lower.includes('token')) {
    return 'Não foi possível validar o cartão. Gere os dados novamente e tente outra vez.'
  }

  return normalized
}

export async function POST(request: NextRequest) {
  // 1. Authenticate student
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return errorResponse('Sessão expirada. Faça login para continuar.', 401)
  if (user.user_metadata?.role !== 'student') {
    return errorResponse('Apenas alunos podem realizar agendamentos.', 403)
  }

  // 2. Parse and validate request body
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return errorResponse('Corpo da requisição inválido.', 400)
  }

  const instructorId = typeof body.instructor_id === 'string' ? body.instructor_id.trim() : ''
  const serviceId = typeof body.service_id === 'string' ? body.service_id.trim() : ''
  const slotIds = Array.isArray(body.slot_ids)
    ? (body.slot_ids as unknown[]).filter((id): id is string => typeof id === 'string')
    : []
  const lessonMode =
    body.lesson_mode === 'meeting' || body.lesson_mode === 'pickup'
      ? body.lesson_mode
      : 'meeting'
  const parsedTotalAmount = typeof body.total_amount === 'number' ? body.total_amount : Number(body.total_amount)
  const totalAmount =
    Number.isFinite(parsedTotalAmount) && parsedTotalAmount > 0
      ? Math.round(parsedTotalAmount * 100) / 100
      : 0
  const paymentMethod =
    body.payment_method === 'pix' || body.payment_method === 'card'
      ? body.payment_method
      : null

  if (!instructorId) return errorResponse('ID do instrutor obrigatório.', 400)
  if (!serviceId) return errorResponse('ID do serviço obrigatório.', 400)
  if (slotIds.length === 0) return errorResponse('Selecione pelo menos um horário.', 400)
  if (totalAmount <= 0) return errorResponse('Valor total inválido.', 400)
  if (!paymentMethod) return errorResponse('Método de pagamento inválido.', 400)

  if (paymentMethod === 'card') {
    if (!body.card_token || typeof body.card_token !== 'string') {
      return errorResponse('Token do cartão não fornecido.', 400)
    }
    if (!body.card_payment_method_id || typeof body.card_payment_method_id !== 'string') {
      return errorResponse('ID do método de pagamento do cartão não fornecido.', 400)
    }
  }

  // 3. Resolve student profile (we need the student_profiles.id, not auth.uid)
  const admin = createAdminClient()
  const { data: studentProfile, error: profileError } = await admin
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError || !studentProfile) {
    return errorResponse(
      'Perfil de aluno não encontrado. Conclua seu cadastro antes de agendar.',
      404
    )
  }

  // 4. Create booking + payment
  try {
    const result = await createBookingGroupPayment({
      studentId: studentProfile.id,
      instructorId,
      serviceId,
      slotIds,
      lessonMode,
      totalAmount,
      paymentMethod,
      // Card fields
      cardToken:
        typeof body.card_token === 'string' ? body.card_token : undefined,
      cardPaymentMethodId:
        typeof body.card_payment_method_id === 'string'
          ? body.card_payment_method_id
          : undefined,
      cardIssuerId:
        typeof body.card_issuer_id === 'string' || typeof body.card_issuer_id === 'number'
          ? body.card_issuer_id
          : null,
      cardInstallments:
        typeof body.card_installments === 'number' ? body.card_installments : 1,
      // Payer info
      payerEmail: user.email ?? `aluno-${user.id.slice(0, 8)}@cnhsimples.com.br`,
      payerFirstName:
        typeof body.payer_first_name === 'string' ? body.payer_first_name : undefined,
      payerLastName:
        typeof body.payer_last_name === 'string' ? body.payer_last_name : undefined,
      payerCpf: typeof body.payer_cpf === 'string' ? body.payer_cpf : undefined,
      payerIdentificationType:
        typeof body.payer_identification_type === 'string'
          ? body.payer_identification_type
          : 'CPF',
      payerIdentificationNumber:
        typeof body.payer_identification_number === 'string'
          ? body.payer_identification_number
          : undefined,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const message = translateMercadoPagoError(extractError(error))
    console.error('[booking/create] Error:', error)

    // Surface user-facing MP rejection messages
    if (
      message.toLowerCase().includes('não estão mais disponíveis') ||
      message.toLowerCase().includes('indisponív')
    ) {
      return errorResponse(message, 409)
    }

    if (
      message.toLowerCase().includes('token') ||
      message.toLowerCase().includes('cartão')
    ) {
      return errorResponse(message, 422)
    }

    return errorResponse(message, 500)
  }
}

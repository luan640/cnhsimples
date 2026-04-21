import crypto from 'node:crypto'

import { NextRequest, NextResponse } from 'next/server'

import { getMercadoPagoWebhookSecret } from '@/lib/mercadopago/client'
import {
  syncInstructorSubscriptionPayment,
  syncInstructorSubscriptionPreApproval,
} from '@/lib/instructors/subscriptions'
import { processBookingPaymentWebhook } from '@/lib/bookings/payments'

// ─── signature validation ─────────────────────────────────────────────────────

/**
 * Validates the Mercado Pago webhook signature using the algorithm documented at:
 * https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 *
 * Header format: x-signature: ts=<timestamp>,v1=<hmac-sha256-hex>
 * Manifest:      id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 */
function validateWebhookSignature(
  request: NextRequest,
  dataId: string | null
): boolean {
  const secret = getMercadoPagoWebhookSecret()

  // Skip validation when secret is not configured (local dev without secret)
  if (!secret) return true

  const signatureHeader = request.headers.get('x-signature')
  if (!signatureHeader) return false

  // Parse ts and v1 from the signature header
  let ts: string | null = null
  let v1: string | null = null

  for (const part of signatureHeader.split(',')) {
    const [key, value] = part.split('=')
    if (key?.trim() === 'ts') ts = value?.trim() ?? null
    if (key?.trim() === 'v1') v1 = value?.trim() ?? null
  }

  if (!ts || !v1) return false

  const requestId = request.headers.get('x-request-id') ?? ''

  // Build manifest — omit missing fields as per MP docs
  const parts: string[] = []
  if (dataId) parts.push(`id:${dataId}`)
  if (requestId) parts.push(`request-id:${requestId}`)
  parts.push(`ts:${ts}`)
  const manifest = parts.join(';') + ';'

  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  // Constant-time comparison to prevent timing attacks
  const expectedBuf = Buffer.from(expected, 'hex')
  const receivedBuf = Buffer.from(v1, 'hex')

  if (expectedBuf.length !== receivedBuf.length) return false
  return crypto.timingSafeEqual(expectedBuf, receivedBuf)
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error) {
    const message = Reflect.get(error as object, 'message')
    if (typeof message === 'string') return message
  }

  return 'Falha ao processar webhook.'
}

function getErrorStatus(error: unknown) {
  if (typeof error === 'object' && error) {
    const status = Reflect.get(error as object, 'status')
    if (typeof status === 'number') return status
  }

  return null
}

function getErrorCode(error: unknown) {
  if (typeof error === 'object' && error) {
    const code = Reflect.get(error as object, 'code')
    if (typeof code === 'string') return code
  }

  return null
}

function isIgnorableWebhookError(error: unknown) {
  const message = getErrorMessage(error)
  const status = getErrorStatus(error)
  const code = getErrorCode(error)

  return (
    message.includes('Nenhuma mensalidade encontrada') ||
    message.includes('sem external_reference') ||
    message.includes('Pagamento de agendamento não encontrado') ||
    message.includes('Payment not found') ||
    code === 'Subscription bad request' ||
    status === 404
  )
}

// ─── handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Mercado Pago passes data.id as a query param in the webhook URL
  const searchParams = request.nextUrl.searchParams
  const dataIdFromQuery = searchParams.get('data.id') ?? searchParams.get('id')

  // Validate signature before reading body
  if (!validateWebhookSignature(request, dataIdFromQuery)) {
    console.warn('[webhook] Assinatura inválida rejeitada.')
    return NextResponse.json({ error: 'Assinatura do webhook inválida.' }, { status: 401 })
  }

  let payload: Record<string, unknown> = {}
  try {
    const text = await request.text()
    payload = text ? (JSON.parse(text) as Record<string, unknown>) : {}
  } catch {
    payload = {}
  }

  // Determine notification type
  const topic =
    searchParams.get('topic') ??
    searchParams.get('type') ??
    (typeof payload.type === 'string' ? payload.type : null)

  const action = typeof payload.action === 'string' ? payload.action : ''
  const data =
    typeof payload.data === 'object' && payload.data != null
      ? (payload.data as Record<string, unknown>)
      : {}

  const paymentId =
    typeof data.id === 'string' || typeof data.id === 'number'
      ? String(data.id)
      : (dataIdFromQuery ?? null)

  const preApprovalId =
    typeof data.id === 'string' || typeof data.id === 'number'
      ? String(data.id)
      : (dataIdFromQuery ?? null)

  const isPayment =
    topic === 'payment' ||
    topic === 'subscription_authorized_payment' ||
    (typeof payload.type === 'string' && payload.type === 'payment') ||
    (typeof payload.type === 'string' && payload.type === 'subscription_authorized_payment') ||
    action.startsWith('payment.')

  const isPreApproval =
    topic === 'preapproval' ||
    (typeof payload.type === 'string' &&
      (payload.type === 'subscription_preapproval' || payload.type === 'preapproval')) ||
    action.startsWith('preapproval.')

  try {
    if (isPayment) {
      if (!paymentId) return NextResponse.json({ ok: true })

      // Try booking payment first; if external_reference doesn't start with "booking:",
      // processBookingPaymentWebhook returns null and we fall through to membership sync.
      const bookingResult = await processBookingPaymentWebhook(paymentId)

      if (bookingResult === null) {
        // Not a booking payment — delegate to membership handler
        await syncInstructorSubscriptionPayment(paymentId)
      }

      return NextResponse.json({ ok: true })
    }

    if (isPreApproval) {
      if (!preApprovalId) return NextResponse.json({ ok: true })
      await syncInstructorSubscriptionPreApproval(preApprovalId)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = getErrorMessage(error)
    console.error('[webhook] Falha ao processar notificação:', error)

    // Known ignorable errors — still return 200 so MP doesn't retry endlessly
    if (isIgnorableWebhookError(error)) {
      return NextResponse.json({ ok: true, ignored: true, reason: message })
    }

    return NextResponse.json({ error: 'Falha ao processar webhook.' }, { status: 500 })
  }
}

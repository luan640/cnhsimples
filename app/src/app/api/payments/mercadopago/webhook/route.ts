import crypto from 'node:crypto'

import { NextRequest, NextResponse } from 'next/server'

import { getMercadoPagoWebhookSecret } from '@/lib/mercadopago/client'
import {
  syncInstructorSubscriptionPayment,
  syncInstructorSubscriptionPreApproval,
} from '@/lib/instructors/subscriptions'

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)

  if (aBuffer.length !== bBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer)
}

function isWebhookSignatureValid(request: NextRequest, rawBody: string) {
  const secret = getMercadoPagoWebhookSecret()

  if (!secret) {
    return true
  }

  const signature = request.headers.get('x-signature')

  if (!signature) {
    return false
  }

  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return safeEqual(signature, digest)
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  if (!isWebhookSignatureValid(request, rawBody)) {
    return NextResponse.json({ error: 'Assinatura do webhook invalida.' }, { status: 401 })
  }

  let payload: Record<string, unknown> = {}

  try {
    payload = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {}
  } catch {
    payload = {}
  }

  const searchParams = request.nextUrl.searchParams
  const topic = searchParams.get('topic') ?? searchParams.get('type') ?? payload.type
  const entity = typeof payload.entity === 'string' ? payload.entity : ''
  const notificationType = typeof payload.type === 'string' ? payload.type : ''
  const action = typeof payload.action === 'string' ? payload.action : ''
  const data = typeof payload.data === 'object' && payload.data ? payload.data as Record<string, unknown> : {}
  const paymentId =
    typeof data.id === 'string' || typeof data.id === 'number'
      ? data.id
      : searchParams.get('data.id') ?? searchParams.get('id')
  const preApprovalId =
    typeof data.id === 'string' || typeof data.id === 'number'
      ? data.id
      : searchParams.get('data.id') ?? searchParams.get('id')

  const isPaymentNotification =
    topic === 'payment' ||
    entity === 'payment' ||
    notificationType === 'payment' ||
    action.startsWith('payment.')

  const isPreApprovalNotification =
    topic === 'preapproval' ||
    entity === 'preapproval' ||
    notificationType === 'subscription_preapproval' ||
    notificationType === 'preapproval' ||
    action.startsWith('preapproval.')

  try {
    if (isPaymentNotification) {
      if (!paymentId) {
        return NextResponse.json({ ok: true })
      }

      await syncInstructorSubscriptionPayment(paymentId)
      return NextResponse.json({ ok: true })
    }

    if (isPreApprovalNotification) {
      if (!preApprovalId) {
        return NextResponse.json({ ok: true })
      }

      await syncInstructorSubscriptionPreApproval(String(preApprovalId))
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao processar webhook.'
    console.error('[mercadopago] webhook sync failed:', error)

    if (
      message.includes('Nenhuma mensalidade encontrada') ||
      message.includes('sem external_reference')
    ) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    return NextResponse.json({ error: 'Falha ao processar webhook.' }, { status: 500 })
  }
}

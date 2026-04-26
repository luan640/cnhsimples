import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { getInstructorProfile } from '@/lib/instructors/dashboard'
import {
  attachPreApprovalToSubscription,
  getCheckoutEligibleInstructorSubscription,
  createInstructorSubscription,
  getInstructorMembershipAmount,
} from '@/lib/instructors/subscriptions'
import { getMercadoPagoPreApprovalClient } from '@/lib/mercadopago/client'

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  if (typeof error === 'object' && error) {
    const maybeMessage = Reflect.get(error, 'message')

    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage
    }

    const cause = Reflect.get(error, 'cause')
    if (cause instanceof Error && cause.message.trim()) {
      return cause.message
    }

    const response = Reflect.get(error, 'response')
    if (typeof response === 'object' && response) {
      const responseMessage = Reflect.get(response, 'message')
      if (typeof responseMessage === 'string' && responseMessage.trim()) {
        return responseMessage
      }
    }

    try {
      return JSON.stringify(error)
    } catch {
      return 'Falha ao iniciar pagamento da mensalidade.'
    }
  }

  return 'Falha ao iniciar pagamento da mensalidade.'
}

async function createPreApprovalForSubscription(params: {
  externalReference: string
  payerEmail: string
  appUrl: string
}): Promise<{ preApprovalId: string; checkoutUrl: string }> {
  const preApprovalPlanId = process.env.MERCADO_PAGO_PREAPPROVAL_PLAN_ID?.trim()

  if (!preApprovalPlanId) {
    throw new Error('MERCADO_PAGO_PREAPPROVAL_PLAN_ID nao configurado.')
  }

  const preApprovalClient = getMercadoPagoPreApprovalClient()
  const preApproval = await preApprovalClient.create({
    body: {
      preapproval_plan_id: preApprovalPlanId,
      external_reference: params.externalReference,
      back_url: `${params.appUrl}/api/payments/instructor-membership/return`,
      payer_email: params.payerEmail,
    },
  })

  if (!preApproval.id || !preApproval.init_point) {
    throw new Error('Mercado Pago nao retornou os dados do checkout da assinatura.')
  }

  return {
    preApprovalId: preApproval.id,
    checkoutUrl: preApproval.init_point,
  }
}

async function resolveCheckout(requestUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sessao expirada.', status: 401 as const }
  }

  if (user.user_metadata?.role !== 'instructor') {
    return { error: 'Apenas instrutores podem pagar mensalidade.', status: 403 as const }
  }

  const profile = await getInstructorProfile(user.id)

  if (!profile) {
    return { error: 'Perfil do instrutor nao encontrado.', status: 404 as const }
  }

  if (profile.status !== 'docs_approved' && profile.status !== 'active') {
    return {
      error: 'A mensalidade so pode ser paga apos a aprovacao documental.',
      status: 400 as const,
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(requestUrl).origin

  try {
    const amount = getInstructorMembershipAmount()
    const checkoutState = await getCheckoutEligibleInstructorSubscription(profile.id)

    if (checkoutState.kind === 'approved') {
      return { error: 'Sua assinatura ja esta ativa.', status: 409 as const }
    }

    // Reuse existing pending preapproval if one was already created
    if (checkoutState.kind === 'pending' && checkoutState.subscription.mp_preference_id) {
      const checkoutUrl = checkoutState.subscription.payment_url ?? ''

      return {
        ok: true,
        checkoutUrl,
        subscriptionId: checkoutState.subscription.id,
        reused: true,
      } as const
    }

    // Use existing pending subscription record or create a new one
    const subscription =
      checkoutState.kind === 'pending'
        ? checkoutState.subscription
        : await createInstructorSubscription(profile.id, amount)

    if (!subscription) {
      return {
        error: 'Nao foi possivel criar o registro da mensalidade.',
        status: 500 as const,
      }
    }

    const payerEmail = user.email ?? ''
    const { preApprovalId, checkoutUrl } = await createPreApprovalForSubscription({
      externalReference: subscription.external_reference,
      payerEmail,
      appUrl,
    })

    await attachPreApprovalToSubscription(subscription.id, {
      preApprovalId,
      paymentUrl: checkoutUrl,
    })

    return {
      ok: true,
      checkoutUrl,
      subscriptionId: subscription.id,
    } as const
  } catch (error) {
    console.error('[mercadopago] create instructor membership preference failed:', error)
    return {
      error: getErrorMessage(error),
      status: 500 as const,
    }
  }
}

export async function POST(request: Request) {
  const result = await resolveCheckout(request.url)

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json(result)
}

export async function GET(request: Request) {
  const result = await resolveCheckout(request.url)

  if ('error' in result) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
    const redirectUrl = new URL('/painel', appUrl)
    const errorMessage = typeof result.error === 'string' ? result.error : 'Falha ao iniciar pagamento da mensalidade.'
    redirectUrl.searchParams.set('mensalidade', 'error')
    redirectUrl.searchParams.set('mensalidade_msg', errorMessage)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.redirect(result.checkoutUrl)
}

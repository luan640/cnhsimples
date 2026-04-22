import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { getInstructorProfile } from '@/lib/instructors/dashboard'
import {
  attachPreApprovalToSubscription,
  getCheckoutEligibleInstructorSubscription,
  createInstructorSubscription,
  getInstructorMembershipAmount,
} from '@/lib/instructors/subscriptions'
import { getMercadoPagoPreApprovalPlanClient } from '@/lib/mercadopago/client'

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

async function resolveCheckout() {
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

  try {
    const amount = getInstructorMembershipAmount()
    const preApprovalPlanId = process.env.MERCADO_PAGO_PREAPPROVAL_PLAN_ID?.trim() || null

    if (!preApprovalPlanId) {
      return {
        error: 'MERCADO_PAGO_PREAPPROVAL_PLAN_ID nao configurado.',
        status: 500 as const,
      }
    }

    const preApprovalPlanClient = getMercadoPagoPreApprovalPlanClient()
    const plan = await preApprovalPlanClient.get({ preApprovalPlanId })
    const checkoutUrl = plan.init_point

    if (!checkoutUrl) {
      return {
        error: 'Mercado Pago nao retornou a URL do checkout do plano.',
        status: 502 as const,
      }
    }

    const checkoutState = await getCheckoutEligibleInstructorSubscription(profile.id)

    if (checkoutState.kind === 'approved') {
      return { error: 'Sua assinatura ja esta ativa.', status: 409 as const }
    }

    if (checkoutState.kind === 'pending') {
      await attachPreApprovalToSubscription(checkoutState.subscription.id, {
        preApprovalId: checkoutState.subscription.mp_preference_id,
        paymentUrl: checkoutUrl,
      })

      return {
        ok: true,
        checkoutUrl,
        subscriptionId: checkoutState.subscription.id,
        reused: true,
      } as const
    }

    const subscription = await createInstructorSubscription(profile.id, amount)

    if (!subscription) {
      return {
        error: 'Nao foi possivel criar o registro da mensalidade.',
        status: 500 as const,
      }
    }

    await attachPreApprovalToSubscription(subscription.id, {
      preApprovalId: null,
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

export async function POST() {
  const result = await resolveCheckout()

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json(result)
}

export async function GET(request: Request) {
  const result = await resolveCheckout()

  if ('error' in result) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
    const redirectUrl = new URL('/painel', appUrl)
    redirectUrl.searchParams.set('mensalidade', 'error')
    redirectUrl.searchParams.set('mensalidade_msg', result.error)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.redirect(result.checkoutUrl)
}

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

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Sessao expirada.' }, { status: 401 })
  }

  if (user.user_metadata?.role !== 'instructor') {
    return NextResponse.json({ error: 'Apenas instrutores podem pagar mensalidade.' }, { status: 403 })
  }

  const profile = await getInstructorProfile(user.id)

  if (!profile) {
    return NextResponse.json({ error: 'Perfil do instrutor nao encontrado.' }, { status: 404 })
  }

  if (profile.status !== 'docs_approved' && profile.status !== 'active') {
    return NextResponse.json(
      { error: 'A mensalidade so pode ser paga apos a aprovacao documental.' },
      { status: 400 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!appUrl?.trim()) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL nao configurado.' }, { status: 500 })
  }

  try {
    const amount = getInstructorMembershipAmount()
    const preApprovalPlanId = process.env.MERCADO_PAGO_PREAPPROVAL_PLAN_ID?.trim() || null

    if (!preApprovalPlanId) {
      return NextResponse.json(
        { error: 'MERCADO_PAGO_PREAPPROVAL_PLAN_ID nao configurado.' },
        { status: 500 }
      )
    }

    const preApprovalPlanClient = getMercadoPagoPreApprovalPlanClient()
    const plan = await preApprovalPlanClient.get({ preApprovalPlanId })
    const checkoutUrl = plan.init_point

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Mercado Pago nao retornou a URL do checkout do plano.' },
        { status: 502 }
      )
    }

    const checkoutState = await getCheckoutEligibleInstructorSubscription(profile.id)

    if (checkoutState.kind === 'approved') {
      return NextResponse.json(
        { error: 'Sua assinatura ja esta ativa.' },
        { status: 409 }
      )
    }

    if (checkoutState.kind === 'pending') {
      await attachPreApprovalToSubscription(checkoutState.subscription.id, {
        preApprovalId: checkoutState.subscription.mp_preference_id,
        paymentUrl: checkoutUrl,
      })

      return NextResponse.json({
        ok: true,
        checkoutUrl,
        subscriptionId: checkoutState.subscription.id,
        reused: true,
      })
    }

    const subscription = await createInstructorSubscription(profile.id, amount)

    if (!subscription) {
      return NextResponse.json(
        { error: 'Nao foi possivel criar o registro da mensalidade.' },
        { status: 500 }
      )
    }

    await attachPreApprovalToSubscription(subscription.id, {
      preApprovalId: null,
      paymentUrl: checkoutUrl,
    })

    return NextResponse.json({
      ok: true,
      checkoutUrl,
      subscriptionId: subscription.id,
    })
  } catch (error) {
    console.error('[mercadopago] create instructor membership preference failed:', error)
    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 }
    )
  }
}

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

    const checkoutState = await getCheckoutEligibleInstructorSubscription(profile.id)

    if (checkoutState.kind === 'approved') {
      return NextResponse.json(
        { error: 'Sua assinatura ja esta ativa.' },
        { status: 409 }
      )
    }

    if (checkoutState.kind === 'pending') {
      return NextResponse.json({
        ok: true,
        checkoutUrl: checkoutState.subscription.payment_url,
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

    if (!user.email?.trim()) {
      return NextResponse.json(
        { error: 'Nao foi possivel identificar o e-mail do instrutor para a assinatura.' },
        { status: 400 }
      )
    }

    const preApprovalPlanId = process.env.MERCADO_PAGO_PREAPPROVAL_PLAN_ID

    if (!preApprovalPlanId?.trim()) {
      return NextResponse.json({ error: 'MERCADO_PAGO_PREAPPROVAL_PLAN_ID nao configurado.' }, { status: 500 })
    }

    const preApprovalClient = getMercadoPagoPreApprovalClient()
    const backUrl = `${appUrl}/api/payments/instructor-membership/return?subscription_id=${subscription.id}`
    const preApproval = await preApprovalClient.create({
      body: {
        preapproval_plan_id: preApprovalPlanId,
        reason: 'Mensalidade de instrutor',
        external_reference: subscription.external_reference,
        payer_email: user.email.trim(),
        back_url: backUrl,
        status: 'pending',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: amount,
          currency_id: 'BRL',
        },
      },
    })
    const checkoutUrl = preApproval.init_point

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Mercado Pago nao retornou a URL do checkout da assinatura.' },
        { status: 502 }
      )
    }

    await attachPreApprovalToSubscription(subscription.id, {
      preApprovalId: preApproval.id ?? null,
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

import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { getInstructorProfile } from '@/lib/instructors/dashboard'
import {
  attachPreApprovalToSubscription,
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
    const subscription = await createInstructorSubscription(profile.id, amount)

    if (!subscription) {
      return NextResponse.json(
        { error: 'Nao foi possivel criar o registro da mensalidade.' },
        { status: 500 }
      )
    }

    const preApprovalClient = getMercadoPagoPreApprovalClient()
    const preApproval = await preApprovalClient.create({
      body: {
        reason: 'Mensalidade do instrutor',
        payer_email: user.email,
        external_reference: subscription.external_reference,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: amount,
          currency_id: 'BRL',
        },
        back_url: `${appUrl}/api/payments/instructor-membership/return`,
        status: 'pending',
      },
    })

    const checkoutUrl = preApproval.init_point

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Mercado Pago nao retornou a URL do checkout.' },
        { status: 502 }
      )
    }

    if (!preApproval.id) {
      return NextResponse.json(
        { error: 'Mercado Pago nao retornou o identificador da assinatura.' },
        { status: 502 }
      )
    }

    await attachPreApprovalToSubscription(subscription.id, {
      preApprovalId: preApproval.id,
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

import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { getInstructorProfile } from '@/lib/instructors/dashboard'
import {
  createInstructorSubscription,
  getInstructorMembershipAmount,
} from '@/lib/instructors/subscriptions'
import { getMercadoPagoPreApprovalClient } from '@/lib/mercadopago/client'

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

  if (!appUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL nao configurado.' }, { status: 500 })
  }

  const preApprovalPlanId = process.env.MERCADO_PAGO_PREAPPROVAL_PLAN_ID

  if (!preApprovalPlanId) {
    return NextResponse.json({ error: 'MERCADO_PAGO_PREAPPROVAL_PLAN_ID nao configurado.' }, { status: 500 })
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
        preapproval_plan_id: preApprovalPlanId,
        payer_email: user.email,
        external_reference: subscription.external_reference,
        back_url: `${appUrl}/api/payments/instructor-membership/return`,
      },
    })

    const checkoutUrl = preApproval.init_point

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: 'Mercado Pago nao retornou a URL do checkout.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      ok: true,
      checkoutUrl,
      subscriptionId: subscription.id,
    })
  } catch (error) {
    console.error('[mercadopago] create instructor membership preference failed:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao iniciar pagamento da mensalidade.',
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

import { getInstructorProfile } from '@/lib/instructors/dashboard'
import {
  createInstructorSubscription,
  getCheckoutEligibleInstructorSubscription,
  getInstructorMembershipAmount,
} from '@/lib/instructors/subscriptions'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getStripeClient, getStripeMembershipPriceId } from '@/lib/stripe/client'

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return errorResponse('Sessao expirada.', 401)
  if (user.user_metadata?.role !== 'instructor') {
    return errorResponse('Apenas instrutores podem pagar mensalidade.', 403)
  }

  const profile = await getInstructorProfile(user.id)
  if (!profile) return errorResponse('Perfil do instrutor nao encontrado.', 404)

  if (profile.status !== 'docs_approved' && profile.status !== 'active') {
    return errorResponse('A mensalidade so pode ser paga apos a aprovacao documental.', 400)
  }

  const checkoutState = await getCheckoutEligibleInstructorSubscription(profile.id)
  if (checkoutState.kind === 'approved') {
    return errorResponse('Sua assinatura ja esta ativa.', 409)
  }

  try {
    const stripe = getStripeClient()
    const priceId = getStripeMembershipPriceId()
    const amount = getInstructorMembershipAmount()

    // Find or create Stripe customer for this instructor
    const admin = createAdminClient()
    const { data: profileRow } = await admin
      .from('instructor_profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', profile.id)
      .single()

    let customerId: string = profileRow?.stripe_customer_id ?? ''

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: profileRow?.full_name ?? undefined,
        metadata: { instructor_id: profile.id },
      })
      customerId = customer.id

      await admin
        .from('instructor_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', profile.id)
    }

    // Create or reuse subscription record in our DB
    const subscription =
      checkoutState.kind === 'pending'
        ? checkoutState.subscription
        : await createInstructorSubscription(profile.id, amount)

    if (!subscription) {
      return errorResponse('Nao foi possivel criar o registro da mensalidade.', 500)
    }

    // Create Stripe subscription (incomplete until card confirmed)
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.confirmation_secret'],
      metadata: {
        instructor_id: profile.id,
        subscription_id: subscription.id,
        external_reference: subscription.external_reference,
      },
    })

    const invoice = stripeSubscription.latest_invoice as import('stripe').Stripe.Invoice | null
    let clientSecret = invoice?.confirmation_secret?.client_secret ?? null

    if (!clientSecret && invoice?.id) {
      const hydratedInvoice = await stripe.invoices.retrieve(invoice.id, {
        expand: ['confirmation_secret'],
      })
      clientSecret = hydratedInvoice.confirmation_secret?.client_secret ?? null
    }

    if (!clientSecret) {
      return errorResponse('Stripe nao retornou o client secret.', 502)
    }

    // Save stripe subscription id on our record
    await admin
      .from('instructor_subscriptions')
      .update({ mp_preference_id: stripeSubscription.id })
      .eq('id', subscription.id)

    return NextResponse.json({
      clientSecret,
      subscriptionId: subscription.id,
      stripeSubscriptionId: stripeSubscription.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao criar assinatura.'
    console.error('[stripe-setup] error:', error)
    return errorResponse(message, 500)
  }
}

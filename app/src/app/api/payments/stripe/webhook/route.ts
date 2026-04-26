import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendInstructorActivatedEmail } from '@/lib/email/notifications'
import { revalidatePath } from 'next/cache'

async function activateInstructor(instructorId: string, stripeSubscriptionId: string, expiresAt: string) {
  const admin = createAdminClient()

  // Update our subscription record
  await admin
    .from('instructor_subscriptions')
    .update({
      status: 'approved',
      paid_at: new Date().toISOString(),
      expires_at: expiresAt,
      mp_payment_id: stripeSubscriptionId,
    })
    .eq('mp_preference_id', stripeSubscriptionId)

  // Activate instructor profile
  const { data: profile } = await admin
    .from('instructor_profiles')
    .update({ status: 'active', rejection_reason: null })
    .eq('id', instructorId)
    .select('user_id, full_name')
    .single()

  if (profile) {
    const stripe_admin = createAdminClient()
    const { data: authUser } = await stripe_admin.auth.admin.getUserById(profile.user_id)
    const email = authUser.user?.email
    const name = authUser.user?.user_metadata?.full_name ?? profile.full_name ?? 'instrutor'

    const currentMeta = authUser.user?.user_metadata ?? {}
    await stripe_admin.auth.admin.updateUserById(profile.user_id, {
      user_metadata: { ...currentMeta, status: 'active', rejection_reason: null },
    })

    if (email) {
      await sendInstructorActivatedEmail({ to: email, name }).catch((err) =>
        console.error('[stripe-webhook] falha ao enviar email de ativacao:', err)
      )
    }
  }

  revalidatePath('/painel')
  revalidatePath('/buscar')
}

async function handleSubscriptionRenewed(subscription: Stripe.Subscription) {
  const instructorId = subscription.metadata?.instructor_id
  if (!instructorId) return

  const admin = createAdminClient()
  const periodEnd = subscription.items.data[0]?.current_period_end
  const expiresAt = periodEnd
    ? new Date(periodEnd * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  await admin
    .from('instructor_subscriptions')
    .update({ status: 'approved', expires_at: expiresAt })
    .eq('mp_preference_id', subscription.id)

  await admin
    .from('instructor_profiles')
    .update({ status: 'active' })
    .eq('id', instructorId)
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const admin = createAdminClient()

  await admin
    .from('instructor_subscriptions')
    .update({ status: 'cancelled' })
    .eq('mp_preference_id', subscription.id)

  const instructorId = subscription.metadata?.instructor_id
  if (instructorId) {
    await admin
      .from('instructor_profiles')
      .update({ status: 'inactive' })
      .eq('id', instructorId)
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''
  const webhookSecret = getStripeWebhookSecret()

  let event: Stripe.Event

  try {
    const stripe = getStripeClient()
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } else {
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err) {
    console.error('[stripe-webhook] assinatura invalida:', err)
    return NextResponse.json({ error: 'Assinatura invalida.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionRef = invoice.parent?.subscription_details?.subscription
        const subscriptionId = typeof subscriptionRef === 'string'
          ? subscriptionRef
          : (subscriptionRef?.id ?? null)
        if (!subscriptionId) break

        const stripe = getStripeClient()
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const instructorId = subscription.metadata?.instructor_id
        if (!instructorId) break

        const periodEnd = subscription.items.data[0]?.current_period_end
        const expiresAt = periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

        await activateInstructor(instructorId, subscriptionId, expiresAt)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        if (subscription.status === 'active') {
          await handleSubscriptionRenewed(subscription)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancelled(subscription)
        break
      }
    }
  } catch (err) {
    console.error('[stripe-webhook] erro ao processar evento:', event.type, err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

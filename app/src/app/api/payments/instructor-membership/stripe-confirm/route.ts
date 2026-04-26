import { NextRequest, NextResponse } from 'next/server'

import { getInstructorProfile } from '@/lib/instructors/dashboard'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getStripeClient } from '@/lib/stripe/client'
import { sendInstructorActivatedEmail } from '@/lib/email/notifications'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Sessao expirada.' }, { status: 401 })

  const profile = await getInstructorProfile(user.id)
  if (!profile) return NextResponse.json({ error: 'Perfil nao encontrado.' }, { status: 404 })

  let body: { stripeSubscriptionId?: string } = {}
  try { body = await request.json() } catch { /* empty body ok */ }

  const stripeSubscriptionId = body.stripeSubscriptionId?.trim()
  if (!stripeSubscriptionId) {
    return NextResponse.json({ error: 'stripeSubscriptionId obrigatorio.' }, { status: 400 })
  }

  try {
    const stripe = getStripeClient()
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)

    if (subscription.status !== 'active') {
      return NextResponse.json({ activated: false, status: subscription.status })
    }

    const admin = createAdminClient()
    const periodEnd = subscription.items.data[0]?.current_period_end
    const expiresAt = periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await admin
      .from('instructor_subscriptions')
      .update({
        status: 'approved',
        paid_at: new Date().toISOString(),
        expires_at: expiresAt,
        mp_payment_id: stripeSubscriptionId,
      })
      .eq('mp_preference_id', stripeSubscriptionId)

    await admin
      .from('instructor_profiles')
      .update({ status: 'active', rejection_reason: null })
      .eq('id', profile.id)

    const { data: authUser } = await admin.auth.admin.getUserById(user.id)
    const currentMeta = authUser.user?.user_metadata ?? {}
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...currentMeta, status: 'active', rejection_reason: null },
    })

    const email = authUser.user?.email
    const name = currentMeta.full_name ?? profile.full_name ?? 'instrutor'
    if (email) {
      await sendInstructorActivatedEmail({ to: email, name }).catch(() => null)
    }

    revalidatePath('/painel')
    revalidatePath('/buscar')

    return NextResponse.json({ activated: true })
  } catch (error) {
    console.error('[stripe-confirm] error:', error)
    return NextResponse.json({ error: 'Erro ao confirmar pagamento.' }, { status: 500 })
  }
}

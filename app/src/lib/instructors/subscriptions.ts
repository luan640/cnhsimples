import crypto from 'node:crypto'

import { revalidatePath } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { getMercadoPagoPaymentClient, getMercadoPagoPreApprovalClient } from '@/lib/mercadopago/client'
import { sendInstructorActivatedEmail } from '@/lib/email/notifications'

export type InstructorSubscriptionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired'

export type InstructorSubscription = {
  id: string
  instructor_id: string
  plan: string
  value: number
  status: InstructorSubscriptionStatus
  external_reference: string
  mp_preference_id: string | null
  mp_payment_id: string | null
  payment_url: string | null
  paid_at: string | null
  expires_at: string | null
  created_at: string
}

const DEFAULT_MEMBERSHIP_AMOUNT = Number(process.env.MERCADO_PAGO_MEMBERSHIP_AMOUNT ?? '1')
const MEMBERSHIP_DURATION_DAYS = Number(process.env.INSTRUCTOR_MEMBERSHIP_DURATION_DAYS ?? '30')

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function normalizeSubscription(
  row:
    | {
        id: string
        instructor_id: string
        plan: string
        value: number | string
        status: InstructorSubscriptionStatus
        external_reference: string
        mp_preference_id: string | null
        mp_payment_id: string | null
        payment_url: string | null
        paid_at: string | null
        expires_at: string | null
        created_at: string
      }
    | null
) {
  if (!row) return null

  return {
    id: row.id,
    instructor_id: row.instructor_id,
    plan: row.plan,
    value: toNumber(row.value),
    status: row.status,
    external_reference: row.external_reference,
    mp_preference_id: row.mp_preference_id,
    mp_payment_id: row.mp_payment_id,
    payment_url: row.payment_url,
    paid_at: row.paid_at,
    expires_at: row.expires_at,
    created_at: row.created_at,
  } satisfies InstructorSubscription
}

async function mergeUserMetadata(userId: string, patch: Record<string, unknown>) {
  const admin = createAdminClient()
  const { data: authUser } = await admin.auth.admin.getUserById(userId)
  const currentMetadata =
    authUser.user?.user_metadata && typeof authUser.user.user_metadata === 'object'
      ? authUser.user.user_metadata
      : {}

  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...currentMetadata,
      ...patch,
    },
  })
}

export function getInstructorMembershipAmount() {
  return DEFAULT_MEMBERSHIP_AMOUNT
}

export async function getLatestInstructorSubscription(instructorId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('instructor_subscriptions')
    .select(
      'id, instructor_id, plan, value, status, external_reference, mp_preference_id, mp_payment_id, payment_url, paid_at, expires_at, created_at'
    )
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[subscriptions] getLatestInstructorSubscription error:', error.message)
    return null
  }

  return normalizeSubscription(data)
}

export async function getLatestPendingInstructorSubscription(instructorId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('instructor_subscriptions')
    .select(
      'id, instructor_id, plan, value, status, external_reference, mp_preference_id, mp_payment_id, payment_url, paid_at, expires_at, created_at'
    )
    .eq('instructor_id', instructorId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[subscriptions] getLatestPendingInstructorSubscription error:', error.message)
    return null
  }

  return normalizeSubscription(data)
}

export async function createInstructorSubscription(instructorId: string, amount = DEFAULT_MEMBERSHIP_AMOUNT) {
  const admin = createAdminClient()
  const externalReference = `membership:${instructorId}:${crypto.randomUUID()}`

  const { data, error } = await admin
    .from('instructor_subscriptions')
    .insert({
      instructor_id: instructorId,
      plan: 'monthly',
      value: amount,
      status: 'pending',
      external_reference: externalReference,
    })
    .select(
      'id, instructor_id, plan, value, status, external_reference, mp_preference_id, mp_payment_id, payment_url, paid_at, expires_at, created_at'
    )
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeSubscription(data)
}

export async function attachPreferenceToSubscription(
  subscriptionId: string,
  params: {
    preferenceId: string
    paymentUrl: string
  }
) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('instructor_subscriptions')
    .update({
      mp_preference_id: params.preferenceId,
      payment_url: params.paymentUrl,
    })
    .eq('id', subscriptionId)
    .select(
      'id, instructor_id, plan, value, status, external_reference, mp_preference_id, mp_payment_id, payment_url, paid_at, expires_at, created_at'
    )
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeSubscription(data)
}

export async function attachPreApprovalToSubscription(
  subscriptionId: string,
  params: {
    preApprovalId: string
    paymentUrl: string
  }
) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('instructor_subscriptions')
    .update({
      mp_preference_id: params.preApprovalId,
      payment_url: params.paymentUrl,
    })
    .eq('id', subscriptionId)
    .select(
      'id, instructor_id, plan, value, status, external_reference, mp_preference_id, mp_payment_id, payment_url, paid_at, expires_at, created_at'
    )
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return normalizeSubscription(data)
}

function mapPaymentStatus(status: string | undefined | null): InstructorSubscriptionStatus {
  if (status === 'approved') return 'approved'
  if (status === 'rejected') return 'rejected'
  if (status === 'cancelled') return 'cancelled'
  return 'pending'
}

function mapPreApprovalStatus(status: string | undefined | null): InstructorSubscriptionStatus {
  if (status === 'authorized') return 'approved'
  if (status === 'paused' || status === 'cancelled') return 'cancelled'
  if (status === 'expired') return 'expired'
  if (status === 'pending') return 'pending'
  return 'pending'
}

export async function syncInstructorSubscriptionPayment(paymentId: string | number) {
  const admin = createAdminClient()
  const paymentClient = getMercadoPagoPaymentClient()
  const payment = await paymentClient.get({ id: String(paymentId) })

  const externalReference = payment.external_reference

  if (!externalReference) {
    throw new Error('Pagamento do Mercado Pago sem external_reference.')
  }

  const { data: subscriptionRow, error: subscriptionError } = await admin
    .from('instructor_subscriptions')
    .select('id, instructor_id, status, expires_at')
    .eq('external_reference', externalReference)
    .maybeSingle()

  if (subscriptionError) {
    throw new Error(subscriptionError.message)
  }

  if (!subscriptionRow) {
    throw new Error(`Nenhuma mensalidade encontrada para ${externalReference}.`)
  }

  const nextStatus = mapPaymentStatus(payment.status)
  const approvedAt = payment.date_approved ? new Date(payment.date_approved) : new Date()
  const expiresAt =
    nextStatus === 'approved'
      ? addDays(approvedAt, MEMBERSHIP_DURATION_DAYS).toISOString()
      : subscriptionRow.expires_at

  const { data: updatedSubscription, error: updateError } = await admin
    .from('instructor_subscriptions')
    .update({
      status: nextStatus,
      mp_payment_id: payment.id ? String(payment.id) : null,
      paid_at: nextStatus === 'approved' ? approvedAt.toISOString() : null,
      expires_at: expiresAt,
    })
    .eq('id', subscriptionRow.id)
    .select(
      'id, instructor_id, plan, value, status, external_reference, mp_preference_id, mp_payment_id, payment_url, paid_at, expires_at, created_at'
    )
    .single()

  if (updateError) {
    throw new Error(updateError.message)
  }

  if (nextStatus === 'approved') {
    const { data: profile, error: profileError } = await admin
      .from('instructor_profiles')
      .select('id, user_id, full_name')
      .eq('id', subscriptionRow.instructor_id)
      .single()

    if (profileError) {
      throw new Error(profileError.message)
    }

    const { error: statusError } = await admin
      .from('instructor_profiles')
      .update({
        status: 'active',
        rejection_reason: null,
      })
      .eq('id', profile.id)

    if (statusError) {
      throw new Error(statusError.message)
    }

    await mergeUserMetadata(profile.user_id, {
      status: 'active',
      rejection_reason: null,
    })

    try {
      const { data: authUser } = await admin.auth.admin.getUserById(profile.user_id)
      const email = authUser.user?.email
      const name = authUser.user?.user_metadata?.full_name ?? profile.full_name ?? 'instrutor'

      if (email) {
        await sendInstructorActivatedEmail({
          to: email,
          name,
        })
      }
    } catch (error) {
      console.error('[email] Falha ao enviar ativacao automatica da mensalidade:', error)
    }

    revalidatePath('/painel')
    revalidatePath('/buscar')
  }

  return normalizeSubscription(updatedSubscription)
}

export async function syncInstructorSubscriptionPreApproval(preApprovalId: string) {
  const admin = createAdminClient()
  const preApprovalClient = getMercadoPagoPreApprovalClient()
  const preApproval = await preApprovalClient.get({ id: preApprovalId })

  const externalReference = preApproval.external_reference

  if (!externalReference) {
    throw new Error('Assinatura do Mercado Pago sem external_reference.')
  }

  const { data: subscriptionRow, error: subscriptionError } = await admin
    .from('instructor_subscriptions')
    .select('id, instructor_id')
    .eq('external_reference', externalReference)
    .maybeSingle()

  if (subscriptionError) {
    throw new Error(subscriptionError.message)
  }

  if (!subscriptionRow) {
    throw new Error(`Nenhuma mensalidade encontrada para ${externalReference}.`)
  }

  const nextStatus = mapPreApprovalStatus(preApproval.status)
  const approvedAt = preApproval.date_created ? new Date(preApproval.date_created) : new Date()
  const expiresAt =
    nextStatus === 'approved'
      ? (preApproval.next_payment_date ?? addDays(approvedAt, MEMBERSHIP_DURATION_DAYS).toISOString())
      : null

  const { data: updatedSubscription, error: updateError } = await admin
    .from('instructor_subscriptions')
    .update({
      status: nextStatus,
      mp_preference_id: preApproval.id ?? preApprovalId,
      paid_at: nextStatus === 'approved' ? approvedAt.toISOString() : null,
      expires_at: expiresAt,
    })
    .eq('id', subscriptionRow.id)
    .select(
      'id, instructor_id, plan, value, status, external_reference, mp_preference_id, mp_payment_id, payment_url, paid_at, expires_at, created_at'
    )
    .single()

  if (updateError) {
    throw new Error(updateError.message)
  }

  if (nextStatus === 'approved') {
    const { data: profile, error: profileError } = await admin
      .from('instructor_profiles')
      .select('id, user_id, full_name')
      .eq('id', subscriptionRow.instructor_id)
      .single()

    if (profileError) {
      throw new Error(profileError.message)
    }

    const { error: statusError } = await admin
      .from('instructor_profiles')
      .update({
        status: 'active',
        rejection_reason: null,
      })
      .eq('id', profile.id)

    if (statusError) {
      throw new Error(statusError.message)
    }

    await mergeUserMetadata(profile.user_id, {
      status: 'active',
      rejection_reason: null,
    })

    try {
      const { data: authUser } = await admin.auth.admin.getUserById(profile.user_id)
      const email = authUser.user?.email
      const name = authUser.user?.user_metadata?.full_name ?? profile.full_name ?? 'instrutor'

      if (email) {
        await sendInstructorActivatedEmail({
          to: email,
          name,
        })
      }
    } catch (error) {
      console.error('[email] Falha ao enviar ativacao automatica da assinatura:', error)
    }

    revalidatePath('/painel')
    revalidatePath('/buscar')
  }

  return normalizeSubscription(updatedSubscription)
}

export async function syncInstructorSubscriptionPreApprovalForInstructor(
  instructorId: string,
  preApprovalId: string,
  subscriptionId?: string | null
) {
  const admin = createAdminClient()
  const preApprovalClient = getMercadoPagoPreApprovalClient()
  const preApproval = await preApprovalClient.get({ id: preApprovalId })

  let targetSubscriptionId = subscriptionId ?? null

  if (!targetSubscriptionId) {
    const pendingSubscription = await getLatestPendingInstructorSubscription(instructorId)
    targetSubscriptionId = pendingSubscription?.id ?? null
  }

  if (!targetSubscriptionId) {
    throw new Error('Nenhuma mensalidade pendente encontrada para este instrutor.')
  }

  const nextStatus = mapPreApprovalStatus(preApproval.status)
  const approvedAt = preApproval.date_created ? new Date(preApproval.date_created) : new Date()
  const expiresAt =
    nextStatus === 'approved'
      ? preApproval.next_payment_date ?? addDays(approvedAt, MEMBERSHIP_DURATION_DAYS).toISOString()
      : null

  const { data: updatedSubscription, error: updateError } = await admin
    .from('instructor_subscriptions')
    .update({
      status: nextStatus,
      mp_preference_id: preApproval.id ?? preApprovalId,
      paid_at: nextStatus === 'approved' ? approvedAt.toISOString() : null,
      expires_at: expiresAt,
    })
    .eq('id', targetSubscriptionId)
    .eq('instructor_id', instructorId)
    .select(
      'id, instructor_id, plan, value, status, external_reference, mp_preference_id, mp_payment_id, payment_url, paid_at, expires_at, created_at'
    )
    .single()

  if (updateError) {
    throw new Error(updateError.message)
  }

  if (nextStatus === 'approved') {
    const { data: profile, error: profileError } = await admin
      .from('instructor_profiles')
      .select('id, user_id, full_name')
      .eq('id', instructorId)
      .single()

    if (profileError) {
      throw new Error(profileError.message)
    }

    const { error: statusError } = await admin
      .from('instructor_profiles')
      .update({
        status: 'active',
        rejection_reason: null,
      })
      .eq('id', profile.id)

    if (statusError) {
      throw new Error(statusError.message)
    }

    await mergeUserMetadata(profile.user_id, {
      status: 'active',
      rejection_reason: null,
    })

    try {
      const { data: authUser } = await admin.auth.admin.getUserById(profile.user_id)
      const email = authUser.user?.email
      const name = authUser.user?.user_metadata?.full_name ?? profile.full_name ?? 'instrutor'

      if (email) {
        await sendInstructorActivatedEmail({
          to: email,
          name,
        })
      }
    } catch (error) {
      console.error('[email] Falha ao enviar ativacao automatica da assinatura:', error)
    }

    revalidatePath('/painel')
    revalidatePath('/buscar')
  }

  return normalizeSubscription(updatedSubscription)
}

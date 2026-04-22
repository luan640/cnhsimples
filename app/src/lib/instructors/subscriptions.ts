import crypto from 'node:crypto'

import { revalidatePath } from 'next/cache'

import {
  getInstructorMembershipAmount,
  type InstructorSubscription,
  type InstructorSubscriptionStatus,
} from '@/lib/instructors/subscription-shared'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMercadoPagoPaymentClient, getMercadoPagoPreApprovalClient } from '@/lib/mercadopago/client'
import { sendInstructorActivatedEmail } from '@/lib/email/notifications'

export { getInstructorMembershipAmount }
const MEMBERSHIP_PREAPPROVAL_PLAN_ID = process.env.MERCADO_PAGO_PREAPPROVAL_PLAN_ID?.trim() || null
const MEMBERSHIP_DURATION_DAYS = Number(process.env.INSTRUCTOR_MEMBERSHIP_DURATION_DAYS ?? '30')

export type CreateInstructorMembershipPaymentParams = {
  instructorId: string
  amount?: number
  payerEmail: string
  cardToken: string
  cardPaymentMethodId: string
  cardIssuerId?: string | number | null
  cardInstallments?: number
  payerIdentificationType?: string
  payerIdentificationNumber?: string
}

export type InstructorMembershipPaymentResult = {
  subscriptionId: string
  mpPaymentId: string | null
  status: string
  statusDetail: string | null
}

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

async function activateInstructorFromSubscription(instructorId: string) {
  const admin = createAdminClient()
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
    console.error('[email] Falha ao enviar ativacao automatica da mensalidade:', error)
  }

  revalidatePath('/painel')
  revalidatePath('/buscar')
}

export async function syncLatestInstructorPlanSubscriptionByEmail(
  instructorId: string,
  payerEmail: string | null | undefined
) {
  if (!payerEmail?.trim() || !MEMBERSHIP_PREAPPROVAL_PLAN_ID) {
    return null
  }

  const preApprovalClient = getMercadoPagoPreApprovalClient()
  const response = await preApprovalClient.search({
    options: {
      payer_email: payerEmail.trim(),
      preapproval_plan_id: MEMBERSHIP_PREAPPROVAL_PLAN_ID,
    },
  })

  const approvedSubscription = [...(response.results ?? [])]
    .filter(
      (item) => Boolean(item.id) && item.status === 'authorized'
    )
    .sort((a, b) => {
      const aDate = a.date_created ? new Date(String(a.date_created)).getTime() : 0
      const bDate = b.date_created ? new Date(String(b.date_created)).getTime() : 0
      return bDate - aDate
    })[0]

  if (!approvedSubscription?.id) {
    return null
  }

  const currentSubscription =
    (await getLatestManageableInstructorSubscription(instructorId)) ??
    (await getLatestApprovedInstructorSubscription(instructorId)) ??
    (await getLatestInstructorSubscription(instructorId))

  return syncInstructorSubscriptionPreApprovalForInstructor(
    instructorId,
    String(approvedSubscription.id),
    currentSubscription?.id ?? null
  )
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

export async function getLatestApprovedInstructorSubscription(instructorId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('instructor_subscriptions')
    .select(
      'id, instructor_id, plan, value, status, external_reference, mp_preference_id, mp_payment_id, payment_url, paid_at, expires_at, created_at'
    )
    .eq('instructor_id', instructorId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[subscriptions] getLatestApprovedInstructorSubscription error:', error.message)
    return null
  }

  return normalizeSubscription(data)
}

export async function getLatestManageableInstructorSubscription(instructorId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('instructor_subscriptions')
    .select(
      'id, instructor_id, plan, value, status, external_reference, mp_preference_id, mp_payment_id, payment_url, paid_at, expires_at, created_at'
    )
    .eq('instructor_id', instructorId)
    .in('status', ['approved', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[subscriptions] getLatestManageableInstructorSubscription error:', error.message)
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

export async function getCheckoutEligibleInstructorSubscription(instructorId: string) {
  const approvedSubscription = await getLatestApprovedInstructorSubscription(instructorId)
  const now = Date.now()

  if (approvedSubscription) {
    const expiresAt = approvedSubscription.expires_at
      ? new Date(approvedSubscription.expires_at).getTime()
      : null

    if (!expiresAt || expiresAt > now) {
      return {
        kind: 'approved' as const,
        subscription: approvedSubscription,
      }
    }
  }

  const pendingSubscription = await getLatestPendingInstructorSubscription(instructorId)

  if (pendingSubscription?.payment_url) {
    return {
      kind: 'pending' as const,
      subscription: pendingSubscription,
    }
  }

  return {
    kind: 'new' as const,
    subscription: null,
  }
}

export async function createInstructorSubscription(instructorId: string, amount = getInstructorMembershipAmount()) {
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

async function updateSubscriptionPaymentState(
  subscriptionId: string,
  params: {
    status: InstructorSubscriptionStatus
    mpPaymentId?: string | null
    paidAt?: string | null
    expiresAt?: string | null
  }
) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('instructor_subscriptions')
    .update({
      status: params.status,
      mp_payment_id: params.mpPaymentId ?? null,
      paid_at: params.paidAt ?? null,
      expires_at: params.expiresAt ?? null,
      payment_url: null,
      mp_preference_id: null,
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
    preApprovalId?: string | null
    paymentUrl: string
  }
) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('instructor_subscriptions')
    .update({
      mp_preference_id: params.preApprovalId ?? null,
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
    await activateInstructorFromSubscription(subscriptionRow.instructor_id)
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
    await activateInstructorFromSubscription(subscriptionRow.instructor_id)
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
    const targetSubscription =
      (await getLatestManageableInstructorSubscription(instructorId)) ??
      (await getLatestApprovedInstructorSubscription(instructorId)) ??
      (await getLatestPendingInstructorSubscription(instructorId))
    targetSubscriptionId = targetSubscription?.id ?? null
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
    await activateInstructorFromSubscription(instructorId)
  }

  return normalizeSubscription(updatedSubscription)
}

export async function createInstructorMembershipPayment(
  params: CreateInstructorMembershipPaymentParams
): Promise<InstructorMembershipPaymentResult> {
  const admin = createAdminClient()
  const paymentClient = getMercadoPagoPaymentClient()
  const amount = params.amount ?? getInstructorMembershipAmount()

  const activeSubscription = await getLatestApprovedInstructorSubscription(params.instructorId)
  if (activeSubscription) {
    const expiresAt = activeSubscription.expires_at
      ? new Date(activeSubscription.expires_at).getTime()
      : null

    if (!expiresAt || expiresAt > Date.now()) {
      throw new Error('Sua mensalidade ja esta ativa.')
    }
  }

  const pendingSubscription = await getLatestPendingInstructorSubscription(params.instructorId)
  if (pendingSubscription?.mp_payment_id) {
    const existingPayment = await paymentClient.get({ id: pendingSubscription.mp_payment_id })
    const existingStatus = typeof existingPayment.status === 'string' ? existingPayment.status : 'pending'

    if (existingStatus === 'approved') {
      await syncInstructorSubscriptionPayment(pendingSubscription.mp_payment_id)
      throw new Error('Sua mensalidade ja foi aprovada. Atualize a pagina.')
    }

    if (existingStatus === 'pending' || existingStatus === 'in_process' || existingStatus === 'in_mediation') {
      throw new Error('Seu ultimo pagamento ainda esta em processamento. Aguarde alguns instantes.')
    }

    await updateSubscriptionPaymentState(pendingSubscription.id, {
      status: mapPaymentStatus(existingStatus),
      mpPaymentId: pendingSubscription.mp_payment_id,
      paidAt: null,
      expiresAt: null,
    })
  }

  const { data: instructor, error: instructorError } = await admin
    .from('instructor_profiles')
    .select('id, full_name')
    .eq('id', params.instructorId)
    .single()

  if (instructorError || !instructor) {
    throw new Error('Perfil do instrutor nao encontrado.')
  }

  const subscription = await createInstructorSubscription(params.instructorId, amount)
  if (!subscription) {
    throw new Error('Nao foi possivel criar o registro da mensalidade.')
  }
  const idempotencyKey = crypto.randomUUID()
  let payment: Awaited<ReturnType<typeof paymentClient.create>>

  try {
    payment = await paymentClient.create({
      body: {
        transaction_amount: amount,
        description: `Mensalidade CNH Simples - ${instructor.full_name}`,
        payment_method_id: params.cardPaymentMethodId,
        token: params.cardToken,
        installments: params.cardInstallments ?? 1,
        issuer_id: params.cardIssuerId ? Number(params.cardIssuerId) : undefined,
        external_reference: subscription.external_reference,
        three_d_secure_mode: 'optional' as const,
        capture: true,
        binary_mode: false,
        payer: {
          email: params.payerEmail,
          identification: {
            type: params.payerIdentificationType ?? 'CPF',
            number: (params.payerIdentificationNumber ?? '').replace(/\D/g, ''),
          },
        },
      },
      requestOptions: { idempotencyKey },
    })
  } catch (error) {
    await updateSubscriptionPaymentState(subscription.id, {
      status: 'rejected',
      mpPaymentId: null,
      paidAt: null,
      expiresAt: null,
    })
    throw error
  }

  const mpPaymentId = payment.id != null ? String(payment.id) : null
  const mpStatus = typeof payment.status === 'string' ? payment.status : 'pending'
  const mappedStatus = mapPaymentStatus(mpStatus)

  await updateSubscriptionPaymentState(subscription.id, {
    status: mappedStatus,
    mpPaymentId,
    paidAt: mappedStatus === 'approved' ? new Date().toISOString() : null,
    expiresAt:
      mappedStatus === 'approved'
        ? addDays(new Date(), MEMBERSHIP_DURATION_DAYS).toISOString()
        : null,
  })

  if (mpPaymentId && mappedStatus === 'approved') {
    await syncInstructorSubscriptionPayment(mpPaymentId)
  }

  return {
    subscriptionId: subscription.id,
    mpPaymentId,
    status: mpStatus,
    statusDetail: typeof payment.status_detail === 'string' ? payment.status_detail : null,
  }
}

export async function getInstructorMembershipStatus(instructorId: string, subscriptionId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('instructor_subscriptions')
    .select(
      'id, instructor_id, plan, value, status, external_reference, mp_preference_id, mp_payment_id, payment_url, paid_at, expires_at, created_at'
    )
    .eq('id', subscriptionId)
    .eq('instructor_id', instructorId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  const subscription = normalizeSubscription(data)
  if (!subscription) return null

  if (
    subscription.status === 'approved' ||
    subscription.status === 'rejected' ||
    subscription.status === 'cancelled' ||
    subscription.status === 'expired' ||
    !subscription.mp_payment_id
  ) {
    return { status: subscription.status }
  }

  try {
    const updated = await syncInstructorSubscriptionPayment(subscription.mp_payment_id)
    return { status: updated?.status ?? subscription.status }
  } catch (error) {
    console.error('[subscriptions] failed to sync instructor payment status during polling:', {
      instructorId,
      subscriptionId,
      mpPaymentId: subscription.mp_payment_id,
      error,
    })
  }

  return { status: subscription.status }
}

export async function cancelInstructorSubscription(instructorId: string) {
  const admin = createAdminClient()
  const subscription = await getLatestManageableInstructorSubscription(instructorId)

  if (!subscription) {
    throw new Error('Nenhuma assinatura ativa ou pendente encontrada para cancelamento.')
  }

  if (!subscription.mp_preference_id) {
    throw new Error('Assinatura sem identificador do Mercado Pago para cancelamento.')
  }

  const preApprovalClient = getMercadoPagoPreApprovalClient()
  await preApprovalClient.update({
    id: subscription.mp_preference_id,
    body: {
      status: 'cancelled',
    },
  })

  const { data: updatedSubscription, error: updateError } = await admin
    .from('instructor_subscriptions')
    .update({
      status: 'cancelled',
    })
    .eq('id', subscription.id)
    .eq('instructor_id', instructorId)
    .select(
      'id, instructor_id, plan, value, status, external_reference, mp_preference_id, mp_payment_id, payment_url, paid_at, expires_at, created_at'
    )
    .single()

  if (updateError) {
    throw new Error(updateError.message)
  }

  revalidatePath('/planos')
  revalidatePath('/painel')

  return normalizeSubscription(updatedSubscription)
}

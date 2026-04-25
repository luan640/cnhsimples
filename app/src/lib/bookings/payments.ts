import crypto from 'node:crypto'

import { createAdminClient } from '@/lib/supabase/admin'
import { getMercadoPagoPaymentClient } from '@/lib/mercadopago/client'
import { getRevenueSplitConfig } from '@/lib/revenue-split'

const BOOKING_TIMEZONE = 'America/Fortaleza'
const DEFAULT_BOOKING_LEAD_TIME_HOURS = 2

// Fixed owner_id for the single platform wallet row
const PLATFORM_WALLET_OWNER_ID = '00000000-0000-0000-0000-000000000001'

export type CreateBookingPaymentParams = {
  studentId: string
  instructorId: string
  serviceId: string
  slotIds: string[]
  lessonMode: 'meeting' | 'pickup'
  totalAmount: number
  paymentMethod: 'pix' | 'card'
  cardToken?: string
  cardPaymentMethodId?: string
  cardIssuerId?: string | number | null
  cardInstallments?: number
  payerEmail: string
  payerFirstName?: string
  payerLastName?: string
  payerCpf?: string
  payerIdentificationType?: string
  payerIdentificationNumber?: string
}

export type BookingPaymentResult = {
  bookingGroupId: string
  paymentId: string | null
  mpPaymentId: string | null
  status: string
  statusDetail: string | null
  pix: {
    qrCode: string | null
    qrCodeBase64: string | null
    ticketUrl: string | null
  } | null
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function normalizePaymentAmount(value: number) {
  if (!Number.isFinite(value)) return null
  const normalized = round2(value)
  return normalized > 0 ? normalized : null
}

function normalizeLeadTimeHours(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_BOOKING_LEAD_TIME_HOURS
  return Math.min(24, Math.max(0, Math.round(parsed)))
}

function getNowInBookingTimezoneParts() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOOKING_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(new Date())
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0')

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
  }
}

function toTimelineValue(date: string, hour: number, minute: number) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return Number.NaN
  return Date.UTC(year, month - 1, day, hour, minute, 0, 0)
}

function assertSlotsRespectLeadTime(
  slots: Array<{ date: string; hour: number; minute: number | null }>,
  leadTimeHours: number
) {
  const now = getNowInBookingTimezoneParts()
  const threshold =
    Date.UTC(now.year, now.month - 1, now.day, now.hour, now.minute, 0, 0) +
    leadTimeHours * 60 * 60 * 1000

  const hasInvalidSlot = slots.some((slot) => {
    const slotTimeline = toTimelineValue(slot.date, slot.hour, slot.minute ?? 0)
    return !Number.isFinite(slotTimeline) || slotTimeline < threshold
  })

  if (hasInvalidSlot) {
    throw new Error(
      leadTimeHours > 0
        ? `Um ou mais horarios estao fora da antecedencia minima de ${leadTimeHours}h. Atualize a pagina e selecione novos horarios.`
        : 'Um ou mais horarios selecionados ja passaram. Atualize a pagina e selecione novos horarios.'
    )
  }
}

async function getSlotsForCheckout(params: { instructorId: string; slotIds: string[] }) {
  const admin = createAdminClient()
  const uniqueSlotIds = Array.from(new Set(params.slotIds))

  const { data: slots, error } = await admin
    .from('availability_slots')
    .select('id, date, hour, minute, status, instructor_id')
    .in('id', uniqueSlotIds)

  if (error) throw new Error('Erro ao verificar disponibilidade dos horÃ¡rios.')
  if (!slots || slots.length !== uniqueSlotIds.length) {
    throw new Error('Um ou mais horÃ¡rios nÃ£o foram encontrados.')
  }
  if (slots.some((slot) => slot.instructor_id !== params.instructorId)) {
    throw new Error('HorÃ¡rios invÃ¡lidos para este instrutor.')
  }
  if (slots.some((slot) => slot.status !== 'available')) {
    throw new Error('Um ou mais horÃ¡rios nÃ£o estÃ£o mais disponÃ­veis. Atualize a pÃ¡gina e tente novamente.')
  }

  return slots
}

async function reuseExistingPendingPixPayment(params: {
  studentId: string
  instructorId: string
  serviceId: string
  slotIds: string[]
  paymentClient: ReturnType<typeof getMercadoPagoPaymentClient>
}): Promise<BookingPaymentResult | null> {
  const admin = createAdminClient()
  const normalizedSlotIds = [...new Set(params.slotIds)].sort()

  const { data: bookingGroup } = await admin
    .from('booking_groups')
    .select('id, status, slot_ids, payment_method')
    .eq('student_id', params.studentId)
    .eq('instructor_id', params.instructorId)
    .eq('service_id', params.serviceId)
    .eq('payment_method', 'pix')
    .in('status', ['pending', 'awaiting_payment'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const groupSlotIds = Array.isArray(bookingGroup?.slot_ids)
    ? bookingGroup.slot_ids.filter((id): id is string => typeof id === 'string').sort()
    : []

  if (!bookingGroup || groupSlotIds.length !== normalizedSlotIds.length) {
    return null
  }
  if (groupSlotIds.some((slotId, index) => slotId !== normalizedSlotIds[index])) {
    return null
  }

  const { data: paymentRow } = await admin
    .from('payments')
    .select('id, mp_payment_id, status')
    .eq('booking_group_id', bookingGroup.id)
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!paymentRow?.mp_payment_id) return null

  const mpPayment = await params.paymentClient.get({ id: paymentRow.mp_payment_id })
  const pointOfInteraction = mpPayment.point_of_interaction as Record<string, unknown> | undefined
  const txData = pointOfInteraction?.transaction_data as Record<string, unknown> | undefined

  return {
    bookingGroupId: bookingGroup.id,
    paymentId: paymentRow.id ?? null,
    mpPaymentId: paymentRow.mp_payment_id,
    status: typeof mpPayment.status === 'string' ? mpPayment.status : paymentRow.status,
    statusDetail: typeof mpPayment.status_detail === 'string' ? mpPayment.status_detail : null,
    pix: {
      qrCode: typeof txData?.qr_code === 'string' ? txData.qr_code : null,
      qrCodeBase64:
        typeof txData?.qr_code_base64 === 'string' ? txData.qr_code_base64 : null,
      ticketUrl: typeof txData?.ticket_url === 'string' ? txData.ticket_url : null,
    },
  }
}

export async function createBookingGroupPayment(
  params: CreateBookingPaymentParams
): Promise<BookingPaymentResult> {
  const admin = createAdminClient()
  const paymentClient = getMercadoPagoPaymentClient()
  const uniqueSlotIds = Array.from(new Set(params.slotIds))
  const normalizedTotalAmount = normalizePaymentAmount(params.totalAmount)

  if (uniqueSlotIds.length === 0) throw new Error('Selecione pelo menos um horÃ¡rio.')

  if (normalizedTotalAmount == null) throw new Error('Valor total invalido.')

  const { data: instructor, error: instructorError } = await admin
    .from('instructor_profiles')
    .select('id, status, full_name, booking_lead_time_hours')
    .eq('id', params.instructorId)
    .single()

  if (instructorError || !instructor) throw new Error('Instrutor nÃ£o encontrado.')
  if (instructor.status !== 'active') throw new Error('Instrutor nÃ£o estÃ¡ ativo na plataforma.')

  const slots = await getSlotsForCheckout({ instructorId: params.instructorId, slotIds: uniqueSlotIds })
  const bookingLeadTimeHours = normalizeLeadTimeHours(instructor.booking_lead_time_hours)
  assertSlotsRespectLeadTime(slots, bookingLeadTimeHours)

  if (params.paymentMethod === 'pix') {
    const existingPixPayment = await reuseExistingPendingPixPayment({
      studentId: params.studentId,
      instructorId: params.instructorId,
      serviceId: params.serviceId,
      slotIds: uniqueSlotIds,
      paymentClient,
    })
    if (existingPixPayment) return existingPixPayment
  }

  const splitConfig = await getRevenueSplitConfig(params.instructorId)
  const platformAmount = round2(normalizedTotalAmount * splitConfig.platformSplitRate)
  const instructorAmount = round2(normalizedTotalAmount * splitConfig.instructorSplitRate)

  const { data: bookingGroup, error: bgError } = await admin
    .from('booking_groups')
    .insert({
      student_id: params.studentId,
      instructor_id: params.instructorId,
      service_id: params.serviceId,
      slot_ids: uniqueSlotIds,
      lesson_mode: params.lessonMode,
      payment_method: params.paymentMethod,
      total_lessons: uniqueSlotIds.length,
      total_amount: normalizedTotalAmount,
      platform_amount: platformAmount,
      instructor_amount: instructorAmount,
      status: 'pending',
    })
    .select('id')
    .single()

  if (bgError || !bookingGroup) throw new Error('Falha ao criar grupo de agendamento.')

  const bookingGroupId = bookingGroup.id
  const externalReference = `booking:${bookingGroupId}:${crypto.randomUUID()}`

  try {
    const idempotencyKey = crypto.randomUUID()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mpPayment: any

    if (params.paymentMethod === 'pix') {
      mpPayment = await paymentClient.create({
        body: {
          transaction_amount: normalizedTotalAmount,
          description: `Aulas de direÃ§Ã£o â€” ${instructor.full_name}`,
          payment_method_id: 'pix',
          external_reference: externalReference,
          payer: {
            email: params.payerEmail,
            first_name: params.payerFirstName ?? undefined,
            last_name: params.payerLastName ?? undefined,
            identification: params.payerCpf
              ? { type: 'CPF', number: params.payerCpf.replace(/\D/g, '') }
              : undefined,
          },
        },
        requestOptions: { idempotencyKey },
      })
    } else if (params.paymentMethod === 'card') {
      if (!params.cardToken || !params.cardPaymentMethodId) {
        throw new Error('Token do cartÃ£o nÃ£o fornecido.')
      }

      mpPayment = await paymentClient.create({
        body: {
          transaction_amount: normalizedTotalAmount,
          description: `Aulas de direÃ§Ã£o â€” ${instructor.full_name}`,
          payment_method_id: params.cardPaymentMethodId,
          token: params.cardToken,
          installments: params.cardInstallments ?? 1,
          issuer_id: params.cardIssuerId ? Number(params.cardIssuerId) : undefined,
          external_reference: externalReference,
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
    } else {
      throw new Error('MÃ©todo de pagamento invÃ¡lido.')
    }

    const mpStatus = typeof mpPayment.status === 'string' ? mpPayment.status : 'pending'
    const mpId = mpPayment.id != null ? String(mpPayment.id) : null

    const { data: payment } = await admin
      .from('payments')
      .insert({
        booking_group_id: bookingGroupId,
        total_amount: normalizedTotalAmount,
        platform_amount: platformAmount,
        instructor_amount: instructorAmount,
        status: mpStatus === 'approved' ? 'approved' : 'pending',
        mp_payment_id: mpId,
        external_reference: externalReference,
        paid_at: mpStatus === 'approved' ? new Date().toISOString() : null,
      })
      .select('id')
      .single()

    if (mpStatus === 'approved') {
      await confirmBookingGroupPayment(bookingGroupId, mpId ?? '')
    } else {
      await admin
        .from('booking_groups')
        .update({ status: 'awaiting_payment' })
        .eq('id', bookingGroupId)
    }

    const pointOfInteraction = mpPayment.point_of_interaction as Record<string, unknown> | undefined
    const txData = pointOfInteraction?.transaction_data as Record<string, unknown> | undefined

    return {
      bookingGroupId,
      paymentId: payment?.id ?? null,
      mpPaymentId: mpId,
      status: mpStatus,
      statusDetail: typeof mpPayment.status_detail === 'string' ? mpPayment.status_detail : null,
      pix:
        params.paymentMethod === 'pix'
          ? {
              qrCode: typeof txData?.qr_code === 'string' ? txData.qr_code : null,
              qrCodeBase64:
                typeof txData?.qr_code_base64 === 'string' ? txData.qr_code_base64 : null,
              ticketUrl: typeof txData?.ticket_url === 'string' ? txData.ticket_url : null,
            }
          : null,
    }
  } catch (error) {
    await cancelBookingGroupPayment(bookingGroupId)
    throw error
  }
}

async function creditWallet(
  admin: ReturnType<typeof createAdminClient>,
  ownerId: string,
  ownerType: 'instructor' | 'platform',
  amount: number,
  description: string,
  referenceId: string
): Promise<void> {
  // Tenta ler carteira existente
  let { data: wallet, error: selectError } = await admin
    .from('wallets')
    .select('id, balance')
    .eq('owner_id', ownerId)
    .eq('owner_type', ownerType)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Falha ao buscar carteira (${ownerType}): ${selectError.message}`)
  }

  if (!wallet) {
    // Cria carteira com saldo zero; em caso de race condition (unique violation), relê
    const { data: created, error: insertError } = await admin
      .from('wallets')
      .insert({ owner_id: ownerId, owner_type: ownerType, balance: 0 })
      .select('id, balance')
      .single()

    if (insertError) {
      // Outra instância pode ter criado simultaneamente — relê
      const { data: refetched, error: refetchError } = await admin
        .from('wallets')
        .select('id, balance')
        .eq('owner_id', ownerId)
        .eq('owner_type', ownerType)
        .single()
      if (refetchError || !refetched) {
        throw new Error(`Falha ao criar/reler carteira (${ownerType}): ${insertError.message}`)
      }
      wallet = refetched
    } else {
      wallet = created
    }
  }

  // Incrementa saldo com o valor atual lido (sem resetar)
  const { error: updateError } = await admin
    .from('wallets')
    .update({ balance: round2(Number(wallet.balance) + amount) })
    .eq('id', wallet.id)

  if (updateError) {
    throw new Error(`Falha ao atualizar saldo (${ownerType}): ${updateError.message}`)
  }

  const { error: txError } = await admin.from('wallet_transactions').insert({
    wallet_id: wallet.id,
    type: 'credit',
    amount,
    description,
    reference_id: referenceId,
  })

  if (txError) {
    throw new Error(`Falha ao registrar transação (${ownerType}): ${txError.message}`)
  }
}

// Credita as carteiras de um booking group já pago, de forma idempotente.
// Seguro para chamar múltiplas vezes — verifica se já foi creditado.
async function ensureWalletsCredited(
  admin: ReturnType<typeof createAdminClient>,
  bookingGroupId: string,
  instructorId: string,
  instructorAmount: number,
  platformAmount: number,
  slotCount: number
): Promise<void> {
  // Idempotência: pula se já existe qualquer crédito para este booking group
  const { data: existing } = await admin
    .from('wallet_transactions')
    .select('id')
    .eq('reference_id', bookingGroupId)
    .eq('type', 'credit')
    .limit(1)
    .maybeSingle()

  if (existing) return

  const label = slotCount === 1
    ? 'Aula agendada — pagamento recebido'
    : `${slotCount} aulas agendadas — pagamento recebido`

  if (instructorAmount > 0) {
    await creditWallet(admin, instructorId, 'instructor', instructorAmount, label, bookingGroupId)
  }

  if (platformAmount > 0) {
    await creditWallet(
      admin,
      PLATFORM_WALLET_OWNER_ID,
      'platform',
      platformAmount,
      slotCount === 1 ? 'Comissão — aula agendada' : `Comissão — ${slotCount} aulas agendadas`,
      bookingGroupId
    )
  }
}

export async function confirmBookingGroupPayment(
  bookingGroupId: string,
  mpPaymentId: string
): Promise<void> {
  const admin = createAdminClient()

  const { data: bookingGroup, error: bgError } = await admin
    .from('booking_groups')
    .select(
      'id, status, student_id, instructor_id, service_id, lesson_mode, total_amount, platform_amount, instructor_amount, slot_ids'
    )
    .eq('id', bookingGroupId)
    .single()

  if (bgError || !bookingGroup) {
    throw new Error('Grupo de agendamento não encontrado.')
  }

  const slotIds = Array.isArray(bookingGroup.slot_ids)
    ? bookingGroup.slot_ids.filter((id): id is string => typeof id === 'string')
    : []

  if (slotIds.length === 0) {
    throw new Error('Grupo de agendamento sem horários vinculados.')
  }

  const instructorAmount = round2(Number(bookingGroup.instructor_amount))
  const platformAmount = round2(Number(bookingGroup.platform_amount))

  // Booking group já estava pago — apenas garante crédito nas carteiras (idempotente)
  if (bookingGroup.status === 'paid') {
    await ensureWalletsCredited(admin, bookingGroupId, bookingGroup.instructor_id, instructorAmount, platformAmount, slotIds.length)
    return
  }

  const slots = await getSlotsForCheckout({
    instructorId: bookingGroup.instructor_id,
    slotIds,
  })

  const { data: updatedSlots, error: slotUpdateError } = await admin
    .from('availability_slots')
    .update({ status: 'booked' })
    .in('id', slotIds)
    .eq('status', 'available')
    .select('id')

  if (slotUpdateError || !updatedSlots || updatedSlots.length !== slotIds.length) {
    throw new Error('Um ou mais horários não estão mais disponíveis. Atualize a página e tente novamente.')
  }

  const perSlotValue = round2(bookingGroup.total_amount / slotIds.length)
  const perSlotPlatform = round2(bookingGroup.platform_amount / slotIds.length)
  const perSlotInstructor = round2(bookingGroup.instructor_amount / slotIds.length)

  const bookingInserts = slots.map((slot) => ({
    student_id: bookingGroup.student_id,
    instructor_id: bookingGroup.instructor_id,
    slot_id: slot.id,
    booking_group_id: bookingGroupId,
    service_id: bookingGroup.service_id,
    lesson_mode: bookingGroup.lesson_mode,
    value: perSlotValue,
    platform_amount: perSlotPlatform,
    instructor_amount: perSlotInstructor,
    status: 'confirmed',
  }))

  const { error: bookingsError } = await admin.from('bookings').insert(bookingInserts)

  if (bookingsError) {
    await admin
      .from('availability_slots')
      .update({ status: 'available' })
      .in('id', slotIds)
      .eq('status', 'booked')

    throw new Error(`Falha ao registrar agendamentos: ${bookingsError.message}`)
  }

  await Promise.all([
    admin
      .from('booking_groups')
      .update({ status: 'paid' })
      .eq('id', bookingGroupId),
    admin
      .from('payments')
      .update({
        status: 'approved',
        mp_payment_id: mpPaymentId,
        paid_at: new Date().toISOString(),
      })
      .eq('booking_group_id', bookingGroupId),
  ])

  await ensureWalletsCredited(admin, bookingGroupId, bookingGroup.instructor_id, instructorAmount, platformAmount, slotIds.length)
}

export async function cancelBookingGroupPayment(bookingGroupId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: bookings } = await admin
    .from('bookings')
    .select('slot_id')
    .eq('booking_group_id', bookingGroupId)

  const slotIds = (bookings ?? []).map((booking) => booking.slot_id).filter(Boolean) as string[]

  await Promise.all([
    admin.from('booking_groups').update({ status: 'cancelled' }).eq('id', bookingGroupId),
    admin.from('bookings').update({ status: 'cancelled' }).eq('booking_group_id', bookingGroupId),
    slotIds.length > 0
      ? admin
          .from('availability_slots')
          .update({ status: 'available' })
          .in('id', slotIds)
          .eq('status', 'booked')
      : Promise.resolve(),
    admin
      .from('payments')
      .update({ status: 'rejected' })
      .eq('booking_group_id', bookingGroupId)
      .eq('status', 'pending'),
  ])
}

export async function processBookingPaymentWebhook(
  mpPaymentId: string | number
): Promise<'confirmed' | 'cancelled' | 'ignored' | null> {
  const admin = createAdminClient()
  const paymentClient = getMercadoPagoPaymentClient()

  const mpPayment = await paymentClient.get({ id: String(mpPaymentId) })
  const externalReference = mpPayment.external_reference

  if (!externalReference?.startsWith('booking:')) {
    return null
  }

  const { data: paymentRow } = await admin
    .from('payments')
    .select('id, booking_group_id, status')
    .eq('external_reference', externalReference)
    .maybeSingle()

  const targetPayment =
    paymentRow ??
    (await admin
      .from('payments')
      .select('id, booking_group_id, status')
      .eq('mp_payment_id', String(mpPaymentId))
      .maybeSingle()
      .then((result) => result.data))

  if (!targetPayment?.booking_group_id) {
    throw new Error(
      `Pagamento de agendamento nÃ£o encontrado: external_reference=${externalReference}, mp_payment_id=${mpPaymentId}`
    )
  }

  const mpStatus = mpPayment.status
  const localStatus = targetPayment.status

  if (mpStatus === 'approved' && localStatus !== 'approved') {
    await confirmBookingGroupPayment(targetPayment.booking_group_id, String(mpPaymentId))
    return 'confirmed'
  }

  if ((mpStatus === 'rejected' || mpStatus === 'cancelled') && localStatus === 'pending') {
    await cancelBookingGroupPayment(targetPayment.booking_group_id)
    return 'cancelled'
  }

  return 'ignored'
}

export async function getBookingGroupStatus(
  bookingGroupId: string,
  studentId: string
): Promise<{ status: string } | null> {
  const admin = createAdminClient()
  const paymentClient = getMercadoPagoPaymentClient()

  const { data: bookingGroup } = await admin
    .from('booking_groups')
    .select('status')
    .eq('id', bookingGroupId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (!bookingGroup) return null
  if (bookingGroup.status === 'cancelled' || bookingGroup.status === 'expired') {
    return { status: bookingGroup.status }
  }
  // Se já está pago, garante crédito nas carteiras (recupera falhas anteriores) e retorna
  if (bookingGroup.status === 'paid') {
    try {
      await confirmBookingGroupPayment(bookingGroupId, '')
    } catch {
      // Idempotência — ignora erros aqui; o crédito já pode ter sido feito
    }
    return { status: 'paid' }
  }

  const { data: paymentRow } = await admin
    .from('payments')
    .select('id, mp_payment_id, status')
    .eq('booking_group_id', bookingGroupId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!paymentRow?.mp_payment_id) {
    return { status: bookingGroup.status }
  }

  try {
    const mpPayment = await paymentClient.get({ id: paymentRow.mp_payment_id })
    const mpStatus = typeof mpPayment.status === 'string' ? mpPayment.status : null

    if (mpStatus === 'approved') {
      if (bookingGroup.status !== 'paid' || paymentRow.status !== 'approved') {
        await confirmBookingGroupPayment(bookingGroupId, String(paymentRow.mp_payment_id))
      }
      return { status: 'paid' }
    }

    if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      if (bookingGroup.status !== 'cancelled') {
        await cancelBookingGroupPayment(bookingGroupId)
      }
      return { status: 'cancelled' }
    }
  } catch (error) {
    console.error('[bookings/payments] failed to sync payment status during polling:', {
      bookingGroupId,
      mpPaymentId: paymentRow.mp_payment_id,
      error,
    })
  }

  return { status: bookingGroup.status }
}


import crypto from 'node:crypto'

import { createAdminClient } from '@/lib/supabase/admin'
import { getMercadoPagoPaymentClient } from '@/lib/mercadopago/client'
import { getRevenueSplitConfig } from '@/lib/revenue-split'

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

async function getSlotsForCheckout(params: { instructorId: string; slotIds: string[] }) {
  const admin = createAdminClient()
  const uniqueSlotIds = Array.from(new Set(params.slotIds))

  const { data: slots, error } = await admin
    .from('availability_slots')
    .select('id, date, hour, minute, status, instructor_id')
    .in('id', uniqueSlotIds)

  if (error) throw new Error('Erro ao verificar disponibilidade dos horários.')
  if (!slots || slots.length !== uniqueSlotIds.length) {
    throw new Error('Um ou mais horários não foram encontrados.')
  }
  if (slots.some((slot) => slot.instructor_id !== params.instructorId)) {
    throw new Error('Horários inválidos para este instrutor.')
  }
  if (slots.some((slot) => slot.status !== 'available')) {
    throw new Error('Um ou mais horários não estão mais disponíveis. Atualize a página e tente novamente.')
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

  if (uniqueSlotIds.length === 0) throw new Error('Selecione pelo menos um horário.')

  const { data: instructor, error: instructorError } = await admin
    .from('instructor_profiles')
    .select('id, status, full_name')
    .eq('id', params.instructorId)
    .single()

  if (instructorError || !instructor) throw new Error('Instrutor não encontrado.')
  if (instructor.status !== 'active') throw new Error('Instrutor não está ativo na plataforma.')

  await getSlotsForCheckout({ instructorId: params.instructorId, slotIds: uniqueSlotIds })

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
  const platformAmount = round2(params.totalAmount * splitConfig.platformSplitRate)
  const instructorAmount = round2(params.totalAmount * splitConfig.instructorSplitRate)

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
      total_amount: params.totalAmount,
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
          transaction_amount: params.totalAmount,
          description: `Aulas de direção — ${instructor.full_name}`,
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
        throw new Error('Token do cartão não fornecido.')
      }

      mpPayment = await paymentClient.create({
        body: {
          transaction_amount: params.totalAmount,
          description: `Aulas de direção — ${instructor.full_name}`,
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
      throw new Error('Método de pagamento inválido.')
    }

    const mpStatus = typeof mpPayment.status === 'string' ? mpPayment.status : 'pending'
    const mpId = mpPayment.id != null ? String(mpPayment.id) : null

    const { data: payment } = await admin
      .from('payments')
      .insert({
        booking_group_id: bookingGroupId,
        total_amount: params.totalAmount,
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

export async function confirmBookingGroupPayment(
  bookingGroupId: string,
  mpPaymentId: string
): Promise<void> {
  const admin = createAdminClient()

  const { data: bookingGroup, error: bgError } = await admin
    .from('booking_groups')
    .select(
      'id, student_id, instructor_id, service_id, lesson_mode, total_amount, platform_amount, instructor_amount, slot_ids'
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
      `Pagamento de agendamento não encontrado: external_reference=${externalReference}, mp_payment_id=${mpPaymentId}`
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
  if (
    bookingGroup.status === 'paid' ||
    bookingGroup.status === 'cancelled' ||
    bookingGroup.status === 'expired'
  ) {
    return { status: bookingGroup.status }
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

'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { completeSingleLesson } from '@/lib/bookings/payments'
import { sendStudentLessonConfirmedEmail } from '@/lib/email/notifications'

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${dateStr}T00:00:00`))
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export type ConfirmLessonResult =
  | { ok: true }
  | { ok: false; error: string }

export async function confirmLesson(formData: FormData): Promise<ConfirmLessonResult> {
  const bookingId = formData.get('bookingId')
  const file = formData.get('receipt') as File | null

  if (!bookingId || typeof bookingId !== 'string') {
    return { ok: false, error: 'Booking inválido.' }
  }

  if (!file || file.size === 0) {
    return { ok: false, error: 'Comprovante é obrigatório.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Não autenticado.' }

  const admin = createAdminClient()

  // Fetch booking and verify ownership
  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select(`
      id,
      student_id,
      slot_id,
      instructor_id,
      instructor_amount,
      platform_amount,
      status,
      availability_slots ( date, hour, minute ),
      instructor_profiles!inner ( user_id, full_name ),
      student_profiles ( full_name )
    `)
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return { ok: false, error: 'Aula não encontrada.' }
  }

  const instructor = Array.isArray(booking.instructor_profiles)
    ? booking.instructor_profiles[0]
    : (booking.instructor_profiles as any)

  if (instructor?.user_id !== user.id) {
    return { ok: false, error: 'Sem permissão.' }
  }

  if ((booking as any).status === 'completed') {
    return { ok: false, error: 'Aula já confirmada.' }
  }

  // Upload receipt to Supabase Storage
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const ext = file.name.split('.').pop() ?? 'pdf'
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
  const storagePath = `${booking.instructor_id}/${bookingId}/comprovante-${Date.now()}.${safeExt}`

  const { error: uploadError } = await admin.storage
    .from('lesson-receipts')
    .upload(storagePath, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    return { ok: false, error: `Falha ao enviar arquivo: ${uploadError.message}` }
  }

  const { data: urlData } = admin.storage
    .from('lesson-receipts')
    .getPublicUrl(storagePath)

  const receiptUrl = urlData.publicUrl

  // Update booking with receipt and confirmed_at
  const { error: updateError } = await admin
    .from('bookings')
    .update({
      receipt_url: receiptUrl,
      confirmed_at: new Date().toISOString(),
    } as any)
    .eq('id', bookingId)

  if (updateError) {
    return { ok: false, error: `Falha ao salvar comprovante: ${updateError.message}` }
  }

  // Complete lesson and settle wallets
  const slot = Array.isArray(booking.availability_slots)
    ? (booking.availability_slots as any[])[0]
    : (booking.availability_slots as any)

  try {
    await completeSingleLesson({
      bookingId,
      slotId: (booking as any).slot_id,
      instructorId: booking.instructor_id as string,
      instructorAmount: Number((booking as any).instructor_amount ?? 0),
      platformAmount: Number((booking as any).platform_amount ?? 0),
    })
  } catch (err) {
    console.error('[aulas] Falha ao creditar carteiras:', err)
  }

  // Send email to student
  try {
    const { data: authUser } = await admin.auth.admin.getUserById((booking as any).student_id)
    const studentEmail = authUser.user?.email

    const student = Array.isArray(booking.student_profiles)
      ? (booking.student_profiles as any[])[0]
      : (booking.student_profiles as any)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    if (studentEmail && slot) {
      await sendStudentLessonConfirmedEmail({
        to: studentEmail,
        studentName: student?.full_name ?? 'Aluno',
        instructorName: instructor?.full_name ?? 'Instrutor',
        lessonDate: formatDate(slot.date),
        lessonTime: formatTime(slot.hour ?? 0, slot.minute ?? 0),
        receiptUrl,
        lessonsUrl: `${appUrl}/aluno`,
      })
    }
  } catch (err) {
    console.error('[aulas] Falha ao enviar e-mail ao aluno:', err)
  }

  return { ok: true }
}

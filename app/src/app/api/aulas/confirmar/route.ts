import { NextRequest, NextResponse } from 'next/server'

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

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  const bookingId = formData.get('bookingId')
  const file = formData.get('receipt') as File | null

  if (!bookingId || typeof bookingId !== 'string') {
    return NextResponse.json({ error: 'Booking inválido.' }, { status: 400 })
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Comprovante é obrigatório.' }, { status: 400 })
  }

  const admin = createAdminClient()

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
    return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 })
  }

  const instructor = Array.isArray(booking.instructor_profiles)
    ? booking.instructor_profiles[0]
    : (booking.instructor_profiles as any)

  if (instructor?.user_id !== user.id) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  if ((booking as any).status === 'completed') {
    return NextResponse.json({ error: 'Aula já confirmada.' }, { status: 409 })
  }

  // Upload file to Supabase Storage
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const ext = (file.name.split('.').pop() ?? 'pdf').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
  const storagePath = `${booking.instructor_id}/${bookingId}/comprovante-${Date.now()}.${ext}`

  const { error: uploadError } = await admin.storage
    .from('lesson-receipts')
    .upload(storagePath, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: `Falha ao enviar arquivo: ${uploadError.message}` }, { status: 500 })
  }

  const { data: urlData } = admin.storage.from('lesson-receipts').getPublicUrl(storagePath)
  const receiptUrl = urlData.publicUrl

  // Save receipt_url and confirmed_at
  const { error: updateError } = await admin
    .from('bookings')
    .update({ receipt_url: receiptUrl, confirmed_at: new Date().toISOString() } as any)
    .eq('id', bookingId)

  if (updateError) {
    return NextResponse.json({ error: `Falha ao salvar: ${updateError.message}` }, { status: 500 })
  }

  // Credit wallets
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
    console.error('[aulas/confirmar] Falha ao creditar carteiras:', err)
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
    console.error('[aulas/confirmar] Falha ao enviar e-mail:', err)
  }

  return NextResponse.json({ ok: true, receiptUrl })
}

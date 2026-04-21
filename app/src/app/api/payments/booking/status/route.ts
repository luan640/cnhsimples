import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBookingGroupStatus } from '@/lib/bookings/payments'

export async function GET(request: NextRequest) {
  const bookingGroupId = request.nextUrl.searchParams.get('booking_group_id')

  if (!bookingGroupId) {
    return NextResponse.json({ error: 'booking_group_id obrigatório.' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: studentProfile } = await admin
    .from('student_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!studentProfile) {
    return NextResponse.json({ error: 'Perfil de aluno não encontrado.' }, { status: 404 })
  }

  const result = await getBookingGroupStatus(bookingGroupId, studentProfile.id)

  if (!result) {
    return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 })
  }

  return NextResponse.json(result)
}

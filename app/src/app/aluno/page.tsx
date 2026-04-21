import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStudentBookings } from '@/lib/students/home'
import { StudentHome } from '@/components/student/StudentHome'

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login/aluno')
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('student_profiles')
    .select('id, full_name, photo_url')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    redirect('/cadastro/aluno')
  }

  const meta = user.user_metadata as Record<string, string | null>
  const name = profile.full_name ?? meta.full_name ?? meta.name ?? user.email ?? 'Aluno'
  const photoUrl = profile.photo_url ?? meta.avatar_url ?? meta.photo_url ?? null

  const bookings = await getStudentBookings(profile.id)

  return <StudentHome name={name} photoUrl={photoUrl} bookings={bookings} />
}

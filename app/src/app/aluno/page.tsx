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

  const [{ data: profile }, { data: instructorProfile }] = await Promise.all([
    admin
      .from('student_profiles')
      .select('id, full_name, photo_url')
      .eq('user_id', user.id)
      .maybeSingle(),
    admin
      .from('instructor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const meta = user.user_metadata as Record<string, string | null>

  // Só redireciona ao painel se o usuário tem um perfil de instrutor real
  if (!profile && instructorProfile) {
    redirect('/painel')
  }

  // Cria perfil de aluno caso não exista (ex: falha silenciosa no callback OAuth)
  let resolvedProfile = profile
  if (!profile) {
    const fullName =
      meta.full_name ?? meta.name ?? user.email?.split('@')[0] ?? 'Aluno'
    const { data: created } = await admin
      .from('student_profiles')
      .insert({
        user_id: user.id,
        full_name: fullName,
        cpf: `oauth-${user.id}`,
        birth_date: '2000-01-01',
        phone: '',
        photo_url: meta.avatar_url ?? meta.photo_url ?? null,
        cep: '',
        city: '',
        neighborhood: '',
        has_cnh: false,
        category_interest: 'B',
        lesson_goals: [],
      })
      .select('id, full_name, photo_url')
      .single()
    resolvedProfile = created
  }

  const name = resolvedProfile?.full_name ?? meta.full_name ?? meta.name ?? user.email ?? 'Aluno'
  const photoUrl = resolvedProfile?.photo_url ?? meta.avatar_url ?? meta.photo_url ?? null

  const bookings = resolvedProfile ? await getStudentBookings(resolvedProfile.id) : []

  return <StudentHome name={name} photoUrl={photoUrl} bookings={bookings} />
}

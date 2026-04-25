import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentProfileForm } from './StudentProfileForm'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/aluno')

  const meta = (user.user_metadata ?? {}) as Record<string, string | number | null>

  return (
    <StudentProfileForm
      name={(meta.full_name ?? meta.name ?? user.email ?? '') as string}
      email={user.email ?? ''}
      photoUrl={(meta.avatar_url ?? meta.photo_url ?? null) as string | null}
      initialBirthDate={(meta.birth_date ?? '') as string}
      initialGender={(meta.gender ?? '') as string}
      initialCep={(meta.cep ?? '') as string}
      initialNeighborhood={(meta.neighborhood ?? '') as string}
      initialCity={(meta.city ?? '') as string}
      initialLatitude={(meta.latitude ?? null) as number | null}
      initialLongitude={(meta.longitude ?? null) as number | null}
    />
  )
}

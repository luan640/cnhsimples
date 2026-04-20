import { redirect } from 'next/navigation'

import { InstructorProfileView } from '@/components/painel/InstructorProfileView'
import { getInstructorFullProfile } from '@/lib/instructors/perfil'
import { createClient } from '@/lib/supabase/server'

export default async function InstructorProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login/instrutor')

  const profile = await getInstructorFullProfile(user.id)

  if (!profile) redirect('/painel')

  return <InstructorProfileView profile={profile} email={user.email ?? ''} />
}

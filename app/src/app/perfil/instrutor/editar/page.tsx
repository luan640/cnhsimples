import { redirect } from 'next/navigation'

import { EditProfileForm } from '@/components/painel/InstructorProfileForms'
import { getInstructorFullProfile } from '@/lib/instructors/perfil'
import { createClient } from '@/lib/supabase/server'

export default async function EditInstructorProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login/instrutor')

  const profile = await getInstructorFullProfile(user.id)
  if (!profile) redirect('/painel')

  return <EditProfileForm profile={profile} />
}

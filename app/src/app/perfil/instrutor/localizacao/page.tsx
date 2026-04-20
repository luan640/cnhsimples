import { redirect } from 'next/navigation'

import { EditLocationForm } from '@/components/painel/InstructorProfileForms'
import { getInstructorFullProfile } from '@/lib/instructors/perfil'
import { createClient } from '@/lib/supabase/server'

export default async function EditInstructorLocationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login/instrutor')

  const profile = await getInstructorFullProfile(user.id)
  if (!profile) redirect('/painel')

  return <EditLocationForm profile={profile} email={user.email ?? ''} />
}

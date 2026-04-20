import { redirect } from 'next/navigation'

import { EditDocumentsForm } from '@/components/painel/InstructorProfileForms'
import { getInstructorFullProfile } from '@/lib/instructors/perfil'
import { createClient } from '@/lib/supabase/server'

export default async function EditInstructorDocumentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login/instrutor')

  const profile = await getInstructorFullProfile(user.id)
  if (!profile) redirect('/painel')

  return <EditDocumentsForm profile={profile} />
}

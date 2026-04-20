import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInstructorProfile } from '@/lib/instructors/dashboard'
import { getInstructorServices } from '@/lib/instructors/services'
import { ServicosView } from '@/components/painel/ServicosView'

export default async function ServicosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/instrutor')

  const profile = await getInstructorProfile(user.id)
  if (!profile) redirect('/painel')

  const services = await getInstructorServices(profile.id)

  return <ServicosView profileId={profile.id} initialServices={services} />
}

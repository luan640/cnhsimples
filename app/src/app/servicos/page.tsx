import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInstructorProfile } from '@/lib/instructors/dashboard'
import { getInstructorServices } from '@/lib/instructors/services'
import { ServicosView } from '@/components/painel/ServicosView'
import { getRevenueSplitConfig } from '@/lib/revenue-split'

export default async function ServicosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/instrutor')

  const profile = await getInstructorProfile(user.id)
  if (!profile) redirect('/painel')

  const [services, revenueSplit] = await Promise.all([
    getInstructorServices(profile.id),
    getRevenueSplitConfig(profile.id),
  ])

  return (
    <ServicosView
      initialServices={services}
      platformSplitRate={revenueSplit.platformSplitRate}
    />
  )
}

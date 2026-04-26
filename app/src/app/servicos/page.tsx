import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInstructorProfile } from '@/lib/instructors/dashboard'
import { getInstructorServices } from '@/lib/instructors/services'
import { ServicosView } from '@/components/painel/ServicosView'
import { getRevenueSplitConfig } from '@/lib/revenue-split'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function ServicosPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/instrutor')

  const profile = await getInstructorProfile(user.id)
  if (!profile) redirect('/painel')

  const params = await searchParams
  const fromOnboarding = params.from === 'onboarding'

  const [services, revenueSplit] = await Promise.all([
    getInstructorServices(profile.id),
    getRevenueSplitConfig(profile.id),
  ])

  return (
    <ServicosView
      initialServices={services}
      platformSplitRate={revenueSplit.platformSplitRate}
      fromOnboarding={fromOnboarding}
    />
  )
}

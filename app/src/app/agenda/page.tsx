import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInstructorProfile } from '@/lib/instructors/dashboard'
import { getAgendaData, getScheduleRules, autoExtendScheduleSlots } from '@/lib/instructors/agenda'
import { AgendaView } from '@/components/painel/AgendaView'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function AgendaPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/instrutor')

  const profile = await getInstructorProfile(user.id)
  if (!profile) redirect('/painel')

  const params = await searchParams
  const fromOnboarding = params.from === 'onboarding'

  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().split('T')[0]
  const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0)
    .toISOString().split('T')[0]

  const scheduleRules = await getScheduleRules(profile.id)
  await autoExtendScheduleSlots(profile.id, scheduleRules, startDate, endDate)
  const agendaData = await getAgendaData(profile.id, startDate, endDate)

  return (
    <AgendaView
      profileId={profile.id}
      initialSlots={agendaData.slots}
      initialAbsences={agendaData.absences}
      initialRules={scheduleRules}
      fromOnboarding={fromOnboarding}
    />
  )
}

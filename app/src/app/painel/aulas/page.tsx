export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

import { MinhasAulas } from '@/components/painel/MinhasAulas'
import { getInstructorProfile } from '@/lib/instructors/dashboard'
import { getInstructorLessons } from '@/lib/instructors/aulas'
import { createClient } from '@/lib/supabase/server'

export default async function AulasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getInstructorProfile(user.id)
  if (!profile) redirect('/painel')

  const lessons = await getInstructorLessons(profile.id)

  return <MinhasAulas lessons={lessons} />
}

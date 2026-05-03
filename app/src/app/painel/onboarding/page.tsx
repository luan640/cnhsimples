export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

import { getInstructorProfile, resolveInstructorStatus } from '@/lib/instructors/dashboard'
import { getOnboardingSteps } from '@/lib/instructors/onboarding'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from './OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await getInstructorProfile(user.id)
  const metaStatus: string = user.user_metadata?.status ?? 'pending'
  const status = resolveInstructorStatus(profile?.status, metaStatus)

  if (!profile || (status !== 'active' && status !== 'docs_approved')) redirect('/painel')

  const steps = await getOnboardingSteps(profile.id)
  const isDone = steps.find(s => s.id === 'done')?.completed ?? false
  if (isDone) redirect('/painel')

  const firstName = (profile.full_name ?? 'Instrutor').split(' ')[0]

  return <OnboardingWizard steps={steps} firstName={firstName} />
}

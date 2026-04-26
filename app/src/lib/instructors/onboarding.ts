import { createAdminClient } from '@/lib/supabase/admin'

export type OnboardingStepId = 'service' | 'agenda' | 'pix' | 'done'

export type OnboardingStep = {
  id: OnboardingStepId
  completed: boolean
}

export async function getOnboardingSteps(profileId: string): Promise<OnboardingStep[]> {
  const admin = createAdminClient()

  const [servicesResult, scheduleResult, profileResult] = await Promise.all([
    admin
      .from('instructor_services')
      .select('id', { count: 'exact', head: true })
      .eq('instructor_id', profileId),
    admin
      .from('schedule_rules')
      .select('id', { count: 'exact', head: true })
      .eq('instructor_id', profileId),
    admin
      .from('instructor_profiles')
      .select('pix_key, onboarding_completed')
      .eq('id', profileId)
      .single(),
  ])

  const hasService = (servicesResult.count ?? 0) > 0
  const hasAgenda = (scheduleResult.count ?? 0) > 0
  const hasPix = Boolean(profileResult.data?.pix_key?.trim())

  return [
    { id: 'service', completed: hasService },
    { id: 'agenda', completed: hasAgenda },
    { id: 'pix', completed: hasPix },
    { id: 'done', completed: Boolean(profileResult.data?.onboarding_completed) },
  ]
}

export async function markOnboardingCompleted(profileId: string) {
  const admin = createAdminClient()
  await admin
    .from('instructor_profiles')
    .update({ onboarding_completed: true })
    .eq('id', profileId)
}

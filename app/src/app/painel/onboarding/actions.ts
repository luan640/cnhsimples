'use server'

import { redirect } from 'next/navigation'

import { getInstructorProfile } from '@/lib/instructors/dashboard'
import { markOnboardingCompleted } from '@/lib/instructors/onboarding'
import { createClient } from '@/lib/supabase/server'

export async function completeOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getInstructorProfile(user.id)
  if (!profile) redirect('/painel')

  await markOnboardingCompleted(profile.id)
  redirect('/painel')
}

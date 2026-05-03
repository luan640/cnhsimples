export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

import { AwaitingScreen } from '@/components/painel/AwaitingScreen'
import { DashboardHome } from '@/components/painel/DashboardHome'
import {
  getDashboardStats,
  getInstructorProfile,
  resolveInstructorStatus,
} from '@/lib/instructors/dashboard'
import { getOnboardingSteps } from '@/lib/instructors/onboarding'
import { createClient } from '@/lib/supabase/server'

export default async function PainelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const meta = user.user_metadata ?? {}
  const metaStatus: string = meta.status ?? 'pending'
  const metaRole: string = meta.role ?? ''

  const profile = await getInstructorProfile(user.id)

  if (!profile && metaRole === 'student') redirect('/aluno')

  const status = resolveInstructorStatus(profile?.status, metaStatus)
  const instructorName = profile?.full_name ?? (meta.full_name as string | undefined) ?? 'Instrutor'
  const rejectionReason = profile?.rejection_reason ?? (meta.rejection_reason as string | undefined) ?? null

  if (!profile || status === 'pending' || status === 'docs_rejected') {
    return (
      <AwaitingScreen
        status={!profile || status === 'pending' ? 'pending' : 'docs_rejected'}
        instructorName={instructorName}
        rejectionReason={rejectionReason}
      />
    )
  }

  if (status === 'inactive' || status === 'suspended') {
    return (
      <AwaitingScreen
        status="pending"
        instructorName={instructorName}
        rejectionReason={
          status === 'suspended'
            ? 'Sua conta esta suspensa. Entre em contato com o suporte.'
            : 'Sua conta esta inativa. Entre em contato com o suporte para reativa-la.'
        }
      />
    )
  }

  const onboardingSteps = await getOnboardingSteps(profile.id)
  const onboardingDone = onboardingSteps.find(s => s.id === 'done')?.completed ?? false
  const onboardingPending = !onboardingDone && onboardingSteps.some(s => s.id !== 'done' && !s.completed)
  if (onboardingPending) redirect('/painel/onboarding')

  const stats = await getDashboardStats(profile.id)

  return <DashboardHome profile={profile} stats={stats} />
}

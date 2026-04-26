export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

import { AwaitingScreen } from '@/components/painel/AwaitingScreen'
import { DashboardHome } from '@/components/painel/DashboardHome'
import {
  getDashboardStats,
  getInstructorProfile,
  resolveInstructorStatus,
} from '@/lib/instructors/dashboard'
import {
  getLatestInstructorSubscription,
  syncLatestInstructorPlanSubscriptionByEmail,
} from '@/lib/instructors/subscriptions'
import { isInstructorSubscriptionActiveForAccess } from '@/lib/instructors/subscription-shared'
import { getOnboardingSteps } from '@/lib/instructors/onboarding'
import { createClient } from '@/lib/supabase/server'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function PainelPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams

  if (!user) {
    redirect('/login')
  }

  const meta = user.user_metadata ?? {}
  const metaStatus: string = meta.status ?? 'pending'
  const metaRole: string = meta.role ?? ''

  if (metaRole && metaRole !== 'instructor') {
    redirect('/buscar')
  }

  const profile = await getInstructorProfile(user.id)
  const status = resolveInstructorStatus(profile?.status, metaStatus)
  const instructorName = profile?.full_name ?? (meta.full_name as string | undefined) ?? 'Instrutor'
  const rejectionReason = profile?.rejection_reason ?? (meta.rejection_reason as string | undefined) ?? null
  let membership = profile ? await getLatestInstructorSubscription(profile.id) : null
  const membershipFlash = getSingleParam(params.mensalidade) ?? null

  if (profile && user.email) {
    try {
      const syncedMembership = await syncLatestInstructorPlanSubscriptionByEmail(profile.id, user.email)
      if (syncedMembership) {
        membership = syncedMembership
      }
    } catch (error) {
      console.error('[painel] failed to sync latest recurring membership:', error)
    }
  }

  const hasActiveMembershipAccess = isInstructorSubscriptionActiveForAccess(membership)
  const shouldShowOnboardingWizard =
    !profile ||
    status === 'pending' ||
    status === 'docs_rejected' ||
    (
      !hasActiveMembershipAccess &&
      status !== 'inactive' &&
      status !== 'suspended'
    )

  if (shouldShowOnboardingWizard) {
    const awaitingStatus =
      !profile || status === 'pending'
        ? 'pending'
        : status === 'docs_rejected'
          ? 'docs_rejected'
          : 'docs_approved'

    return (
      <AwaitingScreen
        status={awaitingStatus}
        instructorName={instructorName}
        rejectionReason={rejectionReason}
        membership={membership}
        membershipFlash={membershipFlash}
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

  if (!profile) {
    return (
      <AwaitingScreen
        status="pending"
        instructorName={instructorName}
        rejectionReason={null}
      />
    )
  }

  // Redirect to onboarding wizard if instructor hasn't completed setup
  const onboardingSteps = await getOnboardingSteps(profile.id)
  const onboardingDone = onboardingSteps.find(s => s.id === 'done')?.completed ?? false
  const onboardingPending = !onboardingDone && onboardingSteps.some(s => s.id !== 'done' && !s.completed)
  if (onboardingPending) redirect('/painel/onboarding')

  const stats = await getDashboardStats(profile.id)

  return (
    <DashboardHome
      profile={profile}
      stats={stats}
      membership={membership}
      membershipFlash={membershipFlash}
    />
  )
}

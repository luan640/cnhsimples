import { redirect } from 'next/navigation'

import { InstructorBottomNav } from '@/components/painel/InstructorBottomNav'
import { InstructorSidebar } from '@/components/painel/InstructorSidebar'
import { getInstructorProfile, resolveInstructorStatus } from '@/lib/instructors/dashboard'
import { createClient } from '@/lib/supabase/server'

export default async function InstructorProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login/instrutor')

  const profile = await getInstructorProfile(user.id)
  const metaStatus = user.user_metadata?.status ?? 'pending'
  const status = resolveInstructorStatus(profile?.status, metaStatus)

  if (status !== 'active') redirect('/painel')

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <InstructorSidebar />
      <div className="min-h-screen pb-20 lg:ml-60 lg:pb-0">{children}</div>
      <InstructorBottomNav />
    </div>
  )
}

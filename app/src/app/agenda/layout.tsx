import { InstructorBottomNav } from '@/components/painel/InstructorBottomNav'
import { InstructorSidebar } from '@/components/painel/InstructorSidebar'
import { getInstructorProfile, resolveInstructorStatus } from '@/lib/instructors/dashboard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AgendaLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login/instrutor')

  const profile = await getInstructorProfile(user.id)
  const metaStatus = user.user_metadata?.status ?? 'pending'
  const status = resolveInstructorStatus(profile?.status, metaStatus)

  if (status !== 'active') redirect('/painel')

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <InstructorSidebar />
      <div className="lg:ml-60 min-h-screen pb-20 lg:pb-0">
        {children}
      </div>
      <InstructorBottomNav />
    </div>
  )
}

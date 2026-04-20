import { InstructorBottomNav } from '@/components/painel/InstructorBottomNav'
import { InstructorSidebar } from '@/components/painel/InstructorSidebar'
import { getInstructorProfile, resolveInstructorStatus } from '@/lib/instructors/dashboard'
import { createClient } from '@/lib/supabase/server'

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const profile = user ? await getInstructorProfile(user.id) : null
  const metaStatus = user?.user_metadata?.status ?? 'pending'
  const status = resolveInstructorStatus(profile?.status, metaStatus)
  const isActive = status === 'active'

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      {isActive && <InstructorSidebar />}

      <div className={isActive ? 'lg:ml-60 min-h-screen pb-20 lg:pb-0' : 'min-h-screen'}>
        {children}
      </div>

      {isActive && <InstructorBottomNav />}
    </div>
  )
}

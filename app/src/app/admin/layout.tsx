import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'luanengproduc@gmail.com'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/login/admin')
  }

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <AdminSidebar />
      <main className="lg:ml-60 min-h-screen">
        {children}
      </main>
    </div>
  )
}

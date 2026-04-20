'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, CalendarDays, Wallet, User, Car, LogOut, BadgeDollarSign,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/painel', icon: LayoutDashboard, label: 'Painel' },
  { href: '/agenda', icon: CalendarDays, label: 'Agenda' },
  { href: '/painel/planos', icon: BadgeDollarSign, label: 'Plano' },
  { href: '/carteira', icon: Wallet, label: 'Carteira' },
  { href: '/perfil/instrutor', icon: User, label: 'Meu Perfil' },
]

export function InstructorSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [fullName, setFullName] = useState<string>('')
  const [initials, setInitials] = useState<string>('IN')
  const [status, setStatus] = useState<string>('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const name: string = data.user?.user_metadata?.full_name ?? data.user?.email ?? ''
      if (name) {
        setFullName(name)
        setInitials(
          name
            .split(' ')
            .slice(0, 2)
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
        )
      }
      setStatus(data.user?.user_metadata?.status ?? '')
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 hidden lg:flex flex-col z-40"
      style={{ background: '#1c1c1c', borderRight: '1px solid #333333' }}
    >
      {/* logo */}
      <div className="h-16 flex items-center px-4 shrink-0" style={{ borderBottom: '1px solid #333333' }}>
        <Link href="/painel" className="flex items-center gap-2 font-semibold text-white">
          <div
            className="w-7 h-7 rounded-[6px] flex items-center justify-center"
            style={{ background: '#3ECF8E' }}
          >
            <Car size={15} color="#0F172A" />
          </div>
          <span className="text-sm">CNH Simples</span>
        </Link>
      </div>

      {/* nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: '#555555' }}>
          Menu
        </p>
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm transition-colors"
                style={{
                  background: isActive ? '#242424' : 'transparent',
                  color: isActive ? '#f4f4f5' : '#a1a1aa',
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <Icon
                  size={17}
                  style={{ color: isActive ? '#3ECF8E' : '#a1a1aa', flexShrink: 0 }}
                />
                {label}
                {isActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: '#3ECF8E' }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* user footer */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid #333333' }}>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] mb-1"
          style={{ background: '#242424' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: '#3ECF8E', color: '#0F172A' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: '#f4f4f5' }}>
              {fullName || 'Instrutor'}
            </p>
            {status && (
              <p className="text-[11px]" style={{ color: status === 'active' ? '#3ECF8E' : '#F59E0B' }}>
                {status === 'active' ? 'Ativo' : status === 'docs_approved' ? 'Aguardando pagamento' : 'Em análise'}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-[6px] transition-colors"
          style={{ color: '#a1a1aa' }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#242424'
            e.currentTarget.style.color = '#f4f4f5'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#a1a1aa'
          }}
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  )
}

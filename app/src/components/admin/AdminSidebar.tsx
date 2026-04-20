'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Banknote, Wallet, Car, LogOut, ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/admin',            icon: LayoutDashboard, label: 'Visão Geral',  exact: true },
  { href: '/admin/instrutores', icon: Users,           label: 'Instrutores', exact: false },
  { href: '/admin/saques',      icon: Banknote,        label: 'Saques',      exact: false },
  { href: '/admin/carteiras',   icon: Wallet,          label: 'Carteiras',   exact: false },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login/admin')
  }

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 hidden lg:flex flex-col z-40"
      style={{ background: '#1c1c1c', borderRight: '1px solid #333333' }}
    >
      {/* logo */}
      <div className="h-16 flex items-center gap-2.5 px-4 shrink-0" style={{ borderBottom: '1px solid #333333' }}>
        <div className="w-7 h-7 rounded-[6px] flex items-center justify-center" style={{ background: '#3ECF8E' }}>
          <Car size={15} color="#0F172A" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white leading-none">CNH Simples</p>
          <p className="text-[11px] mt-0.5" style={{ color: '#a1a1aa' }}>Painel Admin</p>
        </div>
      </div>

      {/* badge admin */}
      <div className="mx-3 mt-3">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[6px] text-xs font-semibold"
          style={{ background: 'rgba(62,207,142,0.1)', color: '#3ECF8E' }}
        >
          <ShieldCheck size={13} />
          Administrador
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: '#555555' }}>
          Gerenciar
        </p>
        <div className="space-y-0.5">
          {NAV.map(({ href, icon: Icon, label, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm transition-colors"
                style={{
                  background: isActive ? '#242424' : 'transparent',
                  color:      isActive ? '#f4f4f5' : '#a1a1aa',
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <Icon size={17} style={{ color: isActive ? '#3ECF8E' : '#a1a1aa', flexShrink: 0 }} />
                {label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#3ECF8E' }} />}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* logout */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid #333333' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-[6px] transition-colors"
          style={{ color: '#a1a1aa' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#242424'; e.currentTarget.style.color = '#f4f4f5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa' }}
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  )
}

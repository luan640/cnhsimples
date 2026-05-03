'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Banknote, Car, LayoutDashboard, LogOut, ShieldCheck, Users, Wallet } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/admin', icon: LayoutDashboard, label: 'Visao Geral', exact: true },
  { href: '/admin/alunos', icon: Users, label: 'Alunos', exact: false },
  { href: '/admin/instrutores', icon: Users, label: 'Instrutores', exact: false },
  { href: '/admin/saques', icon: Banknote, label: 'Saques', exact: false },
  { href: '/admin/carteiras', icon: Wallet, label: 'Carteiras', exact: false },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login/admin')
  }

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col lg:flex"
      style={{ background: '#1c1c1c', borderRight: '1px solid #333333' }}
    >
      <div
        className="flex h-16 shrink-0 items-center gap-2.5 px-4"
        style={{ borderBottom: '1px solid #333333' }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-[6px]"
          style={{ background: '#3ECF8E' }}
        >
          <Car size={15} color="#0F172A" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-none text-white">Direção Fácil</p>
          <p className="mt-0.5 text-[11px]" style={{ color: '#a1a1aa' }}>
            Painel Admin
          </p>
        </div>
      </div>

      <div className="mx-3 mt-3">
        <div
          className="flex items-center gap-2 rounded-[6px] px-3 py-2 text-xs font-semibold"
          style={{ background: 'rgba(62,207,142,0.1)', color: '#3ECF8E' }}
        >
          <ShieldCheck size={13} />
          Administrador
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p
          className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: '#555555' }}
        >
          Gerenciar
        </p>
        <div className="space-y-0.5">
          {NAV.map(({ href, icon: Icon, label, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)

            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-sm transition-colors"
                style={{
                  background: isActive ? '#242424' : 'transparent',
                  color: isActive ? '#f4f4f5' : '#a1a1aa',
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <Icon size={17} style={{ color: isActive ? '#3ECF8E' : '#a1a1aa', flexShrink: 0 }} />
                {label}
                {isActive && (
                  <span
                    className="ml-auto h-1.5 w-1.5 rounded-full"
                    style={{ background: '#3ECF8E' }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="shrink-0 p-3" style={{ borderTop: '1px solid #333333' }}>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-[6px] px-3 py-2.5 text-sm transition-colors"
          style={{ color: '#a1a1aa' }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = '#242424'
            event.currentTarget.style.color = '#f4f4f5'
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = 'transparent'
            event.currentTarget.style.color = '#a1a1aa'
          }}
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  )
}

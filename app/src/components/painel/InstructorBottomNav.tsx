'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  User,
  Wallet,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MAIN_ITEMS = [
  { href: '/painel', icon: LayoutDashboard, label: 'Painel' },
  { href: '/agenda', icon: CalendarDays, label: 'Agenda' },
  { href: '/painel/aulas', icon: GraduationCap, label: 'Aulas' },
  { href: '/carteira', icon: Wallet, label: 'Carteira' },
  { href: '/perfil/instrutor', icon: User, label: 'Perfil' },
]

const MORE_ITEMS = [
  { href: '/servicos', icon: BookOpen, label: 'Serviços' },
]

export function InstructorBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  function navigateTo(href: string) {
    setDrawerOpen(false)
    if (href === pathname) return
    setPendingHref(href)
    router.push(href)
  }

  async function handleLogout() {
    setDrawerOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isMoreActive = MORE_ITEMS.some(item => pathname === item.href)

  return (
    <>
      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-[20px] pb-safe"
            style={{ background: '#1c1c1c', borderTop: '1px solid #333' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: '#444' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#555' }}>
                Menu
              </p>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: '#2a2a2a', color: '#a1a1aa' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* More items */}
            <div className="px-4 py-3 space-y-1">
              {MORE_ITEMS.map(({ href, icon: Icon, label }) => {
                const isActive = pathname === href
                return (
                  <button
                    key={href}
                    type="button"
                    onClick={() => navigateTo(href)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-[10px] text-sm font-medium transition-colors"
                    style={{
                      background: isActive ? '#242424' : 'transparent',
                      color: isActive ? '#f4f4f5' : '#a1a1aa',
                    }}
                  >
                    <Icon size={18} style={{ color: isActive ? '#3ECF8E' : '#a1a1aa', flexShrink: 0 }} />
                    {label}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#3ECF8E' }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Logout */}
            <div className="px-4 pb-6 pt-1" style={{ borderTop: '1px solid #2a2a2a' }}>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-[10px] text-sm font-medium"
                style={{ color: '#a1a1aa' }}
              >
                <LogOut size={18} style={{ flexShrink: 0 }} />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 lg:hidden z-40 flex items-center"
        style={{
          background: '#1c1c1c',
          borderTop: '1px solid #333333',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {MAIN_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pendingHref === href
          const isPending = pendingHref === href && pathname !== href
          return (
            <button
              key={href}
              type="button"
              onClick={() => navigateTo(href)}
              disabled={Boolean(pendingHref && pendingHref !== href && pendingHref !== pathname)}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all disabled:opacity-100"
              style={{
                color: isActive ? '#3ECF8E' : '#a1a1aa',
                background: isPending ? 'rgba(62,207,142,0.08)' : 'transparent',
                transform: isPending ? 'translateY(-1px)' : 'translateY(0)',
              }}
            >
              {isPending ? <Loader2 size={22} className="animate-spin" /> : <Icon size={22} />}
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}

        {/* Mais button */}
        <button
          type="button"
          onClick={() => setDrawerOpen(v => !v)}
          className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-all"
          style={{ color: isMoreActive || drawerOpen ? '#3ECF8E' : '#a1a1aa' }}
        >
          <Menu size={22} />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </nav>
    </>
  )
}

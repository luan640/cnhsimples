'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, CalendarDays, BookOpen, Wallet, User, Loader2 } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/painel', icon: LayoutDashboard, label: 'Painel' },
  { href: '/agenda', icon: CalendarDays, label: 'Agenda' },
  { href: '/servicos', icon: BookOpen, label: 'Serviços' },
  { href: '/carteira', icon: Wallet, label: 'Carteira' },
  { href: '/perfil/instrutor', icon: User, label: 'Perfil' },
]

export function InstructorBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  function navigateTo(href: string) {
    if (href === pathname) return
    setPendingHref(href)
    router.push(href)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 lg:hidden z-40 flex items-center"
      style={{
        background: '#1c1c1c',
        borderTop: '1px solid #333333',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
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
    </nav>
  )
}

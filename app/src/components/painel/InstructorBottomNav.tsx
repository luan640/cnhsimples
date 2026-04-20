'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Wallet, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/painel', icon: LayoutDashboard, label: 'Painel' },
  { href: '/agenda', icon: CalendarDays, label: 'Agenda' },
  { href: '/carteira', icon: Wallet, label: 'Carteira' },
  { href: '/perfil/instrutor', icon: User, label: 'Perfil' },
]

export function InstructorBottomNav() {
  const pathname = usePathname()

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
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-opacity"
            style={{ color: isActive ? '#3ECF8E' : '#a1a1aa' }}
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

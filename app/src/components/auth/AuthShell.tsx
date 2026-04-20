import Link from 'next/link'
import type { ReactNode } from 'react'
import { Car } from 'lucide-react'

type AuthShellProps = {
  children: ReactNode
  eyebrow?: string
}

export function AuthShell({ children, eyebrow = 'CNH Simples' }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2 text-[#0F172A]">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[8px]"
              style={{ background: '#3ECF8E' }}
            >
              <Car size={18} color="#0F172A" />
            </div>
            <div className="leading-tight">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                {eyebrow}
              </div>
              <div className="text-base font-semibold">CNH Simples</div>
            </div>
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#0F172A]"
          >
            Voltar ao site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">{children}</div>
      </div>
    </main>
  )
}

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

type AuthShellProps = {
  children: ReactNode
  eyebrow?: string
}

export function AuthShell({ children, eyebrow = 'CNH Simples' }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-6 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col">
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-3 text-[#0F172A]">
            <div className="leading-tight">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                {eyebrow}
              </div>
              <div className="relative mt-1 h-10 w-[150px]">
                <Image
                  src="/brand-logo.png"
                  alt="Logo oficial da plataforma"
                  fill
                  className="object-contain object-left"
                  sizes="150px"
                />
              </div>
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

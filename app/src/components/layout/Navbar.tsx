'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

type AuthRole = 'student' | 'instructor' | 'guest'

function getAccountHref(role: AuthRole) {
  if (role === 'instructor') return '/painel'
  if (role === 'student') return '/aluno'
  return '/login'
}

export function Navbar() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [role, setRole] = useState<AuthRole>('guest')
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const nextRole = (user?.user_metadata?.role as AuthRole | undefined) ?? 'guest'
      setRole(user ? nextRole : 'guest')
      setIsLoadingAuth(false)
    }

    void loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextRole = (session?.user?.user_metadata?.role as AuthRole | undefined) ?? 'guest'
      setRole(session?.user ? nextRole : 'guest')
      setIsLoadingAuth(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setMenuOpen(false)
    router.push('/login')
    router.refresh()
  }

  const isAuthenticated = !isLoadingAuth && role !== 'guest'
  const accountHref = getAccountHref(role)

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(255, 255, 255, 0.96)' : 'rgba(255, 255, 255, 0.92)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.95)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center">
          <div className="relative h-11 w-[148px] md:h-12 md:w-[164px]">
            <Image
              src="/brand-logo.png"
              alt="CNH Simples"
              fill
              className="object-contain object-left"
              sizes="164px"
              priority
            />
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/buscar"
            className="rounded-[10px] px-4 py-2 text-sm font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            Encontrar Instrutor
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                href={accountHref}
                className="rounded-[10px] px-4 py-2 text-sm font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                {role === 'instructor' ? 'Meu Painel' : 'Minha Conta'}
              </Link>
              <button
                type="button"
                onClick={() => {
                  void handleLogout()
                }}
                className="rounded-full bg-[#3ECF8E] px-5 py-2.5 text-sm font-semibold text-[#0F172A] transition-opacity hover:opacity-90"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/cadastro/instrutor"
                className="rounded-[10px] px-4 py-2 text-sm font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                Seja Instrutor
              </Link>
              <Link
                href="/login/aluno"
                className="rounded-full bg-[#3ECF8E] px-5 py-2.5 text-sm font-semibold text-[#0F172A] transition-opacity hover:opacity-90"
              >
                Entrar
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated ? (
            <Link
              href={accountHref}
              className="rounded-full bg-[#3ECF8E] px-3.5 py-2 text-sm font-semibold text-[#0F172A]"
            >
              {role === 'instructor' ? 'Painel' : 'Conta'}
            </Link>
          ) : (
            <Link
              href="/login/aluno"
              className="rounded-full bg-[#3ECF8E] px-3.5 py-2 text-sm font-semibold text-[#0F172A]"
            >
              Entrar
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-white text-[#0F172A]"
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-[#E2E8F0] bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
          <Link
            href="/buscar"
            onClick={() => setMenuOpen(false)}
            className="rounded-[12px] px-4 py-3 text-sm font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
          >
            Encontrar Instrutor
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                href={accountHref}
                onClick={() => setMenuOpen(false)}
                className="rounded-[12px] px-4 py-3 text-sm font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                {role === 'instructor' ? 'Meu Painel' : 'Minha Conta'}
              </Link>
              <button
                type="button"
                onClick={() => {
                  void handleLogout()
                }}
                className="rounded-[12px] px-4 py-3 text-left text-sm font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/cadastro/instrutor"
                onClick={() => setMenuOpen(false)}
                className="rounded-[12px] px-4 py-3 text-sm font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                Seja Instrutor
              </Link>
              <Link
                href="/login/instrutor"
                onClick={() => setMenuOpen(false)}
                className="rounded-[12px] px-4 py-3 text-sm font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              >
                Entrar como Instrutor
              </Link>
            </>
          )}
          </div>
        </div>
      )}
    </header>
  )
}

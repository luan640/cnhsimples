'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, Car } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

type AuthRole = 'student' | 'instructor' | 'guest'

function getAccountHref(role: AuthRole) {
  if (role === 'instructor') return '/painel'
  if (role === 'student') return '/buscar'
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
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? '#1c1c1c' : 'transparent',
        borderBottom: scrolled ? '1px solid #333333' : 'none',
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-white text-lg">
          <div className="w-8 h-8 rounded-[6px] flex items-center justify-center" style={{ background: '#3ECF8E' }}>
            <Car size={18} color="#0F172A" />
          </div>
          <span>CNH Simples</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/buscar"
            className="text-sm text-white/80 hover:text-white px-4 py-2 rounded-[6px] transition-colors hover:bg-white/10"
          >
            Encontrar Instrutor
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                href={accountHref}
                className="text-sm text-white/80 hover:text-white px-4 py-2 rounded-[6px] transition-colors hover:bg-white/10"
              >
                {role === 'instructor' ? 'Meu Painel' : 'Minha Conta'}
              </Link>
              <button
                type="button"
                onClick={() => {
                  void handleLogout()
                }}
                className="text-sm font-medium px-4 py-2 rounded-[6px] transition-colors"
                style={{ background: '#3ECF8E', color: '#0F172A' }}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/cadastro/instrutor"
                className="text-sm text-white/80 hover:text-white px-4 py-2 rounded-[6px] transition-colors hover:bg-white/10"
              >
                Seja Instrutor
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium px-4 py-2 rounded-[6px] transition-colors"
                style={{ background: '#3ECF8E', color: '#0F172A' }}
              >
                Entrar
              </Link>
            </>
          )}
        </div>

        {/* Mobile: entrar + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated ? (
            <Link
              href={accountHref}
              className="text-sm font-medium px-3 py-1.5 rounded-[6px]"
              style={{ background: '#3ECF8E', color: '#0F172A' }}
            >
              {role === 'instructor' ? 'Painel' : 'Conta'}
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium px-3 py-1.5 rounded-[6px]"
              style={{ background: '#3ECF8E', color: '#0F172A' }}
            >
              Entrar
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-2 text-white"
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t px-4 py-4 flex flex-col gap-2" style={{ background: '#1c1c1c', borderColor: '#333333' }}>
          <Link
            href="/buscar"
            onClick={() => setMenuOpen(false)}
            className="text-sm text-white/80 hover:text-white px-4 py-3 rounded-[6px] hover:bg-white/10"
          >
            Encontrar Instrutor
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                href={accountHref}
                onClick={() => setMenuOpen(false)}
                className="text-sm text-white/80 hover:text-white px-4 py-3 rounded-[6px] hover:bg-white/10"
              >
                {role === 'instructor' ? 'Meu Painel' : 'Minha Conta'}
              </Link>
              <button
                type="button"
                onClick={() => {
                  void handleLogout()
                }}
                className="text-left text-sm text-white/80 hover:text-white px-4 py-3 rounded-[6px] hover:bg-white/10"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/cadastro/instrutor"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-white/80 hover:text-white px-4 py-3 rounded-[6px] hover:bg-white/10"
              >
                Seja Instrutor
              </Link>
              <Link
                href="/login/instrutor"
                onClick={() => setMenuOpen(false)}
                className="text-sm text-white/80 hover:text-white px-4 py-3 rounded-[6px] hover:bg-white/10"
              >
                Entrar como Instrutor
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}

'use client'

import Link from 'next/link'
import { Eye, EyeOff, GraduationCap } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 13.092 17.64 11.284 17.64 9.2z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" />
    </svg>
  )
}

export function StudentSignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oauthHandledRef = useRef(false)

  const nextPath = (() => {
    const next = searchParams.get('next')
    return next && next.startsWith('/') ? next : '/aluno'
  })()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get('oauth') !== 'return' || oauthHandledRef.current) return
    oauthHandledRef.current = true
    setGoogleLoading(true)
    createClient().auth.getUser().then(({ data, error: err }) => {
      if (err || !data.user) {
        setError('Não foi possível autenticar com o Google. Tente novamente.')
        setGoogleLoading(false)
        return
      }
      router.replace(nextPath)
    })
  }, [nextPath, router, searchParams])

  async function handleCreateAccount() {
    setError('')
    if (!fullName.trim()) { setError('Informe seu nome completo.'); return }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) { setError('Informe um e-mail válido.'); return }
    if (password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountMethod: 'email', email: email.trim(), fullName: fullName.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao criar conta.'); return }
      if (data.nextStep === 'confirm_email') {
        setSuccess(true)
      } else {
        router.push(nextPath)
      }
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setGoogleLoading(true)
    const { error: err } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/cadastro/aluno?oauth=return&next=${encodeURIComponent(nextPath)}`,
      },
    })
    if (err) { setError(err.message); setGoogleLoading(false) }
  }

  const inputClass =
    'min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]'

  if (success) {
    return (
      <div
        className="w-full max-w-md rounded-[18px] border border-[#E2E8F0] bg-white p-6 md:p-8"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#D1FAE5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#065F46]">
          <GraduationCap size={14} />
          Cadastro concluído
        </div>
        <h1 className="text-[28px] font-bold leading-tight text-[#0F172A]">Verifique seu e-mail</h1>
        <p className="mt-2 text-sm leading-6 text-[#64748B]">
          Enviamos um link de confirmação para <strong>{email}</strong>. Acesse seu e-mail para ativar a conta antes de entrar.
        </p>
        <Link
          href="/login/aluno"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-[8px] px-4 text-sm font-semibold text-[#0F172A] transition-opacity hover:opacity-90"
          style={{ background: '#3ECF8E' }}
        >
          Ir para o login
        </Link>
      </div>
    )
  }

  return (
    <div
      className="w-full max-w-md rounded-[18px] border border-[#E2E8F0] bg-white p-6 md:p-8"
      style={{ boxShadow: 'var(--shadow-modal)' }}
    >
      {/* Header */}
      <div className="mb-6 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
          <GraduationCap size={14} />
          Área do aluno
        </div>
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-[#0F172A]">Criar conta</h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Encontre instrutores credenciados perto de você e agende aulas com facilidade.
          </p>
        </div>
        <p className="text-sm text-[#64748B]">
          Já tem uma conta?{' '}
          <Link href="/login/aluno" className="font-semibold text-[#0F172A] hover:text-[#0284C7]">
            Entrar como aluno
          </Link>
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {error}
        </div>
      )}

      {/* Google */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={googleLoading || loading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-[#E2E8F0] px-4 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleLoading
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#4285F4]" />
            : <GoogleIcon />}
          {googleLoading ? 'Conectando...' : 'Continuar com Google'}
        </button>
      </div>

      {/* Divider */}
      <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-[#94A3B8]">
        <span className="h-px flex-1 bg-[#E2E8F0]" />
        ou
        <span className="h-px flex-1 bg-[#E2E8F0]" />
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="signup-name" className="text-sm font-medium text-[#0F172A]">Nome completo</label>
          <input
            id="signup-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome completo"
            autoComplete="name"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="text-sm font-medium text-[#0F172A]">E-mail</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="email"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="text-sm font-medium text-[#0F172A]">Senha</label>
          <div className="flex min-h-11 items-center rounded-[8px] border border-[#E2E8F0] px-3 transition-colors focus-within:border-[#3ECF8E]">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleCreateAccount()}
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              className="min-w-0 flex-1 bg-transparent text-base text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="ml-3 text-[#64748B] transition-colors hover:text-[#0F172A]"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleCreateAccount()}
          disabled={loading || googleLoading}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[8px] px-4 text-sm font-semibold text-[#0F172A] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ background: '#3ECF8E' }}
        >
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </div>

      <p className="mt-5 text-xs leading-5 text-[#64748B]">
        Ao continuar, você concorda com os nossos Termos de Uso e Política de Privacidade.
      </p>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { Building2, Eye, EyeOff, GraduationCap, Mail, ShieldCheck } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

type AuthRole = 'student' | 'instructor'

type AuthLoginFormProps = {
  role: AuthRole
  nextPath?: string
}

function getRedirectPath(role: AuthRole) {
  return role === 'student' ? '/aluno' : '/painel'
}

export function AuthLoginForm({ role, nextPath }: AuthLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isEmailLoading, setIsEmailLoading] = useState(false)

  const isStudent = role === 'student'
  const title = isStudent ? 'Entrar como Aluno' : 'Entrar como Instrutor'
  const description = isStudent
    ? 'Acesse sua conta para buscar instrutores, agendar aulas e acompanhar seu historico.'
    : 'Entre para gerenciar agenda, carteira, documentos e o status da sua assinatura.'
  const signupHref = isStudent ? '/cadastro/aluno' : '/cadastro/instrutor'
  const signupLabel = isStudent ? 'Cadastre-se como aluno' : 'Cadastre-se como instrutor'
  const switchHref = isStudent ? '/login/instrutor' : '/login/aluno'
  const switchLabel = isStudent ? 'Entrar como instrutor' : 'Entrar como aluno'
  const redirectPath = getRedirectPath(role)
  const resolvedNextPath = nextPath && nextPath.startsWith('/') ? nextPath : redirectPath

  async function handleGoogleLogin() {
    setSubmitError('')
    setIsGoogleLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(resolvedNextPath)}`,
      },
    })

    if (error) {
      setSubmitError(error.message)
      setIsGoogleLoading(false)
    }
  }

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSubmitError('')
    setIsEmailLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setSubmitError(error.message)
      setIsEmailLoading(false)
      return
    }

    // Full page reload para garantir que os cookies de sessão sejam
    // enviados corretamente na próxima requisição ao servidor.
    window.location.href = isStudent
      ? `/login/aluno?next=${encodeURIComponent(resolvedNextPath)}`
      : redirectPath
  }

  return (
    <div
      className="w-full max-w-md rounded-[18px] border border-[#E2E8F0] bg-white p-6 md:p-8"
      style={{ boxShadow: 'var(--shadow-modal)' }}
    >
      <div className="mb-6 space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
          {isStudent ? <GraduationCap size={14} /> : <ShieldCheck size={14} />}
          {isStudent ? 'Area do aluno' : 'Area do instrutor'}
        </div>

        <div>
          <h1 className="text-[28px] font-bold leading-tight text-[#0F172A]">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">{description}</p>
        </div>

        <div className="text-sm text-[#64748B]">
          <Link href={signupHref} className="font-semibold text-[#0F172A] hover:text-[#0284C7]">
            {signupLabel}
          </Link>{' '}
          ou{' '}
          <Link href={switchHref} className="font-semibold text-[#0F172A] hover:text-[#0284C7]">
            {switchLabel}
          </Link>
        </div>
      </div>

      {submitError && (
        <div className="mb-4 rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {submitError}
        </div>
      )}

      {isStudent && (
        <>
          <div className="mb-4 grid gap-3">
            <button
              type="button"
              onClick={() => {
                void handleGoogleLogin()
              }}
              disabled={isGoogleLoading || isEmailLoading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-[#E2E8F0] px-4 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Mail size={16} />
              {isGoogleLoading ? 'Conectando...' : 'Continuar com Google'}
            </button>
            <button
              type="button"
              disabled
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-[#E2E8F0] px-4 text-sm font-medium text-[#94A3B8] opacity-70"
            >
              <Building2 size={16} />
              Login corporativo indisponivel
            </button>
          </div>

          <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-[#94A3B8]">
            <span className="h-px flex-1 bg-[#E2E8F0]" />
            ou
            <span className="h-px flex-1 bg-[#E2E8F0]" />
          </div>
        </>
      )}

      <form className="space-y-4" onSubmit={handleEmailLogin}>
        <div className="space-y-1.5">
          <label htmlFor={`${role}-email`} className="text-sm font-medium text-[#0F172A]">
            E-mail
          </label>
          <input
            id={`${role}-email`}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu@email.com"
            className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${role}-password`} className="text-sm font-medium text-[#0F172A]">
            Senha
          </label>
          <div className="flex min-h-11 items-center rounded-[8px] border border-[#E2E8F0] px-3 transition-colors focus-within:border-[#3ECF8E]">
            <input
              id={`${role}-password`}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              className="min-w-0 flex-1 bg-transparent text-base text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="ml-3 text-[#64748B] transition-colors hover:text-[#0F172A]"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="inline-flex items-center gap-2 text-[#64748B]">
            <input type="checkbox" className="h-4 w-4 rounded border-[#CBD5E1]" />
            Lembrar de mim
          </label>
          <Link href="/" className="font-medium text-[#0F172A] hover:text-[#0284C7]">
            Esqueci minha senha
          </Link>
        </div>

        <button
          type="submit"
          disabled={isEmailLoading || isGoogleLoading}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[8px] px-4 text-sm font-semibold text-[#0F172A] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ background: '#3ECF8E' }}
        >
          {isEmailLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-5 text-xs leading-5 text-[#64748B]">
        Ao continuar, voce concorda com os nossos Termos de Uso e Politica de Privacidade.
      </p>
    </div>
  )
}

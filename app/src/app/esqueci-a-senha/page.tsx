'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'

import { AuthShell } from '@/components/auth/AuthShell'
import { createClient } from '@/lib/supabase/client'

export default function EsqueciASenhaPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setError(null)

    const supabase = createClient()
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/nova-senha`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    })

    if (resetError) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.')
      setStatus('error')
      return
    }

    setStatus('sent')
  }

  if (status === 'sent') {
    return (
      <AuthShell>
        <div className="flex flex-1 items-center justify-center py-12">
          <div
            className="w-full max-w-sm rounded-[16px] border border-[#E2E8F0] bg-white p-8 text-center"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#ECFDF5]">
              <CheckCircle2 size={32} style={{ color: '#3ECF8E' }} />
            </div>
            <h1 className="mb-2 text-xl font-bold text-[#0F172A]">E-mail enviado</h1>
            <p className="mb-6 text-sm leading-relaxed text-[#64748B]">
              Se esse endereço estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
              Verifique também a caixa de spam.
            </p>
            <Link
              href="/login/instrutor"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#3ECF8E] hover:opacity-80"
            >
              <ArrowLeft size={14} />
              Voltar para o login
            </Link>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="flex flex-1 items-center justify-center py-12">
        <div
          className="w-full max-w-sm rounded-[16px] border border-[#E2E8F0] bg-white p-8"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[12px] bg-[#ECFDF5]">
            <Mail size={26} style={{ color: '#3ECF8E' }} />
          </div>

          <h1 className="mb-1 text-center text-xl font-bold text-[#0F172A]">Esqueceu a senha?</h1>
          <p className="mb-6 text-center text-sm leading-relaxed text-[#64748B]">
            Informe seu e-mail e enviaremos um link para você criar uma nova senha.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-sm text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
              />
            </div>

            {(status === 'error' && error) && (
              <div className="rounded-[8px] bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="min-h-11 w-full rounded-[8px] text-sm font-semibold text-[#052E16] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: '#3ECF8E' }}
            >
              {status === 'loading' ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              href="/login/instrutor"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0F172A]"
            >
              <ArrowLeft size={14} />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </AuthShell>
  )
}

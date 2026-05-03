'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'

import { AuthShell } from '@/components/auth/AuthShell'
import { createClient } from '@/lib/supabase/client'

export default function NovaSenhaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      if (!session) router.replace('/esqueci-a-senha')
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setStatus('loading')
    const supabase = createClient()
    const { error: updateError, data } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Não foi possível redefinir a senha. O link pode ter expirado — solicite um novo.')
      setStatus('error')
      return
    }

    setStatus('success')

    const role = data.user?.user_metadata?.role
    setTimeout(() => {
      router.replace(role === 'instructor' ? '/painel' : '/aluno')
    }, 1500)
  }

  if (hasSession === null) return null

  return (
    <AuthShell>
      <div className="flex flex-1 items-center justify-center py-12">
        <div
          className="w-full max-w-sm rounded-[16px] border border-[#E2E8F0] bg-white p-8"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[12px] bg-[#ECFDF5]">
            <KeyRound size={26} style={{ color: '#3ECF8E' }} />
          </div>

          <h1 className="mb-1 text-center text-xl font-bold text-[#0F172A]">Nova senha</h1>
          <p className="mb-6 text-center text-sm leading-relaxed text-[#64748B]">
            Escolha uma senha forte com pelo menos 8 caracteres.
          </p>

          {status === 'success' ? (
            <div className="rounded-[10px] bg-[#ECFDF5] px-4 py-4 text-center">
              <p className="text-sm font-semibold text-[#065F46]">Senha redefinida com sucesso!</p>
              <p className="mt-1 text-xs text-[#6EE7B7]">Redirecionando para o painel…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 pr-10 text-sm text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repita a senha"
                    className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 pr-10 text-sm text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
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
                {status === 'loading' ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </AuthShell>
  )
}

'use client'

import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'luanengproduc@gmail.com'

export function AdminLoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

    if (authError) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    if (data.user?.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut()
      setError('Acesso não autorizado para este e-mail.')
      setLoading(false)
      return
    }

    // Full reload para garantir que os cookies de sessão sejam enviados
    window.location.href = '/admin'
  }

  return (
    <div
      className="w-full max-w-sm bg-white rounded-[16px] border border-[#E2E8F0] p-8"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
    >
      {/* header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div
          className="w-14 h-14 rounded-[12px] flex items-center justify-center mb-4"
          style={{ background: '#1c1c1c' }}
        >
          <ShieldCheck size={28} style={{ color: '#3ECF8E' }} />
        </div>
        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Acesso Administrativo</h1>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>CNH Simples — painel de gestão</p>
      </div>

      {error && (
        <div
          className="mb-5 flex items-start gap-2 px-4 py-3 rounded-[8px] text-sm"
          style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: '#0F172A' }}>
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@email.com"
            required
            className="w-full px-3 py-2.5 text-sm rounded-[8px] border outline-none transition-colors"
            style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
            onFocus={e => e.target.style.borderColor = '#3ECF8E'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: '#0F172A' }}>
            Senha
          </label>
          <div
            className="flex items-center rounded-[8px] border transition-colors"
            style={{ borderColor: '#E2E8F0' }}
            onFocus={() => {}}
          >
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none"
              style={{ color: '#0F172A' }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="px-3 transition-colors"
              style={{ color: '#94A3B8' }}
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-[8px] text-sm font-semibold transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: '#3ECF8E', color: '#0F172A' }}
        >
          {loading ? 'Entrando...' : 'Entrar no painel'}
        </button>
      </form>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

import { salvarChavePix } from '@/app/carteira/actions'

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave aleatoria' },
]

export function CadastrarPixCard({ fromOnboarding = false }: { fromOnboarding?: boolean }) {
  const router = useRouter()
  const [pixKey, setPixKey] = useState('')
  const [pixKeyType, setPixKeyType] = useState('cpf')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!pixKey.trim()) {
      setError('Informe a chave PIX.')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('pix_key', pixKey)
      formData.set('pix_key_type', pixKeyType)

      const result = await salvarChavePix(formData)
      if (!result.ok) {
        setError(result.error)
        return
      }

      if (fromOnboarding) {
        router.push('/painel/onboarding')
        return
      }

      setSuccess('Chave PIX cadastrada com sucesso.')
      setPixKey('')
    })
  }

  return (
    <section
      className="rounded-[12px] border p-4 md:p-5"
      style={{ background: '#fff', borderColor: '#E2E8F0' }}
    >
      <div className="mb-3">
        <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>
          Cadastre sua chave PIX
        </h2>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>
          Para solicitar saque, primeiro cadastre uma chave PIX.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: '#374151' }}>
            Tipo da chave PIX
          </label>
          <select
            value={pixKeyType}
            onChange={(event) => setPixKeyType(event.target.value)}
            className="w-full px-3 py-2 rounded-[8px] text-sm border outline-none focus:ring-2"
            style={{ borderColor: '#E2E8F0', color: '#0F172A', background: '#fff' }}
          >
            {PIX_KEY_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" style={{ color: '#374151' }}>
            Chave PIX
          </label>
          <input
            type="text"
            value={pixKey}
            onChange={(event) => setPixKey(event.target.value)}
            placeholder={
              pixKeyType === 'cpf'
                ? '000.000.000-00'
                : pixKeyType === 'email'
                  ? 'seu@email.com'
                  : pixKeyType === 'phone'
                    ? '(85) 99999-9999'
                    : 'Chave aleatoria'
            }
            className="w-full px-3 py-2 rounded-[8px] text-sm border outline-none focus:ring-2"
            style={{ borderColor: '#E2E8F0', color: '#0F172A', background: '#fff' }}
          />
        </div>

        {error ? (
          <div
            className="flex items-start gap-2 rounded-[8px] p-3 text-sm"
            style={{ background: '#FEF2F2', color: '#DC2626' }}
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            className="flex items-start gap-2 rounded-[8px] p-3 text-sm"
            style={{ background: '#ECFDF5', color: '#166534' }}
          >
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            {success}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[9999px] text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#3ECF8E', color: '#fff' }}
        >
          {isPending ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar chave PIX'
          )}
        </button>
      </form>
    </section>
  )
}

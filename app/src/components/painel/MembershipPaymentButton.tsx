'use client'

import { useState } from 'react'
import { CreditCard, LoaderCircle } from 'lucide-react'

type Props = {
  amount: number
  className?: string
}

export function MembershipPaymentButton({ amount, className }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/instructor-membership/create-preference', {
        method: 'POST',
      })

      const payload = await response.json()

      if (!response.ok || !payload.checkoutUrl) {
        setError(payload.error ?? 'Nao foi possivel iniciar o pagamento.')
        return
      }

      window.location.href = payload.checkoutUrl
    } catch {
      setError('Nao foi possivel iniciar o pagamento da mensalidade.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className ?? 'flex items-center justify-center gap-2 py-3 px-6 rounded-[6px] text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-70'}
        style={{ background: '#3ECF8E', color: '#0F172A' }}
      >
        {loading ? <LoaderCircle size={16} className="animate-spin" /> : <CreditCard size={16} />}
        {loading ? 'Redirecionando...' : `Pagar mensalidade - R$ ${amount.toFixed(2).replace('.', ',')}/mes`}
      </button>

      {error && (
        <p className="text-xs" style={{ color: '#DC2626' }}>
          {error}
        </p>
      )}
    </div>
  )
}

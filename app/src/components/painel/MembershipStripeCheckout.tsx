'use client'

import { useCallback, useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
)

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
      <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  )
}

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsSubmitting(true)
    setErrorMsg('')

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/painel?mensalidade=success`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMsg(error.message ?? 'Pagamento recusado. Verifique os dados do cartão.')
      setIsSubmitting(false)
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMsg && <ErrorBanner message={errorMsg} />}

      <PaymentElement
        options={{
          layout: 'tabs',
          fields: {
            billingDetails: {
              address: 'never',
            },
          },
        }}
      />

      <button
        type="submit"
        disabled={isSubmitting || !stripe}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[9999px] text-sm font-semibold transition-opacity disabled:opacity-60"
        style={{ background: '#3ECF8E', color: '#0F172A' }}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Processando…
          </>
        ) : (
          <>
            <CreditCard size={15} />
            Assinar mensalidade
          </>
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-[11px]" style={{ color: '#94A3B8' }}>
        <CreditCard size={11} />
        Pagamento seguro via Stripe — sem conta necessária
      </p>
    </form>
  )
}

type Props = {
  amount: number
  onSuccess: () => void
}

export function MembershipStripeCheckout({ amount, onSuccess }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')

  const setup = useCallback(async () => {
    try {
      const res = await fetch('/api/payments/instructor-membership/stripe-setup', {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        setLoadError(data.error ?? 'Erro ao iniciar pagamento.')
        return
      }

      setClientSecret(data.clientSecret)
    } catch {
      setLoadError('Erro ao conectar com o servidor de pagamento.')
    }
  }, [])

  useEffect(() => {
    void setup()
  }, [setup])

  if (loadError) return <ErrorBanner message={loadError} />

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center gap-2 py-6">
        <Loader2 size={16} className="animate-spin text-[#3ECF8E]" />
        <span className="text-sm" style={{ color: '#64748B' }}>
          Carregando checkout seguro…
        </span>
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#3ECF8E',
            colorBackground: '#ffffff',
            colorText: '#0F172A',
            colorDanger: '#DC2626',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '10px',
          },
        },
        locale: 'pt-BR',
      }}
    >
      <div className="mb-3">
        <p className="text-sm font-medium" style={{ color: '#0F172A' }}>
          Mensalidade da plataforma
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
          R$ {amount.toFixed(2).replace('.', ',')} / mês — renovação automática
        </p>
      </div>
      <CheckoutForm onSuccess={onSuccess} />
    </Elements>
  )
}

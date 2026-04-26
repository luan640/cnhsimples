'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: new (publicKey: string, options?: { locale?: string }) => any
  }
}

type Props = {
  amount: number
  onSuccess: () => void
}

function Spinner() {
  return <Loader2 size={16} className="animate-spin" />
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
      <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  )
}

export function MembershipCardCheckout({ amount, onSuccess }: Props) {
  const cardFormRef = useRef<{ getCardFormData: () => Record<string, string>; unmount?: () => void } | null>(null)
  const mountedRef = useRef(false)
  const [isSDKLoading, setIsSDKLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    async function init() {
      try {
        setIsSDKLoading(true)
        setErrorMsg('')

        const { loadMercadoPago } = await import('@mercadopago/sdk-js')
        await loadMercadoPago()

        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
        if (!publicKey) throw new Error('Chave pública do Mercado Pago não configurada.')

        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' })

        cardFormRef.current = mp.cardForm({
          amount: String(amount.toFixed(2)),
          iframe: true,
          form: {
            id: 'membership-card-form',
            cardNumber: { id: 'mp-mem-card-number', placeholder: '0000 0000 0000 0000' },
            expirationDate: { id: 'mp-mem-expiration-date', placeholder: 'MM/AA' },
            securityCode: { id: 'mp-mem-security-code', placeholder: 'CVV' },
            cardholderName: { id: 'mp-mem-cardholder-name', placeholder: 'Nome como no cartão' },
            issuer: { id: 'mp-mem-issuer', placeholder: 'Banco emissor' },
            installments: { id: 'mp-mem-installments', placeholder: 'Parcelas' },
            identificationType: { id: 'mp-mem-identification-type', placeholder: 'Tipo' },
            identificationNumber: { id: 'mp-mem-identification-number', placeholder: '000.000.000-00' },
            cardholderEmail: { id: 'mp-mem-cardholder-email', placeholder: 'seu@email.com' },
          },
          callbacks: {
            onFormMounted: (error: unknown) => {
              if (error) {
                setErrorMsg('Erro ao carregar formulário de cartão. Recarregue a página.')
              } else {
                setIsSDKLoading(false)
              }
            },
            onSubmit: async (event: Event) => {
              event.preventDefault()
              setIsSubmitting(true)
              setErrorMsg('')

              try {
                const formData = cardFormRef.current!.getCardFormData()
                const {
                  paymentMethodId,
                  issuerId,
                  cardholderEmail,
                  token,
                  installments,
                  identificationNumber,
                  identificationType,
                } = formData

                if (!token) {
                  setErrorMsg('Não foi possível tokenizar o cartão. Verifique os dados e tente novamente.')
                  setIsSubmitting(false)
                  return
                }

                const response = await fetch('/api/payments/instructor-membership/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    card_token: token,
                    card_payment_method_id: paymentMethodId,
                    card_issuer_id: issuerId || null,
                    card_installments: Number(installments) || 1,
                    payer_email: cardholderEmail,
                    payer_identification_type: identificationType,
                    payer_identification_number: identificationNumber,
                  }),
                })

                const result = await response.json()

                if (!response.ok) {
                  throw new Error(result.error ?? 'Pagamento recusado.')
                }

                if (result.status === 'approved') {
                  onSuccess()
                } else {
                  throw new Error('Pagamento não aprovado. Verifique os dados do cartão e tente novamente.')
                }
              } catch (err) {
                setErrorMsg(err instanceof Error ? err.message : 'Erro ao processar pagamento.')
              } finally {
                setIsSubmitting(false)
              }
            },
          },
        })
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar formulário de pagamento.')
        setIsSDKLoading(false)
      }
    }

    init()

    return () => {
      cardFormRef.current?.unmount?.()
      cardFormRef.current = null
      mountedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {errorMsg && <ErrorBanner message={errorMsg} />}

      {isSDKLoading && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Spinner />
          <span className="text-sm" style={{ color: '#64748B' }}>Carregando formulário seguro…</span>
        </div>
      )}

      <form
        id="membership-card-form"
        style={{ display: isSDKLoading ? 'none' : 'flex', flexDirection: 'column', gap: '10px' }}
      >
        <div>
          <label className="mb-1 block text-xs font-semibold" style={{ color: '#475569' }}>Número do cartão</label>
          <div id="mp-mem-card-number" className="min-h-[44px] rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#475569' }}>Validade</label>
            <div id="mp-mem-expiration-date" className="min-h-[44px] rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#475569' }}>CVV</label>
            <div id="mp-mem-security-code" className="min-h-[44px] rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold" style={{ color: '#475569' }}>Nome no cartão</label>
          <input
            type="text"
            id="mp-mem-cardholder-name"
            className="min-h-[44px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-sm outline-none placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
            style={{ color: '#0F172A' }}
            placeholder="Nome como impresso no cartão"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold" style={{ color: '#475569' }}>Banco emissor</label>
          <select id="mp-mem-issuer" className="min-h-[44px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-sm outline-none focus:border-[#3ECF8E]" style={{ color: '#0F172A' }} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold" style={{ color: '#475569' }}>Parcelas</label>
          <select id="mp-mem-installments" className="min-h-[44px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-sm outline-none focus:border-[#3ECF8E]" style={{ color: '#0F172A' }} />
        </div>

        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#475569' }}>Doc.</label>
            <select id="mp-mem-identification-type" className="min-h-[44px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-2 text-sm outline-none focus:border-[#3ECF8E]" style={{ color: '#0F172A' }} />
          </div>
          <div className="col-span-3">
            <label className="mb-1 block text-xs font-semibold" style={{ color: '#475569' }}>CPF do titular</label>
            <input
              type="text"
              id="mp-mem-identification-number"
              inputMode="numeric"
              className="min-h-[44px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-sm outline-none placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
              style={{ color: '#0F172A' }}
              placeholder="000.000.000-00"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold" style={{ color: '#475569' }}>E-mail</label>
          <input
            type="email"
            id="mp-mem-cardholder-email"
            className="min-h-[44px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-sm outline-none placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
            style={{ color: '#0F172A' }}
            placeholder="seu@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[9999px] text-sm font-semibold transition-opacity disabled:opacity-60"
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
              Pagar R$ {amount.toFixed(2).replace('.', ',')}
            </>
          )}
        </button>
      </form>

      <p className="flex items-center justify-center gap-1.5 text-[11px]" style={{ color: '#94A3B8' }}>
        <CreditCard size={11} />
        Pagamento processado com segurança pelo Mercado Pago
      </p>
    </div>
  )
}

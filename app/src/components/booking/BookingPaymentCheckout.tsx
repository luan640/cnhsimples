'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
  RefreshCw,
} from 'lucide-react'

// ─── types ────────────────────────────────────────────────────────────────────

export type BookingPayload = {
  instructor_id: string
  service_id: string
  slot_ids: string[]
  lesson_mode: 'meeting' | 'pickup'
  total_amount: number
}

type PaymentResult = {
  bookingGroupId: string
  mpPaymentId: string | null
  status: string
  pix: {
    qrCode: string | null
    qrCodeBase64: string | null
    ticketUrl: string | null
  } | null
}

type Props = {
  paymentMethod: 'pix' | 'card'
  bookingPayload: BookingPayload
  /** Called with booking_group_id on confirmed payment */
  onSuccess: (bookingGroupId: string) => void
  /** Called on unrecoverable error */
  onError: (message: string) => void
  /** Called when user wants to go back to method selection */
  onBack: () => void
}

const pixRequestCache = new Map<string, Promise<PaymentResult>>()

function getPixRequestKey(payload: BookingPayload) {
  return JSON.stringify({
    instructor_id: payload.instructor_id,
    service_id: payload.service_id,
    lesson_mode: payload.lesson_mode,
    total_amount: payload.total_amount,
    slot_ids: [...payload.slot_ids].sort(),
  })
}

// ─── MercadoPago window type augmentation ────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: new (publicKey: string, options?: { locale?: string }) => any
  }
}

// ─── shared UI atoms ──────────────────────────────────────────────────────────

function Spinner() {
  return <Loader2 size={18} className="animate-spin text-[#3ECF8E]" />
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3">
      <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  )
}

// ─── PIX checkout ─────────────────────────────────────────────────────────────

export function PixCheckout({ bookingPayload, onSuccess, onError }: Omit<Props, 'paymentMethod' | 'onBack'>) {
  const [state, setState] = useState<'idle' | 'loading' | 'waiting' | 'error'>('idle')
  const [pixData, setPixData] = useState<PaymentResult['pix'] | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const requestKeyRef = useRef(getPixRequestKey(bookingPayload))

  // Generate PIX on mount
  useEffect(() => {
    void generate()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generate() {
    setState('loading')
    setErrorMsg('')

    try {
      const requestKey = requestKeyRef.current
      let request = pixRequestCache.get(requestKey)

      if (!request) {
        request = (async () => {
          const response = await fetch('/api/payments/booking/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...bookingPayload, payment_method: 'pix' }),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error ?? 'Erro ao gerar PIX.')
          }

          return result as PaymentResult
        })()

        pixRequestCache.set(requestKey, request)
      }

      const data = await request
      setPixData(data.pix)
      setState('waiting')

      // Poll for confirmation every 5 seconds (webhook confirms asynchronously)
      pollRef.current = setInterval(async () => {
        try {
          const poll = await fetch(
            `/api/payments/booking/status?booking_group_id=${data.bookingGroupId}`
          )
          if (!poll.ok) return
          const { status } = await poll.json()
          if (status === 'paid') {
            if (pollRef.current) clearInterval(pollRef.current)
            onSuccess(data.bookingGroupId)
          } else if (status === 'cancelled' || status === 'expired') {
            if (pollRef.current) clearInterval(pollRef.current)
            onError('Pagamento cancelado ou expirado. Tente novamente.')
          }
        } catch {
          // Ignore polling errors — keep trying
        }
      }, 5000)
    } catch (err) {
      pixRequestCache.delete(requestKeyRef.current)
      const message = err instanceof Error ? err.message : 'Erro ao gerar código PIX.'
      setErrorMsg(message)
      setState('error')
      onError(message)
    }
  }

  async function copyCode() {
    if (!pixData?.qrCode) return
    try {
      await navigator.clipboard.writeText(pixData.qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard API unavailable
    }
  }

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Spinner />
        <p className="text-sm text-[#64748B]">Gerando código PIX…</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col gap-4">
        <ErrorBanner message={errorMsg} />
        <button
          type="button"
          onClick={generate}
          className="flex items-center justify-center gap-2 rounded-[12px] border border-[#E2E8F0] bg-white py-3 text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#3ECF8E]"
        >
          <RefreshCw size={15} />
          Tentar novamente
        </button>
      </div>
    )
  }

  if (state === 'waiting' && pixData) {
    return (
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <QrCode size={18} className="text-[#3ECF8E]" />
          <p className="font-semibold text-[#0F172A]">Pague com PIX</p>
        </div>

        {/* QR Code image */}
        {pixData.qrCodeBase64 && (
          <div className="flex justify-center rounded-[12px] border border-[#E2E8F0] bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${pixData.qrCodeBase64}`}
              alt="QR Code PIX"
              className="h-48 w-48"
            />
          </div>
        )}

        {/* Copy-paste code */}
        {pixData.qrCode && (
          <div className="overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC]">
            <p className="px-3 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
              Código copia e cola
            </p>
            <p className="break-all px-3 pb-1 text-[11px] text-[#475569]">{pixData.qrCode}</p>
            <button
              type="button"
              onClick={copyCode}
              className="flex w-full items-center justify-center gap-2 border-t border-[#E2E8F0] py-2.5 text-sm font-semibold transition-colors"
              style={{ color: copied ? '#3ECF8E' : '#0F172A' }}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={15} className="text-[#3ECF8E]" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy size={15} />
                  Copiar código
                </>
              )}
            </button>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3">
          <Spinner />
          <p className="text-sm text-amber-700">Aguardando confirmação do pagamento…</p>
        </div>

        <p className="text-center text-xs text-[#94A3B8]">
          O agendamento será confirmado automaticamente após o pagamento.
          {pixData.ticketUrl && (
            <>
              {' '}
              <a
                href={pixData.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#3ECF8E]"
              >
                Abrir no Mercado Pago
              </a>
            </>
          )}
        </p>
      </div>
    )
  }

  return null
}

// ─── Card checkout ────────────────────────────────────────────────────────────

export function CardCheckout({
  bookingPayload,
  onSuccess,
  onError,
}: Omit<Props, 'paymentMethod' | 'onBack'>) {
  const cardFormRef = useRef<{ getCardFormData: () => Record<string, string>; unmount?: () => void } | null>(null)
  const mountedRef = useRef(false)
  const [isSDKLoading, setIsSDKLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  function startPolling(bgId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/booking/status?booking_group_id=${bgId}`)
        if (!res.ok) return
        const { status } = await res.json()
        if (status === 'paid') {
          clearInterval(interval)
          onSuccess(bgId)
        } else if (status === 'cancelled' || status === 'expired') {
          clearInterval(interval)
          onError('Pagamento cancelado. Tente novamente.')
        }
      } catch {
        // Keep polling
      }
    }, 4000)

    // Stop after 10 minutes
    setTimeout(() => clearInterval(interval), 10 * 60 * 1000)
  }

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    async function init() {
      try {
        setIsSDKLoading(true)
        setErrorMsg('')
        cardFormRef.current?.unmount?.()
        cardFormRef.current = null

        const { loadMercadoPago } = await import('@mercadopago/sdk-js')
        await loadMercadoPago()

        const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
        if (!publicKey) throw new Error('Chave pública do Mercado Pago não configurada.')

        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' })

        cardFormRef.current = mp.cardForm({
          amount: String(bookingPayload.total_amount.toFixed(2)),
          iframe: true,
          form: {
            id: 'booking-card-form',
            cardNumber: {
              id: 'mp-card-number',
              placeholder: '0000 0000 0000 0000',
            },
            expirationDate: {
              id: 'mp-expiration-date',
              placeholder: 'MM/AA',
            },
            securityCode: {
              id: 'mp-security-code',
              placeholder: 'CVV',
            },
            cardholderName: {
              id: 'mp-cardholder-name',
              placeholder: 'Nome como no cartão',
            },
            issuer: {
              id: 'mp-issuer',
              placeholder: 'Banco emissor',
            },
            installments: {
              id: 'mp-installments',
              placeholder: 'Número de parcelas',
            },
            identificationType: {
              id: 'mp-identification-type',
              placeholder: 'Tipo de documento',
            },
            identificationNumber: {
              id: 'mp-identification-number',
              placeholder: '000.000.000-00',
            },
            cardholderEmail: {
              id: 'mp-cardholder-email',
              placeholder: 'seu@email.com',
            },
          },
          callbacks: {
            onFormMounted: (error: unknown) => {
              if (error) {
                console.error('[card-form] Erro ao montar formulário:', error)
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

                const response = await fetch('/api/payments/booking/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...bookingPayload,
                    payment_method: 'card',
                    card_token: token,
                    card_payment_method_id: paymentMethodId,
                    card_issuer_id: issuerId || null,
                    card_installments: Number(installments) || 1,
                    payer_identification_type: identificationType,
                    payer_identification_number: identificationNumber,
                    payer_email: cardholderEmail,
                  }),
                })

                const result = await response.json()

                if (!response.ok) {
                  throw new Error(result.error ?? 'Pagamento recusado. Tente outro cartão.')
                }

                const data = result as PaymentResult

                if (data.status === 'approved') {
                  onSuccess(data.bookingGroupId)
                } else if (data.status === 'pending') {
                  // 3DS or other pending — poll
                  startPolling(data.bookingGroupId)
                } else {
                  throw new Error('Pagamento recusado. Verifique os dados do cartão.')
                }
              } catch (err) {
                const message =
                  err instanceof Error ? err.message : 'Erro ao processar pagamento.'
                setErrorMsg(message)
                onError(message)
              } finally {
                setIsSubmitting(false)
              }
            },
            onFetching: (resource: string) => {
              console.log('[card-form] Buscando recurso:', resource)
            },
          },
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar SDK de pagamento.'
        setErrorMsg(message)
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <CreditCard size={18} className="text-[#3ECF8E]" />
        <p className="font-semibold text-[#0F172A]">Dados do cartão</p>
      </div>

      {errorMsg && <ErrorBanner message={errorMsg} />}

      {isSDKLoading && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Spinner />
          <span className="text-sm text-[#64748B]">Carregando formulário seguro…</span>
        </div>
      )}

      {/* MercadoPago.js mounts secure iframes into these divs */}
      <form
        id="booking-card-form"
        style={{ display: isSDKLoading ? 'none' : 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {/* Card number — MP iframe */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569]">Número do cartão</label>
          <div
            id="mp-card-number"
            className="min-h-[44px] rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Expiration */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#475569]">Validade</label>
            <div
              id="mp-expiration-date"
              className="min-h-[44px] rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm"
            />
          </div>

          {/* CVV */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#475569]">CVV</label>
            <div
              id="mp-security-code"
              className="min-h-[44px] rounded-[10px] border border-[#E2E8F0] bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Cardholder name — plain input, not iframe */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569]">Nome no cartão</label>
          <input
            type="text"
            id="mp-cardholder-name"
            className="min-h-[44px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
            placeholder="Nome como impresso no cartão"
          />
        </div>

        {/* Issuer (bank) — MP populates this select */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569]">Banco emissor</label>
          <select
            id="mp-issuer"
            className="min-h-[44px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#3ECF8E]"
          />
        </div>

        {/* Installments — MP populates this select */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569]">Parcelas</label>
          <select
            id="mp-installments"
            className="min-h-[44px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none focus:border-[#3ECF8E]"
          />
        </div>

        {/* Document type — MP populates */}
        <div className="grid grid-cols-5 gap-2">
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-semibold text-[#475569]">Doc.</label>
            <select
              id="mp-identification-type"
              className="min-h-[44px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-2 text-sm text-[#0F172A] outline-none focus:border-[#3ECF8E]"
            />
          </div>
          <div className="col-span-3">
            <label className="mb-1 block text-xs font-semibold text-[#475569]">Número</label>
            <input
              type="text"
              id="mp-identification-number"
              inputMode="numeric"
              className="min-h-[44px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
              placeholder="CPF do titular"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-[#475569]">E-mail</label>
          <input
            type="email"
            id="mp-cardholder-email"
            className="min-h-[44px] w-full rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
            placeholder="seu@email.com"
          />
        </div>

        {/* Submit — styled but inside the form so MercadoPago.js intercepts it */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[9999px] text-sm font-semibold text-[#052E16] transition-opacity disabled:opacity-60"
          style={{ background: '#F97316' }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processando…
            </>
          ) : (
            'Pagar com cartão'
          )}
        </button>
      </form>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#94A3B8]">
        <CreditCard size={11} />
        Pagamento processado com segurança pelo Mercado Pago
      </p>
    </div>
  )
}

// ─── main export ──────────────────────────────────────────────────────────────

export function BookingPaymentCheckout({
  paymentMethod,
  bookingPayload,
  onSuccess,
  onError,
  onBack,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {paymentMethod === 'pix' ? (
        <PixCheckout
          bookingPayload={bookingPayload}
          onSuccess={onSuccess}
          onError={onError}
        />
      ) : (
        <CardCheckout
          bookingPayload={bookingPayload}
          onSuccess={onSuccess}
          onError={onError}
        />
      )}

      <button
        type="button"
        onClick={onBack}
        className="text-center text-xs text-[#94A3B8] underline-offset-2 hover:underline"
      >
        Voltar e escolher outro método
      </button>
    </div>
  )
}

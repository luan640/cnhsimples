'use client'

import { useState } from 'react'
import { Ban, LoaderCircle, X } from 'lucide-react'

type Props = {
  className?: string
}

export function CancelMembershipButton({ className }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleConfirmCancel() {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/payments/instructor-membership/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason.trim() || null,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setError(payload.error ?? 'Nao foi possivel cancelar a assinatura.')
        return
      }

      setSuccess('Assinatura cancelada com sucesso.')
      setOpen(false)
      setReason('')
      window.location.reload()
    } catch {
      setError('Nao foi possivel cancelar a assinatura.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          setError(null)
          setSuccess(null)
          setOpen(true)
        }}
        disabled={loading}
        className={className ?? 'flex items-center justify-center gap-2 py-3 px-6 rounded-[6px] text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-70 border border-[#FECACA]'}
        style={{ background: '#FFFFFF', color: '#B91C1C' }}
      >
        {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Ban size={16} />}
        {loading ? 'Cancelando...' : 'Cancelar assinatura'}
      </button>

      {error && (
        <p className="text-xs" style={{ color: '#DC2626' }}>
          {error}
        </p>
      )}

      {success && (
        <p className="text-xs" style={{ color: '#059669' }}>
          {success}
        </p>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(15, 23, 42, 0.5)' }}
        >
          <div
            className="w-full max-w-md rounded-[14px] border border-[#E2E8F0] bg-white p-5"
            style={{ boxShadow: '0 20px 50px rgba(15,23,42,0.18)' }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-semibold" style={{ color: '#0F172A' }}>
                  Cancelar assinatura
                </h2>
                <p className="text-sm mt-1" style={{ color: '#64748B' }}>
                  Isso interrompe a renovacao recorrente do plano no Mercado Pago.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (loading) return
                  setOpen(false)
                }}
                className="rounded-[6px] p-2 transition-opacity hover:opacity-80"
                style={{ color: '#64748B' }}
                aria-label="Fechar modal"
              >
                <X size={16} />
              </button>
            </div>

            <label className="block text-sm font-medium mb-2" style={{ color: '#0F172A' }}>
              Motivo do cancelamento
              <span className="ml-1 text-xs font-normal" style={{ color: '#94A3B8' }}>
                (opcional)
              </span>
            </label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="Descreva o motivo, se quiser registrar isso para o suporte."
              className="w-full rounded-[10px] border border-[#E2E8F0] px-3 py-2.5 text-sm resize-none outline-none"
              style={{ color: '#0F172A', background: '#FFFFFF' }}
            />

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (loading) return
                  setOpen(false)
                }}
                className="px-4 py-2.5 rounded-[8px] text-sm font-medium border border-[#E2E8F0] transition-opacity hover:opacity-90"
                style={{ color: '#0F172A', background: '#FFFFFF' }}
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={loading}
                className="px-4 py-2.5 rounded-[8px] text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-70"
                style={{ color: '#FFFFFF', background: '#B91C1C' }}
              >
                {loading ? 'Cancelando...' : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

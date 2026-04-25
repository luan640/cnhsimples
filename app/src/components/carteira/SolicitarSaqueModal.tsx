'use client'

import { useState, useTransition } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Wallet, X } from 'lucide-react'
import { solicitarSaque } from '@/app/carteira/actions'

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave aleatória' },
]

interface Props {
  balance: number
  defaultPixKey: string | null
  defaultPixKeyType: string | null
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function SolicitarSaqueModal({ balance, defaultPixKey, defaultPixKeyType }: Props) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [pixKey, setPixKey] = useState(defaultPixKey ?? '')
  const [pixKeyType, setPixKeyType] = useState(defaultPixKeyType ?? 'cpf')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleOpen() {
    setAmount('')
    setPixKey(defaultPixKey ?? '')
    setPixKeyType(defaultPixKeyType ?? 'cpf')
    setError(null)
    setSuccess(false)
    setOpen(true)
  }

  function handleClose() {
    if (isPending) return
    setOpen(false)
  }

  function handleSetMax() {
    setAmount(balance.toFixed(2).replace('.', ','))
  }

  function parsedAmount() {
    return parseFloat(amount.replace(',', '.'))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const value = parsedAmount()

    if (isNaN(value) || value <= 0) {
      setError('Informe um valor válido.')
      return
    }
    if (value > balance) {
      setError('Valor maior que o saldo disponível.')
      return
    }
    if (!pixKey.trim()) {
      setError('Informe a chave PIX.')
      return
    }

    startTransition(async () => {
      const result = await solicitarSaque(value, pixKey, pixKeyType)
      if (result.ok) {
        setSuccess(true)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={balance <= 0}
        className="flex items-center gap-2 px-5 py-2.5 rounded-[9999px] text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: '#3ECF8E', color: '#fff' }}
      >
        <Wallet size={16} />
        Solicitar saque
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div
            className="w-full max-w-md rounded-[16px] shadow-xl"
            style={{ background: '#fff' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid #E2E8F0' }}
            >
              <div className="flex items-center gap-2">
                <Wallet size={18} style={{ color: '#3ECF8E' }} />
                <span className="font-semibold text-base" style={{ color: '#0F172A' }}>
                  Solicitar saque
                </span>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-1 transition-colors hover:bg-slate-100"
                style={{ color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              {success ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle2 size={40} style={{ color: '#3ECF8E' }} />
                  <p className="font-semibold text-lg" style={{ color: '#0F172A' }}>
                    Solicitação enviada!
                  </p>
                  <p className="text-sm" style={{ color: '#64748B' }}>
                    O administrador irá analisar e realizar a transferência via PIX em breve.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-2 px-6 py-2 rounded-[9999px] text-sm font-medium"
                    style={{ background: '#F1F5F9', color: '#0F172A' }}
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Saldo info */}
                  <div
                    className="rounded-[10px] p-4"
                    style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
                  >
                    <p className="text-xs font-medium" style={{ color: '#16A34A' }}>
                      Saldo disponível
                    </p>
                    <p className="text-xl font-bold mt-0.5" style={{ color: '#15803D' }}>
                      {fmt(balance)}
                    </p>
                  </div>

                  {/* Valor */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: '#374151' }}>
                      Valor a sacar (R$)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-[8px] text-sm border outline-none focus:ring-2"
                        style={{
                          borderColor: '#E2E8F0',
                          color: '#0F172A',
                          background: '#fff',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleSetMax}
                        className="px-3 py-2 rounded-[8px] text-xs font-medium border"
                        style={{ borderColor: '#E2E8F0', color: '#64748B', background: '#F8FAFC' }}
                      >
                        Máx
                      </button>
                    </div>
                  </div>

                  {/* Tipo da chave PIX */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: '#374151' }}>
                      Tipo da chave PIX
                    </label>
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value)}
                      className="w-full px-3 py-2 rounded-[8px] text-sm border outline-none focus:ring-2"
                      style={{ borderColor: '#E2E8F0', color: '#0F172A', background: '#fff' }}
                    >
                      {PIX_KEY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Chave PIX */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" style={{ color: '#374151' }}>
                      Chave PIX
                    </label>
                    <input
                      type="text"
                      placeholder={
                        pixKeyType === 'cpf' ? '000.000.000-00' :
                        pixKeyType === 'email' ? 'seu@email.com' :
                        pixKeyType === 'phone' ? '(85) 99999-9999' :
                        'Chave aleatória'
                      }
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="w-full px-3 py-2 rounded-[8px] text-sm border outline-none focus:ring-2"
                      style={{ borderColor: '#E2E8F0', color: '#0F172A', background: '#fff' }}
                    />
                  </div>

                  {error && (
                    <div
                      className="flex items-start gap-2 rounded-[8px] p-3 text-sm"
                      style={{ background: '#FEF2F2', color: '#DC2626' }}
                    >
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <p className="text-xs" style={{ color: '#94A3B8' }}>
                    O administrador irá analisar sua solicitação e realizar o PIX manualmente.
                  </p>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isPending}
                      className="flex-1 py-2.5 rounded-[9999px] text-sm font-medium border"
                      style={{ borderColor: '#E2E8F0', color: '#64748B', background: '#fff' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex-1 py-2.5 rounded-[9999px] text-sm font-semibold flex items-center justify-center gap-2"
                      style={{ background: '#3ECF8E', color: '#fff' }}
                    >
                      {isPending ? (
                        <><Loader2 size={15} className="animate-spin" /> Enviando...</>
                      ) : (
                        'Confirmar saque'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}


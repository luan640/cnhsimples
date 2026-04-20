'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { WithdrawalRow } from '@/lib/admin/queries'
import { approveWithdrawal, rejectWithdrawal } from '@/app/admin/saques/actions'

interface Props {
  withdrawal: WithdrawalRow
}

export function WithdrawalRowActions({ withdrawal: w }: Props) {
  const [isPending, startTransition] = useTransition()
  const [rejectMode, setRejectMode] = useState(false)
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn()
        setFeedback('OK')
        setRejectMode(false)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'tente novamente'
        setFeedback('Erro: ' + message)
      }
    })
  }

  if (feedback === 'OK') {
    return <td className="px-4 py-3 text-xs" style={{ color: '#3ECF8E' }}>Processado</td>
  }

  if (w.status !== 'pending') {
    return (
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{
            background: w.status === 'approved' ? '#F0FDF4' : '#FEF2F2',
            color: w.status === 'approved' ? '#16A34A' : '#DC2626',
          }}
        >
          {w.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
        </span>
      </td>
    )
  }

  return (
    <td className="px-4 py-3">
      {feedback && feedback !== 'OK' && (
        <p className="text-xs mb-1" style={{ color: '#DC2626' }}>{feedback}</p>
      )}
      {!rejectMode ? (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => run(() => approveWithdrawal(w.id, w.instructor_id, w.amount))}
            disabled={isPending}
            className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-xs font-semibold disabled:opacity-50"
            style={{ background: '#F0FDF4', color: '#16A34A' }}
          >
            <CheckCircle2 size={13} />
            Aprovar
          </button>
          <button
            onClick={() => setRejectMode(true)}
            disabled={isPending}
            className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-xs font-semibold disabled:opacity-50"
            style={{ background: '#FEF2F2', color: '#DC2626' }}
          >
            <XCircle size={13} />
            Rejeitar
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Motivo..."
            className="w-full px-2 py-1.5 text-xs rounded-[6px] border outline-none"
            style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
          />
          <div className="flex gap-1">
            <button
              onClick={() => run(() => rejectWithdrawal(w.id, note))}
              disabled={isPending || !note.trim()}
              className="flex-1 py-1.5 rounded-[6px] text-xs font-semibold disabled:opacity-50"
              style={{ background: '#DC2626', color: '#fff' }}
            >
              Confirmar
            </button>
            <button
              onClick={() => { setRejectMode(false); setNote('') }}
              className="flex-1 py-1.5 rounded-[6px] text-xs font-semibold"
              style={{ background: '#F1F5F9', color: '#64748B' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </td>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, XCircle, ShieldCheck, EyeOff, Eye } from 'lucide-react'
import {
  approveInstructorDocs,
  rejectInstructorDocs,
  activateInstructor,
  toggleHiddenFromSearch,
} from '@/app/admin/instrutores/[id]/actions'

interface Props {
  instructorId: string
  userId: string
  status: string
  hiddenFromSearch: boolean
}

export function InstructorActions({ instructorId, userId, status, hiddenFromSearch }: Props) {
  const [isPending, startTransition] = useTransition()
  const [rejectMode, setRejectMode] = useState(false)
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function run(fn: () => Promise<void>) {
    startTransition(async () => {
      try {
        await fn()
        setFeedback({ type: 'success', message: 'Ação realizada com sucesso!' })
        setRejectMode(false)
        setReason('')
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro ao processar ação.'
        setFeedback({ type: 'error', message })
      }
    })
  }

  return (
    <div
      className="rounded-[12px] border p-5 space-y-4"
      style={{ background: '#fff', borderColor: '#E2E8F0' }}
    >
      <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>Ações</p>

      {feedback && (
        <div
          className="px-4 py-3 rounded-[8px] text-sm"
          style={{
            background: feedback.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            color: feedback.type === 'success' ? '#16A34A' : '#DC2626',
            border: `1px solid ${feedback.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
          }}
        >
          {feedback.message}
        </div>
      )}

      <div className="space-y-2">
        {(status === 'pending' || status === 'docs_rejected') && (
          <button
            onClick={() => run(() => approveInstructorDocs(instructorId, userId))}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-sm font-semibold disabled:opacity-50"
            style={{ background: '#3ECF8E', color: '#0F172A' }}
          >
            <CheckCircle2 size={16} />
            Aprovar documentação
          </button>
        )}

        {status === 'docs_approved' && (
          <button
            onClick={() => run(() => activateInstructor(instructorId, userId))}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-sm font-semibold disabled:opacity-50"
            style={{ background: '#3ECF8E', color: '#0F172A' }}
          >
            <ShieldCheck size={16} />
            Ativar instrutor
          </button>
        )}

        {(status === 'pending' || status === 'docs_approved') && !rejectMode && (
          <button
            onClick={() => setRejectMode(true)}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-sm font-semibold disabled:opacity-50"
            style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
          >
            <XCircle size={16} />
            Rejeitar documentação
          </button>
        )}

        <button
          onClick={() => run(() => toggleHiddenFromSearch(instructorId, !hiddenFromSearch))}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-sm font-semibold disabled:opacity-50"
          style={
            hiddenFromSearch
              ? { background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD' }
              : { background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }
          }
        >
          {hiddenFromSearch ? <Eye size={16} /> : <EyeOff size={16} />}
          {hiddenFromSearch ? 'Reexibir na busca' : 'Ocultar da busca'}
        </button>

        {rejectMode && (
          <div className="space-y-2">
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Informe o motivo da rejeição..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-[8px] border outline-none resize-none"
              style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => run(() => rejectInstructorDocs(instructorId, userId, reason))}
                disabled={isPending || !reason.trim()}
                className="flex-1 py-2 rounded-[8px] text-sm font-semibold disabled:opacity-50"
                style={{ background: '#DC2626', color: '#fff' }}
              >
                Confirmar rejeição
              </button>
              <button
                onClick={() => { setRejectMode(false); setReason('') }}
                disabled={isPending}
                className="flex-1 py-2 rounded-[8px] text-sm font-semibold"
                style={{ background: '#F1F5F9', color: '#64748B' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useRef, useState, useTransition } from 'react'
import {
  BookCheck,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  Loader2,
  Paperclip,
  X,
  XCircle,
} from 'lucide-react'

import type { InstructorLesson } from '@/lib/instructors/aulas'
import { confirmLesson } from '@/app/painel/aulas/actions'

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${dateStr}T00:00:00`))
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

const STATUS_CONFIG = {
  pending: { label: 'Aguardando pagamento', color: '#92400E', bg: '#FEF3C7', icon: Clock },
  confirmed: { label: 'Agendada', color: '#065F46', bg: '#D1FAE5', icon: CalendarCheck },
  completed: { label: 'Concluída', color: '#1E40AF', bg: '#DBEAFE', icon: CheckCircle2 },
  cancelled: { label: 'Cancelada', color: '#991B1B', bg: '#FEE2E2', icon: XCircle },
} as const

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  lesson,
  onClose,
  onConfirmed,
}: {
  lesson: InstructorLesson
  onClose: () => void
  onConfirmed: (bookingId: string, receiptUrl: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedFile) {
      setError('Selecione o comprovante de registro.')
      return
    }

    const formData = new FormData()
    formData.append('bookingId', lesson.id)
    formData.append('receipt', selectedFile)

    startTransition(async () => {
      const result = await confirmLesson(formData)

      if (!result.ok) {
        setError(result.error)
        return
      }

      // We don't have the public URL here — will be refetched on router.refresh()
      onConfirmed(lesson.id, '')
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-t-[20px] bg-white p-5 sm:rounded-[16px]"
        style={{ boxShadow: '0 -4px 32px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-[8px]"
              style={{ background: 'rgba(62,207,142,0.12)' }}
            >
              <BookCheck size={16} style={{ color: '#3ECF8E' }} />
            </div>
            <h2 className="text-base font-bold" style={{ color: '#0F172A' }}>
              Confirmar aula
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#F1F5F9]"
            aria-label="Fechar"
          >
            <X size={16} style={{ color: '#64748B' }} />
          </button>
        </div>

        {/* Lesson info */}
        <div
          className="mb-4 rounded-[10px] px-3 py-3"
          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
        >
          <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>
            {lesson.student_name}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: '#64748B' }}>
            {formatDate(lesson.slot_date)} · {formatTime(lesson.slot_hour, lesson.slot_minute)}
            {lesson.lesson_mode === 'pickup' ? ' · Busca em casa' : ''}
          </p>
        </div>

        {/* File upload */}
        <div className="mb-4">
          <p className="mb-1.5 text-xs font-semibold" style={{ color: '#0F172A' }}>
            Comprovante de registro
            <span style={{ color: '#EF4444' }}> *</span>
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-[10px] border-2 border-dashed px-4 py-3 text-left transition-colors"
            style={{
              borderColor: selectedFile ? '#3ECF8E' : '#CBD5E1',
              background: selectedFile ? 'rgba(62,207,142,0.05)' : '#F8FAFC',
            }}
          >
            <Paperclip
              size={16}
              style={{ color: selectedFile ? '#3ECF8E' : '#94A3B8', flexShrink: 0 }}
            />
            <span className="min-w-0 flex-1 truncate text-sm" style={{ color: selectedFile ? '#0F172A' : '#94A3B8' }}>
              {selectedFile ? selectedFile.name : 'Selecionar arquivo (PDF, imagem)'}
            </span>
            {selectedFile && (
              <span className="shrink-0 text-xs" style={{ color: '#3ECF8E' }}>
                Alterar
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="mt-1 text-[11px]" style={{ color: '#94A3B8' }}>
            Aceito: JPG, PNG, PDF
          </p>
        </div>

        {error && (
          <div
            className="mb-3 rounded-[8px] px-3 py-2 text-xs font-medium"
            style={{ background: '#FEE2E2', color: '#991B1B' }}
          >
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ background: '#F1F5F9', color: '#64748B' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || !selectedFile}
            className="flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ background: '#3ECF8E', color: '#0F172A' }}
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                Confirmar aula
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Lesson chip ──────────────────────────────────────────────────────────────

function LessonChip({
  lesson,
  onConfirm,
}: {
  lesson: InstructorLesson
  onConfirm: () => void
}) {
  const cfg = STATUS_CONFIG[lesson.status] ?? STATUS_CONFIG.pending
  const StatusIcon = cfg.icon

  return (
    <div
      className="rounded-[12px] border border-[#E2E8F0] bg-white p-3"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-sm font-bold"
          style={{ background: 'rgba(62,207,142,0.12)', color: '#3ECF8E' }}
        >
          {getInitials(lesson.student_name)}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" style={{ color: '#0F172A' }}>
            {lesson.student_name}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: '#64748B' }}>
            {formatDate(lesson.slot_date)} · {formatTime(lesson.slot_hour, lesson.slot_minute)}
            {lesson.lesson_mode === 'pickup' ? ' · Busca em casa' : ''}
          </p>
        </div>

        {/* Status */}
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          <StatusIcon size={10} />
          {cfg.label}
        </span>
      </div>

      {/* Footer row */}
      <div className="mt-2.5 flex items-center justify-between border-t border-[#F1F5F9] pt-2.5">
        <span className="text-xs font-medium" style={{ color: '#64748B' }}>
          Sua parte: <span className="font-bold" style={{ color: '#0F172A' }}>{formatCurrency(lesson.instructor_amount)}</span>
        </span>

        {lesson.status === 'confirmed' && (
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-90"
            style={{ background: '#3ECF8E', color: '#0F172A' }}
          >
            <FileCheck2 size={12} />
            Confirmar aula
          </button>
        )}

        {lesson.status === 'completed' && lesson.receipt_url && (
          <a
            href={lesson.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: '#DBEAFE', color: '#1E40AF' }}
          >
            <ExternalLink size={12} />
            Ver comprovante
          </a>
        )}

        {lesson.status === 'completed' && !lesson.receipt_url && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{ background: '#DBEAFE', color: '#1E40AF' }}
          >
            <CheckCircle2 size={10} />
            Concluída
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: 'proximas' | 'historico' }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[12px] border border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-4 py-10 text-center">
      <CalendarCheck size={32} style={{ color: '#3ECF8E', opacity: 0.4 }} />
      <p className="text-sm font-medium" style={{ color: '#64748B' }}>
        {tab === 'proximas' ? 'Nenhuma aula próxima' : 'Nenhuma aula no histórico'}
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type Tab = 'proximas' | 'historico'

export function MinhasAulas({ lessons: initial }: { lessons: InstructorLesson[] }) {
  const [tab, setTab] = useState<Tab>('proximas')
  const [lessons, setLessons] = useState(initial)
  const [confirmingLesson, setConfirmingLesson] = useState<InstructorLesson | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const proximas = lessons.filter(
    (l) => (l.status === 'pending' || l.status === 'confirmed') && l.slot_date >= today
  )
  const historico = lessons.filter(
    (l) => l.status === 'completed' || l.status === 'cancelled' || l.slot_date < today
  )

  const shown = tab === 'proximas' ? proximas : historico

  function handleConfirmed(bookingId: string) {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === bookingId ? { ...l, status: 'completed' as const } : l
      )
    )
    setConfirmingLesson(null)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      {confirmingLesson && (
        <ConfirmModal
          lesson={confirmingLesson}
          onClose={() => setConfirmingLesson(null)}
          onConfirmed={handleConfirmed}
        />
      )}

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Minhas aulas</h1>
        <p className="mt-0.5 text-sm" style={{ color: '#64748B' }}>
          Confirme as aulas realizadas e anexe o comprovante de registro.
        </p>
      </header>

      {/* Stats row */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { value: proximas.filter((l) => l.status === 'confirmed').length, label: 'Aguardando confirm.' },
          { value: lessons.filter((l) => l.status === 'completed').length, label: 'Concluídas' },
          { value: proximas.length, label: 'Próximas' },
        ].map(({ value, label }) => (
          <div
            key={label}
            className="rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-4 text-center"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
          >
            <p className="text-2xl font-bold tabular-nums" style={{ color: '#0F172A' }}>{value}</p>
            <p className="mt-0.5 text-[11px]" style={{ color: '#64748B' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        className="mb-4 flex gap-1 rounded-[10px] border border-[#E2E8F0] bg-white p-1"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {(
          [
            { key: 'proximas', label: 'Próximas', count: proximas.length },
            { key: 'historico', label: 'Histórico', count: 0 },
          ] as const
        ).map((t) => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="flex flex-1 items-center justify-center gap-2 rounded-[8px] py-2.5 text-sm font-semibold transition-all"
              style={{
                background: active ? '#3ECF8E' : 'transparent',
                color: active ? '#06230F' : '#64748B',
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    background: active ? 'rgba(0,0,0,0.12)' : 'rgba(62,207,142,0.15)',
                    color: active ? '#06230F' : '#3ECF8E',
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {shown.length > 0
          ? shown.map((lesson) => (
              <LessonChip
                key={lesson.id}
                lesson={lesson}
                onConfirm={() => setConfirmingLesson(lesson)}
              />
            ))
          : <EmptyState tab={tab} />}
      </div>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import {
  Ban,
  CalendarDays,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  GraduationCap,
  Phone,
  Plus,
  Settings2,
  Trash2,
  X,
} from 'lucide-react'
import type { AgendaSlot, AbsenceBlock, ScheduleRule } from '@/lib/instructors/agenda'
import {
  createSlotsAction,
  deleteSlotAction,
  toggleSlotBlockAction,
  createAbsenceAction,
  deleteAbsenceAction,
  saveScheduleRulesAction,
} from '@/app/agenda/actions'

// ─── Constants ──────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 07–20
const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

type View = 'hoje' | 'semana' | 'mes'

// ─── Helpers ────────────────────────────────────────────────────────────────
function toDateStr(date: Date) {
  return date.toISOString().split('T')[0]
}

function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function formatDateBR(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function isAbsent(date: Date, absences: AbsenceBlock[]): boolean {
  const ds = toDateStr(date)
  return absences.some((a) => a.all_day && a.start_date <= ds && a.end_date >= ds)
}

// ─── Slot colors ────────────────────────────────────────────────────────────
const SLOT_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  available:  { bg: '#D1FAE5', text: '#065F46', border: '#059669' },
  reserved:   { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B' },
  booked:     { bg: '#E0F2FE', text: '#0369A1', border: '#0284C7' },
  completed:  { bg: '#F1F5F9', text: '#475569', border: '#94A3B8' },
  blocked:    { bg: '#FEE2E2', text: '#DC2626', border: '#DC2626' },
}

function slotStyle(status: string) {
  return SLOT_STYLE[status] ?? SLOT_STYLE.available
}

// ─── Props ──────────────────────────────────────────────────────────────────
interface Props {
  profileId: string
  initialSlots: AgendaSlot[]
  initialAbsences: AbsenceBlock[]
  initialRules: ScheduleRule[]
}

// ─── Modal: Criar Slot ───────────────────────────────────────────────────────
function CreateSlotModal({
  defaultDate,
  defaultHour,
  onClose,
  onSave,
}: {
  defaultDate: string
  defaultHour?: number
  onClose: () => void
  onSave: (payload: Parameters<typeof createSlotsAction>[0]) => Promise<void>
}) {
  const [date, setDate] = useState(defaultDate)
  const [startH, setStartH] = useState(String(defaultHour ?? 8).padStart(2, '0'))
  const [startM, setStartM] = useState('00')
  const [endH, setEndH] = useState(String((defaultHour ?? 8) + 1).padStart(2, '0'))
  const [endM, setEndM] = useState('00')
  const [duration, setDuration] = useState(60)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handle() {
    setErr(null)
    setLoading(true)
    await onSave({
      dates: [date],
      startHour: parseInt(startH),
      startMinute: parseInt(startM),
      endHour: parseInt(endH),
      endMinute: parseInt(endM),
      durationMinutes: duration,
    })
    setLoading(false)
    onClose()
  }

  const timeOptions = HOURS.flatMap((h) => [
    { label: formatTime(h, 0), value: `${h}:0` },
    { label: formatTime(h, 30), value: `${h}:30` },
  ])

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Adicionar disponibilidade" onClose={onClose} />
      <div className="p-4 space-y-4">
        <Field label="Data">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-[8px] border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:border-[#3ECF8E]"
            style={{ color: '#0F172A' }}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Início">
            <select
              value={`${parseInt(startH)}:${startM}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':')
                setStartH(h.padStart(2, '0'))
                setStartM(m.padStart(2, '0'))
              }}
              className="w-full rounded-[8px] border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:border-[#3ECF8E]"
              style={{ color: '#0F172A' }}
            >
              {timeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Fim">
            <select
              value={`${parseInt(endH)}:${endM}`}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':')
                setEndH(h.padStart(2, '0'))
                setEndM(m.padStart(2, '0'))
              }}
              className="w-full rounded-[8px] border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:border-[#3ECF8E]"
              style={{ color: '#0F172A' }}
            >
              {timeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Duração por slot">
          <div className="flex gap-2">
            {[30, 60].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className="flex-1 py-2 rounded-[8px] text-sm font-medium border transition-colors"
                style={{
                  background: duration === d ? '#3ECF8E' : '#fff',
                  color: duration === d ? '#0F172A' : '#64748B',
                  border: `1px solid ${duration === d ? '#3ECF8E' : '#E2E8F0'}`,
                }}
              >
                {d} min
              </button>
            ))}
          </div>
        </Field>

        {err && <p className="text-xs text-red-600">{err}</p>}

        <button
          onClick={handle}
          disabled={loading}
          className="w-full py-3 rounded-[9999px] text-sm font-semibold transition-opacity"
          style={{ background: '#3ECF8E', color: '#0F172A', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Salvando...' : 'Criar slots'}
        </button>
      </div>
    </ModalOverlay>
  )
}

// ─── Modal: Detalhe Slot ─────────────────────────────────────────────────────
function SlotDetailModal({
  slot,
  onClose,
  onDelete,
  onToggleBlock,
}: {
  slot: AgendaSlot
  onClose: () => void
  onDelete: () => Promise<void>
  onToggleBlock: (block: boolean) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const s = slotStyle(slot.status)
  const timeLabel = formatTime(slot.hour, slot.minute)
  const endMin = slot.hour * 60 + slot.minute + slot.slot_duration_minutes
  const endLabel = formatTime(Math.floor(endMin / 60), endMin % 60)

  const STATUS_LABEL: Record<string, string> = {
    reserved: 'Reservado',
    available: 'Disponível',
    booked: 'Agendado',
    completed: 'Concluído',
    blocked: 'Bloqueado',
  }

  async function wrap(fn: () => Promise<void>) {
    setLoading(true)
    await fn()
    setLoading(false)
    onClose()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Detalhes do slot" onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-10 rounded-full shrink-0"
            style={{ background: s.border }}
          />
          <div>
            <p className="text-base font-semibold" style={{ color: '#0F172A' }}>
              {timeLabel} – {endLabel}
            </p>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: s.bg, color: s.text }}
            >
              {STATUS_LABEL[slot.status]}
            </span>
          </div>
        </div>

        {slot.booking && (
          <div
            className="rounded-[12px] p-4 space-y-2"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#E0F2FE' }}
              >
                <GraduationCap size={16} style={{ color: '#0284C7' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#0F172A' }}>
                  {slot.booking.student_name}
                </p>
                <p className="text-xs" style={{ color: '#64748B' }}>
                  R$ {slot.booking.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <a
              href={`tel:${slot.booking.student_phone}`}
              className="flex items-center gap-2 text-xs"
              style={{ color: '#0284C7' }}
            >
              <Phone size={12} />
              {slot.booking.student_phone}
            </a>
            {slot.booking.notes && (
              <p className="text-xs" style={{ color: '#64748B' }}>
                {slot.booking.notes}
              </p>
            )}
          </div>
        )}

        {slot.status !== 'reserved' && slot.status !== 'booked' && slot.status !== 'completed' && (
          <div className="space-y-2">
            {slot.status === 'available' && (
              <button
                onClick={() => wrap(() => onToggleBlock(true))}
                disabled={loading}
                className="w-full py-2.5 rounded-[8px] text-sm font-medium flex items-center justify-center gap-2 border transition-colors"
                style={{ border: '1px solid #FEE2E2', color: '#DC2626', background: '#FFF5F5' }}
              >
                <Ban size={15} />
                Bloquear slot
              </button>
            )}
            {slot.status === 'blocked' && (
              <button
                onClick={() => wrap(() => onToggleBlock(false))}
                disabled={loading}
                className="w-full py-2.5 rounded-[8px] text-sm font-medium flex items-center justify-center gap-2 border"
                style={{ border: '1px solid #D1FAE5', color: '#065F46', background: '#F0FDF4' }}
              >
                Desbloquear
              </button>
            )}
            <button
              onClick={() => wrap(onDelete)}
              disabled={loading}
              className="w-full py-2.5 rounded-[8px] text-sm font-medium flex items-center justify-center gap-2 border"
              style={{ border: '1px solid #E2E8F0', color: '#64748B' }}
            >
              <Trash2 size={14} />
              Remover slot
            </button>
          </div>
        )}
      </div>
    </ModalOverlay>
  )
}

// ─── Modal: Criar Ausência ───────────────────────────────────────────────────
function CreateAbsenceModal({
  defaultDate,
  onClose,
  onSave,
}: {
  defaultDate: string
  onClose: () => void
  onSave: (payload: Parameters<typeof createAbsenceAction>[0]) => Promise<void>
}) {
  const [startDate, setStartDate] = useState(defaultDate)
  const [endDate, setEndDate] = useState(defaultDate)
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('18:00')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handle() {
    setErr(null)
    setLoading(true)
    await onSave({
      startDate,
      endDate,
      allDay,
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
      reason: reason || undefined,
    })
    setLoading(false)
    onClose()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Bloquear ausência" onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="De">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-[8px] border border-[#E2E8F0] px-3 py-2 text-sm"
              style={{ color: '#0F172A' }}
            />
          </Field>
          <Field label="Até">
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-[8px] border border-[#E2E8F0] px-3 py-2 text-sm"
              style={{ color: '#0F172A' }}
            />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAllDay(!allDay)}
            className="w-10 h-6 rounded-full transition-colors relative shrink-0"
            style={{ background: allDay ? '#3ECF8E' : '#CBD5E1' }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow"
              style={{ left: allDay ? '1.25rem' : '0.125rem', transform: 'translateX(0)' }}
            />
          </button>
          <span className="text-sm" style={{ color: '#0F172A' }}>
            Dia inteiro
          </span>
        </div>

        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-[8px] border border-[#E2E8F0] px-3 py-2 text-sm"
                style={{ color: '#0F172A' }}
              />
            </Field>
            <Field label="Fim">
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-[8px] border border-[#E2E8F0] px-3 py-2 text-sm"
                style={{ color: '#0F172A' }}
              />
            </Field>
          </div>
        )}

        <Field label="Motivo (opcional)">
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Férias, consulta médica..."
            className="w-full rounded-[8px] border border-[#E2E8F0] px-3 py-2 text-sm"
            style={{ color: '#0F172A' }}
          />
        </Field>

        {err && <p className="text-xs text-red-600">{err}</p>}

        <button
          onClick={handle}
          disabled={loading}
          className="w-full py-3 rounded-[9999px] text-sm font-semibold transition-opacity"
          style={{ background: '#FEE2E2', color: '#DC2626', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Salvando...' : 'Bloquear período'}
        </button>
      </div>
    </ModalOverlay>
  )
}

// ─── Modal: Detalhe Ausência ─────────────────────────────────────────────────
function AbsenceDetailModal({
  absence,
  onClose,
  onDelete,
}: {
  absence: AbsenceBlock
  onClose: () => void
  onDelete: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    await onDelete()
    setLoading(false)
    onClose()
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Período bloqueado" onClose={onClose} />
      <div className="p-4 space-y-4">
        <div
          className="rounded-[12px] p-4 space-y-2"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
        >
          <div className="flex items-center gap-2">
            <CalendarX2 size={16} style={{ color: '#DC2626' }} />
            <p className="text-sm font-medium" style={{ color: '#DC2626' }}>
              {absence.start_date === absence.end_date
                ? new Date(absence.start_date + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                : `${new Date(absence.start_date + 'T12:00').toLocaleDateString('pt-BR')} até ${new Date(absence.end_date + 'T12:00').toLocaleDateString('pt-BR')}`}
            </p>
          </div>
          {!absence.all_day && absence.start_time && (
            <div className="flex items-center gap-2">
              <Clock size={12} style={{ color: '#94A3B8' }} />
              <p className="text-xs" style={{ color: '#64748B' }}>
                {absence.start_time.slice(0, 5)} – {absence.end_time?.slice(0, 5)}
              </p>
            </div>
          )}
          {absence.reason && (
            <p className="text-xs" style={{ color: '#64748B' }}>{absence.reason}</p>
          )}
        </div>

        <button
          onClick={handle}
          disabled={loading}
          className="w-full py-2.5 rounded-[8px] text-sm font-medium flex items-center justify-center gap-2 border"
          style={{ border: '1px solid #E2E8F0', color: '#64748B' }}
        >
          <Trash2 size={14} />
          Remover bloqueio
        </button>
      </div>
    </ModalOverlay>
  )
}

// ─── Shared Modal Primitives ─────────────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-[20px] sm:rounded-[16px] overflow-hidden"
        style={{ background: '#fff', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-4"
      style={{ borderBottom: '1px solid #F1F5F9' }}
    >
      <h3 className="text-base font-semibold" style={{ color: '#0F172A' }}>{title}</h3>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: '#F1F5F9' }}
      >
        <X size={15} style={{ color: '#64748B' }} />
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Schedule Rules Modal ────────────────────────────────────────────────────
const DAY_NAMES_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const RULE_TIME_OPTIONS = (() => {
  const opts: { h: number; m: number; label: string }[] = []
  for (let h = 6; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) continue
      opts.push({ h, m, label: formatTime(h, m) })
    }
  }
  return opts
})()

function timeVal(h: number, m: number) {
  return `${h}:${m}`
}

function parseTimeVal(v: string): { h: number; m: number } {
  const [h, m] = v.split(':').map(Number)
  return { h, m }
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-10 h-6 rounded-full transition-colors relative shrink-0"
      style={{ background: checked ? '#3ECF8E' : '#CBD5E1' }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? '1.25rem' : '0.125rem' }}
      />
    </button>
  )
}

function DayRuleRow({
  rule,
  onChange,
}: {
  rule: ScheduleRule
  onChange: (updates: Partial<ScheduleRule>) => void
}) {
  return (
    <div style={{ borderBottom: '1px solid #F1F5F9' }}>
      <div className="flex items-center justify-between py-3 px-4">
        <span className="text-sm font-semibold" style={{ color: '#0F172A' }}>
          {DAY_NAMES_FULL[rule.day_of_week]}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: rule.is_active ? '#3ECF8E' : '#94A3B8' }}>
            {rule.is_active ? 'Ativo' : 'Inativo'}
          </span>
          <Toggle checked={rule.is_active} onChange={(v) => onChange({ is_active: v })} />
        </div>
      </div>

      {rule.is_active && (
        <div className="px-4 pb-4 space-y-3">
          {/* Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Início">
              <select
                value={timeVal(rule.start_hour, rule.start_minute)}
                onChange={(e) => {
                  const { h, m } = parseTimeVal(e.target.value)
                  onChange({ start_hour: h, start_minute: m })
                }}
                className="w-full rounded-[8px] border border-[#E2E8F0] px-2 py-2 text-sm focus:outline-none focus:border-[#3ECF8E]"
                style={{ color: '#0F172A' }}
              >
                {RULE_TIME_OPTIONS.map((o) => (
                  <option key={timeVal(o.h, o.m)} value={timeVal(o.h, o.m)}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Fim">
              <select
                value={timeVal(rule.end_hour, rule.end_minute)}
                onChange={(e) => {
                  const { h, m } = parseTimeVal(e.target.value)
                  onChange({ end_hour: h, end_minute: m })
                }}
                className="w-full rounded-[8px] border border-[#E2E8F0] px-2 py-2 text-sm focus:outline-none focus:border-[#3ECF8E]"
                style={{ color: '#0F172A' }}
              >
                {RULE_TIME_OPTIONS.map((o) => (
                  <option key={timeVal(o.h, o.m)} value={timeVal(o.h, o.m)}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Duration */}
          <Field label="Duração do slot">
            <div className="flex gap-2">
              {([30, 60] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onChange({ slot_duration_minutes: d })}
                  className="flex-1 py-2 rounded-[8px] text-sm font-medium border transition-colors"
                  style={{
                    background: rule.slot_duration_minutes === d ? '#3ECF8E' : '#fff',
                    color: rule.slot_duration_minutes === d ? '#0F172A' : '#64748B',
                    border: `1px solid ${rule.slot_duration_minutes === d ? '#3ECF8E' : '#E2E8F0'}`,
                  }}
                >
                  {d} min
                </button>
              ))}
            </div>
          </Field>

          {/* Break */}
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: '#64748B' }}>Intervalo / almoço</span>
            <Toggle checked={rule.break_enabled} onChange={(v) => onChange({ break_enabled: v })} />
          </div>

          {rule.break_enabled && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Intervalo início">
                <select
                  value={timeVal(rule.break_start_hour, rule.break_start_minute)}
                  onChange={(e) => {
                    const { h, m } = parseTimeVal(e.target.value)
                    onChange({ break_start_hour: h, break_start_minute: m })
                  }}
                  className="w-full rounded-[8px] border border-[#E2E8F0] px-2 py-2 text-sm focus:outline-none focus:border-[#3ECF8E]"
                  style={{ color: '#0F172A' }}
                >
                  {RULE_TIME_OPTIONS.map((o) => (
                    <option key={timeVal(o.h, o.m)} value={timeVal(o.h, o.m)}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Intervalo fim">
                <select
                  value={timeVal(rule.break_end_hour, rule.break_end_minute)}
                  onChange={(e) => {
                    const { h, m } = parseTimeVal(e.target.value)
                    onChange({ break_end_hour: h, break_end_minute: m })
                  }}
                  className="w-full rounded-[8px] border border-[#E2E8F0] px-2 py-2 text-sm focus:outline-none focus:border-[#3ECF8E]"
                  style={{ color: '#0F172A' }}
                >
                  {RULE_TIME_OPTIONS.map((o) => (
                    <option key={timeVal(o.h, o.m)} value={timeVal(o.h, o.m)}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ScheduleRulesModal({
  initialRules,
  onClose,
  onSave,
}: {
  initialRules: ScheduleRule[]
  onClose: () => void
  onSave: (rules: ScheduleRule[]) => Promise<void>
}) {
  const [rules, setRules] = useState<ScheduleRule[]>(initialRules)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function updateRule(dow: number, updates: Partial<ScheduleRule>) {
    setRules((prev) => prev.map((r) => (r.day_of_week === dow ? { ...r, ...updates } : r)))
    setSaved(false)
  }

  async function handle() {
    setErr(null)
    setLoading(true)
    await onSave(rules)
    setLoading(false)
    setSaved(true)
  }

  const activeDays = rules.filter((r) => r.is_active).length

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Regras de disponibilidade" onClose={onClose} />

      <div
        className="px-4 py-3 flex items-start gap-2 text-xs"
        style={{ background: '#F0FDF4', borderBottom: '1px solid #D1FAE5', color: '#065F46' }}
      >
        <Settings2 size={14} className="shrink-0 mt-0.5" />
        <span>
          Configure uma vez. A agenda se preenche automaticamente toda vez que você abrir o painel.
          Exceções pontuais use &quot;Bloquear ausência&quot;.
        </span>
      </div>

      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {rules.map((rule) => (
          <DayRuleRow
            key={rule.day_of_week}
            rule={rule}
            onChange={(updates) => updateRule(rule.day_of_week, updates)}
          />
        ))}
      </div>

      <div className="p-4 space-y-3" style={{ borderTop: '1px solid #F1F5F9' }}>
        {err && <p className="text-xs text-red-600">{err}</p>}

        {saved && (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#065F46' }}>
            <CheckCircle2 size={16} />
            <span>Regras salvas. Slots gerados automaticamente a cada vez que a agenda for aberta.</span>
          </div>
        )}

        <button
          onClick={handle}
          disabled={loading}
          className="w-full py-3 rounded-[9999px] text-sm font-semibold transition-opacity"
          style={{ background: '#3ECF8E', color: '#0F172A', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Aplicando...' : 'Salvar regras'}
        </button>
      </div>
    </ModalOverlay>
  )
}

// ─── Week Strip ──────────────────────────────────────────────────────────────
function WeekStrip({
  selectedDate,
  onSelect,
  slots,
  absences,
}: {
  selectedDate: Date
  onSelect: (d: Date) => void
  slots: AgendaSlot[]
  absences: AbsenceBlock[]
}) {
  const weekStart = startOfWeek(selectedDate)

  return (
    <div className="flex gap-1">
      {Array.from({ length: 7 }, (_, i) => {
        const day = addDays(weekStart, i)
        const ds = toDateStr(day)
        const isToday = ds === toDateStr(new Date())
        const isSelected = ds === toDateStr(selectedDate)
        const hasSlot = slots.some((s) => s.date === ds)
        const absent = isAbsent(day, absences)

        return (
          <button
            key={ds}
            onClick={() => onSelect(day)}
            className="flex-1 flex flex-col items-center py-2 rounded-[10px] transition-colors"
            style={{
              background: isSelected ? '#0F172A' : 'transparent',
              minWidth: 0,
            }}
          >
            <span
              className="text-[10px] font-medium mb-1"
              style={{ color: isSelected ? '#94A3B8' : '#94A3B8' }}
            >
              {DAY_NAMES_SHORT[day.getDay()]}
            </span>
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{
                background: isToday && !isSelected ? '#3ECF8E' : 'transparent',
                color: isSelected ? '#fff' : isToday ? '#0F172A' : '#0F172A',
              }}
            >
              {day.getDate()}
            </span>
            <div className="flex gap-0.5 mt-1 h-1">
              {hasSlot && !absent && (
                <span className="w-1 h-1 rounded-full" style={{ background: '#3ECF8E' }} />
              )}
              {absent && (
                <span className="w-1 h-1 rounded-full" style={{ background: '#EF4444' }} />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── Day Timeline ────────────────────────────────────────────────────────────
function DayTimeline({
  date,
  slots,
  absences,
  onSlotClick,
  onHourClick,
  onAbsenceClick,
}: {
  date: Date
  slots: AgendaSlot[]
  absences: AbsenceBlock[]
  onSlotClick: (s: AgendaSlot) => void
  onHourClick: (hour: number) => void
  onAbsenceClick: (a: AbsenceBlock) => void
}) {
  const ds = toDateStr(date)
  const daySlots = slots.filter((s) => s.date === ds)
  const absence = absences.find((a) => a.all_day && a.start_date <= ds && a.end_date >= ds)

  if (absence) {
    return (
      <div className="px-4 py-6">
        <button
          onClick={() => onAbsenceClick(absence)}
          className="w-full rounded-[12px] py-6 flex flex-col items-center gap-2 border-2 border-dashed transition-colors"
          style={{ borderColor: '#FECACA', background: '#FEF2F2' }}
        >
          <CalendarX2 size={24} style={{ color: '#EF4444' }} />
          <p className="text-sm font-medium" style={{ color: '#DC2626' }}>
            Dia bloqueado
          </p>
          {absence.reason && (
            <p className="text-xs" style={{ color: '#94A3B8' }}>{absence.reason}</p>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      {HOURS.map((hour) => {
        const hourSlots = daySlots.filter((s) => s.hour === hour)
        return (
          <div key={hour} className="flex" style={{ minHeight: 64, borderBottom: '1px solid #F1F5F9' }}>
            <div
              className="w-14 shrink-0 flex items-start pt-2 pl-4"
              style={{ color: '#94A3B8', fontSize: 12 }}
            >
              {formatTime(hour, 0)}
            </div>
            <div className="flex-1 px-2 py-1.5 space-y-1">
              {hourSlots.length === 0 ? (
                <button
                  onClick={() => onHourClick(hour)}
                  className="w-full h-10 rounded-[6px] border-2 border-dashed transition-colors flex items-center justify-center"
                  style={{ borderColor: '#E2E8F0' }}
                  aria-label={`Adicionar slot às ${formatTime(hour, 0)}`}
                >
                  <span className="text-xs" style={{ color: '#CBD5E1' }}>+</span>
                </button>
              ) : (
                hourSlots.map((slot) => {
                  const s = slotStyle(slot.status)
                  const endMin = slot.hour * 60 + slot.minute + slot.slot_duration_minutes
                  const endLabel = formatTime(Math.floor(endMin / 60), endMin % 60)

                  return (
                    <button
                      key={slot.id}
                      onClick={() => onSlotClick(slot)}
                      className="w-full rounded-[8px] px-3 py-2 text-left flex items-center gap-2"
                      style={{ background: s.bg, borderLeft: `3px solid ${s.border}` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: s.text }}>
                          {slot.booking ? slot.booking.student_name : slot.status === 'blocked' ? 'Bloqueado' : slot.status === 'reserved' ? 'Reservado' : 'Disponível'}
                        </p>
                        <p className="text-[10px]" style={{ color: s.text, opacity: 0.75 }}>
                          {formatTime(slot.hour, slot.minute)} – {endLabel} · {slot.slot_duration_minutes}min
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Week Grid ───────────────────────────────────────────────────────────────
function WeekGrid({
  weekStart,
  slots,
  absences,
  onSlotClick,
  onDayClick,
  onAbsenceClick,
}: {
  weekStart: Date
  slots: AgendaSlot[]
  absences: AbsenceBlock[]
  onSlotClick: (s: AgendaSlot) => void
  onDayClick: (d: Date) => void
  onAbsenceClick: (a: AbsenceBlock) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = toDateStr(new Date())

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 560 }}>
        {/* Day headers */}
        <div className="flex" style={{ borderBottom: '1px solid #E2E8F0' }}>
          <div className="w-12 shrink-0" />
          {days.map((day) => {
            const ds = toDateStr(day)
            const isToday = ds === today
            return (
              <div
                key={ds}
                className="flex-1 py-2 text-center"
                style={{ borderLeft: '1px solid #F1F5F9' }}
              >
                <p className="text-[10px]" style={{ color: '#94A3B8' }}>
                  {DAY_NAMES_SHORT[day.getDay()]}
                </p>
                <p
                  className="text-sm font-semibold mx-auto w-7 h-7 rounded-full flex items-center justify-center"
                  style={{
                    background: isToday ? '#3ECF8E' : 'transparent',
                    color: isToday ? '#0F172A' : '#0F172A',
                  }}
                >
                  {day.getDate()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Time grid */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          {HOURS.map((hour) => (
            <div key={hour} className="flex" style={{ height: 60, borderBottom: '1px solid #F1F5F9' }}>
              <div
                className="w-12 shrink-0 flex items-start pt-1 pl-2"
                style={{ color: '#94A3B8', fontSize: 11 }}
              >
                {formatTime(hour, 0)}
              </div>
              {days.map((day) => {
                const ds = toDateStr(day)
                const daySlots = slots.filter((s) => s.date === ds && s.hour === hour)
                const absent = isAbsent(day, absences)
                const absence = absent
                  ? absences.find((a) => a.all_day && a.start_date <= ds && a.end_date >= ds)
                  : undefined

                return (
                  <div
                    key={ds}
                    className="flex-1 relative px-0.5 py-0.5"
                    style={{
                      borderLeft: '1px solid #F1F5F9',
                      background: absent ? '#FEF2F2' : undefined,
                    }}
                  >
                    {absent && absence && hour === 8 && (
                      <button
                        onClick={() => onAbsenceClick(absence)}
                        className="absolute inset-0 flex items-center justify-center"
                        aria-label="Dia bloqueado"
                      >
                        <CalendarX2 size={12} style={{ color: '#FECACA' }} />
                      </button>
                    )}
                    {!absent &&
                      daySlots.map((slot) => {
                        const s = slotStyle(slot.status)
                        return (
                          <button
                            key={slot.id}
                            onClick={() => onSlotClick(slot)}
                            className="w-full rounded text-left px-1 py-0.5 mb-0.5 overflow-hidden"
                            style={{
                              background: s.bg,
                              borderLeft: `2px solid ${s.border}`,
                              fontSize: 10,
                              color: s.text,
                              lineHeight: '1.2',
                              maxHeight: 52,
                            }}
                          >
                            <span className="block font-medium truncate">
                              {slot.booking ? slot.booking.student_name.split(' ')[0] : slot.status === 'blocked' ? '🚫' : slot.status === 'reserved' ? '⏳' : '✓'}
                            </span>
                            <span className="block opacity-75">
                              {formatTime(slot.hour, slot.minute)}
                            </span>
                          </button>
                        )
                      })}
                    {!absent && daySlots.length === 0 && (
                      <button
                        onClick={() => onDayClick(day)}
                        className="w-full h-full opacity-0 hover:opacity-100 transition-opacity"
                        aria-label="Adicionar slot"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Month Grid ──────────────────────────────────────────────────────────────
function MonthGrid({
  year,
  month,
  slots,
  absences,
  selectedDate,
  onDayClick,
}: {
  year: number
  month: number
  slots: AgendaSlot[]
  absences: AbsenceBlock[]
  selectedDate: Date
  onDayClick: (d: Date) => void
}) {
  const today = toDateStr(new Date())
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPad = firstDay.getDay()

  const cells: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(year, month, i + 1)),
  ]

  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="px-4">
      <div className="grid grid-cols-7 mb-2">
        {DAY_NAMES_SHORT.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium py-1" style={{ color: '#94A3B8' }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`pad-${idx}`} />
          const ds = toDateStr(day)
          const isToday = ds === today
          const isSelected = ds === toDateStr(selectedDate)
          const daySlots = slots.filter((s) => s.date === ds)
          const absent = isAbsent(day, absences)
          const hasBooked = daySlots.some((s) => s.status === 'booked')
          const hasAvail = daySlots.some((s) => s.status === 'available')

          return (
            <button
              key={ds}
              onClick={() => onDayClick(day)}
              className="flex flex-col items-center py-1.5 rounded-[8px] transition-colors"
              style={{
                background: isSelected ? '#0F172A' : absent ? '#FEF2F2' : 'transparent',
              }}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                style={{
                  background: isToday && !isSelected ? '#3ECF8E' : 'transparent',
                  color: isSelected ? '#fff' : isToday ? '#0F172A' : absent ? '#DC2626' : '#0F172A',
                }}
              >
                {day.getDate()}
              </span>
              <div className="flex gap-0.5 mt-0.5 h-1">
                {hasBooked && (
                  <span className="w-1 h-1 rounded-full" style={{ background: '#0284C7' }} />
                )}
                {hasAvail && (
                  <span className="w-1 h-1 rounded-full" style={{ background: '#3ECF8E' }} />
                )}
                {absent && (
                  <span className="w-1 h-1 rounded-full" style={{ background: '#EF4444' }} />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function AgendaView({ profileId, initialSlots, initialAbsences, initialRules }: Props) {
  const router = useRouter()

  const [view, setView] = useState<View>('hoje')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [modal, setModal] = useState<
    | { type: 'create-slot'; hour?: number }
    | { type: 'slot-detail'; slot: AgendaSlot }
    | { type: 'create-absence' }
    | { type: 'absence-detail'; absence: AbsenceBlock }
    | { type: 'schedule-rules' }
    | null
  >(null)

  const slots = initialSlots
  const absences = initialAbsences

  const currentYear = selectedDate.getFullYear()
  const currentMonth = selectedDate.getMonth()
  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate])

  function navigatePrev() {
    if (view === 'hoje') setSelectedDate((d) => addDays(d, -1))
    else if (view === 'semana') setSelectedDate((d) => addDays(d, -7))
    else setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }

  function navigateNext() {
    if (view === 'hoje') setSelectedDate((d) => addDays(d, 1))
    else if (view === 'semana') setSelectedDate((d) => addDays(d, 7))
    else setSelectedDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  const headerTitle = useMemo(() => {
    if (view === 'hoje') {
      return selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    }
    if (view === 'semana') {
      const ws = startOfWeek(selectedDate)
      const we = addDays(ws, 6)
      return `${formatDateBR(ws)} – ${formatDateBR(we)}`
    }
    return `${MONTH_NAMES[currentMonth]} ${currentYear}`
  }, [view, selectedDate, currentMonth, currentYear])

  const handleCreateSlots = useCallback(
    async (payload: Parameters<typeof createSlotsAction>[0]) => {
      await createSlotsAction(payload)
      router.refresh()
    },
    [router]
  )

  const handleDeleteSlot = useCallback(
    async (slotId: string) => {
      await deleteSlotAction(slotId)
      router.refresh()
    },
    [router]
  )

  const handleToggleBlock = useCallback(
    async (slotId: string, block: boolean) => {
      await toggleSlotBlockAction(slotId, block)
      router.refresh()
    },
    [router]
  )

  const handleCreateAbsence = useCallback(
    async (payload: Parameters<typeof createAbsenceAction>[0]) => {
      await createAbsenceAction(payload)
      router.refresh()
    },
    [router]
  )

  const handleDeleteAbsence = useCallback(
    async (absenceId: string) => {
      await deleteAbsenceAction(absenceId)
      router.refresh()
    },
    [router]
  )

  const handleSaveRules = useCallback(
    async (rules: ScheduleRule[]) => {
      await saveScheduleRulesAction(
        rules.map((r) => ({
          day_of_week: r.day_of_week,
          is_active: r.is_active,
          start_hour: r.start_hour,
          start_minute: r.start_minute,
          end_hour: r.end_hour,
          end_minute: r.end_minute,
          slot_duration_minutes: r.slot_duration_minutes,
          break_enabled: r.break_enabled,
          break_start_hour: r.break_start_hour,
          break_start_minute: r.break_start_minute,
          break_end_hour: r.break_end_hour,
          break_end_minute: r.break_end_minute,
        }))
      )
      router.refresh()
    },
    [router]
  )

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F8FAFC' }}>
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-30 px-4 pt-4 pb-3 space-y-3"
        style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}
      >
        {/* Title row + nav + actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={navigatePrev}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#fff', border: '1px solid #E2E8F0' }}
          >
            <ChevronLeft size={16} style={{ color: '#64748B' }} />
          </button>

          <div className="flex-1 text-center">
            <p
              className="text-sm font-semibold capitalize leading-tight"
              style={{ color: '#0F172A' }}
            >
              {headerTitle}
            </p>
          </div>

          <button
            onClick={navigateNext}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#fff', border: '1px solid #E2E8F0' }}
          >
            <ChevronRight size={16} style={{ color: '#64748B' }} />
          </button>

          {/* Add button */}
          <button
            onClick={() => setModal({ type: 'create-slot' })}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#3ECF8E' }}
          >
            <Plus size={18} style={{ color: '#0F172A' }} />
          </button>

          {/* Block absence button */}
          <button
            onClick={() => setModal({ type: 'create-absence' })}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#FEE2E2' }}
            title="Bloquear ausência"
          >
            <CalendarX2 size={16} style={{ color: '#DC2626' }} />
          </button>

          {/* Schedule rules button */}
          <button
            onClick={() => setModal({ type: 'schedule-rules' })}
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0' }}
            title="Regras de disponibilidade"
          >
            <Settings2 size={16} style={{ color: '#64748B' }} />
          </button>
        </div>

        {/* View toggle */}
        <div
          className="flex rounded-[9999px] p-0.5"
          style={{ background: '#E2E8F0' }}
        >
          {(['hoje', 'semana', 'mes'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="flex-1 py-1.5 rounded-[9999px] text-xs font-semibold capitalize transition-colors"
              style={{
                background: view === v ? '#0F172A' : 'transparent',
                color: view === v ? '#fff' : '#64748B',
              }}
            >
              {v === 'mes' ? 'Mês' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Week strip (hidden in month view) */}
        {view !== 'mes' && (
          <WeekStrip
            selectedDate={selectedDate}
            onSelect={(d) => {
              setSelectedDate(d)
              setView('hoje')
            }}
            slots={slots}
            absences={absences}
          />
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1">
        {view === 'hoje' && (
          <DayTimeline
            date={selectedDate}
            slots={slots}
            absences={absences}
            onSlotClick={(s) => setModal({ type: 'slot-detail', slot: s })}
            onHourClick={(h) => setModal({ type: 'create-slot', hour: h })}
            onAbsenceClick={(a) => setModal({ type: 'absence-detail', absence: a })}
          />
        )}

        {view === 'semana' && (
          <WeekGrid
            weekStart={weekStart}
            slots={slots}
            absences={absences}
            onSlotClick={(s) => setModal({ type: 'slot-detail', slot: s })}
            onDayClick={(d) => {
              setSelectedDate(d)
              setModal({ type: 'create-slot' })
            }}
            onAbsenceClick={(a) => setModal({ type: 'absence-detail', absence: a })}
          />
        )}

        {view === 'mes' && (
          <div className="py-4">
            <MonthGrid
              year={currentYear}
              month={currentMonth}
              slots={slots}
              absences={absences}
              selectedDate={selectedDate}
              onDayClick={(d) => {
                setSelectedDate(d)
                setView('hoje')
              }}
            />

            {/* Legend */}
            <div className="flex flex-wrap gap-3 px-4 mt-6">
              {[
                { color: '#3ECF8E', label: 'Disponível' },
                { color: '#0284C7', label: 'Agendado' },
                { color: '#94A3B8', label: 'Concluído' },
                { color: '#EF4444', label: 'Bloqueado' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs" style={{ color: '#64748B' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Calendar icon shortcut (today) ── */}
      <button
        onClick={() => {
          setSelectedDate(new Date())
          setView('hoje')
        }}
        className="fixed bottom-24 right-4 lg:bottom-6 w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-20"
        style={{ background: '#fff', border: '1px solid #E2E8F0' }}
        title="Ir para hoje"
      >
        <CalendarDays size={18} style={{ color: '#3ECF8E' }} />
      </button>

      {/* ── Modals ── */}
      {modal?.type === 'create-slot' && (
        <CreateSlotModal
          defaultDate={toDateStr(selectedDate)}
          defaultHour={modal.hour}
          onClose={() => setModal(null)}
          onSave={handleCreateSlots}
        />
      )}

      {modal?.type === 'slot-detail' && (
        <SlotDetailModal
          slot={modal.slot}
          onClose={() => setModal(null)}
          onDelete={() => handleDeleteSlot(modal.slot.id)}
          onToggleBlock={(block) => handleToggleBlock(modal.slot.id, block)}
        />
      )}

      {modal?.type === 'create-absence' && (
        <CreateAbsenceModal
          defaultDate={toDateStr(selectedDate)}
          onClose={() => setModal(null)}
          onSave={handleCreateAbsence}
        />
      )}

      {modal?.type === 'absence-detail' && (
        <AbsenceDetailModal
          absence={modal.absence}
          onClose={() => setModal(null)}
          onDelete={() => handleDeleteAbsence(modal.absence.id)}
        />
      )}

      {modal?.type === 'schedule-rules' && (
        <ScheduleRulesModal
          initialRules={initialRules}
          onClose={() => setModal(null)}
          onSave={handleSaveRules}
        />
      )}
    </div>
  )
}


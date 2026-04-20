'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import {
  BookOpen,
  Car,
  Edit2,
  Moon,
  Package,
  ParkingSquare,
  Plus,
  SquareUser,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react'
import type { InstructorService, PickupRange } from '@/lib/instructors/services'
import { studentPrice, PLATFORM_SPLIT, serviceTitle } from '@/lib/instructors/services'
import {
  upsertServiceAction,
  deleteServiceAction,
  toggleServiceActiveAction,
  type ServicePayload,
} from '@/app/servicos/actions'

// ─── Constants ──────────────────────────────────────────────────────────────
const CATEGORY_LABEL: Record<string, string> = { A: 'Cat. A — Moto', B: 'Cat. B — Carro', AB: 'Cat. A+B' }
const CATEGORY_COLOR: Record<string, { bg: string; text: string }> = {
  A:  { bg: '#FEF3C7', text: '#92400E' },
  B:  { bg: '#DBEAFE', text: '#1E40AF' },
  AB: { bg: '#F3E8FF', text: '#6B21A8' },
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  profileId: string
  initialServices: InstructorService[]
}

// ─── Shared UI primitives ────────────────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-[20px] sm:rounded-[16px] overflow-hidden"
        style={{ background: '#fff', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-4 sticky top-0 bg-white z-10"
      style={{ borderBottom: '1px solid #F1F5F9' }}>
      <h3 className="text-base font-semibold" style={{ color: '#0F172A' }}>{title}</h3>
      <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: '#F1F5F9' }}>
        <X size={15} style={{ color: '#64748B' }} />
      </button>
    </div>
  )
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>{label}</label>
      {children}
      {hint && <p className="text-[11px] mt-1" style={{ color: '#94A3B8' }}>{hint}</p>}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="w-10 h-6 rounded-full transition-colors relative shrink-0"
      style={{ background: checked ? '#3ECF8E' : '#CBD5E1' }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? '1.25rem' : '0.125rem' }} />
    </button>
  )
}

// ─── Option flags config ─────────────────────────────────────────────────────
type OptionKey =
  | 'accepts_home_pickup'
  | 'accepts_student_vehicle'
  | 'accepts_highway'
  | 'accepts_night_driving'
  | 'accepts_parking_practice'
  | 'provides_vehicle'

const OPTIONS: { key: OptionKey; label: string; hint: string; icon: React.ElementType }[] = [
  {
    key: 'provides_vehicle',
    label: 'Forneço meu veículo',
    hint: 'Você leva o veículo para a aula',
    icon: Car,
  },
  {
    key: 'accepts_student_vehicle',
    label: 'Aceito veículo do aluno',
    hint: 'O aluno pode usar o próprio carro/moto',
    icon: SquareUser,
  },
  {
    key: 'accepts_highway',
    label: 'Aceito aulas em rodovias',
    hint: 'Prática em vias de alta velocidade',
    icon: TrendingUp,
  },
  {
    key: 'accepts_night_driving',
    label: 'Aceito aulas noturnas',
    hint: 'Horários após as 18h',
    icon: Moon,
  },
  {
    key: 'accepts_parking_practice',
    label: 'Aceito prática de estacionamento',
    hint: 'Manobras, garagem, paralelo',
    icon: ParkingSquare,
  },
]

// ─── Service Modal ────────────────────────────────────────────────────────────
type RangeRow = { from_km: string; to_km: string; price: string }

type FormState = {
  category: 'A' | 'B' | 'AB' | ''
  service_type: 'individual' | 'package'
  lesson_count: string
  price: string
  accepts_home_pickup: boolean
  pickup_ranges: RangeRow[]
  accepts_student_vehicle: boolean
  accepts_highway: boolean
  accepts_night_driving: boolean
  accepts_parking_practice: boolean
  provides_vehicle: boolean
  notes: string
  is_active: boolean
}

function emptyForm(): FormState {
  return {
    category: '',
    service_type: 'individual',
    lesson_count: '1',
    price: '',
    accepts_home_pickup: false,
    pickup_ranges: [],
    accepts_student_vehicle: false,
    accepts_highway: false,
    accepts_night_driving: false,
    accepts_parking_practice: false,
    provides_vehicle: true,
    notes: '',
    is_active: true,
  }
}

function serviceToForm(s: InstructorService): FormState {
  return {
    category: (s.category ?? '') as FormState['category'],
    service_type: s.service_type,
    lesson_count: String(s.lesson_count),
    price: String(s.price),
    accepts_home_pickup: s.accepts_home_pickup,
    pickup_ranges: s.pickup_ranges.map((r) => ({
      from_km: String(r.from_km),
      to_km: String(r.to_km),
      price: String(r.price),
    })),
    accepts_student_vehicle: s.accepts_student_vehicle,
    accepts_highway: s.accepts_highway,
    accepts_night_driving: s.accepts_night_driving,
    accepts_parking_practice: s.accepts_parking_practice,
    provides_vehicle: s.provides_vehicle,
    notes: s.notes ?? '',
    is_active: s.is_active,
  }
}

function ServiceModal({
  service,
  onClose,
  onSave,
}: {
  service: InstructorService | null
  onClose: () => void
  onSave: (payload: ServicePayload, id?: string) => Promise<void>
}) {
  const [form, setForm] = useState<FormState>(service ? serviceToForm(service) : emptyForm())
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErr(null)
  }

  const priceNum = parseFloat(form.price.replace(',', '.')) || 0
  const studentTotal = priceNum > 0 ? studentPrice(priceNum) : 0
  const lessonCount = parseInt(form.lesson_count) || 1
  const previewTitle = serviceTitle({
    service_type: form.service_type,
    category: (form.category as 'A' | 'B' | 'AB') || null,
    lesson_count: lessonCount,
  })

  async function handle() {
    if (!priceNum || priceNum <= 0) return setErr('Informe um valor válido.')
    if (form.service_type === 'package' && lessonCount < 2) {
      return setErr('Pacote deve ter pelo menos 2 aulas.')
    }

    const validRanges: PickupRange[] = form.pickup_ranges
      .map((r) => ({ from_km: parseFloat(r.from_km) || 0, to_km: parseFloat(r.to_km) || 0, price: parseFloat(r.price.replace(',', '.')) || 0 }))
      .filter((r) => r.to_km > r.from_km && r.price > 0)

    setErr(null)
    setLoading(true)
    await onSave(
      {
        category: (form.category as 'A' | 'B' | 'AB') || null,
        service_type: form.service_type,
        lesson_count: lessonCount,
        price: priceNum,
        accepts_home_pickup: form.accepts_home_pickup,
        pickup_ranges: validRanges,
        accepts_student_vehicle: form.accepts_student_vehicle,
        accepts_highway: form.accepts_highway,
        accepts_night_driving: form.accepts_night_driving,
        accepts_parking_practice: form.accepts_parking_practice,
        provides_vehicle: form.provides_vehicle,
        notes: form.notes,
        is_active: form.is_active,
      },
      service?.id
    )
    setLoading(false)
  }

  const inputCls = 'w-full rounded-[8px] border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:border-[#3ECF8E]'
  const inputStyle = { color: '#0F172A' }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title={service ? 'Editar serviço' : 'Novo serviço'} onClose={onClose} />

      <div className="p-4 space-y-4">
        {/* Auto-generated title preview */}
        <div className="rounded-[8px] px-3 py-2.5" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
          <p className="text-[10px] font-medium uppercase tracking-wide mb-0.5" style={{ color: '#94A3B8' }}>Nome gerado automaticamente</p>
          <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>{previewTitle}</p>
        </div>

        {/* Category + Type */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria CNH">
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value as FormState['category'])}
              className={inputCls}
              style={inputStyle}
            >
              <option value="">Sem categoria</option>
              <option value="A">A — Moto</option>
              <option value="B">B — Carro</option>
              <option value="AB">A+B</option>
            </select>
          </Field>

          <Field label="Tipo">
            <div className="flex gap-2 h-[38px]">
              {(['individual', 'package'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('service_type', t)}
                  className="flex-1 rounded-[8px] text-xs font-medium border transition-colors"
                  style={{
                    background: form.service_type === t ? '#0F172A' : '#fff',
                    color: form.service_type === t ? '#fff' : '#64748B',
                    border: `1px solid ${form.service_type === t ? '#0F172A' : '#E2E8F0'}`,
                  }}
                >
                  {t === 'individual' ? 'Avulsa' : 'Pacote'}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Lesson count (packages only) */}
        {form.service_type === 'package' && (
          <Field label="Número de aulas no pacote">
            <input
              type="number"
              min={2}
              value={form.lesson_count}
              onChange={(e) => set('lesson_count', e.target.value)}
              className={inputCls}
              style={inputStyle}
            />
          </Field>
        )}

        {/* Price */}
        <Field
          label={form.service_type === 'package' ? 'Valor do pacote (o que você recebe)' : 'Valor da aula (o que você recebe)'}
          hint={
            priceNum > 0
              ? `Valor cobrado ao aluno: ${formatBRL(studentTotal)} (plataforma: ${PLATFORM_SPLIT * 100}%)`
              : undefined
          }
        >
          <div className="flex items-center rounded-[8px] border border-[#E2E8F0] focus-within:border-[#3ECF8E] overflow-hidden">
            <span className="px-3 text-sm font-medium shrink-0" style={{ color: '#94A3B8', borderRight: '1px solid #E2E8F0' }}>R$</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="0,00"
              className="flex-1 px-3 py-2 text-sm focus:outline-none"
              style={inputStyle}
            />
          </div>
        </Field>

        {/* Options */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: '#64748B' }}>Condições oferecidas</p>
          <div className="space-y-2.5">

            {/* Home pickup — special: has sub-fields */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm" style={{ color: '#0F172A' }}>Busco o aluno em casa</p>
                  <p className="text-[11px]" style={{ color: '#94A3B8' }}>
                    Taxa de deslocamento cobrada no checkout
                  </p>
                </div>
                <Toggle
                  checked={form.accepts_home_pickup}
                  onChange={(v) => {
                    set('accepts_home_pickup', v)
                    if (v && form.pickup_ranges.length === 0) {
                      set('pickup_ranges', [{ from_km: '0', to_km: '5', price: '' }])
                    }
                  }}
                />
              </div>

              {form.accepts_home_pickup && (
                <div
                  className="mt-3 rounded-[10px] p-3 space-y-2"
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <p className="text-[11px] font-medium" style={{ color: '#64748B' }}>
                    Faixas de distância e taxa adicional
                  </p>

                  {form.pickup_ranges.map((range, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={range.from_km}
                        onChange={(e) => {
                          const updated = [...form.pickup_ranges]
                          updated[i] = { ...updated[i], from_km: e.target.value }
                          set('pickup_ranges', updated)
                        }}
                        className="w-14 rounded-[6px] border border-[#E2E8F0] px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#3ECF8E]"
                        style={{ color: '#0F172A' }}
                        placeholder="0"
                      />
                      <span className="text-xs shrink-0" style={{ color: '#94A3B8' }}>a</span>
                      <input
                        type="number"
                        min={0}
                        value={range.to_km}
                        onChange={(e) => {
                          const updated = [...form.pickup_ranges]
                          updated[i] = { ...updated[i], to_km: e.target.value }
                          set('pickup_ranges', updated)
                        }}
                        className="w-14 rounded-[6px] border border-[#E2E8F0] px-2 py-1.5 text-xs text-center focus:outline-none focus:border-[#3ECF8E]"
                        style={{ color: '#0F172A' }}
                        placeholder="5"
                      />
                      <span className="text-xs shrink-0" style={{ color: '#94A3B8' }}>km → R$</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={range.price}
                        onChange={(e) => {
                          const updated = [...form.pickup_ranges]
                          updated[i] = { ...updated[i], price: e.target.value }
                          set('pickup_ranges', updated)
                        }}
                        className="flex-1 rounded-[6px] border border-[#E2E8F0] px-2 py-1.5 text-xs focus:outline-none focus:border-[#3ECF8E]"
                        style={{ color: '#0F172A' }}
                        placeholder="0,00"
                      />
                      <button
                        type="button"
                        onClick={() => set('pickup_ranges', form.pickup_ranges.filter((_, j) => j !== i))}
                        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                        style={{ color: '#DC2626' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      const last = form.pickup_ranges[form.pickup_ranges.length - 1]
                      const nextFrom = last ? last.to_km : '0'
                      set('pickup_ranges', [...form.pickup_ranges, { from_km: nextFrom, to_km: '', price: '' }])
                    }}
                    className="w-full py-1.5 rounded-[6px] text-xs font-medium border border-dashed transition-colors"
                    style={{ border: '1px dashed #CBD5E1', color: '#64748B' }}
                  >
                    + Adicionar faixa
                  </button>
                </div>
              )}
            </div>

            {/* Regular options */}
            {OPTIONS.map(({ key, label, hint }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm" style={{ color: '#0F172A' }}>{label}</p>
                  <p className="text-[11px]" style={{ color: '#94A3B8' }}>{hint}</p>
                </div>
                <Toggle
                  checked={form[key] as boolean}
                  onChange={(v) => set(key, v)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <Field label="Observações (opcional)">
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Qualquer informação extra para o aluno..."
            rows={2}
            className={inputCls}
            style={inputStyle}
          />
        </Field>

        {/* Active toggle */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium" style={{ color: '#0F172A' }}>Serviço ativo</p>
            <p className="text-[11px]" style={{ color: '#94A3B8' }}>Aparece para alunos ao buscar instrutores</p>
          </div>
          <Toggle checked={form.is_active} onChange={(v) => set('is_active', v)} />
        </div>

        {err && <p className="text-xs text-red-600">{err}</p>}

        <button
          onClick={handle}
          disabled={loading}
          className="w-full py-3 rounded-[9999px] text-sm font-semibold transition-opacity"
          style={{ background: '#3ECF8E', color: '#0F172A', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Salvando...' : service ? 'Salvar alterações' : 'Criar serviço'}
        </button>
      </div>
    </ModalOverlay>
  )
}

// ─── Delete confirm modal ────────────────────────────────────────────────────
function DeleteModal({
  service,
  onClose,
  onConfirm,
}: {
  service: InstructorService
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Remover serviço" onClose={onClose} />
      <div className="p-4 space-y-4">
        <div className="rounded-[12px] p-4" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{serviceTitle(service)}</p>
          <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>
            Esta ação não pode ser desfeita. Agendamentos existentes não são afetados.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-[8px] text-sm font-medium border"
            style={{ border: '1px solid #E2E8F0', color: '#64748B' }}
          >
            Cancelar
          </button>
          <button
            onClick={handle}
            disabled={loading}
            className="flex-1 py-2.5 rounded-[9999px] text-sm font-semibold transition-opacity"
            style={{ background: '#EF4444', color: '#fff', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Removendo...' : 'Remover'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

// ─── Service Card ────────────────────────────────────────────────────────────
function ServiceCard({
  service,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  service: InstructorService
  onEdit: () => void
  onDelete: () => void
  onToggleActive: (active: boolean) => Promise<void>
}) {
  const [toggling, setToggling] = useState(false)
  const cat = service.category ? CATEGORY_COLOR[service.category] : null
  const activeOptions = OPTIONS.filter((o) => service[o.key as keyof InstructorService])
  const hasPickup = service.accepts_home_pickup

  async function handleToggle() {
    setToggling(true)
    await onToggleActive(!service.is_active)
    setToggling(false)
  }

  return (
    <div
      className="rounded-[12px] p-4 space-y-3 transition-opacity"
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        opacity: service.is_active ? 1 : 0.55,
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: service.service_type === 'package' ? '#F3E8FF' : '#F0FDF4' }}
        >
          {service.service_type === 'package'
            ? <Package size={18} style={{ color: '#7C3AED' }} />
            : <BookOpen size={18} style={{ color: '#059669' }} />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold truncate" style={{ color: '#0F172A' }}>
              {serviceTitle(service)}
            </p>
            {cat && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: cat.bg, color: cat.text }}
              >
                {CATEGORY_LABEL[service.category!]}
              </span>
            )}
            {service.service_type === 'package' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: '#F3E8FF', color: '#6B21A8' }}>
                {service.lesson_count} aulas
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div
        className="rounded-[8px] p-3 flex items-center justify-between"
        style={{ background: '#F8FAFC', border: '1px solid #F1F5F9' }}
      >
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#94A3B8' }}>
            Você recebe
          </p>
          <p className="text-lg font-bold" style={{ color: '#3ECF8E' }}>
            {formatBRL(service.price)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#94A3B8' }}>
            Cobrado ao aluno
          </p>
          <p className="text-base font-semibold" style={{ color: '#0F172A' }}>
            {formatBRL(studentPrice(service.price))}
          </p>
        </div>
      </div>

      {/* Options */}
      {(activeOptions.length > 0 || hasPickup) && (
        <div className="space-y-1.5">
          {hasPickup && (
            <div>
              <span
                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}
              >
                <TrendingUp size={10} />
                {service.pickup_ranges.length === 0 ? 'Busco em casa — sem taxa' : 'Busco em casa'}
              </span>
              {service.pickup_ranges.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {service.pickup_ranges.map((r, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' }}
                    >
                      {r.from_km}–{r.to_km} km · +{formatBRL(r.price)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeOptions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {activeOptions.map(({ key, label, icon: Icon }) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: '#F0FDF4', color: '#065F46', border: '1px solid #D1FAE5' }}
                >
                  <Icon size={10} />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {service.notes && (
        <p className="text-xs italic" style={{ color: '#94A3B8' }}>{service.notes}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid #F1F5F9' }}>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="flex-1 py-2 rounded-[8px] text-xs font-medium border transition-colors"
          style={{
            border: `1px solid ${service.is_active ? '#E2E8F0' : '#D1FAE5'}`,
            color: service.is_active ? '#64748B' : '#059669',
            background: service.is_active ? '#fff' : '#F0FDF4',
          }}
        >
          {service.is_active ? 'Desativar' : 'Ativar'}
        </button>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-xs font-medium border"
          style={{ border: '1px solid #E2E8F0', color: '#64748B' }}
        >
          <Edit2 size={12} />
          Editar
        </button>
        <button
          onClick={onDelete}
          className="w-9 h-9 rounded-[8px] flex items-center justify-center border"
          style={{ border: '1px solid #FEE2E2', color: '#DC2626' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-16 h-16 rounded-[16px] flex items-center justify-center mb-4"
        style={{ background: '#F0FDF4' }}
      >
        <BookOpen size={28} style={{ color: '#3ECF8E' }} />
      </div>
      <h2 className="text-base font-semibold mb-1" style={{ color: '#0F172A' }}>
        Nenhum serviço cadastrado
      </h2>
      <p className="text-sm mb-6 max-w-xs" style={{ color: '#64748B' }}>
        Cadastre os serviços que você oferece para que alunos possam escolher ao agendar aulas.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[9999px] text-sm font-semibold"
        style={{ background: '#3ECF8E', color: '#0F172A' }}
      >
        <Plus size={16} />
        Criar primeiro serviço
      </button>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function ServicosView({ profileId: _profileId, initialServices }: Props) {
  const router = useRouter()
  const services = initialServices

  const [modal, setModal] = useState<
    | { type: 'create' }
    | { type: 'edit'; service: InstructorService }
    | { type: 'delete'; service: InstructorService }
    | null
  >(null)

  const handleUpsert = useCallback(
    async (payload: ServicePayload, id?: string) => {
      await upsertServiceAction({ ...payload, id })
      setModal(null)
      router.refresh()
    },
    [router]
  )

  const handleDelete = useCallback(
    async (serviceId: string) => {
      await deleteServiceAction(serviceId)
      setModal(null)
      router.refresh()
    },
    [router]
  )

  const handleToggleActive = useCallback(
    async (serviceId: string, active: boolean) => {
      await toggleServiceActiveAction(serviceId, active)
      router.refresh()
    },
    [router]
  )

  const activeCount = services.filter((s) => s.is_active).length

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F8FAFC' }}>
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-30 px-4 pt-4 pb-3"
        style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#0F172A' }}>Meus Serviços</h1>
            {services.length > 0 && (
              <p className="text-xs" style={{ color: '#94A3B8' }}>
                {activeCount} ativo{activeCount !== 1 ? 's' : ''} · {services.length} no total
              </p>
            )}
          </div>
          <button
            onClick={() => setModal({ type: 'create' })}
            className="flex items-center gap-2 px-4 py-2 rounded-[9999px] text-sm font-semibold shrink-0"
            style={{ background: '#3ECF8E', color: '#0F172A' }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Novo serviço</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* ── Info banner ── */}
      {services.length > 0 && (
        <div
          className="mx-4 mt-4 rounded-[10px] px-4 py-3 text-xs"
          style={{ background: '#F0FDF4', border: '1px solid #D1FAE5', color: '#065F46' }}
        >
          O valor que você define é o que entra na sua carteira. A plataforma adiciona{' '}
          <strong>{PLATFORM_SPLIT * 100}%</strong> ao cobrar o aluno.
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-4">
        {services.length === 0 ? (
          <EmptyState onCreate={() => setModal({ type: 'create' })} />
        ) : (
          <div className="space-y-3 max-w-2xl">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => setModal({ type: 'edit', service })}
                onDelete={() => setModal({ type: 'delete', service })}
                onToggleActive={(active) => handleToggleActive(service.id, active)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {(modal?.type === 'create' || modal?.type === 'edit') && (
        <ServiceModal
          service={modal.type === 'edit' ? modal.service : null}
          onClose={() => setModal(null)}
          onSave={handleUpsert}
        />
      )}

      {modal?.type === 'delete' && (
        <DeleteModal
          service={modal.service}
          onClose={() => setModal(null)}
          onConfirm={() => handleDelete(modal.service.id)}
        />
      )}
    </div>
  )
}

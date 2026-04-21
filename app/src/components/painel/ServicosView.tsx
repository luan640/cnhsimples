'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import {
  BookOpen,
  Car,
  Edit2,
  Package,
  Plus,
  SquareUser,
  Trash2,
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

const CATEGORY_LABEL: Record<string, string> = {
  A: 'Cat. A - Moto',
  B: 'Cat. B - Carro',
  AB: 'Cat. A+B',
}

const CATEGORY_COLOR: Record<string, { bg: string; text: string }> = {
  A: { bg: '#FEF3C7', text: '#92400E' },
  B: { bg: '#DBEAFE', text: '#1E40AF' },
  AB: { bg: '#F3E8FF', text: '#6B21A8' },
}

type Props = {
  profileId: string
  initialServices: InstructorService[]
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-t-[20px] bg-white sm:rounded-[16px]"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4"
      style={{ borderBottom: '1px solid #F1F5F9' }}
    >
      <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
      <button
        onClick={onClose}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F5F9]"
      >
        <X size={15} className="text-[#64748B]" />
      </button>
    </div>
  )
}

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#64748B]">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-[#94A3B8]">{hint}</p> : null}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative h-6 w-10 shrink-0 rounded-full transition-colors"
      style={{ background: checked ? '#3ECF8E' : '#CBD5E1' }}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
        style={{ left: checked ? '1.25rem' : '0.125rem' }}
      />
    </button>
  )
}

type OptionKey = 'accepts_home_pickup' | 'accepts_student_vehicle' | 'provides_vehicle'

const OPTIONS: { key: OptionKey; label: string; hint: string; icon: React.ElementType }[] = [
  {
    key: 'provides_vehicle',
    label: 'Forneco meu veiculo',
    hint: 'Voce leva o veiculo para a aula',
    icon: Car,
  },
  {
    key: 'accepts_student_vehicle',
    label: 'Aceito veiculo do aluno',
    hint: 'O aluno pode usar o proprio carro ou moto',
    icon: SquareUser,
  },
]

type RangeRow = { from_km: string; to_km: string; price: string }

type FormState = {
  category: 'A' | 'B' | 'AB' | ''
  service_type: 'individual' | 'package'
  lesson_count: string
  price: string
  accepts_home_pickup: boolean
  pickup_ranges: RangeRow[]
  accepts_student_vehicle: boolean
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
    provides_vehicle: true,
    notes: '',
    is_active: true,
  }
}

function serviceToForm(service: InstructorService): FormState {
  return {
    category: (service.category ?? '') as FormState['category'],
    service_type: service.service_type,
    lesson_count: String(service.lesson_count),
    price: String(service.price),
    accepts_home_pickup: service.accepts_home_pickup,
    pickup_ranges: service.pickup_ranges.map((range) => ({
      from_km: String(range.from_km),
      to_km: String(range.to_km),
      price: String(range.price),
    })),
    accepts_student_vehicle: service.accepts_student_vehicle,
    provides_vehicle: service.provides_vehicle,
    notes: service.notes ?? '',
    is_active: service.is_active,
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
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }))
    setError(null)
  }

  const priceNum = parseFloat(form.price.replace(',', '.')) || 0
  const studentTotal = priceNum > 0 ? studentPrice(priceNum) : 0
  const lessonCount = parseInt(form.lesson_count) || 1
  const previewTitle = serviceTitle({
    service_type: form.service_type,
    category: (form.category as 'A' | 'B' | 'AB') || null,
    lesson_count: lessonCount,
  })

  async function handleSave() {
    if (!priceNum || priceNum <= 0) {
      setError('Informe um valor valido.')
      return
    }

    if (form.service_type === 'package' && lessonCount < 2) {
      setError('Pacote deve ter pelo menos 2 aulas.')
      return
    }

    const validRanges: PickupRange[] = form.pickup_ranges
      .map((range) => ({
        from_km: parseFloat(range.from_km) || 0,
        to_km: parseFloat(range.to_km) || 0,
        price: parseFloat(range.price.replace(',', '.')) || 0,
      }))
      .filter((range) => range.to_km > range.from_km && range.price > 0)

    setLoading(true)
    setError(null)

    await onSave(
      {
        category: (form.category as 'A' | 'B' | 'AB') || null,
        service_type: form.service_type,
        lesson_count: lessonCount,
        price: priceNum,
        accepts_home_pickup: form.accepts_home_pickup,
        pickup_ranges: validRanges,
        accepts_student_vehicle: form.accepts_student_vehicle,
        provides_vehicle: form.provides_vehicle,
        notes: form.notes,
        is_active: form.is_active,
      },
      service?.id
    )

    setLoading(false)
  }

  const inputClass =
    'w-full rounded-[8px] border border-[#E2E8F0] px-3 py-2 text-sm text-[#0F172A] focus:border-[#3ECF8E] focus:outline-none'

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title={service ? 'Editar servico' : 'Novo servico'} onClose={onClose} />

      <div className="space-y-4 p-4">
        <div
          className="rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5"
        >
          <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-[#94A3B8]">
            Nome gerado automaticamente
          </p>
          <p className="text-sm font-semibold text-[#0F172A]">{previewTitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria CNH">
            <select
              value={form.category}
              onChange={(event) => set('category', event.target.value as FormState['category'])}
              className={inputClass}
            >
              <option value="">Sem categoria</option>
              <option value="A">A - Moto</option>
              <option value="B">B - Carro</option>
              <option value="AB">A+B</option>
            </select>
          </Field>

          <Field label="Tipo">
            <div className="flex h-[38px] gap-2">
              {(['individual', 'package'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set('service_type', type)}
                  className="flex-1 rounded-[8px] border text-xs font-medium transition-colors"
                  style={{
                    background: form.service_type === type ? '#0F172A' : '#FFFFFF',
                    color: form.service_type === type ? '#FFFFFF' : '#64748B',
                    borderColor: form.service_type === type ? '#0F172A' : '#E2E8F0',
                  }}
                >
                  {type === 'individual' ? 'Avulsa' : 'Pacote'}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {form.service_type === 'package' ? (
          <Field label="Numero de aulas no pacote">
            <input
              type="number"
              min={2}
              value={form.lesson_count}
              onChange={(event) => set('lesson_count', event.target.value)}
              className={inputClass}
            />
          </Field>
        ) : null}

        <Field
          label={
            form.service_type === 'package'
              ? 'Valor do pacote (o que voce recebe)'
              : 'Valor da aula (o que voce recebe)'
          }
          hint={
            priceNum > 0
              ? `Valor cobrado ao aluno: ${formatBRL(studentTotal)} (plataforma: ${PLATFORM_SPLIT * 100}%)`
              : undefined
          }
        >
          <div className="flex items-center overflow-hidden rounded-[8px] border border-[#E2E8F0] focus-within:border-[#3ECF8E]">
            <span className="shrink-0 border-r border-[#E2E8F0] px-3 text-sm font-medium text-[#94A3B8]">
              R$
            </span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.price}
              onChange={(event) => set('price', event.target.value)}
              placeholder="0,00"
              className="flex-1 px-3 py-2 text-sm text-[#0F172A] focus:outline-none"
            />
          </div>
        </Field>

        <div>
          <p className="mb-2 text-xs font-medium text-[#64748B]">Condicoes oferecidas</p>
          <div className="space-y-2.5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#0F172A]">Busco o aluno em casa</p>
                  <p className="text-[11px] text-[#94A3B8]">
                    Taxa de deslocamento cobrada no checkout
                  </p>
                </div>

                <Toggle
                  checked={form.accepts_home_pickup}
                  onChange={(checked) => {
                    set('accepts_home_pickup', checked)

                    if (checked && form.pickup_ranges.length === 0) {
                      set('pickup_ranges', [{ from_km: '0', to_km: '5', price: '' }])
                    }
                  }}
                />
              </div>

              {form.accepts_home_pickup ? (
                <div className="mt-3 space-y-2 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <p className="text-[11px] font-medium text-[#64748B]">
                    Faixas de distancia e taxa adicional
                  </p>

                  {form.pickup_ranges.map((range, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={range.from_km}
                        onChange={(event) => {
                          const updated = [...form.pickup_ranges]
                          updated[index] = { ...updated[index], from_km: event.target.value }
                          set('pickup_ranges', updated)
                        }}
                        className="w-14 rounded-[6px] border border-[#E2E8F0] px-2 py-1.5 text-center text-xs text-[#0F172A] focus:border-[#3ECF8E] focus:outline-none"
                        placeholder="0"
                      />
                      <span className="shrink-0 text-xs text-[#94A3B8]">a</span>
                      <input
                        type="number"
                        min={0}
                        value={range.to_km}
                        onChange={(event) => {
                          const updated = [...form.pickup_ranges]
                          updated[index] = { ...updated[index], to_km: event.target.value }
                          set('pickup_ranges', updated)
                        }}
                        className="w-14 rounded-[6px] border border-[#E2E8F0] px-2 py-1.5 text-center text-xs text-[#0F172A] focus:border-[#3ECF8E] focus:outline-none"
                        placeholder="5"
                      />
                      <span className="shrink-0 text-xs text-[#94A3B8]">km -&gt; R$</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={range.price}
                        onChange={(event) => {
                          const updated = [...form.pickup_ranges]
                          updated[index] = { ...updated[index], price: event.target.value }
                          set('pickup_ranges', updated)
                        }}
                        className="flex-1 rounded-[6px] border border-[#E2E8F0] px-2 py-1.5 text-xs text-[#0F172A] focus:border-[#3ECF8E] focus:outline-none"
                        placeholder="0,00"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          set(
                            'pickup_ranges',
                            form.pickup_ranges.filter((_, currentIndex) => currentIndex !== index)
                          )
                        }
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[#DC2626]"
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
                      set('pickup_ranges', [
                        ...form.pickup_ranges,
                        { from_km: nextFrom, to_km: '', price: '' },
                      ])
                    }}
                    className="w-full rounded-[6px] border border-dashed border-[#CBD5E1] py-1.5 text-xs font-medium text-[#64748B]"
                  >
                    + Adicionar faixa
                  </button>
                </div>
              ) : null}
            </div>

            {OPTIONS.map(({ key, label, hint }) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#0F172A]">{label}</p>
                  <p className="text-[11px] text-[#94A3B8]">{hint}</p>
                </div>
                <Toggle checked={form[key] as boolean} onChange={(checked) => set(key, checked)} />
              </div>
            ))}
          </div>
        </div>

        <Field label="Observacoes (opcional)">
          <textarea
            value={form.notes}
            onChange={(event) => set('notes', event.target.value)}
            placeholder="Qualquer informacao extra para o aluno..."
            rows={2}
            className={inputClass}
          />
        </Field>

        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-[#0F172A]">Servico ativo</p>
            <p className="text-[11px] text-[#94A3B8]">
              Aparece para alunos ao buscar instrutores
            </p>
          </div>
          <Toggle checked={form.is_active} onChange={(checked) => set('is_active', checked)} />
        </div>

        {error ? <p className="text-xs text-red-600">{error}</p> : null}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full rounded-[9999px] py-3 text-sm font-semibold text-[#0F172A] transition-opacity"
          style={{ background: '#3ECF8E', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Salvando...' : service ? 'Salvar alteracoes' : 'Criar servico'}
        </button>
      </div>
    </ModalOverlay>
  )
}

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

  async function handleDelete() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader title="Remover servico" onClose={onClose} />
      <div className="space-y-4 p-4">
        <div className="rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] p-4">
          <p className="text-sm font-medium text-[#DC2626]">{serviceTitle(service)}</p>
          <p className="mt-1 text-xs text-[#94A3B8]">
            Esta acao nao pode ser desfeita. Agendamentos existentes nao sao afetados.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-[8px] border border-[#E2E8F0] py-2.5 text-sm font-medium text-[#64748B]"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 rounded-[9999px] py-2.5 text-sm font-semibold text-white transition-opacity"
            style={{ background: '#EF4444', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Removendo...' : 'Remover'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

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
  const categoryColor = service.category ? CATEGORY_COLOR[service.category] : null
  const activeOptions = OPTIONS.filter((option) => service[option.key as keyof InstructorService])
  const hasPickup = service.accepts_home_pickup

  async function handleToggle() {
    setToggling(true)
    await onToggleActive(!service.is_active)
    setToggling(false)
  }

  return (
    <div
      className="space-y-3 rounded-[12px] border border-[#E2E8F0] bg-white p-4 transition-opacity"
      style={{ opacity: service.is_active ? 1 : 0.55 }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
          style={{ background: service.service_type === 'package' ? '#F3E8FF' : '#F0FDF4' }}
        >
          {service.service_type === 'package' ? (
            <Package size={18} className="text-[#7C3AED]" />
          ) : (
            <BookOpen size={18} className="text-[#059669]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-[#0F172A]">{serviceTitle(service)}</p>
            {categoryColor ? (
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: categoryColor.bg, color: categoryColor.text }}
              >
                {CATEGORY_LABEL[service.category!]}
              </span>
            ) : null}
            {service.service_type === 'package' ? (
              <span
                className="shrink-0 rounded-full bg-[#F3E8FF] px-2 py-0.5 text-[10px] font-semibold text-[#6B21A8]"
              >
                {service.lesson_count} aulas
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between rounded-[8px] border border-[#F1F5F9] bg-[#F8FAFC] p-3"
      >
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#94A3B8]">
            Voce recebe
          </p>
          <p className="text-lg font-bold text-[#3ECF8E]">{formatBRL(service.price)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#94A3B8]">
            Cobrado ao aluno
          </p>
          <p className="text-base font-semibold text-[#0F172A]">
            {formatBRL(studentPrice(service.price))}
          </p>
        </div>
      </div>

      {hasPickup || activeOptions.length > 0 ? (
        <div className="space-y-1.5">
          {hasPickup ? (
            <div>
              <span
                className="inline-flex items-center gap-1 rounded-full border border-[#FDE68A] bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-medium text-[#92400E]"
              >
                Busco em casa
              </span>
              {service.pickup_ranges.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {service.pickup_ranges.map((range, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-2 py-0.5 text-[10px] text-[#92400E]"
                    >
                      {range.from_km}-{range.to_km} km · +{formatBRL(range.price)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {activeOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {activeOptions.map(({ key, label, icon: Icon }) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 rounded-full border border-[#D1FAE5] bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-medium text-[#065F46]"
                >
                  <Icon size={10} />
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {service.notes ? (
        <p className="text-xs italic text-[#94A3B8]">{service.notes}</p>
      ) : null}

      <div className="flex items-center gap-2 border-t border-[#F1F5F9] pt-1">
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="flex-1 rounded-[8px] border py-2 text-xs font-medium transition-colors"
          style={{
            borderColor: service.is_active ? '#E2E8F0' : '#D1FAE5',
            color: service.is_active ? '#64748B' : '#059669',
            background: service.is_active ? '#FFFFFF' : '#F0FDF4',
          }}
        >
          {service.is_active ? 'Desativar' : 'Ativar'}
        </button>

        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-[8px] border border-[#E2E8F0] px-3 py-2 text-xs font-medium text-[#64748B]"
        >
          <Edit2 size={12} />
          Editar
        </button>

        <button
          onClick={onDelete}
          className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#FEE2E2] text-[#DC2626]"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#F0FDF4]">
        <BookOpen size={28} className="text-[#3ECF8E]" />
      </div>
      <h2 className="mb-1 text-base font-semibold text-[#0F172A]">Nenhum servico cadastrado</h2>
      <p className="mb-6 max-w-xs text-sm text-[#64748B]">
        Cadastre os servicos que voce oferece para que alunos possam escolher ao agendar aulas.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-[9999px] bg-[#3ECF8E] px-5 py-2.5 text-sm font-semibold text-[#0F172A]"
      >
        <Plus size={16} />
        Criar primeiro servico
      </button>
    </div>
  )
}

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

  const activeCount = services.filter((service) => service.is_active).length

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <div
        className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 pb-3 pt-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-[#0F172A]">Meus Servicos</h1>
            {services.length > 0 ? (
              <p className="text-xs text-[#94A3B8]">
                {activeCount} ativo{activeCount !== 1 ? 's' : ''} · {services.length} no total
              </p>
            ) : null}
          </div>

          <button
            onClick={() => setModal({ type: 'create' })}
            className="flex shrink-0 items-center gap-2 rounded-[9999px] bg-[#3ECF8E] px-4 py-2 text-sm font-semibold text-[#0F172A]"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Novo servico</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {services.length > 0 ? (
        <div className="mx-4 mt-4 rounded-[10px] border border-[#D1FAE5] bg-[#F0FDF4] px-4 py-3 text-xs text-[#065F46]">
          O valor que voce define e o que entra na sua carteira. A plataforma adiciona{' '}
          <strong>{PLATFORM_SPLIT * 100}%</strong> ao cobrar o aluno.
        </div>
      ) : null}

      <div className="flex-1 px-4 py-4">
        {services.length === 0 ? (
          <EmptyState onCreate={() => setModal({ type: 'create' })} />
        ) : (
          <div className="max-w-2xl space-y-3">
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

      {modal?.type === 'create' || modal?.type === 'edit' ? (
        <ServiceModal
          service={modal.type === 'edit' ? modal.service : null}
          onClose={() => setModal(null)}
          onSave={handleUpsert}
        />
      ) : null}

      {modal?.type === 'delete' ? (
        <DeleteModal
          service={modal.service}
          onClose={() => setModal(null)}
          onConfirm={() => handleDelete(modal.service.id)}
        />
      ) : null}
    </div>
  )
}

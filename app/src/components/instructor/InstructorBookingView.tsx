'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  CarFront,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Layers,
  MapPin,
  MoonStar,
  Navigation,
  ParkingCircle,
  QrCode,
  Route,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react'

import type {
  PublicInstructorDetail,
  PublicInstructorAvailableSlot,
  PublicInstructorServiceOption,
  PickupRange,
} from '@/lib/instructors/detail'
import { BookingPaymentCheckout } from '@/components/booking/BookingPaymentCheckout'

type Props = {
  instructor: PublicInstructorDetail
  studentLat: number | null
  studentLon: number | null
  studentCep: string | null
}

type LessonMode = 'meeting' | 'pickup'
type PaymentMethod = 'pix' | 'card'
type Step = 1 | 2 | 3 | 4
type CheckoutPhase = 'idle' | 'active' | 'success'

type CepLookupResult = {
  cep: string
  latitude: string
  longitude: string
}

const STEPS = [
  { n: 1, label: 'Serviço' },
  { n: 2, label: 'Formato' },
  { n: 3, label: 'Agenda' },
  { n: 4, label: 'Pagamento' },
] as const

// ── helpers ──────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const r = (d: number) => (d * Math.PI) / 180
  const dLat = r(lat2 - lat1)
  const dLon = r(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function slotStartMinutes(slot: { hour: number; minute: number }) {
  return slot.hour * 60 + slot.minute
}

function countPickupTrips(
  selectedSlots: { id: string; date: string; hour: number; minute: number; slot_duration_minutes: number }[],
  allSlots: { id: string; date: string; hour: number; minute: number; slot_duration_minutes: number }[]
) {
  if (selectedSlots.length === 0) return 0

  const slotsByDate = new Map<string, typeof allSlots>()
  for (const slot of allSlots) {
    const current = slotsByDate.get(slot.date) ?? []
    current.push(slot)
    slotsByDate.set(slot.date, current)
  }

  for (const [date, slots] of slotsByDate.entries()) {
    slots.sort((left, right) => slotStartMinutes(left) - slotStartMinutes(right))
    slotsByDate.set(date, slots)
  }

  let trips = 0
  let previous: { id: string; date: string } | null = null

  for (const slot of selectedSlots) {
    if (!previous) {
      trips += 1
      previous = { id: slot.id, date: slot.date }
      continue
    }

    if (previous.date !== slot.date) {
      trips += 1
      previous = { id: slot.id, date: slot.date }
      continue
    }

    const daySlots = slotsByDate.get(slot.date) ?? []
    const previousIndex = daySlots.findIndex((entry) => entry.id === previous?.id)
    const currentIndex = daySlots.findIndex((entry) => entry.id === slot.id)
    const isAdjacent = previousIndex >= 0 && currentIndex === previousIndex + 1

    if (!isAdjacent) {
      trips += 1
    }

    previous = { id: slot.id, date: slot.date }
  }

  return trips
}

function findPickupRange(ranges: PickupRange[], km: number): PickupRange | null {
  return (
    ranges
      .slice()
      .sort((a, b) => a.from_km - b.from_km)
      .find((r) => km >= r.from_km && km < r.to_km) ?? null
  )
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    .format(new Date(`${value}T00:00:00`))
}

function fmtMonth(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`))
}

function fmtTime(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.replace(/^(\d{5})(\d)/, '$1-$2')
}

// ── small shared atoms ────────────────────────────────────────────────────────

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-0.5 text-[11px] font-medium text-[#475569]">
      {children}
    </span>
  )
}

function SectionHeading({ step, title, sub }: { step: number; title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3ECF8E]">
        Etapa {step} de 4
      </p>
      <h2 className="mt-1 text-xl font-bold text-[#0F172A]">{title}</h2>
      {sub ? <p className="mt-1 text-sm text-[#64748B]">{sub}</p> : null}
    </div>
  )
}

// ── instructor summary card (shown on all steps) ──────────────────────────────

function InstructorCard({ instructor }: { instructor: PublicInstructorDetail }) {
  const prefs = [
    instructor.accepts_highway && { label: 'Rodovias', icon: Route },
    instructor.accepts_night_driving && { label: 'Noturnos', icon: MoonStar },
    instructor.accepts_parking_practice && { label: 'Estacionamento', icon: ParkingCircle },
    instructor.student_chooses_destination && { label: 'Rota livre', icon: MapPin },
  ].filter(Boolean) as { label: string; icon: typeof Route }[]

  return (
    <div
      className="mb-6 rounded-[14px] border border-[#E2E8F0] bg-white p-4"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-[#F1F5F9]">
          {instructor.photo_url ? (
            <Image src={instructor.photo_url} alt={instructor.full_name} fill className="object-cover" sizes="64px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#94A3B8]">
              {getInitials(instructor.full_name)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[#0F172A]">{instructor.full_name}</p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#64748B]">
            <MapPin size={11} className="text-[#3ECF8E]" />
            {instructor.neighborhood} · {instructor.city}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-[#64748B]">
            <span className="flex items-center gap-1">
              <Star size={11} className="text-[#F59E0B]" fill="currentColor" />
              {instructor.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Users size={11} />
              {instructor.student_count} alunos
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} className="text-[#3ECF8E]" />
              {instructor.experience_years ?? 0}+ anos
            </span>
          </div>
          {instructor.starting_price != null && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
                A partir de
              </p>
              <p className="text-base font-bold text-[#0F172A]">
                {fmt(instructor.starting_price)}
              </p>
            </div>
          )}
        </div>
      </div>
      {prefs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {prefs.map((p) => (
            <Chip key={p.label}>
              <span className="inline-flex items-center gap-1">
                <p.icon size={10} />
                {p.label}
              </span>
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}

// ── step 1: service ───────────────────────────────────────────────────────────

function ServiceCard({
  service,
  active,
  onSelect,
}: {
  service: PublicInstructorServiceOption
  active: boolean
  onSelect: () => void
}) {
  const isPkg = service.service_type === 'package'
  const accent = isPkg ? '#F97316' : '#3ECF8E'
  const accentBg = isPkg ? 'rgba(249,115,22,0.08)' : 'rgba(62,207,142,0.08)'

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-[12px] border px-4 py-4 text-left transition-all"
      style={{
        borderColor: active ? accent : '#E2E8F0',
        background: active ? accentBg : '#FFFFFF',
        boxShadow: active ? `0 0 0 1px ${accent}` : '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isPkg
              ? <Layers size={14} className="shrink-0" style={{ color: accent }} />
              : <BookOpen size={14} className="shrink-0" style={{ color: accent }} />}
            <p className="truncate text-sm font-semibold text-[#0F172A]">{service.title}</p>
          </div>
          {service.description && (
            <p className="mt-1.5 text-xs leading-5 text-[#64748B]">{service.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {isPkg && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: 'rgba(249,115,22,0.12)', color: '#C2410C' }}
              >
                {service.lesson_count} aulas
              </span>
            )}
            {service.category && <Chip>Cat. {service.category}</Chip>}
            {service.provides_vehicle && <Chip>Veículo do instrutor</Chip>}
            {service.accepts_student_vehicle && <Chip>Veículo do aluno</Chip>}
            {service.accepts_home_pickup && <Chip>Busca em casa</Chip>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-bold text-[#0F172A]">{fmt(service.price)}</p>
          <p className="text-[11px] text-[#94A3B8]">
            {isPkg ? `pacote · ${service.lesson_count} aulas` : 'por aula'}
          </p>
          {isPkg && service.lesson_count > 1 && (
            <p className="text-[11px] text-[#94A3B8]">
              ≈ {fmt(service.price / service.lesson_count)}/aula
            </p>
          )}
        </div>
      </div>
      {active && (
        <div
          className="mt-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{ background: accentBg, color: accent }}
        >
          <Check size={11} />
          {isPkg
            ? `Selecione ${service.lesson_count} horários na etapa de agenda`
            : 'Selecione um ou mais horários na etapa de agenda'}
        </div>
      )}
    </button>
  )
}

function StepService({
  instructor,
  selectedId,
  onSelect,
}: {
  instructor: PublicInstructorDetail
  selectedId: string
  onSelect: (id: string) => void
}) {
  const individual = instructor.services.filter((s) => s.service_type === 'individual')
  const packages = instructor.services.filter((s) => s.service_type === 'package')

  return (
    <div>
      <SectionHeading step={1} title="Escolha o serviço" sub="Selecione uma opção — pacote ou aula avulsa. Cada escolha gera uma ordem de compra separada." />

      {individual.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">Aulas avulsas</p>
          <div className="flex flex-col gap-3">
            {individual.map((s) => (
              <ServiceCard key={s.id} service={s} active={s.id === selectedId} onSelect={() => onSelect(s.id)} />
            ))}
          </div>
        </div>
      )}

      {packages.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">Pacotes</p>
          <div className="flex flex-col gap-3">
            {packages.map((s) => (
              <ServiceCard key={s.id} service={s} active={s.id === selectedId} onSelect={() => onSelect(s.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── step 2: format ────────────────────────────────────────────────────────────

function PickupPanel({
  distanceKm,
  ranges,
  matched,
  hasStudent,
  hasInstructor,
  cep,
  onCepChange,
  cepStatus,
  isCepPending,
}: {
  distanceKm: number | null
  ranges: PickupRange[]
  matched: PickupRange | null
  hasStudent: boolean
  hasInstructor: boolean
  cep: string
  onCepChange: (value: string) => void
  cepStatus: string
  isCepPending: boolean
}) {
  if (!hasInstructor) {
    return (
      <div className="mt-4 flex items-start gap-2 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-xs leading-5 text-amber-700">
          Localização do instrutor indisponível. Confirme diretamente com ele.
        </p>
      </div>
    )
  }

  if (!hasStudent) {
    return (
      <div
        className="mt-4 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] px-4 py-4"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        <div className="flex items-start gap-2">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900">Informe seu CEP para calcular a distância</p>
            <p className="mt-1 text-xs leading-5 text-amber-700">
              Seu perfil ainda não tem localização suficiente para validar a busca em casa. Digite o CEP e vamos calcular automaticamente.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="pickup-cep" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-amber-900">
            CEP do aluno
          </label>
          <input
            id="pickup-cep"
            type="text"
            inputMode="numeric"
            value={cep}
            onChange={(event) => onCepChange(formatCep(event.target.value))}
            placeholder="00000-000"
            className="min-h-11 w-full rounded-[10px] border border-[#FCD34D] bg-white px-3 text-sm text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#F59E0B]"
          />
          <p className="mt-2 text-xs text-amber-700">
            {isCepPending
              ? 'Buscando localização pelo CEP...'
              : cepStatus || 'Informe um CEP válido para verificar se está no raio de atendimento.'}
          </p>
        </div>
      </div>
    )
  }

  const maxKm = ranges.length > 0 ? Math.max(...ranges.map((r) => r.to_km)) : Infinity
  const outOfRange = distanceKm !== null && distanceKm >= maxKm && ranges.length > 0

  return (
    <div className="mt-4 space-y-3">
      {/* Distance badge */}
      <div
        className="flex items-center gap-2 rounded-[12px] border border-[#E2E8F0] bg-white px-4 py-3"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <Navigation size={15} className="shrink-0 text-[#3ECF8E]" />
        <span className="text-sm text-[#475569]">
          Você está a{' '}
          <span className="font-semibold text-[#0F172A]">
            {distanceKm !== null ? `${distanceKm.toFixed(1)} km` : '—'}
          </span>{' '}
          do instrutor
        </span>
      </div>

      {ranges.length === 0 ? (
        <p className="text-xs text-[#94A3B8]">O instrutor ainda não configurou faixas de preço para busca em casa. Combine diretamente com ele.</p>
      ) : (
        <>
          {/* Range table */}
          <div className="overflow-hidden rounded-[12px] border border-[#E2E8F0]">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 bg-[#F8FAFC] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
              <span>Faixa</span>
              <span className="text-right">Taxa/aula</span>
              <span className="w-5" />
            </div>
            {ranges
              .slice()
              .sort((a, b) => a.from_km - b.from_km)
              .map((r) => {
                const current = matched?.from_km === r.from_km && matched?.to_km === r.to_km
                return (
                  <div
                    key={`${r.from_km}-${r.to_km}`}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-t border-[#E2E8F0] px-3 py-2.5"
                    style={{ background: current ? 'rgba(62,207,142,0.06)' : 'white' }}
                  >
                    <span className="text-xs" style={{ color: current ? '#065F46' : '#475569' }}>
                      {r.from_km} – {r.to_km} km
                    </span>
                    <span className="text-right text-xs font-semibold" style={{ color: current ? '#065F46' : '#64748B' }}>
                      +{fmt(r.price)}
                    </span>
                    <span className="flex w-5 items-center justify-center">
                      {current && <Check size={13} className="text-[#3ECF8E]" />}
                    </span>
                  </div>
                )
              })}
          </div>

          {outOfRange ? (
            <div className="flex items-start gap-2 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
              <p className="text-xs leading-5 text-red-700">
                Você está fora da área de busca deste instrutor ({distanceKm!.toFixed(1)} km). Escolha &quot;Presencial&quot; ou entre em contato.
              </p>
            </div>
          ) : matched ? (
            <div className="flex items-start gap-2 rounded-[12px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3">
              <CarFront size={14} className="mt-0.5 shrink-0 text-[#16A34A]" />
              <div>
                <p className="text-xs font-semibold text-[#15803D]">
                  +{fmt(matched.price)} por deslocamento
                </p>
                <p className="mt-0.5 text-[11px] text-[#166534]">
                  Horários seguidos no mesmo dia contam como um único deslocamento. Dias diferentes ou horários com intervalo geram nova taxa.
                </p>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function StepFormat({
  service,
  lessonMode,
  onMode,
  distanceKm,
  isPkg,
  matchedRange,
  pickupRanges,
  studentLat,
  studentLon,
  pickupCep,
  onPickupCepChange,
  pickupCepStatus,
  isPickupCepPending,
  instructor,
  isOutOfRange,
}: {
  service: PublicInstructorServiceOption
  lessonMode: LessonMode
  onMode: (m: LessonMode) => void
  distanceKm: number | null
  isPkg: boolean
  matchedRange: PickupRange | null
  pickupRanges: PickupRange[]
  studentLat: number | null
  studentLon: number | null
  pickupCep: string
  onPickupCepChange: (value: string) => void
  pickupCepStatus: string
  isPickupCepPending: boolean
  instructor: PublicInstructorDetail
  isOutOfRange: boolean
}) {
  return (
    <div>
      <SectionHeading step={2} title="Formato da aula" />

      {/* Selected service summary */}
      <div
        className="mb-5 flex items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-white px-4 py-3"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-2">
          {isPkg
            ? <Layers size={14} className="text-[#F97316]" />
            : <BookOpen size={14} className="text-[#3ECF8E]" />}
          <span className="text-sm font-medium text-[#0F172A]">{service.title}</span>
        </div>
        <span className="text-sm font-bold text-[#0F172A]">{fmt(service.price)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onMode('meeting')}
          className="rounded-[12px] border px-4 py-5 text-left transition-all"
          style={{
            borderColor: lessonMode === 'meeting' ? '#3ECF8E' : '#E2E8F0',
            background: lessonMode === 'meeting' ? 'rgba(62,207,142,0.08)' : '#FFFFFF',
            boxShadow: lessonMode === 'meeting' ? '0 0 0 1px #3ECF8E' : '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <MapPin size={16} style={{ color: lessonMode === 'meeting' ? '#3ECF8E' : '#94A3B8' }} />
            <span className="text-sm font-semibold text-[#0F172A]">Presencial</span>
          </div>
          <p className="text-xs text-[#64748B]">No ponto combinado com o instrutor.</p>
          {lessonMode === 'meeting' && (
            <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#3ECF8E]">
              <Check size={11} /> Selecionado
            </div>
          )}
        </button>

        <button
          type="button"
          disabled={!service.accepts_home_pickup}
          onClick={() => onMode('pickup')}
          className="rounded-[12px] border px-4 py-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            borderColor: lessonMode === 'pickup' ? '#F97316' : '#E2E8F0',
            background: lessonMode === 'pickup' ? 'rgba(249,115,22,0.08)' : '#FFFFFF',
            boxShadow: lessonMode === 'pickup' ? '0 0 0 1px #F97316' : '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <CarFront size={16} style={{ color: lessonMode === 'pickup' ? '#F97316' : '#94A3B8' }} />
            <span className="text-sm font-semibold text-[#0F172A]">Busca em casa</span>
          </div>
          <p className="text-xs text-[#64748B]">
            {service.accepts_home_pickup ? 'Disponível para este serviço.' : 'Não disponível neste serviço.'}
          </p>
          {lessonMode === 'pickup' && (
            <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#F97316]">
              <Check size={11} /> Selecionado
            </div>
          )}
        </button>
      </div>

      {lessonMode === 'pickup' && service.accepts_home_pickup && (
        <PickupPanel
          distanceKm={distanceKm}
          ranges={pickupRanges}
          matched={matchedRange}
          hasStudent={studentLat != null && studentLon != null}
          hasInstructor={instructor.latitude != null && instructor.longitude != null}
          cep={pickupCep}
          onCepChange={onPickupCepChange}
          cepStatus={pickupCepStatus}
          isCepPending={isPickupCepPending}
        />
      )}
    </div>
  )
}

// ── step 3: agenda ────────────────────────────────────────────────────────────

function StepAgenda({
  service,
  isPkg,
  groupedDates,
  selectedDate,
  onDate,
  slotsForDate,
  selectedSlotIds,
  onToggleSlot,
  packageSlotLimit,
  isRefreshing,
  refreshError,
}: {
  service: PublicInstructorServiceOption
  isPkg: boolean
  groupedDates: { date: string; slots: { id: string; hour: number; minute: number; slot_duration_minutes: number }[] }[]
  selectedDate: string
  onDate: (d: string) => void
  slotsForDate: { id: string; hour: number; minute: number; slot_duration_minutes: number }[]
  selectedSlotIds: string[]
  onToggleSlot: (id: string) => void
  packageSlotLimit: number | null
  isRefreshing: boolean
  refreshError: string | null
}) {
  const count = selectedSlotIds.length
  const progress = packageSlotLimit !== null ? `${count} de ${packageSlotLimit}` : null

  return (
    <div>
      <SectionHeading
        step={3}
        title="Escolha os horários"
        sub={
          isPkg
            ? `Selecione exatamente ${service.lesson_count} horários para o pacote.`
            : 'Selecione um ou mais horários disponíveis.'
        }
        />

        <div className="mb-4 flex items-center justify-between gap-3 rounded-[12px] border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#64748B]">
          <span>{isRefreshing ? 'Atualizando horários livres…' : 'Mostrando apenas horários livres no momento.'}</span>
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3ECF8E]">
            Ao vivo
          </span>
        </div>

        {refreshError && (
          <div className="mb-4 flex items-start gap-2 rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-sm text-amber-800">{refreshError}</p>
          </div>
        )}

        {/* Date scroll */}
      {groupedDates.length > 0 ? (
        <>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">Data</p>
            {groupedDates[0] && (
              <p className="text-[11px] text-[#94A3B8]">{fmtMonth(groupedDates[0].date)}</p>
            )}
          </div>
          <div className="mb-5 flex gap-2.5 overflow-x-auto pb-1">
            {groupedDates.map((entry) => {
              const active = entry.date === selectedDate
              const sel = selectedSlotIds.filter((id) => entry.slots.some((s) => s.id === id)).length
              return (
                <button
                  key={entry.date}
                  type="button"
                  onClick={() => onDate(entry.date)}
                  className="min-w-[76px] rounded-[12px] border px-3 py-3 text-center transition-all"
                  style={{
                    borderColor: active ? '#3ECF8E' : '#E2E8F0',
                    background: active ? '#3ECF8E' : '#FFFFFF',
                    boxShadow: active ? '0 0 0 1px #3ECF8E' : '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  <p className="text-[10px] font-semibold uppercase" style={{ color: active ? '#052E16' : '#94A3B8' }}>
                    {fmtDate(entry.date).split(',')[0]}
                  </p>
                  <p className="mt-1 text-xl font-bold" style={{ color: active ? '#052E16' : '#0F172A' }}>
                    {entry.date.slice(8, 10)}
                  </p>
                  <p className="mt-0.5 text-[10px]" style={{ color: active ? '#065F46' : '#94A3B8' }}>
                    {sel > 0 ? `${sel}/${entry.slots.length}` : `${entry.slots.length} vagas`}
                  </p>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="mb-5 rounded-[12px] border border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-4 py-8 text-center text-sm text-[#94A3B8]">
          Este instrutor ainda não publicou horários disponíveis.
        </div>
      )}

      {/* Slot grid */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock3 size={14} className="text-[#F97316]" />
          <p className="text-sm font-semibold text-[#0F172A]">Horários disponíveis</p>
        </div>
        {progress && (
          <div
            className="rounded-full px-3 py-1 text-[11px] font-bold"
            style={{
              background: count === (service.lesson_count) ? '#D1FAE5' : '#FEF3C7',
              color: count === (service.lesson_count) ? '#065F46' : '#92400E',
            }}
          >
            {progress}
          </div>
        )}
      </div>

      {slotsForDate.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          {slotsForDate.map((slot) => {
            const active = selectedSlotIds.includes(slot.id)
            const atLimit = packageSlotLimit !== null && count >= packageSlotLimit && !active
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => onToggleSlot(slot.id)}
                disabled={atLimit}
                className="rounded-[12px] border px-3 py-3 text-center transition-all disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  borderColor: active ? '#F97316' : '#E2E8F0',
                  background: active ? 'rgba(249,115,22,0.08)' : '#FFFFFF',
                  boxShadow: active ? '0 0 0 1px #F97316' : '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <p className="text-sm font-semibold text-[#0F172A]">{fmtTime(slot.hour, slot.minute)}</p>
                <p className="mt-1 text-[11px]" style={{ color: active ? '#C2410C' : '#94A3B8' }}>
                  {active ? 'Selecionado' : `${slot.slot_duration_minutes} min`}
                </p>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-4 py-6 text-center text-sm text-[#94A3B8]">
          Selecione uma data para ver os horários.
        </div>
      )}
    </div>
  )
}

// ── step 4: payment ───────────────────────────────────────────────────────────

function StepPayment({
  paymentMethod,
  onMethod,
  service,
  isPkg,
  selectedSlotCount,
  lessonMode,
  pickupSurchargePerLesson,
  pickupTripCount,
  baseAmount,
  totalAmount,
  matchedRange,
}: {
  paymentMethod: PaymentMethod
  onMethod: (m: PaymentMethod) => void
  service: PublicInstructorServiceOption
  isPkg: boolean
  selectedSlotCount: number
  lessonMode: LessonMode
  pickupSurchargePerLesson: number
  pickupTripCount: number
  baseAmount: number
  totalAmount: number
  matchedRange: PickupRange | null
}) {
  const pickupTotal = pickupSurchargePerLesson * pickupTripCount

  const METHODS = [
    { id: 'pix' as const, title: 'PIX', description: 'Pagamento instantâneo. Escaneie o QR code aqui mesmo.', icon: QrCode },
    { id: 'card' as const, title: 'Cartão de crédito', description: 'Pague diretamente com cartão, sem sair da plataforma.', icon: CreditCard },
  ]

  return (
    <div>
      <SectionHeading step={4} title="Forma de pagamento" />

      {/* Price summary */}
      <div
        className="mb-5 overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div className="space-y-2.5 px-4 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#64748B]">
              {isPkg
                ? `Pacote (${service.lesson_count} aulas)`
                : `${selectedSlotCount} aula${selectedSlotCount > 1 ? 's' : ''} × ${fmt(service.price)}`}
            </span>
            <span className="font-semibold text-[#0F172A]">{fmt(baseAmount)}</span>
          </div>
          {lessonMode === 'pickup' && matchedRange && pickupSurchargePerLesson > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#64748B]">
                Busca em casa ({pickupTripCount} deslocamento{pickupTripCount > 1 ? 's' : ''} × {fmt(pickupSurchargePerLesson)})
              </span>
              <span className="font-semibold text-[#F97316]">+{fmt(pickupTotal)}</span>
            </div>
          )}
        </div>
        <div className="mx-4 mt-3 border-t border-[#E2E8F0]" />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-semibold text-[#0F172A]">Total</span>
          <span className="text-xl font-bold text-[#0F172A]">{fmt(totalAmount)}</span>
        </div>
      </div>

      {/* Payment methods */}
      <div className="flex flex-col gap-3">
        {METHODS.map((m) => {
          const active = paymentMethod === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onMethod(m.id)}
              className="rounded-[12px] border px-4 py-4 text-left transition-all"
              style={{
                borderColor: active ? '#3ECF8E' : '#E2E8F0',
                background: active ? 'rgba(62,207,142,0.06)' : '#FFFFFF',
                boxShadow: active ? '0 0 0 1px #3ECF8E' : '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[8px]"
                  style={{ background: active ? 'rgba(62,207,142,0.15)' : '#F1F5F9' }}
                >
                  <m.icon size={18} style={{ color: active ? '#3ECF8E' : '#64748B' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#0F172A]">{m.title}</p>
                  <p className="text-xs text-[#64748B]">{m.description}</p>
                </div>
                {active && <Check size={16} className="shrink-0 text-[#3ECF8E]" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const done = s.n < current
        const active = s.n === current
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all"
                style={{
                  background: done ? '#3ECF8E' : active ? '#0F172A' : '#F1F5F9',
                  color: done ? '#052E16' : active ? '#FFFFFF' : '#94A3B8',
                  border: active ? '2px solid #3ECF8E' : 'none',
                }}
              >
                {done ? <Check size={13} /> : s.n}
              </div>
              <p
                className="mt-1 text-[10px] font-medium"
                style={{ color: active ? '#0F172A' : done ? '#3ECF8E' : '#94A3B8' }}
              >
                {s.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="mb-4 h-px w-8 transition-all"
                style={{ background: done ? '#3ECF8E' : '#E2E8F0' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export function InstructorBookingView({ instructor, studentLat, studentLon, studentCep }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [selectedServiceId, setSelectedServiceId] = useState(instructor.services[0]?.id ?? '')
  const [lessonMode, setLessonMode] = useState<LessonMode>('meeting')
  const [selectedDate, setSelectedDate] = useState(instructor.available_slots[0]?.date ?? '')
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([])
  const [availableSlots, setAvailableSlots] = useState<PublicInstructorAvailableSlot[]>(instructor.available_slots)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [pickupCep, setPickupCep] = useState(studentCep ? formatCep(studentCep) : '')
  const [pickupCepStatus, setPickupCepStatus] = useState('')
  const [manualStudentLat, setManualStudentLat] = useState<number | null>(null)
  const [manualStudentLon, setManualStudentLon] = useState<number | null>(null)
  const [isPickupCepPending, startPickupCepTransition] = useTransition()
  const [isRefreshingSlots, setIsRefreshingSlots] = useState(false)
  const [slotRefreshError, setSlotRefreshError] = useState<string | null>(null)
  const [checkoutPhase, setCheckoutPhase] = useState<CheckoutPhase>('idle')
  const [successBookingGroupId, setSuccessBookingGroupId] = useState<string | null>(null)
  const [successWhatsAppUrl, setSuccessWhatsAppUrl] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const selectedService = instructor.services.find((s) => s.id === selectedServiceId) ?? null
  const isPkg = selectedService?.service_type === 'package'
  const packageSlotLimit = isPkg ? (selectedService?.lesson_count ?? 1) : null
  const pickupRanges = selectedService?.pickup_ranges ?? []

  async function refreshAvailableSlots({ silent = false }: { silent?: boolean } = {}) {
    if (!silent) {
      setIsRefreshingSlots(true)
    }

    try {
      const response = await fetch(`/api/instructors/${instructor.id}/available-slots`, {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Não foi possível atualizar os horários disponíveis.')
      }

      const result = (await response.json()) as { slots?: PublicInstructorAvailableSlot[] }
      const nextSlots = Array.isArray(result.slots) ? result.slots : []
      setAvailableSlots(nextSlots)
      setSlotRefreshError(null)
      return nextSlots
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível atualizar os horários disponíveis.'
      setSlotRefreshError(message)
      return null
    } finally {
      if (!silent) {
        setIsRefreshingSlots(false)
      }
    }
  }

  const resolvedStudentLat = studentLat ?? manualStudentLat
  const resolvedStudentLon = studentLon ?? manualStudentLon

  const distanceKm = useMemo<number | null>(() => {
    if (
      resolvedStudentLat == null ||
      resolvedStudentLon == null ||
      instructor.latitude == null ||
      instructor.longitude == null
    ) {
      return null
    }

    return haversineKm(resolvedStudentLat, resolvedStudentLon, instructor.latitude, instructor.longitude)
  }, [resolvedStudentLat, resolvedStudentLon, instructor.latitude, instructor.longitude])

  const matchedPickupRange = useMemo<PickupRange | null>(() => {
    if (lessonMode !== 'pickup' || distanceKm === null) return null
    return findPickupRange(pickupRanges, distanceKm)
  }, [lessonMode, distanceKm, pickupRanges])

  const isPickupOutOfRange =
    lessonMode === 'pickup' &&
    distanceKm !== null &&
    pickupRanges.length > 0 &&
    distanceKm >= Math.max(...pickupRanges.map((r) => r.to_km))

  const groupedDates = useMemo(() => {
    const map = new Map<string, typeof availableSlots>()
    for (const s of availableSlots) {
      const cur = map.get(s.date) ?? []
      cur.push(s)
      map.set(s.date, cur)
    }
    return Array.from(map.entries()).map(([date, slots]) => ({ date, slots }))
  }, [availableSlots])

  const slotsForDate = groupedDates.find((e) => e.date === selectedDate)?.slots ?? []

  const selectedSlots = useMemo(() => {
    const ids = new Set(selectedSlotIds)
    return availableSlots
      .filter((s) => ids.has(s.id))
      .sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date)
        }

        return slotStartMinutes(a) - slotStartMinutes(b)
      })
  }, [availableSlots, selectedSlotIds])

  const selectedSlotCount = selectedSlots.length
  const pickupTripCount =
    selectedSlotCount > 0 ? countPickupTrips(selectedSlots, availableSlots) : 0
  const previewPickupTripCount = selectedSlotCount > 0 ? pickupTripCount : lessonMode === 'pickup' ? 1 : 0

  const baseAmount = useMemo(() => {
    if (!selectedService || selectedSlotCount === 0) return 0
    const raw = isPkg ? selectedService.price : selectedService.price * selectedSlotCount
    return Math.round(raw * 100) / 100
  }, [selectedService, selectedSlotCount, isPkg])

  const previewBaseAmount = useMemo(() => {
    if (!selectedService) return 0
    const raw = isPkg ? selectedService.price : selectedService.price * Math.max(selectedSlotCount, 1)
    return Math.round(raw * 100) / 100
  }, [selectedService, selectedSlotCount, isPkg])

  const pickupSurchargePerLesson = Math.round((matchedPickupRange?.price ?? 0) * 100) / 100
  const pickupSurchargeTotal = lessonMode === 'pickup' ? Math.round(pickupSurchargePerLesson * pickupTripCount * 100) / 100 : 0
  const totalAmount = Math.round((baseAmount + pickupSurchargeTotal) * 100) / 100
  const previewPickupSurchargeTotal =
    lessonMode === 'pickup' ? Math.round(pickupSurchargePerLesson * previewPickupTripCount * 100) / 100 : 0
  const previewTotalAmount = Math.round((previewBaseAmount + previewPickupSurchargeTotal) * 100) / 100

  useEffect(() => {
    if (!selectedService?.accepts_home_pickup && lessonMode === 'pickup') setLessonMode('meeting')
  }, [lessonMode, selectedService])

  useEffect(() => {
    if (!selectedDate && groupedDates[0]) { setSelectedDate(groupedDates[0].date); return }
    if (!groupedDates.some((e) => e.date === selectedDate)) setSelectedDate(groupedDates[0]?.date ?? '')
  }, [groupedDates, selectedDate])

  useEffect(() => {
    const ids = new Set(availableSlots.map((s) => s.id))
    setSelectedSlotIds((cur) => cur.filter((id) => ids.has(id)))
  }, [availableSlots])

  useEffect(() => { setSelectedSlotIds([]) }, [selectedServiceId])

  useEffect(() => {
    if (step < 3 || checkoutPhase === 'success') return

    void refreshAvailableSlots()

    const interval = window.setInterval(() => {
      void refreshAvailableSlots({ silent: true })
    }, 15000)

    return () => window.clearInterval(interval)
  }, [step, checkoutPhase, instructor.id])

  useEffect(() => {
    if (studentLat != null && studentLon != null) {
      return
    }

    const digits = pickupCep.replace(/\D/g, '')
    if (digits.length !== 8) {
      setManualStudentLat(null)
      setManualStudentLon(null)
      if (pickupCep.length === 0) {
        setPickupCepStatus('')
      } else {
        setPickupCepStatus('Informe um CEP válido para calcular a distância.')
      }
      return
    }

    startPickupCepTransition(async () => {
      setPickupCepStatus('Buscando localização...')

      try {
        const response = await fetch(`/api/nominatim/cep?cep=${digits}`)
        if (!response.ok) {
          setManualStudentLat(null)
          setManualStudentLon(null)
          setPickupCepStatus('Não foi possível localizar esse CEP.')
          return
        }

        const result: CepLookupResult = await response.json()
        const nextLat = Number(result.latitude)
        const nextLon = Number(result.longitude)

        if (!Number.isFinite(nextLat) || !Number.isFinite(nextLon)) {
          setManualStudentLat(null)
          setManualStudentLon(null)
          setPickupCepStatus('O CEP não retornou coordenadas válidas.')
          return
        }

        setManualStudentLat(nextLat)
        setManualStudentLon(nextLon)
        setPickupCep(formatCep(result.cep || digits))
        setPickupCepStatus('Localização encontrada. Distância calculada automaticamente.')
      } catch {
        setManualStudentLat(null)
        setManualStudentLon(null)
        setPickupCepStatus('Erro ao consultar o CEP.')
      }
    })
  }, [pickupCep, startPickupCepTransition, studentLat, studentLon])

  function toggleSlot(slotId: string) {
    setSelectedSlotIds((cur) => {
      if (cur.includes(slotId)) return cur.filter((id) => id !== slotId)
      if (packageSlotLimit !== null && cur.length >= packageSlotLimit) return cur
      return [...cur, slotId]
    })
  }

  const hasPickupCoordinates =
    resolvedStudentLat != null &&
    resolvedStudentLon != null &&
    instructor.latitude != null &&
    instructor.longitude != null

  // per-step next validity
  const canNext: Record<Step, boolean> = {
    1: Boolean(selectedServiceId),
    2: lessonMode !== 'pickup' || (hasPickupCoordinates && !isPickupOutOfRange),
    3: selectedSlotCount > 0 && (!isPkg || selectedSlotCount === (selectedService?.lesson_count ?? 0)),
    4: true,
  }

  function handleNext() {
    if (step < 4) setStep((s) => (s + 1) as Step)
  }

  function handleBack() {
    if (checkoutPhase === 'active') {
      setCheckoutPhase('idle')
      setCheckoutError(null)
      return
    }
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  async function handleStartCheckout() {
    setCheckoutError(null)

    const nextSlots = await refreshAvailableSlots()
    if (!nextSlots) return

    const nextSlotIds = new Set(nextSlots.map((slot) => slot.id))
    const hasUnavailableSelection = selectedSlotIds.some((id) => !nextSlotIds.has(id))
    if (hasUnavailableSelection) {
      setCheckoutError('Alguns horários deixaram de estar livres. Revise sua seleção antes de pagar.')
      return
    }

    setCheckoutPhase('active')
  }

  function handleCheckoutSuccess(bookingGroupId: string) {
    setSuccessBookingGroupId(bookingGroupId)
    setCheckoutPhase('success')

    void (async () => {
      try {
        const response = await fetch(`/api/payments/booking/status?booking_group_id=${bookingGroupId}`, {
          cache: 'no-store',
        })
        if (!response.ok) return

        const result = (await response.json()) as { status?: string; whatsappUrl?: string | null }
        if (result.status === 'paid' && result.whatsappUrl) {
          setSuccessWhatsAppUrl(result.whatsappUrl)
        }
      } catch {
        // keep success screen as fallback
      }
    })()
  }

  function handleCheckoutError(message: string) {
    setCheckoutError(message)
    setCheckoutPhase('idle')
  }

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white px-4 py-3"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href="/buscar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:border-[#3ECF8E]"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1 overflow-x-auto">
            <StepIndicator current={step} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-lg px-4 py-6 pb-32">
        <InstructorCard instructor={instructor} />

        {step === 1 && (
          <StepService
            instructor={instructor}
            selectedId={selectedServiceId}
            onSelect={setSelectedServiceId}
          />
        )}

        {step === 2 && selectedService && (
          <StepFormat
            service={selectedService}
            lessonMode={lessonMode}
            onMode={setLessonMode}
            distanceKm={distanceKm}
            isPkg={isPkg}
            matchedRange={matchedPickupRange}
            pickupRanges={pickupRanges}
            studentLat={resolvedStudentLat}
            studentLon={resolvedStudentLon}
            pickupCep={pickupCep}
            onPickupCepChange={setPickupCep}
            pickupCepStatus={pickupCepStatus}
            isPickupCepPending={isPickupCepPending}
            instructor={instructor}
            isOutOfRange={isPickupOutOfRange}
          />
        )}

        {step === 3 && selectedService && (
          <StepAgenda
            service={selectedService}
            isPkg={isPkg}
            groupedDates={groupedDates}
            selectedDate={selectedDate}
            onDate={setSelectedDate}
            slotsForDate={slotsForDate}
            selectedSlotIds={selectedSlotIds}
            onToggleSlot={toggleSlot}
            packageSlotLimit={packageSlotLimit}
            isRefreshing={isRefreshingSlots}
            refreshError={slotRefreshError}
          />
        )}

        {step === 4 && selectedService && checkoutPhase === 'success' && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D1FAE5]">
              <CalendarCheck size={32} className="text-[#16A34A]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#0F172A]">Pagamento confirmado!</p>
              <p className="mt-1 text-sm text-[#64748B]">
                Seus horários foram reservados. O instrutor receberá a confirmação.
              </p>
            </div>
            <div className="mt-2 flex w-full max-w-sm flex-col gap-3">
              {successWhatsAppUrl ? (
                <a
                  href={successWhatsAppUrl}
                  className="inline-flex items-center justify-center rounded-[9999px] bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Conversar com instrutor
                </a>
              ) : null}
              <Link
                href="/aluno"
                className="inline-flex items-center justify-center rounded-[9999px] bg-[#3ECF8E] px-6 py-3 text-sm font-semibold text-[#052E16] transition-opacity hover:opacity-90"
              >
                Minhas aulas
              </Link>
            </div>
          </div>
        )}

        {step === 4 && selectedService && checkoutPhase === 'active' && (
          <div>
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3ECF8E]">
                Etapa 4 de 4
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#0F172A]">Pagamento</h2>
            </div>
            <BookingPaymentCheckout
              paymentMethod={paymentMethod}
              bookingPayload={{
                instructor_id: instructor.id,
                service_id: selectedServiceId,
                slot_ids: selectedSlotIds,
                lesson_mode: lessonMode,
                total_amount: totalAmount,
              }}
              onSuccess={handleCheckoutSuccess}
              onError={handleCheckoutError}
              onBack={() => { setCheckoutPhase('idle'); setCheckoutError(null) }}
            />
          </div>
        )}

        {step === 4 && selectedService && checkoutPhase === 'idle' && (
          <>
            {checkoutError && (
              <div className="mb-4 flex items-start gap-2 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0 text-red-500" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-sm text-red-700">{checkoutError}</p>
              </div>
            )}
            <StepPayment
              paymentMethod={paymentMethod}
              onMethod={setPaymentMethod}
              service={selectedService}
              isPkg={isPkg}
              selectedSlotCount={selectedSlotCount}
              lessonMode={lessonMode}
              pickupSurchargePerLesson={pickupSurchargePerLesson}
              pickupTripCount={pickupTripCount}
              baseAmount={baseAmount}
              totalAmount={totalAmount}
              matchedRange={matchedPickupRange}
            />
          </>
        )}
      </div>

      {/* Bottom navigation bar — hidden during active checkout (card form has its own submit) */}
      {checkoutPhase !== 'active' && checkoutPhase !== 'success' && (
        <div
          className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E2E8F0] bg-white px-4 pb-5 pt-3"
          style={{ boxShadow: '0 -1px 8px rgba(0,0,0,0.06)' }}
        >
          <div className="mx-auto flex max-w-lg items-center gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:border-[#3ECF8E]"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div className="w-12 shrink-0" />
            )}

            <div className="min-w-0 flex-1">
              {selectedService && (
                <>
                  <p className="truncate text-xs text-[#64748B]">{selectedService.title}</p>
                  <p className="text-sm font-bold text-[#0F172A]">
                    {step === 4
                      ? fmt(totalAmount)
                      : step >= 3 && selectedSlotCount > 0
                        ? `${fmt(totalAmount)}${pickupSurchargeTotal > 0 ? ` (incl. busca)` : ''}`
                        : `${fmt(previewTotalAmount)}${previewPickupSurchargeTotal > 0 ? ` (incl. busca)` : ''}`}
                  </p>
                </>
              )}
            </div>

            <button
              type="button"
              disabled={!canNext[step]}
              onClick={step < 4 ? handleNext : handleStartCheckout}
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-[12px] px-6 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: step === 4 ? '#F97316' : '#3ECF8E', color: '#052E16' }}
            >
              {step === 4 ? 'Ir para pagamento' : 'Próximo'}
              {step < 4 && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

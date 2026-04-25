'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  History,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  Smartphone,
  UserRound,
  X,
  XCircle,
} from 'lucide-react'

import type { StudentBooking } from '@/lib/students/home'

type Tab = 'futuras' | 'historico'

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

function formatDatetime(isoStr: string | null) {
  if (!isoStr) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoStr))
}

function getLessonTypeLabel(booking: StudentBooking) {
  if (booking.service_type === 'package') {
    const index = booking.package_lesson_index ?? 1
    const total = booking.package_total_lessons ?? 1
    return `Pacote (${index}/${total} aula${total > 1 ? 's' : ''})`
  }

  return 'Aula avulsa'
}

function getWhatsAppHref(phone: string | null | undefined) {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (digits.length < 10) return null

  const normalized = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${normalized}`
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
  pending:   { label: 'Aguardando', color: '#92400E', bg: '#FEF3C7', icon: Clock },
  confirmed: { label: 'Confirmada', color: '#065F46', bg: '#D1FAE5', icon: CalendarCheck },
  completed: { label: 'Concluída',  color: '#1E40AF', bg: '#DBEAFE', icon: CheckCircle2 },
  cancelled: { label: 'Cancelada',  color: '#991B1B', bg: '#FEE2E2', icon: XCircle },
} as const

function BookingDetailModal({
  booking,
  onClose,
}: {
  booking: StudentBooking
  onClose: () => void
}) {
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending
  const StatusIcon = cfg.icon

  const PaymentIcon = booking.payment_method === 'pix' ? Smartphone : CreditCard
  const paymentLabel =
    booking.payment_method === 'pix'
      ? 'PIX'
      : booking.payment_method === 'card'
        ? 'Cartão de crédito'
        : '—'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-[20px] bg-white p-5 sm:rounded-[16px]"
        style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold" style={{ color: '#0F172A' }}>
            Detalhes do agendamento
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#F1F5F9]"
            aria-label="Fechar"
          >
            <X size={16} style={{ color: '#64748B' }} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between rounded-[10px] bg-[#F8FAFC] px-3 py-2.5">
            <span className="text-xs font-medium" style={{ color: '#64748B' }}>Status</span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              <StatusIcon size={11} />
              {cfg.label}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-[10px] bg-[#F8FAFC] px-3 py-2.5">
            <span className="text-xs font-medium" style={{ color: '#64748B' }}>Aula</span>
            <span className="text-xs font-semibold" style={{ color: '#0F172A' }}>
              {formatDate(booking.slot_date)} · {formatTime(booking.slot_hour, booking.slot_minute)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-[10px] bg-[#F8FAFC] px-3 py-2.5">
            <span className="text-xs font-medium" style={{ color: '#64748B' }}>Tipo</span>
            <span className="text-xs font-semibold" style={{ color: '#0F172A' }}>
              {getLessonTypeLabel(booking)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-[10px] bg-[#F8FAFC] px-3 py-2.5">
            <span className="text-xs font-medium" style={{ color: '#64748B' }}>Data da compra</span>
            <span className="text-xs font-semibold" style={{ color: '#0F172A' }}>
              {formatDatetime(booking.created_at)}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-[10px] bg-[#F8FAFC] px-3 py-2.5">
            <span className="text-xs font-medium" style={{ color: '#64748B' }}>Pagamento</span>
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: '#0F172A' }}
            >
              <PaymentIcon size={13} style={{ color: '#3ECF8E' }} />
              {paymentLabel}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-[10px] bg-[#F8FAFC] px-3 py-2.5">
            <span className="text-xs font-medium" style={{ color: '#64748B' }}>Valor</span>
            <span className="text-sm font-bold" style={{ color: '#0F172A' }}>
              {formatCurrency(booking.value)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingChip({
  booking,
  onPress,
}: {
  booking: StudentBooking
  onPress: () => void
}) {
  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending
  const Icon = cfg.icon
  const whatsappHref = getWhatsAppHref(booking.instructor_phone)

  return (
    <button
      type="button"
      onClick={onPress}
      className="flex w-full items-center gap-3 rounded-[12px] border border-[#E2E8F0] bg-white p-3 text-left transition-colors hover:border-[#3ECF8E]"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-[#F1F5F9]">
        {booking.instructor_photo ? (
          <Image
            src={booking.instructor_photo}
            alt={booking.instructor_name}
            fill
            className="object-cover"
            sizes="44px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#94A3B8]">
            {getInitials(booking.instructor_name)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#0F172A]">{booking.instructor_name}</p>
        <p className="mt-0.5 text-xs text-[#64748B]">
          {formatDate(booking.slot_date)} · {formatTime(booking.slot_hour, booking.slot_minute)}
          {booking.lesson_mode === 'pickup' ? ' · Busca em casa' : ''}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Falar com ${booking.instructor_name} no WhatsApp`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-[1.03]"
              style={{ background: '#DCFCE7', color: '#16A34A' }}
            >
              <MessageCircle size={15} />
            </a>
          )}
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <Icon size={10} />
            {cfg.label}
          </span>
        </div>
        <span className="text-xs font-medium text-[#64748B]">{formatCurrency(booking.value)}</span>
      </div>
    </button>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[12px] border border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-4 py-10 text-center">
      {tab === 'futuras' ? (
        <CalendarClock size={32} className="text-[#3ECF8E]" style={{ opacity: 0.5 }} />
      ) : (
        <History size={32} className="text-[#94A3B8]" />
      )}
      <p className="text-sm font-medium text-[#64748B]">
        {tab === 'futuras' ? 'Nenhuma aula agendada' : 'Nenhuma aula no histórico'}
      </p>
      {tab === 'futuras' && (
        <Link
          href="/buscar"
          className="mt-1 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white"
          style={{ background: '#3ECF8E', color: '#06230F' }}
        >
          <Search size={12} />
          Buscar instrutor
        </Link>
      )}
    </div>
  )
}

type Props = {
  name: string
  photoUrl: string | null
  bookings: StudentBooking[]
}

export function StudentHome({ name, photoUrl, bookings }: Props) {
  const [tab, setTab] = useState<Tab>('futuras')
  const [selectedBooking, setSelectedBooking] = useState<StudentBooking | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const upcoming = bookings.filter(
    (b) => (b.status === 'pending' || b.status === 'confirmed') && b.slot_date >= today
  )
  const history = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled' || b.slot_date < today
  )

  const shown = tab === 'futuras' ? upcoming : history
  const firstName = name.split(' ')[0] ?? name

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

  function navigateTo(href: string) {
    if (href === pathname) return
    setPendingHref(href)
    router.push(href)
  }

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}

      <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">

        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: '#64748B' }}>{saudacao},</p>
            <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>{firstName}</h1>
          </div>

          <div
            className="relative h-11 w-11 overflow-hidden rounded-full border-2"
            style={{ borderColor: '#3ECF8E', background: '#F1F5F9' }}
          >
            {photoUrl ? (
              <Image src={photoUrl} alt={name} fill className="object-cover" sizes="44px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold" style={{ color: '#64748B' }}>
                {getInitials(name)}
              </div>
            )}
          </div>
        </header>

        {/* Search CTA */}
        <Link
          href="/buscar"
          className="mb-5 flex items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-white px-5 py-4 transition-colors hover:border-[#3ECF8E]"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[8px]"
              style={{ background: 'rgba(62,207,142,0.12)' }}
            >
              <Search size={18} style={{ color: '#3ECF8E' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#0F172A' }}>Buscar instrutor</p>
              <p className="text-xs" style={{ color: '#64748B' }}>Encontre o instrutor ideal perto de você</p>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: '#CBD5E1' }} />
        </Link>

        {/* KPI row */}
        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { value: upcoming.length, label: 'Agendadas' },
            { value: bookings.filter((b) => b.status === 'completed').length, label: 'Concluídas' },
            { value: new Set(bookings.map((b) => b.instructor_name)).size, label: 'Instrutores' },
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
              { key: 'futuras', label: 'Aulas futuras', icon: CalendarClock, count: upcoming.length },
              { key: 'historico', label: 'Histórico', icon: History, count: 0 },
            ] as const
          ).map((t) => {
            const active = tab === t.key
            const Icon = t.icon
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
                <Icon size={15} />
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

        {/* Booking list */}
        <div className="flex flex-col gap-2">
          {shown.length > 0
            ? shown.map((booking) => (
                <BookingChip
                  key={booking.id}
                  booking={booking}
                  onPress={() => setSelectedBooking(booking)}
                />
              ))
            : <EmptyState tab={tab} />}
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5 text-xs" style={{ color: '#CBD5E1' }}>
          <MapPin size={11} />
          <span>Fortaleza e Região Metropolitana</span>
        </div>
      </div>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center"
        style={{
          background: '#1c1c1c',
          borderTop: '1px solid #333333',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {[
          { href: '/aluno', icon: CalendarClock, label: 'Minhas aulas' },
          { href: '/buscar', icon: Search, label: 'Buscar' },
          { href: '/aluno/perfil', icon: UserRound, label: 'Perfil' },
        ].map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pendingHref === href
          const isPending = pendingHref === href && pathname !== href
          return (
            <button
              key={href}
              type="button"
              onClick={() => navigateTo(href)}
              disabled={Boolean(pendingHref && pendingHref !== href && pendingHref !== pathname)}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 transition-all disabled:opacity-100"
              style={{
                color: isActive ? '#3ECF8E' : '#a1a1aa',
                background: isPending ? 'rgba(62,207,142,0.08)' : 'transparent',
                transform: isPending ? 'translateY(-1px)' : 'translateY(0)',
              }}
            >
              {isPending ? <Loader2 size={22} className="animate-spin" /> : <Icon size={22} />}
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

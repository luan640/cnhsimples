'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Bell, ChevronRight, CircleHelp, IdCard, LockKeyhole, LogOut, MapPin, ShieldCheck, UserRound } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import type { InstructorFullProfile } from '@/lib/instructors/perfil'

type InstructorProfileViewProps = {
  profile: InstructorFullProfile
  email: string
}

function formatCurrency(value: number | null) {
  if (value === null || Number.isNaN(value)) return 'Nao informado'

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatPhone(value: string | null) {
  if (!value) return '-'

  const digits = value.replace(/\D/g, '')

  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  }

  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  }

  return value
}

function categoryLabel(category: InstructorFullProfile['category']) {
  if (category === 'A') return 'Categoria A'
  if (category === 'B') return 'Categoria B'
  if (category === 'AB') return 'Categoria A/B'

  return 'Nao configurada'
}

function pixLabel(type: string | null) {
  if (!type) return 'Nao informada'

  const normalized = type.toLowerCase()

  if (normalized === 'cpf') return 'CPF'
  if (normalized === 'email') return 'E-mail'
  if (normalized === 'phone') return 'Telefone'
  if (normalized === 'random') return 'Chave aleatoria'

  return type
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="px-1">
      <p className="text-sm font-semibold tracking-[0.01em] text-[#111827]">{title}</p>
    </div>
  )
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      {children}
    </section>
  )
}

function RowLink({
  href,
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  danger = false,
}: {
  href: string
  icon: React.ComponentType<{ size?: number }>
  iconBg: string
  iconColor: string
  title: string
  description: string
  danger?: boolean
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-[#F8FAFC]"
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
        style={{ background: iconBg, color: iconColor }}
      >
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${danger ? 'text-[#DC2626]' : 'text-[#0F172A]'}`}>
          {title}
        </p>
        <p className="mt-1 text-xs leading-5 text-[#94A3B8]">{description}</p>
      </div>

      <div className={`${danger ? 'text-[#FCA5A5]' : 'text-[#CBD5E1]'}`}>
        <ChevronRight size={18} />
      </div>
    </Link>
  )
}

export function InstructorProfileView({ profile, email }: InstructorProfileViewProps) {
  const router = useRouter()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const avatarFallback = getInitials(profile.full_name || 'Instrutor')
  const experienceLabel = profile.experience_years
    ? `${profile.experience_years} anos de experiencia`
    : 'Experiencia nao informada'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-[#F3F4F6] px-4 py-5 pb-24 lg:px-8 lg:pb-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-5 text-center">
          <p className="text-[15px] font-bold tracking-[0.22em] text-[#111827]">PROFILE SETTING</p>
        </div>

        <div className="space-y-5">
          <SettingsCard>
            <div className="flex items-center gap-4 px-4 py-4 sm:px-5">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#DBEAFE] text-lg font-bold text-[#1D4ED8]">
                {profile.photo_url ? (
                  <Image
                    src={profile.photo_url}
                    alt={profile.full_name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <span>{avatarFallback}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-[#111827]">{profile.full_name}</p>
                <p className="mt-1 truncate text-sm text-[#9CA3AF]">{email || 'E-mail nao informado'}</p>
                <p className="mt-1 text-xs font-medium text-[#6B7280]">{experienceLabel}</p>
              </div>
            </div>
          </SettingsCard>

          <div className="space-y-3">
            <SectionTitle title="General" />
            <SettingsCard>
              <RowLink
                href="/perfil/instrutor/editar"
                icon={UserRound}
                iconBg="#DBEAFE"
                iconColor="#2563EB"
                title="Edit Profile"
                description="Avatar, bio, experiencia e resumo profissional."
              />
              <div className="mx-4 h-px bg-[#EEF2F7]" />
              <RowLink
                href="/perfil/instrutor/senha"
                icon={LockKeyhole}
                iconBg="#DBEAFE"
                iconColor="#2563EB"
                title="Change Password"
                description="Atualize a seguranca da sua conta."
              />
              <div className="mx-4 h-px bg-[#EEF2F7]" />
              <RowLink
                href="/perfil/instrutor/documentos"
                icon={ShieldCheck}
                iconBg="#DBEAFE"
                iconColor="#2563EB"
                title="Dados Cadastrais"
                description="CPF, CNH, credencial e datas de validade."
              />
              <div className="mx-4 h-px bg-[#EEF2F7]" />
              <RowLink
                href="/perfil/instrutor/localizacao"
                icon={MapPin}
                iconBg="#DBEAFE"
                iconColor="#2563EB"
                title="Localizacao"
                description="Endereco, raio de atendimento, telefone e e-mail."
              />
            </SettingsCard>
          </div>

          <div className="space-y-3">
            <SectionTitle title="Preferences" />
            <SettingsCard>
              <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
                  style={{ background: '#DBEAFE', color: '#2563EB' }}
                >
                  <Bell size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#111827]">Notification</p>
                  <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
                    Receber atualizacoes importantes da conta.
                  </p>
                </div>

                <button
                  type="button"
                  aria-pressed={notificationsEnabled}
                  onClick={() => setNotificationsEnabled((value) => !value)}
                  className="relative h-7 w-12 rounded-full transition-colors"
                  style={{ background: notificationsEnabled ? '#2563EB' : '#CBD5E1' }}
                >
                  <span
                    className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all"
                    style={{ left: notificationsEnabled ? '1.5rem' : '0.25rem' }}
                  />
                </button>
              </div>

              <div className="mx-4 h-px bg-[#EEF2F7]" />

              <div className="flex w-full items-center gap-3 px-4 py-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
                  style={{ background: '#DBEAFE', color: '#2563EB' }}
                >
                  <CircleHelp size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#111827]">FAQ</p>
                  <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
                    Informacoes rapidas sobre configuracoes, pagamentos e perfil.
                  </p>
                </div>
              </div>

              <div className="mx-4 h-px bg-[#EEF2F7]" />

              <button
                type="button"
                onClick={() => {
                  void handleLogout()
                }}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-[#F8FAFC]"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px]"
                  style={{ background: '#FEE2E2', color: '#DC2626' }}
                >
                  <LogOut size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#DC2626]">Log Out</p>
                  <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
                    Encerrar a sessao atual neste dispositivo.
                  </p>
                </div>
                <div className="text-[#FCA5A5]">
                  <ChevronRight size={18} />
                </div>
              </button>
            </SettingsCard>
          </div>

          <div className="rounded-[24px] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#EFF6FF] text-[#2563EB]">
                <IdCard size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111827]">Resumo atual</p>
                <div className="mt-2 grid gap-2 text-xs leading-5 text-[#94A3B8] sm:grid-cols-2">
                  <p>Categoria: <span className="font-medium text-[#111827]">{categoryLabel(profile.category)}</span></p>
                  <p>Valor por aula: <span className="font-medium text-[#111827]">{formatCurrency(profile.hourly_rate)}</span></p>
                  <p>Telefone: <span className="font-medium text-[#111827]">{formatPhone(profile.phone)}</span></p>
                  <p>E-mail: <span className="font-medium text-[#111827]">{email || '-'}</span></p>
                  <p className="sm:col-span-2">
                    Chave PIX: <span className="font-medium text-[#111827]">{profile.pix_key ? `${pixLabel(profile.pix_key_type)} • ${profile.pix_key}` : 'Nao informada'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

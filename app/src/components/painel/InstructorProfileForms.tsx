'use client'

import { useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

import type { InstructorFullProfile } from '@/lib/instructors/perfil'
import {
  updateInstructorDocumentsAction,
  updateInstructorGeneralAction,
  updateInstructorLocationAction,
} from '@/app/perfil/instrutor/actions'
import { createClient } from '@/lib/supabase/client'

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ''
  if (digits.length <= 7) return digits.replace(/^(\d{2})(\d+)/, '($1) $2')
  if (digits.length <= 10) return digits.replace(/^(\d{2})(\d{4})(\d+)/, '($1) $2-$3')
  return digits.replace(/^(\d{2})(\d{5})(\d+)/, '($1) $2-$3')
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.replace(/^(\d{5})(\d)/, '$1-$2')
}

function Shell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-[#F3F4F6] px-4 py-5 pb-24 lg:px-8 lg:pb-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/perfil/instrutor"
            className="inline-flex h-11 items-center gap-2 rounded-[999px] bg-white px-4 text-sm font-semibold text-[#111827] shadow-[0_8px_24px_rgba(15,23,42,0.06)]"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <p className="text-[15px] font-bold tracking-[0.22em] text-[#111827]">PROFILE SETTING</p>
        </div>

        <section className="rounded-[28px] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <h1 className="text-lg font-semibold text-[#111827]">{title}</h1>
          <p className="mt-1 text-sm leading-6 text-[#94A3B8]">{description}</p>
        </section>

        <section className="rounded-[28px] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          {children}
        </section>
      </div>
    </main>
  )
}

function SubmitRow({
  pending,
  success,
  error,
}: {
  pending: boolean
  success: string
  error: string
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        {error ? (
          <div className="rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-[14px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1D4ED8]">
            {success}
          </div>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[999px] bg-[#2563EB] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save size={16} />
        {pending ? 'Salvando...' : 'Salvar alteracoes'}
      </button>
    </div>
  )
}

export function EditProfileForm({ profile }: { profile: InstructorFullProfile }) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [experienceYears, setExperienceYears] = useState(
    profile.experience_years !== null ? String(profile.experience_years) : ''
  )
  const [photo, setPhoto] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, startTransition] = useTransition()
  const avatarFallback = getInitials(profile.full_name || 'Instrutor')
  const previewUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo])

  return (
    <Shell
      title="Edit Profile"
      description="Atualize avatar, bio, experiencia e resumo profissional."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setError('')
          setSuccess('')

          const formData = new FormData()
          formData.set('fullName', fullName)
          formData.set('bio', bio)
          formData.set('experienceYears', experienceYears)
          if (photo) formData.set('photo', photo)

          startTransition(async () => {
            const result = await updateInstructorGeneralAction(formData)
            if (!result.ok) {
              setError(result.error ?? 'Falha ao atualizar perfil.')
              return
            }
            setSuccess('Perfil atualizado com sucesso.')
          })
        }}
        className="space-y-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#DBEAFE] text-lg font-bold text-[#1D4ED8]">
            {previewUrl ? (
              <Image src={previewUrl} alt="Preview do avatar" fill sizes="80px" className="object-cover" />
            ) : profile.photo_url ? (
              <Image src={profile.photo_url} alt={profile.full_name} fill sizes="80px" className="object-cover" />
            ) : (
              <span>{avatarFallback}</span>
            )}
          </div>

          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[999px] border border-[#D1D5DB] px-4 text-sm font-semibold text-[#111827]">
            Alterar avatar
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="grid gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Nome completo</label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Anos de experiencia</label>
            <input
              type="number"
              min={0}
              value={experienceYears}
              onChange={(event) => setExperienceYears(event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Bio</label>
            <textarea
              rows={5}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>
        </div>

        <SubmitRow pending={pending} success={success} error={error} />
      </form>
    </Shell>
  )
}

export function EditDocumentsForm({ profile }: { profile: InstructorFullProfile }) {
  const [cpf, setCpf] = useState(profile.cpf ?? '')
  const [birthDate, setBirthDate] = useState(profile.birth_date ?? '')
  const [cnhNumber, setCnhNumber] = useState(profile.cnh_number ?? '')
  const [cnhExpiresAt, setCnhExpiresAt] = useState(profile.cnh_expires_at ?? '')
  const [detranCredentialNumber, setDetranCredentialNumber] = useState(
    profile.detran_credential_number ?? ''
  )
  const [detranCredentialExpiresAt, setDetranCredentialExpiresAt] = useState(
    profile.detran_credential_expires_at ?? ''
  )
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, startTransition] = useTransition()

  return (
    <Shell
      title="Dados Cadastrais"
      description="Edite CPF, CNH, credencial e datas de validade."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setError('')
          setSuccess('')

          const formData = new FormData()
          formData.set('cpf', cpf)
          formData.set('birthDate', birthDate)
          formData.set('cnhNumber', cnhNumber)
          formData.set('cnhExpiresAt', cnhExpiresAt)
          formData.set('detranCredentialNumber', detranCredentialNumber)
          formData.set('detranCredentialExpiresAt', detranCredentialExpiresAt)

          startTransition(async () => {
            const result = await updateInstructorDocumentsAction(formData)
            if (!result.ok) {
              setError(result.error ?? 'Falha ao atualizar dados cadastrais.')
              return
            }
            setSuccess('Dados cadastrais atualizados com sucesso.')
          })
        }}
        className="space-y-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">CPF</label>
            <input
              value={cpf}
              onChange={(event) => setCpf(formatCpf(event.target.value))}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Data de nascimento</label>
            <input
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Numero da CNH</label>
            <input
              value={cnhNumber}
              onChange={(event) => setCnhNumber(event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Validade da CNH</label>
            <input
              type="date"
              value={cnhExpiresAt}
              onChange={(event) => setCnhExpiresAt(event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Credencial DETRAN</label>
            <input
              value={detranCredentialNumber}
              onChange={(event) => setDetranCredentialNumber(event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Validade da credencial</label>
            <input
              type="date"
              value={detranCredentialExpiresAt}
              onChange={(event) => setDetranCredentialExpiresAt(event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>
        </div>

        <SubmitRow pending={pending} success={success} error={error} />
      </form>
    </Shell>
  )
}

export function EditLocationForm({
  profile,
  email,
}: {
  profile: InstructorFullProfile
  email: string
}) {
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [cep, setCep] = useState(profile.cep ?? '')
  const [street, setStreet] = useState(profile.street ?? '')
  const [number, setNumber] = useState(profile.number ?? '')
  const [neighborhood, setNeighborhood] = useState(profile.neighborhood ?? '')
  const [city, setCity] = useState(profile.city ?? '')
  const [state, setState] = useState(profile.state ?? '')
  const [latitude, setLatitude] = useState(profile.latitude !== null ? String(profile.latitude) : '')
  const [longitude, setLongitude] = useState(profile.longitude !== null ? String(profile.longitude) : '')
  const [serviceRadiusKm, setServiceRadiusKm] = useState(
    profile.service_radius_km !== null ? String(profile.service_radius_km) : ''
  )
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, startTransition] = useTransition()

  return (
    <Shell
      title="Localizacao"
      description="Edite endereco, raio de atendimento, telefone e veja o e-mail da conta."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setError('')
          setSuccess('')

          const formData = new FormData()
          formData.set('phone', phone)
          formData.set('cep', cep)
          formData.set('street', street)
          formData.set('number', number)
          formData.set('neighborhood', neighborhood)
          formData.set('city', city)
          formData.set('state', state)
          formData.set('latitude', latitude)
          formData.set('longitude', longitude)
          formData.set('serviceRadiusKm', serviceRadiusKm)

          startTransition(async () => {
            const result = await updateInstructorLocationAction(formData)
            if (!result.ok) {
              setError(result.error ?? 'Falha ao atualizar localizacao.')
              return
            }
            setSuccess('Localizacao atualizada com sucesso.')
          })
        }}
        className="space-y-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-[#111827]">E-mail</label>
            <input
              value={email}
              readOnly
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F3F4F6] px-4 text-base text-[#6B7280] outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Telefone</label>
            <input
              value={phone}
              onChange={(event) => setPhone(formatPhone(event.target.value))}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">CEP</label>
            <input
              value={cep}
              onChange={(event) => setCep(formatCep(event.target.value))}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-[#111827]">Logradouro</label>
            <input
              value={street}
              onChange={(event) => setStreet(event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Numero</label>
            <input
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Bairro</label>
            <input
              value={neighborhood}
              onChange={(event) => setNeighborhood(event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Cidade</label>
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Estado</label>
            <input
              value={state}
              onChange={(event) => setState(event.target.value.toUpperCase())}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Latitude</label>
            <input
              value={latitude}
              onChange={(event) => setLatitude(event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#111827]">Longitude</label>
            <input
              value={longitude}
              onChange={(event) => setLongitude(event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-[#111827]">Raio de atendimento (km)</label>
            <input
              type="number"
              min={1}
              step="0.1"
              value={serviceRadiusKm}
              onChange={(event) => setServiceRadiusKm(event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
            />
          </div>
        </div>

        <SubmitRow pending={pending} success={success} error={error} />
      </form>
    </Shell>
  )
}

export function ChangePasswordStandaloneForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  return (
    <Shell
      title="Change Password"
      description="Atualize a seguranca da sua conta em uma tela dedicada."
    >
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault()
          setError('')
          setSuccess('')

          if (password.length < 8) {
            setError('A nova senha precisa ter pelo menos 8 caracteres.')
            return
          }

          if (password !== confirmPassword) {
            setError('A confirmacao da senha nao confere.')
            return
          }

          setIsSubmitting(true)
          try {
            const supabase = createClient()
            const { error: updateError } = await supabase.auth.updateUser({ password })

            if (updateError) {
              setError(updateError.message)
              return
            }

            setSuccess('Senha atualizada com sucesso.')
            setPassword('')
            setConfirmPassword('')
          } finally {
            setIsSubmitting(false)
          }
        }}
      >
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#111827]">Nova senha</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#111827]">Confirmar nova senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="min-h-12 w-full rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-base text-[#111827] outline-none focus:border-[#60A5FA]"
          />
        </div>

        <SubmitRow pending={isSubmitting} success={success} error={error} />
      </form>
    </Shell>
  )
}

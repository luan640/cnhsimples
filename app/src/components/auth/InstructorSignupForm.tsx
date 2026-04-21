'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  FileBadge2,
  MapPin,
  ShieldCheck,
  Upload,
  UserRound,
} from 'lucide-react'

import type { CepLookupResult, PixKeyType } from '@/types'

type Step = 1 | 2 | 3 | 4

type FormState = {
  fullName: string
  email: string
  password: string
  birthDate: string
  cpf: string
  phone: string
  bio: string
  experienceYears: string
  cnhNumber: string
  cnhExpiresAt: string
  detranCredentialNumber: string
  detranCredentialExpiresAt: string
  pixKeyType: PixKeyType
  pixKey: string
  cep: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  latitude: string
  longitude: string
  serviceRadiusKm: string
}

const INITIAL_FORM: FormState = {
  fullName: '',
  email: '',
  password: '',
  birthDate: '',
  cpf: '',
  phone: '',
  bio: '',
  experienceYears: '',
  cnhNumber: '',
  cnhExpiresAt: '',
  detranCredentialNumber: '',
  detranCredentialExpiresAt: '',
  pixKeyType: 'cpf',
  pixKey: '',
  cep: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: 'CE',
  latitude: '',
  longitude: '',
  serviceRadiusKm: '5',
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

function fileLabel(file: File | null, fallback: string) {
  return file ? file.name : fallback
}

export function InstructorSignupForm() {
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [photo, setPhoto] = useState<File | null>(null)
  const [cnhDocument, setCnhDocument] = useState<File | null>(null)
  const [credentialDocument, setCredentialDocument] = useState<File | null>(null)
  const [cepStatus, setCepStatus] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCepPending, startCepTransition] = useTransition()

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function goNext() {
    setSubmitError('')
    setStep((current) => Math.min(current + 1, 4) as Step)
  }

  function goBack() {
    setSubmitError('')
    setStep((current) => Math.max(current - 1, 1) as Step)
  }

  async function handleSubmit() {
    if (!stepFourComplete || !photo || !cnhDocument || !credentialDocument) {
      return
    }

    setSubmitError('')
    setSubmitSuccess('')
    setIsSubmitting(true)

    try {
      const body = new FormData()
      body.append(
        'payload',
        JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          birthDate: form.birthDate,
          cpf: form.cpf,
          phone: form.phone,
          bio: form.bio.trim(),
          experienceYears: form.experienceYears ? Number(form.experienceYears) : null,
          hourlyRate: null,
          category: null,
          cnhNumber: form.cnhNumber.trim(),
          cnhExpiresAt: form.cnhExpiresAt,
          detranCredentialNumber: form.detranCredentialNumber.trim(),
          detranCredentialExpiresAt: form.detranCredentialExpiresAt,
          pixKeyType: form.pixKeyType,
          pixKey: form.pixKey.trim() || null,
          cep: form.cep,
          street: form.street.trim(),
          number: form.number.trim(),
          neighborhood: form.neighborhood.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
          serviceRadiusKm: Number(form.serviceRadiusKm),
        })
      )
      body.append('photo', photo)
      body.append('cnhDocument', cnhDocument)
      body.append('credentialDocument', credentialDocument)

      const response = await fetch('/api/auth/signup/instructor', {
        method: 'POST',
        body,
      })

      const result = await response.json()

      if (!response.ok) {
        setSubmitError(result.error ?? 'Nao foi possivel enviar o cadastro do instrutor.')
        setIsSubmitting(false)
        return
      }

      setSubmitSuccess(
        'Cadastro enviado com sucesso. Confirme seu e-mail e aguarde a analise dos documentos pelo administrador.'
      )
    } catch {
      setSubmitError('Erro inesperado ao enviar o cadastro.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const digits = form.cep.replace(/\D/g, '')

    if (digits.length !== 8) {
      return
    }

    startCepTransition(async () => {
      setCepStatus('Buscando localizacao...')

      try {
        const response = await fetch(`/api/nominatim/cep?cep=${digits}`)

        if (!response.ok) {
          setCepStatus('Nao foi possivel localizar esse CEP.')
          return
        }

        const result: CepLookupResult = await response.json()

        setForm((current) => ({
          ...current,
          street: result.street || current.street,
          neighborhood: result.neighborhood || current.neighborhood,
          city: result.city || current.city,
          state: result.state || current.state || 'CE',
          latitude: result.latitude || current.latitude,
          longitude: result.longitude || current.longitude,
        }))

        setCepStatus('Endereco preenchido automaticamente.')
      } catch {
        setCepStatus('Erro ao consultar o CEP.')
      }
    })
  }, [form.cep])

  const stepOneComplete =
    Boolean(form.fullName.trim()) &&
    Boolean(form.email.trim()) &&
    form.password.length >= 8 &&
    Boolean(form.birthDate) &&
    form.cpf.replace(/\D/g, '').length === 11 &&
    form.phone.replace(/\D/g, '').length >= 10 &&
    Boolean(photo)

  const stepTwoComplete =
    Boolean(form.cnhNumber.trim()) &&
    Boolean(form.cnhExpiresAt) &&
    Boolean(form.detranCredentialNumber.trim()) &&
    Boolean(form.detranCredentialExpiresAt)

  const stepThreeComplete =
    form.cep.replace(/\D/g, '').length === 8 &&
    Boolean(form.street.trim()) &&
    Boolean(form.number.trim()) &&
    Boolean(form.neighborhood.trim()) &&
    Boolean(form.city.trim()) &&
    Boolean(form.state.trim()) &&
    Boolean(form.serviceRadiusKm) &&
    Number(form.serviceRadiusKm) > 0

  const stepFourComplete = Boolean(cnhDocument) && Boolean(credentialDocument)

  if (submitSuccess && !submitError) {
    return (
      <div
        className="w-full max-w-2xl rounded-[20px] border border-[#E2E8F0] bg-white p-6 md:p-8"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#D1FAE5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#065F46]">
          <Check size={14} />
          Cadastro enviado
        </div>

        <h1 className="text-[28px] font-bold leading-tight text-[#0F172A]">
          Agora sua conta entra em analise
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#64748B]">{submitSuccess}</p>

        <div className="mt-4 rounded-[12px] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1D4ED8]">
          <span className="font-semibold">Informacao:</span> Confirme o seu cadastro no e-mail enviado.
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login/instrutor"
            className="inline-flex min-h-11 items-center justify-center rounded-[8px] px-4 text-sm font-semibold text-[#0F172A]"
            style={{ background: '#3ECF8E' }}
          >
            Ir para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full max-w-4xl rounded-[20px] border border-[#E2E8F0] bg-white p-6 md:p-8"
      style={{ boxShadow: 'var(--shadow-modal)' }}
    >
      <div className="mb-8 flex flex-col gap-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
          <ShieldCheck size={14} />
          Cadastro do instrutor
        </div>

        <div className="space-y-2">
          <h1 className="text-[30px] font-bold leading-tight text-[#0F172A]">
            Cadastre seu perfil profissional
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-[#64748B]">
            Fluxo em 4 etapas conforme a documentacao: conta, dados profissionais,
            localizacao e documentos para analise manual do administrador.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {[
            { id: 1, label: 'Conta', icon: UserRound },
            { id: 2, label: 'Profissional', icon: BriefcaseBusiness },
            { id: 3, label: 'Localizacao', icon: MapPin },
            { id: 4, label: 'Documentos', icon: FileBadge2 },
          ].map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-center gap-2 rounded-[14px] bg-[#F8FAFC] p-2 text-center md:flex-row md:justify-start md:gap-3 md:p-3 md:text-left"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: step >= item.id ? '#3ECF8E' : '#E2E8F0',
                  color: '#0F172A',
                }}
              >
                {step > item.id ? <Check size={16} /> : <item.icon size={16} />}
              </span>
              <span className="text-[11px] font-medium leading-4 text-[#0F172A] md:text-sm md:leading-5">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {submitError && (
        <div className="mb-6 rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {submitError}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-[#0F172A]">Foto de perfil</label>
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 text-center">
                <Upload size={18} className="mb-2 text-[#64748B]" />
                <span className="text-sm font-medium text-[#0F172A]">
                  {fileLabel(photo, 'Selecionar foto do perfil')}
                </span>
                <span className="mt-1 text-xs text-[#64748B]">JPG ou PNG</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-[#0F172A]">Nome completo</label>
              <input
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="Seu nome completo"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="seu@email.com"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Senha</label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="Minimo de 8 caracteres"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Data de nascimento</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(event) => updateField('birthDate', event.target.value)}
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">CPF</label>
              <input
                inputMode="numeric"
                value={form.cpf}
                onChange={(event) => updateField('cpf', formatCpf(event.target.value))}
                placeholder="000.000.000-00"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-[#0F172A]">Telefone / WhatsApp</label>
              <input
                inputMode="tel"
                value={form.phone}
                onChange={(event) => updateField('phone', formatPhone(event.target.value))}
                placeholder="(85) 9XXXX-XXXX"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>
          </section>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Numero da CNH</label>
              <input
                value={form.cnhNumber}
                onChange={(event) => updateField('cnhNumber', event.target.value)}
                placeholder="Numero da sua CNH"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Validade da CNH</label>
              <input
                type="date"
                value={form.cnhExpiresAt}
                onChange={(event) => updateField('cnhExpiresAt', event.target.value)}
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Registro DETRAN</label>
              <input
                value={form.detranCredentialNumber}
                onChange={(event) => updateField('detranCredentialNumber', event.target.value)}
                placeholder="Numero da credencial"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Validade da credencial DETRAN</label>
              <input
                type="date"
                value={form.detranCredentialExpiresAt}
                onChange={(event) => updateField('detranCredentialExpiresAt', event.target.value)}
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Anos de experiencia</label>
              <input
                inputMode="numeric"
                value={form.experienceYears}
                onChange={(event) => updateField('experienceYears', event.target.value)}
                placeholder="Opcional"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Tipo de chave PIX</label>
              <select
                value={form.pixKeyType}
                onChange={(event) => updateField('pixKeyType', event.target.value as PixKeyType)}
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              >
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
                <option value="phone">Telefone</option>
                <option value="random">Chave aleatoria</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-[#0F172A]">Chave PIX</label>
              <input
                value={form.pixKey}
                onChange={(event) => updateField('pixKey', event.target.value)}
                placeholder="Opcional no cadastro inicial"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-[#0F172A]">Biografia / apresentacao</label>
              <textarea
                rows={4}
                value={form.bio}
                onChange={(event) => updateField('bio', event.target.value)}
                placeholder="Conte sua experiencia, abordagem e especialidades."
                className="w-full rounded-[8px] border border-[#E2E8F0] px-3 py-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="rounded-[14px] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#64748B] md:col-span-2">
              Categoria de ensino e valor por aula serao configurados posteriormente, apos a
              liberacao inicial do cadastro.
            </div>
          </section>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">CEP</label>
              <input
                inputMode="numeric"
                value={form.cep}
                onChange={(event) => updateField('cep', formatCep(event.target.value))}
                placeholder="00000-000"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="rounded-[14px] bg-[#F8FAFC] p-4">
              <div className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
                <MapPin size={16} className="text-[#3ECF8E]" />
                Localizacao calculada
              </div>
              <div className="text-sm text-[#64748B]">
                <div>Latitude: {form.latitude || '-'}</div>
                <div>Longitude: {form.longitude || '-'}</div>
                <div className="mt-2">
                  {isCepPending ? 'Buscando CEP...' : cepStatus || 'Informe um CEP valido.'}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-[#0F172A]">Logradouro</label>
              <input
                value={form.street}
                onChange={(event) => updateField('street', event.target.value)}
                placeholder="Preenchido via CEP"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Numero</label>
              <input
                value={form.number}
                onChange={(event) => updateField('number', event.target.value)}
                placeholder="Numero do endereco"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Bairro</label>
              <input
                value={form.neighborhood}
                onChange={(event) => updateField('neighborhood', event.target.value)}
                placeholder="Preenchido via CEP"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Cidade</label>
              <input
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
                placeholder="Fortaleza"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Estado</label>
              <input
                value={form.state}
                onChange={(event) => updateField('state', event.target.value)}
                placeholder="CE"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-[#0F172A]">Raio de atendimento (km)</label>
              <input
                inputMode="numeric"
                value={form.serviceRadiusKm}
                onChange={(event) => updateField('serviceRadiusKm', event.target.value)}
                placeholder="Ex.: 5"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none focus:border-[#3ECF8E]"
              />
            </div>
          </section>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2">
            <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-[14px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 text-center">
              <Upload size={18} className="mb-2 text-[#64748B]" />
              <span className="text-sm font-semibold text-[#0F172A]">
                {fileLabel(cnhDocument, 'Enviar CNH (frente e verso)')}
              </span>
              <span className="mt-1 text-xs text-[#64748B]">JPG, PNG ou PDF</span>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(event) => setCnhDocument(event.target.files?.[0] ?? null)}
              />
            </label>

            <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-[14px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 text-center">
              <Upload size={18} className="mb-2 text-[#64748B]" />
              <span className="text-sm font-semibold text-[#0F172A]">
                {fileLabel(credentialDocument, 'Enviar credencial DETRAN')}
              </span>
              <span className="mt-1 text-xs text-[#64748B]">JPG, PNG ou PDF</span>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={(event) => setCredentialDocument(event.target.files?.[0] ?? null)}
              />
            </label>
          </section>

          <div className="rounded-[14px] bg-[#F8FAFC] p-4 text-sm leading-6 text-[#64748B]">
            Apos o envio, a conta fica com status de analise. O administrador valida a documentacao
            e libera o acesso para a etapa de mensalidade e ativacao.
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 border-t border-[#E2E8F0] pt-5 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-[#64748B]">
          Ja tem conta?{' '}
          <Link href="/login/instrutor" className="font-semibold text-[#0F172A] hover:text-[#0284C7]">
            Entrar como instrutor
          </Link>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-[#E2E8F0] px-4 text-sm font-medium text-[#475569] transition-colors hover:bg-[#F8FAFC]"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              disabled={
                (step === 1 && !stepOneComplete) ||
                (step === 2 && !stepTwoComplete) ||
                (step === 3 && !stepThreeComplete)
              }
              onClick={goNext}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-semibold text-[#0F172A] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: '#3ECF8E' }}
            >
              Continuar
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={!stepFourComplete || isSubmitting}
              onClick={() => {
                void handleSubmit()
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-semibold text-[#0F172A] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: '#3ECF8E' }}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar para analise'}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

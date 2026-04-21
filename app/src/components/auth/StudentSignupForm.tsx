'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import type { CepLookupResult, CNHCategory, LessonGoal } from '@/types'

type AccountMethod = 'google' | 'email'

type FormState = {
  fullName: string
  email: string
  password: string
  cpf: string
  phone: string
  birthDate: string
  photoUrl: string
  cep: string
  complement: string
  neighborhood: string
  city: string
  latitude: string
  longitude: string
  hasCnh: 'yes' | 'no'
  categoryInterest: CNHCategory
  lessonGoals: LessonGoal[]
  customGoal: string
}

type SignupDraft = {
  accountMethod: AccountMethod
  step: 1 | 2
  form: FormState
}

const DRAFT_KEY = 'student-signup-draft'

const GOAL_OPTIONS: Array<{ value: LessonGoal; label: string; description: string }> = [
  {
    value: 'first_cnh',
    label: 'Tirar a CNH pela primeira vez',
    description: 'Quero comecar do zero e aprender com calma.',
  },
  {
    value: 'detran_exam',
    label: 'Passar no exame pratico do DETRAN',
    description: 'Meu foco e aprovacao na prova pratica.',
  },
  {
    value: 'fear',
    label: 'Perder o medo de dirigir',
    description: 'Preciso ganhar confianca no transito.',
  },
  {
    value: 'practice',
    label: 'Praticar depois de muito tempo',
    description: 'Ja dirigi antes, mas preciso retomar.',
  },
  {
    value: 'specific',
    label: 'Situacoes especificas',
    description: 'Estacionamento, rodovia, noturno ou trafego intenso.',
  },
  {
    value: 'other',
    label: 'Outro objetivo',
    description: 'Descrevo um contexto mais especifico.',
  },
]

const EMPTY_FORM: FormState = {
  fullName: '',
  email: '',
  password: '',
  cpf: '',
  phone: '',
  birthDate: '',
  photoUrl: '',
  cep: '',
  complement: '',
  neighborhood: '',
  city: '',
  latitude: '',
  longitude: '',
  hasCnh: 'no',
  categoryInterest: 'B',
  lessonGoals: [],
  customGoal: '',
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

function getDraft() {
  if (typeof window === 'undefined') {
    return null
  }

  const rawDraft = window.sessionStorage.getItem(DRAFT_KEY)

  if (!rawDraft) {
    return null
  }

  try {
    return JSON.parse(rawDraft) as SignupDraft
  } catch {
    window.sessionStorage.removeItem(DRAFT_KEY)
    return null
  }
}

function setDraft(draft: SignupDraft) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
}

function clearDraft() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(DRAFT_KEY)
}

export function StudentSignupForm() {
  const initialDraft = getDraft()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = (() => {
    const next = searchParams.get('next')
    return next && next.startsWith('/') ? next : '/aluno'
  })()
  const oauthHandledRef = useRef(false)
  const [step, setStep] = useState<1 | 2>(initialDraft?.step ?? 1)
  const [accountMethod, setAccountMethod] = useState<AccountMethod>(
    initialDraft?.accountMethod ?? 'email'
  )
  const [googleConnected, setGoogleConnected] = useState(false)
  const [isCepPending, startCepTransition] = useTransition()
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [cepStatus, setCepStatus] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>(initialDraft?.form ?? EMPTY_FORM)

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function toggleGoal(goal: LessonGoal) {
    setForm((current) => {
      const alreadySelected = current.lessonGoals.includes(goal)

      return {
        ...current,
        lessonGoals: alreadySelected
          ? current.lessonGoals.filter((item) => item !== goal)
          : [...current.lessonGoals, goal],
      }
    })
  }

  function saveDraft(nextStep: 1 | 2 = step) {
    setDraft({
      accountMethod,
      step: nextStep,
      form,
    })
  }

  function goToStepTwo() {
    setSubmitError('')
    setSubmitSuccess('')
    setStep(2)
    saveDraft(2)
  }

  function goToStepOne() {
    setSubmitError('')
    setSubmitSuccess('')
    setStep(1)
    saveDraft(1)
  }

  function buildPayload() {
    return {
      accountMethod,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      password: form.password,
      cpf: form.cpf,
      birthDate: form.birthDate,
      phone: form.phone,
      photoUrl: form.photoUrl.trim(),
      cep: form.cep,
      complement: form.complement.trim(),
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      hasCnh: form.hasCnh === 'yes',
      categoryInterest: form.categoryInterest,
      lessonGoals: form.lessonGoals,
      customGoal: form.customGoal.trim(),
    }
  }

  async function startGoogleAuth() {
    setSubmitError('')
    setSubmitSuccess('')
    setIsGoogleLoading(true)
    setAccountMethod('google')
    setDraft({
      accountMethod: 'google',
      step,
      form,
    })

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/cadastro/aluno?oauth=return&next=${encodeURIComponent(nextPath)}`,
      },
    })

    if (error) {
      setIsGoogleLoading(false)
      setSubmitError(error.message)
    }
  }

  async function handleSubmit() {
    if (!stepOneComplete || !stepTwoComplete) {
      return
    }

    setSubmitError('')
    setSubmitSuccess('')
    setIsSubmitting(true)

    try {
      if (accountMethod === 'google') {
        const supabase = createClient()
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          setSubmitError('Autentique com Gmail antes de finalizar o cadastro.')
          setIsSubmitting(false)
          return
        }
      }

      const response = await fetch('/api/auth/signup/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })

      const result = await response.json()

      if (!response.ok) {
        setSubmitError(result.error ?? 'Nao foi possivel criar a conta.')
        setIsSubmitting(false)
        return
      }

      clearDraft()

      if (result.nextStep === 'confirm_email') {
        setSubmitSuccess(
          'Conta criada. Enviamos um e-mail de confirmacao para voce ativar o acesso antes do primeiro login.'
        )
      } else {
        setSubmitSuccess('Cadastro concluido. Redirecionando...')
        router.push(nextPath)
      }
    } catch {
      setSubmitError('Erro inesperado ao criar a conta.')
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
          neighborhood: result.neighborhood || current.neighborhood,
          city: result.city || current.city || 'Fortaleza',
          latitude: result.latitude || current.latitude,
          longitude: result.longitude || current.longitude,
        }))

        setCepStatus('Localizacao preenchida automaticamente.')
      } catch {
        setCepStatus('Erro ao consultar o CEP.')
      }
    })
  }, [form.cep])

  useEffect(() => {
    if (searchParams.get('oauth') !== 'return' || oauthHandledRef.current) {
      return
    }

    oauthHandledRef.current = true
    setIsGoogleLoading(true)

    const supabase = createClient()

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (error || !data.user) {
          setSubmitError('Nao foi possivel recuperar a sessao do Gmail. Tente novamente.')
          return
        }

        const draft = getDraft()
        const metadata = data.user.user_metadata ?? {}
        const draftForm = draft?.form ?? EMPTY_FORM
        const nextStep = draft?.step ?? 1

        setAccountMethod('google')
        setGoogleConnected(true)
        setStep(nextStep)
        setForm({
          ...draftForm,
          email: data.user.email ?? draftForm.email,
          fullName:
            metadata.full_name ??
            metadata.name ??
            metadata.user_name ??
            draftForm.fullName,
          photoUrl: metadata.avatar_url ?? metadata.picture ?? draftForm.photoUrl,
        })
        setSubmitSuccess('Gmail autenticado. Agora complete seu perfil para finalizar o cadastro.')
        setSubmitError('')
        clearDraft()
        router.replace(`/cadastro/aluno?next=${encodeURIComponent(nextPath)}`)
      })
      .catch(() => {
        setSubmitError('Erro ao validar a sessao do Gmail.')
      })
      .finally(() => {
        setIsGoogleLoading(false)
      })
  }, [nextPath, router, searchParams])

  useEffect(() => {
    if (accountMethod !== 'google') {
      return
    }

    const supabase = createClient()

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data.user) {
          setGoogleConnected(true)
          setForm((current) => ({
            ...current,
            email: data.user?.email ?? current.email,
            fullName:
              data.user?.user_metadata?.full_name ??
              data.user?.user_metadata?.name ??
              current.fullName,
            photoUrl:
              data.user?.user_metadata?.avatar_url ??
              data.user?.user_metadata?.picture ??
              current.photoUrl,
          }))
        }
      })
      .catch(() => {})
  }, [accountMethod])

  useEffect(() => {
    if (submitSuccess || submitError) {
      return
    }

    setDraft({
      accountMethod,
      step,
      form,
    })
  }, [accountMethod, form, step, submitError, submitSuccess])

  const stepOneComplete =
    Boolean(form.fullName.trim()) &&
    Boolean(form.email.trim()) &&
    form.cpf.replace(/\D/g, '').length === 11 &&
    form.phone.replace(/\D/g, '').length >= 10 &&
    Boolean(form.birthDate) &&
    (accountMethod === 'google' || form.password.length >= 8)

  const stepTwoComplete =
    form.cep.replace(/\D/g, '').length === 8 &&
    Boolean(form.latitude) &&
    Boolean(form.longitude) &&
    Boolean(form.neighborhood.trim()) &&
    Boolean(form.city.trim()) &&
    form.lessonGoals.length > 0 &&
    (!form.lessonGoals.includes('other') || Boolean(form.customGoal.trim()))

  if (submitSuccess && !submitError && !isSubmitting && accountMethod === 'email') {
    return (
      <div
        className="w-full max-w-2xl rounded-[20px] border border-[#E2E8F0] bg-white p-6 md:p-8"
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#D1FAE5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#065F46]">
          <Check size={14} />
          Cadastro iniciado
        </div>

        <h1 className="text-[28px] font-bold leading-tight text-[#0F172A]">
          Conta criada com sucesso
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#64748B]">{submitSuccess}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login/aluno"
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
      className="w-full max-w-3xl rounded-[20px] border border-[#E2E8F0] bg-white p-6 md:p-8"
      style={{ boxShadow: 'var(--shadow-modal)' }}
    >
      <div className="mb-8 flex flex-col gap-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#F1F5F9] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
          <ShieldCheck size={14} />
          Cadastro do aluno
        </div>

        <div className="space-y-2">
          <h1 className="text-[30px] font-bold leading-tight text-[#0F172A]">
            Crie sua conta e encontre o instrutor ideal
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[#64748B]">
            Fluxo em 2 etapas conforme a documentacao: primeiro sua conta, depois seu perfil de
            aprendizado e localizacao para ordenar instrutores por proximidade.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-sm font-medium text-[#0F172A]">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
              style={{ background: step === 1 ? '#3ECF8E' : '#D1FAE5', color: '#0F172A' }}
            >
              {step > 1 ? <Check size={16} /> : 1}
            </span>
            Conta
          </div>
          <div className="h-px flex-1 bg-[#E2E8F0]" />
          <div className="flex items-center gap-3 text-sm font-medium text-[#0F172A]">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
              style={{
                background: step === 2 ? '#3ECF8E' : '#F1F5F9',
                color: step === 2 ? '#0F172A' : '#64748B',
              }}
            >
              2
            </span>
            Perfil de aprendizado
          </div>
        </div>
      </div>

      {submitError && (
        <div className="mb-6 rounded-[12px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {submitError}
        </div>
      )}

      {submitSuccess && (
        <div className="mb-6 rounded-[12px] border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]">
          {submitSuccess}
        </div>
      )}

      {step === 1 ? (
        <div className="space-y-6">
          <section className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setAccountMethod('google')}
              className="rounded-[14px] border p-4 text-left transition-colors"
              style={{
                borderColor: accountMethod === 'google' ? '#3ECF8E' : '#E2E8F0',
                background: accountMethod === 'google' ? '#F3FFF9' : '#FFFFFF',
              }}
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9] text-[#0F172A]">
                <Mail size={18} />
              </div>
              <div className="text-base font-semibold text-[#0F172A]">Entrar com Gmail</div>
              <p className="mt-1 text-sm leading-6 text-[#64748B]">
                Voce autentica primeiro com Google e depois finaliza os dados do perfil.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setAccountMethod('email')}
              className="rounded-[14px] border p-4 text-left transition-colors"
              style={{
                borderColor: accountMethod === 'email' ? '#3ECF8E' : '#E2E8F0',
                background: accountMethod === 'email' ? '#F3FFF9' : '#FFFFFF',
              }}
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9] text-[#0F172A]">
                <UserRound size={18} />
              </div>
              <div className="text-base font-semibold text-[#0F172A]">Usar e-mail convencional</div>
              <p className="mt-1 text-sm leading-6 text-[#64748B]">
                Voce cria sua senha agora e recebe um e-mail de confirmacao para ativar a conta.
              </p>
            </button>
          </section>

          {accountMethod === 'google' && (
            <section className="rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#0F172A]">Autenticacao com Gmail</div>
                  <p className="mt-1 text-sm leading-6 text-[#64748B]">
                    {googleConnected
                      ? 'Sua conta Google ja foi conectada. Revise os dados abaixo e continue.'
                      : 'Conecte sua conta Google antes de avancar para a etapa do perfil.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void startGoogleAuth()
                  }}
                  disabled={isGoogleLoading || isSubmitting}
                  className="inline-flex min-h-11 items-center justify-center rounded-[8px] px-4 text-sm font-semibold text-[#0F172A] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: '#3ECF8E' }}
                >
                  {isGoogleLoading
                    ? 'Conectando...'
                    : googleConnected
                      ? 'Trocar conta Gmail'
                      : 'Autenticar com Gmail'}
                </button>
              </div>
            </section>
          )}

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="full-name" className="text-sm font-medium text-[#0F172A]">
                Nome completo
              </label>
              <input
                id="full-name"
                value={form.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="Seu nome completo"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[#0F172A]">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="seu@email.com"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="birth-date" className="text-sm font-medium text-[#0F172A]">
                Data de nascimento
              </label>
              <input
                id="birth-date"
                type="date"
                value={form.birthDate}
                onChange={(event) => updateField('birthDate', event.target.value)}
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none transition-colors focus:border-[#3ECF8E]"
              />
            </div>

            {accountMethod === 'email' && (
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="password" className="text-sm font-medium text-[#0F172A]">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="Minimo de 8 caracteres"
                  className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
                />
                <p className="text-xs text-[#64748B]">
                  Obrigatoria apenas no fluxo com e-mail convencional.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="cpf" className="text-sm font-medium text-[#0F172A]">
                CPF
              </label>
              <input
                id="cpf"
                inputMode="numeric"
                value={form.cpf}
                onChange={(event) => updateField('cpf', formatCpf(event.target.value))}
                placeholder="000.000.000-00"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-sm font-medium text-[#0F172A]">
                Telefone / WhatsApp
              </label>
              <input
                id="phone"
                inputMode="tel"
                value={form.phone}
                onChange={(event) => updateField('phone', formatPhone(event.target.value))}
                placeholder="(85) 9XXXX-XXXX"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
              />
            </div>

          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-[#E2E8F0] pt-5 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-[#64748B]">
              Ja tem conta?{' '}
              <Link href="/login/aluno" className="font-semibold text-[#0F172A] hover:text-[#0284C7]">
                Entrar como aluno
              </Link>
            </div>
            <button
              type="button"
              disabled={accountMethod === 'google' && !googleConnected ? false : !stepOneComplete}
              onClick={() => {
                if (accountMethod === 'google' && !googleConnected) {
                  void startGoogleAuth()
                  return
                }

                goToStepTwo()
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-semibold text-[#0F172A] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: '#3ECF8E' }}
            >
              {accountMethod === 'google' && !googleConnected ? 'Continuar com Gmail' : 'Continuar'}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-[1fr_1fr]">
            <div className="space-y-1.5">
              <label htmlFor="cep" className="text-sm font-medium text-[#0F172A]">
                CEP <span className="text-[#EF4444]">*</span>
              </label>
              <input
                id="cep"
                inputMode="numeric"
                value={form.cep}
                onChange={(event) => {
                  const nextCep = formatCep(event.target.value)
                  updateField('cep', nextCep)

                  if (nextCep.replace(/\D/g, '').length !== 8) {
                    setCepStatus('')
                  }
                }}
                placeholder="00000-000"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
              />
              <p className="text-xs text-[#64748B]">
                Obrigatorio. O bairro, cidade e coordenadas sao preenchidos automaticamente.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="complement" className="text-sm font-medium text-[#0F172A]">
                Complemento
              </label>
              <input
                id="complement"
                value={form.complement}
                onChange={(event) => updateField('complement', event.target.value)}
                placeholder="Apto, bloco, casa..."
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="neighborhood" className="text-sm font-medium text-[#0F172A]">
                Bairro
              </label>
              <input
                id="neighborhood"
                value={form.neighborhood}
                onChange={(event) => updateField('neighborhood', event.target.value)}
                placeholder="Preenchido pelo CEP"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="city" className="text-sm font-medium text-[#0F172A]">
                Cidade
              </label>
              <input
                id="city"
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
                placeholder="Fortaleza"
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
              />
            </div>

            <div
              className="rounded-[14px] p-4"
              style={{
                background: form.latitude && form.longitude ? '#F0FDF4' : '#FFF7ED',
                border: `1px solid ${form.latitude && form.longitude ? '#BBF7D0' : '#FED7AA'}`,
              }}
            >
              <div
                className="mb-2 inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: form.latitude && form.longitude ? '#166534' : '#9A3412' }}
              >
                <MapPin size={16} />
                {form.latitude && form.longitude ? 'Localizacao confirmada' : 'Localizacao pendente'}
              </div>
              <div className="text-sm" style={{ color: form.latitude && form.longitude ? '#166534' : '#9A3412' }}>
                {isCepPending ? (
                  <p>Buscando localizacao...</p>
                ) : form.latitude && form.longitude ? (
                  <>
                    <p>Lat: {Number(form.latitude).toFixed(5)}</p>
                    <p>Lon: {Number(form.longitude).toFixed(5)}</p>
                  </>
                ) : (
                  <p>{cepStatus || 'Informe um CEP valido para confirmar sua localizacao.'}</p>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0F172A]">Ja possui CNH?</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => updateField('hasCnh', 'yes')}
                  className="min-h-11 rounded-[8px] border px-4 text-sm font-medium transition-colors"
                  style={{
                    borderColor: form.hasCnh === 'yes' ? '#3ECF8E' : '#E2E8F0',
                    background: form.hasCnh === 'yes' ? '#F3FFF9' : '#FFFFFF',
                    color: '#0F172A',
                  }}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => updateField('hasCnh', 'no')}
                  className="min-h-11 rounded-[8px] border px-4 text-sm font-medium transition-colors"
                  style={{
                    borderColor: form.hasCnh === 'no' ? '#3ECF8E' : '#E2E8F0',
                    background: form.hasCnh === 'no' ? '#F3FFF9' : '#FFFFFF',
                    color: '#0F172A',
                  }}
                >
                  Nao
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="category-interest" className="text-sm font-medium text-[#0F172A]">
                Categoria de interesse
              </label>
              <select
                id="category-interest"
                value={form.categoryInterest}
                onChange={(event) => updateField('categoryInterest', event.target.value as CNHCategory)}
                className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-base text-[#0F172A] outline-none transition-colors focus:border-[#3ECF8E]"
              >
                <option value="A">Categoria A</option>
                <option value="B">Categoria B</option>
                <option value="AB">A + B</option>
              </select>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <label className="text-sm font-medium text-[#0F172A]">Objetivo das aulas</label>
              <p className="mt-1 text-sm text-[#64748B]">
                Essa informacao ajuda o instrutor a adaptar a aula e pode ser usada como filtro
                de busca futuramente.
              </p>
            </div>

            <div className="grid gap-3">
              {GOAL_OPTIONS.map((goal) => {
                const selected = form.lessonGoals.includes(goal.value)

                return (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => toggleGoal(goal.value)}
                    className="rounded-[14px] border p-4 text-left transition-colors"
                    style={{
                      borderColor: selected ? '#3ECF8E' : '#E2E8F0',
                      background: selected ? '#F3FFF9' : '#FFFFFF',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[#0F172A]">{goal.label}</div>
                        <div className="mt-1 text-sm leading-6 text-[#64748B]">
                          {goal.description}
                        </div>
                      </div>
                      <span
                        className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border"
                        style={{
                          borderColor: selected ? '#3ECF8E' : '#CBD5E1',
                          background: selected ? '#3ECF8E' : '#FFFFFF',
                          color: selected ? '#0F172A' : 'transparent',
                        }}
                      >
                        <Check size={12} />
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {form.lessonGoals.includes('other') && (
              <div className="space-y-1.5">
                <label htmlFor="custom-goal" className="text-sm font-medium text-[#0F172A]">
                  Descreva seu objetivo
                </label>
                <textarea
                  id="custom-goal"
                  value={form.customGoal}
                  onChange={(event) => updateField('customGoal', event.target.value)}
                  rows={4}
                  placeholder="Conte brevemente o que voce quer treinar ou superar."
                  className="w-full rounded-[8px] border border-[#E2E8F0] px-3 py-3 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]"
                />
              </div>
            )}
          </section>

          <div className="flex flex-col gap-3 border-t border-[#E2E8F0] pt-5 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={goToStepOne}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-[#E2E8F0] px-4 text-sm font-medium text-[#475569] transition-colors hover:bg-[#F8FAFC]"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>

            <button
              type="button"
              disabled={!stepTwoComplete || (accountMethod === 'google' && !googleConnected)}
              onClick={() => {
                void handleSubmit()
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-semibold text-[#0F172A] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: '#3ECF8E' }}
            >
              {isSubmitting
                ? 'Enviando...'
                : accountMethod === 'google'
                  ? 'Finalizar com Gmail'
                  : 'Finalizar cadastro'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

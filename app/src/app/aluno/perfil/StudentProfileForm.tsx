'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { ArrowLeft, Check, MapPin, Search, User } from 'lucide-react'

import { updateStudentProfileAction } from './actions'
import type { CepLookupResult } from '@/types'

type Props = {
  name: string
  email: string
  photoUrl: string | null
  initialBirthDate: string
  initialGender: string
  initialCep: string
  initialNeighborhood: string
  initialCity: string
  initialLatitude: number | null
  initialLongitude: number | null
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

function formatCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.replace(/^(\d{5})(\d)/, '$1-$2')
}

export function StudentProfileForm({
  name, email, photoUrl,
  initialBirthDate, initialGender, initialCep,
  initialNeighborhood, initialCity, initialLatitude, initialLongitude,
}: Props) {
  const router = useRouter()
  const [birthDate, setBirthDate] = useState(initialBirthDate)
  const [gender, setGender] = useState(initialGender)
  const [cep, setCep] = useState(initialCep)
  const [neighborhood, setNeighborhood] = useState(initialNeighborhood)
  const [city, setCity] = useState(initialCity)
  const [latitude, setLatitude] = useState<number | null>(initialLatitude)
  const [longitude, setLongitude] = useState<number | null>(initialLongitude)
  const [cepStatus, setCepStatus] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isCepLookup, startCepTransition] = useTransition()

  // Recalculate location every time CEP changes
  useEffect(() => {
    const digits = cep.replace(/\D/g, '')

    // Clear derived fields immediately whenever CEP is edited
    setNeighborhood('')
    setCity('')
    setLatitude(null)
    setLongitude(null)
    setCepStatus('')

    if (digits.length !== 8) return

    startCepTransition(async () => {
      setCepStatus('Buscando localização...')
      try {
        const res = await fetch(`/api/nominatim/cep?cep=${digits}`)
        if (!res.ok) { setCepStatus('CEP não encontrado.'); return }
        const data: CepLookupResult = await res.json()
        setNeighborhood(data.neighborhood ?? '')
        setCity(data.city || 'Fortaleza')
        setLatitude(data.latitude ? parseFloat(data.latitude) : null)
        setLongitude(data.longitude ? parseFloat(data.longitude) : null)
        setCepStatus(data.latitude ? 'Localização encontrada.' : 'CEP localizado sem coordenadas.')
      } catch {
        setCepStatus('Erro ao consultar o CEP.')
      }
    })
  }, [cep])

  function handleSave() {
    setError('')
    setSaved(false)
    startTransition(async () => {
      try {
        await updateStudentProfileAction({ birthDate, gender, cep, neighborhood, city, latitude, longitude })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar.')
      }
    })
  }

  const inputClass =
    'min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-base text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#3ECF8E]'

  const hasLocation = latitude != null && longitude != null

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-lg px-4 pb-28 pt-4">

        {/* Top bar */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/aluno')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] bg-white transition-colors hover:bg-[#F1F5F9]"
          >
            <ArrowLeft size={18} className="text-[#64748B]" />
          </button>
          <h1 className="text-lg font-bold text-[#0F172A]">Meu perfil</h1>
        </div>

        {/* Avatar + basic info */}
        <div className="mb-5 flex items-center gap-4 rounded-[16px] border border-[#E2E8F0] bg-white p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#3ECF8E] bg-[#F1F5F9]">
            {photoUrl ? (
              <Image src={photoUrl} alt={name} fill className="object-cover" sizes="64px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#94A3B8]">
                {getInitials(name)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-[#0F172A]">{name}</p>
            <p className="truncate text-sm text-[#64748B]">{email}</p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-[16px] border border-[#E2E8F0] bg-white p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

          {error && (
            <div className="mb-4 rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-sm text-[#B91C1C]">
              {error}
            </div>
          )}

          <div className="space-y-5">

            {/* Section: dados pessoais */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <User size={15} className="text-[#3ECF8E]" />
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">Dados pessoais</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="birth-date" className="text-sm font-medium text-[#0F172A]">
                    Data de nascimento
                  </label>
                  <input
                    id="birth-date"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#0F172A]">Gênero</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'M', label: 'Masculino' },
                      { value: 'F', label: 'Feminino' },
                      { value: 'outro', label: 'Outro' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setGender(value)}
                        className="min-h-10 rounded-[8px] border px-2 text-sm font-medium transition-colors"
                        style={{
                          borderColor: gender === value ? '#3ECF8E' : '#E2E8F0',
                          background: gender === value ? '#F0FDF4' : '#FFFFFF',
                          color: gender === value ? '#065F46' : '#475569',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#F1F5F9]" />

            {/* Section: localização */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <MapPin size={15} className="text-[#3ECF8E]" />
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">Localização</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="cep" className="text-sm font-medium text-[#0F172A]">CEP</label>
                  <div className="relative">
                    <input
                      id="cep"
                      type="text"
                      inputMode="numeric"
                      value={cep}
                      onChange={(e) => setCep(formatCep(e.target.value))}
                      placeholder="00000-000"
                      className={inputClass}
                    />
                    {isCepLookup && (
                      <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-pulse text-[#94A3B8]" />
                    )}
                  </div>
                  {cepStatus && (
                    <p className="text-xs" style={{ color: hasLocation ? '#3ECF8E' : '#94A3B8' }}>
                      {cepStatus}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="neighborhood" className="text-sm font-medium text-[#0F172A]">Bairro</label>
                    <input
                      id="neighborhood"
                      type="text"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Preenchido pelo CEP"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="city" className="text-sm font-medium text-[#0F172A]">Cidade</label>
                    <input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Fortaleza"
                      className={inputClass}
                    />
                  </div>
                </div>

                {hasLocation && (
                  <div className="flex items-center gap-2 rounded-[8px] border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2">
                    <MapPin size={13} className="shrink-0 text-[#3ECF8E]" />
                    <p className="text-xs text-[#065F46]">
                      Coordenadas salvas — instrutores próximos serão priorizados na busca.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-semibold text-[#0F172A] transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: '#3ECF8E' }}
            >
              {isPending ? 'Salvando...' : saved ? <><Check size={16} /> Salvo!</> : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center"
        style={{ background: '#1c1c1c', borderTop: '1px solid #333333', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {[
          { href: '/aluno', label: 'Minhas aulas' },
          { href: '/buscar', label: 'Buscar' },
          { href: '/aluno/perfil', label: 'Perfil', active: true },
        ].map(({ href, label, active }) => (
          <button
            key={href}
            type="button"
            onClick={() => router.push(href)}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 transition-all"
            style={{ color: active ? '#3ECF8E' : '#a1a1aa' }}
          >
            <span className="text-lg leading-none">{label === 'Perfil' ? '👤' : label === 'Buscar' ? '🔍' : '📅'}</span>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

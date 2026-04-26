'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Outfit } from 'next/font/google'
import type { InstructorCard as InstructorCardType } from '@/types'
import {
  ChevronDown,
  MapPin,
  Star,
} from 'lucide-react'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const heroImage = '/landing-1.png'
const carImage = '/landing-2.png'
const founderImage = '/landing-3.png'
const featureImage = '/landing-4.png'
const galleryImage = '/landing-5.png'
const heroSlides = [heroImage, founderImage, galleryImage]

function SocialIcon({ type }: { type: 'facebook' | 'twitter' | 'instagram' | 'linkedin' }) {
  if (type === 'facebook') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.6.4-1 1-1Z" fill="currentColor" />
      </svg>
    )
  }

  if (type === 'twitter') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M18.9 4H22l-6.8 7.8L23 20h-6.1l-4.8-5.2L7.6 20H4.5l7.2-8.2L4 4h6.2l4.3 4.8L18.9 4Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  if (type === 'instagram') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 8a1 1 0 0 1 1-1h2.6a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8Zm6 0a1 1 0 0 1 1-1h2.4a3.6 3.6 0 0 1 3.6 3.6V16a1 1 0 0 1-1 1h-2.6a1 1 0 0 1-1-1v-4.4c0-.8-.5-1.4-1.3-1.4-.8 0-1.3.6-1.3 1.4V16a1 1 0 0 1-1 1H14a1 1 0 0 1-1-1V8Z"
        fill="currentColor"
      />
      <circle cx="9.3" cy="4.8" r="1.3" fill="currentColor" />
    </svg>
  )
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-14 w-[170px]">
        <Image src="/brand-logo.png" alt="Logo oficial da plataforma" fill className="object-contain object-left" sizes="170px" />
      </div>
    </div>
  )
}

function HeroVisual({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-[#efefef] ${className}`}
      style={{
        clipPath: 'polygon(0 0, 84% 0, 100% 18%, 100% 100%, 17% 100%, 0 82%)',
      }}
    >
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 520px" />
    </div>
  )
}

function NumberTabs({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex items-center gap-2">
      {heroSlides.map((_, index) => (
        <div
          key={index}
          className="flex h-12 w-12 items-center justify-center text-[14px] font-medium"
          style={{
            background: index === activeIndex ? '#f7cf11' : '#f5f5f5',
            color: index === activeIndex ? '#111111' : '#8d8d8d',
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </div>
      ))}
    </div>
  )
}

function SocialButtons() {
  const icons: Array<'facebook' | 'twitter' | 'linkedin'> = ['facebook', 'twitter', 'linkedin']
  return (
    <div className="flex items-center gap-2">
      {icons.map((icon, index) => (
        <div
          key={index}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ececec] text-[#8a8a8a]"
        >
          <SocialIcon type={icon} />
        </div>
      ))}
    </div>
  )
}

const studentSteps = [
  {
    number: '01',
    title: 'Busque sua região',
    description: 'Procure por bairro, CEP ou região e veja rapidamente quais instrutores atendem perto de você.',
  },
  {
    number: '02',
    title: 'Compare os perfis',
    description: 'Analise perfis de instrutores autônomos credenciados e escolha a opção que combina com sua rotina.',
  },
  {
    number: '03',
    title: 'Agende com segurança',
    description: 'Marque sua aula prática em poucos minutos e finalize o pagamento com mais segurança na plataforma.',
  },
]

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatServiceCategories(instructor: InstructorCardType) {
  const orderedCategories: Array<'A' | 'B' | 'AB'> = ['A', 'B', 'AB']
  const activeCategories = orderedCategories.filter((category) => {
    const price = instructor.individual_prices[category]
    return typeof price === 'number' && price > 0
  })

  if (activeCategories.length === 0) return `Cat. ${instructor.category}`

  return `Cat. ${activeCategories.join(' • ')}`
}

export function LandingPage() {
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const [activeInstructors, setActiveInstructors] = useState<InstructorCardType[]>([])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length)
    }, 4000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadActiveInstructors() {
      try {
        const response = await fetch('/api/instructors/active-carousel', {
          cache: 'no-store',
        })

        if (!response.ok) return

        const data = (await response.json()) as InstructorCardType[]
        if (!cancelled) setActiveInstructors(data)
      } catch {
        if (!cancelled) setActiveInstructors([])
      }
    }

    void loadActiveInstructors()

    return () => {
      cancelled = true
    }
  }, [])

  const marqueeInstructors =
    activeInstructors.length > 0 ? [...activeInstructors, ...activeInstructors] : []

  return (
    <div className={`${outfit.className} min-h-screen bg-[#fbfbfb] text-[#101010]`}>
      <style jsx global>{`
        @keyframes instructors-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
      <header className="bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-7 lg:px-8">
          <BrandMark />

          <div className="flex items-center gap-4">
            <Link
              href="/login/aluno"
              className="min-w-[120px] bg-[#f7cf11] px-5 py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#111111] sm:min-w-[170px] sm:px-7 sm:py-4 sm:text-[12px]"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="bg-white">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-6 py-6 pb-20 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pt-2">
            <div className="flex flex-col justify-center pt-8 lg:pt-16">
              <h1 className="max-w-[420px] text-[54px] font-semibold leading-[0.98] tracking-[-0.06em] text-[#131313] md:text-[78px]">
                Agende sua aula com rapidez e segurança
              </h1>

              <p className="mt-8 max-w-[330px] text-[14px] leading-7 text-[#9c9c9c]">
                Uma plataforma para encontrar instrutores autônomos credenciados, comparar opções e marcar aulas práticas
                com mais confiança.
              </p>

              <div className="mt-10">
                <Link
                  href="/buscar"
                  className="inline-flex bg-[#121212] px-8 py-4 text-[12px] font-bold uppercase tracking-[0.18em] text-white"
                  style={{ boxShadow: '8px 8px 0 #e9e9e9' }}
                >
                  Buscar instrutor
                </Link>
              </div>
            </div>

            <div className="flex flex-col items-center gap-8 lg:items-end">
              <HeroVisual
                src={heroSlides[activeHeroSlide]}
                alt="Aluna no banco do motorista sorrindo e mostrando a carteira de habilitacao"
                className="h-[320px] w-full max-w-[540px] md:h-[420px]"
              />
              <div className="w-full max-w-[540px] pr-0 lg:pr-3">
                <div className="flex justify-center lg:justify-end">
                  <NumberTabs activeIndex={activeHeroSlide} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fbfbfb]">
          <div className="mx-auto max-w-[1200px] px-6 py-10 pb-24 lg:px-8 lg:py-16 lg:pb-28">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_0.95fr]">
              <div>
                <h2 className="max-w-[580px] text-[40px] font-semibold leading-[1.05] tracking-[-0.05em] text-[#141414] md:text-[58px]">
                  Encontre o instrutor ideal para sua rotina e marque sua aula sem complicação
                </h2>

                <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-[0.92fr_1.08fr]">
                  <HeroVisual src={carImage} alt="Carro na estrada" className="h-[300px] md:h-[340px]" />

                  <div className="flex flex-col justify-between gap-6">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#1a1a1a]">Disponível</p>
                      <div className="mt-3 flex items-center gap-4">
                        <span className="text-[56px] font-semibold leading-none tracking-[-0.06em] text-[#111111]">
                          24h
                        </span>
                        <div className="flex gap-1.5 pt-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <span
                              key={index}
                              className="block h-3 w-6"
                              style={{
                                background: '#f6c808',
                                clipPath: 'polygon(0 0, 68% 0, 100% 50%, 68% 100%, 0 100%, 28% 50%)',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 text-[14px] leading-7 text-[#8d8d8d]">
                      <p>
                        Pesquise por localização, avalie perfis e escolha instrutores autônomos com disponibilidade
                        compatível com o seu dia a dia.
                      </p>
                      <p>
                        O processo foi pensado para o aluno marcar aulas de forma rápida e segura, com menos atrito no
                        contato e mais clareza na contratação.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-6 lg:items-end">
                <HeroVisual
                  src={founderImage}
                  alt="Homem de terno sorrindo dentro do carro"
                  className="h-[340px] w-full max-w-[380px] md:h-[430px]"
                />

                <div className="w-full max-w-[380px] bg-white px-7 py-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8f8f8f]">Acompanhe a plataforma</p>
                  <div className="mt-4">
                    <SocialButtons />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1200px] px-6 py-10 lg:px-8">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-0">
                {studentSteps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <article className="w-full bg-[#f8f8f8] p-6 text-[#111111] lg:min-h-[260px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[44px] font-semibold leading-none tracking-[-0.06em] text-[#111111]">
                          {step.number}
                        </span>
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f7cf11] text-[11px] font-bold uppercase text-[#111111]">
                          Etapa
                        </span>
                      </div>
                      <h3 className="mt-8 text-[24px] font-semibold leading-[1.05] tracking-[-0.04em]">
                        {step.title}
                      </h3>
                      <p className="mt-4 text-[14px] leading-7 text-[#666666]">
                        {step.description}
                      </p>
                    </article>

                    {index < studentSteps.length - 1 ? (
                      <div className="hidden h-[2px] flex-1 bg-[#f7cf11] lg:block" />
                    ) : null}
                  </div>
                ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-8 lg:py-20">
            <div className="text-center">
              <h3 className="text-[38px] font-semibold tracking-[-0.05em] text-[#111111] md:text-[48px]">
                Instrutores ativos na plataforma
              </h3>
              <p className="mx-auto mt-4 max-w-[620px] text-[14px] leading-7 text-[#7b7b7b]">
                Conheça alguns dos instrutores disponíveis agora e encontre quem combina com a sua região e rotina.
              </p>
            </div>

            <div className="mt-12 overflow-hidden">
              {marqueeInstructors.length > 0 ? (
                <div
                  className="flex w-max gap-6"
                  style={{
                    animation: 'instructors-marquee 38s linear infinite',
                  }}
                >
                  {marqueeInstructors.map((instructor, index) => {
                    const initials = instructor.full_name
                      .split(' ')
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')
                      .toUpperCase()
                    const serviceCategories = formatServiceCategories(instructor)

                    return (
                      <article
                        key={`${instructor.id}-${index}`}
                        className="group w-[320px] shrink-0 overflow-hidden border border-[#ececec] bg-white"
                        style={{ boxShadow: '0 12px 30px rgba(17, 17, 17, 0.06)' }}
                      >
                        <div className="relative h-[220px] overflow-hidden bg-[#f2f2f2]">
                          <Link href={`/instrutor/${instructor.id}`} className="block h-full">
                            {instructor.photo_url ? (
                              <Image
                                src={instructor.photo_url}
                                alt={`Foto de ${instructor.full_name}`}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="320px"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-[#f7cf11] text-[52px] font-semibold text-[#111111]">
                                {initials}
                              </div>
                            )}
                          </Link>
                          <div className="absolute left-4 top-4 inline-flex items-center gap-2 bg-[#111111] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                            <span className="inline-block h-2 w-2 rounded-full bg-[#f7cf11]" />
                            Ativo na plataforma
                          </div>
                          <div className="absolute right-4 top-4 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#111111]">
                            {serviceCategories}
                          </div>
                        </div>

                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <Link href={`/instrutor/${instructor.id}`} className="block">
                                <h4 className="text-[22px] font-semibold leading-[1.05] tracking-[-0.04em] text-[#111111]">
                                  {instructor.full_name}
                                </h4>
                              </Link>
                              <div className="mt-3 flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-[#7d7d7d]">
                                <MapPin size={13} />
                                <span>{instructor.neighborhood}, {instructor.city}</span>
                              </div>
                            </div>
                            <div className="inline-flex items-center gap-1 bg-[#fff6d1] px-2.5 py-2 text-[12px] font-bold text-[#111111]">
                              <Star size={13} fill="currentColor" />
                              <span>{instructor.rating.toFixed(1)}</span>
                            </div>
                          </div>

                          {instructor.bio ? (
                            <p className="mt-4 line-clamp-2 text-[14px] leading-7 text-[#6f6f6f]">
                              {instructor.bio}
                            </p>
                          ) : null}

                          <div className="mt-5 flex items-end justify-between border-t border-[#efefef] pt-4">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8b8b8b]">
                                A partir de
                              </p>
                              <p className="mt-1 text-[24px] font-semibold leading-none tracking-[-0.04em] text-[#111111]">
                                R$ {formatPrice(instructor.hourly_rate)}
                              </p>
                            </div>
                            <div className="text-right text-[12px] uppercase tracking-[0.14em] text-[#8b8b8b]">
                              <p>{instructor.lesson_count} aulas</p>
                              <p className="mt-1">{instructor.review_count} avaliações</p>
                            </div>
                          </div>

                          <div className="mt-5">
                            <Link
                              href={`/instrutor/${instructor.id}`}
                              className="inline-flex w-full items-center justify-center bg-[#f7cf11] px-5 py-3 text-[12px] font-bold uppercase tracking-[0.18em] text-[#111111]"
                            >
                              Agendar
                            </Link>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-[420px] animate-pulse bg-[#f4f4f4]" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="bg-[#161616] text-white">
          <div className="mx-auto max-w-[1200px] px-6 py-14 lg:px-8">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.1fr_0.8fr_0.8fr_1fr]">
              <div>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-[150px]">
                    <Image src="/brand-logo.png" alt="Logo oficial da plataforma" fill className="object-contain object-left" sizes="150px" />
                  </div>
                </div>
                <p className="mt-5 max-w-[260px] text-[13px] leading-7 text-white/55">
                  Plataforma que conecta alunos a instrutores autônomos credenciados para um agendamento de aulas mais
                  rápido, prático e seguro.
                </p>
                <p className="mt-6 text-[12px] uppercase tracking-[0.16em] text-white/35">Atuação</p>
                <p className="mt-2 text-[13px] text-white/60">Fortaleza e região metropolitana</p>
              </div>

              <div>
                <h4 className="text-[14px] font-semibold uppercase tracking-[0.18em] text-white">Plataforma</h4>
                <ul className="mt-5 space-y-3 text-[13px] text-white/55">
                  <li>Como funciona</li>
                  <li>Buscar instrutores</li>
                  <li>Agendar aulas</li>
                  <li>Segurança no pagamento</li>
                  <li>Cobertura por região</li>
                </ul>
              </div>

              <div>
                <h4 className="text-[14px] font-semibold uppercase tracking-[0.18em] text-white">Links úteis</h4>
                <ul className="mt-5 space-y-3 text-[13px] text-white/55">
                  <li>Entrar como aluno</li>
                  <li>Entrar como instrutor</li>
                  <li>Central de ajuda</li>
                  <li>Dicas de direção</li>
                  <li>Políticas da plataforma</li>
                </ul>
              </div>

              <div>
                <h4 className="text-[14px] font-semibold uppercase tracking-[0.18em] text-white">Galeria</h4>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[heroImage, founderImage, carImage, featureImage, galleryImage, heroImage].map((src, index) => (
                    <div key={index} className="relative h-[72px] overflow-hidden bg-white/5">
                      <Image src={src} alt="" fill className="object-cover" sizes="72px" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-5 text-[11px] uppercase tracking-[0.16em] text-white/35 md:flex-row md:items-center md:justify-between">
              <span>Política de privacidade</span>
              <span>Termos e condições</span>
              <span>Política da plataforma</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}


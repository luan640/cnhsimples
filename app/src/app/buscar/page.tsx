import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Bike,
  Car,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Target,
} from 'lucide-react'

import { SearchResultCard } from '@/components/buscar/SearchResultCard'
import { Footer } from '@/components/layout/Footer'
import { Navbar } from '@/components/layout/Navbar'
import { getInstructorSearchItems } from '@/lib/instructors/search'

export const metadata: Metadata = {
  title: 'Buscar Instrutor | CNH Simples',
  description: 'Encontre instrutores autônomos credenciados perto de você em Fortaleza e Região Metropolitana.',
}

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[]
    categoria?: string | string[]
    ordenar?: string | string[]
    raio?: string | string[]
    avaliacao?: string | string[]
    objetivo?: string | string[]
  }>
}

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

function buildHref(
  nextEntries: Record<string, string | undefined>,
  currentEntries: Record<string, string>
) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(currentEntries)) {
    if (value) params.set(key, value)
  }

  for (const [key, value] of Object.entries(nextEntries)) {
    if (!value) {
      params.delete(key)
      continue
    }

    params.set(key, value)
  }

  const query = params.toString()
  return query ? `/buscar?${query}` : '/buscar'
}

export default async function Page({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams
  const instructors = await getInstructorSearchItems()

  const query = getSingleValue(resolvedSearchParams.q)?.trim() ?? ''
  const category = getSingleValue(resolvedSearchParams.categoria)?.toUpperCase() ?? ''
  const sort = getSingleValue(resolvedSearchParams.ordenar) ?? 'relevancia'
  const radius = getSingleValue(resolvedSearchParams.raio) ?? '20'
  const minimumRating = getSingleValue(resolvedSearchParams.avaliacao) ?? '0'
  const objective = getSingleValue(resolvedSearchParams.objetivo) ?? ''

  const radiusNumber = Number(radius) || 20
  const ratingNumber = Number(minimumRating) || 0
  const normalizedQuery = query.toLowerCase()

  const filteredInstructors = instructors
    .filter((instructor) => {
      if (category && instructor.category !== category && instructor.category !== 'AB') {
        return false
      }

      if (
        normalizedQuery &&
        ![
          instructor.full_name,
          instructor.neighborhood,
          instructor.city,
          instructor.bio ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      ) {
        return false
      }

      if (instructor.distance_km && instructor.distance_km > radiusNumber) {
        return false
      }

      if (instructor.rating < ratingNumber) {
        return false
      }

      if (objective && !instructor.lesson_goals.includes(objective)) {
        return false
      }

      return instructor.status === 'active'
    })
    .sort((left, right) => {
      switch (sort) {
        case 'preco-menor':
          return left.hourly_rate - right.hourly_rate
        case 'preco-maior':
          return right.hourly_rate - left.hourly_rate
        case 'mais-proximo':
          return (left.distance_km ?? 999) - (right.distance_km ?? 999)
        case 'melhor-avaliacao':
          return right.rating - left.rating
        default: {
          const leftScore =
            left.rating * 4 +
            (left.is_super_instructor ? 4 : 0) +
            (left.is_trending ? 2 : 0) -
            (left.distance_km ?? 0) / 5

          const rightScore =
            right.rating * 4 +
            (right.is_super_instructor ? 4 : 0) +
            (right.is_trending ? 2 : 0) -
            (right.distance_km ?? 0) / 5

          return rightScore - leftScore
        }
      }
    })

  const currentEntries = {
    q: query,
    categoria: category,
    ordenar: sort,
    raio: radius,
    avaliacao: minimumRating,
    objetivo: objective,
  }

  const activeFilters = [
    query && `Busca: ${query}`,
    category && `Categoria ${category}`,
    radius && `Raio até ${radius} km`,
    ratingNumber > 0 && `Nota ${minimumRating}+`,
    objective &&
      ({
        first_cnh: 'Primeira CNH',
        detran_exam: 'Exame DETRAN',
        fear: 'Perder medo',
        practice: 'Praticar',
        specific: 'Situações específicas',
        other: 'Outro objetivo',
      }[objective] ?? objective),
  ].filter((f): f is string => Boolean(f))

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F8FAFC] pt-16">
        <section className="border-b border-[#E2E8F0] bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3ECF8E]">
                  Buscar Instrutor
                </p>
                <h1 className="text-[28px] font-bold leading-tight text-[#0F172A] md:text-[34px]">
                  Encontre um instrutor credenciado perto de você
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-[#64748B] md:text-base">
                  Filtre por localização, categoria, preço e avaliação. O agendamento continua
                  simples: escolher, ver horários e reservar.
                </p>
              </div>

              <form action="/buscar" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px]">
                <label
                  className="flex min-h-11 items-center gap-3 rounded-[12px] border border-[#E2E8F0] bg-white px-4"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <Search size={18} className="text-[#64748B]" />
                  <input
                    type="text"
                    name="q"
                    defaultValue={query}
                    placeholder="Seu CEP, bairro ou nome do instrutor"
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-[8px] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#F97316' }}
                >
                  Buscar agora
                </button>

                <input type="hidden" name="categoria" value={category} />
                <input type="hidden" name="ordenar" value={sort} />
                <input type="hidden" name="raio" value={radius} />
                <input type="hidden" name="avaliacao" value={minimumRating} />
                <input type="hidden" name="objetivo" value={objective} />
              </form>

              <div className="flex flex-wrap gap-2 lg:hidden">
                <Link
                  href={buildHref({ categoria: category === 'B' ? '' : 'B' }, currentEntries)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
                  style={{
                    borderColor: category === 'B' ? '#3ECF8E' : '#E2E8F0',
                    background: category === 'B' ? '#D1FAE5' : '#FFFFFF',
                    color: category === 'B' ? '#065F46' : '#475569',
                  }}
                >
                  <Car size={16} />
                  Categoria B
                </Link>
                <Link
                  href={buildHref({ categoria: category === 'A' ? '' : 'A' }, currentEntries)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
                  style={{
                    borderColor: category === 'A' ? '#3ECF8E' : '#E2E8F0',
                    background: category === 'A' ? '#D1FAE5' : '#FFFFFF',
                    color: category === 'A' ? '#065F46' : '#475569',
                  }}
                >
                  <Bike size={16} />
                  Categoria A
                </Link>
                <Link
                  href={buildHref({ avaliacao: minimumRating === '4.5' ? '' : '4.5' }, currentEntries)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
                  style={{
                    borderColor: minimumRating === '4.5' ? '#3ECF8E' : '#E2E8F0',
                    background: minimumRating === '4.5' ? '#D1FAE5' : '#FFFFFF',
                    color: minimumRating === '4.5' ? '#065F46' : '#475569',
                  }}
                >
                  <Star size={16} />
                  Nota 4.5+
                </Link>
                <Link
                  href={buildHref({ raio: radius === '10' ? '20' : '10' }, currentEntries)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium text-[#475569] transition-colors"
                  style={{
                    borderColor: radius === '10' ? '#3ECF8E' : '#E2E8F0',
                    background: radius === '10' ? '#D1FAE5' : '#FFFFFF',
                  }}
                >
                  <MapPin size={16} />
                  Até 10 km
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:py-8">
          <aside className="hidden lg:block">
            <form
              action="/buscar"
              className="sticky top-24 rounded-[16px] border border-[#E2E8F0] bg-white p-5"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="mb-5 flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[#3ECF8E]" />
                <h2 className="text-sm font-semibold text-[#0F172A]">Filtrar instrutores</h2>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                    Localização
                  </label>
                  <input
                    type="text"
                    name="q"
                    defaultValue={query}
                    placeholder="CEP ou bairro"
                    className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] px-3 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#3ECF8E]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                    Categoria
                  </label>
                  <select
                    name="categoria"
                    defaultValue={category}
                    className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#3ECF8E]"
                  >
                    <option value="">Todas</option>
                    <option value="A">Categoria A</option>
                    <option value="B">Categoria B</option>
                    <option value="AB">A + B</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                    Raio de busca
                  </label>
                  <select
                    name="raio"
                    defaultValue={radius}
                    className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#3ECF8E]"
                  >
                    <option value="5">Até 5 km</option>
                    <option value="10">Até 10 km</option>
                    <option value="20">Até 20 km</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                    Avaliação mínima
                  </label>
                  <select
                    name="avaliacao"
                    defaultValue={minimumRating}
                    className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#3ECF8E]"
                  >
                    <option value="0">Qualquer nota</option>
                    <option value="4">4.0 ou mais</option>
                    <option value="4.5">4.5 ou mais</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                    Objetivo da aula
                  </label>
                  <select
                    name="objetivo"
                    defaultValue={objective}
                    className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#3ECF8E]"
                  >
                    <option value="">Todos</option>
                    <option value="first_cnh">Primeira CNH</option>
                    <option value="detran_exam">Exame DETRAN</option>
                    <option value="fear">Perder medo de dirigir</option>
                    <option value="practice">Praticar</option>
                    <option value="specific">Situações específicas</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">
                    Ordenar por
                  </label>
                  <select
                    name="ordenar"
                    defaultValue={sort}
                    className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#3ECF8E]"
                  >
                    <option value="relevancia">Relevância</option>
                    <option value="melhor-avaliacao">Melhor avaliação</option>
                    <option value="preco-menor">Menor preço</option>
                    <option value="preco-maior">Maior preço</option>
                    <option value="mais-proximo">Mais próximo</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center justify-center rounded-[8px] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: '#0F172A' }}
                  >
                    Aplicar filtros
                  </button>
                  <Link
                    href="/buscar"
                    className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[#E2E8F0] px-4 text-sm font-medium text-[#475569] transition-colors hover:bg-[#F8FAFC]"
                  >
                    Limpar filtros
                  </Link>
                </div>
              </div>
            </form>
          </aside>

          <div className="min-w-0">
            <div className="mb-4 flex flex-col gap-4 rounded-[16px] border border-[#E2E8F0] bg-white p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-[#0F172A]">
                    {filteredInstructors.length} instrutor{filteredInstructors.length === 1 ? '' : 'es'} disponíveis perto de você
                  </h2>
                  <p className="text-sm text-[#64748B]">
                    Fortalecemos a busca com localização, avaliação e compatibilidade com seu objetivo.
                  </p>
                </div>

                <form action="/buscar" className="flex items-center gap-2">
                  <input type="hidden" name="q" value={query} />
                  <input type="hidden" name="categoria" value={category} />
                  <input type="hidden" name="raio" value={radius} />
                  <input type="hidden" name="avaliacao" value={minimumRating} />
                  <input type="hidden" name="objetivo" value={objective} />
                  <label className="text-sm font-medium text-[#475569]">Ordenar por</label>
                  <div className="relative">
                    <select
                      name="ordenar"
                      defaultValue={sort}
                      className="min-h-11 appearance-none rounded-[8px] border border-[#E2E8F0] bg-white py-2 pl-3 pr-10 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#3ECF8E]"
                    >
                      <option value="relevancia">Relevância</option>
                      <option value="melhor-avaliacao">Melhor avaliação</option>
                      <option value="preco-menor">Menor preço</option>
                      <option value="preco-maior">Maior preço</option>
                      <option value="mais-proximo">Mais próximo</option>
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                  </div>
                </form>
              </div>

              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter) => (
                    <span
                      key={filter}
                      className="inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold"
                      style={{ background: '#E0F2FE', color: '#0369A1' }}
                    >
                      {filter}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {filteredInstructors.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredInstructors.map((instructor) => (
                  <SearchResultCard key={instructor.id} instructor={instructor} />
                ))}
              </div>
            ) : (
              <div
                className="rounded-[20px] border border-dashed border-[#CBD5E1] bg-white px-6 py-12 text-center"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B]">
                  <Target size={24} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#0F172A]">
                  Nenhum instrutor encontrado para esses filtros
                </h3>
                <p className="mx-auto mb-6 max-w-xl text-sm leading-6 text-[#64748B]">
                  No estado atual do projeto, o Supabase ainda não expõe uma tabela pública de
                  instrutores com dados para esta busca. Assim que a tabela existir, esta página
                  já passa a consumir os registros reais automaticamente.
                </p>
                <Link
                  href="/buscar"
                  className="inline-flex min-h-11 items-center justify-center rounded-[8px] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#F97316' }}
                >
                  Limpar filtros
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

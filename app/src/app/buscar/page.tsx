import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Bike,
  Car,
  ChevronDown,
  MapPin,
  SlidersHorizontal,
  Star,
} from 'lucide-react'

import { SearchResultsView } from '@/components/buscar/SearchResultsView'
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
    if (!value) { params.delete(key); continue }
    params.set(key, value)
  }
  const query = params.toString()
  return query ? `/buscar?${query}` : '/buscar'
}

async function resolveQueryToCoords(q: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = q.trim()
  if (!trimmed) return null

  const digits = trimmed.replace(/\D/g, '')
  let url: string

  if (digits.length === 8) {
    url = `https://nominatim.openstreetmap.org/search?postalcode=${digits}&country=Brazil&format=json&limit=1`
  } else {
    const encoded = encodeURIComponent(`${trimmed}, Fortaleza, Ceará, Brasil`)
    url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CNHSimples/1.0 (contato@cnhsimples.com.br)' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || !data[0]) return null
    const lat = parseFloat(data[0].lat)
    const lng = parseFloat(data[0].lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  } catch {
    return null
  }
}

export default async function Page({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams

  const query = getSingleValue(resolvedSearchParams.q)?.trim() ?? ''
  const category = getSingleValue(resolvedSearchParams.categoria)?.toUpperCase() ?? ''
  const sort = getSingleValue(resolvedSearchParams.ordenar) ?? 'relevancia'
  const radius = getSingleValue(resolvedSearchParams.raio) ?? '20'
  const minimumRating = getSingleValue(resolvedSearchParams.avaliacao) ?? '0'

  const radiusNumber = Number(radius) || 20
  const ratingNumber = Number(minimumRating) || 0
  const normalizedQuery = query.toLowerCase()

  // Resolve CEP/bairro → lat/lng via Nominatim
  const userCoords = query ? await resolveQueryToCoords(query) : null

  const instructors = await getInstructorSearchItems(userCoords)

  const filteredInstructors = instructors
    .filter((instructor) => {
      // Category: check profile category AND individual service categories
      if (category) {
        const profileMatches =
          instructor.category === category || instructor.category === 'AB'
        const serviceMatches = category in instructor.individual_prices
        if (!profileMatches && !serviceMatches) return false
      }

      // Text search: only match names — location queries are handled by Nominatim/distance
      if (normalizedQuery && !userCoords) {
        const searchableText = [
          instructor.full_name,
          instructor.neighborhood,
          instructor.city,
          instructor.bio ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!searchableText.includes(normalizedQuery)) return false
      }

      // Distance filter: only apply when we have user coords
      if (userCoords && instructor.distance_km != null && instructor.distance_km > radiusNumber) {
        return false
      }

      if (instructor.rating < ratingNumber) return false

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
          const score = (i: typeof left) =>
            i.rating * 4 +
            (i.is_super_instructor ? 4 : 0) +
            (i.is_trending ? 2 : 0) -
            (i.distance_km ?? 0) / 5
          return score(right) - score(left)
        }
      }
    })

  const currentEntries = {
    q: query,
    categoria: category,
    ordenar: sort,
    raio: radius,
    avaliacao: minimumRating,
  }

  const activeFilters = [
    query && `Busca: ${query}`,
    userCoords && `Raio até ${radius} km`,
    category && `Categoria ${category}`,
    ratingNumber > 0 && `Nota ${minimumRating}+`,
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
                  Digite seu CEP ou bairro para ver instrutores próximos. Filtre por categoria e avaliação.
                </p>
              </div>

              <form action="/buscar" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_170px]">
                <label
                  className="flex min-h-11 items-center gap-3 rounded-[12px] border border-[#E2E8F0] bg-white px-4"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <MapPin size={18} className="text-[#64748B]" />
                  <input
                    type="text"
                    name="q"
                    defaultValue={query}
                    placeholder="Seu CEP ou bairro (ex: 60165-050 ou Meireles)"
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
                    CEP ou Bairro
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      name="q"
                      defaultValue={query}
                      placeholder="Ex: 60165-050 ou Meireles"
                      className="min-h-11 w-full rounded-[8px] border border-[#E2E8F0] py-2 pl-9 pr-3 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#3ECF8E]"
                    />
                  </div>
                  {userCoords && (
                    <p className="text-[11px] text-[#3ECF8E]">
                      ✓ Localização encontrada — mostrando instrutores próximos
                    </p>
                  )}
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
                    <option value="A">Categoria A — Moto</option>
                    <option value="B">Categoria B — Carro</option>
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
                    {filteredInstructors.length} instrutor{filteredInstructors.length === 1 ? '' : 'es'}{' '}
                    {userCoords ? `em até ${radius} km` : 'disponíveis'}
                  </h2>
                  <p className="text-sm text-[#64748B]">
                    {userCoords
                      ? 'Ordenados por distância e relevância a partir do seu CEP.'
                      : 'Digite seu CEP ou bairro para ver os mais próximos de você.'}
                  </p>
                </div>

                <form action="/buscar" className="flex items-center gap-2">
                  <input type="hidden" name="q" value={query} />
                  <input type="hidden" name="categoria" value={category} />
                  <input type="hidden" name="raio" value={radius} />
                  <input type="hidden" name="avaliacao" value={minimumRating} />
                  <label className="text-sm font-medium text-[#475569]">Ordenar</label>
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

            <SearchResultsView
              instructors={filteredInstructors}
              userCoords={userCoords}
              radiusKm={radiusNumber}
            />
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

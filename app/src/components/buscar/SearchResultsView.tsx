'use client'

import Image from 'next/image'
import Link from 'next/link'
import { List, Map, MapPin, Star, Target } from 'lucide-react'

import { InstructorMap } from '@/components/buscar/InstructorMap'
import { SearchResultCard } from '@/components/buscar/SearchResultCard'
import type { InstructorCard } from '@/types'

type Props = {
  instructors: InstructorCard[]
  userCoords: { lat: number; lng: number } | null
  radiusKm: number
  viewMode: 'list' | 'map'
  listHref: string
  mapHref: string
}

function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function CompactInstructorItem({ instructor }: { instructor: InstructorCard }) {
  const initials = instructor.full_name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')

  const prices = [
    instructor.individual_prices.A,
    instructor.individual_prices.B,
    instructor.individual_prices.AB,
  ].filter((p): p is number => p != null)
  const minPrice = prices.length > 0 ? Math.min(...prices) : instructor.hourly_rate

  return (
    <Link
      href={`/instrutor/${instructor.id}`}
      className="flex items-center gap-3 border-b border-[#F1F5F9] px-4 py-3 transition-colors hover:bg-[#F8FAFC]"
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#F1F5F9]">
        {instructor.photo_url ? (
          <Image
            src={instructor.photo_url}
            alt={instructor.full_name}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#94A3B8]">
            {initials}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#0F172A]">{instructor.full_name}</p>
        <p className="truncate text-xs text-[#64748B]">{instructor.neighborhood}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="flex items-center gap-0.5 text-xs font-medium text-[#F59E0B]">
            <Star size={10} fill="currentColor" />
            {instructor.rating.toFixed(1)}
          </span>
          {instructor.distance_km != null && (
            <span className="flex items-center gap-0.5 text-xs text-[#94A3B8]">
              <MapPin size={10} />
              {instructor.distance_km.toFixed(1)} km
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-[#0284C7]">R$ {formatPrice(minPrice)}</p>
        <p className="text-[10px] text-[#94A3B8]">/aula</p>
      </div>
    </Link>
  )
}

export function SearchResultsView({
  instructors,
  userCoords,
  radiusKm,
  viewMode,
  listHref,
  mapHref,
}: Props) {
  const mapInstructors = instructors
    .filter(
      (i) =>
        i.latitude != null &&
        i.longitude != null &&
        Number.isFinite(i.latitude) &&
        Number.isFinite(i.longitude)
    )
    .map((i) => ({
      id: i.id,
      full_name: i.full_name,
      photo_url: i.photo_url,
      neighborhood: i.neighborhood,
      rating: i.rating,
      hourly_rate: i.hourly_rate,
      category: i.category,
      distance_km: i.distance_km,
      latitude: i.latitude as number,
      longitude: i.longitude as number,
    }))

  if (instructors.length === 0) {
    return (
      <div
        className="rounded-[20px] border border-dashed border-[#CBD5E1] bg-white px-6 py-12 text-center"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B]">
          <Target size={24} />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-[#0F172A]">Nenhum instrutor encontrado</h3>
        <p className="mx-auto max-w-md text-sm leading-6 text-[#64748B]">
          Ajuste os filtros ou altere o raio da busca para encontrar mais opções.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Link
          href={listHref}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
          style={{
            borderColor: viewMode === 'list' ? '#3ECF8E' : '#E2E8F0',
            background: viewMode === 'list' ? '#D1FAE5' : '#FFFFFF',
            color: viewMode === 'list' ? '#065F46' : '#475569',
          }}
        >
          <List size={16} />
          Lista
        </Link>
        <Link
          href={mapHref}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
          style={{
            borderColor: viewMode === 'map' ? '#3ECF8E' : '#E2E8F0',
            background: viewMode === 'map' ? '#D1FAE5' : '#FFFFFF',
            color: viewMode === 'map' ? '#065F46' : '#475569',
          }}
        >
          <Map size={16} />
          Mapa
        </Link>
      </div>

      {viewMode === 'map' ? (
        <div
          className="overflow-hidden rounded-[16px] border border-[#E2E8F0]"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <div className="flex h-[350px] lg:h-[600px]">
            {/* Instructor list sidebar — desktop only */}
            <div className="hidden w-[260px] shrink-0 flex-col overflow-hidden border-r border-[#E2E8F0] bg-white lg:flex">
              <div className="shrink-0 border-b border-[#E2E8F0] px-4 py-3">
                <p className="text-xs font-semibold text-[#64748B]">
                  {instructors.length} instrutor{instructors.length !== 1 ? 'es' : ''} nesta área
                </p>
              </div>
              <div className="overflow-y-auto">
                {instructors.map((instructor) => (
                  <CompactInstructorItem key={instructor.id} instructor={instructor} />
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="flex-1">
              {mapInstructors.length > 0 ? (
                <InstructorMap
                  instructors={mapInstructors}
                  userCoords={userCoords}
                  radiusKm={radiusKm}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center">
                  <p className="text-sm text-[#64748B]">
                    Nenhum instrutor com localização disponível nesta área.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile list — shown below map */}
          <div className="divide-y divide-[#F1F5F9] lg:hidden">
            {instructors.map((instructor) => (
              <CompactInstructorItem key={instructor.id} instructor={instructor} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {instructors.map((instructor) => (
            <SearchResultCard key={instructor.id} instructor={instructor} />
          ))}
        </div>
      )}
    </div>
  )
}

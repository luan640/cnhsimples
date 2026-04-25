'use client'

import { useMemo, useState } from 'react'
import { List, Map, Target } from 'lucide-react'

import { InstructorMap } from '@/components/buscar/InstructorMap'
import { SearchResultCard } from '@/components/buscar/SearchResultCard'
import type { InstructorCard } from '@/types'

type Props = {
  instructors: InstructorCard[]
  userCoords: { lat: number; lng: number } | null
  radiusKm: number
}

type ViewMode = 'list' | 'map'

export function SearchResultsView({ instructors, userCoords, radiusKm }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const mapInstructors = useMemo(
    () =>
      instructors
        .filter(
          (instructor) =>
            instructor.latitude != null &&
            instructor.longitude != null &&
            Number.isFinite(instructor.latitude) &&
            Number.isFinite(instructor.longitude)
        )
        .map((instructor) => ({
          id: instructor.id,
          full_name: instructor.full_name,
          photo_url: instructor.photo_url,
          neighborhood: instructor.neighborhood,
          rating: instructor.rating,
          hourly_rate: instructor.hourly_rate,
          category: instructor.category,
          distance_km: instructor.distance_km,
          latitude: instructor.latitude as number,
          longitude: instructor.longitude as number,
        })),
    [instructors]
  )

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
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
          style={{
            borderColor: viewMode === 'list' ? '#3ECF8E' : '#E2E8F0',
            background: viewMode === 'list' ? '#D1FAE5' : '#FFFFFF',
            color: viewMode === 'list' ? '#065F46' : '#475569',
          }}
        >
          <List size={16} />
          Lista
        </button>

        <button
          type="button"
          onClick={() => setViewMode('map')}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors"
          style={{
            borderColor: viewMode === 'map' ? '#3ECF8E' : '#E2E8F0',
            background: viewMode === 'map' ? '#D1FAE5' : '#FFFFFF',
            color: viewMode === 'map' ? '#065F46' : '#475569',
          }}
        >
          <Map size={16} />
          Mapa
        </button>
      </div>

      {viewMode === 'map' ? (
        mapInstructors.length > 0 ? (
          <div
            className="overflow-hidden rounded-[16px] border border-[#E2E8F0] bg-white"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <InstructorMap instructors={mapInstructors} userCoords={userCoords} radiusKm={radiusKm} />
          </div>
        ) : (
          <div
            className="rounded-[16px] border border-dashed border-[#CBD5E1] bg-white px-6 py-10 text-center"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <p className="text-sm text-[#64748B]">
              Não foi possível exibir o mapa porque os instrutores encontrados ainda não possuem
              coordenadas de localização.
            </p>
          </div>
        )
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

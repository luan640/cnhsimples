import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Trophy, Users } from 'lucide-react'

import type { InstructorCard as InstructorCardType } from '@/types'

interface Props {
  instructor: InstructorCardType
}

export function SearchResultCard({ instructor }: Props) {
  const {
    id,
    full_name,
    photo_url,
    category,
    neighborhood,
    hourly_rate,
    rating,
    review_count,
    lesson_count,
    student_count,
    distance_km,
    is_super_instructor,
    is_new,
    is_trending,
    bio,
    individual_prices,
    accepts_highway,
    accepts_night_driving,
    accepts_parking_practice,
    student_chooses_destination,
  } = instructor

  const initials = full_name
    .split(' ')
    .slice(0, 2)
    .map((name) => name[0])
    .join('')
    .toUpperCase()

  const preferences = [
    accepts_highway ? 'Aulas em rodovias' : null,
    accepts_night_driving ? 'Aulas noturnas' : null,
    accepts_parking_practice ? 'Pratica de estacionamento' : null,
    student_chooses_destination ? 'Aluno escolhe o trajeto' : null,
  ].filter((value): value is string => Boolean(value))

  const priceEntries = ([
    individual_prices.A != null ? { label: 'Cat. A', price: individual_prices.A } : null,
    individual_prices.B != null ? { label: 'Cat. B', price: individual_prices.B } : null,
    individual_prices.AB != null ? { label: 'Cat. A+B', price: individual_prices.AB } : null,
  ]).filter((value): value is { label: string; price: number } => Boolean(value))

  return (
    <div
      className="flex flex-col rounded-[12px] border border-[#E2E8F0] bg-white p-4 transition-all hover:border-[#3ECF8E] hover:shadow-lg"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-[#F1F5F9]">
          {photo_url ? (
            <Image
              src={photo_url}
              alt={`Foto de ${full_name}`}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-base font-bold text-[#94A3B8]">
              {initials}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-snug text-[#0F172A]">{full_name}</h3>
            <div className="flex shrink-0 items-center gap-1">
              <Star size={13} fill="#F59E0B" className="text-[#F59E0B]" />
              <span className="text-sm font-semibold text-[#0F172A]">{rating.toFixed(1)}</span>
              <span className="text-xs text-[#94A3B8]">({review_count})</span>
            </div>
          </div>

          <p className="text-xs text-[#64748B]">
            Categoria {category} · {neighborhood}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1">
            {distance_km !== undefined ? (
              <div className="flex items-center gap-1 text-xs text-[#64748B]">
                <MapPin size={11} />
                {distance_km.toFixed(1)} km de voce
              </div>
            ) : null}

            <div className="flex flex-wrap gap-1">
              {is_super_instructor ? (
                <span
                  className="rounded px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: '#D1FAE5', color: '#065F46' }}
                >
                  Super Instrutor
                </span>
              ) : null}
              {is_trending ? (
                <span
                  className="rounded px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: '#E0F2FE', color: '#0369A1' }}
                >
                  Em Alta
                </span>
              ) : null}
              {is_new ? (
                <span
                  className="rounded px-2 py-0.5 text-[11px] font-semibold"
                  style={{ background: '#FEF3C7', color: '#92400E' }}
                >
                  Novo
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {bio ? (
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-[#475569]">{bio}</p>
      ) : null}

      {preferences.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {preferences.map((preference) => (
            <span
              key={preference}
              className="rounded-full border border-[#D1FAE5] bg-[#F0FDF4] px-2.5 py-1 text-[11px] font-medium text-[#166534]"
            >
              {preference}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mb-4 flex items-center gap-4 text-xs text-[#64748B]">
        <span className="flex items-center gap-1">
          <Trophy size={12} className="text-[#F59E0B]" />
          {lesson_count} aulas
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          {student_count} alunos
        </span>
      </div>

      <div className="mt-auto">
        {priceEntries.length > 0 ? (
          <div className="mb-3 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
              A partir de
            </p>
            {priceEntries.map((entry) => (
              <div key={entry.label} className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-medium text-[#64748B]">{entry.label}</span>
                <div>
                  <span className="text-lg font-bold text-[#0284C7]">R$ {entry.price.toFixed(0)}</span>
                  <span className="text-xs text-[#64748B]">/aula</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]">
              A partir de
            </p>
            <span className="text-lg font-bold text-[#0284C7]">R$ {hourly_rate.toFixed(0)}</span>
          </div>
        )}

        <Link
          href={`/instrutor/${id}`}
          className="flex w-full items-center justify-center rounded-[6px] bg-[#F97316] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 active:opacity-80"
        >
          Ver horarios disponiveis
        </Link>
      </div>
    </div>
  )
}

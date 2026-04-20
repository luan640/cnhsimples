import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Trophy, Users } from 'lucide-react'
import type { InstructorCard as InstructorCardType } from '@/types'

interface Props {
  instructor: InstructorCardType
}

export function SearchResultCard({ instructor }: Props) {
  const {
    id, full_name, photo_url, category, neighborhood,
    hourly_rate, rating, review_count, lesson_count, student_count,
    distance_km, is_super_instructor, is_new, is_trending, bio,
  } = instructor

  const initials = full_name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className="bg-white rounded-[12px] border border-[#E2E8F0] p-4 flex flex-col hover:border-[#3ECF8E] transition-all hover:shadow-lg"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      {/* ── header: avatar + info ── */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 bg-[#F1F5F9]">
          {photo_url ? (
            <Image
              src={photo_url}
              alt={`Foto de ${full_name}`}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-base font-bold text-[#94A3B8]">
              {initials}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h3 className="font-semibold text-[#0F172A] text-sm leading-snug">{full_name}</h3>
            <div className="flex items-center gap-1 shrink-0">
              <Star size={13} fill="#F59E0B" className="text-[#F59E0B]" />
              <span className="text-sm font-semibold text-[#0F172A]">{rating.toFixed(1)}</span>
              <span className="text-xs text-[#94A3B8]">({review_count})</span>
            </div>
          </div>

          <p className="text-xs text-[#64748B]">Categoria {category} · {neighborhood}</p>

          <div className="flex items-center justify-between mt-1.5 flex-wrap gap-1">
            {distance_km !== undefined && (
              <div className="flex items-center gap-1 text-xs text-[#64748B]">
                <MapPin size={11} />
                {distance_km.toFixed(1)} km de você
              </div>
            )}
            <div className="flex gap-1 flex-wrap">
              {is_super_instructor && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold" style={{ background: '#D1FAE5', color: '#065F46' }}>
                  Super Instrutor
                </span>
              )}
              {is_trending && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                  Em Alta
                </span>
              )}
              {is_new && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold" style={{ background: '#FEF3C7', color: '#92400E' }}>
                  Novo
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── bio ── */}
      {bio && (
        <p className="text-sm text-[#475569] leading-relaxed line-clamp-2 mb-3">{bio}</p>
      )}

      {/* ── stats ── */}
      <div className="flex items-center gap-4 text-xs text-[#64748B] mb-4">
        <span className="flex items-center gap-1">
          <Trophy size={12} className="text-[#F59E0B]" />
          {lesson_count} aulas
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          {student_count} alunos
        </span>
      </div>

      {/* ── price + CTA ── */}
      <div className="mt-auto">
        <div className="mb-3">
          <span className="text-lg font-bold" style={{ color: '#0284C7' }}>
            R$ {hourly_rate.toFixed(0)}
          </span>
          <span className="text-xs text-[#64748B]">/aula</span>
        </div>

        <Link
          href={`/instrutor/${id}`}
          className="flex w-full items-center justify-center py-2.5 px-4 text-sm font-medium text-white rounded-[6px] transition-opacity hover:opacity-90 active:opacity-80"
          style={{ background: '#F97316' }}
        >
          Ver horários disponíveis
        </Link>
      </div>
    </div>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Car, Bike } from 'lucide-react'
import type { InstructorCard as InstructorCardType } from '@/types'

interface Props {
  instructor: InstructorCardType
}

const CATEGORY_ICON = {
  A: Bike,
  B: Car,
  AB: Car,
}

function Badge({ label, variant }: { label: string; variant: 'gold' | 'green' | 'blue' }) {
  const styles = {
    gold: { background: '#FEF3C7', color: '#92400E' },
    green: { background: '#D1FAE5', color: '#065F46' },
    blue: { background: '#E0F2FE', color: '#0369A1' },
  }
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold"
      style={styles[variant]}
    >
      {label}
    </span>
  )
}

export function InstructorCard({ instructor }: Props) {
  const {
    id,
    full_name,
    photo_url,
    category,
    neighborhood,
    city,
    hourly_rate,
    rating,
    review_count,
    lesson_count,
    distance_km,
    is_super_instructor,
    is_new,
    is_trending,
    bio,
  } = instructor

  const initials = full_name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const CategoryIcon = CATEGORY_ICON[category]

  return (
    <Link
      href={`/instrutor/${id}`}
      className="group flex flex-col bg-white rounded-[12px] overflow-hidden border border-[#E2E8F0] hover:border-[#3ECF8E] transition-all hover:shadow-lg"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
    >
      {/* avatar */}
      <div className="relative h-48 bg-[#F1F5F9] overflow-hidden">
        {photo_url ? (
          <Image
            src={photo_url}
            alt={`Foto de ${full_name}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#94A3B8]">
            {initials}
          </div>
        )}

        {/* badges overlay */}
        {(is_super_instructor || is_new || is_trending) && (
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {is_super_instructor && <Badge label="⭐ Super Instrutor" variant="gold" />}
            {is_trending && <Badge label="🔥 Em Alta" variant="blue" />}
            {is_new && <Badge label="Novo" variant="green" />}
          </div>
        )}

        {/* category badge */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-[6px] text-xs font-semibold"
          style={{ background: '#1c1c1c', color: '#3ECF8E' }}
        >
          <CategoryIcon size={12} />
          Cat. {category}
        </div>
      </div>

      {/* content */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        <div>
          <h3 className="font-semibold text-[#0F172A] text-sm leading-snug truncate">
            {full_name}
          </h3>
          <div className="flex items-center gap-1 mt-0.5 text-[#64748B] text-xs">
            <MapPin size={11} />
            <span className="truncate">{neighborhood}, {city}</span>
            {distance_km !== undefined && (
              <span className="shrink-0 text-[#94A3B8]">· {distance_km.toFixed(1)} km</span>
            )}
          </div>
        </div>

        {bio && (
          <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">{bio}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#F1F5F9]">
          {/* rating */}
          <div className="flex items-center gap-1">
            <Star size={13} fill="#F59E0B" className="text-[#F59E0B]" />
            <span className="text-sm font-semibold text-[#0F172A]">{rating.toFixed(1)}</span>
            <span className="text-xs text-[#94A3B8]">({review_count})</span>
          </div>

          {/* price */}
        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#94A3B8]">
            A partir de
          </p>
          <span className="text-base font-bold text-[#0F172A]">
            R$ {hourly_rate.toFixed(0)}
          </span>
        </div>
      </div>

        {lesson_count > 0 && (
          <p className="text-[11px] text-[#94A3B8]">
            {lesson_count} aulas realizadas
          </p>
        )}
      </div>
    </Link>
  )
}

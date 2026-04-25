'use client'

import { MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type Suggestion = {
  label: string
  value: string
}

type Props = {
  name: string
  defaultValue?: string
  placeholder?: string
  wrapperClassName?: string
  inputClassName?: string
  showIcon?: boolean
}

export function LocationAutocomplete({
  name,
  defaultValue = '',
  placeholder,
  wrapperClassName = '',
  inputClassName = '',
  showIcon = false,
}: Props) {
  const [value, setValue] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = async (text: string) => {
    const trimmed = text.trim()
    if (trimmed.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }

    try {
      const digits = trimmed.replace(/\D/g, '')
      let url: string

      if (digits.length >= 5 && trimmed.replace(/[-\s]/g, '').match(/^\d+$/)) {
        url = `https://nominatim.openstreetmap.org/search?postalcode=${digits.slice(0, 8)}&country=Brazil&format=json&limit=5&addressdetails=1`
      } else {
        const encoded = encodeURIComponent(`${trimmed}, Fortaleza, Ceará`)
        url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=6&addressdetails=1&countrycodes=br`
      }

      const res = await fetch(url, {
        headers: { 'User-Agent': 'CNHSimples/1.0 (contato@cnhsimples.com.br)' },
      })
      if (!res.ok) return

      const data: Array<{ display_name: string; address?: Record<string, string> }> =
        await res.json()
      if (!Array.isArray(data)) return

      const results: Suggestion[] = data.flatMap((item) => {
        const addr = item.address ?? {}
        const neighbourhood =
          addr.suburb ?? addr.neighbourhood ?? addr.quarter ?? addr.village ?? ''
        const city = addr.city ?? addr.town ?? addr.municipality ?? ''
        const stateCode = addr.state_code ?? addr.ISO3166_2_lvl4?.replace('BR-', '') ?? ''
        const postcode = (addr.postcode ?? '').replace(/\D/g, '')

        if (postcode.length === 8) {
          const formatted = `${postcode.slice(0, 5)}-${postcode.slice(5)}`
          const label = [formatted, neighbourhood, city]
            .filter(Boolean)
            .join(', ')
          return [{ label, value: formatted }]
        }

        if (neighbourhood) {
          const label = [neighbourhood, city, stateCode].filter(Boolean).join(', ')
          return [{ label, value: neighbourhood }]
        }

        return []
      })

      const seen = new Set<string>()
      const unique = results.filter((r) => {
        if (seen.has(r.label)) return false
        seen.add(r.label)
        return true
      })

      setSuggestions(unique)
      setActiveIndex(-1)
      setOpen(unique.length > 0)
    } catch {
      // silently fail — user can still type and search manually
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setValue(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void fetchSuggestions(text), 350)
  }

  const handleSelect = (suggestion: Suggestion) => {
    setValue(suggestion.value)
    setSuggestions([])
    setOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${wrapperClassName}`}>
      {showIcon && (
        <MapPin
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#94A3B8]"
        />
      )}
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        className={inputClassName}
      />
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-[10px] border border-[#E2E8F0] bg-white shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li key={s.label} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                onMouseDown={() => handleSelect(s)}
                onMouseEnter={() => setActiveIndex(i)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors"
                style={{
                  background: i === activeIndex ? '#F8FAFC' : 'transparent',
                  color: '#0F172A',
                }}
              >
                <MapPin size={14} className="shrink-0 text-[#94A3B8]" />
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

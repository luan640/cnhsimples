import { NominatimResult } from '@/types'

const BASE_URL = 'https://nominatim.openstreetmap.org'
const VIACEP_URL = 'https://viacep.com.br/ws'
const HEADERS = { 'User-Agent': 'CNHSimples/1.0 (contato@cnhsimples.com.br)' }

type ViaCEPResponse = {
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

type NominatimSearchItem = {
  lat: string
  lon: string
  display_name: string
  address: NominatimResult['address']
}

async function fetchViaCEP(cep: string): Promise<ViaCEPResponse | null> {
  try {
    const response = await fetch(`${VIACEP_URL}/${cep}/json/`)

    if (!response.ok) {
      return null
    }

    const result = (await response.json()) as ViaCEPResponse

    if (result.erro) {
      return null
    }

    return result
  } catch {
    return null
  }
}

async function fetchNominatimByPostalCode(cep: string): Promise<NominatimSearchItem | null> {
  const url = `${BASE_URL}/search?postalcode=${cep}&country=Brazil&format=json&addressdetails=1&limit=1`

  try {
    const response = await fetch(url, { headers: HEADERS })

    if (!response.ok) {
      return null
    }

    const result = (await response.json()) as NominatimSearchItem[]
    return result[0] ?? null
  } catch {
    return null
  }
}

async function fetchNominatimByAddress(address: ViaCEPResponse): Promise<NominatimSearchItem | null> {
  const query = [address.logradouro, address.bairro, address.localidade, address.uf, 'Brasil']
    .filter(Boolean)
    .join(', ')

  if (!query) {
    return null
  }

  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1`

  try {
    const response = await fetch(url, { headers: HEADERS })

    if (!response.ok) {
      return null
    }

    const result = (await response.json()) as NominatimSearchItem[]
    return result[0] ?? null
  } catch {
    return null
  }
}

export async function searchByCEP(cep: string): Promise<NominatimResult | null> {
  const clean = cep.replace(/\D/g, '')

  if (clean.length !== 8) {
    return null
  }

  const viaCep = await fetchViaCEP(clean)
  const nominatim =
    (await fetchNominatimByPostalCode(clean)) ??
    (viaCep ? await fetchNominatimByAddress(viaCep) : null)

  if (!viaCep && !nominatim) {
    return null
  }

  return {
    lat: nominatim?.lat ?? '',
    lon: nominatim?.lon ?? '',
    display_name:
      nominatim?.display_name ??
      [viaCep?.logradouro, viaCep?.bairro, viaCep?.localidade, viaCep?.uf].filter(Boolean).join(', '),
    address: {
      road: viaCep?.logradouro ?? nominatim?.address.road,
      suburb: viaCep?.bairro ?? nominatim?.address.suburb,
      neighbourhood: nominatim?.address.neighbourhood,
      quarter: nominatim?.address.quarter,
      city_district: nominatim?.address.city_district,
      city: viaCep?.localidade ?? nominatim?.address.city,
      town: nominatim?.address.town,
      village: nominatim?.address.village,
      municipality: nominatim?.address.municipality,
      state: viaCep?.uf ?? nominatim?.address.state,
      postcode: viaCep?.cep ?? nominatim?.address.postcode,
    },
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<NominatimResult | null> {
  const url = `${BASE_URL}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`

  try {
    const res = await fetch(url, { headers: HEADERS })
    return (await res.json()) as NominatimResult
  } catch {
    return null
  }
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

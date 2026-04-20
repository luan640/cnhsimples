import { NextResponse } from 'next/server'

import { searchByCEP } from '@/lib/nominatim'
import type { CepLookupResult, NominatimResult } from '@/types'

function pickNeighborhood(result: NominatimResult) {
  return (
    result.address.suburb ??
    result.address.neighbourhood ??
    result.address.quarter ??
    result.address.city_district ??
    ''
  )
}

function pickCity(result: NominatimResult) {
  return (
    result.address.city ??
    result.address.town ??
    result.address.village ??
    result.address.municipality ??
    ''
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cep = searchParams.get('cep') ?? ''

  if (!cep) {
    return NextResponse.json({ error: 'CEP e obrigatorio.' }, { status: 400 })
  }

  const result = await searchByCEP(cep)

  if (!result) {
    return NextResponse.json({ error: 'CEP nao encontrado.' }, { status: 404 })
  }

  const normalized: CepLookupResult = {
    cep: result.address.postcode ?? cep,
    street: result.address.road ?? '',
    neighborhood: pickNeighborhood(result),
    city: pickCity(result),
    state: result.address.state ?? 'CE',
    latitude: result.lat ?? '',
    longitude: result.lon ?? '',
    display_name: result.display_name ?? '',
  }

  return NextResponse.json(normalized)
}

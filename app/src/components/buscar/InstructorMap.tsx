'use client'

import { useEffect, useRef } from 'react'
import type { Circle, Map, Marker } from 'leaflet'

export type MapInstructor = {
  id: string
  full_name: string
  photo_url: string | null
  neighborhood: string
  rating: number
  hourly_rate: number
  category: string
  distance_km?: number
  latitude: number
  longitude: number
}

type Props = {
  instructors: MapInstructor[]
  userCoords: { lat: number; lng: number } | null
  radiusKm: number
}

const FORTALEZA_CENTER = { lat: -3.7318, lng: -38.5267 }

export function InstructorMap({ instructors, userCoords, radiusKm }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const markersRef = useRef<Marker[]>([])
  const circleRef = useRef<Circle | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (mapRef.current) return

    import('leaflet').then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const center = userCoords ?? FORTALEZA_CENTER
      const map = L.map(containerRef.current!, {
        center: [center.lat, center.lng],
        zoom: userCoords ? 13 : 12,
        zoomControl: true,
        scrollWheelZoom: true,
      })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      if (userCoords) {
        circleRef.current = L.circle([userCoords.lat, userCoords.lng], {
          radius: radiusKm * 1000,
          color: '#3ECF8E',
          fillColor: '#3ECF8E',
          fillOpacity: 0.08,
          weight: 2,
        }).addTo(map)

        const userIcon = L.divIcon({
          className: '',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          html: '<div style="width:14px;height:14px;border-radius:50%;background:#3ECF8E;border:3px solid white;box-shadow:0 0 0 2px #3ECF8E;"></div>',
        })
        L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
          .bindTooltip('Sua localização', { permanent: false, direction: 'top' })
          .addTo(map)
      }

      for (const instructor of instructors) {
        const initials = instructor.full_name
          .split(' ')
          .slice(0, 2)
          .map((n) => n[0].toUpperCase())
          .join('')

        const avatarHtml = instructor.photo_url
          ? `<img src="${instructor.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#64748B;background:#F1F5F9;border-radius:50%;">${initials}</div>`

        const icon = L.divIcon({
          className: '',
          iconSize: [44, 44],
          iconAnchor: [22, 44],
          popupAnchor: [0, -46],
          html: `
            <div style="
              width:44px;height:44px;
              border-radius:50%;
              border:3px solid white;
              box-shadow:0 2px 8px rgba(0,0,0,0.25);
              overflow:hidden;
              background:white;
              cursor:pointer;
            ">
              ${avatarHtml}
            </div>
            <div style="
              width:0;height:0;
              border-left:6px solid transparent;
              border-right:6px solid transparent;
              border-top:8px solid white;
              margin:-1px auto 0;
              filter:drop-shadow(0 2px 2px rgba(0,0,0,0.15));
            "></div>
          `,
        })

        const formatBRL = (v: number) =>
          v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })

        const distanceLabel =
          instructor.distance_km != null
            ? `<span style="color:#64748B;font-size:11px;">Distância: ${instructor.distance_km.toFixed(1)} km</span>`
            : ''

        const popupHtml = `
          <div style="
            min-width:200px;max-width:240px;
            font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
            padding:4px 2px;
          ">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <div style="width:48px;height:48px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#F1F5F9;">
                ${
                  instructor.photo_url
                    ? `<img src="${instructor.photo_url}" style="width:100%;height:100%;object-fit:cover;" />`
                    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#64748B;">${initials}</div>`
                }
              </div>
              <div>
                <p style="margin:0;font-size:13px;font-weight:600;color:#0F172A;line-height:1.3;">${instructor.full_name}</p>
                <p style="margin:2px 0 0;font-size:11px;color:#64748B;">Cat. ${instructor.category} · ${instructor.neighborhood}</p>
              </div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:12px;color:#F59E0B;font-weight:600;">★ ${instructor.rating.toFixed(1)}</span>
              ${distanceLabel}
            </div>
            <div style="background:#F8FAFC;border-radius:8px;padding:8px;margin-bottom:10px;">
              <p style="margin:0;font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">A partir de</p>
              <p style="margin:2px 0 0;font-size:18px;font-weight:700;color:#0284C7;">${formatBRL(instructor.hourly_rate)}<span style="font-size:12px;font-weight:400;color:#94A3B8;">/aula</span></p>
            </div>
            <a href="/instrutor/${instructor.id}" style="
              display:block;
              background:#F97316;
              color:white;
              text-decoration:none;
              text-align:center;
              padding:8px 12px;
              border-radius:6px;
              font-size:13px;
              font-weight:600;
            ">Ver horários</a>
          </div>
        `

        const marker = L.marker([instructor.latitude, instructor.longitude], { icon })
          .bindPopup(popupHtml, { maxWidth: 260, closeButton: true })
          .addTo(map)

        markersRef.current.push(marker)
      }

      if (instructors.length > 0) {
        const group = L.featureGroup(markersRef.current)
        if (circleRef.current) group.addLayer(circleRef.current)
        map.fitBounds(group.getBounds().pad(0.15))
      }
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current = []
      circleRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '500px' }} />
    </>
  )
}

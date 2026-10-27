import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Report } from '../types'
import { LEVELS } from '../levels'
import { QUARTIERS, LOME_CENTER, quartierById } from '../quartiers'
import { formatTime, STATUS_LABEL } from '../format'
import { reportTag, reportTitle } from '../testLabel'
import { LevelIcon } from './Icons'

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">contributeurs OpenStreetMap</a>'

function pinIcon(r: Report) {
  const tag = reportTag(r)
  const m = LEVELS[r.level]
  const w = tag ? 40 : 22
  return L.divIcon({
    className: `ts-pin ${r.status === 'en_attente' ? 'pending' : ''}`,
    html: tag
      ? `<span class="pill" style="--c:${m.color};--k:${m.ink}">${tag}</span>`
      : `<span class="dot" style="--c:${m.color}"></span>`,
    iconSize: [w, 22],
    iconAnchor: [w / 2, 11],
    popupAnchor: [0, -12],
  })
}

function FlyTo({ target, fitAll }: { target: [number, number, number] | null; fitAll: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target[0], target[1]], target[2], { duration: 0.8 })
    else if (fitAll) map.fitBounds(L.latLngBounds(QUARTIERS.map((q) => [q.lat, q.lng] as [number, number])).pad(0.12), { padding: [8, 8] })
  }, [target, fitAll, map])
  return null
}

function ClickCatcher({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick?.(e.latlng.lat, e.latlng.lng) })
  return null
}

export function ReportPopup({ r }: { r: Report }) {
  const q = quartierById(r.quartier)
  const meta = LEVELS[r.level]
  return (
    <article aria-label={reportTitle(r, q?.name)} className="text-ink">
      {r.photo ? (
        <img src={r.photo} alt={r.isTest ? 'Illustration de démonstration (TEST), pas une vraie photo' : 'Photo du signalement'} className="block h-[136px] w-full object-cover" />
      ) : (
        <div className="flex h-16 items-center justify-center bg-mist text-xs text-lagoon">Sans photo</div>
      )}
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2.5">
          <span className="rounded-xl p-0.5" style={{ background: meta.color + '33' }}>
            <LevelIcon level={r.level} size={40} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[17px] font-bold leading-tight">{meta.label}</div>
            <div className="truncate text-[13px] text-lagoon">{q?.name ?? 'Quartier non précisé'}</div>
          </div>
          {r.isTest && <span className="rounded-md border border-black/40 bg-test px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider">TEST</span>}
        </div>
        <div className="space-y-1.5 text-[12px]">
          <time dateTime={r.createdAt} className="block text-ink/70">{formatTime(r.createdAt)}</time>
          <span className={`inline-block rounded-full px-2 py-0.5 font-semibold ${r.status === 'valide' ? 'bg-[#DDF1E6] text-[#1D6B45]' : r.status === 'rejete' ? 'bg-[#F6DCDA] text-[#8E2A22]' : 'bg-[#FFF1CC] text-[#7A5600]'}`}>
            {STATUS_LABEL[r.status]}
          </span>
        </div>
      </div>
    </article>
  )
}

interface Props {
  reports: Report[]
  focus?: [number, number, number] | null
  selectedQuartier?: string | null
  onPick?: (lat: number, lng: number) => void
  picked?: { lat: number; lng: number } | null
  showQuartiers?: boolean
  zoom?: number
  className?: string
}

export function MapView({ reports, focus = null, selectedQuartier, onPick, picked, showQuartiers = true, zoom = 13, className }: Props) {
  const newIcon = useMemo(() => L.divIcon({ className: 'ts-pin ts-pin-new', html: '<span class="dot"></span>', iconSize: [28, 28], iconAnchor: [14, 14] }), [])
  return (
    <MapContainer center={LOME_CENTER} zoom={zoom} zoomControl={false} className={className} style={{ height: '100%', width: '100%' }}>
      <TileLayer url={OSM_URL} attribution={OSM_ATTR} maxZoom={19} />
      <FlyTo target={focus} fitAll={!onPick} />
      {!onPick && <ZoomControl position="bottomright" />}
      {onPick && <ClickCatcher onPick={onPick} />}
      {showQuartiers &&
        QUARTIERS.map((q) => (
          <Circle
            key={q.id}
            center={[q.lat, q.lng]}
            radius={1100}
            pathOptions={{ color: '#0B2E36', weight: selectedQuartier === q.id ? 2.5 : 1.2, dashArray: '4 6', fillColor: '#7FD3D0', fillOpacity: selectedQuartier === q.id ? 0.18 : 0.07 }}
          >
            <Tooltip direction="top" offset={[0, -6]} permanent={selectedQuartier === q.id}>{q.name}</Tooltip>
          </Circle>
        ))}
      {reports.map((r) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={pinIcon(r)} title={reportTitle(r, quartierById(r.quartier)?.name)}>
          <Popup closeButton autoPanPaddingTopLeft={[12, 150]} autoPanPaddingBottomRight={[12, 24]}>
            <ReportPopup r={r} />
          </Popup>
        </Marker>
      ))}
      {picked && <Marker position={[picked.lat, picked.lng]} icon={newIcon} title="Position choisie" />}
    </MapContainer>
  )
}

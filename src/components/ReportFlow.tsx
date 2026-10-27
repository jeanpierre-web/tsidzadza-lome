import { useState } from 'react'
import type { Level, NewReport } from '../types'
import { LEVELS, LEVEL_ORDER } from '../levels'
import { QUARTIERS, nearestQuartier } from '../quartiers'
import { MapView } from './MapView'
import { ArrowLeft, CameraIcon, CheckIcon, LevelIcon, TargetIcon, XIcon } from './Icons'

/** Réduit la photo (≤ 800 px, JPEG) pour tenir dans le stockage local. */
async function compress(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image()
      i.onload = () => res(i)
      i.onerror = rej
      i.src = url
    })
    const scale = Math.min(1, 800 / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * scale)
    c.height = Math.round(img.height * scale)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.7)
  } finally {
    URL.revokeObjectURL(url)
  }
}

const STEPS = ['Photo', 'Lieu', 'Niveau', 'Envoyer'] as const

export function ReportFlow({ onClose, onSubmit }: { onClose: () => void; onSubmit: (r: NewReport) => Promise<void> }) {
  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState<string>()
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null)
  const [quartier, setQuartier] = useState<string>()
  const [level, setLevel] = useState<Level>()
  const [geoState, setGeoState] = useState<'idle' | 'busy' | 'error'>('idle')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string>()

  const pick = (lat: number, lng: number) => {
    setPos({ lat, lng })
    setQuartier((q) => q ?? nearestQuartier(lat, lng).id)
  }
  const locate = () => {
    if (!navigator.geolocation) return setGeoState('error')
    setGeoState('busy')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeoState('idle')
        pick(p.coords.latitude, p.coords.longitude)
      },
      () => setGeoState('error'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }
  const canNext = step === 0 ? true : step === 1 ? !!pos : step === 2 ? !!level : true
  const submit = async () => {
    if (!pos || !level) return
    try {
      await onSubmit({ lat: pos.lat, lng: pos.lng, level, quartier, photo })
      setDone(true)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (done)
    return (
      <div className="fixed inset-0 z-[1200] flex flex-col items-center justify-center gap-5 bg-ink p-8 text-center text-white">
        <span className="rise flex h-24 w-24 items-center justify-center rounded-full bg-aqua text-ink"><CheckIcon size={52} /></span>
        <h2 className="font-display text-3xl font-extrabold">Merci&nbsp;!</h2>
        <p className="max-w-xs text-white/80">Ton signalement est <b>en attente de modération</b>. Il apparaît en pointillés sur la carte.</p>
        <p className="rounded-md bg-test px-2 py-1 text-xs font-extrabold text-black">PROTOTYPE — TEST</p>
        <button className="mt-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-ink" onClick={onClose}>Voir la carte</button>
      </div>
    )

  return (
    <div role="dialog" aria-modal="true" aria-label="Signaler une inondation" className="fixed inset-0 z-[1200] flex flex-col bg-shell">
      <header className="flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <button aria-label={step ? 'Retour' : 'Fermer'} onClick={() => (step ? setStep(step - 1) : onClose())} className="flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-ink/10">
          {step ? <ArrowLeft /> : <XIcon />}
        </button>
        <ol className="flex flex-1 items-center gap-1.5" aria-label="Étapes">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1" aria-current={i === step ? 'step' : undefined}>
              <span className={`block h-1.5 rounded-full ${i <= step ? 'bg-ink' : 'bg-ink/15'}`} />
              <span className={`mt-1 block text-center text-[11px] font-semibold ${i === step ? 'text-ink' : 'text-ink/45'}`}>{s}</span>
            </li>
          ))}
        </ol>
        <span className="rounded-md border border-black/40 bg-test px-1.5 py-0.5 text-[10px] font-extrabold">TEST</span>
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        {step === 0 && (
          <div className="rise flex flex-1 flex-col gap-4">
            <h2 className="font-display text-2xl font-extrabold">Prends une photo</h2>
            <label className="relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-[28px] border-2 border-dashed border-ink/25 bg-white text-lagoon">
              {photo ? (
                <img src={photo} alt="Photo choisie" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <>
                  <span className="flex h-24 w-24 items-center justify-center rounded-full bg-mist text-ink"><CameraIcon size={48} /></span>
                  <span className="font-semibold">Photo</span>
                </>
              )}
              <input type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Prendre ou choisir une photo" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await compress(f)) }} />
            </label>
            <p className="text-center text-xs text-ink/55">Évite les visages et les plaques d'immatriculation.</p>
          </div>
        )}

        {step === 1 && (
          <div className="rise flex min-h-0 flex-1 flex-col gap-3">
            <h2 className="font-display text-2xl font-extrabold">Où&nbsp;?</h2>
            <button onClick={locate} className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-4 text-lg font-bold text-white">
              <TargetIcon /> {geoState === 'busy' ? 'Recherche…' : 'Ma position'}
            </button>
            {geoState === 'error' && <p className="text-sm font-semibold text-taille">Position indisponible : touche la carte.</p>}
            <div className="relative min-h-[220px] flex-1 overflow-hidden rounded-[24px] ring-1 ring-ink/15">
              <MapView reports={[]} onPick={pick} picked={pos} focus={pos ? [pos.lat, pos.lng, 15] : null} zoom={12} />
              {!pos && <span className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold shadow">👆 Touche la carte</span>}
            </div>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="radiogroup" aria-label="Quartier (facultatif)">
              {QUARTIERS.map((q) => (
                <button key={q.id} role="radio" aria-checked={quartier === q.id} onClick={() => setQuartier(quartier === q.id ? undefined : q.id)} className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ${quartier === q.id ? 'bg-ink text-white' : 'bg-white ring-1 ring-ink/15'}`}>
                  {q.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rise flex flex-1 flex-col gap-3">
            <h2 className="font-display text-2xl font-extrabold">L'eau monte jusqu'où&nbsp;?</h2>
            <div className="grid flex-1 grid-cols-1 gap-3" role="radiogroup" aria-label="Niveau de l'eau">
              {LEVEL_ORDER.map((l) => {
                const m = LEVELS[l]
                const on = level === l
                return (
                  <button key={l} role="radio" aria-checked={on} aria-label={m.ariaLabel} onClick={() => setLevel(l)}
                    className={`flex items-center gap-4 rounded-[24px] p-3 text-left transition ${on ? 'ring-4 ring-ink' : 'ring-1 ring-ink/10'}`}
                    style={{ background: on ? m.color : m.color + '2E' }}>
                    <span className="rounded-2xl bg-white p-1.5 shadow-sm"><LevelIcon level={l} size={76} /></span>
                    <span className="flex-1 font-display text-2xl font-extrabold" style={{ color: on ? m.ink : '#0B2E36' }}>{m.label}</span>
                    <span className={`mr-2 flex h-9 w-9 items-center justify-center rounded-full ${on ? 'bg-ink text-white' : 'bg-white/70 text-transparent'}`}><CheckIcon size={20} /></span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 3 && level && pos && (
          <div className="rise flex flex-1 flex-col gap-3">
            <h2 className="font-display text-2xl font-extrabold">Vérifie et envoie</h2>
            <div className="overflow-hidden rounded-[24px] bg-white ring-1 ring-ink/10">
              {photo ? <img src={photo} alt="Photo du signalement" className="h-44 w-full object-cover" /> : <div className="flex h-24 items-center justify-center bg-mist text-sm text-lagoon"><CameraIcon /> &nbsp;Sans photo</div>}
              <div className="flex items-center gap-3 p-4">
                <LevelIcon level={level} size={56} />
                <div>
                  <div className="font-display text-xl font-bold">{LEVELS[level].label}</div>
                  <div className="text-sm text-lagoon">{QUARTIERS.find((q) => q.id === quartier)?.name ?? 'Quartier non précisé'} · {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}</div>
                </div>
              </div>
            </div>
            <p className="rounded-2xl bg-mist p-3 text-sm text-ink/80">Le signalement sera vérifié par une personne de modération avant d'être validé. Prototype : il est enregistré uniquement sur cet appareil et marqué <b>TEST</b>.</p>
            {error && <p className="text-sm font-semibold text-taille">{error}</p>}
          </div>
        )}
      </main>

      <footer className="px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        {step < 3 ? (
          <button disabled={!canNext} onClick={() => setStep(step + 1)} className="w-full rounded-full bg-ink py-4 text-lg font-bold text-white disabled:bg-ink/25">
            {step === 0 && !photo ? 'Continuer sans photo' : 'Suivant'}
          </button>
        ) : (
          <button onClick={submit} className="w-full rounded-full bg-laterite py-4 text-lg font-bold text-white shadow-lg shadow-laterite/30">Envoyer</button>
        )}
      </footer>
    </div>
  )
}

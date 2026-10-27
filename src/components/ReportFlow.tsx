import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { Level, NewReport, Report } from '../types'
import { LEVELS, LEVEL_ORDER } from '../levels'
import { QUARTIERS, nearestQuartier } from '../quartiers'
import { geoErrorKind, geoFailureMessage } from '../geo'
import { compressImage, photoErrorMessage } from '../media/compressImage'
import { reviewNotice, thanksDetail } from '../reportCopy'
import { MapView } from './MapView'
import { ArrowLeft, CameraIcon, CheckIcon, ImageIcon, LevelIcon, TargetIcon, XIcon } from './Icons'

const STEPS = ['Photo', 'Lieu', 'Niveau', 'Envoyer'] as const

function quartierName(id?: string): string {
  return QUARTIERS.find((q) => q.id === id)?.name ?? 'Quartier non précisé'
}

function onRadioKey(e: ReactKeyboardEvent<HTMLDivElement>, ids: string[], current: string | undefined, choose: (id: string) => void) {
  const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
  if (!dir) return
  e.preventDefault()
  const start = Math.max(0, ids.indexOf(current ?? ids[0]))
  const next = ids[(start + dir + ids.length) % ids.length]
  choose(next)
  e.currentTarget.querySelector<HTMLElement>(`[data-value="${next}"]`)?.focus()
}

export function ReportFlow({
  onClose,
  onSubmit,
  shared,
}: {
  onClose: () => void
  onSubmit: (r: NewReport) => Promise<Report>
  shared: boolean
}) {
  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState<string>()
  const [photoState, setPhotoState] = useState<'idle' | 'busy' | 'error'>('idle')
  const [photoError, setPhotoError] = useState<string>()
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null)
  const [quartier, setQuartier] = useState<string>()
  const [level, setLevel] = useState<Level>()
  const [geoState, setGeoState] = useState<'idle' | 'busy' | 'error'>('idle')
  const [geoMessage, setGeoMessage] = useState<string>()
  const [sending, setSending] = useState(false)
  const [saved, setSaved] = useState<Report | null>(null)
  const [error, setError] = useState<string>()
  const dialogRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const pick = (lat: number, lng: number) => {
    setPos({ lat, lng })
    setQuartier((q) => q ?? nearestQuartier(lat, lng).id)
  }
  const locate = () => {
    if (!navigator.geolocation) {
      setGeoState('error')
      setGeoMessage(geoFailureMessage('unsupported'))
      return
    }
    setGeoState('busy')
    setGeoMessage(undefined)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeoState('idle')
        pick(p.coords.latitude, p.coords.longitude)
      },
      (err) => {
        setGeoState('error')
        setGeoMessage(geoFailureMessage(geoErrorKind(err)))
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120_000 },
    )
  }
  const onFile = async (file: File | undefined, input: HTMLInputElement) => {
    input.value = ''
    if (!file) return
    setPhotoState('busy')
    setPhotoError(undefined)
    try {
      setPhoto((await compressImage(file)).dataUrl)
      setPhotoState('idle')
    } catch (e) {
      setPhotoState('error')
      setPhotoError(photoErrorMessage(e))
    }
  }
  const canNext = photoState !== 'busy' && (step === 0 || (step === 1 ? !!pos : step === 2 ? !!level : true))
  const submit = async () => {
    if (sending || !pos || !level) return
    setSending(true)
    setError(undefined)
    try {
      setSaved(await onSubmit({ lat: pos.lat, lng: pos.lng, level, quartier, photo }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Envoi impossible. Réessaie.')
      setSending(false)
    }
  }

  useEffect(() => {
    headingRef.current?.focus()
  }, [step, saved])

  useEffect(() => {
    const root = dialogRef.current
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (sending) return
        e.preventDefault()
        if (saved) onClose()
        else if (step > 0) setStep((s) => s - 1)
        else onClose()
        return
      }
      if (e.key !== 'Tab' || !root) return
      const items = [...root.querySelectorAll<HTMLElement>('a, button, input, select, textarea')].filter((el) => !el.hasAttribute('disabled'))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, saved, sending, step])

  if (saved && level)
    return (
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="report-heading" className="fixed inset-0 z-[1200] flex flex-col bg-ink px-6 pt-[max(env(safe-area-inset-top),24px)] pb-[max(env(safe-area-inset-bottom),24px)] text-center text-white">
        <div className="flex flex-1 flex-col items-center justify-center gap-5">
          <span className="rise flex h-36 w-36 items-center justify-center rounded-[32px] bg-white">
            <LevelIcon level={level} size={112} />
          </span>
          <h2 id="report-heading" ref={headingRef} tabIndex={-1} className="font-display text-4xl font-extrabold outline-none">Merci&nbsp;!</h2>
          <p className="max-w-xs text-lg leading-snug text-white/85">{thanksDetail({ shared, pendingSync: !!saved.pendingSync, photoDropped: !!photo && !saved.photo && !saved.pendingSync })}</p>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold">
            <span className="h-5 w-5 rounded-full border-2 border-dashed border-white" aria-hidden />
            En attente
          </p>
          <p className="rounded-md bg-test px-2 py-1 text-xs font-extrabold text-black">PROTOTYPE — TEST</p>
        </div>
        <button type="button" className="mt-4 min-h-14 w-full rounded-full bg-white text-lg font-bold text-ink" onClick={onClose}>Voir la carte</button>
      </div>
    )

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="report-heading" className="fixed inset-0 z-[1200] flex flex-col bg-shell">
      <header className="flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <button type="button" aria-label={step ? 'Retour' : 'Fermer'} onClick={() => (step ? setStep(step - 1) : onClose())} className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-ink/10">
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
      <p className="sr-only" aria-live="polite">Étape {step + 1} sur 4 : {STEPS[step]}</p>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4">
        {step === 0 && (
          <div className="rise flex min-h-0 flex-1 flex-col gap-3">
            <h2 id="report-heading" ref={headingRef} tabIndex={-1} className="font-display text-[1.7rem] font-extrabold outline-none">Prends une photo</h2>
            <div className="relative flex min-h-44 flex-1 items-center justify-center overflow-hidden rounded-[28px] bg-white ring-1 ring-ink/10">
              {photo ? (
                <img src={photo} alt="Photo choisie" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="flex h-28 w-28 items-center justify-center rounded-full bg-mist text-ink"><CameraIcon size={56} /></span>
              )}
              {photoState === 'busy' && (
                <div role="status" className="absolute inset-0 flex items-center justify-center bg-ink/55 text-lg font-bold text-white">Réduction…</div>
              )}
            </div>
            {photoError && <p role="alert" className="text-center text-sm font-semibold text-taille">{photoError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <label className="flex min-h-[4.5rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-3xl bg-ink py-3 text-white">
                <CameraIcon size={30} />
                <span className="text-base font-bold">Appareil</span>
                <input data-source="camera" type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Prendre une photo" onChange={(e) => onFile(e.target.files?.[0], e.target)} />
              </label>
              <label className="flex min-h-[4.5rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-3xl bg-white py-3 ring-1 ring-ink/15">
                <ImageIcon size={30} />
                <span className="text-base font-bold">Galerie</span>
                <input data-source="gallery" type="file" accept="image/*" className="sr-only" aria-label="Choisir une photo dans la galerie" onChange={(e) => onFile(e.target.files?.[0], e.target)} />
              </label>
            </div>
            <p className="text-center text-xs text-ink/55">Évite les visages et les plaques d'immatriculation.</p>
          </div>
        )}

        {step === 1 && (
          <div className="rise flex min-h-0 flex-1 flex-col gap-3">
            <h2 id="report-heading" ref={headingRef} tabIndex={-1} className="font-display text-[1.7rem] font-extrabold outline-none">Où&nbsp;?</h2>
            <button type="button" onClick={locate} disabled={geoState === 'busy'} aria-busy={geoState === 'busy'} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-lg font-bold text-white disabled:opacity-70">
              <TargetIcon /> {geoState === 'busy' ? 'Recherche…' : geoState === 'error' ? 'Réessayer la position' : 'Ma position'}
            </button>
            {geoMessage && <p role="alert" className="rounded-2xl bg-white px-3 py-3 text-center text-base font-semibold leading-snug text-taille ring-1 ring-taille/30">{geoMessage}</p>}
            {pos && (
              <p role="status" className="flex items-center justify-center gap-2 text-base font-bold">
                <CheckIcon size={20} /> {quartierName(quartier)}
              </p>
            )}
            <div className="relative min-h-[200px] flex-1 overflow-hidden rounded-[24px] ring-1 ring-ink/15">
              <MapView reports={[]} onPick={pick} picked={pos} focus={pos ? [pos.lat, pos.lng, 16] : null} zoom={12} />
              {!pos && <span className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full bg-white/95 px-3 py-1.5 text-sm font-semibold shadow">Touche la carte</span>}
            </div>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="Quartier" onKeyDown={(e) => onRadioKey(e, QUARTIERS.map((q) => q.id), quartier, setQuartier)}>
              {QUARTIERS.map((q, i) => {
                const on = quartier === q.id
                return (
                  <button key={q.id} type="button" role="radio" aria-checked={on} data-value={q.id} tabIndex={on || (!quartier && i === 0) ? 0 : -1} onClick={() => setQuartier(on ? undefined : q.id)} className={`min-h-12 shrink-0 rounded-full px-4 text-base font-semibold ${on ? 'bg-ink text-white' : 'bg-white ring-1 ring-ink/15'}`}>
                    {q.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="rise flex flex-1 flex-col gap-3">
            <h2 id="report-heading" ref={headingRef} tabIndex={-1} className="font-display text-[1.7rem] font-extrabold outline-none">L'eau monte jusqu'où&nbsp;?</h2>
            <div className="grid flex-1 grid-cols-1 gap-3" role="radiogroup" aria-label="Niveau de l'eau" onKeyDown={(e) => onRadioKey(e, [...LEVEL_ORDER], level, (id) => setLevel(id as Level))}>
              {LEVEL_ORDER.map((l, i) => {
                const m = LEVELS[l]
                const on = level === l
                return (
                  <button key={l} type="button" role="radio" aria-checked={on} aria-label={m.ariaLabel} data-value={l} tabIndex={on || (!level && i === 0) ? 0 : -1} onClick={() => setLevel(l)}
                    className={`flex min-h-[5.5rem] items-center gap-4 rounded-[24px] p-3 text-left ${on ? 'ring-4 ring-ink' : 'ring-1 ring-ink/10'}`}
                    style={{ background: on ? m.color : m.color + '2E' }}>
                    <span className="rounded-2xl bg-white p-1.5 shadow-sm"><LevelIcon level={l} size={76} /></span>
                    <span className="flex-1 font-display text-2xl font-extrabold" style={{ color: on ? m.ink : '#0B2E36' }}>{m.label}</span>
                    <span className={`mr-1 flex h-11 w-11 items-center justify-center rounded-full ${on ? 'bg-ink text-white' : 'bg-white/70 text-transparent'}`}><CheckIcon size={22} /></span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 3 && level && pos && (
          <div className="rise flex flex-1 flex-col gap-3">
            <h2 id="report-heading" ref={headingRef} tabIndex={-1} className="font-display text-[1.7rem] font-extrabold outline-none">Vérifie et envoie</h2>
            <div className="overflow-hidden rounded-[24px] bg-white ring-1 ring-ink/10">
              {photo ? <img src={photo} alt="Photo du signalement" className="h-44 w-full object-cover" /> : <div className="flex h-24 items-center justify-center gap-2 bg-mist text-sm font-semibold text-lagoon"><CameraIcon /> Sans photo</div>}
              <div className="flex items-center gap-3 p-4">
                <LevelIcon level={level} size={64} />
                <div>
                  <div className="font-display text-xl font-bold">{LEVELS[level].label}</div>
                  <div className="text-base font-semibold text-lagoon">{quartierName(quartier)}</div>
                </div>
              </div>
            </div>
            <p className="rounded-2xl bg-mist p-3 text-sm leading-relaxed text-ink/80">{reviewNotice(shared)}</p>
          </div>
        )}
      </main>

      <footer className="px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        {error && <p role="alert" className="mb-2 text-center text-sm font-semibold text-taille">{error}</p>}
        {step < 3 ? (
          <button type="button" disabled={!canNext} onClick={() => setStep(step + 1)} className="min-h-14 w-full rounded-full bg-ink text-lg font-bold text-white disabled:bg-ink/25">
            {step === 0 && !photo ? 'Continuer sans photo' : 'Suivant'}
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={sending || !pos || !level} aria-busy={sending} className="min-h-14 w-full rounded-full bg-laterite text-lg font-bold text-white shadow-lg shadow-laterite/30 disabled:opacity-70">
            {sending ? 'Envoi…' : 'Envoyer'}
          </button>
        )}
      </footer>
    </div>
  )
}

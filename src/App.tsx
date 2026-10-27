import { useCallback, useEffect, useMemo, useState } from 'react'
import type { NewReport, Report, Status } from './types'
import { createStore } from './data'
import { LEVELS, LEVEL_ORDER } from './levels'
import { quartierById } from './quartiers'
import { TEST_BANNER } from './testLabel'
import { MapView } from './components/MapView'
import { QuartierPanel } from './components/QuartierPanel'
import { ReportFlow } from './components/ReportFlow'
import { AlertSlot } from './components/AlertSlot'
import { Moderation } from './components/Moderation'
import { DropLogo, LevelIcon, ListIcon, PhoneIcon, PinIcon, XIcon } from './components/Icons'

const store = createStore()

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const f = () => setHash(window.location.hash)
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  const go = (h: string) => { window.location.hash = h }
  return [hash.replace(/^#\/?/, ''), go] as const
}

function TestBanner() {
  return (
    <div role="status" className="test-stripes border-y border-black/30 px-3 py-1.5 text-center text-[12px] font-extrabold tracking-[.08em] text-black">
      {TEST_BANNER}
    </div>
  )
}

function Emergency({ dark = false }: { dark?: boolean }) {
  return (
    <a href="tel:170" className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${dark ? 'bg-white text-ink' : 'bg-taille text-white'}`} aria-label="Urgence : appeler le 170">
      <PhoneIcon size={16} /> Urgence : 170
    </a>
  )
}

function Brand() {
  return (
    <a href="#/" className="flex items-center gap-2.5">
      <DropLogo size={34} />
      <span className="leading-none">
        <span className="block font-display text-[19px] font-extrabold tracking-tight">TSIDZADZA</span>
        <span className="block text-[11px] font-semibold uppercase tracking-[.22em] text-lagoon">Lomé · prototype</span>
      </span>
    </a>
  )
}

function Legend() {
  return (
    <div className="flex gap-1.5 rounded-2xl bg-white/95 p-1.5 shadow-md ring-1 ring-ink/10 backdrop-blur" aria-label="Légende des niveaux">
      {LEVEL_ORDER.map((l) => (
        <div key={l} className="flex flex-col items-center rounded-xl px-1.5 pt-1 pb-0.5" style={{ background: LEVELS[l].color + '30' }}>
          <LevelIcon level={l} size={34} />
          <span className="text-[10px] font-bold">{LEVELS[l].label}</span>
        </div>
      ))}
      <div className="flex flex-col items-center justify-center px-1 text-[10px] font-semibold text-ink/70">
        <span className="mb-1 block h-4 w-4 rounded-full border-[3px] border-dashed border-ink/60 bg-white" />
        Attente
      </div>
    </div>
  )
}

export default function App() {
  const [route, go] = useHashRoute()
  const [reports, setReports] = useState<Report[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const refresh = useCallback(async () => setReports(await store.list()), [])
  useEffect(() => { refresh() }, [refresh])

  const visible = useMemo(() => reports.filter((r) => r.status !== 'rejete' && (!selected || r.quartier === selected)), [reports, selected])
  const focus = useMemo<[number, number, number] | null>(() => {
    const q = quartierById(selected ?? undefined)
    return q ? [q.lat, q.lng, 15] : null
  }, [selected])

  const submit = async (r: NewReport) => { await store.add(r); await refresh() }
  const setStatus = async (id: string, s: Status) => { await store.setStatus(id, s); await refresh() }

  if (route === 'moderation')
    return (
      <div className="min-h-full bg-sand">
        <header className="flex items-center justify-between bg-shell px-4 py-3 ring-1 ring-ink/10"><Brand /><a href="#/" className="text-sm font-semibold underline">Carte</a></header>
        <TestBanner />
        <Moderation reports={reports} onStatus={setStatus} onReset={async () => { await store.reset(); await refresh() }} />
      </div>
    )

  const sheetOpen = route === 'quartiers'
  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Barre latérale (desktop) */}
      <aside className="hidden w-[400px] shrink-0 flex-col gap-4 overflow-y-auto bg-shell p-5 ring-1 ring-ink/10 lg:flex">
        <div className="flex items-center justify-between"><Brand /><Emergency /></div>
        <p className="text-[14px] leading-relaxed text-ink/75">Carte citoyenne des inondations du Grand Lomé. Les habitants signalent l'eau avec une photo, un lieu et un pictogramme.</p>
        <button onClick={() => go('/signaler')} className="flex items-center justify-center gap-2 rounded-full bg-laterite py-3.5 text-lg font-bold text-white shadow-lg shadow-laterite/25"><PinIcon /> Signaler</button>
        <QuartierPanel reports={reports} selected={selected} onSelect={setSelected} />
        <AlertSlot />
        <footer className="space-y-1 text-[11px] leading-snug text-ink/55">
          <p>Numéros d'urgence relayés par l'ANPC : 170, 118, 1014, 1244, 171. Ce site n'est pas un service d'urgence.</p>
          <p><a className="underline" href="#/moderation">Modération (prototype)</a></p>
        </footer>
      </aside>

      {/* Mobile : en-tête */}
      <header className="flex items-center justify-between bg-shell px-4 pt-[max(env(safe-area-inset-top),10px)] pb-2.5 lg:hidden"><Brand /><Emergency /></header>

      <div className="flex min-h-0 flex-1 flex-col">
        <TestBanner />
        <div className="relative min-h-0 flex-1">
          <MapView reports={visible} focus={focus} selectedQuartier={selected} />
          <div className="pointer-events-none absolute left-3 top-3 z-[500]"><div className="pointer-events-auto"><Legend /></div></div>
          {selected && (
            <button onClick={() => setSelected(null)} className="absolute right-3 top-3 z-[500] inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-2 text-sm font-semibold text-white shadow-md">
              {quartierById(selected)?.name} <XIcon size={16} />
            </button>
          )}
        </div>

        {/* Mobile : barre d'actions */}
        <nav className="flex gap-2.5 bg-shell px-3 pt-2.5 pb-[max(env(safe-area-inset-bottom),12px)] ring-1 ring-ink/10 lg:hidden">
          <button onClick={() => go('/quartiers')} className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl bg-white py-2 text-[13px] font-semibold ring-1 ring-ink/15">
            <ListIcon /> Quartiers
          </button>
          <button onClick={() => go('/signaler')} className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-laterite py-3 text-xl font-bold text-white shadow-lg shadow-laterite/30">
            <PinIcon size={26} /> Signaler
          </button>
        </nav>
      </div>

      {/* Mobile : panneau quartiers */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[1100] flex flex-col justify-end bg-ink/40 lg:hidden" onClick={() => go('/')}>
          <div className="rise max-h-[88%] overflow-y-auto rounded-t-[28px] bg-shell p-4 pb-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20" />
            <QuartierPanel reports={reports} selected={selected} onSelect={(id) => { setSelected(id); if (id) go('/') }} />
            <div className="mt-4"><AlertSlot compact /></div>
            <p className="mt-3 text-[11px] text-ink/55">Numéros d'urgence relayés par l'ANPC : 170, 118, 1014, 1244, 171. Ce site n'est pas un service d'urgence. · <a className="underline" href="#/moderation">Modération</a></p>
          </div>
        </div>
      )}

      {route === 'signaler' && <ReportFlow onClose={() => go('/')} onSubmit={submit} />}
    </div>
  )
}

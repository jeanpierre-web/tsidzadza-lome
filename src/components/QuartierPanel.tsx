import type { Report } from '../types'
import { LEVELS, LEVEL_ORDER, worstLevel } from '../levels'
import { QUARTIERS, quartierById } from '../quartiers'
import { formatTime } from '../format'
import { LevelIcon } from './Icons'

interface Props {
  reports: Report[]
  selected: string | null
  onSelect: (id: string | null) => void
}

export function quartierStats(reports: Report[], id: string | null) {
  const rs = reports.filter((r) => r.status !== 'rejete' && (id === null || r.quartier === id))
  const valid = rs.filter((r) => r.status === 'valide')
  const byLevel = Object.fromEntries(LEVEL_ORDER.map((l) => [l, valid.filter((r) => r.level === l).length])) as Record<string, number>
  return { total: valid.length, pending: rs.length - valid.length, byLevel, worst: worstLevel(valid.map((r) => r.level)), list: rs }
}

function LevelBar({ byLevel, total }: { byLevel: Record<string, number>; total: number }) {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-ink/8" aria-hidden>
      {LEVEL_ORDER.map((l) => (
        <span key={l} style={{ width: total ? `${(byLevel[l] / total) * 100}%` : 0, background: LEVELS[l].color }} />
      ))}
    </div>
  )
}

export function QuartierPanel({ reports, selected, onSelect }: Props) {
  const current = quartierStats(reports, selected)
  return (
    <section aria-label="Quartiers pilotes" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-bold">Quartiers</h2>
        <button type="button" className={`min-h-11 rounded-full px-4 text-sm font-semibold ${selected === null ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-ink/15'}`} onClick={() => onSelect(null)}>
          Tous
        </button>
      </div>
      <ul className="grid gap-2">
        {QUARTIERS.map((q) => {
          const s = quartierStats(reports, q.id)
          const active = selected === q.id
          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onSelect(active ? null : q.id)}
                aria-pressed={active}
                className={`w-full rounded-2xl p-3 text-left transition ${active ? 'bg-ink text-white shadow-lg shadow-ink/20' : 'bg-white ring-1 ring-ink/10 hover:ring-ink/30'}`}
              >
                <div className="flex items-center gap-3">
                  {s.worst ? <span className="shrink-0 rounded-xl bg-white p-0.5"><LevelIcon level={s.worst} size={36} title={`Niveau le plus haut : ${LEVELS[s.worst].label}`} /></span> : <span className="h-10 w-10" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-display text-[17px] font-bold">{q.name}</span>
                      <span className="text-[13px] tabular-nums opacity-80">
                        <b className="text-[17px]">{s.total}</b> validés
                      </span>
                    </div>
                    <div className="mt-1.5"><LevelBar byLevel={s.byLevel} total={s.total} /></div>
                    <div className="mt-1.5 flex gap-3 text-[12px] tabular-nums opacity-80">
                      {LEVEL_ORDER.map((l) => (
                        <span key={l} className="inline-flex items-center gap-1">
                          <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: LEVELS[l].color }} />
                          <span className="sr-only">{LEVELS[l].label}</span>
                          {s.byLevel[l]}
                        </span>
                      ))}
                      {s.pending > 0 && <span className="ml-auto">+{s.pending} en attente</span>}
                    </div>
                  </div>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      <div>
        <h3 className="mb-1.5 text-[13px] font-semibold uppercase tracking-wider text-lagoon">Historique {selected ? `· ${quartierById(selected)?.name}` : ''}</h3>
        <ol className="divide-y divide-ink/8 rounded-2xl bg-white ring-1 ring-ink/10">
          {current.list.slice(0, 6).map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-3 py-2">
              <LevelIcon level={r.level} size={30} />
              <div className="min-w-0 flex-1 text-[13px]">
                <div className="truncate font-semibold">{quartierById(r.quartier)?.name ?? '—'}</div>
                <time className="text-ink/60" dateTime={r.createdAt}>{formatTime(r.createdAt)}</time>
              </div>
              {r.status === 'en_attente' && <span className="text-[11px] font-semibold text-[#7A5600]">En attente</span>}
              {r.isTest && <span className="rounded border border-black/40 bg-test px-1 text-[10px] font-extrabold">TEST</span>}
            </li>
          ))}
          {current.list.length === 0 && <li className="px-3 py-3 text-sm text-ink/60">Aucun signalement.</li>}
        </ol>
      </div>
    </section>
  )
}

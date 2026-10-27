import type { Report, Status } from '../types'
import { LEVELS } from '../levels'
import { quartierById } from '../quartiers'
import { formatTime, STATUS_LABEL } from '../format'
import { displayPhoto } from '../data/demoPhoto'
import { CheckIcon, LevelIcon, ShieldIcon, XIcon } from './Icons'

interface Props {
  reports: Report[]
  onStatus: (id: string, s: Status) => void
  onReset: () => void
  allowReset?: boolean
  notice?: string | null
}

export function Moderation({ reports, onStatus, onReset, allowReset = true, notice }: Props) {
  const pending = reports.filter((r) => r.status === 'en_attente')
  const done = reports.filter((r) => r.status !== 'en_attente').slice(0, 12)
  const Card = ({ r }: { r: Report }) => {
    const photo = displayPhoto(r)
    return (
    <li className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/10">
      {photo ? <img src={photo} alt="" className="h-20 w-24 shrink-0 rounded-xl object-cover" /> : <div className="h-20 w-24 shrink-0 rounded-xl bg-mist" />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <LevelIcon level={r.level} size={28} />
          <b className="font-display">{LEVELS[r.level].label}</b>
          {r.isTest && <span className="rounded border border-black/40 bg-test px-1 text-[10px] font-extrabold">TEST</span>}
        </div>
        <div className="truncate text-sm text-lagoon">{quartierById(r.quartier)?.name ?? 'Quartier non précisé'} · {formatTime(r.createdAt)}</div>
        <div className="text-xs text-ink/55">{STATUS_LABEL[r.status]} · {r.source === 'demo' ? 'démo' : r.source === 'whatsapp' ? 'WhatsApp' : 'formulaire web'}{r.pendingSync ? ' · pas encore envoyé' : ''}</div>
      </div>
      {r.status === 'en_attente' ? (
        <div className="flex shrink-0 flex-col gap-2">
          <button type="button" aria-label="Valider" onClick={() => onStatus(r.id, 'valide')} className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-2xl bg-[#1D6B45] text-white"><CheckIcon size={22} /><span className="text-[11px] font-bold leading-none">OK</span></button>
          <button type="button" aria-label="Rejeter" onClick={() => onStatus(r.id, 'rejete')} className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-2xl bg-[#8E2A22] text-white"><XIcon size={20} /><span className="text-[11px] font-bold leading-none">Non</span></button>
        </div>
      ) : (
        <button type="button" onClick={() => onStatus(r.id, 'en_attente')} className="min-h-12 self-center px-2 text-sm font-semibold text-lagoon underline">Annuler</button>
      )}
    </li>
    )
  }
  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4">
      <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-laterite/60 bg-[#FBE9E1] p-3 text-sm">
        <ShieldIcon className="mt-0.5 shrink-0 text-laterite" />
        <p><b>Modération — prototype sans authentification.</b> N'importe qui peut valider ici. Une vraie version demandera une connexion pour les modérateurs.</p>
      </div>
      {notice && <p role="alert" className="rounded-2xl bg-taille px-3 py-3 text-sm font-semibold text-white">{notice}</p>}
      <section>
        <h2 className="mb-2 font-display text-xl font-bold">En attente <span className="text-ink/50">({pending.length})</span></h2>
        <ul className="space-y-2">{pending.map((r) => <Card key={r.id} r={r} />)}</ul>
        {pending.length === 0 && <p className="text-sm text-ink/60">Rien à modérer.</p>}
      </section>
      <section>
        <h2 className="mb-2 font-display text-xl font-bold">Déjà traités</h2>
        <ul className="space-y-2">{done.map((r) => <Card key={r.id} r={r} />)}</ul>
      </section>
      {allowReset ? (
        <button type="button" onClick={onReset} className="min-h-12 text-left text-sm font-semibold text-laterite underline">Remettre les données de démonstration</button>
      ) : (
        <p className="text-sm leading-snug text-ink/70">Les signalements partagés ne se remettent pas à zéro depuis le téléphone.</p>
      )}
    </div>
  )
}

import type { NewReport, Report, Status } from '../types'
import { QUARTIERS } from '../quartiers'

const QUARTIER_IDS = new Set(QUARTIERS.map((q) => q.id))

/** Contrat de la couche de données : la carte et le formulaire ne connaissent que ça. */
export interface ReportStore {
  readonly kind: 'local' | 'supabase'
  list(): Promise<Report[]>
  add(input: NewReport): Promise<Report>
  setStatus(id: string, status: Status): Promise<Report>
  /** Remet les données de démonstration (prototype uniquement). */
  reset(): Promise<void>
  /** true si le dernier list() a été servi sans réseau. */
  wasStale(): boolean
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'r-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** Valide une saisie avant enregistrement. Lance une erreur lisible. */
export function validateNewReport(input: NewReport): void {
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) throw new Error('Position manquante')
  if (Math.abs(input.lat) > 90 || Math.abs(input.lng) > 180) throw new Error('Position invalide')
  if (!['cheville', 'genou', 'taille'].includes(input.level)) throw new Error('Niveau invalide')
  if (input.quartier !== undefined && !QUARTIER_IDS.has(input.quartier)) throw new Error('Quartier invalide')
}

/** Évite de remplacer la liste (et de fermer une fenêtre de carte) si rien n'a changé. */
export function reportsSnapshotEqual(a: Report[], b: Report[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const x = a[i]
    const y = b[i]
    if (
      x.id !== y.id ||
      x.status !== y.status ||
      x.photo !== y.photo ||
      x.pendingSync !== y.pendingSync ||
      x.level !== y.level ||
      x.lat !== y.lat ||
      x.lng !== y.lng ||
      x.quartier !== y.quartier
    ) {
      return false
    }
  }
  return true
}

import type { NewReport, Report, Status } from '../types'

/** Contrat de la couche de données : la carte et le formulaire ne connaissent que ça. */
export interface ReportStore {
  readonly kind: 'local' | 'supabase'
  list(): Promise<Report[]>
  add(input: NewReport): Promise<Report>
  setStatus(id: string, status: Status): Promise<Report>
  /** Remet les données de démonstration (prototype uniquement). */
  reset(): Promise<void>
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
}

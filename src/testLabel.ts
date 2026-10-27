import type { Report } from './types'

export const TEST_BANNER = 'DONNÉES DE DÉMONSTRATION — TEST'
export const TEST_TAG = 'TEST'

/** Étiquette affichée à côté d'un signalement. Toute donnée de démo porte « TEST ». */
export function reportTag(r: Pick<Report, 'isTest'>): string | null {
  return r.isTest ? TEST_TAG : null
}

/** Titre accessible d'un signalement, qui commence par TEST pour les données de démo. */
export function reportTitle(r: Pick<Report, 'isTest' | 'level'>, quartierName?: string): string {
  const base = `Signalement niveau ${r.level}${quartierName ? ` — ${quartierName}` : ''}`
  return r.isTest ? `${TEST_TAG} · ${base}` : base
}

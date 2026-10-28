import type { Level } from './types'

export interface LevelMeta {
  id: Level
  rank: 1 | 2 | 3
  label: string // court, en français
  ariaLabel: string
  /** Nom de la couleur dans la légende : vert, orange, rouge. */
  colorName: string
  color: string
  ink: string // couleur de texte lisible sur `color`
}

export const LEVELS: Record<Level, LevelMeta> = {
  cheville: { id: 'cheville', rank: 1, label: 'Cheville', ariaLabel: "Eau jusqu'à la cheville", colorName: 'Vert', color: '#2BB85A', ink: '#062112' },
  genou: { id: 'genou', rank: 2, label: 'Genou', ariaLabel: "Eau jusqu'au genou", colorName: 'Orange', color: '#EE7F2D', ink: '#2B1405' },
  taille: { id: 'taille', rank: 3, label: 'Taille', ariaLabel: "Eau jusqu'à la taille", colorName: 'Rouge', color: '#D63A2F', ink: '#FFFFFF' },
}

export const LEVEL_ORDER: Level[] = ['cheville', 'genou', 'taille']

export function levelColor(level: Level): string {
  return LEVELS[level].color
}

/**
 * Convertit une saisie libre en niveau — utile pour le futur bot WhatsApp
 * (l'habitant peut répondre « 1 », « genou », un emoji, etc.).
 * Renvoie null si la saisie n'est pas reconnue.
 */
export function parseLevel(input: string | number | null | undefined): Level | null {
  if (input === null || input === undefined) return null
  const s = String(input)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (!s) return null
  if (['1', 'cheville', 'chevilles', 'ankle', '🦶'].includes(s)) return 'cheville'
  if (['2', 'genou', 'genoux', 'knee', '🦵'].includes(s)) return 'genou'
  if (['3', 'taille', 'hanche', 'waist', '🧍'].includes(s)) return 'taille'
  return null
}

/** Niveau le plus grave d'une liste (ou null si vide). */
export function worstLevel(levels: Level[]): Level | null {
  let worst: Level | null = null
  for (const l of levels) if (!worst || LEVELS[l].rank > LEVELS[worst].rank) worst = l
  return worst
}

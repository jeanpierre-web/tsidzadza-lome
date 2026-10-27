export type Level = 'cheville' | 'genou' | 'taille'
export type Status = 'en_attente' | 'valide' | 'rejete'

export interface Report {
  id: string
  lat: number
  lng: number
  level: Level
  /** Identifiant de quartier pilote (facultatif). */
  quartier?: string
  /** URL ou data-URL de la photo (illustration SVG pour les données de démo). */
  photo?: string
  createdAt: string // ISO 8601
  status: Status
  /** true = donnée de démonstration, jamais réelle. */
  isTest: boolean
  source: 'demo' | 'web' | 'whatsapp'
}

export type NewReport = Pick<Report, 'lat' | 'lng' | 'level' | 'quartier' | 'photo'>

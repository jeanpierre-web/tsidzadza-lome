/** Échec de géolocalisation, distingué pour un message court à l'écran. */
export type GeoFailure = 'unsupported' | 'denied' | 'unavailable' | 'timeout'

/** Codes GeolocationPositionError : 1 refus, 2 indisponible, 3 délai. */
export function geoErrorKind(error: { code?: number } | null | undefined): GeoFailure {
  if (error?.code === 1) return 'denied'
  if (error?.code === 3) return 'timeout'
  return 'unavailable'
}

export function geoFailureMessage(kind: GeoFailure): string {
  switch (kind) {
    case 'denied':
      return "Le téléphone a refusé la position. Touche la carte à l'endroit de l'eau."
    case 'timeout':
      return "La position met trop de temps. Touche la carte à l'endroit de l'eau."
    case 'unsupported':
      return "Ce téléphone ne donne pas la position. Touche la carte à l'endroit de l'eau."
    default:
      return "Position introuvable. Touche la carte à l'endroit de l'eau."
  }
}

/**
 * Quartiers pilotes. Coordonnées APPROXIMATIVES issues d'OpenStreetMap
 * (API Nominatim, requêtes du 27 oct. 2026) — voir README pour le détail.
 */
export interface Quartier {
  id: string
  name: string
  lat: number
  lng: number
  /** Comment la coordonnée a été obtenue. */
  osm: string
}

export const QUARTIERS: Quartier[] = [
  { id: 'nyekonakpoe', name: 'Nyékonakpoè', lat: 6.1302, lng: 1.2059, osm: 'Limite administrative « Nyékonakpoé » (4e arr.)' },
  { id: 'be', name: 'Bè', lat: 6.1427, lng: 1.2485, osm: 'Limite administrative « Bè » (3e arr.)' },
  { id: 'agbalepedogan', name: 'Agbalépédogan', lat: 6.1919, lng: 1.1996, osm: 'Limite administrative « Agbalépédogan » (5e arr.)' },
  { id: 'awatame', name: 'Awatamé', lat: 6.1783, lng: 1.169, osm: "Point « Marché d'Awatamé » (pas de limite de quartier dans OSM)" },
  { id: 'segbe', name: 'Ségbé', lat: 6.1884, lng: 1.116, osm: '« Cimetière de Ségbé », route vers Ségbé (pas de limite de quartier dans OSM) — très approximatif' },
]

export const LOME_CENTER: [number, number] = [6.163, 1.185]

export function quartierById(id?: string): Quartier | undefined {
  return QUARTIERS.find((q) => q.id === id)
}

/** Quartier pilote le plus proche d'un point (distance simple, suffisante à cette échelle). */
export function nearestQuartier(lat: number, lng: number): Quartier {
  let best = QUARTIERS[0]
  let bestD = Infinity
  for (const q of QUARTIERS) {
    const d = (q.lat - lat) ** 2 + ((q.lng - lng) * Math.cos((lat * Math.PI) / 180)) ** 2
    if (d < bestD) {
      bestD = d
      best = q
    }
  }
  return best
}

import type { Level, Report, Status } from '../types'
import { QUARTIERS } from '../quartiers'
import { demoPhoto } from './demoPhoto'

/** PRNG déterministe (mulberry32) : les mêmes données TEST à chaque chargement. */
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Répartition purement fictive (5 quartiers × 5 = 25 signalements).
const PLAN: Record<string, Level[]> = {
  nyekonakpoe: ['genou', 'taille', 'genou', 'cheville', 'genou'],
  be: ['taille', 'genou', 'taille', 'cheville', 'genou'],
  agbalepedogan: ['cheville', 'genou', 'cheville', 'genou', 'taille'],
  awatame: ['taille', 'taille', 'genou', 'cheville', 'genou'],
  segbe: ['cheville', 'cheville', 'genou', 'genou', 'taille'],
}

/**
 * 25 signalements de DÉMONSTRATION, tous `isTest: true`.
 * Les dates sont relatives à `now` (dernières 72 h) pour que l'historique ait du sens.
 */
export function buildDemoReports(now: Date = new Date()): Report[] {
  const rand = rng(20261027)
  const out: Report[] = []
  let n = 0
  for (const q of QUARTIERS) {
    PLAN[q.id].forEach((level, i) => {
      const hoursAgo = Math.floor(rand() * 72) + 1
      const status: Status = i === 4 ? 'en_attente' : 'valide'
      out.push({
        id: `demo-${q.id}-${i + 1}`,
        lat: +(q.lat + (rand() - 0.5) * 0.016).toFixed(5),
        lng: +(q.lng + (rand() - 0.5) * 0.016).toFixed(5),
        level,
        quartier: q.id,
        photo: demoPhoto(level, n++),
        createdAt: new Date(now.getTime() - hoursAgo * 3600_000 - i * 600_000).toISOString(),
        status,
        isTest: true,
        source: 'demo',
      })
    })
  }
  return out
}

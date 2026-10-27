import { describe, it, expect, beforeEach } from 'vitest'
import { LocalStorageStore, STORAGE_KEY } from './data/localStore'
import { buildDemoReports } from './data/demo'
import { parseLevel, worstLevel, LEVELS, LEVEL_ORDER } from './levels'
import { reportTag, reportTitle, TEST_BANNER } from './testLabel'
import { QUARTIERS, nearestQuartier } from './quartiers'

describe('niveaux d’eau', () => {
  it('ordonne cheville < genou < taille avec 3 couleurs distinctes', () => {
    expect(LEVEL_ORDER.map((l) => LEVELS[l].rank)).toEqual([1, 2, 3])
    expect(new Set(LEVEL_ORDER.map((l) => LEVELS[l].color)).size).toBe(3)
  })
  it('reconnaît les saisies libres (futur bot WhatsApp)', () => {
    expect(parseLevel('1')).toBe('cheville')
    expect(parseLevel(2)).toBe('genou')
    expect(parseLevel('  Genoux ')).toBe('genou')
    expect(parseLevel('TAILLE')).toBe('taille')
    expect(parseLevel('🦶')).toBe('cheville')
    expect(parseLevel('beaucoup')).toBeNull()
    expect(parseLevel('')).toBeNull()
  })
  it('trouve le niveau le plus grave', () => {
    expect(worstLevel(['cheville', 'taille', 'genou'])).toBe('taille')
    expect(worstLevel([])).toBeNull()
  })
})

describe('données de démonstration TEST', () => {
  const demo = buildDemoReports(new Date('2026-10-27T12:00:00Z'))
  it('contient 25 signalements, tous marqués TEST', () => {
    expect(demo).toHaveLength(25)
    expect(demo.every((r) => r.isTest && r.source === 'demo')).toBe(true)
    expect(demo.every((r) => reportTag(r) === 'TEST')).toBe(true)
    expect(demo.every((r) => reportTitle(r).startsWith('TEST · '))).toBe(true)
  })
  it('couvre les 5 quartiers pilotes et reste proche de leur centre', () => {
    for (const q of QUARTIERS) {
      const inQ = demo.filter((r) => r.quartier === q.id)
      expect(inQ.length).toBe(5)
      for (const r of inQ) expect(nearestQuartier(r.lat, r.lng).id).toBe(q.id)
    }
  })
  it('les photos sont des illustrations SVG marquées TEST', () => {
    for (const r of demo) {
      expect(r.photo).toMatch(/^data:image\/svg\+xml/)
      expect(decodeURIComponent(r.photo!)).toContain('TEST')
    }
  })
  it('le bandeau affiche le bon texte', () => {
    expect(TEST_BANNER).toBe('DONNÉES DE DÉMONSTRATION — TEST')
  })
})

describe('LocalStorageStore', () => {
  let store: LocalStorageStore
  beforeEach(() => {
    localStorage.clear()
    store = new LocalStorageStore(localStorage)
  })
  it('se remplit avec les données de démo au premier chargement', async () => {
    expect(await store.list()).toHaveLength(25)
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })
  it('un nouveau signalement est en attente et marqué TEST', async () => {
    const r = await store.add({ lat: 6.14, lng: 1.22, level: 'genou', quartier: 'be' })
    expect(r.status).toBe('en_attente')
    expect(r.isTest).toBe(true)
    expect(r.source).toBe('web')
    expect((await store.list())[0].id).toBe(r.id) // le plus récent en premier
  })
  it('refuse une position manquante', async () => {
    await expect(store.add({ lat: NaN, lng: 1.2, level: 'taille' })).rejects.toThrow('Position')
  })
  it('la modération valide ou rejette, et persiste', async () => {
    const r = await store.add({ lat: 6.14, lng: 1.22, level: 'taille' })
    await store.setStatus(r.id, 'valide')
    const again = new LocalStorageStore(localStorage)
    expect((await again.list()).find((x) => x.id === r.id)?.status).toBe('valide')
    await again.setStatus(r.id, 'rejete')
    expect((await store.list()).find((x) => x.id === r.id)?.status).toBe('rejete')
    await expect(store.setStatus('nope', 'valide')).rejects.toThrow()
  })
  it('reset remet les 25 signalements de démo', async () => {
    await store.add({ lat: 6.14, lng: 1.22, level: 'taille' })
    await store.reset()
    expect(await store.list()).toHaveLength(25)
  })
})

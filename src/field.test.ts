import { describe, it, expect, vi } from 'vitest'
import { geoErrorKind, geoFailureMessage } from './geo'
import { reviewNotice, thanksDetail } from './reportCopy'
import { COMPRESS_MAX_EDGE, dataUrlToBlob, photoErrorMessage, targetSize } from './media/compressImage'
import { displayPhoto } from './data/demoPhoto'
import { demoSeedSql } from './data/demoSeed'
import { reportsSnapshotEqual, validateNewReport } from './data/store'
import { LocalStorageStore } from './data/localStore'
import { createStore } from './data'
import { OUTBOX_KEY, REMOTE_CACHE_KEY, SupabaseStore, mergeReports, rowToReport } from './data/supabaseStore'
import type { NewReport, Report } from './types'

describe('géolocalisation', () => {
  it('distingue refus, délai et absence de position', () => {
    expect(geoErrorKind({ code: 1 })).toBe('denied')
    expect(geoErrorKind({ code: 3 })).toBe('timeout')
    expect(geoErrorKind({ code: 2 })).toBe('unavailable')
    expect(geoErrorKind(null)).toBe('unavailable')
    expect(geoFailureMessage('denied')).toMatch(/refusé/)
    expect(geoFailureMessage('timeout')).toMatch(/trop de temps/)
    expect(geoFailureMessage('unsupported')).toMatch(/ne donne pas/)
    expect(geoFailureMessage('denied')).toMatch(/Touche la carte/)
  })
})

describe('texte du formulaire', () => {
  it('ne promet un envoi partagé que lorsque le stockage l’est', () => {
    expect(reviewNotice(false)).toMatch(/uniquement sur cet appareil/)
    expect(reviewNotice(true)).toMatch(/carte partagée/)
    expect(reviewNotice(true)).not.toMatch(/uniquement sur cet appareil/)
  })
  it('explique un envoi gardé sur le téléphone, ou une photo perdue', () => {
    expect(thanksDetail({ shared: true, pendingSync: true, photoDropped: false })).toMatch(/ce téléphone/)
    expect(thanksDetail({ shared: true, pendingSync: false, photoDropped: false })).toMatch(/carte partagée/)
    expect(thanksDetail({ shared: false, pendingSync: false, photoDropped: true })).toMatch(/photo/)
  })
})

describe('compression photo', () => {
  it('réduit le grand côté et laisse une petite image', () => {
    expect(targetSize(4000, 3000, COMPRESS_MAX_EDGE)).toEqual({ width: 800, height: 600 })
    expect(targetSize(3000, 4000)).toEqual({ width: 600, height: 800 })
    expect(targetSize(640, 480)).toEqual({ width: 640, height: 480 })
    expect(targetSize(100, 100)).toEqual({ width: 100, height: 100 })
  })
  it('refuse une image illisible et traduit les erreurs', () => {
    expect(() => targetSize(0, 10)).toThrow('PHOTO_UNREADABLE')
    expect(photoErrorMessage(new Error('PHOTO_TOO_BIG'))).toMatch(/trop lourde/)
    expect(photoErrorMessage(new Error('PHOTO_TYPE'))).toMatch(/pas une photo/)
    expect(photoErrorMessage(new Error('PHOTO_UNREADABLE'))).toMatch(/illisible/)
  })
  it('relit une data-URL', () => {
    const blob = dataUrlToBlob('data:text/plain;base64,' + btoa('hello'))
    expect(blob.type).toBe('text/plain')
    expect(blob.size).toBe(5)
    expect(() => dataUrlToBlob('nope')).toThrow('PHOTO_UNREADABLE')
  })
})

describe('photos de démo et comparaison de listes', () => {
  it('dessine une illustration TEST si la démo n’a pas de fichier', () => {
    const drawn = displayPhoto({ id: 'demo-be-1', level: 'genou', source: 'demo' })
    expect(drawn).toMatch(/^data:image\/svg\+xml/)
    expect(decodeURIComponent(drawn!)).toContain('TEST')
    expect(displayPhoto({ id: 'x', level: 'genou', source: 'web' })).toBeUndefined()
    expect(displayPhoto({ id: 'x', level: 'genou', source: 'web', photo: 'https://example.test/a.jpg' })).toBe('https://example.test/a.jpg')
  })
  it('détecte une liste inchangée', () => {
    const a = [{ id: '1', lat: 1, lng: 2, level: 'cheville', status: 'valide', isTest: true, source: 'demo', createdAt: 't' } as Report]
    expect(reportsSnapshotEqual(a, [{ ...a[0] }])).toBe(true)
    expect(reportsSnapshotEqual(a, [{ ...a[0], status: 'rejete' }])).toBe(false)
  })
  it('prépare 25 lignes SQL de démo, sans photo', () => {
    const sql = demoSeedSql()
    expect(sql.match(/^\s+\('demo-/gm)).toHaveLength(25)
    expect(sql).toContain("true, 'demo'")
    expect(sql).not.toContain('data:image')
    expect(sql).toContain('on conflict (id) do nothing')
  })
  it('refuse un quartier inconnu', () => {
    expect(() => validateNewReport({ lat: 6.14, lng: 1.22, level: 'cheville', quartier: 'paris' })).toThrow('Quartier')
  })
})

function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() { return m.size },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => { m.set(k, String(v)) },
    removeItem: (k) => { m.delete(k) },
    key: (i) => [...m.keys()][i] ?? null,
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

const sample: NewReport = { lat: 6.14321, lng: 1.24789, level: 'genou', quartier: 'be' }

describe('SupabaseStore', () => {
  it('ignore une ligne illisible et force le marquage TEST', () => {
    expect(rowToReport({ id: 'abcdefgh', lat: '6.140', lng: 1.22, level: 'taille', status: 'valide', source: 'demo', created_at: '2026-10-27T00:00:00Z', is_test: false })?.isTest).toBe(true)
    expect(rowToReport({ id: 'abcdefgh', level: 'nope' })).toBeNull()
    const newer = { id: 'b', createdAt: '2026-10-27T02:00:00Z' } as Report
    const older = { id: 'a', createdAt: '2026-10-27T01:00:00Z' } as Report
    expect(mergeReports([older], [newer]).map((r) => r.id)).toEqual(['b', 'a'])
  })

  function harness(opts?: { status?: number; storageStatus?: number }) {
    const remote: Record<string, unknown>[] = []
    let online = true
    let uploaded: string | null = null
    const storage = memoryStorage()
    const fetchMock: typeof fetch = async (input, init) => {
      if (!online) throw new TypeError('Failed to fetch')
      const url = String(input)
      const headers = init?.headers as Record<string, string>
      expect(headers.apikey).toBe('anon-key')
      expect(headers.Authorization).toBe('Bearer anon-key')
      if (opts?.status && !url.includes('/storage/')) return json({ message: 'JWT' }, opts.status)
      if (url.includes('/storage/v1/object/report-photos/') && !url.includes('/public/')) {
        uploaded = url
        if (opts?.storageStatus) return json({ message: 'too big' }, opts.storageStatus)
        return json({ Key: 'ok' })
      }
      if (url.includes('/rpc/create_report')) {
        const body = JSON.parse(String(init?.body))
        const created = {
          id: body.p_id,
          lat: body.p_lat,
          lng: body.p_lng,
          level: body.p_level,
          quartier: body.p_quartier,
          photo: body.p_photo,
          created_at: '2026-10-27T12:00:00.000Z',
          status: 'en_attente',
          is_test: false,
          source: 'web',
        }
        remote.unshift(created)
        return json(created)
      }
      if (url.includes('/rpc/set_report_status')) {
        const body = JSON.parse(String(init?.body))
        const found = remote.find((r) => r.id === body.report_id)
        if (!found) return json({ message: 'Signalement introuvable' }, 400)
        found.status = body.new_status
        return json(found)
      }
      if (url.includes('/reports_public')) {
        expect(url.startsWith('https://example.supabase.co/rest/v1/reports_public')).toBe(true)
        return json(remote)
      }
      return json({ message: 'nope' }, 500)
    }
    const store = new SupabaseStore({ url: 'https://example.supabase.co/', anonKey: 'anon-key', fetch: fetchMock, storage })
    return {
      store,
      storage,
      remote,
      uploaded: () => uploaded,
      setOnline: (v: boolean) => { online = v },
    }
  }

  it('envoie un signalement TEST et peut changer son statut', async () => {
    const { store, uploaded } = harness()
    const photo = 'data:image/jpeg;base64,' + btoa('hello')
    const saved = await store.add({ ...sample, photo })
    expect(saved.status).toBe('en_attente')
    expect(saved.isTest).toBe(true)
    expect(saved.pendingSync).toBeUndefined()
    expect(saved.photo).toMatch(/\/storage\/v1\/object\/public\/report-photos\/.+\.jpg$/)
    expect(uploaded()).toContain('/storage/v1/object/report-photos/')
    const validated = await store.setStatus(saved.id, 'valide')
    expect(validated.status).toBe('valide')
    expect((await store.list()).find((r) => r.id === saved.id)?.status).toBe('valide')
  })

  it('enregistre sans photo si le bac refuse le fichier', async () => {
    const { store } = harness({ storageStatus: 413 })
    const saved = await store.add({ ...sample, photo: 'data:image/jpeg;base64,' + btoa('hello') })
    expect(saved.photo).toBeUndefined()
    expect(saved.pendingSync).toBeUndefined()
  })

  it('ne met pas en file un refus d’accès', async () => {
    const { store, storage } = harness({ status: 401 })
    await expect(store.add(sample)).rejects.toThrow(/refusé/)
    expect(storage.getItem(OUTBOX_KEY)).toBeNull()
  })

  it('garde le signalement sur le téléphone puis l’envoie', async () => {
    const ctx = harness()
    ctx.setOnline(false)
    const queued = await ctx.store.add(sample)
    expect(queued.pendingSync).toBe(true)
    expect(queued.isTest).toBe(true)
    expect(JSON.parse(ctx.storage.getItem(OUTBOX_KEY)!)).toHaveLength(1)
    const offline = await ctx.store.list()
    expect(ctx.store.wasStale()).toBe(true)
    expect(offline.some((r) => r.id === queued.id)).toBe(true)
    ctx.setOnline(true)
    const online = await ctx.store.list()
    expect(ctx.store.wasStale()).toBe(false)
    expect(online.find((r) => r.id === queued.id)?.pendingSync).toBeUndefined()
    expect(ctx.storage.getItem(OUTBOX_KEY)).toBe('[]')
  })

  it('relit le cache quand le réseau coupe après une lecture', async () => {
    const ctx = harness()
    await ctx.store.add(sample)
    await ctx.store.list()
    expect(ctx.storage.getItem(REMOTE_CACHE_KEY)).not.toBeNull()
    ctx.setOnline(false)
    const cached = await ctx.store.list()
    expect(ctx.store.wasStale()).toBe(true)
    expect(cached).toHaveLength(1)
    expect(cached[0].isTest).toBe(true)
  })

  it('ignore une ligne cassée au milieu de la liste', async () => {
    const ctx = harness()
    await ctx.store.add(sample)
    ctx.remote.push({ id: 'cassé' })
    const list = await ctx.store.list()
    expect(list).toHaveLength(1)
    expect(list[0].level).toBe('genou')
  })

  it('refuse la remise à zéro du stockage partagé', async () => {
    const { store } = harness()
    await expect(store.reset()).rejects.toThrow(/désactivée/)
  })
})

describe('createStore', () => {
  it('reste local sans les deux variables', () => {
    expect(createStore({}).kind).toBe('local')
    expect(createStore({ VITE_SUPABASE_URL: '  ', VITE_SUPABASE_ANON_KEY: '' }).kind).toBe('local')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(createStore({ VITE_SUPABASE_URL: 'https://example.supabase.co' }).kind).toBe('local')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
    expect(createStore({ VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: 'k' }).kind).toBe('supabase')
  })
  it('le stockage local n’est jamais périmé', async () => {
    const store = new LocalStorageStore(memoryStorage(), () => [])
    expect(store.wasStale()).toBe(false)
    expect(await store.list()).toEqual([])
  })
})

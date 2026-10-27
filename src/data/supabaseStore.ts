import type { NewReport, Report, Status } from '../types'
import { dataUrlToBlob } from '../media/compressImage'
import { newId, validateNewReport, type ReportStore } from './store'

export const OUTBOX_KEY = 'tsidzadza.outbox.v1'
export const REMOTE_CACHE_KEY = 'tsidzadza.remote-cache.v1'
const OUTBOX_LIMIT = 15

const LEVELS = new Set(['cheville', 'genou', 'taille'])
const STATUSES = new Set(['en_attente', 'valide', 'rejete'])
const SOURCES = new Set(['demo', 'web', 'whatsapp'])

/** Erreur déjà traduite pour l'écran. `retryable` : on peut garder le signalement sur le téléphone. */
export class StoreError extends Error {
  readonly retryable: boolean
  constructor(message: string, retryable: boolean) {
    super(message)
    this.name = 'StoreError'
    this.retryable = retryable
  }
}

export interface SupabaseConfig {
  url: string
  anonKey: string
  fetch?: typeof fetch
  storage?: Storage
}

/** Ligne renvoyée par la vue `reports_public` (positions déjà arrondies). */
export function rowToReport(row: unknown): Report | null {
  if (!row || typeof row !== 'object') return null
  const r = row as Record<string, unknown>
  const level = r.level
  const status = r.status
  const source = r.source
  const lat = Number(r.lat)
  const lng = Number(r.lng)
  if (typeof r.id !== 'string' || !r.id) return null
  if (typeof level !== 'string' || !LEVELS.has(level)) return null
  if (typeof status !== 'string' || !STATUSES.has(status)) return null
  if (typeof source !== 'string' || !SOURCES.has(source)) return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (typeof r.created_at !== 'string' || !r.created_at) return null
  return {
    id: r.id,
    lat,
    lng,
    level: level as Report['level'],
    quartier: typeof r.quartier === 'string' ? r.quartier : undefined,
    photo: typeof r.photo === 'string' && r.photo ? r.photo : undefined,
    createdAt: r.created_at,
    status: status as Status,
    // Le prototype n'affiche jamais un signalement comme une donnée réelle.
    isTest: true,
    source: source as Report['source'],
  }
}

export function mergeReports(server: Report[], pending: Report[]): Report[] {
  const map = new Map<string, Report>()
  for (const r of server) map.set(r.id, r)
  for (const r of pending) if (!map.has(r.id)) map.set(r.id, r)
  return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function unwrapRow(data: unknown): unknown {
  return Array.isArray(data) ? data[0] : data
}

function retryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500
}

/**
 * Carte partagée via l'API REST Supabase (sans le SDK).
 * Sans réseau, le signalement reste dans une file sur le téléphone.
 * Le SQL à exécuter une fois est dans `supabase/schema.sql`.
 */
export class SupabaseStore implements ReportStore {
  readonly kind = 'supabase' as const
  private readonly base: string
  private readonly anonKey: string
  private readonly fetchImpl: typeof fetch
  private readonly box: Storage
  private stale = false

  constructor(cfg: SupabaseConfig) {
    this.base = cfg.url.replace(/\/$/, '')
    this.anonKey = cfg.anonKey
    this.fetchImpl = cfg.fetch ?? fetch
    this.box = cfg.storage ?? localStorage
  }

  wasStale(): boolean {
    return this.stale
  }

  async list(): Promise<Report[]> {
    const sent = await this.flushOutbox()
    try {
      const remote = await this.fetchList()
      this.stale = false
      this.writeCache(remote)
      return mergeReports(remote, this.readOutbox())
    } catch (error) {
      const retryable = error instanceof TypeError || (error instanceof StoreError && error.retryable)
      const cached = this.readCache()
      const pending = this.readOutbox()
      if (retryable && (cached.length > 0 || pending.length > 0 || sent.length > 0)) {
        this.stale = true
        const merged = mergeReports(mergeReports(cached, sent), pending)
        if (sent.length > 0) this.writeCache(merged.filter((r) => !r.pendingSync))
        return merged
      }
      this.stale = false
      if (error instanceof StoreError) throw error
      throw new StoreError('Connexion impossible. Réessaie dans un moment.', true)
    }
  }

  async add(input: NewReport): Promise<Report> {
    validateNewReport(input)
    const report = this.makeLocal(input)
    try {
      return await this.insertRemote(report)
    } catch (error) {
      if (!(error instanceof TypeError || (error instanceof StoreError && error.retryable))) throw error
      this.enqueue(report)
      return report
    }
  }

  async setStatus(id: string, status: Status): Promise<Report> {
    if (this.readOutbox().some((r) => r.id === id)) {
      throw new StoreError("Ce signalement est encore sur ce téléphone. Réessaie quand le réseau revient.", true)
    }
    const saved = rowToReport(unwrapRow(await this.rpc('set_report_status', { report_id: id, new_status: status })))
    if (!saved) throw new StoreError('Réponse inattendue du stockage partagé.', false)
    return saved
  }

  async reset(): Promise<void> {
    throw new StoreError('La remise à zéro est désactivée quand les signalements sont partagés.', false)
  }

  private makeLocal(input: NewReport): Report {
    return {
      id: newId(),
      lat: input.lat,
      lng: input.lng,
      level: input.level,
      quartier: input.quartier,
      photo: input.photo,
      createdAt: new Date().toISOString(),
      status: 'en_attente',
      isTest: true,
      source: 'web',
      pendingSync: true,
    }
  }

  private async insertRemote(report: Report): Promise<Report> {
    let photo: string | null = null
    if (report.photo?.startsWith('data:')) {
      photo = (await this.uploadPhoto(report.id, report.photo)) ?? null
    } else if (report.photo?.includes('/storage/v1/object/public/report-photos/')) {
      photo = report.photo
    }
    const saved = rowToReport(
      unwrapRow(
        await this.rpc('create_report', {
          p_id: report.id,
          p_lat: report.lat,
          p_lng: report.lng,
          p_level: report.level,
          p_quartier: report.quartier ?? null,
          p_photo: photo,
        }),
      ),
    )
    if (!saved) throw new StoreError('Réponse inattendue du stockage partagé.', false)
    this.removeFromOutbox(report.id)
    return saved
  }

  private async uploadPhoto(id: string, dataUrl: string): Promise<string | undefined> {
    const blob = dataUrlToBlob(dataUrl)
    const path = `${encodeURIComponent(id)}.jpg`
    const res = await this.fetchImpl(`${this.base}/storage/v1/object/report-photos/${path}`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'image/jpeg', 'cache-control': '3600' }),
      body: blob,
    })
    if (res.ok || res.status === 409) return `${this.base}/storage/v1/object/public/report-photos/${path}`
    if (res.status === 400 || res.status === 413 || res.status === 415) return undefined
    throw await this.errorFrom(res)
  }

  private async fetchList(): Promise<Report[]> {
    const url = `${this.base}/rest/v1/reports_public?select=id,lat,lng,level,quartier,photo,created_at,status,is_test,source&order=created_at.desc`
    const res = await this.fetchImpl(url, { headers: this.headers() })
    if (!res.ok) throw await this.errorFrom(res)
    const data: unknown = await res.json()
    if (!Array.isArray(data)) throw new StoreError('Réponse inattendue du stockage partagé.', false)
    const reports: Report[] = []
    for (const row of data) {
      const report = rowToReport(row)
      if (report) reports.push(report)
    }
    return reports
  }

  private async rpc(name: string, body: unknown): Promise<unknown> {
    const res = await this.fetchImpl(`${this.base}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    })
    if (!res.ok) throw await this.errorFrom(res)
    return res.json()
  }

  private headers(extra?: Record<string, string>): HeadersInit {
    return {
      apikey: this.anonKey,
      Authorization: `Bearer ${this.anonKey}`,
      Accept: 'application/json',
      ...extra,
    }
  }

  private async errorFrom(res: Response): Promise<StoreError> {
    let server = ''
    try {
      const body = (await res.json()) as { message?: string }
      if (typeof body?.message === 'string') server = body.message
    } catch {
      /* corps vide ou non JSON */
    }
    const retryable = retryableStatus(res.status)
    if (res.status === 401 || res.status === 403) {
      return new StoreError("Le stockage partagé a refusé l'accès. Préviens la personne qui organise le test.", false)
    }
    if (res.status === 404) {
      return new StoreError("Le stockage partagé n'est pas prêt. Préviens la personne qui organise le test.", false)
    }
    if (server === 'Signalement introuvable') return new StoreError('Signalement introuvable.', false)
    if (server === 'Niveau invalide' || server === 'Position invalide' || server === 'Quartier invalide' || server === 'Statut invalide' || server === 'Photo invalide') {
      return new StoreError('Envoi refusé. Vérifie le lieu et le niveau, puis réessaie.', false)
    }
    if (retryable) return new StoreError('Le serveur ne répond pas.', true)
    return new StoreError('Envoi impossible. Réessaie dans un moment.', false)
  }

  /** Envoie la file. Renvoie ceux qui viennent de partir. Ne lève pas d'erreur réseau. */
  private async flushOutbox(): Promise<Report[]> {
    const pending = this.readOutbox()
    if (pending.length === 0) return []
    const sent: Report[] = []
    const remain: Report[] = []
    for (let i = 0; i < pending.length; i++) {
      try {
        sent.push(await this.insertRemote(pending[i]))
      } catch (error) {
        const stop = error instanceof TypeError || (error instanceof StoreError && error.retryable)
        if (stop) {
          remain.push(...pending.slice(i))
          break
        }
        remain.push(pending[i])
      }
    }
    this.writeOutbox(remain)
    return sent
  }

  private enqueue(report: Report) {
    const next = [...this.readOutbox().filter((r) => r.id !== report.id), report]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, OUTBOX_LIMIT)
    this.writeOutbox(next)
  }

  private removeFromOutbox(id: string) {
    this.writeOutbox(this.readOutbox().filter((r) => r.id !== id))
  }

  private readOutbox(): Report[] {
    const parsed = this.readJson(OUTBOX_KEY)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((row) => row && typeof row === 'object' && typeof (row as Report).id === 'string') as Report[]
  }

  private readCache(): Report[] {
    const parsed = this.readJson(REMOTE_CACHE_KEY)
    if (!Array.isArray(parsed)) return []
    const reports: Report[] = []
    for (const row of parsed) {
      if (row && typeof row === 'object' && typeof (row as Report).id === 'string' && typeof (row as Report).level === 'string') {
        reports.push(row as Report)
      }
    }
    return reports
  }

  private writeOutbox(reports: Report[]) {
    this.writeJson(OUTBOX_KEY, reports)
  }

  private writeCache(reports: Report[]) {
    this.writeJson(
      REMOTE_CACHE_KEY,
      reports.map((r) => ({ ...r, pendingSync: undefined })),
    )
  }

  private readJson(key: string): unknown {
    try {
      const raw = this.box.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  private writeJson(key: string, value: unknown) {
    try {
      this.box.setItem(key, JSON.stringify(value))
    } catch {
      /* quota du téléphone : la carte reste utilisable sans cache */
    }
  }
}

import type { NewReport, Report, Status } from '../types'
import { newId, validateNewReport, type ReportStore } from './store'
import { buildDemoReports } from './demo'

export const STORAGE_KEY = 'tsidzadza.reports.v1'

/** Stockage dans le navigateur (localStorage). Les données restent sur l'appareil. */
export class LocalStorageStore implements ReportStore {
  readonly kind = 'local' as const
  constructor(
    private storage: Storage = window.localStorage,
    private seed: () => Report[] = () => buildDemoReports(),
  ) {}

  private read(): Report[] {
    const raw = this.storage.getItem(STORAGE_KEY)
    if (raw === null) {
      const seeded = this.seed()
      this.write(seeded)
      return seeded
    }
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as Report[]) : []
    } catch {
      return []
    }
  }

  private write(reports: Report[]) {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(reports))
  }

  async list(): Promise<Report[]> {
    return [...this.read()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async add(input: NewReport): Promise<Report> {
    validateNewReport(input)
    const report: Report = {
      ...input,
      id: newId(),
      createdAt: new Date().toISOString(),
      status: 'en_attente', // tout nouveau signalement passe par la modération
      isTest: true, // prototype : tout est marqué TEST, même une saisie réelle
      source: 'web',
    }
    const all = this.read()
    all.push(report)
    try {
      this.write(all)
    } catch {
      // photo trop lourde pour le quota localStorage : on garde le signalement sans photo
      all[all.length - 1] = { ...report, photo: undefined }
      this.write(all)
      return all[all.length - 1]
    }
    return report
  }

  async setStatus(id: string, status: Status): Promise<Report> {
    const all = this.read()
    const i = all.findIndex((r) => r.id === id)
    if (i < 0) throw new Error('Signalement introuvable')
    all[i] = { ...all[i], status }
    this.write(all)
    return all[i]
  }

  async reset(): Promise<void> {
    this.write(this.seed())
  }
}

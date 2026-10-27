import { LocalStorageStore } from './localStore'
import type { ReportStore } from './store'

/**
 * Choix du backend. Aujourd'hui : toujours localStorage.
 * Quand SupabaseStore sera implémenté, on l'activera si VITE_SUPABASE_URL
 * et VITE_SUPABASE_ANON_KEY sont définies.
 */
export function createStore(): ReportStore {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (url) console.info('[TSIDZADZA] VITE_SUPABASE_URL défini, mais le backend Supabase est un stub : stockage local utilisé.')
  return new LocalStorageStore()
}

export type { ReportStore } from './store'

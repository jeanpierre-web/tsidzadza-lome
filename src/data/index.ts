import { LocalStorageStore } from './localStore'
import { SupabaseStore } from './supabaseStore'
import type { ReportStore } from './store'

export interface StoreEnv {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
}

/**
 * Sans les deux variables, le téléphone garde tout dans localStorage
 * (comportement du prototype). Avec les deux, les signalements partent
 * vers la carte partagée Supabase.
 */
export function createStore(env: StoreEnv = import.meta.env): ReportStore {
  const url = env.VITE_SUPABASE_URL?.trim()
  const key = env.VITE_SUPABASE_ANON_KEY?.trim()
  if (url && key) return new SupabaseStore({ url, anonKey: key })
  if (url || key) {
    console.warn('[TSIDZADZA] Définis VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY ensemble. Stockage local utilisé.')
  }
  return new LocalStorageStore()
}

export type { ReportStore } from './store'

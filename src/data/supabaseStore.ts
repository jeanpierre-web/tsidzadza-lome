import type { NewReport, Report, Status } from '../types'
import type { ReportStore } from './store'

/**
 * EMPLACEMENT pour un futur backend Supabase — NON IMPLÉMENTÉ.
 *
 * Table suggérée `reports` : id uuid pk, lat float8, lng float8,
 * level text check (level in ('cheville','genou','taille')), quartier text,
 * photo_path text (Supabase Storage), created_at timestamptz default now(),
 * status text default 'en_attente', is_test bool default true, source text.
 * RLS : lecture publique limitée à status = 'valide' (positions arrondies),
 * écriture via une Edge Function (formulaire + webhook WhatsApp), modération authentifiée.
 */
export class SupabaseStore implements ReportStore {
  readonly kind = 'supabase' as const
  constructor(
    readonly url: string,
    readonly anonKey: string,
  ) {}
  private todo(): never {
    throw new Error('SupabaseStore : pas encore implémenté (prototype local).')
  }
  list(): Promise<Report[]> {
    return this.todo()
  }
  add(_input: NewReport): Promise<Report> {
    return this.todo()
  }
  setStatus(_id: string, _status: Status): Promise<Report> {
    return this.todo()
  }
  reset(): Promise<void> {
    return this.todo()
  }
}

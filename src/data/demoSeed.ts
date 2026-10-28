import { buildDemoReports } from './demo'

/** SQL optionnel : 25 signalements TEST, dates relatives au moment de l'exécution. */
export function demoSeedSql(now = new Date('2026-10-27T12:00:00Z')): string {
  const rows = buildDemoReports(now)
  const values = rows.map((r) => {
    const hours = Math.max(1, Math.round((now.getTime() - Date.parse(r.createdAt)) / 3_600_000))
    return `  ('${r.id}', ${r.lat}, ${r.lng}, '${r.level}', '${r.quartier}', null, now() - interval '${hours} hours', '${r.status}', true, 'demo')`
  })
  return `-- Optionnel. 25 signalements de démonstration, tous marqués TEST.
-- À lancer dans le SQL Editor après supabase/schema.sql.
-- Les dates sont relatives à l'instant où tu exécutes ce fichier.
-- Les illustrations « TEST » sont dessinées par l'application : aucune photo n'est stockée ici.

insert into public.reports (id, lat, lng, level, quartier, photo, created_at, status, is_test, source)
values
${values.join(',\n')}
on conflict (id) do nothing;
`
}
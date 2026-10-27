-- TSIDZADZA · Lomé — stockage partagé (à lancer une fois dans le SQL Editor Supabase).
-- Le pas à pas est dans le README, section « Carte partagée (Supabase) ».
-- Sans ces tables, l'application continue avec le stockage du téléphone.
--
-- Ce script :
--  * crée la table des signalements (les ajouts publics sont forcés TEST) ;
--  * expose une vue en lecture seule, positions arrondies à ~100 m ;
--  * autorise l'ajout et le changement de statut sans compte (prototype) ;
--  * crée le bac public « report-photos » pour les JPEG.
-- La modération n'a pas de mot de passe : ne mets ici que des données de test.

create table if not exists public.reports (
  id text primary key check (id ~ '^[A-Za-z0-9._-]{8,80}$'),
  lat double precision not null check (lat = lat and lat between -90 and 90),
  lng double precision not null check (lng = lng and lng between -180 and 180),
  level text not null check (level in ('cheville', 'genou', 'taille')),
  quartier text check (quartier is null or quartier in ('nyekonakpoe', 'be', 'agbalepedogan', 'awatame', 'segbe')),
  photo text,
  created_at timestamptz not null default now(),
  status text not null default 'en_attente' check (status in ('en_attente', 'valide', 'rejete')),
  is_test boolean not null default true,
  source text not null default 'web' check (source in ('demo', 'web', 'whatsapp'))
);

comment on table public.reports is
  'Signalements TSIDZADZA. Les ajouts via l''API sont marqués TEST et en attente.';

create index if not exists reports_created_at_idx on public.reports (created_at desc);

alter table public.reports enable row level security;

-- Aucune policy pour anon : la table brute (position précise) n'est pas lisible par l'application.
revoke all on table public.reports from anon, authenticated, public;

-- Vue publique : la position est arrondie à 3 décimales (~100 m). is_test est toujours vrai.
create or replace view public.reports_public
with (security_invoker = false) as
select
  id,
  round(lat::numeric, 3)::float8 as lat,
  round(lng::numeric, 3)::float8 as lng,
  level,
  quartier,
  photo,
  created_at,
  status,
  true as is_test,
  source
from public.reports;

grant select on public.reports_public to anon, authenticated;

-- Ajout. Le téléphone ne choisit ni le statut, ni is_test, ni la source.
create or replace function public.create_report(
  p_id text,
  p_lat double precision,
  p_lng double precision,
  p_level text,
  p_quartier text,
  p_photo text
) returns public.reports_public
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.reports_public;
begin
  if p_id is null or p_id !~ '^[A-Za-z0-9._-]{8,80}$' then
    raise exception 'Position invalide';
  end if;
  if p_level not in ('cheville', 'genou', 'taille') then
    raise exception 'Niveau invalide';
  end if;
  if p_lat is null or p_lng is null or p_lat <> p_lat or p_lng <> p_lng
     or p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then
    raise exception 'Position invalide';
  end if;
  if p_quartier is not null and p_quartier not in ('nyekonakpoe', 'be', 'agbalepedogan', 'awatame', 'segbe') then
    raise exception 'Quartier invalide';
  end if;
  if p_photo is not null and btrim(p_photo) <> '' then
    if p_photo !~ '^https://[^[:space:]]+/storage/v1/object/public/report-photos/[A-Za-z0-9._-]+$' then
      raise exception 'Photo invalide';
    end if;
  else
    p_photo := null;
  end if;

  insert into public.reports (id, lat, lng, level, quartier, photo, status, is_test, source)
  values (p_id, p_lat, p_lng, p_level, p_quartier, p_photo, 'en_attente', true, 'web')
  on conflict (id) do nothing;

  select * into result from public.reports_public where id = p_id;
  if result is null then
    raise exception 'Signalement introuvable';
  end if;
  return result;
end;
$$;

create or replace function public.set_report_status(report_id text, new_status text)
returns public.reports_public
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.reports_public;
begin
  if new_status not in ('en_attente', 'valide', 'rejete') then
    raise exception 'Statut invalide';
  end if;
  update public.reports set status = new_status where id = report_id;
  if not found then
    raise exception 'Signalement introuvable';
  end if;
  select * into result from public.reports_public where id = report_id;
  return result;
end;
$$;

revoke all on function public.create_report(text, double precision, double precision, text, text, text) from public;
revoke all on function public.set_report_status(text, text) from public;
grant execute on function public.create_report(text, double precision, double precision, text, text, text) to anon, authenticated;
grant execute on function public.set_report_status(text, text) to anon, authenticated;

-- Photos. Lecture publique, ajout seulement. Pas de suppression depuis l'application.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', true, 409600, array['image/jpeg', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "tsidzadza_photos_lecture" on storage.objects;
create policy "tsidzadza_photos_lecture"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'report-photos');

drop policy if exists "tsidzadza_photos_ajout" on storage.objects;
create policy "tsidzadza_photos_ajout"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'report-photos'
  and name ~ '^[A-Za-z0-9._-]+$'
);

notify pgrst, 'reload schema';

-- Optionnel. 25 signalements de démonstration, tous marqués TEST.
-- À lancer dans le SQL Editor après supabase/schema.sql.
-- Les dates sont relatives à l'instant où tu exécutes ce fichier.
-- Les illustrations « TEST » sont dessinées par l'application : aucune photo n'est stockée ici.

insert into public.reports (id, lat, lng, level, quartier, photo, created_at, status, is_test, source)
values
  ('demo-nyekonakpoe-1', 6.13514, 1.20673, 'genou', 'nyekonakpoe', null, now() - interval '31 hours', 'valide', true, 'demo'),
  ('demo-nyekonakpoe-2', 6.12711, 1.20994, 'taille', 'nyekonakpoe', null, now() - interval '63 hours', 'valide', true, 'demo'),
  ('demo-nyekonakpoe-3', 6.13389, 1.20711, 'genou', 'nyekonakpoe', null, now() - interval '18 hours', 'valide', true, 'demo'),
  ('demo-nyekonakpoe-4', 6.12643, 1.21351, 'cheville', 'nyekonakpoe', null, now() - interval '40 hours', 'valide', true, 'demo'),
  ('demo-nyekonakpoe-5', 6.13466, 1.21291, 'genou', 'nyekonakpoe', null, now() - interval '57 hours', 'en_attente', true, 'demo'),
  ('demo-be-1', 6.13636, 1.24612, 'taille', 'be', null, now() - interval '38 hours', 'valide', true, 'demo'),
  ('demo-be-2', 6.1383, 1.24637, 'genou', 'be', null, now() - interval '13 hours', 'valide', true, 'demo'),
  ('demo-be-3', 6.13684, 1.25481, 'taille', 'be', null, now() - interval '45 hours', 'valide', true, 'demo'),
  ('demo-be-4', 6.14443, 1.2413, 'cheville', 'be', null, now() - interval '61 hours', 'valide', true, 'demo'),
  ('demo-be-5', 6.145, 1.24678, 'genou', 'be', null, now() - interval '9 hours', 'en_attente', true, 'demo'),
  ('demo-agbalepedogan-1', 6.19823, 1.19609, 'cheville', 'agbalepedogan', null, now() - interval '44 hours', 'valide', true, 'demo'),
  ('demo-agbalepedogan-2', 6.19829, 1.20096, 'genou', 'agbalepedogan', null, now() - interval '57 hours', 'valide', true, 'demo'),
  ('demo-agbalepedogan-3', 6.19528, 1.20043, 'cheville', 'agbalepedogan', null, now() - interval '37 hours', 'valide', true, 'demo'),
  ('demo-agbalepedogan-4', 6.19314, 1.19583, 'genou', 'agbalepedogan', null, now() - interval '46 hours', 'valide', true, 'demo'),
  ('demo-agbalepedogan-5', 6.18416, 1.1974, 'taille', 'agbalepedogan', null, now() - interval '49 hours', 'en_attente', true, 'demo'),
  ('demo-awatame-1', 6.17527, 1.16128, 'taille', 'awatame', null, now() - interval '52 hours', 'valide', true, 'demo'),
  ('demo-awatame-2', 6.17989, 1.17315, 'taille', 'awatame', null, now() - interval '27 hours', 'valide', true, 'demo'),
  ('demo-awatame-3', 6.1728, 1.16973, 'genou', 'awatame', null, now() - interval '14 hours', 'valide', true, 'demo'),
  ('demo-awatame-4', 6.18611, 1.16575, 'cheville', 'awatame', null, now() - interval '71 hours', 'valide', true, 'demo'),
  ('demo-awatame-5', 6.1813, 1.16843, 'genou', 'awatame', null, now() - interval '34 hours', 'en_attente', true, 'demo'),
  ('demo-segbe-1', 6.19326, 1.10825, 'cheville', 'segbe', null, now() - interval '48 hours', 'valide', true, 'demo'),
  ('demo-segbe-2', 6.19521, 1.11874, 'cheville', 'segbe', null, now() - interval '61 hours', 'valide', true, 'demo'),
  ('demo-segbe-3', 6.19623, 1.11565, 'genou', 'segbe', null, now() - interval '3 hours', 'valide', true, 'demo'),
  ('demo-segbe-4', 6.1827, 1.12201, 'genou', 'segbe', null, now() - interval '25 hours', 'valide', true, 'demo'),
  ('demo-segbe-5', 6.18309, 1.10806, 'taille', 'segbe', null, now() - interval '14 hours', 'en_attente', true, 'demo')
on conflict (id) do nothing;

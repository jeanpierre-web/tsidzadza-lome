# TSIDZADZA · Lomé — prototype de carte citoyenne des inondations

> ⚠️ **Prototype. Toutes les données affichées sont des DONNÉES DE DÉMONSTRATION — TEST.**
> Même un signalement saisi pendant un essai reste marqué TEST. Ce site n'est pas un service d'urgence.

Projet personnel de Jean-Pierre AMONY (candidature Swarovski Creatives for Our Future).
Ce dépôt contient la brique « carte web + formulaire mobile de signalement ». Le bot WhatsApp et l'alerte animée viendront ensuite.

## Ce que fait le prototype
- **Carte du Grand Lomé** (Leaflet + tuiles OpenStreetMap, attribution affichée en bas à droite). Les signalements sont des pastilles colorées par niveau d'eau :
  jaune = cheville, orange = genou, rouge = taille. Une pastille blanche en pointillés = en attente de modération.
- **Fenêtre d'un signalement** : photo (illustration pour la démo), pictogramme, quartier, heure (fuseau Africa/Lome), statut « Validé » ou « En attente de modération », étiquette TEST.
- **5 quartiers pilotes** (Nyékonakpoè, Bè, Agbalépédogan, Awatamé, Ségbé) : un filtre par quartier avec le nombre de signalements validés par niveau, les signalements en attente et l'historique récent.
- **Parcours « Signaler »** en 4 écrans, gros boutons, très peu de texte :
  1. une photo : deux boutons, **Appareil** et **Galerie**. L'image est réduite sur le téléphone (grand côté 800 px, JPEG). Si elle est trop lourde ou illisible, on peut continuer sans photo ;
  2. le lieu : **Ma position** (position récente acceptée, sans forcer le GPS précis). Si le téléphone refuse, si ça dure trop longtemps, ou s'il n'y a pas de position, un message le dit et il reste à toucher la carte. Le quartier est proposé, et se change d'un toucher ;
  3. le niveau, avec 3 grands pictogrammes ;
  4. vérifier (sans coordonnées chiffrées), puis envoyer. L'écran suivant montre le pictogramme choisi et rappelle que c'est **en attente**, en pointillés, et marqué TEST.
- **Modération** (URL `#/moderation`) : valider, rejeter ou annuler. **Sans authentification, c'est un prototype.** Un bouton permet aussi de remettre les données de démo.
- **« Urgence : 170 »** dans l'en-tête, qui lance l'appel `tel:170`. Le pied de page rappelle les 5 numéros relayés par l'ANPC et précise que ce site n'est pas un service d'urgence.
- **Emplacement pour l'alerte animée** : le cadre reste visible. Pour le remplir, déposer `src/assets/alerte.mp4` ou `src/assets/alerte.webm` (idéalement moins de 1,5 Mo, 10–15 s, sans texte) puis reconstruire, ou définir `VITE_ALERT_VIDEO_URL`. Si la personne a demandé moins d'animations, la vidéo ne démarre pas toute seule.
- **Liens directs** utiles depuis WhatsApp : `#/signaler` ouvre le formulaire et `#/quartiers` le panneau des quartiers.

## Lancer
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests Vitest
npm run build      # site statique dans dist/ (base relative './')
npx vite preview --port 4173 &  npm run screenshots   # captures dans screenshots/
```
Le build utilise une base relative et des routes en `#/`. Le dossier `dist/` peut donc aller tel quel sur GitHub Pages (sous-dossier) ou sur Vercel, sans configuration de réécriture.

Le site publié est <https://jeanpierre-web.github.io/tsidzadza-lome/>. Le workflow `.github/workflows/pages.yml` déploie **à chaque push sur `main`**. Un merge déploie donc le site en ligne.

## Hors ligne et installation
Après une visite en ligne, un service worker garde l'écran (HTML, JS, CSS, polices). On peut ensuite rouvrir la page sans réseau, et l'ajouter à l'écran d'accueil (Chrome : menu → Ajouter à l'écran d'accueil). Le manifeste est `public/manifest.json` (JSON, bien servi par GitHub Pages), avec `start_url` et `scope` relatifs (`./`).

Les tuiles OpenStreetMap ne sont pas mises en cache : leur serveur n'est pas fait pour ça, et la carte a besoin du réseau. Si elle est grise, **Ma position** suffit pour envoyer.

Sans Supabase, un signalement est enregistré tout de suite sur le téléphone. Avec Supabase, si le réseau coupe au moment d'envoyer, il reste sur le téléphone et part tout seul dès que la connexion revient (au retour en ligne, ou dans la minute si l'onglet est ouvert).

Les polices (Bricolage Grotesque, Instrument Sans, latin, SIL OFL) sont dans `src/fonts/`. Plus d'appel à Google Fonts.

## Données de démonstration (TEST)
- Il y a **25 signalements fictifs**, 5 par quartier pilote, générés de façon déterministe dans `src/data/demo.ts`. Ils portent tous `isTest: true`. Les dates sont relatives au moment du chargement (dernières 72 h).
- La répartition des niveaux est **inventée pour la démo** et ne reflète aucun événement réel.
- Les « photos » sont des **illustrations SVG générées** (`src/data/demoPhoto.ts`) qui portent les mentions « ILLUSTRATION » et « TEST ». Aucune vraie photo d'inondation n'est utilisée.
- Le bandeau « DONNÉES DE DÉMONSTRATION — TEST » est permanent, et chaque pastille de la carte affiche « TEST ».
- Dans ce prototype, **même un signalement saisi à la main est marqué TEST**. Sans Supabase, il reste dans le navigateur (localStorage). Avec Supabase, l'API le force aussi en TEST (voir plus bas).

## Coordonnées des quartiers (approximatives)
Elles viennent d'OpenStreetMap, via l'API Nominatim (requêtes du 27 oct. 2026). Les données OSM sont sous licence ODbL.

| Quartier | lat, lng | Objet OSM utilisé |
|---|---|---|
| Nyékonakpoè | 6.1302, 1.2059 | limite administrative « Nyékonakpoé » (4e arr.) |
| Bè | 6.1427, 1.2485 | limite administrative « Bè » (3e arr.) |
| Agbalépédogan | 6.1919, 1.1996 | limite administrative « Agbalépédogan » (5e arr.) |
| Awatamé | 6.1783, 1.1690 | point « Marché d'Awatamé » (pas de limite de quartier dans OSM) |
| Ségbé | 6.1884, 1.1160 | « cimetière de Ségbé », route vers Ségbé (pas de limite de quartier dans OSM) : **très approximatif** |

Les cercles en pointillés sur la carte (rayon de 1,1 km) sont **indicatifs**. Ce ne sont pas les limites officielles des quartiers.

## Numéro d'urgence
D'après l'ANPC (2 juil. 2026, voir `SOURCES-inondations-Lome.md`, source A2), il faut signaler les situations dangereuses aux numéros **170, 118, 1014, 1244 et 171**. L'ANPC cite donc bien le 170 parmi les numéros d'urgence. En revanche, la source **ne dit pas quel service répond au 170**, ni s'il s'agit des sapeurs-pompiers. C'est à confirmer avant toute alerte publique.

## Architecture
```
src/
  types.ts            Report, Level, Status
  levels.ts           3 niveaux (couleurs, libellés) + parseLevel() pour le futur bot
  quartiers.ts        quartiers pilotes + quartier le plus proche
  testLabel.ts        bandeau et étiquettes TEST
  data/store.ts       interface ReportStore + validation
  data/localStore.ts  implémentation localStorage (sans variables d'environnement)
  data/supabaseStore.ts  carte partagée, API REST Supabase (sans le SDK)
  data/demo.ts, demoPhoto.ts, demoSeed.ts  données TEST, illustrations, SQL optionnel
  media/compressImage.ts  réduction des photos sur le téléphone
  components/         MapView, QuartierPanel, ReportFlow, Moderation, AlertSlot, Icons
supabase/schema.sql   table, vue, fonctions, bac photos — à lancer une fois
supabase/seed-demo.sql  optionnel : les 25 signalements TEST
public/sw.js, manifest.json
```
### Variables d'environnement (toutes facultatives, voir `.env.example`)
- `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` : **les deux ensemble** activent la carte partagée. Une seule des deux, ou aucune, et le téléphone reste en localStorage.
- `VITE_ALERT_VIDEO_URL` : vidéo d'alerte déjà en ligne. Sinon, un fichier `src/assets/alerte.mp4` ou `.webm`.

## Carte partagée (Supabase)

Aucun compte n'est créé par le dépôt. Quand tu veux que les téléphones du test voient les mêmes signalements :

1. Crée un projet gratuit sur [supabase.com](https://supabase.com).
2. Ouvre **SQL Editor**, colle `supabase/schema.sql`, exécute. Cela crée :
   - la table `reports` ;
   - la vue `reports_public` (lecture seule, position arrondie à 3 décimales, soit environ 100 m, et `is_test` toujours vrai) ;
   - les fonctions `create_report` et `set_report_status` (un ajout est forcé `en_attente`, `is_test = true`, `source = web`) ;
   - le bac public `report-photos` (JPEG ou WebP, 400 Ko max).
3. Optionnel : exécute aussi `supabase/seed-demo.sql` pour afficher les 25 signalements de démo. Les dessins TEST sont faits par l'application, ils ne sont pas dans la base.
4. Dans **Project Settings → API**, copie l'URL du projet et la clé **anon / public** (pas la clé `service_role`).
5. En local : fichier `.env.local` (déjà ignoré par git) avec
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
   puis `npm run dev`.
6. Pour le site GitHub Pages : **Settings → Secrets and variables → Actions**, crée les secrets `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (et, si besoin, `VITE_ALERT_VIDEO_URL`). Le workflow les lit au moment du build. Tant qu'ils sont vides, le site publié reste en localStorage. Il faut un nouveau déploiement (push sur `main`) après avoir ajouté les secrets.

Limites assumées de ce prototype :

- la clé anon est dans le site, visible par quiconque charge la page ;
- **n'importe qui peut modérer** (`#/moderation`), il n'y a pas de mot de passe ;
- la position précise reste dans la table (visible dans le tableau de bord Supabase) mais l'application ne reçoit que la position arrondie ;
- les photos du bac sont publiques ;
- le bouton « Remettre les données de démonstration » est retiré : un téléphone ne peut pas vider la carte des autres.

La file d'attente sur le téléphone reprend l'envoi toute seule. Un signalement n'est pas mis de côté si le serveur refuse l'accès (clé ou SQL manquant) : un message le dit.

## Prochaines étapes
1. **Bot WhatsApp de test.** C'est Pierre qui crée les comptes. Deux options :
   - la **sandbox Twilio**, la plus rapide : chaque testeur envoie d'abord « join <code> ». Un webhook reçoit la photo, la position partagée et le niveau, que `parseLevel()` reconnaît (« 1 », « genou »…) ;
   - le **numéro de test de l'API WhatsApp Cloud de Meta** : il faut un compte Meta développeur, et seuls quelques numéros destinataires enregistrés sont acceptés.
   - En secours, un message WhatsApp contient le lien `…/#/signaler`.
2. **Supabase** — le client, le SQL et le bac photos sont en place (voir ci-dessus). Il reste, plus tard :
   - une Edge Function pour le webhook WhatsApp ;
   - une vraie connexion pour modérer (aujourd'hui, la clé anon peut changer le statut) ;
   - décider si la lecture publique doit cacher les signalements encore en attente.
3. **Déploiement** : GitHub Pages est branché sur `main`. Un autre hébergeur (Vercel) peut prendre le même `dist/`.
4. **Alerte animée** : déposer la vidéo de Pierre (10–15 s, sans texte) dans `src/assets/alerte.mp4`.
5. **Protection des données** :
   - flouter ou retirer les visages ;
   - ne jamais publier les numéros de téléphone ;
   - arrondir les positions sur la carte publique (déjà le cas de la vue Supabase : 3 décimales).

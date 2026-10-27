# TSIDZADZA · Lomé — prototype de carte citoyenne des inondations

> ⚠️ **Prototype local. Toutes les données affichées sont des DONNÉES DE DÉMONSTRATION — TEST.**
> Aucun signalement n'est réel. Rien n'est publié ni déployé.

Projet personnel de Jean-Pierre AMONY (candidature Swarovski Creatives for Our Future).
Ce dépôt contient la brique « carte web + formulaire mobile de signalement ». Le bot WhatsApp et l'alerte animée viendront ensuite.

## Ce que fait le prototype
- **Carte du Grand Lomé** (Leaflet + tuiles OpenStreetMap, attribution affichée en bas à droite). Les signalements sont des pastilles colorées par niveau d'eau :
  jaune = cheville, orange = genou, rouge = taille. Une pastille blanche en pointillés = en attente de modération.
- **Fenêtre d'un signalement** : photo (illustration pour la démo), pictogramme, quartier, heure (fuseau Africa/Lome), statut « Validé » ou « En attente de modération », étiquette TEST.
- **5 quartiers pilotes** (Nyékonakpoè, Bè, Agbalépédogan, Awatamé, Ségbé) : un filtre par quartier avec le nombre de signalements validés par niveau, les signalements en attente et l'historique récent.
- **Parcours « Signaler »** en 4 écrans et très peu de texte :
  1. une photo (appareil photo du téléphone ou galerie, réduite à 800 px) ;
  2. le lieu (« Ma position » par géolocalisation, ou toucher la carte), avec le quartier en option, proposé automatiquement ;
  3. le niveau, avec 3 grands pictogrammes SVG ;
  4. vérifier, puis envoyer.
  Le nouveau signalement est **« en attente »** et marqué TEST.
- **Modération** (URL `#/moderation`) : valider, rejeter ou annuler. **Sans authentification, c'est un prototype.** Un bouton permet aussi de remettre les données de démo.
- **« Urgence : 170 »** dans l'en-tête, qui lance l'appel `tel:170`. Le pied de page rappelle les 5 numéros relayés par l'ANPC et précise que ce site n'est pas un service d'urgence.
- **Emplacement pour l'alerte animée** : il suffit de définir `VITE_ALERT_VIDEO_URL` (MP4/WebM) ou de remplacer `src/components/AlertSlot.tsx` par un lecteur Lottie.
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

## Données de démonstration (TEST)
- Il y a **25 signalements fictifs**, 5 par quartier pilote, générés de façon déterministe dans `src/data/demo.ts`. Ils portent tous `isTest: true`. Les dates sont relatives au moment du chargement (dernières 72 h).
- La répartition des niveaux est **inventée pour la démo** et ne reflète aucun événement réel.
- Les « photos » sont des **illustrations SVG générées** (`src/data/demoPhoto.ts`) qui portent les mentions « ILLUSTRATION » et « TEST ». Aucune vraie photo d'inondation n'est utilisée.
- Le bandeau « DONNÉES DE DÉMONSTRATION — TEST » est permanent, et chaque pastille de la carte affiche « TEST ».
- Dans ce prototype, **même un signalement saisi à la main est marqué TEST**. Il est stocké uniquement dans le navigateur (localStorage).

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
  data/localStore.ts  implémentation localStorage (actuelle)
  data/supabaseStore.ts  stub Supabase (non implémenté, schéma proposé en commentaire)
  data/demo.ts, demoPhoto.ts  données et illustrations TEST
  components/         MapView, QuartierPanel, ReportFlow, Moderation, AlertSlot, Icons
```
### Variables d'environnement (toutes facultatives, voir `.env.example`)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` : réservées au futur backend. Aujourd'hui elles sont **ignorées**, et le stockage local reste utilisé.
- `VITE_ALERT_VIDEO_URL` : vidéo de l'alerte animée.

## Prochaines étapes
1. **Bot WhatsApp de test.** C'est Pierre qui crée les comptes. Deux options :
   - la **sandbox Twilio**, la plus rapide : chaque testeur envoie d'abord « join <code> ». Un webhook reçoit la photo, la position partagée et le niveau, que `parseLevel()` reconnaît (« 1 », « genou »…) ;
   - le **numéro de test de l'API WhatsApp Cloud de Meta** : il faut un compte Meta développeur, et seuls quelques numéros destinataires enregistrés sont acceptés.
   - En secours, un message WhatsApp contient le lien `…/#/signaler`.
2. **Supabase** :
   - implémenter `SupabaseStore` (table `reports`, Storage pour les photos) ;
   - ajouter une Edge Function pour le webhook WhatsApp ;
   - activer RLS : lecture publique des seuls signalements validés, avec des positions arrondies ;
   - exiger une connexion pour modérer.
3. **Déploiement** de `dist/` sur Vercel ou GitHub Pages, après accord de Pierre.
4. **Alerte animée** : intégrer la vidéo de Pierre (10–15 s, sans texte).
5. **Protection des données** :
   - flouter ou retirer les visages ;
   - ne jamais publier les numéros de téléphone ;
   - arrondir les positions sur la carte publique.

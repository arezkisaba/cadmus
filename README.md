# Cadmus

Application PWA de flashcards pour apprendre efficacement une nouvelle langue.

Les catégories de vocabulaire sont générées par IA (DeepSeek) à partir d'un simple prompt, illustrées par des photos (Pixabay, optionnel), et stockées **localement** dans le navigateur (IndexedDB + localStorage). Fonctionne **hors-ligne** après un premier chargement, sur Raspberry Pi et mobile.

**📖 Conventions de code à respecter :**
- [.github/NAMING-CONVENTIONS-JSTS.md](.github/NAMING-CONVENTIONS-JSTS.md) — règles de nommage JS/TS/JSX/TSX
- [.github/NAMING-CONVENTIONS-REACT.md](.github/NAMING-CONVENTIONS-REACT.md) — conventions spécifiques React

## Fonctionnalités

- **Génération par IA** : créez une catégorie à partir d'un prompt (ex: `les vêtements de tous les jours`). DeepSeek génère la liste de vocabulaire (mot en langue source → traduction en langue cible).
- **Paires de langues configurables** : choisissez la langue source et la langue cible dans les réglages (défaut: Français → Anglais).
- **Photos optionnelles** : illustrez chaque carte avec une image trouvée via l'API Pixabay (clé optionnelle).
- **Répétition espacée (Leitner)** : chaque carte est notée "je savais / je ne savais pas" et ré-apparaît selon des intervalles croissants (niveaux 0 à 5).
- **100% local** : catégories et cartes stockées en IndexedDB, réglages (clés API, langues) en localStorage.
- **PWA hors-ligne** : service worker + manifest. Un premier chargement sur le réseau local met toutes les ressources en cache, l'application fonctionne ensuite sans connexion.

## Architecture

Application **frontend-only** (pas de backend) construite avec :

- React 19 + Vite + TypeScript strict
- Tailwind CSS 4 + composants Shadcn UI
- Injection de dépendances (tsyringe) + clean architecture (features / services / ports)
- Dexie (IndexedDB) pour la persistance
- Jest pour les tests

```
frontend/src/
├── components/            # Layout, sidebar, thème, composants UI (Shadcn)
├── di-constants.ts        # Tokens d'injection de dépendances
├── container.ts           # Enregistrement des services (tsyringe)
├── features/
│   ├── _shared/services/  # DatabaseService (Dexie)
│   ├── ai/                # DeepSeekService (génération de vocabulaire)
│   ├── images/            # ImageSearchService (Pixabay)
│   ├── categories/        # Gestion des catégories (pages, service)
│   ├── flashcards/        # Révision des cartes (système Leitner)
│   └── settings/          # Réglages (clés API, langues)
shared/src/
└── models/                # Modèles partagés (IFlashcard, IFlashcardCategory...)
```

# Serveur de développement (https://localhost:4446)

```bash
# Prérequis: Node.js 20+ et openssl (pour le certificat local auto-signé)

# Installer les dépendances frontend
cd frontend && npm install

# Serveur de développement en HTTPS (https://localhost:4446)
# Le certificat auto-signé est généré automatiquement dans frontend/certs/ au premier lancement.
npm run dev

# Tests
npm test

# Build de production (génère dist/ + manifest + service worker)
npm run build

# Prévisualiser le build
npm run preview
```

## Réglages

1. Rendez-vous dans **Settings**.
2. Renseignez votre **clé API DeepSeek** (obligatoire, pour générer le vocabulaire) — [platform.deepseek.com](https://platform.deepseek.com/).
3. Optionnel : une **clé Pixabay** pour ajouter des photos sur les cartes — [pixabay.com/api/docs](https://pixabay.com/api/docs/).
4. Choisissez la **paire de langues**.
5. Les clés sont stockées uniquement dans votre navigateur (localStorage).

## Déploiement sur Raspberry Pi (ou serveur local)

Le build est entièrement statique (`frontend/dist`). Deux options :

### Option A — Docker

```bash
cd frontend && docker build -t cadmus ../ -f Dockerfile
# Monter les certificats (recommandé, HTTPS approuvé) ; sinon génération d'un certificat auto-signé à l'intérieur du conteneur
docker run -d -p 4446:4446 -v "$(pwd)/certs:/app/certs" cadmus
```

### Option B — Serveur statique simple (HTTPS)

```bash
cd frontend && npm run build
npm run serve
# https://localhost:4446 (certificat auto-signé généré dans frontend/certs/)
```

> Le certificat couvre `localhost`, `127.0.0.1` et l'IP LAN de la machine (détectée automatiquement).
> Pour forcer une IP LAN spécifique (ex. accès depuis le téléphone) : `CADMUS_LAN_IP=192.168.1.50 npm run serve`.

### HTTPS sur iPhone (via le Raspberry Pi 192.168.1.101)

Le certificat servi par le conteneur est signé par le **CA local mkcert** (généré dans `frontend/certs/`).
Pour que l'iPhone l'accepte, une seule installation :

1. **Transférer `frontend/certs/rootCA.pem`** vers l'iPhone (AirDrop / e-mail) et l'ouvrir → *Installer le profil*.
2. **Réglages → Général → VPN et gestion d'appareils** → installer le profil.
3. **Réglages → Général → Informations → Réglages de confiance des certificats** → activer la **confiance totale** pour ce certificat.
4. Ouvrir `https://192.168.1.101:4446` dans Safari → plus d'avertissement. *Ajouter à l'écran d'accueil* fonctionne alors (PWA + mode hors-ligne).

> Les certificats (`frontend/certs/`) sont copiés avec le dépôt vers le Pi puis **montés** dans le conteneur
> (volume `./frontend/certs:/app/certs` dans `docker-compose.prod.yml`). Le conteneur sert donc le **même
> certificat approuvé** → aucun re-import après chaque déploiement. Pour ajouter une IP au certificat :
> `CADMUS_LAN_IP=192.168.1.101 node frontend/scripts/ensure-certs.mjs` puis redéployer.

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

# Serveur de développement (https://localhost:4445)

```bash
# Prérequis: Node.js 20+ et openssl (pour le certificat local auto-signé)

# Installer les dépendances frontend
cd frontend && npm install

# Serveur de développement en HTTPS (https://localhost:4445)
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
docker run -d -p 4445:4445 -v "$(pwd)/certs:/app/certs" cadmus
```

### Option B — Serveur statique simple (HTTPS)

```bash
cd frontend && npm run build
npm run serve
# https://localhost:4445 (certificat auto-signé généré dans frontend/certs/)
```

> Le certificat couvre `localhost`, `127.0.0.1` et l'IP LAN de la machine (détectée automatiquement).
> Pour forcer une IP LAN spécifique (ex. accès depuis le téléphone) : `CADMUS_LAN_IP=192.168.1.50 npm run serve`.

### Installation PWA sur le téléphone

1. Connectez le téléphone au même réseau local que le Raspberry Pi.
2. Ouvrez `https://<ip-du-pi>:4445` dans le navigateur (Chrome / Safari) et **acceptez l'avertissement de certificat** (certificat auto-signé).
3. Une première visite charge et met toutes les ressources en cache.
4. Utilisez le menu du navigateur → *Ajouter à l'écran d'accueil* (Android) ou *Partager → Ajouter à l'écran d'accueil* (iOS).
5. L'application s'ouvre ensuite en plein écran et fonctionne **hors de votre réseau local**, sans connexion.

> ⚠️ iOS impose HTTPS pour *Ajouter à l'écran d'accueil*. Avec un certificat auto-signé, l'installation PWA
> complète sur iPhone nécessite d'installer le certificat comme profil de confiance (ou d'utiliser un vrai
> certificat via Let's Encrypt / nginx sur le Pi).

# Cadmus

Application **PWA** de flashcards pour apprendre efficacement une nouvelle langue. Déployée sur **GitHub Pages** : [https://arezkisaba.github.io/cadmus/](https://arezkisaba.github.io/cadmus/)

Les catégories de vocabulaire sont générées par **IA** (DeepSeek, Qwen, ChatGPT ou Claude) à partir d'un simple prompt, illustrées par des photos (Pixabay, Pexels, Unsplash ou Openverse, optionnel), et stockées **localement** dans le navigateur (IndexedDB + localStorage). Fonctionne **hors-ligne** après un premier chargement.

**📖 Conventions de code à respecter :**
- [.github/NAMING-CONVENTIONS-JSTS.md](.github/NAMING-CONVENTIONS-JSTS.md) — règles de nommage JS/TS/JSX/TSX
- [.github/NAMING-CONVENTIONS-REACT.md](.github/NAMING-CONVENTIONS-REACT.md) — conventions spécifiques React

## Fonctionnalités

- **Génération par IA** : créez une catégorie à partir d'un prompt (ex: `les vêtements de tous les jours`). Plusieurs providers sont supportés, utilisés en cascade : **DeepSeek**, **Qwen**, **ChatGPT**, **Claude** (clés configurées dans les réglages).
- **Types de contenu** : vocabulaire, expressions, grammaire, phrases utiles et conjugaisons — avec **5 niveaux de difficulté** (débutant → avancé).
- **Chat tuteur** : discutez avec l'IA pour poser des questions plus ouvertes (grammaire, sens d'une expression…).
- **Paires de langues configurables** : choisissez la langue source et la langue cible dans les réglages (défaut: Français → Anglais).
- **Photos optionnelles** : illustrez chaque carte via Pixabay, Pexels, Unsplash ou Openverse (clés optionnelles).
- **Répétition espacée (Leitner)** : chaque carte est notée "je savais / je ne savais pas" et ré-apparaît selon des intervalles croissants (niveaux 0 à 5).
- **100% local** : catégories et cartes stockées en IndexedDB, réglages (clés API, langues) en localStorage — aucune donnée n'est envoyée sur un serveur.
- **PWA hors-ligne** : service worker + manifest. Un premier chargement met toutes les ressources en cache, l'application fonctionne ensuite sans connexion.

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
│   ├── ai/                # Providers IA (DeepSeek, Qwen, ChatGPT, Claude)
│   ├── images/            # Providers d'images (Pixabay, Pexels, Unsplash, Openverse)
│   ├── categories/        # Gestion des catégories (pages, service)
│   ├── flashcards/        # Révision des cartes (système Leitner)
│   ├── chat/              # Chat tuteur
│   ├── songs/             # Chansons + traduction (iTunes / Lyrics.ovh)
│   └── settings/          # Réglages (clés API, langues)
shared/src/
└── models/                # Modèles partagés (IFlashcard, IFlashcardCategory...)
```

# Serveur de développement (https://localhost:4446)

```bash
# Prérequis: Node.js 20+ et mkcert (ou openssl) pour le certificat local

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
2. Renseignez au moins une **clé API** (utilisées en cascade si plusieurs) :
   - **DeepSeek** — [platform.deepseek.com](https://platform.deepseek.com/)
   - **Qwen** (Alibaba DashScope) — [dashscope.aliyuncs.com](https://dashscope.aliyuncs.com/)
   - **ChatGPT** (OpenAI) — [platform.openai.com](https://platform.openai.com/)
   - **Claude** (Anthropic) — [console.anthropic.com](https://console.anthropic.com/)
3. Optionnel : des **clés d'images** (Pixabay, Pexels, Unsplash) pour enrichir les cartes ; sans clé, Openverse/Wikimedia fournissent des photos libres.
4. Choisissez la **paire de langues**.
5. Les clés sont stockées uniquement dans votre navigateur (localStorage) — elles ne sont jamais envoyées au dépôt ni à un serveur.

## Déploiement sur GitHub Pages

Le build est entièrement statique (`frontend/dist`), déployé sur **GitHub Pages** via GitHub Actions.

**URL :** [https://arezkisaba.github.io/cadmus/](https://arezkisaba.github.io/cadmus/) (HTTPS fourni par GitHub — PWA et service worker fonctionnels).

### Comment ça marche

- Le workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) se déclenche à chaque **push sur `main`**.
- Il installe les dépendances, exécute `npm run build` avec la base `/cadmus/` (`DEPLOY_BASE`), génère le fallback SPA `404.html` et publie `frontend/dist` sur Pages.
- GitHub Pages sert l'application sous `/cadmus/` : le `base` de Vite, le `basename` de React Router, le manifest et le service worker sont tous adaptés automatiquement.

### Prérequis (une seule fois)

1. Repo **public** (Pages est gratuit sur les repos publics).
2. **Settings → Pages → Source : *GitHub Actions***.
3. Pousser sur `main` → l'action déploie.

### Version locale (serveur statique HTTPS)

```bash
cd frontend && npm run build
npm run serve
# https://localhost:4446 (certificat local généré dans frontend/certs/ avec mkcert)
```

> 💡 Chaque visiteur du site public doit saisir **ses propres clés API** dans les réglages
> (les clés sont stockées par origine, dans le `localStorage` de son navigateur — elles ne sont
> jamais envoyées au dépôt).

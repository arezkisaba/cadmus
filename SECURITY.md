# Sécurité — Configuration HTTPS

Ce document résume la configuration HTTPS mise en place pour Cadmus. Il s'agit d'une application
**frontend-only** (PWA) destinée à un usage local / réseau domestique. Le HTTPS est indispensable pour :

- L'installation **PWA** sur iOS (*Ajouter à l'écran d'accueil*), qui exige un site en HTTPS.
- Éviter tout avertissement de certificat dans les navigateurs.
- Bénéficier d'un contexte de navigation sécurisé (stockage des clés API en `localStorage`).

---

## 1. Principe retenu : un CA local (mkcert)

Plutôt qu'un certificat auto-signé (qui déclenche toujours un avertissement), Cadmus utilise un
**CA (autorité de certification) local** généré par **mkcert**. Le navigateur ne refuse plus le site
dès lors que ce CA est approuvé sur la machine.

- Le CA local est stocké dans `~/.local/share/mkcert/` (`rootCA.pem` + clé privée).
- Les certificats du site sont signés par ce CA et régénérés dans `frontend/certs/` (dossier ignoré par Git).

## 2. Couverture du certificat (SAN)

Le certificat du site couvre :

- `localhost`
- `127.0.0.1`
- L'**IP LAN de la machine**, détectée automatiquement (ex. `192.168.1.100`)
- Toute IP supplémentaire via la variable `CADMUS_LAN_IP`

> 💡 Le certificat est valable ~2 ans et se régénère automatiquement au démarrage s'il est absent.

## 3. Points d'accès HTTPS

| Mode | Adresse | Démarrage |
|---|---|---|
| Développement (Vite) | `https://localhost:4445` | `npm run dev` / `npm run debug` |
| Production (statique) | `https://localhost:4445` | `npm run serve` |
| Docker | port 4445 exposé | `docker run` |
| Réseau local (téléphone) | `https://<ip-du-pi>:4445` | tout mode (écoute sur `0.0.0.0`) |

## 4. Approuver le CA — étape unique par appareil

### PC (Linux, Brave/Chrome/Firefox)

1. Installer la confiance dans le magasin système :
   ```bash
   sudo mkcert -install
   ```
   > ⚠️ Cette commande gère le magasin système. Sous `sudo`, le `$HOME` devient `/root` : la partie
   > navigateur peut échouer avec *"no Firefox and/or Chrome/Chromium security databases found"*.
   > C'est **normal**, il faut ensuite l'étape 2.
2. Installer le CA dans la base NSS du navigateur (Brave/Chrome) :
   ```bash
   certutil -d "sql:$HOME/.pki/nssdb" -A -t "TCu,Cu,Tu" -n "mkcert" -i "$(mkcert -CAROOT)/rootCA.pem"
   ```
3. **Redémarrer complètement le navigateur** (pas juste fermer la fenêtre).

Après cela, `https://192.168.1.100:4445` s'ouvre **sans avertissement** dans Brave/Chrome.

### Firefox (magasin de certificats séparé)

Firefox n'utilise **ni le magasin système, ni la base NSS de Chrome** : il possède son **propre
magasin** (`cert9.db` dans son profil, ex. `~/snap/firefox/common/.mozilla/firefox/*/`). Il faut
donc y ajouter le CA séparément :

```bash
# Localiser le profil Firefox puis y installer le CA
PROF="$HOME/snap/firefox/common/.mozilla/firefox/w3cdfsmg.default"   # adapter à votre profil
certutil -d "sql:$PROF" -A -t "C,," -n "mkcert" -i "$(mkcert -CAROOT)/rootCA.pem"

# Vérifier que le CA apparaît bien (colonne SSL = C)
certutil -d "sql:$PROF" -L | grep -i mkcert
```

> ⚠️ Si l'ajout est fait **pendant que Firefox tourne**, Firefox peut l'effacer en se fermant :
> fermer Firefox, revérifier (réinstaller si besoin), puis rouvrir. Sans cette étape, Firefox affiche
> *"Be careful. Something doesn't look right"* (certificat non reconnu).

### iPhone / iPad (Safari)

1. Transférer le fichier `~/.local/share/mkcert/rootCA.pem` vers l'appareil (AirDrop, e-mail…).
2. L'ouvrir → **Installer le profil**.
3. **Réglages → Général → VPN et gestion d'appareils** → installer le profil.
4. **Réglages → Général → Informations → Réglages de confiance des certificats** → activer la
   **confiance totale** pour ce certificat.

Safari accepte alors `https://<ip>:4445` et l'installation PWA fonctionne.

---

## 5. Bonnes pratiques & limites

- **Usage local uniquement** : le CA et les certificats sont destinés au réseau domestique. Ne pas
  exposer le serveur à Internet avec ces certificats.
- **Clé privée protégée** : `frontend/certs/` et `~/.local/share/mkcert/` contiennent des clés
  privées → jamais commitées (dossier `frontend/certs/` ignoré par Git), pas de partage.
- **Clés API** : stockées uniquement dans le `localStorage` du navigateur (jamais côté serveur,
  l'application étant frontend-only).
- **Cache hors-ligne** : le service worker ne met en cache que les ressources de l'application et
  les images ; les données restent locales (IndexedDB + localStorage).

## 6. Problèmes fréquents

| Symptôme | Cause | Solution |
|---|---|---|
| `ERR_CERT_AUTHORITY_INVALID` | CA non approuvé par le navigateur | Suivre la section 4 puis redémarrer le navigateur |
| Firefox : *"Be careful. Something doesn't look right"* | CA absent du magasin propre à Firefox | Ajouter le CA dans le profil Firefox (section 4) et redémarrer Firefox |
| *"no Firefox/Chrome security databases found"* | `$HOME` = `/root` sous `sudo`, ou base NSS absente | Créer `~/.pki/nssdb` et ajouter le CA avec `certutil` (étape 2) |
| `192.168.1.100` non couvert par le certificat | IP LAN non détectée au moment de la génération | Régénérer avec `CADMUS_LAN_IP=192.168.1.100` |
| Port 4445 déjà occupé (ancien serveur HTTP) | Processus obsolète encore actif | Arrêter les anciens serveurs avant de lancer le HTTPS |

## 7. Commandes exécutées (récapitulatif)

```bash
# 1) Générer le CA local + les certificats du site (localhost + IP LAN)
cd frontend
CADMUS_LAN_IP="192.168.1.100,10.100.0.2" node scripts/ensure-certs.mjs

# 2) Approuver le CA dans le magasin système
#    (peut signaler l'absence de bases navigateur : normal, voir étapes 3 et 4)
sudo mkcert -install

# 3) Approuver le CA pour Brave / Chrome / Edge (base NSS utilisateur)
certutil -d "sql:$HOME/.pki/nssdb" -A -t "TCu,Cu,Tu" -n "mkcert" -i "$(mkcert -CAROOT)/rootCA.pem"

# 4) Approuver le CA pour Firefox (magasin du profil, navigateur fermé de préférence)
PROF="$HOME/snap/firefox/common/.mozilla/firefox/w3cdfsmg.default"
certutil -d "sql:$PROF" -A -t "C,," -n "mkcert" -i "$(mkcert -CAROOT)/rootCA.pem"

# 5) Vérifier le certificat réellement servi (issuer = mkcert development CA, SAN = IP LAN)
echo | openssl s_client -connect 127.0.0.1:4445 | openssl x509 -noout -issuer -ext subjectAltName

# 6) Lancer le serveur HTTPS
npm run serve   # ou : npm run dev

# 7) Après chaque installation de CA : redémarrer complètement le navigateur concerné
```

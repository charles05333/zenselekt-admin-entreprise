# Zenselekt 3.0 — Backoffice Entreprise

> Interface de gestion RH pour les entreprises abonnées à la plateforme **Zenselekt**, développée sous la marque **Empower Talents & Careers**.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Architecture du projet](#3-architecture-du-projet)
4. [Installation et démarrage](#4-installation-et-démarrage)
5. [Configuration selon l'environnement](#5-configuration-selon-lenvironnement)
6. [Routing](#6-routing)
7. [Sécurité — Patterns clés](#7-sécurité--patterns-clés)
8. [État d'avancement — Pages et fonctionnalités](#8-état-davancement--pages-et-fonctionnalités)
9. [Backend PHP attendu](#9-backend-php-attendu)
10. [Base de données — Tables clés](#10-base-de-données--tables-clés)
11. [Forfaits et quotas](#11-forfaits-et-quotas)
12. [Déploiement (OVH)](#12-déploiement-ovh)
13. [Conventions de code](#13-conventions-de-code)
14. [Points d'attention et bugs connus](#14-points-dattention-et-bugs-connus)

---

## 1. Vue d'ensemble

Ce dépôt contient exclusivement le **frontend React** du backoffice entreprise de Zenselekt 3.0.

L'application est une **SPA (Single Page Application)** Vite + React déployée à l'URL :

```
https://app.zenselekt.com/securebackoffice/
```

Elle communique avec un backend **PHP/MySQL** hébergé dans :

```
/securebackoffice/backsecurebackoffice/   ← API entreprise (PHP)
/backsuperadmin/                          ← Interface superadmin (dépôt séparé)
```

La SPA est **multi-tenant** : chaque entreprise possède un espace isolé par `entreprise_id`, stocké exclusivement en session PHP côté serveur.

> ⚠️ **État actuel du projet** : La majorité des pages utilisent encore des **données mockées** (hardcodées dans le JSX). Le branchement sur l'API PHP réelle est en cours. Voir §8 pour le détail page par page.

---

## 2. Stack technique

| Couche | Technologie | Version (package.json) |
|--------|-------------|------------------------|
| Framework UI | React | ^19.2.5 |
| Bundler | Vite + @vitejs/plugin-react | ^8.0.10 / ^6.0.1 |
| Routing | react-router-dom | ^7.14.2 |
| Graphiques | chart.js + react-chartjs-2 | ^4.5.1 / ^5.3.1 |
| Alertes | SweetAlert2 | ^11.26.24 (npm + CDN dynamique) |
| Icônes | Bootstrap Icons | 1.11.3 (CDN, chargement dynamique) |
| Export Word | docx | ^9.6.1 |
| Export PDF | jspdf + html2canvas | ^4.2.1 / ^1.4.1 |
| Sauvegarde fichier | file-saver | ^2.0.5 |
| Linter | ESLint + eslint-plugin-react-hooks | ^10.2.1 / ^7.1.1 |

**Notes importantes :**

- **SweetAlert2** est installé en dépendance npm **et** chargé dynamiquement depuis le CDN dans certaines pages (notamment `useSessionGuard.js`). Les deux coexistent ; préférer l'import npm pour les nouvelles pages.
- **Bootstrap Icons** est chargé uniquement depuis le CDN via un hook local `useBootstrapIcons()` défini dans chaque page concernée. Il n'est pas dans le bundle.
- **`xlsx` (SheetJS)** n'est **pas** dans les dépendances npm — l'export actuel utilise `file-saver` + `docx`. Ne pas confondre.

---

## 3. Architecture du projet

```
securebackoffice/
├── public/
│   └── icone.png                        # Favicon
├── src/
│   ├── main.jsx                         # Point d'entrée — BrowserRouter + Routes
│   ├── App.jsx                          # Page de connexion (login)
│   ├── assets/
│   │   ├── css/index.css                # Styles globaux de la page login
│   │   └── img/                         # Logos (zen.png, zena.png)
│   └── page/
│       ├── component/                   # Composants et hooks partagés
│       │   ├── useSessionGuard.js       # ⚠️ Hook critique — voir §7.1
│       │   ├── usePermissions.js        # Hook contrôle d'accès — voir §7.2
│       │   ├── SessionLoader.jsx        # Écran de chargement session
│       │   ├── Header.jsx               # Bandeau supérieur
│       │   ├── Navbar.jsx               # Barre de navigation latérale + chatbot intégré
│       │   └── css/
│       │       ├── Header.css
│       │       └── Navbar.css
│       ├── notation/                    # Module évaluation candidats
│       │   ├── postulantsnotations.jsx  # Pipeline de pré-sélection + entretiens
│       │   ├── evalgrid.jsx             # Grille d'évaluation technique
│       │   ├── rapportshortlist.jsx     # Rapport de shortlist
│       │   ├── TechEvaluationModal.jsx  # Modal entretien technique
│       │   ├── ExaminateurModal.jsx     # Gestion des examinateurs
│       │   ├── ExaminateurNotationModal.jsx
│       │   ├── ExaminateurDashboard.jsx
│       │   ├── Preselectionseuilmodal.jsx
│       │   └── css/                     # Styles spécifiques notation
│       ├── tests/                       # Pages de passation des tests psychotechniques
│       │   ├── pression.jsx             # Test Pression
│       │   ├── mbti.jsx                 # Test MBTI
│       │   ├── domino.jsx               # Test Dominos
│       │   ├── bigfive.jsx              # Test Big Five (Personnalité)
│       │   ├── anglais.jsx              # Test Anglais
│       │   ├── css/
│       │   └── images/
│       ├── css/                         # Styles par page
│       ├── Acceuil.jsx                  # Dashboard KPIs (données mockées)
│       ├── offres.jsx                   # Offres d'emploi (données mockées)
│       ├── modifier.jsx                 # Modifier une offre (données mockées)
│       ├── postes.jsx                   # Postes (lecture seule, données mockées)
│       ├── postulants.jsx               # Candidats postulants (données mockées)
│       ├── candidatheque.jsx            # CVthèque (données mockées + geocoding réel)
│       ├── spontanees.jsx               # Candidatures spontanées (données mockées)
│       ├── emploi.jsx                   # Portail emploi public (lecture)
│       ├── campagnes.jsx                # Campagnes de recrutement (données mockées)
│       ├── postulantcampagne.jsx        # Candidats d'une campagne (données mockées)
│       ├── tests.jsx                    # Gestion des tests psychotechniques
│       ├── resultatstests.jsx           # Résultats des tests candidats
│       ├── utilisateurs.jsx             # Gestion des sous-utilisateurs (données mockées)
│       ├── creerutil.jsx                # Créer un sous-utilisateur (données mockées)
│       ├── modifierutil.jsx             # Modifier un sous-utilisateur (données mockées)
│       └── documentation.jsx            # Documentation intégrée
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── eslint.config.js
```

---

## 4. Installation et démarrage

### Prérequis

- Node.js ≥ 18
- npm ≥ 9

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/charles05333/zenselekt-admin-entreprise.git
cd securebackoffice

# 2. Installer les dépendances
npm install

# 3. Démarrer en développement
npm run dev
```

En mode dev, Vite écoute sur `http://localhost:5173`.

> ⚠️ En développement local, les pages affichent des **données mockées** — pas besoin du backend PHP pour visualiser l'interface. Pour tester l'intégration API réelle (session, permissions…), le backend PHP doit être accessible et un proxy Vite configuré (voir §5).

### Build de production

```bash
npm run build
```

Les fichiers compilés sont générés dans `dist/`. Déposer le contenu dans `/securebackoffice/` sur le serveur OVH **après avoir basculé la configuration en mode production** (voir §5).

---

## 5. Configuration selon l'environnement

### ⚠️ Deux configurations coexistent dans le code (commentées/décommentées à la main)

Ce projet n'a pas de fichier `.env`. La bascule dev ↔ prod se fait manuellement dans **deux fichiers** :

#### `vite.config.js`

```js
// ── DÉVELOPPEMENT LOCAL ──
base: '/'

// ── PRODUCTION (OVH) — décommenter avant build ──
// base: '/securebackoffice/'
```

#### `src/main.jsx`

```jsx
// ── DÉVELOPPEMENT LOCAL ──
<BrowserRouter>   {/* sans basename */}

// ── PRODUCTION (OVH) — décommenter avant build ──
// <BrowserRouter basename="/securebackoffice">
```

> **Procédure de mise en prod :** avant `npm run build`, commenter la config dev et décommenter la config prod dans les deux fichiers ci-dessus. Remettre en config dev après le déploiement.

### URLs d'API

Les URLs d'API sont définies en dur dans chaque page (pas de `.env`). Les URLs dans `useSessionGuard.js` sont hardcodées en production :

```js
// Dans useSessionGuard.js (hardcodé — valable uniquement en production OVH)
const SESSION_CHECK_URL = "/securebackoffice/backsecurebackoffice/index.php?action=session_check";
const LOGOUT_URL        = "/securebackoffice/backsecurebackoffice/index.php?action=logout";
```

Pour les autres pages, pattern à suivre :

```js
// Développement
const API_BASE = "/backsecurebackoffice";

// Production (déployé sur OVH)
const API_BASE = "/securebackoffice/backsecurebackoffice";
```

> ⚠️ `useSessionGuard.js` cible directement `/securebackoffice/...` — en développement local sans proxy, le `session_check` échouera et redirigera vers le login. Configurer le proxy Vite ci-dessous pour travailler en local avec la session réelle.

### Proxy Vite pour développement local (optionnel)

Si le backend PHP tourne sur `http://localhost:8080`, ajouter dans `vite.config.js` :

```js
server: {
  proxy: {
    '/securebackoffice/backsecurebackoffice': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    }
  }
}
```

---

## 6. Routing

Toutes les routes sont déclarées dans `src/main.jsx` avec `BrowserRouter`.

| Route | Composant | Fichier | Description |
|-------|-----------|---------|-------------|
| `/` | `Login` | `App.jsx` | Page de connexion |
| `/acceuil` | `Acceuil` | `Acceuil.jsx` | Dashboard KPIs — toujours accessible |
| `/offres` | `Offres` | `offres.jsx` | Gestion des offres d'emploi |
| `/modifier/:id` | `Modifier` | `modifier.jsx` | Modifier une offre |
| `/emploi` | `Emploi` | `emploi.jsx` | Portail emploi public |
| `/postulants` | `Postulants` | `postulants.jsx` | Candidats postulants |
| `/candidatheque` | `Candidatheque` | `candidatheque.jsx` | CVthèque interne |
| `/spontanees` | `Spontanees` | `spontanees.jsx` | Candidatures spontanées |
| `/campagnes` | `Campagnes` | `campagnes.jsx` | Campagnes de recrutement |
| `/postulantcampagne` | `PostulantCampagne` | `postulantcampagne.jsx` | Candidats d'une campagne |
| `/tests` | `Tests` | `tests.jsx` | Gestion des tests psychotechniques |
| `/pression` | `Pression` | `tests/pression.jsx` | Passation test Pression |
| `/mbti` | `MBTI` | `tests/mbti.jsx` | Passation test MBTI |
| `/bigfive` | `Bigfive` | `tests/bigfive.jsx` | Passation test Big Five |
| `/domino` | `DOMINO` | `tests/domino.jsx` | Passation test Dominos |
| `/anglais` | `Anglais` | `tests/anglais.jsx` | Passation test Anglais |
| `/resultatstests` | `Resultatstests` | `resultatstests.jsx` | Résultats des tests |
| `/postes` | `Postes` | `postes.jsx` | Postes (offres approuvées, lecture seule) |
| `/utilisateurs` | `Utilisateurs` | `utilisateurs.jsx` | Sous-utilisateurs |
| `/creerutil` | `CreerUtil` | `creerutil.jsx` | Créer un sous-utilisateur |
| `/modifierutil/:id` | `Modifierutil` | `modifierutil.jsx` | Modifier un sous-utilisateur |
| `/postulantsnotations/:eventId` | `Postulantsnotations` | `notation/postulantsnotations.jsx` | Pipeline de notation |
| `/evalgrid` | `Evalgrid` | `notation/evalgrid.jsx` | Grille d'évaluation |
| `/rapportshortlist` | `Rapportshortlist` | `notation/rapportshortlist.jsx` | Rapport shortlist |
| `/documentation` | `Documentation` | `documentation.jsx` | Documentation intégrée |

> **Notes :**
> - La route `/acceuil` (orthographe volontaire) doit rester cohérente avec le backend PHP qui gère la redirection post-login.
> - Il n'y a pas de route `*` (404) dans le code actuel — à ajouter.
> - **Attention aux imports sensibles à la casse :** `main.jsx` importe `./page/Modifier` (M majuscule) alors que le fichier est `modifier.jsx`. Fonctionne sur Windows/macOS mais **plantera en production Linux (OVH)**. Voir §14.

---

## 7. Sécurité — Patterns clés

### 7.1 `useSessionGuard` — Hook de protection de session

Fichier : `src/page/component/useSessionGuard.js`

Tous les composants de pages protégées importent ce hook. Il est **le point d'entrée unique** pour la vérification de session.

```js
import { useSessionGuard } from "./component/useSessionGuard";

// Dans le composant :
const { checked, entreprise, loading, logout } = useSessionGuard();

// Bloquer le rendu avant vérification :
if (!checked) return <SessionLoader />;
```

**Ce que fait le hook :**
- Appelle `GET /securebackoffice/backsecurebackoffice/index.php?action=session_check` au montage avec `credentials: "include"` et `X-Requested-With: XMLHttpRequest`
- Redirige vers `/securebackoffice/` (`LOGIN_REDIRECT`) si la session est invalide, expirée, ou si la requête échoue
- Expose `entreprise` (objet avec `id`, `nom`, `forfait`, `isSubUser`, `permissions`, `subUserMenuPerms`…)
- Gère la déconnexion (`logout`) avec confirmation SweetAlert2 chargé dynamiquement depuis le CDN
- Timeout de requête à **10 secondes** (`AbortSignal.timeout(10000)`)

**Retour du hook :**

| Propriété | Type | Description |
|-----------|------|-------------|
| `entreprise` | `object\|null` | Données entreprise depuis la session PHP. `null` tant que non chargé. |
| `loading` | `boolean` | `true` pendant la requête `session_check` |
| `checked` | `boolean` | `true` une fois la session validée et `entreprise` renseigné |
| `logout` | `function` | Déclenche la confirmation SweetAlert puis POST vers `logout` et redirige |

**Objet `entreprise` retourné par `session_check` :**

```json
{
  "id": 42,
  "nom": "Entreprise XYZ",
  "forfait": "pme_small",
  "email": "contact@xyz.ci",
  "isSubUser": false,
  "permissions": [...],
  "subUserMenuPerms": []
}
```

### 7.2 `usePermissions` — Hook de contrôle d'accès par route

Fichier : `src/page/component/usePermissions.js`

Vérifie si une route est accessible selon le type de compte (principal ou sous-utilisateur) et les permissions de la session. Utilisé par `ProtectedRoute.jsx` pour bloquer l'accès direct par URL.

```js
import { usePermissions } from "./component/usePermissions";

const { canAccess } = usePermissions(entreprise);
const { allowed, reason } = canAccess("/offres");
```

**Logique de vérification :**

- **Compte principal** : consulte le tableau structuré `entreprise.permissions` (hiérarchie parent → enfant)
- **Sous-utilisateur** : consulte le tableau plat `entreprise.subUserMenuPerms` (clés simples)
- `/acceuil` est marqué `alwaysAllowed: true` — toujours accessible quel que soit le compte
- Route inconnue → refus par défaut (**fail-closed**)

**`ROUTE_PERMISSION_MAP`** — table de correspondance chemin React → clés de permission (exportée depuis `usePermissions.js`, partagée avec `Navbar.jsx`) :

| Route | parentPerm | childPerm |
|-------|-----------|-----------|
| `/acceuil` | — | — (toujours autorisé) |
| `/emploi` | `offres` | `emploi` |
| `/candidatheque` | `offres` | `candidatheque` |
| `/spontanees` | `offres` | `spontanees` |
| `/offres` | `offres` | `annonces` |
| `/utilisateurs` | `utilisateurs` | `liste-util` |
| `/creerutil` | `utilisateurs` | `creer-util` |
| `/tests` | `evaluations` | `tests` |
| `/campagnes` | `evaluations` | `campagnes` |
| `/postes` | `preselection` | `postes` |
| `/documentation` | `documentation` | `docs` |

### 7.3 `SessionLoader` — Écran de chargement

Fichier : `src/page/component/SessionLoader.jsx`

Composant affiché pendant la vérification de session (`!checked`). Spinner centré plein écran avec couleurs Zenselekt (`#1a7070`).

```jsx
import SessionLoader from "./component/SessionLoader";

// Usage type dans une page protégée :
const { checked, entreprise, logout } = useSessionGuard();
if (!checked) return <SessionLoader />;
```

### 7.4 `secureFetch` — Helper HTTP

À définir localement dans chaque page effectuant des appels API authentifiés :

```js
async function secureFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "X-Requested-With": "XMLHttpRequest",  // ← Validation CSRF côté PHP
      ...(options.headers ?? {}),
    },
    credentials: "include",                  // ← Envoi des cookies de session
    signal: options.signal ?? AbortSignal.timeout(15000),
  });
}
```

> Le header `X-Requested-With: XMLHttpRequest` est **obligatoire** — le PHP le valide via `validateCsrfRequest()` et retourne 403 si absent.

> ⚠️ Actuellement, `App.jsx` (login) utilise un `fetch()` basique sans ce header ni `credentials: 'include'`. À corriger lors du branchement API.

### 7.5 Données de session

Les données entreprise (id, forfait, permissions) ne sont **jamais** stockées en `localStorage` ou `sessionStorage`. Elles restent en `$_SESSION` PHP et sont récupérées à chaque montage via `session_check`.

> ⚠️ Exception temporaire : `postulantsnotations.jsx` utilise `localStorage` pour stocker les évaluations en cours (`saas_evaluations`). Cela sera supprimé lors du branchement API de ce module.

---

## 8. État d'avancement — Pages et fonctionnalités

### Légende

| Icône | Signification |
|-------|---------------|
| ✅ | Branché sur l'API PHP réelle |
| 🔧 | Partiellement branché |
| 🚧 | Données mockées — branchement API à faire |
| 📋 | Passation de test (appel PHP direct, hors backoffice PHP) |

### Dashboard (`Acceuil.jsx`) — 🚧
- KPIs définis en constante `MOCK_STATS` dans le JSX
- Graphiques niveaux d'études et secteurs d'activité : données `MOCK_NIVEAUX` / `MOCK_SECTEURS` hardcodées
- Carte forfait : affichée en dur (`FORFAIT_META`)
- Système de notifications : UI présente, non branchée
- **TODO :** brancher `stats.php` pour les KPIs, `notifications.php` pour les notifications

### Offres (`offres.jsx`, `modifier.jsx`) — 🚧
- Liste des offres : données mockées
- **TODO :** brancher `offres.php` (`list`, `get`, `create`, `update`, `delete`)

### Candidats (`postulants.jsx`) — 🚧
- Tableau + Kanban : données mockées
- **TODO :** brancher `postulants.php`

### Candidathèque (`candidatheque.jsx`) — 🔧
- Données candidats : mockées
- Geocoding adresses : branché sur l'API externe Photon (komoot.io) — fonctionne en prod
- **TODO :** brancher `candidats.php`

### Candidatures spontanées (`spontanees.jsx`) — 🚧

### Pipeline de notation (`notation/postulantsnotations.jsx`) — 🚧
- Données postulants : mockées via `getMockPostulantsData()`
- Évaluations : persistées en `localStorage` (temporaire)
- **TODO :** brancher `postulantsnotations.php` et `entretiens.php`

### Campagnes (`campagnes.jsx`, `postulantcampagne.jsx`) — 🚧
- Données mockées
- **TODO :** brancher `offres.php` et `postulantCampagne.php`

### Tests psychotechniques (`tests.jsx`) — 🚧
- Liste des tests : mockée
- **TODO :** brancher `tests.php`

### Résultats tests (`resultatstests.jsx`) — 🚧

### Pages de passation (`tests/*.jsx`) — 📋
- Appellent directement des fichiers PHP (check prise, sauvegarde résultats)
- Ces appels ciblent des URLs relatives sans `API_BASE` (ex: `"check_test_taken_Domino.php"`) — **fonctionneront uniquement si les PHP sont co-localisés avec le build déployé**

### Sous-utilisateurs (`utilisateurs.jsx`, `creerutil.jsx`, `modifierutil.jsx`) — 🚧
- Quotas et données utilisateurs mockés
- Des commentaires `// 👉 Remplace par fetch(...)` indiquent les points d'intégration
- **TODO :** brancher `creerUtil.php`

### Emploi public (`emploi.jsx`) — 🚧
- À vérifier — vraisemblablement encore mockée

### Documentation (`documentation.jsx`) — ✅
- Contenu statique intégré dans le JSX, pas d'API nécessaire

---

## 9. Backend PHP attendu

Le frontend communique avec les fichiers PHP suivants (tous dans `/securebackoffice/backsecurebackoffice/`) :

| Fichier PHP | Utilisé par | Actions principales |
|-------------|-------------|---------------------|
| `index.php` | `useSessionGuard.js`, login | `session_check`, `logout`, POST login |
| `stats.php` | Acceuil | KPIs, `?type=niveaux`, `?type=secteurs` |
| `offres.php` | offres, campagnes, postes | `list`, `get`, `create`, `update`, `delete` |
| `postes.php` | postes | `list`, `get` (approuvés uniquement) |
| `postulants.php` | postulants, candidatheque | `list`, `decision`, actions en masse |
| `postulantsnotations.php` | notation | scoring, pré-sélection, entretiens |
| `entretiens.php` | notation | gestion des entretiens techniques |
| `tests.php` | tests | `list` |
| `resultatstests.php` | resultatstests | 5 types de tests, `list`, `get` |
| `postulantCampagne.php` | postulantcampagne | `list_postulants`, `list_tests`, `send_tests` |
| `creerUtil.php` | creerutil | création sous-utilisateur avec vérification quota |
| `candidats.php` | candidatheque, spontanees | CVthèque, candidatures spontanées |
| `envoiMail.php` | postulantcampagne | Invitations par email (PHPMailer) |
| `notifications.php` | Navbar / Acceuil | GET notifications, PATCH (lu/supprimé) |

Les pages de passation (`tests/*.jsx`) appellent leurs propres PHP (ex: `check_test_taken_Domino.php`, `save_test_results_domino.php`) qui doivent être présents dans le même répertoire que le build déployé.

### Réponse attendue de `session_check`

```json
{
  "success": true,
  "entreprise": {
    "id": 42,
    "nom": "Entreprise XYZ",
    "forfait": "pme_small",
    "email": "contact@xyz.ci",
    "isSubUser": false,
    "permissions": [
      { "id": "offres", "enabled": true, "children": [
        { "id": "emploi", "enabled": true },
        { "id": "annonces", "enabled": true }
      ]}
    ],
    "subUserMenuPerms": []
  }
}
```

Si `success` est `false` ou absent, `useSessionGuard` redirige vers `LOGIN_REDIRECT`.

### Conventions PHP

- Session PHP : `$_SESSION['bo_entreprise_id']` pour le scoping multi-tenant
- CSRF : header `X-Requested-With: XMLHttpRequest` validé par `validateCsrfRequest()`
- PDO avec `.env` pour les credentials DB (ne jamais utiliser `mysqli_*`)
- Tables avec suffixe `_MCA2` (convention plateforme)
- Compatibilité **PHP 7.2+** (pas de syntaxe 8.0+)
- Collations : utiliser `CONVERT(col USING utf8mb4) COLLATE utf8mb4_unicode_ci` pour les JOINs entre tables de collations différentes

---

## 10. Base de données — Tables clés

| Table | Rôle |
|-------|------|
| `Inscription_MCA2` | Candidats inscrits |
| `OffreEmplois_MCA2` | Offres d'emploi |
| `postulantsEmploi_MCA2` | Candidatures (lien candidat ↔ offre) |
| `talentsCandidats_MCA2` | CVthèque interne |
| `candidature_spontanee` | Candidatures spontanées |
| `notifications_MCA2` | Notifications candidats |
| `entreprises` | Entreprises abonnées (contient `notifs_seen` JSON pour les notifications BO) |
| `shortlist_recrutements` | Données phase shortlist/recrutement (pipeline notation) |
| `tests_envoyes_MCA2` | Tests envoyés aux candidats (utilisé pour `resultatstests`) |

---

## 11. Forfaits et quotas

Les forfaits sont définis dans `Acceuil.jsx` (constante `FORFAIT_META`) :

| Clé | Label | Prix |
|-----|-------|------|
| `independant` | Indépendants | 2 500 FCFA/mois |
| `pme_small` | PME / PMI ≤ 50 | 9 900 FCFA/mois |
| `pme_large` | PME / PMI ≥ 50 | 17 500 FCFA/mois |
| `grande` | Grandes Entreprises | 30 800 FCFA/mois |

Ces clés correspondent à la colonne `forfait` de la table `entreprises`.

**Quotas sous-utilisateurs par forfait :**

| Forfait | Sous-utilisateurs max |
|---------|----------------------|
| Indépendant | 1 |
| PME ≤ 50 salariés | 2 |
| PME ≥ 50 salariés | 3 |
| Grandes Entreprises | 5 |

---

## 12. Déploiement (OVH)

### Hébergement

- Serveur OVH mutualisé
- URL de production : `https://app.zenselekt.com`
- SPA React servie depuis : `app.zenselekt.com/securebackoffice/`
- Backend PHP depuis : `app.zenselekt.com/securebackoffice/backsecurebackoffice/`

### Procédure de mise en production

```bash
# 1. Dans vite.config.js : commenter base: '/' et décommenter base: '/securebackoffice/'
# 2. Dans src/main.jsx : activer basename="/securebackoffice" sur BrowserRouter
# 3. Construire
npm run build

# 4. Uploader le contenu de dist/ dans /securebackoffice/ sur le serveur OVH
#    (via FTP, rsync ou interface OVH)

# 5. Remettre les deux fichiers en config développement local
```

### `.htaccess` requis

Pour que le routing React (HTML5 History API) fonctionne, un `.htaccess` doit être présent dans `/securebackoffice/` :

```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

---

## 13. Conventions de code

- **JSX uniquement** (pas de TypeScript) — ne pas ajouter de types `: number` dans les fichiers `.jsx`
- Noms de fichiers React : **camelCase** pour les pages (`postulants.jsx`), PascalCase pour les composants partagés (`Header.jsx`, `Navbar.jsx`, `SessionLoader.jsx`)
- **Noms de composants exportés** : toujours PascalCase, même si le fichier est en minuscules
- La logique de filtrage métier (offres inactives, scoping par entreprise) est **toujours au niveau SQL**, jamais côté client
- `secureFetch` (voir §7.4) doit être utilisé pour tous les appels API authentifiés
- **SweetAlert2** : dans les pages, utiliser l'import npm. `useSessionGuard.js` le charge dynamiquement en CDN — ne pas dupliquer ce pattern dans les nouvelles pages
- Un hook `useBootstrapIcons()` est défini localement dans chaque page qui en a besoin — pas de composant global partagé
- Pas de `localStorage` pour les données métier liées à la session — uniquement `$_SESSION` PHP

---

## 14. Points d'attention et bugs connus

### Import sensible à la casse (🔴 bloquant en production)

Dans `main.jsx` :
```js
import Modifier from "./page/Modifier";              // M majuscule — fichier : modifier.jsx
import PostulantCampagne from "./page/postulantCampagne.jsx"; // C majuscule — fichier : postulantcampagne.jsx
```
Sur Linux (OVH), ces imports **échoueront au build**.

**Correction à appliquer avant tout déploiement :**
```js
import Modifier from "./page/modifier";
import PostulantCampagne from "./page/postulantcampagne.jsx";
```

### Fichier `.rar` commité dans le repo

`src/page/notation/notation.rar` est suivi par git. À supprimer :
```bash
git rm src/page/notation/notation.rar
echo "*.rar" >> .gitignore
git commit -m "chore: remove notation.rar, add .gitignore rule"
```

### Absence de page 404

Aucune route `*` n'est déclarée dans `main.jsx`. À ajouter :
```jsx
import NotFound from "./page/NotFound.jsx";
// ...
<Route path="*" element={<NotFound />} />
```

### URLs PHP relatives dans les pages de test

Les pages `tests/*.jsx` utilisent des URLs relatives sans chemin (ex: `fetch("save_test_results_domino.php", ...)`). En production, ces appels n'aboutiront que si les PHP sont accessibles depuis la racine de déploiement. Vérifier la configuration OVH.

### `useSessionGuard` — URL hardcodée en production

`SESSION_CHECK_URL` et `LOGOUT_URL` dans `useSessionGuard.js` sont hardcodées avec le chemin `/securebackoffice/...`. En développement local sans proxy Vite configuré, le `session_check` échouera systématiquement et redirigera vers le login. Voir §5 pour la configuration du proxy.

### Branchement API manquant sur la majorité des pages

Voir §8 pour le détail. Les commentaires `// 👉 Remplace par fetch(...)` dans `utilisateurs.jsx`, `creerutil.jsx` et `modifierutil.jsx` indiquent les points d'intégration à compléter.

---

## Contact & Support

> Plateforme développée par **Empower Talents & Careers**
> - Téléphone : +225 07 58 03 40 78
> - Email : contact@zenselekt.com
> - Application : https://app.zenselekt.com
/**
 * usePermissions.js
 * Hook utilitaire — vérifie si un chemin de route est accessible
 * selon les permissions de la session (compte principal ou sous-utilisateur).
 *
 * Utilisé par ProtectedRoute.jsx pour bloquer l'accès direct par URL.
 */

/* ══════════════════════════════════════════════════════════════════════
   TABLE DE CORRESPONDANCE : chemin React → clés de permission
   
   Structure :
     path        : chemin React Router (ex: "/offres")
     parentPerm  : permId du menu parent dans NAV_CATALOG
     childPerm   : permId de l'item enfant dans NAV_CATALOG (optionnel)
     
   Pour un compte principal → vérifie permissions[parentPerm].enabled
   et permissions[parentPerm].children[childPerm]
   
   Pour un sous-utilisateur  → vérifie les clés simples dans subUserMenuPerms
   via PERM_TO_MENU_KEY et CHILD_PERMID_TO_KEY (mêmes tables que Navbar.jsx)
══════════════════════════════════════════════════════════════════════ */
export const ROUTE_PERMISSION_MAP = [
  // Dashboard — toujours accessible
  { path: "/acceuil",       parentPerm: null, childPerm: null, alwaysAllowed: true },

  // Gestion des offres d'emploi
  { path: "/emploi",        parentPerm: "offres",        childPerm: "emploi"        },
  { path: "/candidatheque", parentPerm: "offres",        childPerm: "candidatheque" },
  { path: "/spontanees",    parentPerm: "offres",        childPerm: "spontanees"    },
  { path: "/offres",        parentPerm: "offres",        childPerm: "annonces"      },

  // Gestion des utilisateurs
  { path: "/utilisateurs",  parentPerm: "utilisateurs",  childPerm: "liste-util"    },
  { path: "/creerutil",     parentPerm: "utilisateurs",  childPerm: "creer-util"    },

  // Gestion des évaluations
  { path: "/tests",         parentPerm: "evaluations",   childPerm: "tests"         },
  { path: "/campagnes",     parentPerm: "evaluations",   childPerm: "campagnes"     },

  // Préselection & entretiens
  { path: "/postes",        parentPerm: "preselection",  childPerm: "postes"        },

  // Documentation
  { path: "/documentation", parentPerm: "documentation", childPerm: "docs"          },
];

/* Tables identiques à Navbar.jsx — source de vérité partagée */
const PERM_TO_MENU_KEY = {
  offres:        "gestion_offres",
  utilisateurs:  "gestion_utilisateurs",
  evaluations:   "gestion_evaluations",
  preselection:  "gestion_notations",
  documentation: "documentation",
};

const CHILD_PERMID_TO_KEY = {
  emploi:        "emploi_consultation",
  candidatheque: "candidatheque",
  spontanees:    "candidathequeSpon",
  annonces:      "gestion_annonces",
  "liste-util":  "utilisateurs_list",
  "creer-util":  "utilisateurs_creation",
  tests:         "banque_tests",
  campagnes:     "campagnes_evaluation",
  postes:        "listes_postes",
  docs:          "documentation",
};

/**
 * Construit une map de permissions depuis le tableau structuré
 * entreprise.permissions (compte principal).
 * → { permId: { enabled, children: { childPermId: bool } } }
 */
function buildPermMap(permissions) {
  const map = {};
  if (!Array.isArray(permissions)) return map;
  for (const perm of permissions) {
    const childMap = {};
    if (Array.isArray(perm.children)) {
      for (const child of perm.children) {
        childMap[child.id] = !!child.enabled;
      }
    }
    map[perm.id] = { enabled: !!perm.enabled, children: childMap };
  }
  return map;
}

/**
 * Vérifie si un chemin est accessible pour un compte PRINCIPAL.
 * 
 * @param {string}   path        chemin React Router courant (ex: "/offres")
 * @param {object[]} permissions tableau structuré depuis session_check
 * @returns {{ allowed: boolean, reason: string }}
 */
function checkPrincipalAccess(path, permissions) {
  const rule = ROUTE_PERMISSION_MAP.find((r) => r.path === path);

  // Route inconnue → refus par défaut (fail-closed)
  if (!rule) {
    return { allowed: false, reason: "route_unknown" };
  }

  // Route toujours accessible (dashboard)
  if (rule.alwaysAllowed) {
    return { allowed: true, reason: "always_allowed" };
  }

  const permMap = buildPermMap(permissions);
  const parent  = permMap[rule.parentPerm];

  // Catégorie parent désactivée ou absente
  if (!parent || !parent.enabled) {
    return { allowed: false, reason: "parent_disabled" };
  }

  // Si pas de childPerm défini → accès accordé si parent activé
  if (!rule.childPerm) {
    return { allowed: true, reason: "parent_enabled" };
  }

  // Vérification de l'enfant
  // children[childPerm] === false → explicitement désactivé
  // undefined → non présent dans les permissions → refus
  const childEnabled = parent.children[rule.childPerm];
  if (childEnabled === false || childEnabled === undefined) {
    return { allowed: false, reason: "child_disabled" };
  }

  return { allowed: true, reason: "child_enabled" };
}

/**
 * Vérifie si un chemin est accessible pour un SOUS-UTILISATEUR.
 *
 * @param {string}   path            chemin React Router courant
 * @param {string[]} subUserMenuPerms tableau de clés simples depuis session_check
 * @returns {{ allowed: boolean, reason: string }}
 */
function checkSubUserAccess(path, subUserMenuPerms) {
  const rule   = ROUTE_PERMISSION_MAP.find((r) => r.path === path);
  const keySet = new Set(Array.isArray(subUserMenuPerms) ? subUserMenuPerms : []);

  if (!rule)              return { allowed: false, reason: "route_unknown"   };
  if (rule.alwaysAllowed) return { allowed: true,  reason: "always_allowed"  };

  // Vérifie la clé parent
  const parentKey = PERM_TO_MENU_KEY[rule.parentPerm];
  if (!parentKey || !keySet.has(parentKey)) {
    return { allowed: false, reason: "parent_disabled" };
  }

  // Vérifie la clé enfant si applicable
  if (rule.childPerm) {
    const childKey = CHILD_PERMID_TO_KEY[rule.childPerm];
    if (!childKey || !keySet.has(childKey)) {
      return { allowed: false, reason: "child_disabled" };
    }
  }

  return { allowed: true, reason: "child_enabled" };
}

/**
 * Hook principal — retourne une fonction `canAccess(path)`.
 *
 * @param {object|null} entreprise  objet session retourné par useSessionGuard
 * @returns {{ canAccess: (path: string) => { allowed: boolean, reason: string } }}
 */
export function usePermissions(entreprise) {
  const canAccess = (path) => {
    // Session pas encore chargée → on ne bloque pas encore
    if (!entreprise) return { allowed: true, reason: "loading" };

    if (entreprise.isSubUser) {
      return checkSubUserAccess(path, entreprise.subUserMenuPerms ?? []);
    }

    return checkPrincipalAccess(path, entreprise.permissions ?? []);
  };

  return { canAccess };
}
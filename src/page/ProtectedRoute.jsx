/**
 * ProtectedRoute.jsx
 * Garde de route — bloque l'accès direct par URL si les permissions
 * ne couvrent plus la page demandée (ex: downgrade de forfait).
 *
 * Utilisation dans App.jsx / le router principal :
 *
 *   <Route
 *     path="/offres"
 *     element={
 *       <ProtectedRoute path="/offres">
 *         <Offres />
 *       </ProtectedRoute>
 *     }
 *   />
 *
 * Comportement :
 *   - Session en cours de chargement   → spinner (pas de flash de refus)
 *   - Accès autorisé                   → rendu du children
 *   - Accès refusé (permission absente) → page 403 intégrée
 *   - Session expirée / invalide       → useSessionGuard redirige vers login
 */

import { useLocation } from "react-router-dom";
import { useSessionGuard } from "./component/useSessionGuard";
import { usePermissions   } from "./component/usePermissions";

/* ══════════════════════════════════════════════════════════════════════
   PAGE 403 — accès refusé
   Affichée quand la route existe mais les permissions ne couvrent plus
   ce menu (ex : downgrade de forfait, suppression de droits sous-compte).
══════════════════════════════════════════════════════════════════════ */
function AccessDeniedPage() {
  return (
    <div style={styles.wrapper} role="main" aria-labelledby="denied-title">

      {/* Icône bouclier */}
      <div style={styles.iconWrap} aria-hidden="true">
        <svg
          width="72" height="72" viewBox="0 0 24 24"
          fill="none" stroke="#1a7070" strokeWidth="1.4"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <circle cx="12" cy="15" r="0.8" fill="#1a7070" stroke="none" />
        </svg>
      </div>

      {/* Code */}
      <p style={styles.code} aria-hidden="true">403</p>

      {/* Titre */}
      <h1 id="denied-title" style={styles.title}>
        Accès non autorisé
      </h1>

      {/* Description */}
      <p style={styles.description}>
        Cette fonctionnalité ne fait pas partie de votre abonnement actuel
        ou vos droits d'accès ont été modifiés.
      </p>

      <p style={styles.hint}>
        Si vous pensez qu'il s'agit d'une erreur, contactez votre administrateur
        ou l'équipe Zenselekt.
      </p>

      {/* Séparateur décoratif */}
      <div style={styles.divider} aria-hidden="true" />

      {/* Contacts */}
      <div style={styles.contactRow}>
        <a href="tel:+2250758034078" style={styles.contactLink} aria-label="Appeler le support">
         
          +225 07 58 03 40 78
        </a>
        <a href="mailto:contact@zenselekt.com" style={styles.contactLink} aria-label="Envoyer un e-mail au support">
         
          contact@zenselekt.com
        </a>
      </div>

      {/* Bouton retour */}
      <button
        style={styles.backBtn}
        onClick={() => window.history.back()}
        type="button"
      >
        ← Retour
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SPINNER — affiché pendant le chargement de la session
   Évite un flash de la page 403 avant que les permissions arrivent.
══════════════════════════════════════════════════════════════════════ */
function SessionLoadingSpinner() {
  return (
    <div style={styles.spinnerWrap} aria-label="Vérification des accès…" role="status">
      <div style={styles.spinner} />
      <p style={styles.spinnerText}>Vérification des accès…</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════════════════ */
export default function ProtectedRoute({ children, path: propPath }) {
  const location   = useLocation();
  const { entreprise, loading, checked } = useSessionGuard();
  const { canAccess } = usePermissions(entreprise);

  // Chemin à vérifier : prop explicite ou chemin courant
  const pathToCheck = propPath ?? location.pathname;

  /* ── 1. Session en cours de chargement (premier montage) ── */
  if (loading || !checked) {
    return <SessionLoadingSpinner />;
  }

  /* ── 2. Session invalide → useSessionGuard redirige déjà vers login ── */
  if (!entreprise) {
    return <SessionLoadingSpinner />;
  }

  /* ── 3. Vérification des permissions ── */
  const { allowed } = canAccess(pathToCheck);

  if (!allowed) {
    return <AccessDeniedPage />;
  }

  /* ── 4. Accès accordé → rendu normal ── */
  return children;
}

/* ══════════════════════════════════════════════════════════════════════
   STYLES INLINE (cohérents avec la palette Zenselekt #1a7070)
══════════════════════════════════════════════════════════════════════ */
const styles = {
  /* Page 403 */
  wrapper: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
    minHeight:      "calc(100vh - 64px)", // compense le header
    padding:        "40px 24px",
    textAlign:      "center",
    background:     "#f8fafa",
    fontFamily:     "Segoe UI, system-ui, -apple-system, sans-serif",
  },
  iconWrap: {
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    width:           "110px",
    height:          "110px",
    borderRadius:    "50%",
    background:      "linear-gradient(135deg, #e6f5f5 0%, #c8eaea 100%)",
    marginBottom:    "24px",
    boxShadow:       "0 4px 24px rgba(26,112,112,0.10)",
  },
  code: {
    fontSize:     "72px",
    fontWeight:   "800",
    color:        "#1a7070",
    lineHeight:   "1",
    margin:       "0 0 8px",
    letterSpacing: "-2px",
    opacity:      "0.18",
  },
  title: {
    fontSize:    "24px",
    fontWeight:  "700",
    color:       "#1a2e2e",
    margin:      "0 0 12px",
  },
  description: {
    fontSize:    "15px",
    color:       "#4a6363",
    maxWidth:    "460px",
    lineHeight:  "1.65",
    margin:      "0 0 8px",
  },
  hint: {
    fontSize:    "13px",
    color:       "#8aabab",
    maxWidth:    "400px",
    lineHeight:  "1.55",
    margin:      "0",
  },
  divider: {
    width:        "48px",
    height:       "3px",
    background:   "linear-gradient(90deg, #1a7070, #4cbfbf)",
    borderRadius: "2px",
    margin:       "28px 0",
  },
  contactRow: {
    display:       "flex",
    flexWrap:      "wrap",
    gap:           "12px",
    justifyContent: "center",
    marginBottom:  "32px",
  },
  contactLink: {
    display:        "flex",
    alignItems:     "center",
    gap:            "8px",
    padding:        "10px 18px",
    background:     "#fff",
    border:         "1px solid #c6e8e8",
    borderRadius:   "10px",
    color:          "#1a7070",
    fontSize:       "13px",
    fontWeight:     "500",
    textDecoration: "none",
    transition:     "box-shadow 0.18s",
  },
  backBtn: {
    padding:      "10px 28px",
    background:   "transparent",
    border:       "1.5px solid #1a7070",
    borderRadius: "8px",
    color:        "#1a7070",
    fontSize:     "14px",
    fontWeight:   "600",
    cursor:       "pointer",
    transition:   "background 0.18s, color 0.18s",
  },

  /* Spinner */
  spinnerWrap: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
    minHeight:      "calc(100vh - 64px)",
    gap:            "16px",
    background:     "#f8fafa",
  },
  spinner: {
    width:        "36px",
    height:       "36px",
    border:       "3px solid #c8eaea",
    borderTop:    "3px solid #1a7070",
    borderRadius: "50%",
    animation:    "zen-spin 0.8s linear infinite",
  },
  spinnerText: {
    fontSize:  "13px",
    color:     "#8aabab",
    margin:    "0",
  },
};

/* Keyframe CSS injectée une seule fois */
if (typeof document !== "undefined" && !document.getElementById("zen-spin-style")) {
  const style = document.createElement("style");
  style.id = "zen-spin-style";
  style.textContent = `@keyframes zen-spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSessionGuard } from "./component/useSessionGuard";
import "./css/modifierUtilisateur.css";
import Header from "./component/Header";
import Navbar from "./component/Navbar";

/* ═══════════════════════════════════════════════════════════════
   BOOTSTRAP ICONS
═══════════════════════════════════════════════════════════════ */
const BI_CDN = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
function useBootstrapIcons() {
  useEffect(() => {
    if (!document.querySelector(`link[href="${BI_CDN}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = BI_CDN;
      document.head.appendChild(link);
    }
  }, []);
}

/* ═══════════════════════════════════════════════════════════════
   API
═══════════════════════════════════════════════════════════════ */
const API_BASE = "/securebackoffice/backsecurebackoffice/creerUtil.php";

async function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      ...(options.headers ?? {}),
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   CATALOGUE DES MENUS
═══════════════════════════════════════════════════════════════ */
const ALL_MENUS = [
  {
    key: "dashboard",
    icon: "bi-grid",
    label: "Zenselekt 3.0 (Dashboard)",
    children: [],
    alwaysOn: true,
  },
  {
    key: "gestion_offres",
    icon: "bi-briefcase",
    label: "Gestion des offres d'emploi",
    children: [
      { key: "emploi_consultation", label: "Consultation des Emplois / Postulants" },
      { key: "candidatheque",       label: "Candidathèque générale" },
      { key: "candidathequeSpon",   label: "Candidatures spontanées" },
      { key: "gestion_annonces",    label: "Gestion des annonces" },
    ],
  },
  {
    key: "gestion_utilisateurs",
    icon: "bi-people",
    label: "Gestion des utilisateurs",
    children: [
      { key: "utilisateurs_list",     label: "Utilisateurs" },
      { key: "utilisateurs_creation", label: "Création d'un utilisateur" },
    ],
  },
  {
    key: "gestion_evaluations",
    icon: "bi-trophy",
    label: "Gestion des évaluations",
    children: [
      { key: "banque_tests",         label: "Banque de tests" },
      { key: "campagnes_evaluation", label: "Campagnes d'évaluation" },
      { key: "classements_scores",   label: "Classements & Scores" },
    ],
  },
  {
    key: "gestion_notations",
    icon: "bi-clipboard-check",
    label: "Présélection & entretiens",
    children: [{ key: "listes_postes", label: "Listes des postes" }],
  },
  {
    key: "documentation",
    icon: "bi-journal-text",
    label: "Documentation",
    children: [],
  },
];

/* ═══════════════════════════════════════════════════════════════
   HELPERS PERMISSIONS
═══════════════════════════════════════════════════════════════ */
const PERM_TO_MENU_KEY = {
  offres:        "gestion_offres",
  utilisateurs:  "gestion_utilisateurs",
  evaluations:   "gestion_evaluations",
  preselection:  "gestion_notations",
  documentation: "documentation",
};
const CHILD_PERM_TO_MENU_KEY = {
  emploi:        "emploi_consultation",
  candidatheque: "candidatheque",
  spontanees:    "candidathequeSpon",
  annonces:      "gestion_annonces",
  "liste-util":  "utilisateurs_list",
  "creer-util":  "utilisateurs_creation",
  tests:         "banque_tests",
  campagnes:     "campagnes_evaluation",
  postes:        "listes_postes",
};

function buildAllowedMenuKeys(permissions) {
  const allowed = new Set(["dashboard"]);
  if (!Array.isArray(permissions)) return allowed;
  for (const perm of permissions) {
    if (!perm.enabled) continue;
    const mk = PERM_TO_MENU_KEY[perm.id];
    if (mk) allowed.add(mk);
    for (const child of perm.children ?? []) {
      if (!child.enabled) continue;
      const ck = CHILD_PERM_TO_MENU_KEY[child.id];
      if (ck) allowed.add(ck);
    }
  }
  return allowed;
}

function filterMenusForEntreprise(allowedKeys) {
  return ALL_MENUS.reduce((acc, menu) => {
    if (!allowedKeys.has(menu.key)) return acc;
    const filteredChildren = menu.children.filter((c) => allowedKeys.has(c.key));
    acc.push({ ...menu, children: filteredChildren });
    return acc;
  }, []);
}

/* ═══════════════════════════════════════════════════════════════
   PASSWORD STRENGTH
═══════════════════════════════════════════════════════════════ */
function getStrength(v) {
  if (!v) return { score: 0, label: "Laisser vide pour conserver l'actuel", color: "var(--text-muted)" };
  let score = 0;
  if (v.length >= 7)  score++;
  if (v.length >= 10) score++;
  if (/[A-Z]/.test(v) && /[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  const map = [
    { label: "Trop court",  color: "#e74c3c" },
    { label: "Faible",      color: "#e74c3c" },
    { label: "Moyen",       color: "#f39c12" },
    { label: "Fort",        color: "#2ecc71" },
    { label: "Très fort",   color: "#2ecc71" },
  ];
  return { score, ...map[score] };
}

/* ═══════════════════════════════════════════════════════════════
   SECTION TITLE
═══════════════════════════════════════════════════════════════ */
function SectionTitle({ children }) {
  return (
    <div className="mu-section-title">
      <span className="mu-accent-bar" />
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PERMISSIONS EDITOR
═══════════════════════════════════════════════════════════════ */
function PermissionsEditor({ selected, onChange, availableMenus }) {
  const toggleKey = useCallback(
    (key, parentKey) => {
      const isParent = !parentKey;
      if (isParent) {
        const menu = availableMenus.find((m) => m.key === key);
        const childKeys = menu?.children.map((c) => c.key) ?? [];
        if (selected.includes(key)) {
          if (menu?.alwaysOn) return;
          onChange(selected.filter((k) => k !== key && !childKeys.includes(k)));
        } else {
          onChange([...selected, key, ...childKeys]);
        }
      } else {
        if (selected.includes(key)) {
          onChange(selected.filter((k) => k !== key));
        } else {
          onChange([...selected, key]);
        }
      }
    },
    [selected, onChange, availableMenus]
  );

  const selectableMenus = availableMenus.filter((m) => !m.alwaysOn);

  function toggleAll() {
    const allKeys = availableMenus.flatMap((m) => [m.key, ...m.children.map((c) => c.key)]);
    const selectableKeys = selectableMenus.flatMap((m) => [m.key, ...m.children.map((c) => c.key)]);
    const alreadyAllOn = selectableKeys.every((k) => selected.includes(k));
    if (alreadyAllOn) {
      const alwaysOnKeys = availableMenus
        .filter((m) => m.alwaysOn)
        .flatMap((m) => [m.key, ...m.children.map((c) => c.key)]);
      onChange(alwaysOnKeys);
    } else {
      onChange(allKeys);
    }
  }

  const allOn =
    selectableMenus.length > 0 &&
    selectableMenus.every(
      (m) =>
        selected.includes(m.key) &&
        m.children.every((c) => selected.includes(c.key))
    );

  return (
    <div className="mu-perms-wrap">
      <div className="mu-perms-header">
        <SectionTitle>Permissions des menus</SectionTitle>
        <button className="mu-select-all" onClick={toggleAll} type="button">
          {allOn ? "Tout décocher" : "Tout cocher"}
        </button>
      </div>

      <div className="mu-perm-grid">
        {availableMenus.map((menu) => {
          const parentChecked = selected.includes(menu.key);
          return (
            <div
              key={menu.key}
              className={`mu-perm-item ${parentChecked ? "mu-perm-item--active" : ""} ${menu.alwaysOn ? "mu-perm-item--locked" : ""}`}
            >
              <label className="mu-perm-parent">
                <input
                  type="checkbox"
                  checked={parentChecked}
                  onChange={() => toggleKey(menu.key)}
                  disabled={menu.alwaysOn}
                />
                <i className={`bi ${menu.icon} mu-perm-icon`} />
                <span className="mu-perm-label">{menu.label}</span>
                {menu.alwaysOn && (
                  <span className="mu-perm-locked-badge">
                    <i className="bi bi-lock-fill" /> Toujours actif
                  </span>
                )}
              </label>
              {menu.children.length > 0 && parentChecked && (
                <div className="mu-perm-children">
                  {menu.children.map((child) => (
                    <label key={child.key} className="mu-perm-child">
                      <input
                        type="checkbox"
                        checked={selected.includes(child.key)}
                        onChange={() => toggleKey(child.key, menu.key)}
                      />
                      {child.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`mu-toast mu-toast--${type}`}>
      <i className={`bi ${type === "success" ? "bi-check-circle" : "bi-x-circle"}`} />
      <span>{message}</span>
      <button onClick={onClose} type="button"><i className="bi bi-x" /></button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════ */
export default function ModifierUtilisateur() {
  useBootstrapIcons();
  const navigate = useNavigate();
  const { id }   = useParams();
  const { entreprise, checking } = useSessionGuard();

  /* ── Layout ── */
  const [width, setWidth] = useState(0);
  useEffect(() => {
    setWidth(window.innerWidth);
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const isMobile = width > 0 && width <= 600;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (width > 0) setSidebarOpen(width > 768);
  }, [width]);

  /* ── État formulaire ── */
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [toast,    setToast]    = useState(null);

  const [email,       setEmail]       = useState("");
  const [role,        setRole]        = useState("");
  const [mdp,         setMdp]         = useState("");
  const [mdp2,        setMdp2]        = useState("");
  const [permissions, setPermissions] = useState(["dashboard"]);
  const [showPass,    setShowPass]    = useState(false);
  const [showPass2,   setShowPass2]   = useState(false);

  /* ── Menus disponibles filtrés selon l'entreprise ── */
  const availableMenus = (() => {
    if (!entreprise) return ALL_MENUS; // fallback si session pas encore prête
    const allowedKeys = buildAllowedMenuKeys(entreprise.permissions ?? []);
    return filterMenusForEntreprise(allowedKeys);
  })();

  const strength = getStrength(mdp);

  /* ── Chargement utilisateur ── */
  useEffect(() => {
    if (checking || !id) return;

    setLoading(true);
    apiFetch(`?action=get&id=${id}`)
      .then(async (res) => {
        if (res.status === 401) {
          window.location.href = "/securebackoffice/";
          return;
        }
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        if (!data.success) {
          setNotFound(true);
          return;
        }
        const u = data.user;
        setEmail(u.email || "");
        setRole(u.role || "");
        setPermissions(
          Array.isArray(u.menu_permissions) && u.menu_permissions.length > 0
            ? u.menu_permissions
            : ["dashboard"]
        );
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, checking]);

  /* ── Validation ── */
  function validate() {
    const e = {};
    if (!email.trim()) {
      e.email = "L'email est requis.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = "Format email invalide.";
    }
    if (mdp && mdp.length < 7) e.mdp  = "Minimum 7 caractères.";
    if (mdp && mdp !== mdp2)   e.mdp2 = "Les mots de passe ne correspondent pas.";
    if (
      permissions.filter((k) => availableMenus.some((m) => m.key === k)).length === 0
    ) {
      e.perms = "Sélectionnez au moins un menu.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* ── Sauvegarde ── */
  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        email:            email.trim(),
        role:             role.trim(),
        menu_permissions: permissions,
      };
      if (mdp) body.mdp = mdp;

      const res = await apiFetch(`?action=update&id=${id}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/securebackoffice/";
          return;
        }
        if (res.status === 422 && data.errors) {
          setErrors(data.errors);
          setToast({ message: "Veuillez corriger les erreurs.", type: "error" });
          return;
        }
        if (res.status === 409) {
          setErrors({ email: "Cet email est déjà utilisé par un autre compte." });
          setToast({ message: "Email déjà utilisé.", type: "error" });
          return;
        }
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        throw new Error(data.message || "Erreur serveur.");
      }

      setSuccess(true);
      setMdp("");
      setMdp2("");
      setToast({ message: "Modifications enregistrées !", type: "success" });
    } catch (err) {
      setToast({ message: err.message || "Erreur inattendue.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  /* ── Render conditionnel ── */
  if (checking) return null;

  /* ── Écran succès ── */
  if (success) {
    return (
      <div className="app">
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((p) => !p)} isMobile={isMobile} />
        <div className="layout">
          <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>
            <div className="mu-card mu-success-card">
              <div className="mu-success-icon"><i className="bi bi-check-lg" /></div>
              <h2>Modifications enregistrées !</h2>
              <p>Le compte <strong>{email}</strong> a été mis à jour avec succès.</p>
              <div className="mu-success-actions">
                <button
                  className="mu-btn mu-btn--ghost"
                  onClick={() => navigate("/utilisateurs")}
                  type="button"
                >
                  <i className="bi bi-list-ul" /> Retour à la liste
                </button>
                <button
                  className="mu-btn mu-btn--primary"
                  onClick={() => setSuccess(false)}
                  type="button"
                >
                  <i className="bi bi-pencil" /> Continuer les modifications
                </button>
              </div>
            </div>
          </main>
        </div>
        <footer className={`app-footer ${sidebarOpen ? "app-footer--shifted" : ""}`}>
          © 2025 Zenselekt · Propulsé par <strong>Empower talents &amp; careers</strong>. Tous droits réservés
        </footer>
      </div>
    );
  }

  /* ── Utilisateur introuvable ── */
  if (notFound) {
    return (
      <div className="app">
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((p) => !p)} isMobile={isMobile} />
        <div className="layout">
          <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>
            <div className="mu-card mu-notfound">
              <i className="bi bi-person-x" />
              <p>Utilisateur introuvable ou accès non autorisé.</p>
              <button
                className="mu-btn mu-btn--ghost"
                onClick={() => navigate("/utilisateurs")}
                type="button"
              >
                ← Retour à la liste
              </button>
            </div>
          </main>
        </div>
        <footer className={`app-footer ${sidebarOpen ? "app-footer--shifted" : ""}`}>
          © 2025 Zenselekt · Propulsé par <strong>Empower talents &amp; careers</strong>. Tous droits réservés
        </footer>
      </div>
    );
  }

  /* ── Page principale ── */
  return (
    <div className="app">
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        isMobile={isMobile}
      />

      <div className="layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>

          {/* ── Titre page ── */}
          <div className="page-title">
            <div>
              <div className="breadcrumb">
                <button
                  className="breadcrumb-link"
                  onClick={() => navigate("/utilisateurs")}
                  type="button"
                >
                  Utilisateurs
                </button>
                <i className="bi bi-chevron-right" />
                <span className="breadcrumb-active">Modifier</span>
              </div>
              <h1>Modifier un utilisateur</h1>
              <p className="page-sub">Mettez à jour les accès et les identifiants</p>
            </div>
            <button
              className="mu-btn mu-btn--ghost"
              onClick={() => navigate("/utilisateurs")}
              type="button"
            >
              <i className="bi bi-arrow-left" /> Retour
            </button>
          </div>

          {loading ? (
            <div className="mu-card mu-card--loading">
              <span className="mu-spinner mu-spinner--lg" />
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Chargement…</span>
            </div>
          ) : (
            <div className="mu-card">

              {/* ── Identifiants ── */}
              <SectionTitle>Identifiants de connexion</SectionTitle>
              <div className="mu-form-grid">

                {/* Email */}
                <div className={`mu-field ${errors.email ? "mu-field--error" : ""}`}>
                  <label>
                    Email / Utilisateur <span className="mu-req">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((p) => ({ ...p, email: undefined }));
                    }}
                    autoComplete="off"
                  />
                  {errors.email && (
                    <span className="mu-field-error">
                      <i className="bi bi-exclamation-circle" /> {errors.email}
                    </span>
                  )}
                </div>

                {/* Rôle */}
                <div className="mu-field">
                  <label>Rôle <span className="mu-label-opt">(optionnel)</span></label>
                  <input
                    type="text"
                    placeholder="ex. Responsable RH"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>

                {/* Nouveau mot de passe */}
                <div className={`mu-field ${errors.mdp ? "mu-field--error" : ""}`}>
                  <label>
                    Nouveau mot de passe{" "}
                    <span className="mu-label-opt">(laisser vide pour conserver)</span>
                  </label>
                  <div className="mu-pass-wrap">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Minimum 7 caractères"
                      value={mdp}
                      onChange={(e) => {
                        setMdp(e.target.value);
                        setErrors((p) => ({ ...p, mdp: undefined }));
                      }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="mu-pass-eye"
                      onClick={() => setShowPass((p) => !p)}
                    >
                      <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`} />
                    </button>
                  </div>
                  <span className="mu-strength-txt" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                  {mdp && (
                    <div className="mu-strength-bar">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="mu-strength-seg"
                          style={{
                            background: i < strength.score ? strength.color : "var(--bg-deep)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {errors.mdp && (
                    <span className="mu-field-error">
                      <i className="bi bi-exclamation-circle" /> {errors.mdp}
                    </span>
                  )}
                </div>

                {/* Confirmer mot de passe */}
                <div className={`mu-field ${errors.mdp2 ? "mu-field--error" : ""}`}>
                  <label>Confirmer le nouveau mot de passe</label>
                  <div className="mu-pass-wrap">
                    <input
                      type={showPass2 ? "text" : "password"}
                      placeholder="Répétez le mot de passe"
                      value={mdp2}
                      onChange={(e) => {
                        setMdp2(e.target.value);
                        setErrors((p) => ({ ...p, mdp2: undefined }));
                      }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="mu-pass-eye"
                      onClick={() => setShowPass2((p) => !p)}
                    >
                      <i className={`bi ${showPass2 ? "bi-eye-slash" : "bi-eye"}`} />
                    </button>
                  </div>
                  {errors.mdp2 && (
                    <span className="mu-field-error">
                      <i className="bi bi-exclamation-circle" /> {errors.mdp2}
                    </span>
                  )}
                </div>

              </div>

              <div className="mu-divider" />

              {/* ── Permissions ── */}
              {errors.perms && (
                <div className="mu-perms-error">
                  <i className="bi bi-exclamation-circle" /> {errors.perms}
                </div>
              )}

              <PermissionsEditor
                selected={permissions}
                onChange={setPermissions}
                availableMenus={availableMenus}
              />

              {/* ── Actions ── */}
              <div className="mu-btn-row">
                <button
                  className="mu-btn mu-btn--ghost"
                  onClick={() => navigate("/utilisateurs")}
                  disabled={saving}
                  type="button"
                >
                  ← Annuler
                </button>
                <button
                  className="mu-btn mu-btn--primary"
                  onClick={handleSave}
                  disabled={saving}
                  type="button"
                >
                  {saving ? (
                    <><span className="mu-spinner" /> Enregistrement…</>
                  ) : (
                    <><i className="bi bi-check2" /> Enregistrer les modifications</>
                  )}
                </button>
              </div>

            </div>
          )}

        </main>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <footer className={`app-footer ${sidebarOpen ? "app-footer--shifted" : ""}`}>
        © 2025 Zenselekt · Propulsé par{" "}
        <strong>Empower talents &amp; careers</strong>. Tous droits réservés
      </footer>
    </div>
  );
}
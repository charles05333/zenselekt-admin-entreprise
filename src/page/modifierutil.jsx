import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./css/modifierUtilisateur.css";
import Header from "./component/Header";
import Navbar from "./component/Navbar";

// ── Bootstrap Icons ───────────────────────────────────────
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

// ── Menus disponibles ─────────────────────────────────────
const MENUS = [
  {
    key: "dashboard",
    icon: "bi-grid",
    label: "Zenselekt 3.0 (Dashboard)",
    children: [],
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
    key: "gestion_messages",
    icon: "bi-chat",
    label: "Gestion des messages reçus",
    children: [],
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
    children: [
      { key: "listes_postes", label: "Listes des postes" },
    ],
  },
];

// ── Mock données ──────────────────────────────────────────
const MOCK_USERS = [
  {
    id: 1,
    email: "admin@zenselekt.com",
    role: "Administrateur",
    permissions: ["dashboard", "gestion_offres", "emploi_consultation", "candidatheque", "gestion_utilisateurs", "utilisateurs_list", "gestion_messages", "gestion_evaluations", "gestion_notations"],
    status: "actif",
  },
  {
    id: 2,
    email: "rh.manager@entreprise.com",
    role: "Responsable RH",
    permissions: ["dashboard", "gestion_offres", "emploi_consultation", "gestion_evaluations"],
    status: "actif",
  },
];

// ── Password strength ─────────────────────────────────────
function getStrength(v) {
  if (!v) return { score: 0, label: "Laisser vide pour ne pas changer", color: "var(--text-muted)" };
  let score = 0;
  if (v.length >= 7)  score++;
  if (v.length >= 10) score++;
  if (/[A-Z]/.test(v) && /[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  const map = [
    { label: "Trop court",  color: "#e74c3c" },
    { label: "Faible",      color: "#e74c3c" },
    { label: "Moyen",       color: "#f39c12" },
    { label: "Fort",        color: "var(--green)" },
    { label: "Très fort",   color: "var(--green)" },
  ];
  return { score, ...map[score] };
}

// ── Section title ─────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div className="mu-section-title">
      <span className="mu-accent-bar" />
      {children}
    </div>
  );
}

// ── Permissions ───────────────────────────────────────────
function PermissionsEditor({ selected, onChange }) {
  const toggleKey = useCallback((key, parentKey) => {
    const isParent = !parentKey;
    if (isParent) {
      const menu = MENUS.find((m) => m.key === key);
      const childKeys = menu?.children.map((c) => c.key) || [];
      if (selected.includes(key)) {
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
  }, [selected, onChange]);

  const toggleAll = () => {
    if (selected.length > 0) onChange([]);
    else onChange(MENUS.flatMap((m) => [m.key, ...m.children.map((c) => c.key)]));
  };

  return (
    <div className="mu-perms-wrap">
      <div className="mu-perms-header">
        <SectionTitle>Permissions des menus</SectionTitle>
        <button className="mu-select-all" onClick={toggleAll} type="button">
          {selected.length > 0 ? "Tout décocher" : "Tout cocher"}
        </button>
      </div>

      <div className="mu-perm-grid">
        {MENUS.map((menu) => {
          const parentChecked = selected.includes(menu.key);
          return (
            <div key={menu.key} className={`mu-perm-item ${parentChecked ? "mu-perm-item--active" : ""}`}>
              <label className="mu-perm-parent">
                <input
                  type="checkbox"
                  checked={parentChecked}
                  onChange={() => toggleKey(menu.key)}
                />
                <i className={`bi ${menu.icon} mu-perm-icon`} />
                <span className="mu-perm-label">{menu.label}</span>
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

// ── Page principale ───────────────────────────────────────
export default function ModifierUtilisateur() {
  useBootstrapIcons();
  const navigate = useNavigate();
  const { id }   = useParams();

  // ── Layout ────────────────────────────────────────────────
  const [width, setWidth] = useState(0);
  useEffect(() => {
    setWidth(window.innerWidth);
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  const isMobile = width > 0 && width <= 600;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (width > 0) setSidebarOpen(width > 768);
  }, [width]);

  // ── État ──────────────────────────────────────────────────
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errors,   setErrors]   = useState({});

  const [email,       setEmail]       = useState("");
  const [role,        setRole]        = useState("");
  const [mdp,         setMdp]         = useState("");
  const [mdp2,        setMdp2]        = useState("");
  const [permissions, setPermissions] = useState([]);
  const [showPass,    setShowPass]    = useState(false);
  const [showPass2,   setShowPass2]   = useState(false);

  const strength = getStrength(mdp);

  // ── Chargement utilisateur ────────────────────────────────
  useEffect(() => {
    // 👉 Remplace par fetch(`/api/users/${id}`)
    setTimeout(() => {
      const user = MOCK_USERS.find((u) => u.id === parseInt(id));
      if (!user) { setNotFound(true); setLoading(false); return; }
      setEmail(user.email);
      setRole(user.role || "");
      setPermissions(user.permissions);
      setLoading(false);
    }, 500);
  }, [id]);

  // ── Validation ────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!email) e.email = "L'email est requis.";
    if (mdp && mdp.length < 7) e.mdp = "Minimum 7 caractères.";
    if (mdp && mdp !== mdp2)   e.mdp2 = "Les mots de passe ne correspondent pas.";
    if (permissions.filter((k) => MENUS.some((m) => m.key === k)).length === 0)
      e.perms = "Sélectionnez au moins un menu.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Sauvegarde ────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    // 👉 Remplace par :
    // await fetch(`/api/users/${id}`, {
    //   method: "PUT",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ email, role, mdp: mdp || undefined, permissions }),
    // });
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSuccess(true);
  }

  // ── Écran succès ──────────────────────────────────────────
  if (success) {
    return (
      <div className="app">
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(p => !p)} isMobile={isMobile} />
        <div className="layout">
          <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>
            <div className="mu-card mu-success-card">
              <div className="mu-success-icon"><i className="bi bi-check-lg" /></div>
              <h2>Modifications enregistrées !</h2>
              <p>Le compte <strong>{email}</strong> a été mis à jour avec succès.</p>
              <div className="mu-success-actions">
                <button className="mu-btn mu-btn--ghost" onClick={() => navigate("/utilisateurs")} type="button">
                  <i className="bi bi-list-ul" /> Retour à la liste
                </button>
                <button className="mu-btn mu-btn--primary" onClick={() => { setSuccess(false); setMdp(""); setMdp2(""); }} type="button">
                  <i className="bi bi-pencil" /> Continuer les modifications
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── Utilisateur introuvable ───────────────────────────────
  if (notFound) {
    return (
      <div className="app">
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(p => !p)} isMobile={isMobile} />
        <div className="layout">
          <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>
            <div className="mu-card mu-notfound">
              <i className="bi bi-person-x" />
              <p>Utilisateur introuvable.</p>
              <button className="mu-btn mu-btn--ghost" onClick={() => navigate("/utilisateurs")} type="button">
                ← Retour à la liste
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        isMobile={isMobile}
      />

      <div className="layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>

          {/* ── Titre page avec fil d'Ariane cliquable ── */}
          <div className="page-title">
            <h1>Modifier un utilisateur</h1>
            <p className="page-sub">
              <button
                className="page-sub-link"
                onClick={() => navigate("/utilisateurs")}
                type="button"
              >
                Gestion des utilisateurs
              </button>
              {" "}›{" "}Modifier
            </p>
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

                <div className={`mu-field ${errors.email ? "mu-field--error" : ""}`}>
                  <label>Email / Utilisateur</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                    autoComplete="off"
                  />
                  {errors.email && <span className="mu-field-error"><i className="bi bi-exclamation-circle" /> {errors.email}</span>}
                </div>

                <div className="mu-field">
                  <label>Rôle (optionnel)</label>
                  <input
                    type="text"
                    placeholder="ex. Responsable RH"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>

                <div className={`mu-field ${errors.mdp ? "mu-field--error" : ""}`}>
                  <label>Nouveau mot de passe <span className="mu-label-opt">(laisser vide pour conserver)</span></label>
                  <div className="mu-pass-wrap">
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Minimum 7 caractères"
                      value={mdp}
                      onChange={(e) => { setMdp(e.target.value); setErrors(p => ({ ...p, mdp: undefined })); }}
                      autoComplete="new-password"
                    />
                    <button type="button" className="mu-pass-eye" onClick={() => setShowPass(p => !p)}>
                      <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`} />
                    </button>
                  </div>
                  {mdp && (
                    <>
                      <div className="mu-strength-bar">
                        {[0,1,2,3].map((i) => (
                          <div key={i} className="mu-strength-seg"
                            style={{ background: i < strength.score ? strength.color : "var(--bg-deep)" }} />
                        ))}
                      </div>
                      <span className="mu-strength-txt" style={{ color: strength.color }}>{strength.label}</span>
                    </>
                  )}
                  {!mdp && <span className="mu-strength-txt" style={{ color: "var(--text-muted)" }}>{strength.label}</span>}
                  {errors.mdp && <span className="mu-field-error"><i className="bi bi-exclamation-circle" /> {errors.mdp}</span>}
                </div>

                <div className={`mu-field ${errors.mdp2 ? "mu-field--error" : ""}`}>
                  <label>Confirmer le nouveau mot de passe</label>
                  <div className="mu-pass-wrap">
                    <input
                      type={showPass2 ? "text" : "password"}
                      placeholder="Répétez le mot de passe"
                      value={mdp2}
                      onChange={(e) => { setMdp2(e.target.value); setErrors(p => ({ ...p, mdp2: undefined })); }}
                      autoComplete="new-password"
                    />
                    <button type="button" className="mu-pass-eye" onClick={() => setShowPass2(p => !p)}>
                      <i className={`bi ${showPass2 ? "bi-eye-slash" : "bi-eye"}`} />
                    </button>
                  </div>
                  {errors.mdp2 && <span className="mu-field-error"><i className="bi bi-exclamation-circle" /> {errors.mdp2}</span>}
                </div>

              </div>

              <div className="mu-divider" />

              {/* ── Permissions ── */}
              {errors.perms && (
                <div className="mu-perms-error">
                  <i className="bi bi-exclamation-circle" /> {errors.perms}
                </div>
              )}
              <PermissionsEditor selected={permissions} onChange={setPermissions} />

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
                  {saving
                    ? <><span className="mu-spinner" /> Enregistrement…</>
                    : <><i className="bi bi-check2" /> Enregistrer les modifications</>
                  }
                </button>
              </div>

            </div>
          )}

        </main>
      </div>

      <footer className={`app-footer ${sidebarOpen ? "app-footer--shifted" : ""}`}>
        © 2025 Zenselekt · Propulsé par <strong>Empower talents &amp; careers</strong>. Tous droits réservés
      </footer>
    </div>
  );
}
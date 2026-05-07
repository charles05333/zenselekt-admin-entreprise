import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/creerUtil.css";
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

// ── Packs Zenselekt ───────────────────────────────────────
const PACKS = [
  { id: "independant",      label: "Indépendant",           maxUsers: 1, maxMenus: 99 },
  { id: "pme_small",        label: "PME / PMI ≤ 50 salariés", maxUsers: 2, maxMenus: 99 },
  { id: "pme_large",        label: "PME / PMI ≥ 50 salariés", maxUsers: 3, maxMenus: 99 },
  { id: "grande_entreprise",label: "Grande Entreprise",     maxUsers: 5, maxMenus: 99 },
];

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

// ── Password strength ─────────────────────────────────────
function getStrength(v) {
  if (!v) return { score: 0, label: "Saisissez un mot de passe", color: "var(--text-muted)" };
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

// ── Steps indicator ───────────────────────────────────────
function Steps({ current }) {
  const list = ["Identifiants", "Permissions", "Confirmation"];
  return (
    <div className="cu-steps">
      {list.map((lbl, i) => {
        const state = i < current ? "done" : i === current ? "active" : "";
        return (
          <div key={i} className={`cu-step ${state}`}>
            <div className="cu-step-dot">{i < current ? "✓" : i + 1}</div>
            <div className="cu-step-label">{lbl}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1 — Identifiants ─────────────────────────────────
function StepCredentials({ data, onChange, onNext, onBack, errors }) {
  const [showPass,  setShowPass]  = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const strength = getStrength(data.mdp);

  return (
    <div className="cu-step-content">
      

      <div className="cu-form-grid">
        <div className={`cu-field ${errors.email ? "cu-field--error" : ""}`}>
          <label>Email / Utilisateur</label>
          <input
            type="email"
            placeholder="prenom.nom@entreprise.com"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            autoComplete="off"
          />
          {errors.email && <span className="cu-field-error"><i className="bi bi-exclamation-circle" /> {errors.email}</span>}
        </div>

        <div className="cu-field">
          <label>Rôle (optionnel)</label>
          <input
            type="text"
            placeholder="ex. Responsable RH"
            value={data.role}
            onChange={(e) => onChange("role", e.target.value)}
          />
        </div>

        <div className={`cu-field ${errors.mdp ? "cu-field--error" : ""}`}>
          <label>Mot de passe</label>
          <div className="cu-pass-wrap">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Minimum 7 caractères"
              value={data.mdp}
              onChange={(e) => onChange("mdp", e.target.value)}
              autoComplete="new-password"
            />
            <button type="button" className="cu-pass-eye" onClick={() => setShowPass(p => !p)}>
              <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`} />
            </button>
          </div>
          <div className="cu-strength-bar">
            {[0,1,2,3].map((i) => (
              <div
                key={i}
                className="cu-strength-seg"
                style={{ background: i < strength.score ? strength.color : "var(--bg-deep)" }}
              />
            ))}
          </div>
          <span className="cu-strength-txt" style={{ color: strength.color }}>{strength.label}</span>
          {errors.mdp && <span className="cu-field-error"><i className="bi bi-exclamation-circle" /> {errors.mdp}</span>}
        </div>

        <div className={`cu-field ${errors.mdp2 ? "cu-field--error" : ""}`}>
          <label>Confirmer le mot de passe</label>
          <div className="cu-pass-wrap">
            <input
              type={showPass2 ? "text" : "password"}
              placeholder="Répétez le mot de passe"
              value={data.mdp2}
              onChange={(e) => onChange("mdp2", e.target.value)}
              autoComplete="new-password"
            />
            <button type="button" className="cu-pass-eye" onClick={() => setShowPass2(p => !p)}>
              <i className={`bi ${showPass2 ? "bi-eye-slash" : "bi-eye"}`} />
            </button>
          </div>
          {errors.mdp2 && <span className="cu-field-error"><i className="bi bi-exclamation-circle" /> {errors.mdp2}</span>}
        </div>
      </div>

      <div className="cu-btn-row">
        <button className="cu-btn cu-btn--ghost"   onClick={onBack} type="button">← Retour</button>
        <button className="cu-btn cu-btn--primary" onClick={onNext} type="button">Continuer →</button>
      </div>
    </div>
  );
}

// ── Step 2 — Permissions ──────────────────────────────────
function StepPermissions({ selected, onChange, onNext, onBack }) {
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
    if (selected.length > 0) {
      onChange([]);
    } else {
      onChange(MENUS.flatMap((m) => [m.key, ...m.children.map((c) => c.key)]));
    }
  };

  return (
    <div className="cu-step-content">
      <div className="cu-perms-header">
       
        <button className="cu-select-all" onClick={toggleAll} type="button">
          {selected.length > 0 ? "Tout décocher" : "Tout cocher"}
        </button>
      </div>

      <div className="cu-perm-grid">
        {MENUS.map((menu) => {
          const parentChecked = selected.includes(menu.key);
          return (
            <div key={menu.key} className={`cu-perm-item ${parentChecked ? "cu-perm-item--active" : ""}`}>
              <label className="cu-perm-parent">
                <input
                  type="checkbox"
                  checked={parentChecked}
                  onChange={() => toggleKey(menu.key)}
                />
                <i className={`bi ${menu.icon} cu-perm-icon`} />
                <span className="cu-perm-label">{menu.label}</span>
              </label>
              {menu.children.length > 0 && parentChecked && (
                <div className="cu-perm-children">
                  {menu.children.map((child) => (
                    <label key={child.key} className="cu-perm-child">
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

      {selected.length > 0 && (
        <div className="cu-tags">
          {selected.map((k) => {
            const lbl =
              MENUS.find((m) => m.key === k)?.label ||
              MENUS.flatMap((m) => m.children).find((c) => c.key === k)?.label || k;
            return (
              <span key={k} className="cu-tag">
                {lbl}
                <button type="button" onClick={() => onChange(selected.filter((x) => x !== k))}>×</button>
              </span>
            );
          })}
        </div>
      )}

      <div className="cu-btn-row">
        <button className="cu-btn cu-btn--ghost"   onClick={onBack} type="button">← Retour</button>
        <button className="cu-btn cu-btn--primary" onClick={onNext} disabled={selected.length === 0} type="button">
          Continuer →
        </button>
      </div>
    </div>
  );
}

// ── Step 3 — Confirmation ─────────────────────────────────
function StepConfirm({ data, permissions, onBack, onSubmit, loading, success }) {
  const navigate = useNavigate();
  const parentPerms = permissions.filter((k) => MENUS.some((m) => m.key === k));

  if (success) {
    return (
      <div className="cu-success">
        <div className="cu-success-icon">
          <i className="bi bi-check-lg" />
        </div>
        <h2>Utilisateur créé avec succès !</h2>
        <p>
          <strong>{data.email}</strong> peut désormais se connecter avec ses identifiants
          et accéder aux <strong>{parentPerms.length} menu(s)</strong> configurés.
        </p>
        <div className="cu-success-actions">
          <button
            className="cu-btn cu-btn--ghost"
            onClick={() => navigate("/utilisateurs")}
            type="button"
          >
            <i className="bi bi-list-ul" /> Voir la liste
          </button>
          <button
            className="cu-btn cu-btn--primary"
            onClick={() => window.location.reload()}
            type="button"
          >
            <i className="bi bi-person-plus" /> Nouvel utilisateur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cu-step-content">
      

      <div className="cu-recap-grid">
        <div className="cu-recap-item">
          <span className="cu-recap-key">Email</span>
          <span className="cu-recap-val">{data.email || "—"}</span>
        </div>
        <div className="cu-recap-item">
          <span className="cu-recap-key">Rôle</span>
          <span className="cu-recap-val">{data.role || <em style={{ color: "var(--text-muted)", fontStyle: "normal" }}>Non renseigné</em>}</span>
        </div>
        <div className="cu-recap-item">
          <span className="cu-recap-key">Mot de passe</span>
          <span className="cu-recap-val">••••••••</span>
        </div>
        <div className="cu-recap-item">
          <span className="cu-recap-key">Menus activés</span>
          <span className="cu-recap-val cu-recap-badge">{parentPerms.length} menu(s)</span>
        </div>
        <div className="cu-recap-item cu-recap-item--full">
          <span className="cu-recap-key">Accès configurés</span>
          <div className="cu-recap-perms">
            {parentPerms.length === 0 ? (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Aucun menu sélectionné</span>
            ) : parentPerms.map((k) => {
              const menu = MENUS.find((m) => m.key === k);
              const children = permissions.filter((pk) =>
                menu?.children.some((c) => c.key === pk)
              );
              return (
                <div key={k} className="cu-recap-menu-block">
                  <span className="cu-tag cu-tag--parent">
                    <i className={`bi ${menu?.icon}`} /> {menu?.label}
                  </span>
                  {children.length > 0 && (
                    <div className="cu-recap-children">
                      {children.map((ck) => {
                        const child = MENUS.flatMap((m) => m.children).find((c) => c.key === ck);
                        return (
                          <span key={ck} className="cu-tag cu-tag--child">
                            {child?.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="cu-btn-row">
        <button className="cu-btn cu-btn--ghost"   onClick={onBack}   disabled={loading} type="button">
          ← Modifier
        </button>
        <button className="cu-btn cu-btn--primary" onClick={onSubmit} disabled={loading} type="button">
          {loading
            ? <><span className="cu-spinner" /> Création en cours…</>
            : <><i className="bi bi-person-check" /> Créer l'utilisateur</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Ecran bloqué : quota atteint ──────────────────────────
function QuotaBlocked({ session }) {
  const navigate = useNavigate();
  return (
    <div className="cu-card">
      <div className="cu-blocked">
        <div className="cu-blocked-icon">
          <i className="bi bi-lock" />
        </div>
        <h2>Limite d'utilisateurs atteinte</h2>
        <p>
          Votre pack <strong>{session.packLabel}</strong> autorise{" "}
          <strong>{session.maxUsers} utilisateur{session.maxUsers > 1 ? "s" : ""}</strong> maximum.
          Vous avez déjà créé <strong>{session.currentUsers}</strong> compte{session.currentUsers > 1 ? "s" : ""}.
        </p>
        <p className="cu-blocked-sub">
          Pour ajouter davantage de collaborateurs, contactez-nous pour faire évoluer votre pack.
        </p>
        <div className="cu-blocked-actions">
          <button
            className="cu-btn cu-btn--ghost"
            onClick={() => navigate("/utilisateurs")}
            type="button"
          >
            ← Retour à la liste
          </button>
          <button className="cu-btn cu-btn--primary" type="button">
            <i className="bi bi-arrow-up-circle" /> Upgrader mon pack
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────
export default function CreerUtilisateur() {
  useBootstrapIcons();
  const navigate = useNavigate();

  // ── Layout (même pattern qu'Acceuil.jsx) ─────────────────
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

  // ── Session / pack de l'entreprise ───────────────────────
  // 👉 Remplace ce mock par un vrai fetch("/api/session/pack-info")
  const [session, setSession]           = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setSession({
        packId:       "pme_small",
        packLabel:    "PME / PMI ≤ 50 salariés",
        maxUsers:     2,
        currentUsers: 1,
      });
      setLoadingSession(false);
    }, 600);
  }, []);

  // ── Form state ────────────────────────────────────────────
  const [step,    setStep]    = useState(0);
  const [creds,   setCreds]   = useState({ email: "", mdp: "", mdp2: "", role: "" });
  const [perms,   setPerms]   = useState([]);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function updateCred(field, value) {
    setCreds((c) => ({ ...c, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validateCreds() {
    const e = {};
    if (!creds.email)             e.email = "L'email est requis.";
    if (creds.mdp.length < 7)     e.mdp   = "Minimum 7 caractères.";
    if (creds.mdp !== creds.mdp2) e.mdp2  = "Les mots de passe ne correspondent pas.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    setLoading(true);
    // 👉 Remplace par ton vrai appel :
    // await fetch("https://zenselekt.com/Talents/Admin/authEmpower/page/creation.php", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     email: creds.email,
    //     mdp: creds.mdp,
    //     menu_permissions: perms,
    //   }),
    // });
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSuccess(true);
  }

  const slotsLeft = session ? session.maxUsers - session.currentUsers : null;
  const canCreate = slotsLeft === null || slotsLeft > 0;

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

          <div className="page-title">
            <h1>Créer un utilisateur</h1>
            <p className="page-sub">Gestion des utilisateurs &rsaquo; Nouvel utilisateur</p>
          </div>

          {/* ── Chargement session ── */}
          {loadingSession && (
            <div className="cu-card cu-card--loading">
              <span className="cu-spinner cu-spinner--lg" />
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Chargement…</span>
            </div>
          )}

          {/* ── Quota dépassé ── */}
          {!loadingSession && !canCreate && (
            <QuotaBlocked session={session} />
          )}

          {/* ── Formulaire ── */}
          {!loadingSession && canCreate && (
            <>
              {/* Bandeau quota discret */}
              <div className="cu-quota-banner">
                <i className="bi bi-people" />
                <span>
                  Pack <strong>{session.packLabel}</strong> —{" "}
                  <strong>{slotsLeft}</strong> emplacement{slotsLeft > 1 ? "s" : ""} disponible{slotsLeft > 1 ? "s" : ""} sur{" "}
                  <strong>{session.maxUsers}</strong>
                </span>
              </div>

              <div className="cu-card">
                <Steps current={step} />

                {step === 0 && (
                  <StepCredentials
                    data={creds}
                    onChange={updateCred}
                    errors={errors}
                    onBack={() => navigate("/utilisateurs")}
                    onNext={() => { if (validateCreds()) setStep(1); }}
                  />
                )}
                {step === 1 && (
                  <StepPermissions
                    selected={perms}
                    onChange={setPerms}
                    onBack={() => setStep(0)}
                    onNext={() => setStep(2)}
                  />
                )}
                {step === 2 && (
                  <StepConfirm
                    data={creds}
                    permissions={perms}
                    onBack={() => setStep(1)}
                    onSubmit={handleSubmit}
                    loading={loading}
                    success={success}
                  />
                )}
              </div>
            </>
          )}

        </main>
      </div>

      <footer className={`app-footer ${sidebarOpen ? "app-footer--shifted" : ""}`}>
        © 2025 Zenselekt · Propulsé par <strong>Empower talents &amp; careers</strong>. Tous droits réservés
      </footer>
    </div>
  );
}
import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionGuard } from "./component/useSessionGuard";
import "./css/creerUtil.css";
import Header from "./component/Header";
import Navbar from "./component/Navbar";

/* ═══════════════════════════════════════════════════════════════
   BOOTSTRAP ICONS
═══════════════════════════════════════════════════════════════ */
const BI_CDN =
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
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
   Identique à Navbar.jsx — seuls les menus que l'entreprise a
   activés seront affichés (filtrés depuis le quota/session).
═══════════════════════════════════════════════════════════════ */
const ALL_MENUS = [
  {
    key: "dashboard",
    icon: "bi-grid",
    label: "Zenselekt 3.0 (Dashboard)",
    children: [],
    alwaysOn: true, // ne peut pas être retiré
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
   HELPERS — filtrage menus selon permissions entreprise
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
    { label: "Fort",        color: "#2ecc71" },
    { label: "Très fort",   color: "#2ecc71" },
  ];
  return { score, ...map[score] };
}

/* ═══════════════════════════════════════════════════════════════
   STEPS INDICATOR
═══════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════
   QUOTA BANNER
═══════════════════════════════════════════════════════════════ */
function QuotaBanner({ quota }) {
  if (!quota) return null;
  const urgent = quota.slotsLeft <= 1;
  return (
    <div className={`cu-quota-banner ${urgent ? "cu-quota-banner--urgent" : ""}`}>
      
      <span>
        Pack <strong>{quota.forfaitLabel}</strong> —{" "}
        <strong>{quota.slotsLeft}</strong> emplacement
        {quota.slotsLeft !== 1 ? "s" : ""} disponible
        {quota.slotsLeft !== 1 ? "s" : ""} sur{" "}
        <strong>{quota.maxUsers}</strong> au total
      </span>
      {quota.slotsLeft === 0 && (
        <span className="cu-quota-full-badge">Quota atteint</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUOTA BLOCKED SCREEN
═══════════════════════════════════════════════════════════════ */
function QuotaBlocked({ quota }) {
  const navigate = useNavigate();
  return (
    <div className="cu-card">
      <div className="cu-blocked">
        <div className="cu-blocked-icon">
          <i className="bi bi-lock" />
        </div>
        <h2>Limite d'utilisateurs atteinte</h2>
        <p>
          Votre pack <strong>{quota.forfaitLabel}</strong> autorise{" "}
          <strong>{quota.maxUsers}</strong> utilisateur
          {quota.maxUsers > 1 ? "s" : ""} maximum (compte principal inclus).
          Vous avez déjà créé{" "}
          <strong>{quota.currentCount - 1}</strong> sous-compte
          {quota.currentCount - 1 > 1 ? "s" : ""}.
        </p>
        <p className="cu-blocked-sub">
          Pour ajouter davantage de collaborateurs, contactez-nous pour
          faire évoluer votre pack.
        </p>
        <div className="cu-blocked-actions">
          <button
            className="cu-btn cu-btn--ghost"
            onClick={() => navigate("/utilisateurs")}
            type="button"
          >
            ← Retour à la liste
          </button>
          <a
            href="mailto:contact@zenselekt.com"
            className="cu-btn cu-btn--primary"
          >
            <i className="bi bi-arrow-up-circle" /> Passer à une offre supérieure
          </a>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 1 — IDENTIFIANTS
═══════════════════════════════════════════════════════════════ */
function StepCredentials({ data, onChange, onNext, onBack, errors }) {
  const [showPass,  setShowPass]  = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const strength = getStrength(data.mdp);

  return (
    <div className="cu-step-content">
      <div className="cu-form-grid">
        <div className={`cu-field ${errors.email ? "cu-field--error" : ""}`}>
          <label>Email / Utilisateur <span className="cu-req">*</span></label>
          <input
            type="email"
            placeholder="prenom.nom@entreprise.com"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
            autoComplete="off"
          />
          {errors.email && (
            <span className="cu-field-error">
              <i className="bi bi-exclamation-circle" /> {errors.email}
            </span>
          )}
        </div>

        <div className="cu-field">
          <label>Rôle (optionnel)</label>
          <input
            type="text"
            placeholder="ex : Responsable RH"
            value={data.role}
            onChange={(e) => onChange("role", e.target.value)}
          />
        </div>

        <div className={`cu-field ${errors.mdp ? "cu-field--error" : ""}`}>
          <label>Mot de passe <span className="cu-req">*</span></label>
          <div className="cu-pass-wrap">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Minimum 7 caractères"
              value={data.mdp}
              onChange={(e) => onChange("mdp", e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="cu-pass-eye"
              onClick={() => setShowPass((p) => !p)}
            >
              <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`} />
            </button>
          </div>
          <div className="cu-strength-bar">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="cu-strength-seg"
                style={{
                  background:
                    i < strength.score ? strength.color : "var(--bg-deep)",
                }}
              />
            ))}
          </div>
          <span
            className="cu-strength-txt"
            style={{ color: strength.color }}
          >
            {strength.label}
          </span>
          {errors.mdp && (
            <span className="cu-field-error">
              <i className="bi bi-exclamation-circle" /> {errors.mdp}
            </span>
          )}
        </div>

        <div className={`cu-field ${errors.mdp2 ? "cu-field--error" : ""}`}>
          <label>Confirmer le mot de passe <span className="cu-req">*</span></label>
          <div className="cu-pass-wrap">
            <input
              type={showPass2 ? "text" : "password"}
              placeholder="Répétez le mot de passe"
              value={data.mdp2}
              onChange={(e) => onChange("mdp2", e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="cu-pass-eye"
              onClick={() => setShowPass2((p) => !p)}
            >
              <i className={`bi ${showPass2 ? "bi-eye-slash" : "bi-eye"}`} />
            </button>
          </div>
          {errors.mdp2 && (
            <span className="cu-field-error">
              <i className="bi bi-exclamation-circle" /> {errors.mdp2}
            </span>
          )}
        </div>
      </div>

      <div className="cu-btn-row">
        <button
          className="cu-btn cu-btn--ghost"
          onClick={onBack}
          type="button"
        >
          ← Retour
        </button>
        <button
          className="cu-btn cu-btn--primary"
          onClick={onNext}
          type="button"
        >
          Continuer →
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 2 — PERMISSIONS (menus filtrés selon entreprise)
═══════════════════════════════════════════════════════════════ */
function StepPermissions({ selected, onChange, onNext, onBack, availableMenus }) {
  const toggleKey = useCallback(
    (key, parentKey) => {
      const isParent = !parentKey;
      if (isParent) {
        const menu = availableMenus.find((m) => m.key === key);
        const childKeys = menu?.children.map((c) => c.key) ?? [];
        if (selected.includes(key)) {
          // Ne pas désélectionner si alwaysOn
          if (menu?.alwaysOn) return;
          onChange(selected.filter((k) => k !== key && !childKeys.includes(k)));
        } else {
          onChange([...selected, key, ...childKeys]);
        }
      } else {
        if (selected.includes(key)) {
          onChange(selected.filter((k) => k !== key));
        } else {
          const next = [...selected, key];
          onChange(next);
        }
      }
    },
    [selected, onChange, availableMenus]
  );

  const selectableMenus = availableMenus.filter((m) => !m.alwaysOn);

  function toggleAll() {
    const allKeys = availableMenus.flatMap((m) => [
      m.key,
      ...m.children.map((c) => c.key),
    ]);
    const selectableKeys = availableMenus
      .filter((m) => !m.alwaysOn)
      .flatMap((m) => [m.key, ...m.children.map((c) => c.key)]);
    const alreadyAllOn = selectableKeys.every((k) => selected.includes(k));
    if (alreadyAllOn) {
      // Garder seulement les alwaysOn
      const alwaysOnKeys = availableMenus
        .filter((m) => m.alwaysOn)
        .flatMap((m) => [m.key, ...m.children.map((c) => c.key)]);
      onChange(alwaysOnKeys);
    } else {
      onChange(allKeys);
    }
  }

  const selectableSelected = selected.filter((k) =>
    selectableMenus.some(
      (m) => m.key === k || m.children.some((c) => c.key === k)
    )
  );
  const allOn =
    selectableMenus.length > 0 &&
    selectableMenus.every(
      (m) =>
        selected.includes(m.key) &&
        m.children.every((c) => selected.includes(c.key))
    );

  return (
    <div className="cu-step-content">
      <div className="cu-perms-header">
        <span className="cu-perms-subtitle">
          Sélectionnez les menus accessibles à cet utilisateur
        </span>
        <button className="cu-select-all" onClick={toggleAll} type="button">
          {allOn ? "Tout décocher" : "Tout cocher"}
        </button>
      </div>

      <div className="cu-perm-grid">
        {availableMenus.map((menu) => {
          const parentChecked = selected.includes(menu.key);
          return (
            <div
              key={menu.key}
              className={`cu-perm-item ${parentChecked ? "cu-perm-item--active" : ""} ${menu.alwaysOn ? "cu-perm-item--locked" : ""}`}
            >
              <label className="cu-perm-parent">
                <input
                  type="checkbox"
                  checked={parentChecked}
                  onChange={() => toggleKey(menu.key)}
                  disabled={menu.alwaysOn}
                />
                <i className={`bi ${menu.icon} cu-perm-icon`} />
                <span className="cu-perm-label">{menu.label}</span>
                {menu.alwaysOn && (
                  <span className="cu-perm-locked-badge">
                    <i className="bi bi-lock-fill" /> Toujours actif
                  </span>
                )}
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

      {selectableSelected.length > 0 && (
        <div className="cu-tags">
          {selectableSelected.map((k) => {
            const lbl =
              availableMenus.find((m) => m.key === k)?.label ||
              availableMenus
                .flatMap((m) => m.children)
                .find((c) => c.key === k)?.label ||
              k;
            return (
              <span key={k} className="cu-tag">
                {lbl}
                <button
                  type="button"
                  onClick={() => {
                    const menu = availableMenus.find((m) => m.key === k);
                    if (menu?.alwaysOn) return;
                    // Si c'est un parent, aussi enlever les enfants
                    if (menu) {
                      const childKeys = menu.children.map((c) => c.key);
                      onChange(
                        selected.filter(
                          (x) => x !== k && !childKeys.includes(x)
                        )
                      );
                    } else {
                      onChange(selected.filter((x) => x !== k));
                    }
                  }}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="cu-btn-row">
        <button
          className="cu-btn cu-btn--ghost"
          onClick={onBack}
          type="button"
        >
          ← Retour
        </button>
        <button
          className="cu-btn cu-btn--primary"
          onClick={onNext}
          disabled={selected.length === 0}
          type="button"
        >
          Continuer →
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP 3 — CONFIRMATION
═══════════════════════════════════════════════════════════════ */
function StepConfirm({
  data,
  permissions,
  availableMenus,
  onBack,
  onSubmit,
  loading,
  success,
  createdEmail,
}) {
  const navigate = useNavigate();
  const parentPerms = permissions.filter((k) =>
    availableMenus.some((m) => m.key === k)
  );

  if (success) {
    return (
      <div className="cu-success">
        <div className="cu-success-icon">
          <i className="bi bi-check-lg" />
        </div>
        <h2>Utilisateur créé avec succès !</h2>
        <p>
          <strong>{createdEmail}</strong> peut désormais se connecter avec ses
          identifiants et accéder aux{" "}
          <strong>{parentPerms.length} menu(s)</strong> configurés.
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
          <span className="cu-recap-val">
            {data.role || (
              <em style={{ color: "var(--text-muted)", fontStyle: "normal" }}>
                Non renseigné
              </em>
            )}
          </span>
        </div>
        <div className="cu-recap-item">
          <span className="cu-recap-key">Mot de passe</span>
          <span className="cu-recap-val">••••••••</span>
        </div>
        <div className="cu-recap-item">
          <span className="cu-recap-key">Menus activés</span>
          <span className="cu-recap-val cu-recap-badge">
            {parentPerms.length} menu(s)
          </span>
        </div>
        <div className="cu-recap-item cu-recap-item--full">
          <span className="cu-recap-key">Accès configurés</span>
          <div className="cu-recap-perms">
            {parentPerms.length === 0 ? (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Aucun menu sélectionné
              </span>
            ) : (
              parentPerms.map((k) => {
                const menu = availableMenus.find((m) => m.key === k);
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
                          const child = availableMenus
                            .flatMap((m) => m.children)
                            .find((c) => c.key === ck);
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
              })
            )}
          </div>
        </div>
      </div>

      <div className="cu-btn-row">
        <button
          className="cu-btn cu-btn--ghost"
          onClick={onBack}
          disabled={loading}
          type="button"
        >
          ← Modifier
        </button>
        <button
          className="cu-btn cu-btn--primary"
          onClick={onSubmit}
          disabled={loading}
          type="button"
        >
          {loading ? (
            <>
              <span className="cu-spinner" /> Création en cours…
            </>
          ) : (
            <>
              <i className="bi bi-person-check" /> Créer l'utilisateur
            </>
          )}
        </button>
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
    <div className={`cu-toast cu-toast--${type}`}>
      <i className={`bi ${type === "success" ? "bi-check-circle" : "bi-x-circle"}`} />
      <span>{message}</span>
      <button onClick={onClose}>
        <i className="bi bi-x" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════ */
export default function CreerUtilisateur() {
  useBootstrapIcons();
  const navigate = useNavigate();
  const { entreprise, checking } = useSessionGuard();

  /* ── Layout ── */
  const [width, setWidth] = useState(0);
  useEffect(() => {
    setWidth(window.innerWidth);
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const isMobile    = width > 0 && width <= 600;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (width > 0) setSidebarOpen(width > 768);
  }, [width]);

  /* ── Quota ── */
  const [quota,        setQuota]        = useState(null);
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [quotaError,   setQuotaError]   = useState(null);

  useEffect(() => {
    if (!entreprise) return; // attendre la session
    apiFetch("?action=quota")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setQuota(data.quota);
        else setQuotaError(data.message);
      })
      .catch(() => setQuotaError("Impossible de vérifier le quota."))
      .finally(() => setLoadingQuota(false));
  }, [entreprise]);

  /* ── Menus disponibles (filtrés selon permissions entreprise) ── */
  const availableMenus = (() => {
    if (!entreprise) return [];
    const allowedKeys = buildAllowedMenuKeys(entreprise.permissions ?? []);
    return filterMenusForEntreprise(allowedKeys);
  })();

  /* ── Form state ── */
  const [step,         setStep]         = useState(0);
  const [creds,        setCreds]        = useState({ email: "", mdp: "", mdp2: "", role: "" });
  const [perms,        setPerms]        = useState(() => ["dashboard"]); // dashboard toujours coché
  const [errors,       setErrors]       = useState({});
  const [loading,      setLoading]      = useState(false);
  const [success,      setSuccess]      = useState(false);
  const [createdEmail, setCreatedEmail] = useState("");
  const [toast,        setToast]        = useState(null);

  function updateCred(field, value) {
    setCreds((c) => ({ ...c, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validateCreds() {
    const e = {};
    if (!creds.email.trim()) {
      e.email = "L'email est requis.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(creds.email.trim())) {
      e.email = "Format email invalide.";
    }
    if (creds.mdp.length < 7)     e.mdp  = "Minimum 7 caractères.";
    if (creds.mdp !== creds.mdp2) e.mdp2 = "Les mots de passe ne correspondent pas.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await apiFetch("?action=create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:            creds.email.trim(),
          mdp:              creds.mdp,
          role:             creds.role.trim(),
          menu_permissions: perms,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.quota) {
          // Quota dépassé (race condition)
          setQuota(data.quota);
          setToast({ message: data.message, type: "error" });
          return;
        }
        if (res.status === 422 && data.errors) {
          setErrors(data.errors);
          setToast({ message: "Veuillez corriger les erreurs.", type: "error" });
          if (data.errors.email || data.errors.mdp || data.errors.mdp2) setStep(0);
          return;
        }
        if (res.status === 409) {
          setErrors({ email: "Cet email est déjà utilisé." });
          setToast({ message: "Cet email est déjà utilisé.", type: "error" });
          setStep(0);
          return;
        }
        if (res.status === 401) {
          window.location.href = "/securebackoffice/";
          return;
        }
        throw new Error(data.message || "Erreur serveur.");
      }

      setCreatedEmail(data.email || creds.email);
      setSuccess(true);
      setToast({ message: "Utilisateur créé avec succès !", type: "success" });
      // Rafraîchir le quota après création
      apiFetch("?action=quota")
        .then((r) => r.json())
        .then((d) => { if (d.success) setQuota(d.quota); });
    } catch (err) {
      setToast({ message: err.message || "Erreur inattendue.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  /* ── Render ── */
  if (checking) return null;

  const canCreate = quota ? quota.canCreate : true;

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

          <div className="page-title">
            <div>
              <div className="breadcrumb">
                <span>Utilisateurs</span>
                <i className="bi bi-chevron-right" />
                <span className="breadcrumb-active">Nouvel utilisateur</span>
              </div>
              <h1>Créer un utilisateur</h1>
              <p className="page-sub">
                Ajoutez un collaborateur et définissez ses accès
              </p>
            </div>
            <button
              className="cu-btn cu-btn--ghost"
              onClick={() => navigate("/utilisateurs")}
              type="button"
            >
              <i className="bi bi-arrow-left" /> Retour
            </button>
          </div>

          {/* Chargement quota */}
          {loadingQuota && (
            <div className="cu-card cu-card--loading">
              <span className="cu-spinner cu-spinner--lg" />
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                Vérification du quota…
              </span>
            </div>
          )}

          {/* Erreur quota */}
          {!loadingQuota && quotaError && (
            <div className="cu-card">
              <div className="cu-error-banner">
                <i className="bi bi-exclamation-triangle" />
                <span>{quotaError}</span>
                <button
                  className="cu-btn cu-btn--ghost"
                  onClick={() => window.location.reload()}
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* Quota atteint */}
          {!loadingQuota && !quotaError && quota && !canCreate && (
            <QuotaBlocked quota={quota} />
          )}

          {/* Formulaire */}
          {!loadingQuota && !quotaError && (!quota || canCreate) && (
            <>
              <QuotaBanner quota={quota} />

              <div className="cu-card">
                <Steps current={step} />

                {step === 0 && (
                  <StepCredentials
                    data={creds}
                    onChange={updateCred}
                    errors={errors}
                    onBack={() => navigate("/utilisateurs")}
                    onNext={() => {
                      if (validateCreds()) setStep(1);
                    }}
                  />
                )}

                {step === 1 && (
                  <StepPermissions
                    selected={perms}
                    onChange={setPerms}
                    availableMenus={availableMenus}
                    onBack={() => setStep(0)}
                    onNext={() => setStep(2)}
                  />
                )}

                {step === 2 && (
                  <StepConfirm
                    data={creds}
                    permissions={perms}
                    availableMenus={availableMenus}
                    onBack={() => setStep(1)}
                    onSubmit={handleSubmit}
                    loading={loading}
                    success={success}
                    createdEmail={createdEmail}
                  />
                )}
              </div>
            </>
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

      <footer
        className={`app-footer ${sidebarOpen ? "app-footer--shifted" : ""}`}
      >
        © 2025 Zenselekt · Propulsé par{" "}
        <strong>Empower talents &amp; careers</strong>. Tous droits réservés
      </footer>
    </div>
  );
}
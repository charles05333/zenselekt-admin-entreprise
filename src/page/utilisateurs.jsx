import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/utilisateurs.css";
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

// ── Menus label map ───────────────────────────────────────
const MENUS_LABELS = {
  dashboard:              { label: "Dashboard",               icon: "bi-grid" },
  gestion_offres:         { label: "Offres d'emploi",         icon: "bi-briefcase" },
  gestion_utilisateurs:   { label: "Utilisateurs",            icon: "bi-people" },
  gestion_evaluations:    { label: "Évaluations",             icon: "bi-trophy" },
  gestion_notations:      { label: "Présélection",            icon: "bi-clipboard-check" },
};

// ── Mock données ──────────────────────────────────────────
const MOCK_USERS = [
  {
    id: 1,
    email: "admin@zenselekt.com",
    role: "Administrateur",
    permissions: ["dashboard", "gestion_offres", "gestion_utilisateurs", "gestion_evaluations", "gestion_notations"],
    createdAt: "2025-01-10",
    status: "actif",
  },
  {
    id: 2,
    email: "rh.manager@entreprise.com",
    role: "Responsable RH",
    permissions: ["dashboard", "gestion_offres", "gestion_evaluations"],
    createdAt: "2025-03-22",
    status: "actif",
  },
];

// ── Badge statut ──────────────────────────────────────────
function StatusBadge({ status }) {
  return (
    <span className={`ut-badge ut-badge--${status}`}>
      <span className="ut-badge-dot" />
      {status === "actif" ? "Actif" : "Inactif"}
    </span>
  );
}

// ── Modal suppression ─────────────────────────────────────
function DeleteModal({ user, onConfirm, onCancel }) {
  return (
    <div className="ut-overlay" onClick={onCancel}>
      <div className="ut-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ut-modal-icon">
          <i className="bi bi-exclamation-triangle" />
        </div>
        <h3>Supprimer l'utilisateur ?</h3>
        <p>
          L'accès de <strong>{user.email}</strong> sera révoqué définitivement.
          Cette action est irréversible.
        </p>
        <div className="ut-modal-actions">
          <button className="ut-btn ut-btn--ghost" onClick={onCancel} type="button">
            Annuler
          </button>
          <button className="ut-btn ut-btn--danger" onClick={onConfirm} type="button">
            <i className="bi bi-trash3" /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Drawer détail utilisateur ─────────────────────────────
function UserDrawer({ user, onClose, onDelete, onToggleStatus }) {
  if (!user) return null;
  const parentPerms = user.permissions.filter((k) => MENUS_LABELS[k]);

  return (
    <div className="ut-overlay" onClick={onClose}>
      <div className="ut-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="ut-drawer-header">
          <div className="ut-drawer-avatar">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="ut-drawer-info">
            <div className="ut-drawer-email">{user.email}</div>
            <div className="ut-drawer-role">{user.role || <em>Aucun rôle</em>}</div>
          </div>
          <button className="ut-drawer-close" onClick={onClose} type="button">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="ut-drawer-body">
          <div className="ut-drawer-row">
            <span className="ut-drawer-key">Statut</span>
            <StatusBadge status={user.status} />
          </div>
          <div className="ut-drawer-row">
            <span className="ut-drawer-key">Créé le</span>
            <span className="ut-drawer-val">
              {new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
          </div>
          <div className="ut-drawer-row ut-drawer-row--col">
            <span className="ut-drawer-key">Accès aux menus</span>
            <div className="ut-drawer-perms">
              {parentPerms.length === 0 ? (
                <span className="ut-no-perms">Aucun accès configuré</span>
              ) : parentPerms.map((k) => (
                <span key={k} className="ut-perm-chip">
                  <i className={`bi ${MENUS_LABELS[k].icon}`} />
                  {MENUS_LABELS[k].label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="ut-drawer-footer">
          <button
            className="ut-btn ut-btn--ghost"
            onClick={() => onToggleStatus(user.id)}
            type="button"
          >
            <i className={`bi ${user.status === "actif" ? "bi-pause-circle" : "bi-play-circle"}`} />
            {user.status === "actif" ? "Désactiver" : "Activer"}
          </button>
          <button
            className="ut-btn ut-btn--danger-ghost"
            onClick={() => onDelete(user)}
            type="button"
          >
            <i className="bi bi-trash3" /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────
export default function Utilisateurs() {
  useBootstrapIcons();
  const navigate = useNavigate();

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
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("tous");
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Session / pack ────────────────────────────────────────
  const [session, setSession] = useState(null);

  useEffect(() => {
    // 👉 Remplace par fetch("/api/users") et fetch("/api/session/pack-info")
    setTimeout(() => {
      setUsers(MOCK_USERS);
      setSession({
        packLabel: "PME / PMI ≤ 50 salariés",
        maxUsers: 2,
      });
      setLoading(false);
    }, 600);
  }, []);

  // ── Filtres ───────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "tous" || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Actions ───────────────────────────────────────────────
  function handleToggleStatus(id) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "actif" ? "inactif" : "actif" } : u
      )
    );
    setSelectedUser((prev) =>
      prev?.id === id ? { ...prev, status: prev.status === "actif" ? "inactif" : "actif" } : prev
    );
  }

  function handleDeleteConfirm() {
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setDeleteTarget(null);
    setSelectedUser(null);
  }

  const slotsLeft = session ? session.maxUsers - users.length : null;

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

          {/* ── Titre page ── */}
          <div className="page-title">
            <h1>Utilisateurs</h1>
            <p className="page-sub">Gestion des utilisateurs &rsaquo; Liste</p>
          </div>

          {/* ── Bandeau quota ── */}
          {session && (
            <div className="ut-quota-banner">
              <i className="bi bi-people" />
              <span>
                Pack <strong>{session.packLabel}</strong> —{" "}
                <strong>{users.length}</strong> / <strong>{session.maxUsers}</strong> utilisateur{session.maxUsers > 1 ? "s" : ""}
              </span>
              {slotsLeft > 0 && (
                <span className="ut-quota-slots">
                  {slotsLeft} emplacement{slotsLeft > 1 ? "s" : ""} disponible{slotsLeft > 1 ? "s" : ""}
                </span>
              )}
              {slotsLeft === 0 && (
                <span className="ut-quota-full">Quota atteint</span>
              )}
            </div>
          )}

          {/* ── Toolbar ── */}
          <div className="ut-toolbar">
            <div className="ut-search-wrap">
              <i className="bi bi-search ut-search-icon" />
              <input
                className="ut-search"
                type="text"
                placeholder="Rechercher par email ou rôle…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="ut-search-clear" onClick={() => setSearch("")} type="button">
                  <i className="bi bi-x" />
                </button>
              )}
            </div>

            <div className="ut-filters">
              {["tous", "actif", "inactif"].map((f) => (
                <button
                  key={f}
                  className={`ut-filter-btn ${filterStatus === f ? "ut-filter-btn--active" : ""}`}
                  onClick={() => setFilterStatus(f)}
                  type="button"
                >
                  {f === "tous" ? "Tous" : f === "actif" ? "Actifs" : "Inactifs"}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tableau ── */}
          <div className="ut-card">
            {loading ? (
              <div className="ut-loading">
                <span className="ut-spinner ut-spinner--lg" />
                <span>Chargement…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ut-empty">
                <i className="bi bi-people" />
                <p>{search ? "Aucun résultat pour cette recherche." : "Aucun utilisateur créé."}</p>
              </div>
            ) : (
              <table className="ut-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Rôle</th>
                    <th>Accès</th>
                    <th>Créé le</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const parentPerms = user.permissions.filter((k) => MENUS_LABELS[k]);
                    return (
                      <tr
                        key={user.id}
                        className="ut-row"
                        onClick={() => setSelectedUser(user)}
                      >
                        <td>
                          <div className="ut-user-cell">
                            <div className="ut-avatar">
                              {user.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="ut-email">{user.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className="ut-role">
                            {user.role || <em className="ut-no-role">—</em>}
                          </span>
                        </td>
                        <td>
                          <div className="ut-chips">
                            {parentPerms.slice(0, 3).map((k) => (
                              <span key={k} className="ut-chip">
                                <i className={`bi ${MENUS_LABELS[k].icon}`} />
                                {MENUS_LABELS[k].label}
                              </span>
                            ))}
                            {parentPerms.length > 3 && (
                              <span className="ut-chip ut-chip--more">
                                +{parentPerms.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="ut-date">
                            {new Date(user.createdAt).toLocaleDateString("fr-FR", {
                              day: "2-digit", month: "short", year: "numeric",
                            })}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={user.status} />
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="ut-actions">
                            <button
                              className="ut-action-btn"
                              title="Voir le détail"
                              onClick={() => setSelectedUser(user)}
                              type="button"
                            >
                              <i className="bi bi-eye" />
                            </button>
                            <button
                              className="ut-action-btn ut-action-btn--edit"
                              title="Modifier"
                              onClick={() => navigate(`/modifierutil/${user.id}`)}
                              type="button"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                            <button
                              className="ut-action-btn"
                              title={user.status === "actif" ? "Désactiver" : "Activer"}
                              onClick={() => handleToggleStatus(user.id)}
                              type="button"
                            >
                              <i className={`bi ${user.status === "actif" ? "bi-pause-circle" : "bi-play-circle"}`} />
                            </button>
                            <button
                              className="ut-action-btn ut-action-btn--danger"
                              title="Supprimer"
                              onClick={() => setDeleteTarget(user)}
                              type="button"
                            >
                              <i className="bi bi-trash3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Footer count ── */}
          {!loading && filtered.length > 0 && (
            <div className="ut-count">
              {filtered.length} utilisateur{filtered.length > 1 ? "s" : ""}
              {search && ` correspondant à "${search}"`}
            </div>
          )}

        </main>
      </div>

      {/* ── Drawer détail ── */}
      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onDelete={(u) => { setDeleteTarget(u); }}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* ── Modal suppression ── */}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <footer className={`app-footer ${sidebarOpen ? "app-footer--shifted" : ""}`}>
        © 2025 Zenselekt · Propulsé par <strong>Empower talents &amp; careers</strong>. Tous droits réservés
      </footer>
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionGuard } from "./component/useSessionGuard";
import "./css/utilisateurs.css";
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
   MENUS LABELS
═══════════════════════════════════════════════════════════════ */
const MENUS_LABELS = {
  dashboard:              { label: "Dashboard",               icon: "bi-grid" },
  gestion_offres:         { label: "Offres d'emploi",         icon: "bi-briefcase" },
  gestion_utilisateurs:   { label: "Utilisateurs",            icon: "bi-people" },
  gestion_evaluations:    { label: "Évaluations",             icon: "bi-trophy" },
  gestion_notations:      { label: "Présélection",            icon: "bi-clipboard-check" },
  documentation:          { label: "Documentation",           icon: "bi-journal-text" },
};

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`ut-toast ut-toast--${type}`}>
      <i className={`bi ${type === "success" ? "bi-check-circle" : "bi-x-circle"}`} />
      <span>{message}</span>
      <button onClick={onClose} type="button"><i className="bi bi-x" /></button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BADGE STATUT
═══════════════════════════════════════════════════════════════ */
function StatusBadge({ status }) {
  return (
    <span className={`ut-badge ut-badge--${status}`}>
      <span className="ut-badge-dot" />
      {status === "actif" ? "Actif" : "Inactif"}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MODAL SUPPRESSION
═══════════════════════════════════════════════════════════════ */
function DeleteModal({ user, onConfirm, onCancel, loading }) {
  return (
    <div className="ut-overlay" onClick={onCancel}>
      <div className="ut-modal" onClick={(e) => e.stopPropagation()}>
       
        <h3>Supprimer l'utilisateur ?</h3>
        <p>
          L'accès de <strong>{user.email}</strong> sera révoqué définitivement.
          Cette action est irréversible.
        </p>
        <div className="ut-modal-actions">
          <button
            className="ut-btn ut-btn--ghost"
            onClick={onCancel}
            disabled={loading}
            type="button"
          >
            Annuler
          </button>
          <button
            className="ut-btn ut-btn--danger"
            onClick={onConfirm}
            disabled={loading}
            type="button"
          >
            {loading
              ? <> Suppression…</>
              : <> Supprimer</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DRAWER DÉTAIL UTILISATEUR
═══════════════════════════════════════════════════════════════ */
function UserDrawer({ user, onClose, onDelete, onToggleStatus, onEdit, toggling }) {
  if (!user) return null;
  const parentPerms = (user.menu_permissions || []).filter((k) => MENUS_LABELS[k]);

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
            <StatusBadge status={user.statut} />
          </div>
          <div className="ut-drawer-row">
            <span className="ut-drawer-key">Créé le</span>
            <span className="ut-drawer-val">
              {new Date(user.created_at).toLocaleDateString("fr-FR", {
                day: "2-digit", month: "long", year: "numeric",
              })}
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
            className="ut-btn ut-btn--edit"
            onClick={() => onEdit(user.id)}
            type="button"
          >
            <i className="bi bi-pencil" /> Modifier
          </button>
          <button
            className="ut-btn ut-btn--ghost"
            onClick={() => onToggleStatus(user.id, user.statut)}
            disabled={toggling}
            type="button"
          >
            {toggling
              ? <span className="ut-spinner" />
              : <i className={`bi ${user.statut === "actif" ? "bi-pause-circle" : "bi-play-circle"}`} />
            }
            {user.statut === "actif" ? " Désactiver" : " Activer"}
          </button>
          <button
            className="ut-btn ut-btn--danger-ghost"
            onClick={() => onDelete(user)}
            type="button"
          >
             Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════════ */
export default function Utilisateurs() {
  useBootstrapIcons();
  const navigate = useNavigate();
  const { checking } = useSessionGuard();

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

  /* ── État ── */
  const [users,        setUsers]        = useState([]);
  const [quota,        setQuota]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [loadError,    setLoadError]    = useState(null);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("tous");
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);
  const [toggling,     setToggling]     = useState(false);
  const [toast,        setToast]        = useState(null);

  /* ── Chargement données ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [resUsers, resQuota] = await Promise.all([
        apiFetch("?action=list"),
        apiFetch("?action=quota"),
      ]);

      if (resUsers.status === 401 || resQuota.status === 401) {
        window.location.href = "/securebackoffice/";
        return;
      }

      const dataUsers = await resUsers.json();
      const dataQuota = await resQuota.json();

      if (dataUsers.success) setUsers(dataUsers.data);
      else setLoadError(dataUsers.message);

      if (dataQuota.success) setQuota(dataQuota.quota);
    } catch {
      setLoadError("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!checking) loadData();
  }, [checking, loadData]);

  /* ── Filtres ── */
  const filtered = users.filter((u) => {
    const matchSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "tous" || u.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  /* ── Toggle statut ── */
  async function handleToggleStatus(id, currentStatut) {
    setToggling(true);
    try {
      const res = await apiFetch(`?action=toggle&id=${id}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.message || "Erreur lors du changement de statut.", type: "error" });
        return;
      }

      const newStatut = data.statut;
      setUsers((prev) =>
        prev.map((u) => u.id === id ? { ...u, statut: newStatut } : u)
      );
      setSelectedUser((prev) =>
        prev?.id === id ? { ...prev, statut: newStatut } : prev
      );
      setToast({
        message: newStatut === "actif" ? "Utilisateur activé." : "Utilisateur désactivé.",
        type: "success",
      });
    } catch {
      setToast({ message: "Erreur inattendue.", type: "error" });
    } finally {
      setToggling(false);
    }
  }

  /* ── Suppression ── */
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`?action=delete&id=${deleteTarget.id}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.message || "Erreur lors de la suppression.", type: "error" });
        return;
      }

      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSelectedUser(null);
      // Rafraîchir le quota
      apiFetch("?action=quota").then((r) => r.json()).then((d) => {
        if (d.success) setQuota(d.quota);
      });
      setToast({ message: "Utilisateur supprimé.", type: "success" });
    } catch {
      setToast({ message: "Erreur inattendue.", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  if (checking) return null;

  const slotsLeft = quota ? quota.slotsLeft : null;

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
                <span>Gestion des utilisateurs</span>
                <i className="bi bi-chevron-right" />
                <span className="breadcrumb-active">Liste</span>
              </div>
              <h1>Utilisateurs</h1>
              <p className="page-sub">Gérez les comptes collaborateurs et leurs accès</p>
            </div>
            <button
              className="ut-btn ut-btn--primary"
              onClick={() => navigate("/creerutil")}
              type="button"
            >
              <i className="bi bi-person-plus" /> Nouvel utilisateur
            </button>
          </div>

          {/* ── Bandeau quota ── */}
          {quota && (
            <div className={`ut-quota-banner ${slotsLeft === 0 ? "ut-quota-banner--full" : slotsLeft <= 1 ? "ut-quota-banner--urgent" : ""}`}>
              
              <span>
                Pack <strong>{quota.forfaitLabel}</strong> —{" "}
                <strong>{quota.currentCount}</strong> / <strong>{quota.maxUsers}</strong>{" "}
                utilisateur{quota.maxUsers > 1 ? "s" : ""}
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

          {/* ── Erreur chargement ── */}
          {loadError && (
            <div className="ut-error-banner">
              <i className="bi bi-exclamation-triangle" />
              <span>{loadError}</span>
              <button className="ut-btn ut-btn--ghost" onClick={loadData} type="button">
                Réessayer
              </button>
            </div>
          )}

          {/* ── Toolbar ── */}
          {!loadError && (
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
                  <button
                    className="ut-search-clear"
                    onClick={() => setSearch("")}
                    type="button"
                  >
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

              <button
                className="ut-btn ut-btn--ghost ut-refresh-btn"
                onClick={loadData}
                title="Rafraîchir"
                type="button"
              >
                <i className="bi bi-arrow-clockwise" />
              </button>
            </div>
          )}

          {/* ── Tableau ── */}
          {!loadError && (
            <div className="ut-card">
              {loading ? (
                <div className="ut-loading">
                  <span className="ut-spinner ut-spinner--lg" />
                  <span>Chargement…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="ut-empty">
                  <i className="bi bi-people" />
                  <p>
                    {search
                      ? "Aucun résultat pour cette recherche."
                      : "Aucun utilisateur créé."}
                  </p>
                
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
                      const parentPerms = (user.menu_permissions || []).filter(
                        (k) => MENUS_LABELS[k]
                      );
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
                              {parentPerms.length === 0 && (
                                <span className="ut-chip ut-chip--empty">Aucun accès</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className="ut-date">
                              {new Date(user.created_at).toLocaleDateString("fr-FR", {
                                day: "2-digit", month: "short", year: "numeric",
                              })}
                            </span>
                          </td>
                          <td>
                            <StatusBadge status={user.statut} />
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
                                title={user.statut === "actif" ? "Désactiver" : "Activer"}
                                onClick={() => handleToggleStatus(user.id, user.statut)}
                                type="button"
                              >
                                <i className={`bi ${user.statut === "actif" ? "bi-pause-circle" : "bi-play-circle"}`} />
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
          )}

          {/* ── Footer count ── */}
          {!loading && !loadError && filtered.length > 0 && (
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
          onDelete={(u) => setDeleteTarget(u)}
          onToggleStatus={handleToggleStatus}
          onEdit={(id) => navigate(`/modifierutil/${id}`)}
          toggling={toggling}
        />
      )}

      {/* ── Modal suppression ── */}
      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* ── Toast ── */}
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
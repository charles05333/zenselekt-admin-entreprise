import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import './css/Header.css';
import zenImg from "../assets/img/zen.png";
import loImg  from "../assets/img/logoEmpower.png";
import { useSessionGuard } from "./useSessionGuard";

/* ─────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────── */
const API_BASE   = "/securebackoffice/backsecurebackoffice";
const API_OFFRES = `${API_BASE}/offres.php`;
const API_AUTH   = `${API_BASE}/index.php`;

const TTL_MS      = 24 * 60 * 60 * 1000;
const POLL_MS     = 15_000;   // 15 s — polling "temps réel"

/* ─────────────────────────────────────────────────────────
   SON — cloche de notification (Web Audio API)
───────────────────────────────────────────────────────── */
function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [
      { freq: 523.25, start: 0.00, dur: 0.12 },
      { freq: 659.25, start: 0.10, dur: 0.12 },
      { freq: 783.99, start: 0.20, dur: 0.22 },
    ];
    notes.forEach(({ freq, start, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
    setTimeout(() => ctx.close(), 800);
  } catch (_) {}
}

/* ─────────────────────────────────────────────────────────
   HOOK — notifications
───────────────────────────────────────────────────────── */
function useOffreNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const seenMapRef       = useRef(null);
  const initializedRef   = useRef(false);
  const notificationsRef = useRef([]);
  const prevCountRef     = useRef(0);
  const prevStatusMapRef = useRef({});

  /* ── 1. Charge le seenMap depuis la BDD via session_check ── */
  const loadSeenMap = useCallback(async () => {
    try {
      const res  = await fetch(`${API_AUTH}?action=session_check`, {
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        signal: AbortSignal.timeout(8000),
      });
      const json = await res.json();
      seenMapRef.current = json.entreprise?.notifs_seen ?? {};
    } catch {
      seenMapRef.current = {};
    }
    initializedRef.current = true;
  }, []);

  /* ── 2. Persiste les IDs "vus" en BDD ── */
  const markSeenOnServer = useCallback(async (ids) => {
    if (!ids.length) return;
    try {
      await fetch(`${API_OFFRES}?action=mark_notifs_seen`, {
        method:      "POST",
        credentials: "include",
        headers: {
          "Content-Type":     "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ ids }),
        signal: AbortSignal.timeout(8000),
      });
      const now = Math.floor(Date.now() / 1000);
      for (const id of ids) {
        if (seenMapRef.current) seenMapRef.current[id] = now;
      }
    } catch {}
  }, []);

  /* ── 3. Supprime une notif individuellement ── */
  const deleteNotif = useCallback(async (notifId) => {
    const updated = notificationsRef.current.filter((n) => n.id !== notifId);
    notificationsRef.current = updated;
    setNotifications([...updated]);
    const newCount = updated.filter((n) => n.isNew).length;
    setUnreadCount(newCount);
    prevCountRef.current = newCount;

    if (seenMapRef.current) seenMapRef.current[notifId] = "deleted";

    try {
      await fetch(`${API_OFFRES}?action=delete_notif`, {
        method:      "POST",
        credentials: "include",
        headers: {
          "Content-Type":     "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({ id: notifId }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {}
  }, []);

  /* ── 4. Fetch principal ── */
  const fetchNotifications = useCallback(async () => {
    if (!initializedRef.current) {
      await loadSeenMap();
    }

    const seenMap = seenMapRef.current ?? {};
    const nowMs   = Date.now();

    try {
      const res = await fetch(
        `${API_OFFRES}?action=list&page=1&limit=100`,
        {
          credentials: "include",
          headers: { "X-Requested-With": "XMLHttpRequest" },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success) return;

      const offres = json.data?.offres ?? [];
      const notifs = [];
      let   newCount = 0;

      offres.forEach((o) => {
        const currStatut = o.statuts;
        const oId        = o.id;

        const prevStatut = prevStatusMapRef.current[oId];
        if (prevStatut && prevStatut !== currStatut) {
          if (prevStatut === "en attente") {
            delete seenMapRef.current[`pending-${oId}`];
          }
          if (prevStatut === "Approuvé") {
            delete seenMapRef.current[`approved-${oId}`];
          }
          if (prevStatut === "Refusé") {
            delete seenMapRef.current[`refused-${oId}`];
          }
        }

        /* CAS 1 : en attente */
        if (currStatut === "en attente") {
          const notifId = `pending-${oId}`;
          const seenTs  = seenMap[notifId];
          if (seenTs === "deleted") return;
          const isNew = !seenTs || (nowMs - seenTs * 1000 > TTL_MS);
          if (isNew) newCount++;
          notifs.push({
            id:       notifId,
            offre_id: oId,
            titre:    o.titre,
            date:     o.Date_pub,
            isNew,
            type:     "pending",
            message:  `Votre offre « ${o.titre} » est en attente de validation.`,
            detail:   "Vous serez notifié par e-mail après approbation. Si des profils correspondent, un fichier Excel des candidats compatibles vous sera transmis.",
          });
        }

        /* CAS 2 : approuvée */
        if (currStatut === "Approuvé") {
          const notifId = `approved-${oId}`;
          const seenTs  = seenMap[notifId];
          if (seenTs === "deleted") return;
          const isNew = !seenTs || (nowMs - seenTs * 1000 > TTL_MS);
          if (isNew) newCount++;
          notifs.push({
            id:       notifId,
            offre_id: oId,
            titre:    o.titre,
            date:     o.Date_pub,
            isNew,
            type:     "approved",
            message:  `🎉 Votre offre « ${o.titre} » a été approuvée !`,
            detail:   "Votre offre est maintenant publiée sur la plateforme Zenselekt. Si des profils correspondent, un fichier Excel des candidats compatibles vous sera transmis.",
          });
        }

        /* CAS 3 : refusée */
        if (currStatut === "Refusé") {
          const notifId = `refused-${oId}`;
          const seenTs  = seenMap[notifId];
          if (seenTs === "deleted") return;
          const isNew = !seenTs || (nowMs - seenTs * 1000 > TTL_MS);
          if (isNew) newCount++;
          notifs.push({
            id:       notifId,
            offre_id: oId,
            titre:    o.titre,
            date:     o.Date_pub,
            isNew,
            type:     "refused",
            message:  `❌ Votre offre « ${o.titre} » a été refusée.`,
            detail:   "Votre offre n'a pas été validée. Vous pouvez la modifier et la soumettre à nouveau. Pour toute question, contactez notre support.",
          });
        }
      });

      /* Snapshot statuts pour le cycle suivant */
      const newStatusMap = {};
      offres.forEach((o) => { newStatusMap[o.id] = o.statuts; });
      prevStatusMapRef.current = newStatusMap;

      notifs.sort((a, b) => {
        if (b.isNew !== a.isNew) return b.isNew ? 1 : -1;
        return b.offre_id - a.offre_id;
      });

      notificationsRef.current = notifs;
      setNotifications(notifs);
      setUnreadCount(newCount);

      if (initializedRef.current && newCount > prevCountRef.current) {
        playNotifSound();
      }
      prevCountRef.current = newCount;

    } catch {}
  }, [loadSeenMap]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  /* ── markAllRead : appelé à l'ouverture du dropdown ── */
  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    prevCountRef.current = 0;

    const nowSec = Math.floor(Date.now() / 1000);
    const toMark = [];

    notificationsRef.current.forEach((n) => {
      if (n.isNew) {
        toMark.push(n.id);
        if (seenMapRef.current) seenMapRef.current[n.id] = nowSec;
      }
    });

    notificationsRef.current = notificationsRef.current.map((n) =>
      n.isNew ? { ...n, isNew: false } : n
    );
    setNotifications([...notificationsRef.current]);

    if (toMark.length) markSeenOnServer(toMark);
  }, [markSeenOnServer]);

  return { notifications, unreadCount, markAllRead, deleteNotif };
}

/* ─────────────────────────────────────────────────────────
   SEARCH OVERLAY (mobile)
───────────────────────────────────────────────────────── */
function SearchOverlay({ onClose }) {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  return (
    <div className="search-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="search-overlay-inner">
        <i className="bi bi-search search-overlay-ico" />
        <input
          ref={inputRef}
          className="search-overlay-input"
          placeholder="Rechercher…"
          onKeyDown={(e) => e.key === "Escape" && onClose()}
        />
        <button className="search-overlay-close" onClick={onClose}>
          <i className="bi bi-x-lg" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   NOTIFICATION DROPDOWN
───────────────────────────────────────────────────────── */
function NotifDropdown({ notifications, onClose, onMarkRead, onDeleteNotif, onRefreshOffres }) {
  const ref      = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  useEffect(() => {
    onMarkRead();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Navigation vers Offres au clic sur une notif ──
   * Si déjà sur /offres → appelle directement onRefreshOffres()
   * pour forcer le refetch sans re-naviguer (React Router ignore
   * navigate("/offres") quand on est déjà dessus).
   * Sinon navigue normalement avec state { refresh } que
   * Offres.jsx écoute via useLocation().
   */
  function handleNotifClick(n) {
    onClose();
    if (location.pathname === "/offres") {
      onRefreshOffres?.();
    } else {
      navigate("/offres", { state: { refresh: Date.now() } });
    }
  }

  return (
    <div ref={ref} className="notif-dropdown notif-dropdown--rich">

      <div className="notif-dropdown-header">
        <span className="notif-dropdown-title">
          <i className="bi bi-bell-fill" />
          Notifications
        </span>
        {notifications.length > 0 && (
          <span className="notif-dropdown-count">{notifications.length}</span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="notif-empty">
          <i className="bi bi-bell-slash" />
          <p>Aucune nouvelle notification pour le moment.</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={[
                "notif-item",
                n.isNew               ? "notif-item--new"      : "",
                n.type === "approved" ? "notif-item--approved" : "",
                n.type === "refused"  ? "notif-item--refused"  : "",
              ].filter(Boolean).join(" ")}
              onClick={() => handleNotifClick(n)}  // ← AJOUT
              style={{ cursor: "pointer" }}         // ← AJOUT
            >
              <div className="notif-item-body">
                <p className="notif-item-title">{n.message}</p>
                <p className="notif-item-detail">{n.detail}</p>
                {n.date && (
                  <span className="notif-item-date">
                    <i className="bi bi-calendar3" />
                    {n.type === "approved" ? "Approuvée le "
                      : n.type === "refused" ? "Refusée le "
                      : "Publiée le "}
                    {new Date(n.date).toLocaleDateString("fr-FR", {
                      day: "2-digit", month: "long", year: "numeric",
                    })}
                  </span>
                )}
              </div>

              <div className="notif-item-actions">
                {n.isNew && <span className="notif-item-dot" />}
                <button
                  className="notif-item-delete"
                  onClick={(e) => { e.stopPropagation(); onDeleteNotif(n.id); }}
                  title="Supprimer cette notification"
                  aria-label="Supprimer cette notification"
                >
                  <i className="bi bi-x" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {notifications.length > 0 && (
        <div className="notif-footer">
          Un e-mail de confirmation vous a été envoyé pour chaque offre soumise.
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PROFILE DROPDOWN
───────────────────────────────────────────────────────── */
function ProfileDropdown({ entreprise, logout, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  function handleLogout() { onClose(); logout?.(); }

  return (
    <div ref={ref} className="profile-dropdown">
      {entreprise && (
        <div className="profile-info">
          <div className="profile-avatar">
            {(entreprise.nom ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="profile-details">
            <span className="profile-name">{entreprise.nom}</span>
            {entreprise.role && (
              <span className="profile-role">{entreprise.role}</span>
            )}
          </div>
        </div>
      )}
      <div className="profile-divider" />
      <button
        className="profile-menu-item profile-menu-item--danger"
        onClick={handleLogout}
      >
        <i className="bi bi-box-arrow-right" /> Déconnexion
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HEADER PRINCIPAL
═══════════════════════════════════════════════════════════ */
export default function Header({ sidebarOpen, onToggleSidebar, isMobile, onRefreshOffres }) {
  const [showNotif,   setShowNotif]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch,  setShowSearch]  = useState(false);

  const { entreprise, logout } = useSessionGuard();
  const { notifications, unreadCount, markAllRead, deleteNotif } = useOffreNotifications();

  function closeDropdowns() {
    setShowNotif(false);
    setShowProfile(false);
  }

  function handleNotifOpen() {
    setShowNotif((p) => !p);
    setShowProfile(false);
  }

  return (
    <>
      <header className="app-header">

        <div className="header-logo">
          <img src={zenImg} alt="Logo Zenselekt" className="brand-logo" />
        </div>

        <button
          className="toggle-btn"
          onClick={() => { onToggleSidebar(); closeDropdowns(); }}
        >
          <i className="bi bi-list" />
        </button>

        {!isMobile ? (
          <div className="header-search">
            <i className="bi bi-search search-ico" />
            <input className="search-input" placeholder="Rechercher…" />
          </div>
        ) : (
          <button
            className="header-icon-btn"
            onClick={() => setShowSearch(true)}
            title="Rechercher"
            style={{ marginLeft: 0 }}
          >
            <i className="bi bi-search" />
          </button>
        )}

        <div style={{ flex: 1 }} />

        <div className="header-right">

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              className="header-icon-btn header-notif-btn"
              onClick={handleNotifOpen}
              title="Notifications"
              aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} non lues` : ""}`}
            >
              <i className="bi bi-bell" />
              {unreadCount > 0 && (
                <span className="notif-badge" aria-hidden="true">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotif && (
              <NotifDropdown
                notifications={notifications}
                onClose={() => setShowNotif(false)}
                onMarkRead={markAllRead}
                onDeleteNotif={deleteNotif}
                onRefreshOffres={onRefreshOffres}
              />
            )}
          </div>

          {/* Logo Empower + profil */}
          <div style={{ position: "relative" }}>
            <div
              className="header-brand-wrap"
              onClick={() => { setShowProfile((p) => !p); setShowNotif(false); }}
              title="Mon compte"
            >
              <img src={loImg} alt="Logo Empower" className="brand-logos" />
              <i className={`bi bi-chevron-down profile-chevron ${showProfile ? "open" : ""}`} />
            </div>
            {showProfile && (
              <ProfileDropdown
                entreprise={entreprise}
                logout={logout}
                onClose={() => setShowProfile(false)}
              />
            )}
          </div>

        </div>
      </header>

      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
    </>
  );
}
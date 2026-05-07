import { useState, useEffect, useRef } from "react";
import './css/Header.css';
import zenImg from "../assets/img/zen.png";
import loImg from "../assets/img/logoEmpower.png";

// ── Search Overlay (mobile) ───────────────────────────────
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

// ── Notification Dropdown ─────────────────────────────────
function NotifDropdown({ onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div ref={ref} className="notif-dropdown">
      <div className="notif-body">
        <div className="notif-greeting">👋 Bonjour Solibra !</div>
        <p className="notif-sub">Vous n'avez aucune nouvelle notification pour le moment.</p>
      </div>
    </div>
  );
}

// ── Profile Dropdown ──────────────────────────────────────
function ProfileDropdown({ onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  function handleLogout() {
    onClose();
    alert("Déconnexion en cours…");
  }

  return (
    <div ref={ref} className="profile-dropdown">
      <div className="profile-divider" />
      <button className="profile-menu-item profile-menu-item--danger" onClick={handleLogout}>
        <i className="bi bi-box-arrow-right" />
        Déconnexion
      </button>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────
export default function Header({ sidebarOpen, onToggleSidebar, isMobile }) {
  const [showNotif, setShowNotif]     = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch]   = useState(false);

  function closeDropdowns() {
    setShowNotif(false);
    setShowProfile(false);
  }

  return (
    <>
      <header className="app-header">

        {/* Logo */}
        <div className="header-logo">
          <img src={zenImg} alt="Logo Zenselekt" className="brand-logo" />
        </div>

        {/* Toggle sidebar */}
        <button
          className="toggle-btn"
          onClick={() => { onToggleSidebar(); closeDropdowns(); }}
        >
          <i className="bi bi-list" />
        </button>

        {/* Barre de recherche — masquée sur mobile, remplacée par icône */}
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

        {/* Spacer flexible */}
        <div style={{ flex: 1 }} />

        {/* Right zone */}
        <div className="header-right">

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              className="header-icon-btn"
              onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
              title="Notifications"
            >
              <i className="bi bi-bell" />
            </button>
            {showNotif && <NotifDropdown onClose={() => setShowNotif(false)} />}
          </div>

          {/* Logo Empower + menu profil */}
          <div style={{ position: "relative" }}>
            <div
              className="header-brand-wrap"
              onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
              title="Mon compte"
            >
              <img src={loImg} alt="Logo Empower" className="brand-logos" />
              <i className={`bi bi-chevron-down profile-chevron ${showProfile ? "open" : ""}`} />
            </div>
            {showProfile && <ProfileDropdown onClose={() => setShowProfile(false)} />}
          </div>
        </div>
      </header>

      {/* Search overlay mobile */}
      {showSearch && <SearchOverlay onClose={() => setShowSearch(false)} />}
    </>
  );
}
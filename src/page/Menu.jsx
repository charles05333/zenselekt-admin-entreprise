import { NavLink } from "react-router-dom";
import "./css/menu.css";

const NAV_ITEMS = [
  {
    section: "Principal",
    items: [
      { to: "/accueil", icon: "bi-grid-1x2-fill", label: "Tableau de bord" },
      { to: "/candidats", icon: "bi-people-fill", label: "Candidats" },
      { to: "/offres", icon: "bi-briefcase-fill", label: "Offres d'emploi" },
    ],
  },
  {
    section: "Outils RH",
    items: [
      { to: "/shortlist", icon: "bi-stars", label: "Shortlist IA" },
      { to: "/rapports", icon: "bi-bar-chart-fill", label: "Rapports" },
      { to: "/connexions", icon: "bi-clock-history", label: "Historique" },
    ],
  },
  {
    section: "Administration",
    items: [
      { to: "/utilisateurs", icon: "bi-person-badge-fill", label: "Utilisateurs" },
      { to: "/parametres", icon: "bi-gear-fill", label: "Paramètres" },
    ],
  },
];

export default function Menu({ user, onLogout }) {
  const initials = user?.nom_complet
    ? user.nom_complet
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <aside className="zs-sidebar">
      {/* Logo */}
      <div className="zs-sidebar__logo">
        <div className="zs-brand">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="9" fill="#0a78b5" />
            <circle cx="16" cy="10" r="4" fill="#fff" opacity="0.9" />
            <path d="M5 21 Q16 15 27 21" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M8 25 H24" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
          </svg>
          <div className="zs-brand__text">
            <span className="zs-brand__name">Zenselekt</span>
            <span className="zs-brand__version">3.0</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="zs-sidebar__nav">
        {NAV_ITEMS.map((group) => (
          <div key={group.section} className="zs-nav__group">
            <span className="zs-nav__section-label">{group.section}</span>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  "zs-nav__item" + (isActive ? " zs-nav__item--active" : "")
                }
              >
                <i className={`bi ${item.icon} zs-nav__icon`} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="zs-sidebar__footer">
        <div className="zs-user">
          <div className="zs-user__avatar">{initials}</div>
          <div className="zs-user__info">
            <p className="zs-user__name">{user?.nom_complet || "Utilisateur"}</p>
            <p className="zs-user__role">Administrateur</p>
          </div>
        </div>
        <button className="zs-logout" onClick={onLogout} title="Déconnexion">
          <i className="bi bi-box-arrow-right" />
        </button>
      </div>
    </aside>
  );
}
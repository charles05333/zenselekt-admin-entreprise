import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import './css/emploi.css';
import Header from "./component/Header";
import Navbar from "./component/Navbar";

// ── Bootstrap Icons via CDN ──────────────────────────────
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

// ── Pagination ────────────────────────────────────────────
const PAGE_SIZE = 20;

// ── Mock data ─────────────────────────────────────────────
const MOCK_OFFRES = [
  {
    id: 1,
    titre: "Développeur Full Stack",
    total_postulants: 12,
    Date_pub: "2025-03-01",
    Date_lim_can: "2025-04-30",
    exp: "3ans",
    genre: "Homme/Femme",
    quali: "Licence",
    Exper: "Confirmé(e)",
    types_Off: "CDI",
    statuts: "Approuvé",
  },
  {
    id: 2,
    titre: "Responsable RH",
    total_postulants: 7,
    Date_pub: "2025-03-15",
    Date_lim_can: "2025-05-15",
    exp: "5ans",
    genre: "Homme/Femme",
    quali: "Master",
    Exper: "Expert(e)",
    types_Off: "CDI",
    statuts: "Approuvé",
  },
  {
    id: 3,
    titre: "Stagiaire Marketing Digital",
    total_postulants: 24,
    Date_pub: "2025-04-01",
    Date_lim_can: "2025-05-01",
    exp: "Aucune",
    genre: "Homme/Femme",
    quali: "BTS",
    Exper: "Débutant(e)",
    types_Off: "Stages",
    statuts: "en attente",
  },
  {
    id: 4,
    titre: "Directeur Marketing Digital",
    total_postulants: 24,
    Date_pub: "2025-04-01",
    Date_lim_can: "2025-05-01",
    exp: "Aucune",
    genre: "Homme/Femme",
    quali: "BTS",
    Exper: "Expert(e)",
    types_Off: "CDI",
    statuts: "en attente",
  },
];

// ── Helpers ───────────────────────────────────────────────
const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  });
};

// ── Statut Badge ──────────────────────────────────────────
function StatutBadge({ statut }) {
  const isOk = statut === "Approuvé";
  return (
    <span className={`offres-statut ${isOk ? "offres-statut--ok" : "offres-statut--wait"}`}>
      {statut}
    </span>
  );
}

// ── Composant Pagination ──────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const range = [];
  for (
    let i = Math.max(2, page - delta);
    i <= Math.min(totalPages - 1, page + delta);
    i++
  ) range.push(i);

  pages.push(
    <button
      key={1}
      className={`offres-page-num${page === 1 ? " offres-page-num--active" : ""}`}
      onClick={() => onChange(1)}
    >1</button>
  );

  if (range[0] > 2) pages.push(<span key="el1" className="offres-page-ellipsis">…</span>);

  range.forEach((n) =>
    pages.push(
      <button
        key={n}
        className={`offres-page-num${page === n ? " offres-page-num--active" : ""}`}
        onClick={() => onChange(n)}
      >{n}</button>
    )
  );

  if (range[range.length - 1] < totalPages - 1)
    pages.push(<span key="el2" className="offres-page-ellipsis">…</span>);

  if (totalPages > 1)
    pages.push(
      <button
        key={totalPages}
        className={`offres-page-num${page === totalPages ? " offres-page-num--active" : ""}`}
        onClick={() => onChange(totalPages)}
      >{totalPages}</button>
    );

  return (
    <div className="offres-pagination">
      <button
        className="offres-page-btn"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Page précédente"
      >
        <i className="bi bi-chevron-left" />
        <span className="offres-page-label">Précédent</span>
      </button>
      {pages}
      <button
        className="offres-page-btn"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Page suivante"
      >
        <span className="offres-page-label">Suivant</span>
        <i className="bi bi-chevron-right" />
      </button>
    </div>
  );
}

// ── Carte Mobile ──────────────────────────────────────────
function MobileCard({ o }) {
  const navigate = useNavigate();

  return (
    <div className="offres-mobile-card">
      <div className="offres-mobile-card__header">
        <div style={{ flex: 1 }}>
          <div className="offres-mobile-card__title">{o.titre}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <StatutBadge statut={o.statuts} />
            <span className="offres-type-chip">{o.types_Off}</span>
          </div>
        </div>
        <span className="offres-postulants-badge" title="Postulants">
          {o.total_postulants}
        </span>
      </div>

      <div className="offres-mobile-card__grid">
        <div className="offres-mobile-card__item">
          <span className="offres-mobile-card__label">Date pub.</span>
          <span className="offres-mobile-card__value">{formatDate(o.Date_pub)}</span>
        </div>
        <div className="offres-mobile-card__item">
          <span className="offres-mobile-card__label">Date limite</span>
          <span className="offres-mobile-card__value">{formatDate(o.Date_lim_can)}</span>
        </div>
        <div className="offres-mobile-card__item">
          <span className="offres-mobile-card__label">Expérience</span>
          <span className="offres-mobile-card__value">{o.exp}</span>
        </div>
        <div className="offres-mobile-card__item">
          <span className="offres-mobile-card__label">Genre</span>
          <span className="offres-mobile-card__value">{o.genre}</span>
        </div>
        <div className="offres-mobile-card__item">
          <span className="offres-mobile-card__label">Qualification</span>
          <span className="offres-mobile-card__value">{o.quali}</span>
        </div>
        <div className="offres-mobile-card__item">
          <span className="offres-mobile-card__label">Expertise</span>
          <span className="offres-mobile-card__value">{o.Exper}</span>
        </div>
      </div>

      <div className="offres-mobile-card__footer">
        <Link 
          to={`/postulantcampagne?event_id=${o.id}&poste=${encodeURIComponent(o.titre)}`}
          className="offres-mobile-card__voir"
        >
          <i className="bi bi-person-lines-fill" />
          <span>Voir postulants</span>
        </Link>
      </div>
    </div>
  );
}

// ── Page Emploi ───────────────────────────────────────────
export default function Offres() {
  useBootstrapIcons();
  const navigate = useNavigate();

  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isMobile = width <= 600;
  const [sidebarOpen, setSidebarOpen] = useState(width > 768);
  useEffect(() => {
    if (width <= 768) setSidebarOpen(false);
  }, [width]);

  const [offres] = useState(MOCK_OFFRES);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search]);

  const filtered = offres.filter((o) =>
    o.titre.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tableRef = useRef(null);
  function handlePageChange(newPage) {
    setPage(newPage);
    if (tableRef.current) tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <div className="offres-page">

            <div className="offres-breadcrumb">
              <h1>Campagnes d'évaluation</h1>
              <p><Link to="/acceuil">Bienvenue solibra</Link>{" / "}Gestion des annonces</p>
            </div>

            <div className="offres-card" ref={tableRef}>

              <div className="offres-toolbar">
                <div className="offres-search">
                  <i className="bi bi-search" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher une offre..."
                  />
                  {search && (
                    <button className="offres-search-clear" onClick={() => setSearch("")} title="Effacer">
                      <i className="bi bi-x" />
                    </button>
                  )}
                </div>
              </div>

              {/* TABLE desktop */}
              <div className="offres-table-wrap">
                <table className="offres-table">
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Nombre de postulant(s)</th>
                      <th>Date pub.</th>
                      <th>Date limite</th>
                      <th>Expérience</th>
                      <th>Genre</th>
                      <th>Qualification</th>
                      <th>Expertise</th>
                      <th>Statut</th>
                      <th>Type</th>
                      <th>Voir postulants</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={11}>
                          <div className="offres-empty">
                            <div className="offres-empty-icon"><i className="bi bi-inbox" /></div>
                            <p>Aucune offre trouvée.</p>
                            {search && <span>Essayez un terme de recherche différent.</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                    {paginated.map((o) => {
                      return (
                        <tr key={o.id}>
                          <td className="offres-td-titre">{o.titre}</td>
                          <td style={{ textAlign: "center" }}>
                            <span className="offres-postulants-badge">{o.total_postulants}</span>
                          </td>
                          <td className="offres-td-muted">{formatDate(o.Date_pub)}</td>
                          <td className="offres-td-muted">{formatDate(o.Date_lim_can)}</td>
                          <td className="offres-td-muted">{o.exp}</td>
                          <td className="offres-td-muted">{o.genre}</td>
                          <td className="offres-td-muted">{o.quali}</td>
                          <td className="offres-td-muted">{o.Exper}</td>
                          <td><StatutBadge statut={o.statuts} /></td>
                          <td className="offres-td-muted">{o.types_Off}</td>
                          <td>
                            <div className="offres-actions">
                              <button
                                className="offres-voir-btn"
                                onClick={() => navigate(`/postulantcampagne?event_id=${o.id}&poste=${encodeURIComponent(o.titre)}`)}
                                title="Voir les postulants"
                              >
                                <i className="bi bi-person-lines-fill" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* CARTES mobile */}
              <div className="offres-cards-mobile">
                {paginated.length === 0 ? (
                  <div className="offres-empty">
                    <div className="offres-empty-icon"><i className="bi bi-inbox" /></div>
                    <p>Aucune offre trouvée.</p>
                    {search && <span>Essayez un terme de recherche différent.</span>}
                  </div>
                ) : (
                  paginated.map((o) => (
                    <MobileCard key={o.id} o={o} />
                  ))
                )}
              </div>

              <div className="offres-table-footer">
                <span className="offres-footer-info">
                  Affichage de l'élément{" "}
                  <strong>{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</strong>
                  {" "}à{" "}
                  <strong>{Math.min(page * PAGE_SIZE, filtered.length)}</strong>
                  {" "}sur <strong>{filtered.length}</strong> élément{filtered.length !== 1 ? "s" : ""}
                  {search && <span className="offres-footer-search"> — « {search} »</span>}
                </span>
                <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
              </div>

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
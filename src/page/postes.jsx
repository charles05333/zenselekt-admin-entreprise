import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import './css/postes.css';
import Header from "./component/Header";
import Navbar from "./component/Navbar";
import { useSessionGuard } from "./component/useSessionGuard";

/* ─────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────── */
const API_BASE  = "/securebackoffice/backsecurebackoffice/postes.php";
const PAGE_SIZE = 20;
const AUTH_REDIRECT = "/securebackoffice/";

/* ─────────────────────────────────────────────────────────
   BOOTSTRAP ICONS
───────────────────────────────────────────────────────── */
const BI_CDN = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
function useBootstrapIcons() {
  useEffect(() => {
    if (!document.querySelector(`link[href="${BI_CDN}"]`)) {
      const link = document.createElement("link");
      link.rel  = "stylesheet";
      link.href = BI_CDN;
      document.head.appendChild(link);
    }
  }, []);
}

/* ─────────────────────────────────────────────────────────
   SECURE FETCH
───────────────────────────────────────────────────────── */
async function secureFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      ...(options.headers ?? {}),
    },
    credentials: "include",
    signal: options.signal ?? AbortSignal.timeout(20000),
  });
}

/* ─────────────────────────────────────────────────────────
   HOOK — chargement des postes depuis l'API
───────────────────────────────────────────────────────── */
function usePostes() {
  const [postes,  setPostes]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchPostes = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}?action=list&page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(search)}`;
      const res = await secureFetch(url);

      if (res.status === 401) {
        try {
          const json = await res.json();
          window.location.replace(json.redirect_to ?? AUTH_REDIRECT);
        } catch {
          window.location.replace(AUTH_REDIRECT);
        }
        return;
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erreur API");

      setPostes(json.data.postes ?? []);
      setTotal(json.data.total  ?? 0);
    } catch (err) {
      setError(err.message || "Erreur inattendue.");
      setPostes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { postes, total, loading, error, fetchPostes };
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  });
};

/* ─────────────────────────────────────────────────────────
   STATUT BADGE
───────────────────────────────────────────────────────── */
function StatutBadge({ statut }) {
  const isOk = statut === "Approuvé";
  return (
    <span className={`offres-statut ${isOk ? "offres-statut--ok" : "offres-statut--wait"}`}>
      <span className="offres-statut-dot" />
      {statut}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGINATION
───────────────────────────────────────────────────────── */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const delta = 2;
  const range = [];
  for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) range.push(i);

  pages.push(
    <button key={1} className={`offres-page-num${page === 1 ? " offres-page-num--active" : ""}`}
      onClick={() => onChange(1)}>1</button>
  );
  if (range[0] > 2) pages.push(<span key="el1" className="offres-page-ellipsis">…</span>);
  range.forEach((n) => pages.push(
    <button key={n} className={`offres-page-num${page === n ? " offres-page-num--active" : ""}`}
      onClick={() => onChange(n)}>{n}</button>
  ));
  if (range[range.length - 1] < totalPages - 1) pages.push(<span key="el2" className="offres-page-ellipsis">…</span>);
  if (totalPages > 1) pages.push(
    <button key={totalPages} className={`offres-page-num${page === totalPages ? " offres-page-num--active" : ""}`}
      onClick={() => onChange(totalPages)}>{totalPages}</button>
  );

  return (
    <div className="offres-pagination">
      <button className="offres-page-btn" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        aria-label="Page précédente">
        <i className="bi bi-chevron-left" /><span className="offres-page-label">Précédent</span>
      </button>
      {pages}
      <button className="offres-page-btn" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        aria-label="Page suivante">
        <span className="offres-page-label">Suivant</span><i className="bi bi-chevron-right" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CARTE MOBILE
───────────────────────────────────────────────────────── */
function MobileCard({ o }) {
  const offreUrl = `https://zenselekt.com/Talents/JobsID.php?id=${o.id}`;
  const liUrl    = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(offreUrl)}`;
  const waUrl    = `https://wa.me/?text=${encodeURIComponent("Découvrez cette offre : " + o.titre + " - " + offreUrl)}`;

  return (
    <div className="offres-mobile-card">
      <div className="offres-mobile-card__header">
        <div>
          <div className="offres-mobile-card__title">{o.titre}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <StatutBadge statut={o.statuts} />
            <span className="offres-type-chip">{o.types_Off}</span>
          </div>
        </div>
        <span className="offres-postulants-badge" title="Postulants">{o.total_postulants ?? 0}</span>
      </div>

      <div className="offres-mobile-card__grid">
        {[
          ["Date pub.",     formatDate(o.Date_pub)],
          ["Date limite",   formatDate(o.Date_lim_can)],
          ["Expérience",    o.exp],
          ["Genre",         o.genre],
          ["Qualification", o.quali],
          ["Expertise",     o.Exper],
        ].map(([l, v]) => (
          <div key={l} className="offres-mobile-card__item">
            <span className="offres-mobile-card__label">{l}</span>
            <span className="offres-mobile-card__value">{v}</span>
          </div>
        ))}
      </div>

      <div className="offres-mobile-card__footer">
        <div className="offres-share">
          <a href={liUrl} target="_blank" rel="noreferrer" className="linkedin" title="LinkedIn">
            <i className="bi bi-linkedin" />
          </a>
          <a href={waUrl} target="_blank" rel="noreferrer" className="whatsapp" title="WhatsApp">
            <i className="bi bi-whatsapp" />
          </a>
        </div>
        <div className="offres-actions">
          <Link
            to={`/postulantsnotations/${o.id}?poste=${encodeURIComponent(o.titre)}`}
            title="Accéder aux notations"
            className="offres-action-btn offres-action-btn--access"
          >
            <i className="bi bi-box-arrow-right" />
            <span>Accéder</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function Postes() {
  useBootstrapIcons();

  /* ── Session guard ── */
  const { entreprise, checked } = useSessionGuard();

  /* ── Responsive ── */
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const isMobile = width <= 768;
  const [sidebarOpen, setSidebarOpen] = useState(width > 768);
  useEffect(() => { if (width <= 768) setSidebarOpen(false); }, [width]);

  const { postes, total, loading, error, fetchPostes } = usePostes();
  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);
  const tableRef = useRef(null);

  useEffect(() => {
    fetchPostes(page, search);
  }, [page, search, fetchPostes]);

  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handlePageChange(newPage) {
    setPage(newPage);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const skeletonRows = Array.from({ length: 5 }, (_, i) => i);

  /* ── Session guard : spinner pendant vérification ── */
  if (!checked) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#f4f6fa",
        flexDirection: "column", gap: 16,
      }}>
        <div style={{
          width: 40, height: 40,
          border: "3px solid #e2e8f0",
          borderTop: "3px solid #1a7070",
          borderRadius: "50%",
          animation: "zen-spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes zen-spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: "#93a4c3", fontSize: 14 }}>Vérification en cours…</span>
      </div>
    );
  }

  /* ── Rendu principal ── */
  return (
    <div className="app">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((p) => !p)} isMobile={isMobile} />
      <div className="layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>
          <div className="offres-page">

            <div className="offres-breadcrumb">
              <div className="offres-breadcrumb-top">
                <h1>Préselection &amp; entretiens</h1>
                <div className="offres-count-pill">
                  <span>{total}</span> offre{total !== 1 ? "s" : ""}
                </div>
              </div>
              <p>
                <Link to="/acceuil">Bienvenue {entreprise?.nom}</Link>{" / "}Listes des postes
              </p>
            </div>

            {/* Erreur API */}
            {error && !loading && (
              <div className="offres-api-error">
                <i className="bi bi-exclamation-triangle-fill" />
                <span>{error}</span>
                <button onClick={() => fetchPostes(page, search)}>Réessayer</button>
              </div>
            )}

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
                {/* Pas de bouton Ajouter — vue lecture seule */}
              </div>

              {/* ── TABLE DESKTOP ── */}
              <div className="offres-table-wrap">
                <table className="offres-table">
                  <thead>
                    <tr>
                      <th>Titre</th>
                      <th>Postulants</th>
                      <th>Partager</th>
                      <th>Date pub.</th>
                      <th>Date limite</th>
                      <th>Expérience</th>
                      <th>Genre</th>
                      <th>Qualification</th>
                      <th>Expertise</th>
                      <th>Statut</th>
                      <th>Type</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      skeletonRows.map((i) => (
                        <tr key={i} className="offres-skeleton-row">
                          {Array.from({ length: 12 }).map((_, j) => (
                            <td key={j}><div className="offres-skeleton-cell" /></td>
                          ))}
                        </tr>
                      ))
                    ) : postes.length === 0 ? (
                      <tr><td colSpan={12}>
                        <div className="offres-empty">
                          <div className="offres-empty-icon"><i className="bi bi-inbox" /></div>
                          <p>Aucune offre trouvée.</p>
                          {search && <span>Essayez un terme de recherche différent.</span>}
                        </div>
                      </td></tr>
                    ) : (
                      postes.map((o, idx) => {
                        const offreUrl = `https://zenselekt.com/Talents/JobsID.php?id=${o.id}`;
                        const liUrl    = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(offreUrl)}`;
                        const waUrl    = `https://wa.me/?text=${encodeURIComponent("Découvrez cette offre : " + o.titre + " - " + offreUrl)}`;
                        return (
                          <tr key={o.id} style={{ animationDelay: `${idx * 40}ms` }}>
                            <td className="offres-td-titre">{o.titre}</td>
                            <td style={{ textAlign: "center" }}>
                              <span className="offres-postulants-badge">{o.total_postulants ?? 0}</span>
                            </td>
                            <td>
                              <div className="offres-share">
                                <a href={liUrl} target="_blank" rel="noreferrer" className="linkedin" title="LinkedIn">
                                  <i className="bi bi-linkedin" />
                                </a>
                                <a href={waUrl} target="_blank" rel="noreferrer" className="whatsapp" title="WhatsApp">
                                  <i className="bi bi-whatsapp" />
                                </a>
                              </div>
                            </td>
                            <td className="offres-td-muted">{formatDate(o.Date_pub)}</td>
                            <td className="offres-td-muted">{formatDate(o.Date_lim_can)}</td>
                            <td className="offres-td-muted">{o.exp}</td>
                            <td className="offres-td-muted">{o.genre}</td>
                            <td className="offres-td-muted">{o.quali}</td>
                            <td className="offres-td-muted">{o.Exper}</td>
                            <td><StatutBadge statut={o.statuts} /></td>
                            <td><span className="offres-type-chip">{o.types_Off}</span></td>
                            <td>
                              <div className="offres-actions">
                                <Link
                                  to={`/postulantsnotations/${o.id}?poste=${encodeURIComponent(o.titre)}`}
                                  title="Accéder aux notations"
                                  className="offres-action-btn offres-action-btn--access"
                                >
                                  <i className="bi bi-box-arrow-right" />
                                  <span>Accéder</span>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── CARTES MOBILE ── */}
              <div className="offres-cards-mobile">
                {loading ? (
                  skeletonRows.map((i) => <div key={i} className="offres-mobile-skeleton" />)
                ) : postes.length === 0 ? (
                  <div className="offres-empty">
                    <div className="offres-empty-icon"><i className="bi bi-inbox" /></div>
                    <p>Aucune offre trouvée.</p>
                    {search && <span>Essayez un terme de recherche différent.</span>}
                  </div>
                ) : (
                  postes.map((o) => <MobileCard key={o.id} o={o} />)
                )}
              </div>

              <div className="offres-table-footer">
                <span className="offres-footer-info">
                  {!loading && (
                    <>
                      Affichage de <strong>{total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</strong> à{" "}
                      <strong>{Math.min(page * PAGE_SIZE, total)}</strong> sur{" "}
                      <strong>{total}</strong> offre{total !== 1 ? "s" : ""}
                      {search && <span className="offres-footer-search"> — « {search} »</span>}
                    </>
                  )}
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
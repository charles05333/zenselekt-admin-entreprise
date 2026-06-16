import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import './css/Tests.css';
import Header from "./component/Header";
import Navbar from "./component/Navbar";
import { useSessionGuard, LOGIN_REDIRECT } from "./component/useSessionGuard";

// ── Bootstrap Icons via CDN ──────────────────────────────────
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

// ── Config API ───────────────────────────────────────────────
const API_TESTS = "/securebackoffice/backsecurebackoffice/tests.php";

const PAGE_SIZES = [10, 25, 50, 100];

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

// ── Hook fetch tests ─────────────────────────────────────────
function useTests({ search, page, pageSize, sortKey, sortDir }) {
  const [tests, setTests]         = useState([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const fetchTests = useCallback(async ({ signal } = {}) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      action:   "list",
      search:   search,
      sort:     sortKey,
      dir:      sortDir,
      page:     String(page),
      pageSize: String(pageSize),
    });

    try {
      const res = await fetch(`${API_TESTS}?${params.toString()}`, {
        credentials: "include",
        headers: {
          Accept:              "application/json",
          "X-Requested-With":  "XMLHttpRequest",
        },
        signal: signal ?? AbortSignal.timeout(10000),
      });

      if (res.status === 401) {
        window.location.replace(LOGIN_REDIRECT);
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Le serveur a renvoyé une réponse inattendue.");
      }

      if (!json.success) throw new Error(json.message || "Erreur API");

      setTests(json.data.tests       ?? []);
      setTotal(json.data.total       ?? 0);
      setTotalPages(json.data.totalPages ?? 1);
    } catch (err) {
      if (err.name === "AbortError" || err.name === "TimeoutError") return;
      setError(err.message || "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize, sortKey, sortDir]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTests({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchTests]);

  return { tests, total, totalPages, loading, error, refetch: fetchTests };
}

// ── Statut Badge ─────────────────────────────────────────────
function StatutBadge({ statut }) {
  const isOk = statut === "Activé";
  return (
    <span className={`tests-statut ${isOk ? "tests-statut--ok" : "tests-statut--off"}`}>
      <i className={`bi ${isOk ? "bi-check-lg" : "bi-x-lg"}`} />
      {statut}
    </span>
  );
}

// ── Explication cell ─────────────────────────────────────────
function ExplicationCell({ text, id, expandedId, setExpandedId }) {
  const isOpen = expandedId === id;
  const SHORT = 80;
  const truncated = text && text.length > SHORT ? text.slice(0, SHORT) + "…" : (text ?? "");

  return (
    <div className="tests-explication">
      <span className="tests-explication-text">
        {isOpen ? text : truncated}
      </span>
      {text && text.length > SHORT && (
        <button
          className="tests-voir-plus"
          onClick={() => setExpandedId(isOpen ? null : id)}
        >
          {isOpen ? "Voir moins" : "Voir plus"}
        </button>
      )}
    </div>
  );
}

// ── Skeleton row ─────────────────────────────────────────────
function SkeletonRow({ idx }) {
  return (
    <tr style={{ animationDelay: `${idx * 40}ms` }}>
      {[30, 140, 100, 220, 80, 70].map((w, i) => (
        <td key={i}>
          <div
            className="skeleton"
            style={{ width: w, height: 14, borderRadius: 6, background: "#edf2fa",
              animation: "skeleton-pulse 1.4s ease-in-out infinite" }}
          />
        </td>
      ))}
    </tr>
  );
}

// ── Pagination ────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const delta = 2;
  const range = [];
  for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) range.push(i);

  pages.push(
    <button key={1}
      className={`tests-page-num${page === 1 ? " tests-page-num--active" : ""}`}
      onClick={() => onChange(1)}>1</button>
  );
  if (range[0] > 2) pages.push(<span key="el1" className="tests-page-ellipsis">…</span>);
  range.forEach((n) =>
    pages.push(
      <button key={n}
        className={`tests-page-num${page === n ? " tests-page-num--active" : ""}`}
        onClick={() => onChange(n)}>{n}</button>
    )
  );
  if (range[range.length - 1] < totalPages - 1) pages.push(<span key="el2" className="tests-page-ellipsis">…</span>);
  if (totalPages > 1)
    pages.push(
      <button key={totalPages}
        className={`tests-page-num${page === totalPages ? " tests-page-num--active" : ""}`}
        onClick={() => onChange(totalPages)}>{totalPages}</button>
    );

  return (
    <div className="tests-pagination">
      <button className="tests-page-btn"
        onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}>Précédent</button>
      {pages}
      <button className="tests-page-btn"
        onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Suivant</button>
    </div>
  );
}

// ── Error Banner ─────────────────────────────────────────────
function ErrorBanner({ message, onRetry }) {
  return (
    <div className="tests-error-banner">
      <i className="bi bi-exclamation-circle-fill" />
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="tests-error-retry">Réessayer</button>
      )}
    </div>
  );
}

// ── Page Tests ────────────────────────────────────────────────
export default function Tests() {
  useBootstrapIcons();
  const { checked, entreprise } = useSessionGuard();
  const entrepriseName = entreprise?.nom ?? "votre espace";

  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isMobile    = width <= 768;
  const [sidebarOpen, setSidebarOpen] = useState(width > 768);
  useEffect(() => { if (width <= 768) setSidebarOpen(false); }, [width]);

  // ── États de contrôle ──
  const [search,     setSearch]     = useState("");
  const [pageSize,   setPageSize]   = useState(25);
  const [page,       setPage]       = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [sortKey,    setSortKey]    = useState("id");
  const [sortDir,    setSortDir]    = useState("asc");

  // ── Debounce recherche (évite un appel API à chaque frappe) ──
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // ── Reset page sur changement de filtre / taille ──
  useEffect(() => { setPage(1); }, [debouncedSearch, pageSize]);

  // ── Fetch API ──
  const { tests, total, totalPages, loading, error, refetch } = useTests({
    search:   debouncedSearch,
    page,
    pageSize,
    sortKey,
    sortDir,
  });

  const tableRef = useRef(null);

  function handleSort(key) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function SortIcon({ col }) {
    if (sortKey !== col)
      return <i className="bi bi-arrow-down-up tests-sort-icon tests-sort-icon--inactive" />;
    return <i className={`bi bi-arrow-${sortDir === "asc" ? "up" : "down"} tests-sort-icon`} />;
  }

  // ── Guard session ──
  if (!checked) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#f4f6fa", flexDirection: "column", gap: 16,
      }}>
        <div style={{
          width: 40, height: 40,
          border: "3px solid #e2e8f0", borderTop: "3px solid #1a7070",
          borderRadius: "50%", animation: "zen-spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes zen-spin { to { transform: rotate(360deg); } }
                 @keyframes skeleton-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
        <span style={{ color: "#93a4c3", fontSize: 14, fontFamily: "DM Sans, sans-serif" }}>
          Vérification en cours…
        </span>
      </div>
    );
  }

  return (
    <div className="app">
      <style>{`@keyframes skeleton-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>

      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        isMobile={isMobile}
      />
      <div className="layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>
          <div className="tests-page">

            {/* Breadcrumb */}
            <div className="tests-breadcrumb">
              <div className="tests-breadcrumb-top">
                <h1>Banque de Tests</h1>
                <div className="tests-count-pill">
                  <span>{total}</span> test{total !== 1 ? "s" : ""}
                </div>
              </div>
              <p>
                <Link to="/acceuil">Bienvenue {entrepriseName}</Link>
                {" / "}Gestion des tests
              </p>
            </div>

            {/* Error banner */}
            {error && !loading && (
              <ErrorBanner message={error} onRetry={refetch} />
            )}

            {/* Card */}
            <div className="tests-card" ref={tableRef}>

              {/* Toolbar */}
              <div className="tests-toolbar">
                <div className="tests-toolbar-left">
                  <label className="tests-show-label">
                    Afficher
                    <select
                      className="tests-show-select"
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                    >
                      {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    éléments
                  </label>
                </div>
                <div className="tests-toolbar-right">
                  <div className="tests-search">
                    <i className="bi bi-search" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher…"
                    />
                    {search && (
                      <button className="tests-search-clear" onClick={() => setSearch("")}>
                        <i className="bi bi-x" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="tests-table-wrap">
                <table className="tests-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort("id")} className="tests-th-sortable">
                        id <SortIcon col="id" />
                      </th>
                      <th onClick={() => handleSort("titre")} className="tests-th-sortable">
                        Titre <SortIcon col="titre" />
                      </th>
                      <th>Lien</th>
                      <th>Explication détaillée du test</th>
                      <th onClick={() => handleSort("date_creation")} className="tests-th-sortable">
                        Date de création <SortIcon col="date_creation" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Skeleton pendant le chargement */}
                    {loading && (
                      Array.from({ length: Math.min(pageSize, 5) }).map((_, idx) => (
                        <SkeletonRow key={idx} idx={idx} />
                      ))
                    )}

                    {/* État vide */}
                    {!loading && tests.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <div className="tests-empty">
                            <div className="tests-empty-icon">
                              <i className="bi bi-journal-x" />
                            </div>
                            <p>Aucun test trouvé.</p>
                            {debouncedSearch && (
                              <span>Essayez un terme de recherche différent.</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Données */}
                    {!loading && tests.map((t, idx) => (
                      <tr key={t.id} style={{ animationDelay: `${idx * 40}ms` }}>
                        <td className="tests-td-id">{t.id}</td>
                        <td className="tests-td-titre">{t.titre}</td>
                        <td>
                          <a
                            href={`/tests${t.lien}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tests-link-btn"
                            title={`Ouvrir ${t.titre} dans un nouvel onglet`}
                          >
                            <i className="bi bi-box-arrow-up-right" />
                            Accéder au test
                          </a>
                        </td>
                        <td>
                          <ExplicationCell
                            text={t.description}
                            id={t.id}
                            expandedId={expandedId}
                            setExpandedId={setExpandedId}
                          />
                        </td>
                        <td className="tests-td-muted">{formatDate(t.date_creation)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="tests-table-footer">
                <span className="tests-footer-info">
                  {loading ? (
                    "Chargement…"
                  ) : (
                    <>
                      Affichage de l&apos;élément{" "}
                      <strong>{total === 0 ? 0 : (page - 1) * pageSize + 1}</strong>
                      {" "}à{" "}
                      <strong>{Math.min(page * pageSize, total)}</strong>
                      {" "}sur <strong>{total}</strong> élément{total !== 1 ? "s" : ""}
                    </>
                  )}
                </span>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onChange={(p) => {
                    setPage(p);
                    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />
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
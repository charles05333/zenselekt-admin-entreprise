import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom"; // Ajout de Link pour le breadcrumb
import './css/Tests.css';
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

// ── Mock data ─────────────────────────────────────────────
const MOCK_TESTS = [
  {
    id: 1,
    titre: "Test de Pression",
    lien: "/pression",
    explication: "L'objectif de ce test est de : Évaluer la gestion du stress et la capacité à prendre des décisions sous pression. Il mesure la résilience et l'adaptabilité du candidat face à des situations critiques.",
    date_creation: "2025-09-11",
    statut: "Activé",
  },
  {
    id: 2,
    titre: "Test Psychotechnique - Dominos",
    lien: "/domino",
    explication: "L'objectif de ce test est de mesurer principalement les aptitudes logiques, la capacité de raisonnement abstrait et la vitesse de traitement de l'information chez le candidat.",
    date_creation: "2025-09-11",
    statut: "Activé",
  },
  {
    id: 3,
    titre: "Test d'anglais",
    lien: "/anglais",
    explication: "L'objectif principal de ce test est d'évaluer le niveau de maîtrise de la langue anglaise : compréhension écrite, vocabulaire, grammaire et expression formelle en contexte professionnel.",
    date_creation: "2025-09-11",
    statut: "Activé",
  },
  {
    id: 4,
    titre: "Test MBTI",
    lien: "/mbti",
    explication: "Le Myers-Briggs Type Indicator (MBTI) est un outil d'évaluation de la personnalité qui classifie les individus en 16 types selon quatre dimensions : Extraversion/Introversion, Sensation/Intuition, Pensée/Sentiment, Jugement/Perception. Il permet de mieux comprendre les préférences comportementales et les styles de communication du candidat.",
    date_creation: "2025-09-11",
    statut: "Activé",
  },
  {
    id: 5,
    titre: "Test des 5 Traits de Personnalité",
    lien: "/bigfive",
    explication: "Le modèle des Big Five (OCEAN) évalue cinq dimensions fondamentales de la personnalité : Ouverture à l'expérience, Conscienciosité, Extraversion, Agréabilité et Névrosisme. Ce test scientifiquement validé permet d'obtenir un profil psychologique complet du candidat et de prédire ses performances professionnelles.",
    date_creation: "2025-09-11",
    statut: "Activé",
  },
];

const PAGE_SIZES = [10, 25, 50, 100];

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
};

// ── Statut Badge ──────────────────────────────────────────
function StatutBadge({ statut }) {
  const isOk = statut === "Activé";
  return (
    <span className={`tests-statut ${isOk ? "tests-statut--ok" : "tests-statut--off"}`}>
      <i className={`bi ${isOk ? "bi-check-lg" : "bi-x-lg"}`} />
      {statut}
    </span>
  );
}

// ── Explication cell ──────────────────────────────────────
function ExplicationCell({ text, id, expandedId, setExpandedId }) {
  const isOpen = expandedId === id;
  const SHORT = 80;
  const truncated = text.length > SHORT ? text.slice(0, SHORT) + "…" : text;

  return (
    <div className="tests-explication">
      <span className="tests-explication-text">
        {isOpen ? text : truncated}
      </span>
      {text.length > SHORT && (
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

// ── Pagination ────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const delta = 2;
  const range = [];
  for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) range.push(i);
  pages.push(<button key={1} className={`tests-page-num${page === 1 ? " tests-page-num--active" : ""}`} onClick={() => onChange(1)}>1</button>);
  if (range[0] > 2) pages.push(<span key="el1" className="tests-page-ellipsis">…</span>);
  range.forEach((n) => pages.push(<button key={n} className={`tests-page-num${page === n ? " tests-page-num--active" : ""}`} onClick={() => onChange(n)}>{n}</button>));
  if (range[range.length - 1] < totalPages - 1) pages.push(<span key="el2" className="tests-page-ellipsis">…</span>);
  if (totalPages > 1) pages.push(<button key={totalPages} className={`tests-page-num${page === totalPages ? " tests-page-num--active" : ""}`} onClick={() => onChange(totalPages)}>{totalPages}</button>);
  return (
    <div className="tests-pagination">
      <button className="tests-page-btn" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}>Précédent</button>
      {pages}
      <button className="tests-page-btn" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Suivant</button>
    </div>
  );
}

// ── Page Tests ────────────────────────────────────────────
export default function Tests() {
  useBootstrapIcons();

  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isMobile = width <= 768;
  const [sidebarOpen, setSidebarOpen] = useState(width > 768);
  useEffect(() => { if (width <= 768) setSidebarOpen(false); }, [width]);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => { setPage(1); }, [search, pageSize]);

  function handleSort(key) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = MOCK_TESTS
    .filter((t) => t.titre.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (sortKey === "id") { va = Number(va); vb = Number(vb); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const tableRef = useRef(null);

  function SortIcon({ col }) {
    if (sortKey !== col) return <i className="bi bi-arrow-down-up tests-sort-icon tests-sort-icon--inactive" />;
    return <i className={`bi bi-arrow-${sortDir === "asc" ? "up" : "down"} tests-sort-icon`} />;
  }

  return (
    <div className="app">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((p) => !p)} isMobile={isMobile} />
      <div className="layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>
          <div className="tests-page">

            {/* Breadcrumb - CORRECTION UNIQUEMENT ICI */}
            <div className="tests-breadcrumb">
              <div className="tests-breadcrumb-top">
                <h1>Banque de Tests</h1>
                <div className="tests-count-pill">
                  <span>{filtered.length}</span> test{filtered.length !== 1 ? "s" : ""}
                </div>
              </div>
              <p><Link to="/acceuil">Bienvenue Solibra</Link>{" / "}Gestion des tests</p>
            </div>

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
                      <th onClick={() => handleSort("statut")} className="tests-th-sortable">
                        Statuts <SortIcon col="statut" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <div className="tests-empty">
                            <div className="tests-empty-icon"><i className="bi bi-journal-x" /></div>
                            <p>Aucun test trouvé.</p>
                            {search && <span>Essayez un terme de recherche différent.</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                    {paginated.map((t, idx) => (
                      <tr key={t.id} style={{ animationDelay: `${idx * 40}ms` }}>
                        <td className="tests-td-id">{t.id}</td>
                        <td className="tests-td-titre">{t.titre}</td>
                        <td>
                          <a
  href={`/securebackoffice${t.lien}`}
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
                            text={t.explication}
                            id={t.id}
                            expandedId={expandedId}
                            setExpandedId={setExpandedId}
                          />
                        </td>
                        <td className="tests-td-muted">{formatDate(t.date_creation)}</td>
                        <td>
                          <StatutBadge statut={t.statut} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="tests-table-footer">
                <span className="tests-footer-info">
                  Affichage de l'élément{" "}
                  <strong>{filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}</strong>
                  {" "}à{" "}
                  <strong>{Math.min(page * pageSize, filtered.length)}</strong>
                  {" "}sur <strong>{filtered.length}</strong> élément{filtered.length !== 1 ? "s" : ""}
                </span>
                <Pagination page={page} totalPages={totalPages} onChange={(p) => {
                  setPage(p);
                  tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }} />
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
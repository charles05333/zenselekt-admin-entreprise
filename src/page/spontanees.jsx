import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./css/Spontanees.css";
import Header from "./component/Header";
import Navbar from "./component/Navbar";
import { useSessionGuard } from "./component/useSessionGuard";

/* ─────────────────────────────────────────────────────────
   BOOTSTRAP ICONS CDN
───────────────────────────────────────────────────────── */
const BI_CDN =
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
function useBootstrapIcons() {
  useEffect(() => {
    if (!document.querySelector(`link[href="${BI_CDN}"]`)) {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = BI_CDN;
      document.head.appendChild(l);
    }
  }, []);
}

/* ─────────────────────────────────────────────────────────
   SWEETALERT2 — chargement dynamique
───────────────────────────────────────────────────────── */
const SA2_CDN = "https://cdn.jsdelivr.net/npm/sweetalert2@11";

function loadSwal() {
  return new Promise((resolve) => {
    if (window.Swal) return resolve(window.Swal);
    const s = document.createElement("script");
    s.src = SA2_CDN;
    s.onload = () => resolve(window.Swal);
    document.head.appendChild(s);
  });
}

async function swalSuccess(title, text) {
  const Swal = await loadSwal();
  Swal.fire({
    icon: "success",
    title,
    text,
    timer: 2500,
    timerProgressBar: true,
    showConfirmButton: false,
    customClass: { popup: "sp-swal-popup" },
  });
}

/* ─────────────────────────────────────────────────────────
   CONFIG API
───────────────────────────────────────────────────────── */
const API_SPONTANEES =
  "/securebackoffice/backsecurebackoffice/spontanee.php";

/* ─────────────────────────────────────────────────────────
   DEBOUNCE
───────────────────────────────────────────────────────── */
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─────────────────────────────────────────────────────────
   STATUTS PIPELINE
───────────────────────────────────────────────────────── */
const STATUTS = [
  { value: "nouvelle",  label: "Nouvelle",          color: "sp-statut--nouvelle"  },
  { value: "en_cours",  label: "En cours d'examen", color: "sp-statut--en_cours"  },
  { value: "entretien", label: "Entretien planifié", color: "sp-statut--entretien" },
  { value: "retenue",   label: "Retenue",            color: "sp-statut--retenue"   },
  { value: "refusee",   label: "Refusée",            color: "sp-statut--refusee"   },
  { value: "archivee",  label: "Archivée",           color: "sp-statut--archivee"  },
];

/* ─────────────────────────────────────────────────────────
   CATALOGUES FILTRES
───────────────────────────────────────────────────────── */
const SECTEURS = [
  "Agriculture / Élevage / Pêche", "Agroalimentaire", "Architecture / Urbanisme / Design",
  "Art / Culture / Spectacle", "Banque / Assurance / Microfinance",
  "BTP / Matériaux de construction", "Chimie / Parachimie",
  "Commerce / Négoce / Distribution", "Communication / Marketing / Publicité",
  "Education / Formation / Enseignement", "Électronique / Électricité / Énergie",
  "Finance / Comptabilité / Gestion", "Hôtellerie / Restauration / Tourisme",
  "Humanitaire / ONG / Associatif", "Immobilier / Foncier",
  "Industrie pharmaceutique", "Informatique / Télécoms / Numérique",
  "Management / Direction générale", "Mines / Pétrole / Énergie",
  "Ressources humaines / Recrutement", "Santé / Médical / Paramédical",
  "Services aux entreprises / Facilities", "Transports / Logistique / Supply Chain",
  "Autre / Non classifié",
];

const NIVEAUX = [
  { value: "cepe",           label: "CEPE" },
  { value: "bepc",           label: "BEPC / Brevet" },
  { value: "cap",            label: "CAP" },
  { value: "bac",            label: "Baccalauréat" },
  { value: "bt",             label: "BT" },
  { value: "bp",             label: "BP" },
  { value: "bts",            label: "BTS" },
  { value: "dut",            label: "DUT" },
  { value: "dts",            label: "DTS" },
  { value: "deug",           label: "DEUG / DEUST" },
  { value: "licence",        label: "Licence / Bachelor" },
  { value: "licence_pro",    label: "Licence pro" },
  { value: "master",         label: "Master 1" },
  { value: "master2",        label: "Master 2 / DEA" },
  { value: "ingenieur",      label: "Ingénieur" },
  { value: "grandes_ecoles", label: "Grande École" },
  { value: "doctorat",       label: "Doctorat / PhD" },
  { value: "autre",          label: "Autre" },
];

const NIVEAUX_ANGLAIS = [
  { value: "faible",   label: "Faible"   },
  { value: "moyen",    label: "Moyen"    },
  { value: "courant",  label: "Courant"  },
  { value: "bilingue", label: "Bilingue" },
];

const PAGE_SIZE = 50;

/* ─────────────────────────────────────────────────────────
   FETCH SÉCURISÉ
───────────────────────────────────────────────────────── */
async function secureFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      Accept: "application/json",
      ...(options.headers ?? {}),
    },
    signal: options.signal ?? AbortSignal.timeout(15000),
  });
}

/* ─────────────────────────────────────────────────────────
   HOOK — données candidatures spontanées
───────────────────────────────────────────────────────── */
function useSpontanees({
  search, filterStatut, filterSecteur, filterNiveau,
  filterAnglais, filterGenre, filterCommune,
  filterPeriode, filterDiplome,
  sortCol, sortDir, page,
}) {
  const [data, setData]             = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page:  String(page),
      limit: String(PAGE_SIZE),
      sort:  sortCol,
      dir:   sortDir,
    });
    if (search)         params.set("search",   search);
    if (filterStatut)   params.set("statut",   filterStatut);
    if (filterSecteur)  params.set("secteur",  filterSecteur);
    if (filterNiveau)   params.set("niveau",   filterNiveau);
    if (filterAnglais)  params.set("niveau_a", filterAnglais);
    if (filterGenre)    params.set("genre",    filterGenre);
    if (filterCommune)  params.set("commune",  filterCommune);
    if (filterPeriode)  params.set("periode",  filterPeriode);
    if (filterDiplome)  params.set("diplome",  filterDiplome);

    try {
      const res = await secureFetch(`${API_SPONTANEES}?${params.toString()}`);

      if (res.status === 401) {
        window.location.replace("https://app.zenselekt.com/securebackoffice/");
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      let json;
      try { json = JSON.parse(text); }
      catch {
        throw new Error(
          "Réponse serveur invalide. Vérifiez que spontanee.php retourne du JSON."
        );
      }

      if (!json.success) throw new Error(json.message || "Erreur API");

      setData(json.data ?? []);
      setTotal(json.pagination?.total ?? 0);
      setTotalPages(json.pagination?.totalPages ?? 1);
      setStats(json.stats ?? null);
    } catch (err) {
      if (err.name === "AbortError" || err.name === "TimeoutError") {
        setError("La requête a expiré. Vérifiez votre connexion.");
      } else {
        setError(err.message || "Erreur inattendue.");
      }
    } finally {
      setLoading(false);
    }
  }, [
    search, filterStatut, filterSecteur, filterNiveau,
    filterAnglais, filterGenre, filterCommune,
    filterPeriode, filterDiplome,
    sortCol, sortDir, page,
  ]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, total, totalPages, stats, loading, error, refetch: fetchData };
}

/* ─────────────────────────────────────────────────────────
   HOOK — sauvegarde annotations
───────────────────────────────────────────────────────── */
function useSaveMeta(refetch) {
  const [saving, setSaving]   = useState(false);
  const [savedId, setSavedId] = useState(null);

  const saveMeta = useCallback(async (id, updates) => {
    setSaving(true);
    try {
      const res = await secureFetch(`${API_SPONTANEES}?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);

      await swalSuccess(
        "Sauvegarde réussie !",
        "Les informations de la candidature ont bien été enregistrées."
      );

      refetch();
    } catch (err) {
      const Swal = await loadSwal();
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: `Erreur lors de la sauvegarde : ${err.message}`,
        confirmButtonColor: "#1a7070",
      });
    } finally {
      setSaving(false);
    }
  }, [refetch]);

  return { saveMeta, saving, savedId };
}

/* ─────────────────────────────────────────────────────────
   UTILITAIRES
───────────────────────────────────────────────────────── */
function getInitiales(nom, prenoms) {
  return (nom || "").charAt(0).toUpperCase() + (prenoms || "").charAt(0).toUpperCase();
}

function getAvatarColor(id) {
  const colors = [
    "#0a78b5", "#1d6f42", "#7c3aed", "#b45309",
    "#dc2626", "#0891b2", "#16a34a", "#9333ea",
  ];
  return colors[id % colors.length];
}

function formatDate(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getDelaiDepot(isoStr) {
  if (!isoStr) return "";
  const diff = Math.floor((Date.now() - new Date(isoStr)) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 7)  return `Il y a ${diff} jours`;
  if (diff < 30) return `Il y a ${Math.floor(diff / 7)} semaine(s)`;
  return `Il y a ${Math.floor(diff / 30)} mois`;
}

function calcAge(dateNaissance) {
  if (!dateNaissance) return "—";
  const dob = new Date(dateNaissance);
  const age = Math.floor((Date.now() - dob) / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} ans`;
}

/* ─────────────────────────────────────────────────────────
   EXPORT EXCEL
   Colonnes alignées sur les vrais champs retournés par l'API
───────────────────────────────────────────────────────── */
function exportExcel(candidatures) {
  const XLSX_CDN =
    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";

  const doExport = () => {
    const XLSX = window.XLSX;
    const wb   = XLSX.utils.book_new();

    // ── En-têtes (uniquement les colonnes qui existent en BDD) ──
    const headers = [
      "Id", "Nom", "Prénom(s)", "Email", "Téléphone", "WhatsApp",
      "Date naissance", "Âge", "Genre",
      "Secteur d'activité", "Niveau académique", "Niveau anglais",
      "Commune", "Quartier",
      "Statut pipeline", "Tags", "Notes",
      "Date de soumission", "CV", "Lettre", "Diplôme",
    ];

    const rows = candidatures.map((c) => [
      c.id,
      c.nom,
      c.prenoms,
      c.email   || "—",
      c.tel     || "—",
      c.telwhat || "—",
      c.date_N  || "—",
      calcAge(c.date_N),
      c.Genre   || "—",
      c.Secteur || "—",
      c.Niveau  || "—",
      c.Niveau_A || "—",
      c.commune  || "—",
      c.quartier || "—",
      STATUTS.find((s) => s.value === c.statut)?.label || c.statut,
      (c.tags || []).join(", "),
      c.notes || "",
      formatDateTime(c.date_inscription),
      c.cv_url      ? "Oui" : "Non",
      c.lettre_url  ? "Oui" : "Non",
      c.diplome_url ? "Oui" : "Non",
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, "Candidatures spontanées");
    XLSX.writeFile(wb, "candidatures_spontanees_zenselekt.xlsx");
  };

  if (window.XLSX) doExport();
  else {
    const s = document.createElement("script");
    s.src = XLSX_CDN;
    s.onload = doExport;
    document.head.appendChild(s);
  }
}

/* ─────────────────────────────────────────────────────────
   PAGINATION
───────────────────────────────────────────────────────── */
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
    <button key={1}
      className={`sp-page-num${page === 1 ? " sp-page-num--active" : ""}`}
      onClick={() => onChange(1)}>1</button>
  );
  if (range[0] > 2)
    pages.push(<span key="el1" className="sp-page-ellipsis">…</span>);
  range.forEach((n) =>
    pages.push(
      <button key={n}
        className={`sp-page-num${page === n ? " sp-page-num--active" : ""}`}
        onClick={() => onChange(n)}>{n}</button>
    )
  );
  if (range[range.length - 1] < totalPages - 1)
    pages.push(<span key="el2" className="sp-page-ellipsis">…</span>);
  if (totalPages > 1)
    pages.push(
      <button key={totalPages}
        className={`sp-page-num${page === totalPages ? " sp-page-num--active" : ""}`}
        onClick={() => onChange(totalPages)}>{totalPages}</button>
    );

  return (
    <div className="sp-pagination">
      <button className="sp-page-btn"
        onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}>
        <i className="bi bi-chevron-left" />
        <span className="sp-page-label">Précédent</span>
      </button>
      {pages}
      <button className="sp-page-btn"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}>
        <span className="sp-page-label">Suivant</span>
        <i className="bi bi-chevron-right" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   BADGE STATUT
───────────────────────────────────────────────────────── */
function StatutBadge({ statut }) {
  const s = STATUTS.find((x) => x.value === statut) || STATUTS[0];
  return <span className={`sp-statut-badge ${s.color}`}>{s.label}</span>;
}

/* ─────────────────────────────────────────────────────────
   INDICATEUR DOCUMENTS
───────────────────────────────────────────────────────── */
function DocIndicators({ cv_url, lettre_url, diplome_url }) {
  return (
    <div className="sp-doc-indicators">
      <span
        className={`sp-doc-dot ${cv_url ? "sp-doc-dot--ok" : "sp-doc-dot--missing"}`}
        title={cv_url ? "CV fourni" : "CV manquant"}>CV</span>
      <span
        className={`sp-doc-dot ${lettre_url ? "sp-doc-dot--ok" : "sp-doc-dot--missing"}`}
        title={lettre_url ? "Lettre fournie" : "Lettre manquante"}>LM</span>
      <span
        className={`sp-doc-dot ${diplome_url ? "sp-doc-dot--ok" : "sp-doc-dot--missing"}`}
        title={diplome_url ? "Diplôme fourni" : "Diplôme manquant"}>DIP</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SKELETON LIGNE TABLEAU
───────────────────────────────────────────────────────── */
function SkeletonRows({ count = 10, cols = 13 }) {
  return Array.from({ length: count }, (_, i) => (
    <tr key={i} className="sp-tr--skeleton">
      <td>
        <div className="skeleton" style={{ width: 18, height: 18, borderRadius: 4 }} />
      </td>
      {Array.from({ length: cols }, (_, j) => (
        <td key={j}>
          <div
            className="skeleton skeleton--text"
            style={{ width: `${50 + ((i * 7 + j * 13) % 40)}%`, height: 12 }}
          />
        </td>
      ))}
    </tr>
  ));
}

/* ─────────────────────────────────────────────────────────
   STATS BAR
───────────────────────────────────────────────────────── */
function StatsBar({ stats, total }) {
  const nouvelles   = stats?.nouvelles   ?? 0;
  const entretiens  = stats?.entretiens  ?? 0;
  const retenues    = stats?.retenues    ?? 0;
  const refusees    = stats?.refusees    ?? 0;
  const avecDiplome = stats?.avecDiplome ?? 0;

  return (
    <div className="sp-stats-bar">
      <div className="sp-stat-item">
        <span className="sp-stat-value">{total}</span>
        <span className="sp-stat-label">Total</span>
      </div>
      <div className="sp-stat-divider" />
      <div className="sp-stat-item">
        <span className="sp-stat-value sp-stat-value--indigo">{nouvelles}</span>
        <span className="sp-stat-label">Nouvelles</span>
      </div>
      <div className="sp-stat-item">
        <span className="sp-stat-value sp-stat-value--orange">{entretiens}</span>
        <span className="sp-stat-label">Entretiens</span>
      </div>
      <div className="sp-stat-divider" />
      <div className="sp-stat-item">
        <span className="sp-stat-value sp-stat-value--green">{retenues}</span>
        <span className="sp-stat-label">Retenues</span>
      </div>
      <div className="sp-stat-item">
        <span className="sp-stat-value sp-stat-value--red">{refusees}</span>
        <span className="sp-stat-label">Refusées</span>
      </div>
      <div className="sp-stat-divider" />
      <div className="sp-stat-item">
        <span className="sp-stat-value sp-stat-value--purple">{avecDiplome}</span>
        <span className="sp-stat-label">Avec diplôme</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   BARRE D'ACTIONS GROUPÉES
───────────────────────────────────────────────────────── */
function BulkActionBar({ count, onStatut, onExport, onClear }) {
  const [statutOpen, setStatutOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setStatutOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (count === 0) return null;

  return (
    <div className="sp-bulk-bar">
      <div className="sp-bulk-info">
        <i className="bi bi-check2-square" />
        <strong>{count}</strong> candidature{count > 1 ? "s" : ""} sélectionnée{count > 1 ? "s" : ""}
      </div>
      <div className="sp-bulk-actions">
        <div style={{ position: "relative" }} ref={ref}>
          <button className="sp-bulk-btn" onClick={() => setStatutOpen((p) => !p)}>
            <i className="bi bi-kanban" /> Changer statut
            <i className="bi bi-chevron-down" style={{ fontSize: 10 }} />
          </button>
          {statutOpen && (
            <div className="sp-bulk-dropdown">
              {STATUTS.map((s) => (
                <button
                  key={s.value}
                  className="sp-bulk-dropdown-item"
                  onClick={() => { onStatut(s.value); setStatutOpen(false); }}>
                  <span className={`sp-statut-dot ${s.color}`} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="sp-bulk-btn" onClick={onExport}>
          <i className="bi bi-file-earmark-excel-fill" /> Exporter la sélection
        </button>
        <button className="sp-bulk-btn sp-bulk-btn--clear" onClick={onClear}>
          <i className="bi bi-x" /> Désélectionner
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   DRAWER FICHE CANDIDATURE
   ⚠ Champs retirés car absents de la BDD :
      Pays_N, Pays_R, Situation_M, Nombre_E,
      departement, sous_prefecture, Lieu_N
   ✅ Champs ajoutés : quartier
───────────────────────────────────────────────────────── */
function CandidatureDrawer({ candidature, onClose, onSave, saving, savedId }) {
  const [notes,    setNotes]    = useState(candidature?.notes  || "");
  const [tagInput, setTagInput] = useState("");
  const [tags,     setTags]     = useState(candidature?.tags   || []);
  const [statut,   setStatut]   = useState(candidature?.statut || "nouvelle");
  const [dirty,    setDirty]    = useState(false);

  const drawerRef = useRef(null);
  const isSaved   = savedId === candidature?.id;

  useEffect(() => {
    if (candidature) {
      setNotes(candidature.notes   || "");
      setTags(candidature.tags     || []);
      setStatut(candidature.statut || "nouvelle");
      setDirty(false);
    }
  }, [candidature?.id]);

  useEffect(() => {
    const h = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
    };
    if (candidature) setTimeout(() => document.addEventListener("mousedown", h), 100);
    return () => document.removeEventListener("mousedown", h);
  }, [candidature, onClose]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  function addTag(e) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/,$/, "");
      if (t && !tags.includes(t)) { setTags([...tags, t]); setDirty(true); }
      setTagInput("");
    }
  }
  function removeTag(t)  { setTags(tags.filter((x) => x !== t)); setDirty(true); }
  function handleStatut(s) { setStatut(s); setDirty(true); }
  function handleNotes(e)  { setNotes(e.target.value); setDirty(true); }

  function handleSave() {
    onSave(candidature.id, { statut, notes, tags });
    setDirty(false);
  }

  if (!candidature) return null;

  const avatarColor = getAvatarColor(candidature.id);
  const docsCount   = [candidature.cv_url, candidature.lettre_url, candidature.diplome_url]
    .filter(Boolean).length;

  return (
    <div className="sp-drawer-overlay">
      <div className="sp-drawer" ref={drawerRef}>

        {/* ── Header ── */}
        <div className="sp-drawer-header">
          <div className="sp-drawer-avatar" style={{ background: avatarColor }}>
            {getInitiales(candidature.nom, candidature.prenoms)}
          </div>
          <div className="sp-drawer-identity">
            <h2>{candidature.prenoms} <strong>{candidature.nom}</strong></h2>
            <a href={`mailto:${candidature.email}`} className="sp-drawer-email">
              {candidature.email}
            </a>
            <div className="sp-drawer-meta">
              {formatDateTime(candidature.date_inscription)}
              <span className="sp-drawer-delai">
                · {getDelaiDepot(candidature.date_inscription)}
              </span>
            </div>
          </div>
          <button className="sp-drawer-close" onClick={onClose} title="Fermer">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="sp-drawer-body">

          {/* ── Statut pipeline ── */}
          <div className="sp-drawer-section">
            <div className="sp-drawer-section-title">Statut pipeline</div>
            <div className="sp-statut-selector">
              {STATUTS.map((s) => (
                <button
                  key={s.value}
                  className={`sp-statut-btn ${s.color}${statut === s.value ? " active" : ""}`}
                  onClick={() => handleStatut(s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Coordonnées ── */}
          <div className="sp-drawer-section">
            <div className="sp-drawer-section-title">Coordonnées</div>
            <div className="sp-drawer-grid">

              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">Téléphone</span>
                <a href={`tel:${candidature.tel}`} className="sp-drawer-link">
                  {candidature.tel || "—"}
                </a>
              </div>

              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">WhatsApp</span>
                {candidature.telwhat ? (
                  <a
                    href={`https://wa.me/${candidature.telwhat.replace(/\s/g, "").replace("+", "")}`}
                    className="sp-drawer-link sp-drawer-link--wa"
                    target="_blank" rel="noreferrer">
                    {candidature.telwhat}
                  </a>
                ) : <span className="sp-td-muted">—</span>}
              </div>

              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">Genre</span>
                <span className={`sp-badge-genre sp-badge-genre--${candidature.Genre?.toLowerCase()}`}>
                  {candidature.Genre || "—"}
                </span>
              </div>

              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">Date de naissance</span>
                <span>
                  {formatDate(candidature.date_N)}
                  <em className="sp-drawer-age"> · {calcAge(candidature.date_N)}</em>
                </span>
              </div>

              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">Commune</span>
                <span>{candidature.commune || "—"}</span>
              </div>

              {/* quartier existe dans la BDD */}
              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">Quartier</span>
                <span>{candidature.quartier || "—"}</span>
              </div>

            </div>
          </div>

          {/* ── Profil professionnel ── */}
          <div className="sp-drawer-section">
            <div className="sp-drawer-section-title">Profil professionnel</div>
            <div className="sp-drawer-grid">
              <div className="sp-drawer-field sp-drawer-field--full">
                <span className="sp-drawer-field-label">Secteur d'activité</span>
                <span>{candidature.Secteur || "—"}</span>
              </div>
              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">Niveau académique</span>
                <span className="sp-badge-niveau">{candidature.Niveau || "—"}</span>
              </div>
              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">Niveau anglais</span>
                <span className={`sp-badge-anglais sp-badge-anglais--${candidature.Niveau_A}`}>
                  {candidature.Niveau_A || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Documents fournis ── */}
          <div className="sp-drawer-section">
            <div className="sp-drawer-section-title">
              Documents fournis
              <span className="sp-drawer-doc-count">{docsCount}/3</span>
            </div>
            <div className="sp-drawer-docs">
              {candidature.cv_url ? (
                <a className="sp-btn-dl sp-btn-dl--cv" href={candidature.cv_url}
                  target="_blank" rel="noreferrer">
                  Télécharger CV
                </a>
              ) : <span className="sp-doc-missing">CV non fourni</span>}

              {candidature.lettre_url ? (
                <a className="sp-btn-dl sp-btn-dl--lettre" href={candidature.lettre_url}
                  target="_blank" rel="noreferrer">
                  Lettre de motivation
                </a>
              ) : <span className="sp-doc-missing">Lettre non fournie</span>}

              {candidature.diplome_url ? (
                <a className="sp-btn-dl sp-btn-dl--diplome" href={candidature.diplome_url}
                  target="_blank" rel="noreferrer">
                  Copie du diplôme
                </a>
              ) : <span className="sp-doc-missing">Diplôme non fourni</span>}
            </div>
          </div>

          {/* ── Tags recruteur ── */}
          <div className="sp-drawer-section">
            <div className="sp-drawer-section-title">Tags recruteur</div>
            <div className="sp-tags-list">
              {tags.map((t) => (
                <span key={t} className="sp-tag">
                  {t}
                  <button onClick={() => removeTag(t)} className="sp-tag-remove">
                    <i className="bi bi-x" />
                  </button>
                </span>
              ))}
            </div>
            <input
              className="sp-filter-select sp-tag-input"
              type="text"
              placeholder="Ajouter un tag (Entrée pour valider)…"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
            />
          </div>

          {/* ── Notes recruteur ── */}
          <div className="sp-drawer-section">
            <div className="sp-drawer-section-title">Notes recruteur</div>
            <textarea
              className="sp-drawer-notes"
              placeholder="Ajoutez vos observations, retours d'entretien…"
              value={notes}
              onChange={handleNotes}
              rows={4}
            />
          </div>

        </div>{/* /sp-drawer-body */}

        {/* ── Footer actions ── */}
        <div className="sp-drawer-footer">
          <a href={`mailto:${candidature.email}`}
            className="sp-btn-action sp-btn-action--email">
            <i className="bi bi-envelope-fill" /> Envoyer un email
          </a>

          {(candidature.telwhat || candidature.tel) && (
            <a
              href={`https://wa.me/${(candidature.telwhat || candidature.tel)
                .replace(/\s/g, "").replace("+", "")}`}
              className="sp-btn-action sp-btn-action--whatsapp"
              target="_blank" rel="noreferrer">
              <i className="bi bi-whatsapp" /> WhatsApp
            </a>
          )}

          <button
            className={`sp-btn-action sp-btn-action--save${isSaved ? " saved" : ""}${!dirty ? " sp-btn-action--disabled" : ""}`}
            onClick={handleSave}
            disabled={saving || !dirty}>
            {saving && savedId === null ? (
              <><i className="bi bi-arrow-repeat" /> Sauvegarde…</>
            ) : isSaved ? (
              <><i className="bi bi-check-circle-fill" /> Sauvegardé !</>
            ) : (
              <><i className="bi bi-floppy" /> Sauvegarder</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COLONNES TABLEAU
───────────────────────────────────────────────────────── */
const COLUMNS = [
  { key: "id",               label: "Id",        sortable: true  },
  { key: "nom",              label: "Nom",        sortable: true  },
  { key: "prenoms",          label: "Prénom(s)",  sortable: true  },
  { key: "statut",           label: "Statut",     sortable: true  },
  { key: "date_inscription", label: "Soumis le",  sortable: true  },
  { key: "email",            label: "Email",      sortable: true  },
  { key: "tel",              label: "Téléphone",  sortable: false },
  { key: "Genre",            label: "Genre",      sortable: true  },
  { key: "Secteur",          label: "Secteur",    sortable: true  },
  { key: "Niveau",           label: "Niveau",     sortable: true  },
  { key: "Niveau_A",         label: "Anglais",    sortable: true  },
  { key: "commune",          label: "Commune",    sortable: true  },
  { key: "_docs",            label: "Documents",  sortable: false },
];

/* ═══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════ */
export default function CandidaturesSpontanees() {
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
  const isMobile = width <= 600;
  const [sidebarOpen, setSidebarOpen] = useState(width > 768);
  useEffect(() => { if (width <= 768) setSidebarOpen(false); }, [width]);

  /* ── Drawer ── */
  const [selectedCandidature, setSelectedCandidature] = useState(null);

  /* ── Filtres ── */
  const [searchRaw,      setSearchRaw]      = useState("");
  const [filterStatut,   setFilterStatut]   = useState("");
  const [filterSecteur,  setFilterSecteur]  = useState("");
  const [filterNiveau,   setFilterNiveau]   = useState("");
  const [filterAnglais,  setFilterAnglais]  = useState("");
  const [filterGenre,    setFilterGenre]    = useState("");
  const [filterCommune,  setFilterCommune]  = useState("");
  const [filterPeriode,  setFilterPeriode]  = useState("");
  const [filterDiplome,  setFilterDiplome]  = useState("");
  const search = useDebounce(searchRaw, 350);

  /* ── Tri ── */
  const [sortCol, setSortCol] = useState("date_inscription");
  const [sortDir, setSortDir] = useState("DESC");

  /* ── Pagination ── */
  const [page, setPage] = useState(1);
  const tableRef = useRef(null);

  /* ── Sélection ── */
  const [selectedIds, setSelectedIds] = useState(new Set());

  /* ── Reset page sur changement de filtres ── */
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [
    search, filterStatut, filterSecteur, filterNiveau, filterAnglais,
    filterGenre, filterCommune, filterPeriode, filterDiplome, sortCol, sortDir,
  ]);

  /* ── Fetch candidatures ── */
  const {
    data: candidatures,
    total,
    totalPages,
    stats,
    loading,
    error,
    refetch,
  } = useSpontanees({
    search,
    filterStatut,
    filterSecteur,
    filterNiveau,
    filterAnglais,
    filterGenre,
    filterCommune,
    filterPeriode,
    filterDiplome,
    sortCol,
    sortDir,
    page,
  });

  /* ── Sauvegarde méta ── */
  const { saveMeta, saving, savedId } = useSaveMeta(refetch);

  /* ── Tri colonnes ── */
  function handleSort(col) {
    if (sortCol === col) setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    else { setSortCol(col); setSortDir("ASC"); }
  }

  function SortIcon({ col }) {
    if (sortCol !== col)
      return <i className="bi bi-chevron-expand sp-sort-icon" />;
    return sortDir === "ASC"
      ? <i className="bi bi-chevron-up   sp-sort-icon sp-sort-icon--active" />
      : <i className="bi bi-chevron-down sp-sort-icon sp-sort-icon--active" />;
  }

  /* ── Sélection ── */
  const allPageSelected =
    candidatures.length > 0 && candidatures.every((c) => selectedIds.has(c.id));

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allPageSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(candidatures.map((c) => c.id)));
  }

  /* ── Actions groupées ── */
  async function bulkChangeStatut(statut) {
    const ids = [...selectedIds];
    for (const id of ids) await saveMeta(id, { statut });
    setSelectedIds(new Set());
  }

  /* ── Réinitialisation filtres ── */
  function resetFilters() {
    setSearchRaw("");
    setFilterStatut("");
    setFilterSecteur("");
    setFilterNiveau("");
    setFilterAnglais("");
    setFilterGenre("");
    setFilterCommune("");
    setFilterPeriode("");
    setFilterDiplome("");
  }

  const hasActiveFilters =
    searchRaw || filterStatut || filterSecteur || filterNiveau ||
    filterAnglais || filterGenre || filterCommune || filterPeriode || filterDiplome;

  /* ── Candidature dans le drawer ── */
  const drawerCandidature = useMemo(
    () => candidatures.find((c) => c.id === selectedCandidature?.id) ?? selectedCandidature,
    [candidatures, selectedCandidature]
  );

  /* ── Session guard — spinner ── */
  if (!checked) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#f4f6fa", flexDirection: "column", gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, border: "3px solid #e2e8f0",
          borderTop: "3px solid #1a7070", borderRadius: "50%",
          animation: "zen-spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes zen-spin{to{transform:rotate(360deg);}}`}</style>
        <span style={{ color: "#93a4c3", fontSize: 14 }}>Vérification en cours…</span>
      </div>
    );
  }

  /* ── Rendu carte mobile ── */
  function renderCard(c) {
    const avatarColor = getAvatarColor(c.id);
    return (
      <div key={c.id} className="sp-mobile-card" onClick={() => setSelectedCandidature(c)}>
        <div className="sp-mobile-card__header">
          <label className="sp-mobile-card__check" onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" className="sp-checkbox"
              checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} />
            <div className="sp-mobile-avatar" style={{ background: avatarColor }}>
              {getInitiales(c.nom, c.prenoms)}
            </div>
            <div>
              <div className="sp-mobile-card__name">{c.prenoms} {c.nom}</div>
              <div className="sp-mobile-card__email">{c.email}</div>
              <div className="sp-mobile-card__date">{getDelaiDepot(c.date_inscription)}</div>
            </div>
          </label>
          <StatutBadge statut={c.statut} />
        </div>
        <div className="sp-mobile-card__grid">
          <div className="sp-mobile-card__item">
            <span className="sp-mobile-card__label">Secteur</span>
            <span className="sp-mobile-card__value">{c.Secteur || "—"}</span>
          </div>
          <div className="sp-mobile-card__item">
            <span className="sp-mobile-card__label">Niveau</span>
            <span className="sp-badge-niveau">{c.Niveau}</span>
          </div>
          <div className="sp-mobile-card__item">
            <span className="sp-mobile-card__label">Commune</span>
            <span className="sp-mobile-card__value">{c.commune || "—"}</span>
          </div>
          <div className="sp-mobile-card__item">
            <span className="sp-mobile-card__label">Anglais</span>
            <span className={`sp-badge-anglais sp-badge-anglais--${c.Niveau_A}`}>
              {c.Niveau_A || "—"}
            </span>
          </div>
          <div className="sp-mobile-card__item sp-mobile-card__item--full">
            <span className="sp-mobile-card__label">Documents</span>
            <DocIndicators
              cv_url={c.cv_url}
              lettre_url={c.lettre_url}
              diplome_url={c.diplome_url}
            />
          </div>
        </div>
        {(c.tags || []).length > 0 && (
          <div className="sp-mobile-card__tags">
            {c.tags.slice(0, 3).map((t) => (
              <span key={t} className="sp-tag sp-tag--sm">{t}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     RENDU PRINCIPAL
  ══════════════════════════════════════════════════════ */
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
          <div className="sp-page">

            {/* ── Titre ── */}
            <div className="sp-breadcrumb">
              <h1>Candidatures spontanées</h1>
              <p>
                <a href="/securebackoffice/acceuil">
                  Bienvenue {entreprise?.nom ?? ""}
                </a>{" / "}
                <strong>Candidatures spontanées</strong>
              </p>
            </div>

            {/* ── Stats bar ── */}
            <StatsBar stats={stats} total={total} />

            {/* ── Erreur chargement ── */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "#fff5f5", border: "1px solid #fed7d7",
                borderRadius: 10, padding: "14px 20px", marginBottom: 20,
                color: "#c53030", fontSize: 14,
              }}>
                <i className="bi bi-exclamation-circle-fill"
                  style={{ fontSize: 18, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{error}</span>
                <button onClick={refetch} style={{
                  background: "#1a7070", color: "#fff", border: "none",
                  borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontSize: 13,
                }}>Réessayer</button>
              </div>
            )}

            {/* ── Actions groupées ── */}
            <BulkActionBar
              count={selectedIds.size}
              onStatut={bulkChangeStatut}
              onExport={() => exportExcel(candidatures.filter((c) => selectedIds.has(c.id)))}
              onClear={() => setSelectedIds(new Set())}
            />

            <div className="sp-card" ref={tableRef}>

              {/* ── Toolbar ── */}
              <div className="sp-toolbar">
                <div className="sp-search">
                  <i className="bi bi-search" />
                  <input
                    value={searchRaw}
                    onChange={(e) => setSearchRaw(e.target.value)}
                    placeholder="Nom, prénom, email, secteur…"
                  />
                  {searchRaw && (
                    <button className="sp-search-clear" onClick={() => setSearchRaw("")}>
                      <i className="bi bi-x" />
                    </button>
                  )}
                </div>
                <div className="sp-toolbar-right">
                  {hasActiveFilters && (
                    <button className="sp-btn-reset" onClick={resetFilters}>
                      <i className="bi bi-x-circle" />
                      <span>Réinitialiser</span>
                    </button>
                  )}
                  <button
                    className="sp-btn-export"
                    onClick={() => exportExcel(candidatures)}
                    title={`Exporter ${total} candidature(s)`}>
                    <i className="bi bi-file-earmark-excel-fill" />
                    <span>Exporter ({total})</span>
                  </button>
                </div>
              </div>

              {/* ── Filtres ── */}
              <div className="sp-filters">

                <div className="sp-filter-group">
                  <label className="sp-filter-label">Statut</label>
                  <select className="sp-filter-select" value={filterStatut}
                    onChange={(e) => setFilterStatut(e.target.value)}>
                    <option value="">Tous les statuts</option>
                    {STATUTS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="sp-filter-group">
                  <label className="sp-filter-label">Secteur d'activité</label>
                  <select className="sp-filter-select" value={filterSecteur}
                    onChange={(e) => setFilterSecteur(e.target.value)}>
                    <option value="">Tous les secteurs</option>
                    {SECTEURS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="sp-filter-group">
                  <label className="sp-filter-label">Niveau académique</label>
                  <select className="sp-filter-select" value={filterNiveau}
                    onChange={(e) => setFilterNiveau(e.target.value)}>
                    <option value="">Tous les niveaux</option>
                    {NIVEAUX.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="sp-filter-group">
                  <label className="sp-filter-label">Niveau anglais</label>
                  <select className="sp-filter-select" value={filterAnglais}
                    onChange={(e) => setFilterAnglais(e.target.value)}>
                    <option value="">Tous</option>
                    {NIVEAUX_ANGLAIS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="sp-filter-group">
                  <label className="sp-filter-label">Genre</label>
                  <select className="sp-filter-select" value={filterGenre}
                    onChange={(e) => setFilterGenre(e.target.value)}>
                    <option value="">Tous</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                  </select>
                </div>

                <div className="sp-filter-group">
                  <label className="sp-filter-label">Période de dépôt</label>
                  <select className="sp-filter-select" value={filterPeriode}
                    onChange={(e) => setFilterPeriode(e.target.value)}>
                    <option value="">Toutes les périodes</option>
                    <option value="7">7 derniers jours</option>
                    <option value="30">30 derniers jours</option>
                    <option value="90">90 derniers jours</option>
                  </select>
                </div>

                <div className="sp-filter-group">
                  <label className="sp-filter-label">Diplôme joint</label>
                  <select className="sp-filter-select" value={filterDiplome}
                    onChange={(e) => setFilterDiplome(e.target.value)}>
                    <option value="">Tous</option>
                    <option value="oui">Avec diplôme</option>
                    <option value="non">Sans diplôme</option>
                  </select>
                </div>

              </div>{/* /sp-filters */}

              {/* ── Tableau desktop ── */}
              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36, textAlign: "center" }}>
                        <input type="checkbox" className="sp-checkbox"
                          checked={allPageSelected} onChange={toggleSelectAll}
                          title="Tout sélectionner" disabled={loading} />
                      </th>
                      {COLUMNS.map((col) => (
                        <th key={col.key}
                          className={col.sortable ? "sp-th-sortable" : ""}
                          onClick={col.sortable ? () => handleSort(col.key) : undefined}>
                          {col.label}
                          {col.sortable && <SortIcon col={col.key} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <SkeletonRows count={10} cols={COLUMNS.length} />
                    ) : candidatures.length === 0 ? (
                      <tr>
                        <td colSpan={COLUMNS.length + 1}>
                          <div className="sp-empty">
                            <i className="bi bi-inbox" />
                            <p>Aucune candidature trouvée pour ces critères.</p>
                            {hasActiveFilters && (
                              <button className="sp-btn-reset" onClick={resetFilters}>
                                Réinitialiser les filtres
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      candidatures.map((c, idx) => {
                        const avatarColor = getAvatarColor(c.id);
                        return (
                          <tr
                            key={c.id}
                            className={`sp-tr--clickable ${selectedIds.has(c.id) ? "sp-tr--selected" : ""} ${idx % 2 === 0 ? "" : "sp-tr--alt"}`}
                            onClick={() => setSelectedCandidature(c)}>

                            <td style={{ textAlign: "center" }}
                              onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" className="sp-checkbox"
                                checked={selectedIds.has(c.id)}
                                onChange={() => toggleSelect(c.id)} />
                            </td>

                            <td className="sp-td-muted">{c.id}</td>

                            <td>
                              <div className="sp-td-with-avatar">
                                <div className="sp-table-avatar" style={{ background: avatarColor }}>
                                  {getInitiales(c.nom, c.prenoms)}
                                </div>
                                <span className="sp-td-name">{c.nom}</span>
                              </div>
                            </td>

                            <td className="sp-td-muted">{c.prenoms}</td>

                            <td><StatutBadge statut={c.statut} /></td>

                            <td className="sp-td-date">
                              <span className="sp-date-main">
                                {formatDate(c.date_inscription)}
                              </span>
                              <span className="sp-date-relat">
                                {getDelaiDepot(c.date_inscription)}
                              </span>
                            </td>

                            <td className="sp-td-email">{c.email || "—"}</td>
                            <td className="sp-td-muted">{c.tel}</td>

                            <td>
                              <span className={`sp-badge-genre sp-badge-genre--${c.Genre?.toLowerCase()}`}>
                                {c.Genre || "—"}
                              </span>
                            </td>

                            <td className="sp-td-muted sp-td-secteur">{c.Secteur || "—"}</td>
                            <td><span className="sp-badge-niveau">{c.Niveau || "—"}</span></td>

                            <td>
                              <span className={`sp-badge-anglais sp-badge-anglais--${c.Niveau_A}`}>
                                {c.Niveau_A || "—"}
                              </span>
                            </td>

                            <td className="sp-td-muted">{c.commune || "—"}</td>

                            {/* ── Documents ── */}
                            <td onClick={(e) => e.stopPropagation()}>
                              <div className="sp-td-docs">
                                {c.cv_url ? (
                                  <a className="sp-btn-dl sp-btn-dl--cv" href={c.cv_url}
                                    target="_blank" rel="noreferrer" title="Télécharger CV">CV</a>
                                ) : (
                                  <span className="sp-td-doc-missing" title="CV manquant">—</span>
                                )}
                                {c.lettre_url ? (
                                  <a className="sp-btn-dl sp-btn-dl--lettre" href={c.lettre_url}
                                    target="_blank" rel="noreferrer" title="Lettre de motivation">LM</a>
                                ) : (
                                  <span className="sp-td-doc-missing" title="Lettre manquante">—</span>
                                )}
                                {c.diplome_url ? (
                                  <a className="sp-btn-dl sp-btn-dl--diplome" href={c.diplome_url}
                                    target="_blank" rel="noreferrer" title="Copie du diplôme">DIP</a>
                                ) : (
                                  <span className="sp-td-doc-missing" title="Diplôme manquant">—</span>
                                )}
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>{/* /sp-table-wrap */}

              {/* ── Cartes mobile ── */}
              <div className="sp-cards-mobile">
                {loading && (
                  <div style={{ padding: "30px 0", textAlign: "center", color: "#93a4c3" }}>
                    <i className="bi bi-arrow-repeat"
                      style={{ fontSize: 24, animation: "zen-spin 0.8s linear infinite" }} />
                    <style>{`@keyframes zen-spin{to{transform:rotate(360deg);}}`}</style>
                  </div>
                )}
                {!loading && candidatures.length === 0 && (
                  <div className="sp-empty"><p>Aucune candidature trouvée.</p></div>
                )}
                {!loading && candidatures.map(renderCard)}
              </div>

              {/* ── Footer / Pagination ── */}
              <div className="sp-table-footer">
                <span className="sp-footer-info">
                  {loading ? (
                    <span>Chargement…</span>
                  ) : (
                    <>
                      Affichage{" "}
                      <strong>{total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</strong>
                      {" "}à{" "}
                      <strong>{Math.min(page * PAGE_SIZE, total)}</strong>
                      {" "}sur <strong>{total}</strong> candidature{total !== 1 ? "s" : ""}
                      {selectedIds.size > 0 && (
                        <span className="sp-footer-selected">
                          {" "}· {selectedIds.size} sélectionnée(s)
                        </span>
                      )}
                    </>
                  )}
                </span>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onChange={(n) => {
                    setPage(n);
                    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />
              </div>

            </div>{/* /sp-card */}
          </div>{/* /sp-page */}
        </main>
      </div>

      {/* ── Drawer fiche candidature ── */}
      {selectedCandidature && (
        <CandidatureDrawer
          candidature={drawerCandidature}
          onClose={() => setSelectedCandidature(null)}
          onSave={saveMeta}
          saving={saving}
          savedId={savedId}
        />
      )}

      <footer className={`app-footer ${sidebarOpen ? "app-footer--shifted" : ""}`}>
        © 2025 Zenselekt · Propulsé par{" "}
        <strong>Empower talents &amp; careers</strong>. Tous droits réservés
      </footer>
    </div>
  );
}
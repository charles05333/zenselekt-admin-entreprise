import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./css/Spontanees.css";
import Header from "./component/Header";
import Navbar from "./component/Navbar";

// ── Bootstrap Icons ───────────────────────────────────────
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

// ── Debounce hook ─────────────────────────────────────────
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Statuts pipeline ──────────────────────────────────────
const STATUTS = [
  { value: "nouvelle",   label: "Nouvelle",          color: "sp-statut--nouvelle" },
  { value: "en_cours",   label: "En cours d'examen", color: "sp-statut--en_cours" },
  { value: "entretien",  label: "Entretien planifié", color: "sp-statut--entretien" },
  { value: "retenue",    label: "Retenue",            color: "sp-statut--retenue" },
  { value: "refusee",    label: "Refusée",            color: "sp-statut--refusee" },
  { value: "archivee",   label: "Archivée",           color: "sp-statut--archivee" },
];

// ── Données mock ──────────────────────────────────────────
const MOCK_CANDIDATURES = [
  {
    id: 1,
    nom: "KOUASSI", prenoms: "Jean-Marc",
    email: "jm.kouassi@gmail.com", tel: "+225 07 01 23 45",
    tel_whatsapp: "+225 07 01 23 45",
    date_naissance: "1995-06-15", genre: "Homme",
    secteur_activite: "Informatique / Télécoms",
    niveau_academique: "licence", niveau_anglais: "courant",
    commune: "Cocody", quartier: "Riviera 3",
    cv_url: "#", lettre_url: "#", diplome_url: "#",
    statut: "nouvelle", notes: "",
    date_soumission: "2025-01-15T09:30:00",
    source: "spontanée",
  },
  {
    id: 2,
    nom: "BAMBA", prenoms: "Fatoumata",
    email: "f.bamba@yahoo.fr", tel: "+225 05 45 67 89",
    tel_whatsapp: null,
    date_naissance: "1992-03-22", genre: "Femme",
    secteur_activite: "Finance / Comptabilité",
    niveau_academique: "master", niveau_anglais: "moyen",
    commune: "Plateau", quartier: "Centre",
    cv_url: "#", lettre_url: "#", diplome_url: null,
    statut: "en_cours", notes: "Profil intéressant pour le poste DAF",
    date_soumission: "2025-01-14T14:15:00",
    source: "spontanée",
  },
  {
    id: 3,
    nom: "DIARRA", prenoms: "Oumar",
    email: "o.diarra@hotmail.com", tel: "+225 01 02 03 04",
    tel_whatsapp: null,
    date_naissance: "1998-11-08", genre: "Homme",
    secteur_activite: "Commerce / Négoce / Distribution",
    niveau_academique: "bts", niveau_anglais: "faible",
    commune: "Yopougon", quartier: "Selmer",
    cv_url: "#", lettre_url: null, diplome_url: "#",
    statut: "nouvelle", notes: "",
    date_soumission: "2025-01-14T08:00:00",
    source: "spontanée",
  },
  {
    id: 4,
    nom: "N'GUESSAN", prenoms: "Aya Christine",
    email: "a.nguessan@gmail.com", tel: "+225 07 77 88 99",
    tel_whatsapp: "+225 07 77 88 99",
    date_naissance: "1990-01-30", genre: "Femme",
    secteur_activite: "Santé",
    niveau_academique: "ingenieur", niveau_anglais: "bilingue",
    commune: "Marcory", quartier: "Zone 4",
    cv_url: "#", lettre_url: "#", diplome_url: "#",
    statut: "entretien", notes: "Entretien prévu le 20 jan",
    date_soumission: "2025-01-13T11:45:00",
    source: "spontanée",
  },
  {
    id: 5,
    nom: "COULIBALY", prenoms: "Ibrahim",
    email: "i.coulibaly@outlook.com", tel: "+225 05 55 44 33",
    tel_whatsapp: "+225 05 55 44 33",
    date_naissance: "1988-07-19", genre: "Homme",
    secteur_activite: "BTP / Matériaux de construction",
    niveau_academique: "master", niveau_anglais: "courant",
    commune: "Abobo", quartier: "Avocatier",
    cv_url: "#", lettre_url: "#", diplome_url: "#",
    statut: "retenue", notes: "Finaliste poste Directeur Travaux",
    date_soumission: "2025-01-12T16:20:00",
    source: "spontanée",
  },
  {
    id: 6,
    nom: "TRAORÉ", prenoms: "Aminata",
    email: "a.traore@gmail.com", tel: "+225 07 33 22 11",
    tel_whatsapp: null,
    date_naissance: "1985-09-12", genre: "Femme",
    secteur_activite: "Santé",
    niveau_academique: "doctorat", niveau_anglais: "bilingue",
    commune: "Cocody", quartier: "Angré",
    cv_url: "#", lettre_url: "#", diplome_url: "#",
    statut: "refusee", notes: "Prétentions salariales trop élevées",
    date_soumission: "2025-01-11T10:00:00",
    source: "spontanée",
  },
  {
    id: 7,
    nom: "KONÉ", prenoms: "Bakary",
    email: "b.kone@yahoo.fr", tel: "+225 05 11 99 88",
    tel_whatsapp: null,
    date_naissance: "2000-04-05", genre: "Homme",
    secteur_activite: "Transports / Logistique",
    niveau_academique: "bts", niveau_anglais: "moyen",
    commune: "Abobo", quartier: "PK 18",
    cv_url: "#", lettre_url: null, diplome_url: null,
    statut: "archivee", notes: "",
    date_soumission: "2025-01-10T07:30:00",
    source: "spontanée",
  },
  {
    id: 8,
    nom: "YAO", prenoms: "Koffi Serge",
    email: "ks.yao@gmail.com", tel: "+225 07 44 55 66",
    tel_whatsapp: "+225 07 44 55 66",
    date_naissance: "1996-12-25", genre: "Homme",
    secteur_activite: "Informatique / Télécoms",
    niveau_academique: "licence", niveau_anglais: "courant",
    commune: "Adjamé", quartier: "Williamsville",
    cv_url: "#", lettre_url: "#", diplome_url: null,
    statut: "en_cours", notes: "À relancer par email",
    date_soumission: "2025-01-09T13:00:00",
    source: "spontanée",
  },
  {
    id: 9,
    nom: "MEITE", prenoms: "Mariama",
    email: "m.meite@gmail.com", tel: "+225 07 88 11 22",
    tel_whatsapp: "+225 07 88 11 22",
    date_naissance: "1993-08-16", genre: "Femme",
    secteur_activite: "Ressources humaines / Recrutement",
    niveau_academique: "master", niveau_anglais: "bilingue",
    commune: "Cocody", quartier: "Deux Plateaux",
    cv_url: "#", lettre_url: "#", diplome_url: "#",
    statut: "nouvelle", notes: "",
    date_soumission: "2025-01-16T08:55:00",
    source: "spontanée",
  },
  {
    id: 10,
    nom: "SORO", prenoms: "Aboubakar",
    email: "a.soro@outlook.com", tel: "+225 05 22 33 44",
    tel_whatsapp: null,
    date_naissance: "1991-02-14", genre: "Homme",
    secteur_activite: "Banque / Assurance / Microfinance",
    niveau_academique: "master", niveau_anglais: "courant",
    commune: "Plateau", quartier: "Indénié",
    cv_url: "#", lettre_url: null, diplome_url: null,
    statut: "nouvelle", notes: "",
    date_soumission: "2025-01-16T07:10:00",
    source: "spontanée",
  },
];

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
  { value: "cepe",           label: "CEPE (Certificat d'études primaires)" },
  { value: "bepc",           label: "BEPC / Brevet" },
  { value: "cap",            label: "CAP" },
  { value: "bac",            label: "Baccalauréat" },
  { value: "bt",             label: "BT (Brevet de technicien)" },
  { value: "bp",             label: "BP (Brevet professionnel)" },
  { value: "bts",            label: "BTS" },
  { value: "dut",            label: "DUT" },
  { value: "dts",            label: "DTS" },
  { value: "deug",           label: "DEUG / DEUST (Bac +2)" },
  { value: "licence",        label: "Licence / Bachelor (Bac +3)" },
  { value: "licence_pro",    label: "Licence professionnelle (Bac +3)" },
  { value: "master",         label: "Master 1 (Bac +4)" },
  { value: "master2",        label: "Master 2 / DEA / DESS (Bac +5)" },
  { value: "ingenieur",      label: "Diplôme d'ingénieur (Bac +5)" },
  { value: "grandes_ecoles", label: "Grande École (Bac +5)" },
  { value: "doctorat",       label: "Doctorat / PhD (Bac +8)" },
  { value: "autre",          label: "Autre / Non précisé" },
];

const NIVEAUX_ANGLAIS = [
  { value: "faible",   label: "Faible" },
  { value: "moyen",    label: "Moyen" },
  { value: "courant",  label: "Courant" },
  { value: "bilingue", label: "Bilingue" },
];

const PAGE_SIZE = 50;

// ── Helpers ───────────────────────────────────────────────
function getInitiales(nom, prenoms) {
  const n = (nom || "").charAt(0).toUpperCase();
  const p = (prenoms || "").charAt(0).toUpperCase();
  return n + p;
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

function getNiveauLabel(value) {
  const found = NIVEAUX.find(n => n.value === value);
  return found ? found.label : value;
}

// ── Pagination ────────────────────────────────────────────
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
  if (range[0] > 2) pages.push(<span key="el1" className="sp-page-ellipsis">…</span>);
  range.forEach(n =>
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
        <i className="bi bi-chevron-left" /><span className="sp-page-label">Précédent</span>
      </button>
      {pages}
      <button className="sp-page-btn"
        onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
        <span className="sp-page-label">Suivant</span><i className="bi bi-chevron-right" />
      </button>
    </div>
  );
}

// ── Badge statut ──────────────────────────────────────────
function StatutBadge({ statut }) {
  const s = STATUTS.find(x => x.value === statut) || STATUTS[0];
  return <span className={`sp-statut-badge ${s.color}`}>{s.label}</span>;
}

// ── Indicateur documents ──────────────────────────────────
function DocIndicators({ cv_url, lettre_url, diplome_url }) {
  return (
    <div className="sp-doc-indicators">
      <span className={`sp-doc-dot ${cv_url ? "sp-doc-dot--ok" : "sp-doc-dot--missing"}`}
        title={cv_url ? "CV fourni" : "CV manquant"}>CV</span>
      <span className={`sp-doc-dot ${lettre_url ? "sp-doc-dot--ok" : "sp-doc-dot--missing"}`}
        title={lettre_url ? "Lettre fournie" : "Lettre manquante"}>LM</span>
      <span className={`sp-doc-dot ${diplome_url ? "sp-doc-dot--ok" : "sp-doc-dot--missing"}`}
        title={diplome_url ? "Diplôme fourni" : "Diplôme manquant"}>DIP</span>
    </div>
  );
}

// ── Stats rapides ─────────────────────────────────────────
function StatsBar({ candidatures }) {
  const stats = useMemo(() => {
    const total      = candidatures.length;
    const nouvelles  = candidatures.filter(c => c.statut === "nouvelle").length;
    const entretiens = candidatures.filter(c => c.statut === "entretien").length;
    const retenues   = candidatures.filter(c => c.statut === "retenue").length;
    const refusees   = candidatures.filter(c => c.statut === "refusee").length;
    const avecDiplome = candidatures.filter(c => c.diplome_url).length;
    return { total, nouvelles, entretiens, retenues, refusees, avecDiplome };
  }, [candidatures]);

  return (
    <div className="sp-stats-bar">
      <div className="sp-stat-item">
        <span className="sp-stat-value">{stats.total}</span>
        <span className="sp-stat-label">Total</span>
      </div>
      <div className="sp-stat-divider" />
      <div className="sp-stat-item">
        <span className="sp-stat-value sp-stat-value--indigo">{stats.nouvelles}</span>
        <span className="sp-stat-label">Nouvelles</span>
      </div>
      <div className="sp-stat-item">
        <span className="sp-stat-value sp-stat-value--orange">{stats.entretiens}</span>
        <span className="sp-stat-label">Entretiens</span>
      </div>
      <div className="sp-stat-divider" />
      <div className="sp-stat-item">
        <span className="sp-stat-value sp-stat-value--green">{stats.retenues}</span>
        <span className="sp-stat-label">Retenues</span>
      </div>
      <div className="sp-stat-item">
        <span className="sp-stat-value sp-stat-value--red">{stats.refusees}</span>
        <span className="sp-stat-label">Refusées</span>
      </div>
      <div className="sp-stat-divider" />
      <div className="sp-stat-item">
        <span className="sp-stat-value sp-stat-value--purple">{stats.avecDiplome}</span>
        <span className="sp-stat-label">Avec diplôme</span>
      </div>
    </div>
  );
}

// ── Barre d'actions groupées ──────────────────────────────
function BulkActionBar({ count, onStatut, onExport, onClear }) {
  const [statutOpen, setStatutOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setStatutOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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
          <button className="sp-bulk-btn" onClick={() => setStatutOpen(p => !p)}>
            <i className="bi bi-kanban" /> Changer statut
            <i className="bi bi-chevron-down" style={{ fontSize: 10 }} />
          </button>
          {statutOpen && (
            <div className="sp-bulk-dropdown">
              {STATUTS.map(s => (
                <button key={s.value} className="sp-bulk-dropdown-item"
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

// ── Export Excel ──────────────────────────────────────────
function exportExcel(candidatures) {
  const XLSX_CDN = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
  const doExport = () => {
    const XLSX = window.XLSX;
    const wb = XLSX.utils.book_new();
    const headers = [
      "Id", "Nom", "Prénom(s)", "Email", "Téléphone", "WhatsApp",
      "Date naissance", "Âge", "Genre",
      "Secteur d'activité", "Niveau académique", "Niveau anglais",
      "Commune", "Quartier", "Statut", "Notes",
      "Date de soumission", "CV", "Lettre", "Diplôme",
    ];
    const rows = candidatures.map(c => [
      c.id, c.nom, c.prenoms, c.email, c.tel,
      c.tel_whatsapp || "-",
      c.date_naissance, calcAge(c.date_naissance), c.genre,
      c.secteur_activite,
      getNiveauLabel(c.niveau_academique),
      c.niveau_anglais,
      c.commune, c.quartier,
      STATUTS.find(s => s.value === c.statut)?.label || c.statut,
      c.notes || "",
      formatDateTime(c.date_soumission),
      c.cv_url      ? "Oui" : "Non",
      c.lettre_url  ? "Oui" : "Non",
      c.diplome_url ? "Oui" : "Non",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, "Candidatures spontanées");
    XLSX.writeFile(wb, "candidatures_spontanees_zenselekt.xlsx", { cellStyles: true });
  };
  if (window.XLSX) doExport();
  else {
    const s = document.createElement("script");
    s.src = XLSX_CDN;
    s.onload = doExport;
    document.head.appendChild(s);
  }
}

// ── Drawer fiche candidature ──────────────────────────────
function CandidatureDrawer({ candidature, onClose, onUpdate }) {
  const [notes, setNotes]   = useState(candidature?.notes || "");
  const [statut, setStatut] = useState(candidature?.statut || "nouvelle");
  const [saved, setSaved]   = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (candidature) {
      setNotes(candidature.notes || "");
      setStatut(candidature.statut || "nouvelle");
      setSaved(false);
    }
  }, [candidature]);

  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
    };
    if (candidature) {
      setTimeout(() => document.addEventListener("mousedown", handler), 100);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [candidature, onClose]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleSave() {
    onUpdate(candidature.id, { notes, statut });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!candidature) return null;
  const avatarColor = getAvatarColor(candidature.id);
  const docsCount = [candidature.cv_url, candidature.lettre_url, candidature.diplome_url]
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
              {formatDateTime(candidature.date_soumission)}
              <span className="sp-drawer-delai">· {getDelaiDepot(candidature.date_soumission)}</span>
            </div>
          </div>
          <button className="sp-drawer-close" onClick={onClose} title="Fermer">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="sp-drawer-body">

          {/* ── Statut pipeline ── */}
          <div className="sp-drawer-section">
            <div className="sp-drawer-section-title">STATUT PIPELINE</div>
            <div className="sp-statut-selector">
              {STATUTS.map(s => (
                <button key={s.value}
                  className={`sp-statut-btn ${s.color}${statut === s.value ? " active" : ""}`}
                  onClick={() => setStatut(s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Coordonnées ── */}
          <div className="sp-drawer-section">
            <div className="sp-drawer-section-title">COORDONNÉES</div>
            <div className="sp-drawer-grid">
              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">Téléphone</span>
                <a href={`tel:${candidature.tel}`} className="sp-drawer-link">
                  {candidature.tel}
                </a>
              </div>
              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">WhatsApp</span>
                {candidature.tel_whatsapp ? (
                  <a
                    href={`https://wa.me/${candidature.tel_whatsapp.replace(/\s/g, "").replace("+", "")}`}
                    className="sp-drawer-link sp-drawer-link--wa"
                    target="_blank" rel="noreferrer">
                    {candidature.tel_whatsapp}
                  </a>
                ) : (
                  <span className="sp-td-muted">—</span>
                )}
              </div>
              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">Genre</span>
                <span className={`sp-badge-genre sp-badge-genre--${candidature.genre.toLowerCase()}`}>
                  {candidature.genre}
                </span>
              </div>
              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">Date de naissance</span>
                <span>
                  {formatDate(candidature.date_naissance)}
                  <em className="sp-drawer-age"> · {calcAge(candidature.date_naissance)}</em>
                </span>
              </div>
              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">Commune</span>
                <span>{candidature.commune || "—"}</span>
              </div>
              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">Quartier</span>
                <span>{candidature.quartier || "—"}</span>
              </div>
            </div>
          </div>

          {/* ── Profil professionnel ── */}
          <div className="sp-drawer-section">
            <div className="sp-drawer-section-title">PROFIL PROFESSIONNEL</div>
            <div className="sp-drawer-grid">
              <div className="sp-drawer-field sp-drawer-field--full">
                <span className="sp-drawer-field-label">Secteur d'activité</span>
                <span>{candidature.secteur_activite}</span>
              </div>
              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">Niveau académique</span>
                <span className="sp-badge-niveau">{candidature.niveau_academique}</span>
              </div>
              <div className="sp-drawer-field">
                <span className="sp-drawer-field-label">Niveau anglais</span>
                <span className={`sp-badge-anglais sp-badge-anglais--${candidature.niveau_anglais}`}>
                  {candidature.niveau_anglais}
                </span>
              </div>
            </div>
          </div>

          {/* ── Documents fournis ── */}
          <div className="sp-drawer-section">
            <div className="sp-drawer-section-title">
              DOCUMENTS FOURNIS
              <span className="sp-drawer-doc-count">{docsCount}/3</span>
            </div>
            <div className="sp-drawer-docs">
              {candidature.cv_url ? (
                <a className="sp-btn-dl sp-btn-dl--cv" href={candidature.cv_url}
                  target="_blank" rel="noreferrer">
                  Télécharger CV
                </a>
              ) : (
                <span className="sp-doc-missing">CV non fourni</span>
              )}
              {candidature.lettre_url ? (
                <a className="sp-btn-dl sp-btn-dl--lettre" href={candidature.lettre_url}
                  target="_blank" rel="noreferrer">
                  Lettre de motivation
                </a>
              ) : (
                <span className="sp-doc-missing">Lettre non fournie</span>
              )}
              {candidature.diplome_url ? (
                <a className="sp-btn-dl sp-btn-dl--diplome" href={candidature.diplome_url}
                  target="_blank" rel="noreferrer">
                  Copie du diplôme
                </a>
              ) : (
                <span className="sp-doc-missing">Diplôme non fourni</span>
              )}
            </div>
          </div>

          {/* ── Notes recruteur ── */}
          <div className="sp-drawer-section">
            <div className="sp-drawer-section-title">NOTES RECRUTEUR</div>
            <textarea
              className="sp-drawer-notes"
              placeholder="Ajoutez vos observations, retours d'entretien…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
            />
          </div>

        </div>

        {/* ── Footer actions ── */}
        <div className="sp-drawer-footer">
          <a href={`mailto:${candidature.email}`}
            className="sp-btn-action sp-btn-action--email">
            Envoyer un email
          </a>
          <a
            href={`https://wa.me/${(candidature.tel_whatsapp || candidature.tel).replace(/\s/g, "").replace("+", "")}`}
            className="sp-btn-action sp-btn-action--whatsapp"
            target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <button
            className={`sp-btn-action sp-btn-action--save${saved ? " saved" : ""}`}
            onClick={handleSave}>
            {saved ? "Sauvegardé !" : "Sauvegarder"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function CandidaturesSpontanees() {
  useBootstrapIcons();

  // Responsive
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const isMobile = width <= 600;
  const [sidebarOpen, setSidebarOpen] = useState(width > 768);
  useEffect(() => { if (width <= 768) setSidebarOpen(false); }, [width]);

  // Données
  const [candidatures, setCandidatures] = useState(MOCK_CANDIDATURES);

  // Drawer
  const [selectedCandidature, setSelectedCandidature] = useState(null);

  const updateCandidature = useCallback((id, updates) => {
    setCandidatures(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  // Recherche
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounce(searchRaw, 250);

  // Filtres
  const [filterSecteur,  setFilterSecteur]  = useState("");
  const [filterNiveau,   setFilterNiveau]   = useState("");
  const [filterAnglais,  setFilterAnglais]  = useState("");
  const [filterGenre,    setFilterGenre]    = useState("");
  const [filterStatut,   setFilterStatut]   = useState("");
  const [filterPeriode,  setFilterPeriode]  = useState("");
  const [filterDiplome,  setFilterDiplome]  = useState("");

  // Tri
  const [sortCol, setSortCol] = useState("date_soumission");
  const [sortDir, setSortDir] = useState("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const tableRef = useRef(null);

  // Sélection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Reset page sur filtre
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [search, filterSecteur, filterNiveau, filterAnglais, filterGenre,
      filterStatut, filterPeriode, filterDiplome]);

  // Filtre + tri
  const filtered = useMemo(() => {
    const now = new Date();
    let list = candidatures.filter(c => {
      const q = search.toLowerCase();
      const ms = !q || `${c.nom} ${c.prenoms} ${c.email} ${c.secteur_activite}`.toLowerCase().includes(q);
      const mSec  = !filterSecteur  || c.secteur_activite === filterSecteur;
      const mNiv  = !filterNiveau   || c.niveau_academique === filterNiveau;
      const mAng  = !filterAnglais  || c.niveau_anglais === filterAnglais;
      const mGen  = !filterGenre    || c.genre.toLowerCase() === filterGenre;
      const mStat = !filterStatut   || c.statut === filterStatut;
      const mDip  = !filterDiplome
        || (filterDiplome === "oui" && c.diplome_url)
        || (filterDiplome === "non" && !c.diplome_url);
      let mPer = true;
      if (filterPeriode) {
        const d = new Date(c.date_soumission);
        const diffDays = (now - d) / (1000 * 60 * 60 * 24);
        if (filterPeriode === "7")  mPer = diffDays <= 7;
        if (filterPeriode === "30") mPer = diffDays <= 30;
        if (filterPeriode === "90") mPer = diffDays <= 90;
      }
      return ms && mSec && mNiv && mAng && mGen && mStat && mDip && mPer;
    });
    list = [...list].sort((a, b) => {
      const av = a[sortCol] ?? "";
      const bv = b[sortCol] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [candidatures, search, filterSecteur, filterNiveau, filterAnglais,
      filterGenre, filterStatut, filterPeriode, filterDiplome, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return <i className="bi bi-chevron-expand sp-sort-icon" />;
    return sortDir === "asc"
      ? <i className="bi bi-chevron-up sp-sort-icon sp-sort-icon--active" />
      : <i className="bi bi-chevron-down sp-sort-icon sp-sort-icon--active" />;
  }

  // Sélection
  const allPageSelected = paginated.length > 0 && paginated.every(c => selectedIds.has(c.id));

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allPageSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map(c => c.id)));
  }

  function bulkChangeStatut(statut) {
    setCandidatures(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, statut } : c));
  }

  function resetFilters() {
    setSearchRaw("");
    setFilterSecteur("");
    setFilterNiveau("");
    setFilterAnglais("");
    setFilterGenre("");
    setFilterStatut("");
    setFilterPeriode("");
    setFilterDiplome("");
  }

  const hasActiveFilters = searchRaw || filterSecteur || filterNiveau || filterAnglais
    || filterGenre || filterStatut || filterPeriode || filterDiplome;

  // ── Colonnes tableau ──────────────────────────────────────
  const COLUMNS = [
    { key: "id",                label: "Id",        sortable: true },
    { key: "nom",               label: "Nom",       sortable: true },
    { key: "prenoms",           label: "Prénom(s)", sortable: true },
    { key: "statut",            label: "Statut",    sortable: true },
    { key: "date_soumission",   label: "Soumis le", sortable: true },
    { key: "email",             label: "Email",     sortable: true },
    { key: "tel",               label: "Téléphone", sortable: false },
    { key: "genre",             label: "Genre",     sortable: true },
    { key: "secteur_activite",  label: "Secteur",   sortable: true },
    { key: "niveau_academique", label: "Niveau",    sortable: true },
    { key: "niveau_anglais",    label: "Anglais",   sortable: true },
    { key: "commune",           label: "Commune",   sortable: true },
    { key: "_docs",             label: "Documents", sortable: false },
  ];

  // ── Rendu carte mobile ────────────────────────────────────
  function renderCard(c) {
    const avatarColor = getAvatarColor(c.id);
    return (
      <div key={c.id} className="sp-mobile-card" onClick={() => setSelectedCandidature(c)}>
        <div className="sp-mobile-card__header">
          <label className="sp-mobile-card__check" onClick={e => e.stopPropagation()}>
            <input type="checkbox" className="sp-checkbox"
              checked={selectedIds.has(c.id)}
              onChange={() => toggleSelect(c.id)} />
            <div className="sp-mobile-avatar" style={{ background: avatarColor }}>
              {getInitiales(c.nom, c.prenoms)}
            </div>
            <div>
              <div className="sp-mobile-card__name">{c.prenoms} {c.nom}</div>
              <div className="sp-mobile-card__email">{c.email}</div>
              <div className="sp-mobile-card__date">
                {getDelaiDepot(c.date_soumission)}
              </div>
            </div>
          </label>
          <StatutBadge statut={c.statut} />
        </div>
        <div className="sp-mobile-card__grid">
          <div className="sp-mobile-card__item">
            <span className="sp-mobile-card__label">Secteur</span>
            <span className="sp-mobile-card__value">{c.secteur_activite}</span>
          </div>
          <div className="sp-mobile-card__item">
            <span className="sp-mobile-card__label">Niveau</span>
            <span className="sp-badge-niveau">{c.niveau_academique}</span>
          </div>
          <div className="sp-mobile-card__item">
            <span className="sp-mobile-card__label">Commune</span>
            <span className="sp-mobile-card__value">{c.commune || "—"}</span>
          </div>
          <div className="sp-mobile-card__item">
            <span className="sp-mobile-card__label">Anglais</span>
            <span className={`sp-badge-anglais sp-badge-anglais--${c.niveau_anglais}`}>
              {c.niveau_anglais}
            </span>
          </div>
          <div className="sp-mobile-card__item sp-mobile-card__item--full">
            <span className="sp-mobile-card__label">Documents</span>
            <DocIndicators cv_url={c.cv_url} lettre_url={c.lettre_url} diplome_url={c.diplome_url} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(p => !p)}
        isMobile={isMobile}
      />
      <div className="layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>
          <div className="sp-page">

            {/* ── Titre ── */}
            <div className="sp-breadcrumb">
              <h1>Gestion des candidatures spontanées</h1>
              <p>
                 <a href="/acceuil">Bienvenue solibra</a>{" / "}
                <strong>Candidatures spontanées</strong>
              </p>

                   
            </div>

            {/* ── Stats rapides ── */}
            <StatsBar candidatures={filtered} />

            {/* ── Barre actions groupées ── */}
            <BulkActionBar
              count={selectedIds.size}
              onStatut={bulkChangeStatut}
              onExport={() => exportExcel(candidatures.filter(c => selectedIds.has(c.id)))}
              onClear={() => setSelectedIds(new Set())}
            />

            <div className="sp-card" ref={tableRef}>

              {/* ── Toolbar ── */}
              <div className="sp-toolbar">
                <div className="sp-search">
                  <i className="bi bi-search" />
                  <input
                    value={searchRaw}
                    onChange={e => setSearchRaw(e.target.value)}
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
                  <button className="sp-btn-export"
                    onClick={() => exportExcel(filtered)}
                    title={`Exporter ${filtered.length} candidature(s)`}>
                    <i className="bi bi-file-earmark-excel-fill" />
                    <span>Exporter ({filtered.length})</span>
                  </button>
                </div>
              </div>

              {/* ── Filtres ── */}
              <div className="sp-filters">
                <div className="sp-filter-group">
                  <label className="sp-filter-label">Statut</label>
                  <select className="sp-filter-select" value={filterStatut}
                    onChange={e => setFilterStatut(e.target.value)}>
                    <option value="">Tous les statuts</option>
                    {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                <div className="sp-filter-group">
                  <label className="sp-filter-label">Secteur d'activité</label>
                  <select className="sp-filter-select" value={filterSecteur}
                    onChange={e => setFilterSecteur(e.target.value)}>
                    <option value="">Tous les secteurs</option>
                    {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="sp-filter-group">
                  <label className="sp-filter-label">Niveau académique</label>
                  <select className="sp-filter-select" value={filterNiveau}
                    onChange={e => setFilterNiveau(e.target.value)}>
                    <option value="">Tous les niveaux</option>
                    {NIVEAUX.map(({ value, label }) =>
                      <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>

                <div className="sp-filter-group">
                  <label className="sp-filter-label">Niveau anglais</label>
                  <select className="sp-filter-select" value={filterAnglais}
                    onChange={e => setFilterAnglais(e.target.value)}>
                    <option value="">Tous</option>
                    {NIVEAUX_ANGLAIS.map(({ value, label }) =>
                      <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>

                <div className="sp-filter-group">
                  <label className="sp-filter-label">Genre</label>
                  <select className="sp-filter-select" value={filterGenre}
                    onChange={e => setFilterGenre(e.target.value)}>
                    <option value="">Tous</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                  </select>
                </div>

                <div className="sp-filter-group">
                  <label className="sp-filter-label">Période de dépôt</label>
                  <select className="sp-filter-select" value={filterPeriode}
                    onChange={e => setFilterPeriode(e.target.value)}>
                    <option value="">Toutes les périodes</option>
                    <option value="7">7 derniers jours</option>
                    <option value="30">30 derniers jours</option>
                    <option value="90">90 derniers jours</option>
                  </select>
                </div>

                <div className="sp-filter-group">
                  <label className="sp-filter-label">Diplôme joint</label>
                  <select className="sp-filter-select" value={filterDiplome}
                    onChange={e => setFilterDiplome(e.target.value)}>
                    <option value="">Tous</option>
                    <option value="oui">Avec diplôme</option>
                    <option value="non">Sans diplôme</option>
                  </select>
                </div>
              </div>

              {/* ── Tableau desktop ── */}
              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36, textAlign: "center" }}>
                        <input type="checkbox" className="sp-checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectAll}
                          title="Tout sélectionner" />
                      </th>
                      {COLUMNS.map(col => (
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
                    {paginated.length === 0 && (
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
                    )}
                    {paginated.map((c, idx) => {
                      const avatarColor = getAvatarColor(c.id);
                      return (
                        <tr key={c.id}
                          className={`sp-tr--clickable ${selectedIds.has(c.id) ? "sp-tr--selected" : ""} ${idx % 2 === 0 ? "" : "sp-tr--alt"}`}
                          onClick={() => setSelectedCandidature(c)}>
                          <td style={{ textAlign: "center" }} onClick={e => e.stopPropagation()}>
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
                            <span className="sp-date-main">{formatDate(c.date_soumission)}</span>
                            <span className="sp-date-relat">{getDelaiDepot(c.date_soumission)}</span>
                          </td>
                          <td className="sp-td-email">{c.email}</td>
                          <td className="sp-td-muted">{c.tel}</td>
                          <td>
                            <span className={`sp-badge-genre sp-badge-genre--${c.genre.toLowerCase()}`}>
                              {c.genre}
                            </span>
                          </td>
                          <td className="sp-td-muted sp-td-secteur">{c.secteur_activite}</td>
                          <td><span className="sp-badge-niveau">{c.niveau_academique}</span></td>
                          <td>
                            <span className={`sp-badge-anglais sp-badge-anglais--${c.niveau_anglais}`}>
                              {c.niveau_anglais}
                            </span>
                          </td>
                          <td className="sp-td-muted">{c.commune || "—"}</td>

                          {/* ── Colonne Documents ── */}
                          <td onClick={e => e.stopPropagation()}>
                            <div className="sp-td-docs">
                              {c.cv_url ? (
                                <a className="sp-btn-dl sp-btn-dl--cv" href={c.cv_url}
                                  target="_blank" rel="noreferrer" title="Télécharger CV">
                                  CV
                                </a>
                              ) : (
                                <span className="sp-td-doc-missing" title="CV manquant">—</span>
                              )}
                              {c.lettre_url ? (
                                <a className="sp-btn-dl sp-btn-dl--lettre" href={c.lettre_url}
                                  target="_blank" rel="noreferrer" title="Lettre de motivation">
                                  LM
                                </a>
                              ) : (
                                <span className="sp-td-doc-missing" title="Lettre manquante">—</span>
                              )}
                              {c.diplome_url ? (
                                <a className="sp-btn-dl sp-btn-dl--diplome" href={c.diplome_url}
                                  target="_blank" rel="noreferrer" title="Copie du diplôme">
                                  DIP
                                </a>
                              ) : (
                                <span className="sp-td-doc-missing" title="Diplôme manquant">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Cartes mobile ── */}
              <div className="sp-cards-mobile">
                {paginated.length === 0 && (
                  <div className="sp-empty">
                    <p>Aucune candidature trouvée.</p>
                  </div>
                )}
                {paginated.map(renderCard)}
              </div>

              {/* ── Footer / Pagination ── */}
              <div className="sp-table-footer">
                <span className="sp-footer-info">
                  Affichage{" "}
                  <strong>{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</strong>
                  {" "}à{" "}
                  <strong>{Math.min(page * PAGE_SIZE, filtered.length)}</strong>
                  {" "}sur <strong>{filtered.length}</strong>
                  {" "}candidature{filtered.length !== 1 ? "s" : ""}
                  {selectedIds.size > 0 && (
                    <span className="sp-footer-selected"> · {selectedIds.size} sélectionnée(s)</span>
                  )}
                </span>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onChange={n => {
                    setPage(n);
                    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Drawer fiche candidature ── */}
      {selectedCandidature && (
        <CandidatureDrawer
          candidature={candidatures.find(c => c.id === selectedCandidature.id)}
          onClose={() => setSelectedCandidature(null)}
          onUpdate={updateCandidature}
        />
      )}

      <footer className={`app-footer ${sidebarOpen ? "app-footer--shifted" : ""}`}>
        © 2025 Zenselekt · Propulsé par{" "}
        <strong>Empower talents &amp; careers</strong>. Tous droits réservés
      </footer>
    </div>
  );
}
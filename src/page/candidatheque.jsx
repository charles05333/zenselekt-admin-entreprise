import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./css/Candidatheque.css";
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
  { value: "nouveau",   label: "Nouveau",           color: "statut--nouveau" },
  { value: "contact",   label: "À contacter",       color: "statut--contact" },
  { value: "entretien", label: "Entretien planifié", color: "statut--entretien" },
  { value: "retenu",    label: "Retenu",             color: "statut--retenu" },
  { value: "refuse",    label: "Refusé",             color: "statut--refuse" },
  { value: "archive",   label: "Archivé",            color: "statut--archive" },
];

// ── Données mock ──────────────────────────────────────────
const MOCK_CANDIDATS = [
  {
    id: 1, nom: "KOUASSI", prenoms: "Jean-Marc",
    email: "jm.kouassi@gmail.com", tel: "+225 07 01 23 45", telwhat: "+225 07 01 23 45",
    Niveau: "licence", Niveau_A: "courant", Secteur: "Informatique / Télécoms",
    Genre: "Homme", Pays_N: "Côte d'Ivoire", Pays_R: "Côte d'Ivoire",
    Commune: "Cocody", Quartier: "Riviera 3", Situation_M: "Célibataire", Nombre_E: 0,
    cv_url: "#", lettre_url: "#", diplomes: ["#"],
    statut: "nouveau", notes: "", tags: ["React", "Node.js"],
    date_ajout: "2025-01-10",
  },
  {
    id: 2, nom: "BAMBA", prenoms: "Fatoumata",
    email: "f.bamba@yahoo.fr", tel: "+225 05 45 67 89", telwhat: "+225 05 45 67 89",
    Niveau: "master", Niveau_A: "moyen", Secteur: "Finance / Comptabilité",
    Genre: "Femme", Pays_N: "Côte d'Ivoire", Pays_R: "Côte d'Ivoire",
    Commune: "Plateau", Quartier: "Centre", Situation_M: "Mariée", Nombre_E: 2,
    cv_url: "#", lettre_url: "#", diplomes: ["#", "#"],
    statut: "contact", notes: "Profil intéressant pour le poste DAF", tags: ["Finance", "SAP"],
    date_ajout: "2025-01-12",
  },
  {
    id: 3, nom: "DIARRA", prenoms: "Oumar",
    email: "o.diarra@hotmail.com", tel: "+225 01 02 03 04", telwhat: "+225 01 02 03 04",
    Niveau: "bts", Niveau_A: "faible", Secteur: "Commerce / Négoce / Distribution",
    Genre: "Homme", Pays_N: "Mali", Pays_R: "Côte d'Ivoire",
    Commune: "Yopougon", Quartier: "Selmer", Situation_M: "Célibataire", Nombre_E: 0,
    cv_url: "#", lettre_url: null, diplomes: [],
    statut: "nouveau", notes: "", tags: [],
    date_ajout: "2025-01-14",
  },
  {
    id: 4, nom: "N'GUESSAN", prenoms: "Aya Christine",
    email: "a.nguessan@gmail.com", tel: "+225 07 77 88 99", telwhat: "+225 07 77 88 99",
    Niveau: "ingenieur", Niveau_A: "bilingue", Secteur: "Santé",
    Genre: "Femme", Pays_N: "Côte d'Ivoire", Pays_R: "Côte d'Ivoire",
    Commune: "Marcory", Quartier: "Zone 4", Situation_M: "Célibataire", Nombre_E: 0,
    cv_url: "#", lettre_url: "#", diplomes: ["#"],
    statut: "entretien", notes: "Entretien prévu le 20 jan", tags: ["Bilingue", "Santé publique"],
    date_ajout: "2025-01-08",
  },
  {
    id: 5, nom: "COULIBALY", prenoms: "Ibrahim",
    email: "i.coulibaly@outlook.com", tel: "+225 05 55 44 33", telwhat: "+225 05 55 44 33",
    Niveau: "master", Niveau_A: "courant", Secteur: "BTP / Matériaux de construction",
    Genre: "Homme", Pays_N: "Côte d'Ivoire", Pays_R: "Côte d'Ivoire",
    Commune: "Abobo", Quartier: "Avocatier", Situation_M: "Marié", Nombre_E: 3,
    cv_url: "#", lettre_url: "#", diplomes: ["#"],
    statut: "retenu", notes: "Finaliste poste Directeur Travaux", tags: ["BTP", "Génie civil"],
    date_ajout: "2025-01-05",
  },
  {
    id: 6, nom: "TRAORÉ", prenoms: "Aminata",
    email: "a.traore@gmail.com", tel: "+225 07 33 22 11", telwhat: "+225 07 33 22 11",
    Niveau: "doctorat", Niveau_A: "bilingue", Secteur: "Santé",
    Genre: "Femme", Pays_N: "Guinée", Pays_R: "Côte d'Ivoire",
    Commune: "Cocody", Quartier: "Angré", Situation_M: "Mariée", Nombre_E: 1,
    cv_url: "#", lettre_url: "#", diplomes: ["#"],
    statut: "refuse", notes: "Prétentions salariales trop élevées", tags: ["Recherche", "Épidémiologie"],
    date_ajout: "2025-01-03",
  },
  {
    id: 7, nom: "KONÉ", prenoms: "Bakary",
    email: "b.kone@yahoo.fr", tel: "+225 05 11 99 88", telwhat: "+225 05 11 99 88",
    Niveau: "bts", Niveau_A: "moyen", Secteur: "Transports / Logistique",
    Genre: "Homme", Pays_N: "Côte d'Ivoire", Pays_R: "Côte d'Ivoire",
    Commune: "Abobo", Quartier: "PK 18", Situation_M: "Célibataire", Nombre_E: 0,
    cv_url: "#", lettre_url: null, diplomes: ["#"],
    statut: "archive", notes: "", tags: ["Logistique", "Transport"],
    date_ajout: "2024-12-20",
  },
  {
    id: 8, nom: "YAO", prenoms: "Koffi Serge",
    email: "ks.yao@gmail.com", tel: "+225 07 44 55 66", telwhat: "+225 07 44 55 66",
    Niveau: "licence", Niveau_A: "courant", Secteur: "Informatique / Télécoms",
    Genre: "Homme", Pays_N: "Côte d'Ivoire", Pays_R: "Côte d'Ivoire",
    Commune: "Adjamé", Quartier: "Williamsville", Situation_M: "Célibataire", Nombre_E: 0,
    cv_url: "#", lettre_url: "#", diplomes: ["#"],
    statut: "contact", notes: "À relancer par email", tags: ["JavaScript", "Vue.js"],
    date_ajout: "2025-01-15",
  },
];

const SECTEURS = [
  "Agriculture / Élevage / Pêche", "Agroalimentaire", "Architecture / Urbanisme / Design",
  "Art / Culture / Spectacle", "Artisanat / Métiers manuels", "Audit / Expertise comptable",
  "Bailleur / Organisme international", "Banque / Assurance / Microfinance",
  "Bois / Papier / Carton / Imprimerie", "BTP / Matériaux de construction",
  "Chimie / Parachimie", "Commerce / Négoce / Distribution",
  "Communication / Marketing / Publicité", "Droit / Juridique / Notariat",
  "Économie / Statistiques / Recherche", "Édition / Multimédia / Presse",
  "Education / Formation / Enseignement", "Électronique / Électricité / Énergie",
  "Environnement / Développement durable", "Études et conseils / Consulting",
  "Finance / Comptabilité / Gestion", "Hôtellerie / Restauration / Tourisme",
  "Humanitaire / ONG / Associatif", "Immobilier / Foncier",
  "Industrie pharmaceutique", "Informatique / Télécoms / Numérique",
  "Machines et équipements / Automobile", "Management / Direction générale",
  "Mines / Pétrole / Énergie", "Métallurgie / Travail du métal",
  "Plastique / Caoutchouc", "Ressources humaines / Recrutement",
  "Santé / Médical / Paramédical", "Sécurité / Défense / Gardiennage",
  "Services aux entreprises / Facilities", "Sport / Bien-être / Loisirs",
  "Textile / Habillement / Chaussure", "Transports / Logistique / Supply Chain",
  "Autre / Non classifié",
];

const COMMUNES = [
  "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", "Marcory", "Plateau",
  "Port-Bouët", "Treichville", "Yopougon", "Aboisso", "Adzopé", "Agboville",
  "Bouaké", "Bondoukou", "Dabou", "Daloa", "Daoukro", "Dimbokro", "Divo",
  "Ferkessédougou", "Gagnoa", "Grand-Bassam", "Guiglo", "Issia", "Jacqueville",
  "Katiola", "Korhogo", "Man", "Minignan", "Odienné", "San-Pédro", "Sassandra",
  "Séguéla", "Soubré", "Tabou", "Toumodi", "Yamoussoukro",
  "Autres / Hors Côte d'Ivoire",
];

const NIVEAUX = [
  { value: "cepe", label: "CEPE (Certificat d'études primaires)" },
  { value: "bepc", label: "BEPC / Brevet" },
  { value: "cap", label: "CAP" },
  { value: "bac", label: "Baccalauréat" },
  { value: "bt", label: "BT (Brevet de technicien)" },
  { value: "bp", label: "BP (Brevet professionnel)" },
  { value: "bts", label: "BTS" },
  { value: "dut", label: "DUT" },
  { value: "dts", label: "DTS" },
  { value: "deug", label: "DEUG / DEUST (Bac +2)" },
  { value: "licence", label: "Licence / Bachelor (Bac +3)" },
  { value: "licence_pro", label: "Licence professionnelle (Bac +3)" },
  { value: "master", label: "Master 1 (Bac +4)" },
  { value: "master2", label: "Master 2 / DEA / DESS (Bac +5)" },
  { value: "ingenieur", label: "Diplôme d'ingénieur (Bac +5)" },
  { value: "grandes_ecoles", label: "Grande École (Bac +5)" },
  { value: "doctorat", label: "Doctorat / PhD (Bac +8)" },
  { value: "autre", label: "Autre / Non précisé" },
];

const NIVEAUX_ANGLAIS = [
  { value: "faible", label: "Faible" },
  { value: "moyen", label: "Moyen" },
  { value: "courant", label: "Courant" },
  { value: "bilingue", label: "Bilingue" },
];

const PAGE_SIZE = 50;

// ── Initiales avatar ──────────────────────────────────────
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

// ── Autocomplétion quartier ───────────────────────────────
function QuartierAutocomplete({ value, onChange, commune }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function search(q) {
    if (!q || q.length < 2 || !commune) return;
    setLoading(true);
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
        q + " " + commune + " Abidjan"
      )}&limit=10&lang=fr&lat=5.36&lon=-4.01`;
      const res = await fetch(url);
      const data = await res.json();
      const unique = [];
      const seen = new Set();
      (data.features || []).forEach((f) => {
        const name = f.properties.name || f.properties.street || "";
        if (name.length > 1 && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          unique.push(name);
        }
      });
      setSuggestions(unique.slice(0, 8));
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleInput(e) {
    onChange(e.target.value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(e.target.value), 400);
  }

  return (
    <div className="cand-autocomplete" ref={ref}>
      <input
        className="cand-filter-select"
        type="text"
        placeholder="Tapez un quartier..."
        value={value}
        onChange={handleInput}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        disabled={!commune}
      />
      {loading && (
        <div className="cand-autocomplete-spinner">
          <i className="bi bi-arrow-repeat" />
        </div>
      )}
      {open && suggestions.length > 0 && (
        <div className="cand-autocomplete-list">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="cand-autocomplete-item"
              onClick={() => { onChange(s); setOpen(false); }}
            >
              <i className="bi bi-geo-alt" /> {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Export Excel ──────────────────────────────────────────
function exportExcel(candidats) {
  const XLSX_CDN = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
  const doExport = () => {
    const XLSX = window.XLSX;
    const wb = XLSX.utils.book_new();
    const headers = [
      "Id", "Nom", "Prénom(s)", "Email", "Téléphone", "WhatsApp",
      "Niveau académique", "Niveau anglais", "Secteur", "Genre",
      "Pays nationalité", "Pays résidence", "Commune", "Quartier",
      "Sit. Matrimoniale", "Nbre enfants", "Statut pipeline",
      "Tags", "Notes", "CV", "Lettre", "Diplômes",
    ];
    const rows = candidats.map((c) => [
      c.id, c.nom, c.prenoms, c.email, c.tel, c.telwhat,
      c.Niveau, c.Niveau_A, c.Secteur, c.Genre,
      c.Pays_N, c.Pays_R, c.Commune, c.Quartier,
      c.Situation_M, c.Nombre_E,
      STATUTS.find(s => s.value === c.statut)?.label || c.statut,
      (c.tags || []).join(", "),
      c.notes || "",
      c.cv_url || "-", c.lettre_url || "-",
      (c.diplomes || []).join(" | ") || "-",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, "Candidats");
    XLSX.writeFile(wb, "candidatheque_zenselekt.xlsx", { cellStyles: true });
  };
  if (window.XLSX) doExport();
  else {
    const s = document.createElement("script");
    s.src = XLSX_CDN;
    s.onload = doExport;
    document.head.appendChild(s);
  }
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
    <button key={1} className={`cand-page-num${page === 1 ? " cand-page-num--active" : ""}`} onClick={() => onChange(1)}>1</button>
  );
  if (range[0] > 2) pages.push(<span key="el1" className="cand-page-ellipsis">…</span>);
  range.forEach((n) =>
    pages.push(
      <button key={n} className={`cand-page-num${page === n ? " cand-page-num--active" : ""}`} onClick={() => onChange(n)}>{n}</button>
    )
  );
  if (range[range.length - 1] < totalPages - 1) pages.push(<span key="el2" className="cand-page-ellipsis">…</span>);
  if (totalPages > 1)
    pages.push(
      <button key={totalPages} className={`cand-page-num${page === totalPages ? " cand-page-num--active" : ""}`} onClick={() => onChange(totalPages)}>{totalPages}</button>
    );

  return (
    <div className="cand-pagination">
      <button className="cand-page-btn" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}>
        <i className="bi bi-chevron-left" /><span className="cand-page-label">Précédent</span>
      </button>
      {pages}
      <button className="cand-page-btn" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
        <span className="cand-page-label">Suivant</span><i className="bi bi-chevron-right" />
      </button>
    </div>
  );
}

// ── Badge statut ──────────────────────────────────────────
function StatutBadge({ statut }) {
  const s = STATUTS.find(x => x.value === statut) || STATUTS[0];
  return <span className={`cand-statut-badge ${s.color}`}>{s.label}</span>;
}

// ── Drawer fiche candidat ─────────────────────────────────
function CandidatDrawer({ candidat, onClose, onUpdate }) {
  const [notes, setNotes] = useState(candidat?.notes || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(candidat?.tags || []);
  const [statut, setStatut] = useState(candidat?.statut || "nouveau");
  const [saved, setSaved] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (candidat) {
      setNotes(candidat.notes || "");
      setTags(candidat.tags || []);
      setStatut(candidat.statut || "nouveau");
      setSaved(false);
    }
  }, [candidat]);

  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
    };
    if (candidat) {
      setTimeout(() => document.addEventListener("mousedown", handler), 100);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [candidat, onClose]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function addTag(e) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const t = tagInput.trim().replace(/,$/, "");
      if (t && !tags.includes(t)) setTags([...tags, t]);
      setTagInput("");
    }
  }

  function removeTag(t) { setTags(tags.filter(x => x !== t)); }

  function handleSave() {
    onUpdate(candidat.id, { notes, tags, statut });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!candidat) return null;
  const avatarColor = getAvatarColor(candidat.id);

  return (
    <div className="cand-drawer-overlay">
      <div className="cand-drawer" ref={drawerRef}>
        {/* Header */}
        <div className="cand-drawer-header">
          <div className="cand-drawer-avatar" style={{ background: avatarColor }}>
            {getInitiales(candidat.nom, candidat.prenoms)}
          </div>
          <div className="cand-drawer-identity">
            <h2>{candidat.prenoms} <strong>{candidat.nom}</strong></h2>
            <a href={`mailto:${candidat.email}`} className="cand-drawer-email">
              <i className="bi bi-envelope" /> {candidat.email}
            </a>
          </div>
          <button className="cand-drawer-close" onClick={onClose} title="Fermer">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="cand-drawer-body">
          {/* Pipeline statut */}
          <div className="cand-drawer-section">
            <div className="cand-drawer-section-title">
               Statut pipeline
            </div>
            <div className="cand-statut-selector">
              {STATUTS.map(s => (
                <button
                  key={s.value}
                  className={`cand-statut-btn ${s.color}${statut === s.value ? " active" : ""}`}
                  onClick={() => setStatut(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Infos contacts */}
          <div className="cand-drawer-section">
            <div className="cand-drawer-section-title">
              Coordonnées
            </div>
            <div className="cand-drawer-grid">
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Téléphone</span>
                <span>{candidat.tel}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">WhatsApp</span>
                <span>{candidat.telwhat}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Commune</span>
                <span>{candidat.Commune}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Quartier</span>
                <span>{candidat.Quartier}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Pays nationalité</span>
                <span>{candidat.Pays_N}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Pays résidence</span>
                <span>{candidat.Pays_R}</span>
              </div>
            </div>
          </div>

          {/* Profil académique */}
          <div className="cand-drawer-section">
            <div className="cand-drawer-section-title">
              Profil académique
            </div>
            <div className="cand-drawer-grid">
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Niveau</span>
                <span className="cand-badge-niveau">{candidat.Niveau}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Anglais</span>
                <span className={`cand-badge-anglais cand-badge-anglais--${candidat.Niveau_A}`}>{candidat.Niveau_A}</span>
              </div>
              <div className="cand-drawer-field cand-drawer-field--full">
                <span className="cand-drawer-field-label">Secteur d'activité</span>
                <span>{candidat.Secteur}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Genre</span>
                <span className={`cand-badge-genre cand-badge-genre--${candidat.Genre.toLowerCase()}`}>
                  <i className={`bi bi-gender-${candidat.Genre.toLowerCase() === "femme" ? "female" : "male"}`} />
                  {candidat.Genre}
                </span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Situation matrimoniale</span>
                <span>{candidat.Situation_M}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Nombre d'enfants</span>
                <span>{candidat.Nombre_E}</span>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="cand-drawer-section">
            <div className="cand-drawer-section-title">
               Documents
            </div>
            <div className="cand-drawer-docs">
              {candidat.cv_url ? (
                <a className="cand-btn-dl cand-btn-dl--cv" href={candidat.cv_url} target="_blank" rel="noreferrer">
                  <i className="bi bi-file-earmark-person" /> Télécharger CV
                </a>
              ) : <span className="cand-doc-missing"><i className="bi bi-x-circle" /> CV non fourni</span>}

              {candidat.lettre_url ? (
                <a className="cand-btn-dl cand-btn-dl--lettre" href={candidat.lettre_url} target="_blank" rel="noreferrer">
                  <i className="bi bi-file-earmark-text" /> Lettre de motivation
                </a>
              ) : <span className="cand-doc-missing"><i className="bi bi-x-circle" /> Lettre non fournie</span>}

              {(candidat.diplomes || []).map((url, i) => (
                <a key={i} className="cand-btn-dl cand-btn-dl--diplome" href={url} target="_blank" rel="noreferrer">
                  <i className="bi bi-patch-check" /> Diplôme {i + 1}
                </a>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="cand-drawer-section">
            <div className="cand-drawer-section-title">
              <i className="bi bi-tags" /> Tags recruteur
            </div>
            <div className="cand-tags-list">
              {tags.map(t => (
                <span key={t} className="cand-tag">
                  {t}
                  <button onClick={() => removeTag(t)} className="cand-tag-remove">
                    <i className="bi bi-x" />
                  </button>
                </span>
              ))}
            </div>
            <input
              className="cand-filter-select cand-tag-input"
              type="text"
              placeholder="Ajouter un tag (Entrée pour valider)…"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
            />
          </div>

          {/* Notes */}
          <div className="cand-drawer-section">
            <div className="cand-drawer-section-title">
               Notes recruteur
            </div>
            <textarea
              className="cand-drawer-notes"
              placeholder="Ajoutez vos observations, retours d'entretien…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="cand-drawer-footer">
          <a
            href={`mailto:${candidat.email}`}
            className="cand-btn-action cand-btn-action--email"
          >
            <i className="bi bi-envelope-fill" /> Envoyer un email
          </a>
          <a
            href={`https://wa.me/${candidat.telwhat?.replace(/\s/g, "").replace("+", "")}`}
            className="cand-btn-action cand-btn-action--whatsapp"
            target="_blank"
            rel="noreferrer"
          >
            <i className="bi bi-whatsapp" /> WhatsApp
          </a>
          <button
            className={`cand-btn-action cand-btn-action--save${saved ? " saved" : ""}`}
            onClick={handleSave}
          >
            <i className={`bi bi-${saved ? "check-circle-fill" : "floppy"}`} />
            {saved ? "Sauvegardé !" : "Sauvegarder"}
          </button>
        </div>
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
    <div className="cand-bulk-bar">
      <div className="cand-bulk-info">
        <i className="bi bi-check2-square" />
        <strong>{count}</strong> candidat{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
      </div>
      <div className="cand-bulk-actions">
        {/* Changer statut */}
        <div style={{ position: "relative" }} ref={ref}>
          <button
            className="cand-bulk-btn"
            onClick={() => setStatutOpen(p => !p)}
          >
            <i className="bi bi-kanban" /> Changer statut
            <i className="bi bi-chevron-down" style={{ fontSize: 10 }} />
          </button>
          {statutOpen && (
            <div className="cand-bulk-dropdown">
              {STATUTS.map(s => (
                <button
                  key={s.value}
                  className="cand-bulk-dropdown-item"
                  onClick={() => { onStatut(s.value); setStatutOpen(false); }}
                >
                  <span className={`cand-statut-dot ${s.color}`} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export sélection */}
        <button className="cand-bulk-btn" onClick={onExport}>
          <i className="bi bi-file-earmark-excel-fill" /> Exporter la sélection
        </button>

        {/* Désélectionner */}
        <button className="cand-bulk-btn cand-bulk-btn--clear" onClick={onClear}>
          <i className="bi bi-x" /> Désélectionner
        </button>
      </div>
    </div>
  );
}

// ── Statistiques rapides ──────────────────────────────────
function StatsBar({ candidats }) {
  const stats = useMemo(() => {
    const total = candidats.length;
    const hommes = candidats.filter(c => c.Genre === "Homme").length;
    const femmes = candidats.filter(c => c.Genre === "Femme").length;
    const retenus = candidats.filter(c => c.statut === "retenu").length;
    const entretiens = candidats.filter(c => c.statut === "entretien").length;
    return { total, hommes, femmes, retenus, entretiens };
  }, [candidats]);

  return (
    <div className="cand-stats-bar">
      <div className="cand-stat-item">
        <span className="cand-stat-value">{stats.total}</span>
        <span className="cand-stat-label">Total</span>
      </div>
      <div className="cand-stat-divider" />
      <div className="cand-stat-item">
        <span className="cand-stat-value cand-stat-value--blue">{stats.hommes}</span>
        <span className="cand-stat-label">Hommes</span>
      </div>
      <div className="cand-stat-item">
        <span className="cand-stat-value cand-stat-value--pink">{stats.femmes}</span>
        <span className="cand-stat-label">Femmes</span>
      </div>
      <div className="cand-stat-divider" />
      <div className="cand-stat-item">
        <span className="cand-stat-value cand-stat-value--orange">{stats.entretiens}</span>
        <span className="cand-stat-label">Entretiens</span>
      </div>
      <div className="cand-stat-item">
        <span className="cand-stat-value cand-stat-value--green">{stats.retenus}</span>
        <span className="cand-stat-label">Retenus</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function Candidatheque() {
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

  // Données (avec état local pour les mises à jour)
  const [candidats, setCandidats] = useState(MOCK_CANDIDATS);

  // Drawer
  const [selectedCandidat, setSelectedCandidat] = useState(null);

  // Mise à jour candidat (notes, tags, statut)
  const updateCandidat = useCallback((id, updates) => {
    setCandidats(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  // Recherche (avec debounce)
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebounce(searchRaw, 250);

  // Filtres
  const [filterSecteur, setFilterSecteur] = useState("");
  const [filterNiveau, setFilterNiveau] = useState("");
  const [filterAnglais, setFilterAnglais] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [filterCommune, setFilterCommune] = useState("");
  const [filterQuartier, setFilterQuartier] = useState("");
  const [filterStatut, setFilterStatut] = useState("");

  // Tri
  const [sortCol, setSortCol] = useState("id");
  const [sortDir, setSortDir] = useState("asc");

  // Pagination
  const [page, setPage] = useState(1);
  const tableRef = useRef(null);

  // Sélection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Reset page + sélection sur changement de filtres
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [search, filterSecteur, filterNiveau, filterAnglais, filterGenre, filterCommune, filterQuartier, filterStatut]);

  // Filtre + tri
  const filtered = useMemo(() => {
    let list = candidats.filter((c) => {
      const q = search.toLowerCase();
      const ms = !q || `${c.nom} ${c.prenoms} ${c.email} ${(c.tags || []).join(" ")}`.toLowerCase().includes(q);
      const mSec = !filterSecteur || c.Secteur === filterSecteur;
      const mNiv = !filterNiveau || c.Niveau === filterNiveau;
      const mAng = !filterAnglais || c.Niveau_A === filterAnglais;
      const mGen = !filterGenre || c.Genre.toLowerCase() === filterGenre;
      const mCom = !filterCommune || c.Commune === filterCommune;
      const mQua = !filterQuartier || c.Quartier.toLowerCase().includes(filterQuartier.toLowerCase());
      const mStat = !filterStatut || c.statut === filterStatut;
      return ms && mSec && mNiv && mAng && mGen && mCom && mQua && mStat;
    });
    list = [...list].sort((a, b) => {
      const av = a[sortCol] ?? "";
      const bv = b[sortCol] ?? "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [candidats, search, filterSecteur, filterNiveau, filterAnglais, filterGenre, filterCommune, filterQuartier, filterStatut, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return <i className="bi bi-chevron-expand cand-sort-icon" />;
    return sortDir === "asc"
      ? <i className="bi bi-chevron-up cand-sort-icon cand-sort-icon--active" />
      : <i className="bi bi-chevron-down cand-sort-icon cand-sort-icon--active" />;
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

  // Actions groupées
  function bulkChangeStatut(statut) {
    setCandidats(prev => prev.map(c => selectedIds.has(c.id) ? { ...c, statut } : c));
  }

  function resetFilters() {
    setSearchRaw("");
    setFilterSecteur("");
    setFilterNiveau("");
    setFilterAnglais("");
    setFilterGenre("");
    setFilterCommune("");
    setFilterQuartier("");
    setFilterStatut("");
  }

  const hasActiveFilters = searchRaw || filterSecteur || filterNiveau || filterAnglais || filterGenre || filterCommune || filterQuartier || filterStatut;

  // ── Rendu carte mobile ────────────────────────────────────
  function renderCard(c) {
    const avatarColor = getAvatarColor(c.id);
    return (
      <div key={c.id} className="cand-mobile-card" onClick={() => setSelectedCandidat(c)}>
        <div className="cand-mobile-card__header">
          <label className="cand-mobile-card__check" onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              className="cand-checkbox"
              checked={selectedIds.has(c.id)}
              onChange={() => toggleSelect(c.id)}
            />
            <div className="cand-mobile-avatar" style={{ background: avatarColor }}>
              {getInitiales(c.nom, c.prenoms)}
            </div>
            <div>
              <div className="cand-mobile-card__name">{c.prenoms} {c.nom}</div>
              <div className="cand-mobile-card__email">{c.email}</div>
            </div>
          </label>
          <StatutBadge statut={c.statut} />
        </div>
        <div className="cand-mobile-card__grid">
          <div className="cand-mobile-card__item">
            <span className="cand-mobile-card__label">Secteur</span>
            <span className="cand-mobile-card__value">{c.Secteur}</span>
          </div>
          <div className="cand-mobile-card__item">
            <span className="cand-mobile-card__label">Niveau</span>
            <span className="cand-badge-niveau">{c.Niveau}</span>
          </div>
          <div className="cand-mobile-card__item">
            <span className="cand-mobile-card__label">Commune</span>
            <span className="cand-mobile-card__value">{c.Commune}</span>
          </div>
          <div className="cand-mobile-card__item">
            <span className="cand-mobile-card__label">Anglais</span>
            <span className={`cand-badge-anglais cand-badge-anglais--${c.Niveau_A}`}>{c.Niveau_A}</span>
          </div>
        </div>
        {(c.tags || []).length > 0 && (
          <div className="cand-mobile-card__tags">
            {c.tags.slice(0, 3).map(t => <span key={t} className="cand-tag cand-tag--sm">{t}</span>)}
          </div>
        )}
      </div>
    );
  }

  // ── Colonnes tableau ──────────────────────────────────────
  const COLUMNS = [
    { key: "id", label: "Id", sortable: true },
    { key: "nom", label: "Nom", sortable: true },
    { key: "prenoms", label: "Prénom(s)", sortable: true },
    { key: "statut", label: "Statut", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "tel", label: "Téléphone", sortable: false },
    { key: "Niveau", label: "Niveau", sortable: true },
    { key: "Niveau_A", label: "Anglais", sortable: true },
    { key: "Secteur", label: "Secteur", sortable: true },
    { key: "Genre", label: "Genre", sortable: true },
    { key: "Commune", label: "Commune", sortable: true },
    { key: "Quartier", label: "Quartier", sortable: true },
    { key: "Pays_N", label: "Nationalité", sortable: true },
    { key: "Situation_M", label: "Sit. Matrimoniale", sortable: true },
    { key: "Nombre_E", label: "Enfants", sortable: true },
    { key: "_tags", label: "Tags", sortable: false },
    { key: "_cv", label: "CV", sortable: false },
    { key: "_lettre", label: "Lettre", sortable: false },
    { key: "_diplomes", label: "Diplômes", sortable: false },
  ];

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
          <div className="cand-page">

            {/* ── Titre ───────────────────────────────────── */}
            <div className="cand-breadcrumb">
              <h1>Gestion des candidats</h1>
              <p>
                 <a href="/acceuil">Bienvenue solibra</a>{" / "}
                <strong>Candidathèque générale</strong>
              </p>

              
            </div>

            {/* ── Stats rapides ────────────────────────────── */}
            <StatsBar candidats={filtered} />

            {/* ── Barre actions groupées ───────────────────── */}
            <BulkActionBar
              count={selectedIds.size}
              onStatut={bulkChangeStatut}
              onExport={() => exportExcel(candidats.filter(c => selectedIds.has(c.id)))}
              onClear={() => setSelectedIds(new Set())}
            />

            <div className="cand-card" ref={tableRef}>
              {/* ── Toolbar ──────────────────────────────── */}
              <div className="cand-toolbar">
                <div className="cand-search">
                  <i className="bi bi-search" />
                  <input
                    value={searchRaw}
                    onChange={e => setSearchRaw(e.target.value)}
                    placeholder="Nom, prénom, email, tags…"
                  />
                  {searchRaw && (
                    <button className="cand-search-clear" onClick={() => setSearchRaw("")}>
                      <i className="bi bi-x" />
                    </button>
                  )}
                </div>

                <div className="cand-toolbar-right">
                  {hasActiveFilters && (
                    <button className="cand-btn-reset" onClick={resetFilters} title="Réinitialiser">
                      <i className="bi bi-x-circle" />
                      <span>Réinitialiser</span>
                    </button>
                  )}
                  <button
                    className="cand-btn-export"
                    onClick={() => exportExcel(filtered)}
                    title={`Exporter ${filtered.length} candidat(s)`}
                  >
                    <i className="bi bi-file-earmark-excel-fill" />
                    <span>Exporter ({filtered.length})</span>
                  </button>
                </div>
              </div>

              {/* ── Filtres ───────────────────────────────── */}
              <div className="cand-filters">
                <div className="cand-filter-group">
                  <label className="cand-filter-label">Statut pipeline</label>
                  <select className="cand-filter-select" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
                    <option value="">Tous les statuts</option>
                    {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                <div className="cand-filter-group">
                  <label className="cand-filter-label">Secteur d'activité</label>
                  <select className="cand-filter-select" value={filterSecteur} onChange={e => setFilterSecteur(e.target.value)}>
                    <option value="">Tous les secteurs</option>
                    {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="cand-filter-group">
                  <label className="cand-filter-label">Niveau académique</label>
                  <select className="cand-filter-select" value={filterNiveau} onChange={e => setFilterNiveau(e.target.value)}>
                    <option value="">Tous les niveaux</option>
                    {NIVEAUX.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>

                <div className="cand-filter-group">
                  <label className="cand-filter-label">Niveau Anglais</label>
                  <select className="cand-filter-select" value={filterAnglais} onChange={e => setFilterAnglais(e.target.value)}>
                    <option value="">Tous les niveaux</option>
                    {NIVEAUX_ANGLAIS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>

                <div className="cand-filter-group">
                  <label className="cand-filter-label">Genre</label>
                  <select className="cand-filter-select" value={filterGenre} onChange={e => setFilterGenre(e.target.value)}>
                    <option value="">Tous les genres</option>
                    <option value="homme">Homme</option>
                    <option value="femme">Femme</option>
                  </select>
                </div>

                <div className="cand-filter-group">
                  <label className="cand-filter-label">Commune</label>
                  <select
                    className="cand-filter-select"
                    value={filterCommune}
                    onChange={e => { setFilterCommune(e.target.value); setFilterQuartier(""); }}
                  >
                    <option value="">Toutes les communes</option>
                    {COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="cand-filter-group">
                  <label className="cand-filter-label">Quartier</label>
                  <QuartierAutocomplete
                    value={filterQuartier}
                    onChange={setFilterQuartier}
                    commune={filterCommune}
                  />
                </div>
              </div>

              {/* ── Tableau desktop ───────────────────────── */}
              <div className="cand-table-wrap">
                <table className="cand-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          className="cand-checkbox"
                          checked={allPageSelected}
                          onChange={toggleSelectAll}
                          title="Tout sélectionner"
                        />
                      </th>
                      {COLUMNS.map(col => (
                        <th
                          key={col.key}
                          className={col.sortable ? "cand-th-sortable" : ""}
                          onClick={col.sortable ? () => handleSort(col.key) : undefined}
                        >
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
                          <div className="cand-empty">
                            <i className="bi bi-inbox" />
                            <p>Aucun candidat trouvé pour ces critères.</p>
                            {hasActiveFilters && (
                              <button className="cand-btn-reset" onClick={resetFilters}>
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
                        <tr
                          key={c.id}
                          className={`cand-tr--clickable ${selectedIds.has(c.id) ? "cand-tr--selected" : ""} ${idx % 2 === 0 ? "" : "cand-tr--alt"}`}
                          onClick={() => setSelectedCandidat(c)}
                        >
                          <td style={{ textAlign: "center" }} onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="cand-checkbox"
                              checked={selectedIds.has(c.id)}
                              onChange={() => toggleSelect(c.id)}
                            />
                          </td>
                          <td className="cand-td-muted">{c.id}</td>
                          {/* Nom avec avatar */}
                          <td>
                            <div className="cand-td-with-avatar">
                              <div className="cand-table-avatar" style={{ background: avatarColor }}>
                                {getInitiales(c.nom, c.prenoms)}
                              </div>
                              <span className="cand-td-name">{c.nom}</span>
                            </div>
                          </td>
                          <td className="cand-td-muted">{c.prenoms}</td>
                          <td><StatutBadge statut={c.statut} /></td>
                          <td className="cand-td-email">{c.email}</td>
                          <td className="cand-td-muted">{c.tel}</td>
                          <td><span className="cand-badge-niveau">{c.Niveau}</span></td>
                          <td>
                            <span className={`cand-badge-anglais cand-badge-anglais--${c.Niveau_A}`}>
                              {c.Niveau_A}
                            </span>
                          </td>
                          <td className="cand-td-muted cand-td-secteur">{c.Secteur}</td>
                          <td>
                            <span className={`cand-badge-genre cand-badge-genre--${c.Genre.toLowerCase()}`}>
                              <i className={`bi bi-gender-${c.Genre.toLowerCase() === "femme" ? "female" : "male"}`} />
                              {c.Genre}
                            </span>
                          </td>
                          <td className="cand-td-muted">{c.Commune}</td>
                          <td className="cand-td-muted">{c.Quartier}</td>
                          <td className="cand-td-muted">{c.Pays_N}</td>
                          <td className="cand-td-muted">{c.Situation_M}</td>
                          <td className="cand-td-muted" style={{ textAlign: "center" }}>{c.Nombre_E}</td>
                          {/* Tags */}
                          <td>
                            <div className="cand-tags-list cand-tags-list--inline">
                              {(c.tags || []).slice(0, 2).map(t => (
                                <span key={t} className="cand-tag cand-tag--sm">{t}</span>
                              ))}
                              {(c.tags || []).length > 2 && (
                                <span className="cand-tag cand-tag--more">+{c.tags.length - 2}</span>
                              )}
                            </div>
                          </td>
                          {/* CV */}
                          <td style={{ textAlign: "center" }} onClick={e => e.stopPropagation()}>
                            {c.cv_url
                              ? <a className="cand-btn-dl cand-btn-dl--cv" href={c.cv_url} target="_blank" rel="noreferrer"><i className="bi bi-download" /></a>
                              : <span className="cand-td-muted">—</span>
                            }
                          </td>
                          {/* Lettre */}
                          <td style={{ textAlign: "center" }} onClick={e => e.stopPropagation()}>
                            {c.lettre_url
                              ? <a className="cand-btn-dl cand-btn-dl--lettre" href={c.lettre_url} target="_blank" rel="noreferrer"><i className="bi bi-download" /></a>
                              : <span className="cand-td-muted">—</span>
                            }
                          </td>
                          {/* Diplômes */}
                          <td style={{ textAlign: "center" }} onClick={e => e.stopPropagation()}>
                            {(c.diplomes || []).length > 0
                              ? <div className="cand-diplomes-list">
                                  {c.diplomes.map((url, i) => (
                                    <a key={i} className="cand-btn-dl cand-btn-dl--diplome" href={url} target="_blank" rel="noreferrer">
                                      <i className="bi bi-download" />
                                    </a>
                                  ))}
                                </div>
                              : <span className="cand-td-muted">—</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Cartes mobile ─────────────────────────── */}
              <div className="cand-cards-mobile">
                {paginated.length === 0 && (
                  <div className="cand-empty">
                    
                    <p>Aucun candidat trouvé.</p>
                  </div>
                )}
                {paginated.map(renderCard)}
              </div>

              {/* ── Footer / Pagination ───────────────────── */}
              <div className="cand-table-footer">
                <span className="cand-footer-info">
                  Affichage{" "}
                  <strong>{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</strong>
                  {" "}à{" "}
                  <strong>{Math.min(page * PAGE_SIZE, filtered.length)}</strong>
                  {" "}sur <strong>{filtered.length}</strong> candidat{filtered.length !== 1 ? "s" : ""}
                  {selectedIds.size > 0 && (
                    <span className="cand-footer-selected"> · {selectedIds.size} sélectionné(s)</span>
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

      {/* ── Drawer fiche candidat ──────────────────────────── */}
      {selectedCandidat && (
        <CandidatDrawer
          candidat={candidats.find(c => c.id === selectedCandidat.id)}
          onClose={() => setSelectedCandidat(null)}
          onUpdate={updateCandidat}
        />
      )}

      <footer className={`app-footer ${sidebarOpen ? "app-footer--shifted" : ""}`}>
        © 2025 Zenselekt · Propulsé par{" "}
        <strong>Empower talents &amp; careers </strong>. Tous droits réservés
      </footer>
    </div>
  );
}
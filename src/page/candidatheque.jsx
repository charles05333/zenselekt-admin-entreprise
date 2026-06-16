import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./css/Candidatheque.css";
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
    customClass: { popup: "cand-swal-popup" },
  });
}

/* ─────────────────────────────────────────────────────────
   CONFIG API
───────────────────────────────────────────────────────── */
const API_CANDIDATS =
  "/securebackoffice/backsecurebackoffice/candidats.php";

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
  { value: "nouveau",   label: "Nouveau",           color: "statut--nouveau"   },
  { value: "contact",   label: "À contacter",       color: "statut--contact"   },
  { value: "entretien", label: "Entretien planifié", color: "statut--entretien" },
  { value: "retenu",    label: "Retenu",             color: "statut--retenu"    },
  { value: "refuse",    label: "Refusé",             color: "statut--refuse"    },
  { value: "archive",   label: "Archivé",            color: "statut--archive"   },
];

/* ─────────────────────────────────────────────────────────
   CATALOGUES FILTRES
───────────────────────────────────────────────────────── */
const SECTEURS = [
  "Agriculture / Élevage / Pêche","Agroalimentaire","Architecture / Urbanisme / Design",
  "Art / Culture / Spectacle","Artisanat / Métiers manuels","Audit / Expertise comptable",
  "Bailleur / Organisme international","Banque / Assurance / Microfinance",
  "Bois / Papier / Carton / Imprimerie","BTP / Matériaux de construction",
  "Chimie / Parachimie","Commerce / Négoce / Distribution",
  "Communication / Marketing / Publicité","Droit / Juridique / Notariat",
  "Économie / Statistiques / Recherche","Édition / Multimédia / Presse",
  "Education / Formation / Enseignement","Électronique / Électricité / Énergie",
  "Environnement / Développement durable","Études et conseils / Consulting",
  "Finance / Comptabilité / Gestion","Hôtellerie / Restauration / Tourisme",
  "Humanitaire / ONG / Associatif","Immobilier / Foncier",
  "Industrie pharmaceutique","Informatique / Télécoms / Numérique",
  "Machines et équipements / Automobile","Management / Direction générale",
  "Mines / Pétrole / Énergie","Métallurgie / Travail du métal",
  "Plastique / Caoutchouc","Ressources humaines / Recrutement",
  "Santé / Médical / Paramédical","Sécurité / Défense / Gardiennage",
  "Services aux entreprises / Facilities","Sport / Bien-être / Loisirs",
  "Textile / Habillement / Chaussure","Transports / Logistique / Supply Chain",
  "Autre / Non classifié",
];

const COMMUNES = [
  "Abobo","Adjamé","Attécoubé","Cocody","Koumassi","Marcory","Plateau",
  "Port-Bouët","Treichville","Yopougon","Aboisso","Adzopé","Agboville",
  "Bouaké","Bondoukou","Dabou","Daloa","Daoukro","Dimbokro","Divo",
  "Ferkessédougou","Gagnoa","Grand-Bassam","Guiglo","Issia","Jacqueville",
  "Katiola","Korhogo","Man","Minignan","Odienné","San-Pédro","Sassandra",
  "Séguéla","Soubré","Tabou","Toumodi","Yamoussoukro",
  "Autres / Hors Côte d'Ivoire",
];

const NIVEAUX = [
  { value: "cepe",         label: "CEPE" },
  { value: "bepc",         label: "BEPC / Brevet" },
  { value: "cap",          label: "CAP" },
  { value: "bac",          label: "Baccalauréat" },
  { value: "bt",           label: "BT" },
  { value: "bp",           label: "BP" },
  { value: "bts",          label: "BTS" },
  { value: "dut",          label: "DUT" },
  { value: "dts",          label: "DTS" },
  { value: "deug",         label: "DEUG / DEUST" },
  { value: "licence",      label: "Licence / Bachelor" },
  { value: "licence_pro",  label: "Licence pro" },
  { value: "master",       label: "Master 1" },
  { value: "master2",      label: "Master 2 / DEA" },
  { value: "ingenieur",    label: "Ingénieur" },
  { value: "grandes_ecoles", label: "Grande École" },
  { value: "doctorat",     label: "Doctorat / PhD" },
  { value: "autre",        label: "Autre" },
];

const NIVEAUX_ANGLAIS = [
  { value: "faible",  label: "Faible"   },
  { value: "moyen",   label: "Moyen"    },
  { value: "courant", label: "Courant"  },
  { value: "bilingue",label: "Bilingue" },
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
   HOOK — données candidats
───────────────────────────────────────────────────────── */
function useCandidats({
  search, filterStatut, filterSecteur, filterNiveau,
  filterAnglais, filterGenre, filterCommune,
  sortCol, sortDir, page,
}) {
  const [data, setData]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page:     String(page),
      limit:    String(PAGE_SIZE),
      sort:     sortCol,
      dir:      sortDir,
    });
    if (search)        params.set("search",   search);
    if (filterStatut)  params.set("statut",   filterStatut);
    if (filterSecteur) params.set("secteur",  filterSecteur);
    if (filterNiveau)  params.set("niveau",   filterNiveau);
    if (filterAnglais) params.set("niveau_a", filterAnglais);
    if (filterGenre)   params.set("genre",    filterGenre);
    if (filterCommune) params.set("commune",  filterCommune);

    try {
      const res = await secureFetch(`${API_CANDIDATS}?${params.toString()}`);

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
          "Réponse serveur invalide. Vérifiez que candidats.php retourne du JSON."
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
      const res = await secureFetch(`${API_CANDIDATS}?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);

      // ── SweetAlert2 succès ──
      await swalSuccess("Sauvegarde réussie !", "Les informations du candidat ont bien été enregistrées.");

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
    "#0a78b5","#1d6f42","#7c3aed","#b45309",
    "#dc2626","#0891b2","#16a34a","#9333ea",
  ];
  return colors[id % colors.length];
}

/* ─────────────────────────────────────────────────────────
   EXPORT EXCEL
───────────────────────────────────────────────────────── */
function exportExcel(candidats) {
  const XLSX_CDN =
    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";

  const doExport = () => {
    const XLSX = window.XLSX;
    const wb = XLSX.utils.book_new();
    const headers = [
      "Id","Nom","Prénom(s)","Email","Téléphone","WhatsApp",
      "Niveau académique","Niveau anglais","Secteur","Genre",
      "Pays nationalité","Pays résidence","Commune","Quartier",
      "Sit. Matrimoniale","Nbre enfants","Statut pipeline",
      "Tags","Notes",
    ];
    const rows = candidats.map((c) => [
      c.id, c.nom, c.prenoms, c.email, c.tel, c.telwhat,
      c.Niveau, c.Niveau_A, c.Secteur, c.Genre,
      c.Pays_N, c.Pays_R, c.Commune, c.Quartier,
      c.Situation_M, c.Nombre_E,
      STATUTS.find((s) => s.value === c.statut)?.label || c.statut,
      (c.tags || []).join(", "),
      c.notes || "",
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, "Candidats");
    XLSX.writeFile(wb, "candidatheque_zenselekt.xlsx");
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
   AUTOCOMPLÉTION QUARTIER
───────────────────────────────────────────────────────── */
function QuartierAutocomplete({ value, onChange, commune }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const ref   = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  async function search(q) {
    if (!q || q.length < 2 || !commune) return;
    setLoadingGeo(true);
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
        q + " " + commune + " Abidjan"
      )}&limit=10&lang=fr&lat=5.36&lon=-4.01`;
      const res  = await fetch(url);
      const data = await res.json();
      const unique = [];
      const seen   = new Set();
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
      setLoadingGeo(false);
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
      {loadingGeo && (
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

/* ─────────────────────────────────────────────────────────
   PAGINATION
───────────────────────────────────────────────────────── */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages  = [];
  const delta  = 2;
  const range  = [];
  for (
    let i = Math.max(2, page - delta);
    i <= Math.min(totalPages - 1, page + delta);
    i++
  ) range.push(i);

  pages.push(
    <button key={1}
      className={`cand-page-num${page === 1 ? " cand-page-num--active" : ""}`}
      onClick={() => onChange(1)}>1</button>
  );
  if (range[0] > 2)
    pages.push(<span key="el1" className="cand-page-ellipsis">…</span>);
  range.forEach((n) =>
    pages.push(
      <button key={n}
        className={`cand-page-num${page === n ? " cand-page-num--active" : ""}`}
        onClick={() => onChange(n)}>{n}</button>
    )
  );
  if (range[range.length - 1] < totalPages - 1)
    pages.push(<span key="el2" className="cand-page-ellipsis">…</span>);
  if (totalPages > 1)
    pages.push(
      <button key={totalPages}
        className={`cand-page-num${page === totalPages ? " cand-page-num--active" : ""}`}
        onClick={() => onChange(totalPages)}>{totalPages}</button>
    );

  return (
    <div className="cand-pagination">
      <button className="cand-page-btn"
        onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}>
        <i className="bi bi-chevron-left" />
        <span className="cand-page-label">Précédent</span>
      </button>
      {pages}
      <button className="cand-page-btn"
        onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
        <span className="cand-page-label">Suivant</span>
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
  return <span className={`cand-statut-badge ${s.color}`}>{s.label}</span>;
}

/* ─────────────────────────────────────────────────────────
   SKELETON LIGNE TABLEAU
───────────────────────────────────────────────────────── */
function SkeletonRows({ count = 10, cols = 19 }) {
  return Array.from({ length: count }, (_, i) => (
    <tr key={i} className="cand-tr--skeleton">
      <td><div className="skeleton" style={{ width: 18, height: 18, borderRadius: 4 }} /></td>
      {Array.from({ length: cols }, (_, j) => (
        <td key={j}>
          <div className="skeleton skeleton--text"
            style={{ width: `${50 + ((i * 7 + j * 13) % 40)}%`, height: 12 }} />
        </td>
      ))}
    </tr>
  ));
}

/* ─────────────────────────────────────────────────────────
   DRAWER FICHE CANDIDAT
───────────────────────────────────────────────────────── */
function CandidatDrawer({ candidat, onClose, onSave, saving, savedId }) {
  const [notes,    setNotes]    = useState(candidat?.notes    || "");
  const [tagInput, setTagInput] = useState("");
  const [tags,     setTags]     = useState(candidat?.tags     || []);
  const [statut,   setStatut]   = useState(candidat?.statut   || "nouveau");
  const [dirty,    setDirty]    = useState(false);

  const drawerRef = useRef(null);
  const isSaved   = savedId === candidat?.id;

  useEffect(() => {
    if (candidat) {
      setNotes(candidat.notes || "");
      setTags(candidat.tags   || []);
      setStatut(candidat.statut || "nouveau");
      setDirty(false);
    }
  }, [candidat?.id]);

  useEffect(() => {
    const h = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose();
    };
    if (candidat) setTimeout(() => document.addEventListener("mousedown", h), 100);
    return () => document.removeEventListener("mousedown", h);
  }, [candidat, onClose]);

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
  function removeTag(t) { setTags(tags.filter((x) => x !== t)); setDirty(true); }

  function handleStatut(s) { setStatut(s); setDirty(true); }
  function handleNotes(e) { setNotes(e.target.value); setDirty(true); }

  function handleSave() {
    onSave(candidat.id, { statut, notes, tags });
    setDirty(false);
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
              {candidat.email}
            </a>
          </div>
          <button className="cand-drawer-close" onClick={onClose} title="Fermer">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="cand-drawer-body">

          {/* ── Pipeline statut ── */}
          <div className="cand-drawer-section">
            <div className="cand-drawer-section-title">Statut pipeline</div>
            <div className="cand-statut-selector">
              {STATUTS.map((s) => (
                <button
                  key={s.value}
                  className={`cand-statut-btn ${s.color}${statut === s.value ? " active" : ""}`}
                  onClick={() => handleStatut(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Coordonnées ── */}
          <div className="cand-drawer-section">
            <div className="cand-drawer-section-title">Coordonnées</div>
            <div className="cand-drawer-grid">
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Téléphone</span>
                <span>{candidat.tel || "—"}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">WhatsApp</span>
                <span>{candidat.telwhat || "—"}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Commune</span>
                <span>{candidat.Commune || "—"}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Quartier</span>
                <span>{candidat.Quartier || "—"}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Pays nationalité</span>
                <span>{candidat.Pays_N || "—"}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Pays résidence</span>
                <span>{candidat.Pays_R || "—"}</span>
              </div>
            </div>
          </div>

          {/* ── Profil académique ── */}
          <div className="cand-drawer-section">
            <div className="cand-drawer-section-title">Profil académique</div>
            <div className="cand-drawer-grid">
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Niveau</span>
                <span className="cand-badge-niveau">{candidat.Niveau}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Anglais</span>
                <span className={`cand-badge-anglais cand-badge-anglais--${candidat.Niveau_A}`}>
                  {candidat.Niveau_A}
                </span>
              </div>
              <div className="cand-drawer-field cand-drawer-field--full">
                <span className="cand-drawer-field-label">Secteur d'activité</span>
                <span>{candidat.Secteur || "—"}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Genre</span>
                {/* ── Icône genre supprimée ── */}
                <span className={`cand-badge-genre cand-badge-genre--${candidat.Genre?.toLowerCase()}`}>
                  {candidat.Genre}
                </span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Situation matrimoniale</span>
                <span>{candidat.Situation_M || "—"}</span>
              </div>
              <div className="cand-drawer-field">
                <span className="cand-drawer-field-label">Nombre d'enfants</span>
                <span>{candidat.Nombre_E ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* ── Documents ── */}
          <div className="cand-drawer-section">
            <div className="cand-drawer-section-title">Documents</div>
            <div className="cand-drawer-docs">
              {candidat.cv_url ? (
                <a className="cand-btn-dl cand-btn-dl--cv"
                  href={candidat.cv_url} target="_blank" rel="noreferrer">
                  Télécharger CV
                </a>
              ) : (
                <span className="cand-doc-missing">CV non fourni</span>
              )}

              {candidat.lettre_url ? (
                <a className="cand-btn-dl cand-btn-dl--lettre"
                  href={candidat.lettre_url} target="_blank" rel="noreferrer">
                  Lettre de motivation
                </a>
              ) : (
                <span className="cand-doc-missing">Lettre non fournie</span>
              )}

              {(candidat.diplomes || []).map((url, i) => (
                <a key={i} className="cand-btn-dl cand-btn-dl--diplome"
                  href={url} target="_blank" rel="noreferrer">
                  Diplôme {i + 1}
                </a>
              ))}
            </div>
          </div>

          {/* ── Tags recruteur ── */}
          <div className="cand-drawer-section">
            <div className="cand-drawer-section-title">Tags recruteur</div>
            <div className="cand-tags-list">
              {tags.map((t) => (
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
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
            />
          </div>

          {/* ── Notes recruteur ── */}
          <div className="cand-drawer-section">
            <div className="cand-drawer-section-title">Notes recruteur</div>
            <textarea
              className="cand-drawer-notes"
              placeholder="Ajoutez vos observations, retours d'entretien…"
              value={notes}
              onChange={handleNotes}
              rows={4}
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="cand-drawer-footer">
          <a href={`mailto:${candidat.email}`}
            className="cand-btn-action cand-btn-action--email">
            <i className="bi bi-envelope-fill" /> Envoyer un email
          </a>
          {candidat.telwhat && (
            <a
              href={`https://wa.me/${candidat.telwhat.replace(/\s/g, "").replace("+", "")}`}
              className="cand-btn-action cand-btn-action--whatsapp"
              target="_blank" rel="noreferrer"
            >
              <i className="bi bi-whatsapp" /> WhatsApp
            </a>
          )}
          <button
            className={`cand-btn-action cand-btn-action--save${isSaved ? " saved" : ""}${!dirty ? " cand-btn-action--disabled" : ""}`}
            onClick={handleSave}
            disabled={saving || !dirty}
          >
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
    <div className="cand-bulk-bar">
      <div className="cand-bulk-info">
        <i className="bi bi-check2-square" />
        <strong>{count}</strong> candidat{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
      </div>
      <div className="cand-bulk-actions">
        <div style={{ position: "relative" }} ref={ref}>
          <button className="cand-bulk-btn" onClick={() => setStatutOpen((p) => !p)}>
            <i className="bi bi-kanban" /> Changer statut
            <i className="bi bi-chevron-down" style={{ fontSize: 10 }} />
          </button>
          {statutOpen && (
            <div className="cand-bulk-dropdown">
              {STATUTS.map((s) => (
                <button key={s.value} className="cand-bulk-dropdown-item"
                  onClick={() => { onStatut(s.value); setStatutOpen(false); }}>
                  <span className={`cand-statut-dot ${s.color}`} />
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="cand-bulk-btn" onClick={onExport}>
          <i className="bi bi-file-earmark-excel-fill" /> Exporter la sélection
        </button>
        <button className="cand-bulk-btn cand-bulk-btn--clear" onClick={onClear}>
          <i className="bi bi-x" /> Désélectionner
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STATS BAR
───────────────────────────────────────────────────────── */
function StatsBar({ stats, total }) {
  const hommes     = stats?.hommes     ?? 0;
  const femmes     = stats?.femmes     ?? 0;
  const entretiens = stats?.entretiens ?? 0;
  const retenus    = stats?.retenus    ?? 0;

  return (
    <div className="cand-stats-bar">
      <div className="cand-stat-item">
        <span className="cand-stat-value">{total}</span>
        <span className="cand-stat-label">Total</span>
      </div>
      <div className="cand-stat-divider" />
      <div className="cand-stat-item">
        <span className="cand-stat-value cand-stat-value--blue">{hommes}</span>
        <span className="cand-stat-label">Hommes</span>
      </div>
      <div className="cand-stat-item">
        <span className="cand-stat-value cand-stat-value--pink">{femmes}</span>
        <span className="cand-stat-label">Femmes</span>
      </div>
      <div className="cand-stat-divider" />
      <div className="cand-stat-item">
        <span className="cand-stat-value cand-stat-value--orange">{entretiens}</span>
        <span className="cand-stat-label">Mes entretiens</span>
      </div>
      <div className="cand-stat-item">
        <span className="cand-stat-value cand-stat-value--green">{retenus}</span>
        <span className="cand-stat-label">Mes retenus</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COLONNES TABLEAU
───────────────────────────────────────────────────────── */
const COLUMNS = [
  { key: "id",          label: "Id",               sortable: true  },
  { key: "nom",         label: "Nom",              sortable: true  },
  { key: "prenoms",     label: "Prénom(s)",        sortable: true  },
  { key: "statut",      label: "Statut",           sortable: true  },
  { key: "email",       label: "Email",            sortable: true  },
  { key: "tel",         label: "Téléphone",        sortable: false },
  { key: "Niveau",      label: "Niveau",           sortable: true  },
  { key: "Niveau_A",    label: "Anglais",          sortable: true  },
  { key: "Secteur",     label: "Secteur",          sortable: true  },
  { key: "Genre",       label: "Genre",            sortable: true  },
  { key: "Commune",     label: "Commune",          sortable: true  },
  { key: "Quartier",    label: "Quartier",         sortable: false },
  { key: "Pays_N",      label: "Nationalité",      sortable: true  },
  { key: "Situation_M", label: "Sit. Matrimoniale",sortable: true  },
  { key: "Nombre_E",    label: "Enfants",          sortable: true  },
  { key: "_tags",       label: "Tags",             sortable: false },
  { key: "_cv",         label: "CV",               sortable: false },
  { key: "_lettre",     label: "Lettre",           sortable: false },
  { key: "_diplomes",   label: "Diplômes",         sortable: false },
];

/* ═══════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════ */
export default function Candidatheque() {
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
  const [selectedCandidat, setSelectedCandidat] = useState(null);

  /* ── Filtres ── */
  const [searchRaw,       setSearchRaw]       = useState("");
  const [filterStatut,    setFilterStatut]    = useState("");
  const [filterSecteur,   setFilterSecteur]   = useState("");
  const [filterNiveau,    setFilterNiveau]    = useState("");
  const [filterAnglais,   setFilterAnglais]   = useState("");
  const [filterGenre,     setFilterGenre]     = useState("");
  const [filterCommune,   setFilterCommune]   = useState("");
  const [filterQuartier,  setFilterQuartier]  = useState("");
  const search = useDebounce(searchRaw, 350);

  /* ── Tri ── */
  const [sortCol, setSortCol] = useState("id");
  const [sortDir, setSortDir] = useState("ASC");

  /* ── Pagination ── */
  const [page, setPage] = useState(1);
  const tableRef = useRef(null);

  /* ── Sélection ── */
  const [selectedIds, setSelectedIds] = useState(new Set());

  /* ── Reset page sur changement filtres ── */
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [search, filterStatut, filterSecteur, filterNiveau, filterAnglais,
      filterGenre, filterCommune, filterQuartier, sortCol, sortDir]);

  /* ── Fetch candidats ── */
  const {
    data: candidats,
    total,
    totalPages,
    stats,
    loading,
    error,
    refetch,
  } = useCandidats({
    search,
    filterStatut,
    filterSecteur,
    filterNiveau,
    filterAnglais,
    filterGenre,
    filterCommune,
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
      return <i className="bi bi-chevron-expand cand-sort-icon" />;
    return sortDir === "ASC"
      ? <i className="bi bi-chevron-up cand-sort-icon cand-sort-icon--active" />
      : <i className="bi bi-chevron-down cand-sort-icon cand-sort-icon--active" />;
  }

  /* ── Sélection ── */
  const allPageSelected =
    candidats.length > 0 && candidats.every((c) => selectedIds.has(c.id));

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allPageSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(candidats.map((c) => c.id)));
  }

  /* ── Actions groupées ── */
  async function bulkChangeStatut(statut) {
    const ids = [...selectedIds];
    for (const id of ids) {
      await saveMeta(id, { statut });
    }
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
    setFilterQuartier("");
  }

  const hasActiveFilters =
    searchRaw || filterStatut || filterSecteur || filterNiveau ||
    filterAnglais || filterGenre || filterCommune || filterQuartier;

  /* ── Candidat dans le drawer ── */
  const drawerCandidat = useMemo(
    () => candidats.find((c) => c.id === selectedCandidat?.id) ?? selectedCandidat,
    [candidats, selectedCandidat]
  );

  /* ── Session guard ── */
  if (!checked) {
    return (
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"center",
        height:"100vh",background:"#f4f6fa",flexDirection:"column",gap:16,
      }}>
        <div style={{
          width:40,height:40,border:"3px solid #e2e8f0",
          borderTop:"3px solid #1a7070",borderRadius:"50%",
          animation:"zen-spin 0.8s linear infinite",
        }}/>
        <style>{`@keyframes zen-spin{to{transform:rotate(360deg);}}`}</style>
        <span style={{color:"#93a4c3",fontSize:14}}>Vérification en cours…</span>
      </div>
    );
  }

  /* ── Rendu carte mobile ── */
  function renderCard(c) {
    const avatarColor = getAvatarColor(c.id);
    return (
      <div key={c.id} className="cand-mobile-card" onClick={() => setSelectedCandidat(c)}>
        <div className="cand-mobile-card__header">
          <label className="cand-mobile-card__check" onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" className="cand-checkbox"
              checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} />
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
            <span className={`cand-badge-anglais cand-badge-anglais--${c.Niveau_A}`}>
              {c.Niveau_A}
            </span>
          </div>
        </div>
        {(c.tags || []).length > 0 && (
          <div className="cand-mobile-card__tags">
            {c.tags.slice(0, 3).map((t) => (
              <span key={t} className="cand-tag cand-tag--sm">{t}</span>
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
          <div className="cand-page">

            {/* ── Titre ── */}
            <div className="cand-breadcrumb">
              <h1>Gestion des candidats</h1>
              <p>
                <a href="/securebackoffice/acceuil">
                  Bienvenue {entreprise?.nom ?? ""}
                </a>{" / "}
                <strong>Candidathèque générale</strong>
              </p>
            </div>

            {/* ── Stats bar ── */}
            <StatsBar stats={stats} total={total} />

            {/* ── Erreur chargement ── */}
            {error && (
              <div style={{
                display:"flex",alignItems:"center",gap:12,
                background:"#fff5f5",border:"1px solid #fed7d7",
                borderRadius:10,padding:"14px 20px",marginBottom:20,
                color:"#c53030",fontSize:14,
              }}>
                <i className="bi bi-exclamation-circle-fill" style={{fontSize:18,flexShrink:0}} />
                <span style={{flex:1}}>{error}</span>
                <button onClick={refetch} style={{
                  background:"#1a7070",color:"#fff",border:"none",
                  borderRadius:7,padding:"6px 14px",cursor:"pointer",fontSize:13,
                }}>Réessayer</button>
              </div>
            )}

            {/* ── Actions groupées ── */}
            <BulkActionBar
              count={selectedIds.size}
              onStatut={bulkChangeStatut}
              onExport={() => exportExcel(candidats.filter((c) => selectedIds.has(c.id)))}
              onClear={() => setSelectedIds(new Set())}
            />

            <div className="cand-card" ref={tableRef}>

              {/* ── Toolbar ── */}
              <div className="cand-toolbar">
                <div className="cand-search">
                  <i className="bi bi-search" />
                  <input
                    value={searchRaw}
                    onChange={(e) => setSearchRaw(e.target.value)}
                    placeholder="Nom, prénom, email, secteur…"
                  />
                  {searchRaw && (
                    <button className="cand-search-clear" onClick={() => setSearchRaw("")}>
                      <i className="bi bi-x" />
                    </button>
                  )}
                </div>
                <div className="cand-toolbar-right">
                  {hasActiveFilters && (
                    <button className="cand-btn-reset" onClick={resetFilters}>
                      <i className="bi bi-x-circle" />
                      <span>Réinitialiser</span>
                    </button>
                  )}
                  <button className="cand-btn-export" onClick={() => exportExcel(candidats)}
                    title={`Exporter ${total} candidat(s)`}>
                    <i className="bi bi-file-earmark-excel-fill" />
                    <span>Exporter ({total})</span>
                  </button>
                </div>
              </div>

              {/* ── Filtres ── */}
              <div className="cand-filters">
                <div className="cand-filter-group">
                  <label className="cand-filter-label">Statut pipeline</label>
                  <select className="cand-filter-select" value={filterStatut}
                    onChange={(e) => setFilterStatut(e.target.value)}>
                    <option value="">Tous les statuts</option>
                    {STATUTS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="cand-filter-group">
                  <label className="cand-filter-label">Secteur d'activité</label>
                  <select className="cand-filter-select" value={filterSecteur}
                    onChange={(e) => setFilterSecteur(e.target.value)}>
                    <option value="">Tous les secteurs</option>
                    {SECTEURS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="cand-filter-group">
                  <label className="cand-filter-label">Niveau académique</label>
                  <select className="cand-filter-select" value={filterNiveau}
                    onChange={(e) => setFilterNiveau(e.target.value)}>
                    <option value="">Tous les niveaux</option>
                    {NIVEAUX.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="cand-filter-group">
                  <label className="cand-filter-label">Niveau Anglais</label>
                  <select className="cand-filter-select" value={filterAnglais}
                    onChange={(e) => setFilterAnglais(e.target.value)}>
                    <option value="">Tous les niveaux</option>
                    {NIVEAUX_ANGLAIS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="cand-filter-group">
                  <label className="cand-filter-label">Genre</label>
                  <select className="cand-filter-select" value={filterGenre}
                    onChange={(e) => setFilterGenre(e.target.value)}>
                    <option value="">Tous les genres</option>
                    <option value="Homme">Homme</option>
                    <option value="Femme">Femme</option>
                  </select>
                </div>

                <div className="cand-filter-group">
                  <label className="cand-filter-label">Commune</label>
                  <select className="cand-filter-select" value={filterCommune}
                    onChange={(e) => { setFilterCommune(e.target.value); setFilterQuartier(""); }}>
                    <option value="">Toutes les communes</option>
                    {COMMUNES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
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

              {/* ── Tableau desktop ── */}
              <div className="cand-table-wrap">
                <table className="cand-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36, textAlign: "center" }}>
                        <input type="checkbox" className="cand-checkbox"
                          checked={allPageSelected} onChange={toggleSelectAll}
                          title="Tout sélectionner" disabled={loading} />
                      </th>
                      {COLUMNS.map((col) => (
                        <th key={col.key}
                          className={col.sortable ? "cand-th-sortable" : ""}
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
                    ) : candidats.length === 0 ? (
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
                    ) : (
                      candidats.map((c, idx) => {
                        const avatarColor = getAvatarColor(c.id);
                        return (
                          <tr key={c.id}
                            className={`cand-tr--clickable ${selectedIds.has(c.id) ? "cand-tr--selected" : ""} ${idx % 2 === 0 ? "" : "cand-tr--alt"}`}
                            onClick={() => setSelectedCandidat(c)}>
                            <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" className="cand-checkbox"
                                checked={selectedIds.has(c.id)}
                                onChange={() => toggleSelect(c.id)} />
                            </td>
                            <td className="cand-td-muted">{c.id}</td>
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
                            {/* ── Icône genre supprimée ── */}
                            <td>
                              <span className={`cand-badge-genre cand-badge-genre--${c.Genre?.toLowerCase()}`}>
                                {c.Genre}
                              </span>
                            </td>
                            <td className="cand-td-muted">{c.Commune}</td>
                            <td className="cand-td-muted">{c.Quartier}</td>
                            <td className="cand-td-muted">{c.Pays_N}</td>
                            <td className="cand-td-muted">{c.Situation_M}</td>
                            <td className="cand-td-muted" style={{ textAlign: "center" }}>
                              {c.Nombre_E}
                            </td>
                            {/* Tags */}
                            <td>
                              <div className="cand-tags-list cand-tags-list--inline">
                                {(c.tags || []).slice(0, 2).map((t) => (
                                  <span key={t} className="cand-tag cand-tag--sm">{t}</span>
                                ))}
                                {(c.tags || []).length > 2 && (
                                  <span className="cand-tag cand-tag--more">+{c.tags.length - 2}</span>
                                )}
                              </div>
                            </td>
                            {/* CV */}
                            <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                              {c.cv_url
                                ? <a className="cand-btn-dl cand-btn-dl--cv" href={c.cv_url}
                                    target="_blank" rel="noreferrer">
                                    <i className="bi bi-download" />
                                  </a>
                                : <span className="cand-td-muted">—</span>}
                            </td>
                            {/* Lettre */}
                            <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                              {c.lettre_url
                                ? <a className="cand-btn-dl cand-btn-dl--lettre" href={c.lettre_url}
                                    target="_blank" rel="noreferrer">
                                    <i className="bi bi-download" />
                                  </a>
                                : <span className="cand-td-muted">—</span>}
                            </td>
                            {/* Diplômes */}
                            <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                              {(c.diplomes || []).length > 0
                                ? <div className="cand-diplomes-list">
                                    {c.diplomes.map((url, i) => (
                                      <a key={i} className="cand-btn-dl cand-btn-dl--diplome"
                                        href={url} target="_blank" rel="noreferrer">
                                        <i className="bi bi-download" />
                                      </a>
                                    ))}
                                  </div>
                                : <span className="cand-td-muted">—</span>}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Cartes mobile ── */}
              <div className="cand-cards-mobile">
                {loading && (
                  <div style={{ padding: "30px 0", textAlign: "center", color: "#93a4c3" }}>
                    <i className="bi bi-arrow-repeat" style={{ fontSize: 24, animation: "zen-spin 0.8s linear infinite" }} />
                    <style>{`@keyframes zen-spin{to{transform:rotate(360deg);}}`}</style>
                  </div>
                )}
                {!loading && candidats.length === 0 && (
                  <div className="cand-empty"><p>Aucun candidat trouvé.</p></div>
                )}
                {!loading && candidats.map(renderCard)}
              </div>

              {/* ── Footer / Pagination ── */}
              <div className="cand-table-footer">
                <span className="cand-footer-info">
                  {loading ? (
                    <span>Chargement…</span>
                  ) : (
                    <>
                      Affichage{" "}
                      <strong>{total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</strong>
                      {" "}à{" "}
                      <strong>{Math.min(page * PAGE_SIZE, total)}</strong>
                      {" "}sur <strong>{total}</strong> candidat{total !== 1 ? "s" : ""}
                      {selectedIds.size > 0 && (
                        <span className="cand-footer-selected">
                          {" "}· {selectedIds.size} sélectionné(s)
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
            </div>
          </div>
        </main>
      </div>

      {/* ── Drawer fiche candidat ── */}
      {selectedCandidat && (
        <CandidatDrawer
          candidat={drawerCandidat}
          onClose={() => setSelectedCandidat(null)}
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
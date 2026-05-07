import { useState, useEffect, useRef, useCallback } from "react";
import './css/Modifier.css';
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

// ── Mock data (à remplacer par un appel API : GET /offres/:id) ──
const MOCK_OFFRE = {
  id: 1,
  titre: "Développeur Full Stack",
  description: "<p>Nous recherchons un développeur passionné pour rejoindre notre équipe dynamique.</p>",
  profil: "<p>Maîtrise de React, Node.js et des bases de données relationnelles.</p>",
  Date_pub: "2025-03-01",
  Date_lim_can: "2025-04-30",
  exp: "3ans",
  genre: "Homme/Femme",
  quali: "Licence",
  Exper: "Confirmé(e)",
  types_Off: "CDI",
  statuts: "Approuvé",
  fiche_poste_name: "fiche_poste_dev_fullstack.pdf",
};

// ── Helpers ───────────────────────────────────────────────
const isHtmlEmpty = (html) => {
  if (!html) return true;
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text.length === 0;
};

// ══════════════════════════════════════════════════════════
// ÉDITEUR WYSIWYG — identique à Offres.jsx
// ══════════════════════════════════════════════════════════

const FONT_SIZES = ["10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36"];
const FONT_FAMILIES = [
  { label: "Calibri",         value: "Calibri, sans-serif" },
  { label: "Arial",           value: "Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Georgia",         value: "Georgia, serif" },
  { label: "Verdana",         value: "Verdana, sans-serif" },
  { label: "Courier New",     value: "'Courier New', monospace" },
];
const COLORS = [
  "#000000","#434343","#666666","#999999","#b7b7b7","#cccccc","#d9d9d9","#ffffff",
  "#ff0000","#ff9900","#ffff00","#00ff00","#00ffff","#4a86e8","#0000ff","#9900ff",
  "#e60000","#ff6d00","#ffb900","#38761d","#1155cc","#1c4587","#20124d","#4a1942",
  "#cc0000","#e69138","#f1c232","#6aa84f","#3c78d8","#3d85c6","#674ea7","#a64d79",
];

function TBtn({ icon, title, onClick, active }) {
  return (
    <button
      type="button"
      className={`wrd-tbtn${active ? " wrd-tbtn--active" : ""}`}
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(e); }}
    >
      <i className={`bi bi-${icon}`} />
    </button>
  );
}

function TSep() {
  return <span className="wrd-tsep" />;
}

function TDropdown({ value, options, onChange, width }) {
  return (
    <select
      className="wrd-tselect"
      style={{ width }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  );
}

function ColorPicker({ onSelect, onClose }) {
  return (
    <div className="wrd-color-picker" onMouseDown={(e) => e.preventDefault()}>
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className="wrd-color-swatch"
          style={{ background: c }}
          title={c}
          onMouseDown={(e) => { e.preventDefault(); onSelect(c); onClose(); }}
        />
      ))}
    </div>
  );
}

function WordEditor({ label, placeholder, value, onChange, error, editorId }) {
  const editorRef    = useRef(null);
  const savedRange   = useRef(null);
  const [colorPicker, setColorPicker] = useState(null);
  const [fontSize,    setFontSize]    = useState("12");
  const [fontFamily,  setFontFamily]  = useState("Calibri, sans-serif");
  const [fmt, setFmt] = useState({});
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor,   setBgColor]   = useState("#ffff00");

  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = value;
    }
  }, []); // eslint-disable-line

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = useCallback((cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    refreshFmt();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const refreshFmt = () => {
    setFmt({
      bold:                document.queryCommandState("bold"),
      italic:              document.queryCommandState("italic"),
      underline:           document.queryCommandState("underline"),
      strikeThrough:       document.queryCommandState("strikeThrough"),
      justifyLeft:         document.queryCommandState("justifyLeft"),
      justifyCenter:       document.queryCommandState("justifyCenter"),
      justifyRight:        document.queryCommandState("justifyRight"),
      justifyFull:         document.queryCommandState("justifyFull"),
      insertOrderedList:   document.queryCommandState("insertOrderedList"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
    });
  };

  const applyFontSize = (val) => {
    setFontSize(val);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      document.execCommand("fontSize", false, "7");
      editorRef.current.querySelectorAll('font[size="7"]').forEach((el) => {
        el.removeAttribute("size");
        el.style.fontSize = `${val}px`;
      });
    }
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const applyFont = (val) => {
    setFontFamily(val);
    exec("fontName", val);
  };

  const applyTextColor = (color) => {
    setTextColor(color);
    restoreSelection();
    exec("foreColor", color);
  };

  const applyBgColor = (color) => {
    setBgColor(color);
    restoreSelection();
    exec("hiliteColor", color);
  };

  const insertLink = () => {
    const url = window.prompt("URL du lien :", "https://");
    if (url) exec("createLink", url);
  };

  const insertTable = () => {
    const rows = parseInt(window.prompt("Lignes :", "3"), 10) || 3;
    const cols = parseInt(window.prompt("Colonnes :", "3"), 10) || 3;
    let html = '<table class="wrd-table"><tbody>';
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) html += "<td>&nbsp;</td>";
      html += "</tr>";
    }
    html += "</tbody></table><p><br></p>";
    exec("insertHTML", html);
  };

  return (
    <div className="modifier-form-group" id={editorId}>
      <label className="modifier-form-label">
        {label} <span className="modifier-required-star">*</span>
      </label>

      <div
        className={`wrd-editor-wrap${error ? " wrd-editor-wrap--error" : ""}`}
        onClick={() => setColorPicker(null)}
      >
        {/* ── Barre d'outils ── */}
        <div className="wrd-toolbar" onMouseDown={(e) => e.preventDefault()}>

          <TBtn icon="arrow-counterclockwise" title="Annuler (Ctrl+Z)" onClick={() => exec("undo")} />
          <TBtn icon="arrow-clockwise"        title="Rétablir (Ctrl+Y)" onClick={() => exec("redo")} />
          <TSep />

          <TDropdown value={fontFamily} options={FONT_FAMILIES} onChange={applyFont} width={112} />
          <TDropdown value={fontSize} options={FONT_SIZES} onChange={applyFontSize} width={54} />
          <TSep />

          <TBtn icon="type-bold"          title="Gras (Ctrl+B)"      onClick={() => exec("bold")}          active={fmt.bold} />
          <TBtn icon="type-italic"        title="Italique (Ctrl+I)"  onClick={() => exec("italic")}        active={fmt.italic} />
          <TBtn icon="type-underline"     title="Souligné (Ctrl+U)"  onClick={() => exec("underline")}     active={fmt.underline} />
          <TBtn icon="type-strikethrough" title="Barré"              onClick={() => exec("strikeThrough")} active={fmt.strikeThrough} />
          <TSep />

          <div className="wrd-color-btn-wrap">
            <button
              type="button"
              className="wrd-color-btn"
              title="Couleur du texte"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setColorPicker((p) => p === "text" ? null : "text");
              }}
            >
              <i className="bi bi-fonts" />
              <span className="wrd-color-bar" style={{ background: textColor }} />
            </button>
            {colorPicker === "text" && (
              <ColorPicker onSelect={applyTextColor} onClose={() => setColorPicker(null)} />
            )}
          </div>

          <div className="wrd-color-btn-wrap">
            <button
              type="button"
              className="wrd-color-btn"
              title="Surlignage"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setColorPicker((p) => p === "bg" ? null : "bg");
              }}
            >
              <i className="bi bi-highlighter" />
              <span className="wrd-color-bar" style={{ background: bgColor }} />
            </button>
            {colorPicker === "bg" && (
              <ColorPicker onSelect={applyBgColor} onClose={() => setColorPicker(null)} />
            )}
          </div>
          <TSep />

          <TBtn icon="text-left"   title="Aligner à gauche" onClick={() => exec("justifyLeft")}   active={fmt.justifyLeft} />
          <TBtn icon="text-center" title="Centrer"           onClick={() => exec("justifyCenter")} active={fmt.justifyCenter} />
          <TBtn icon="text-right"  title="Aligner à droite" onClick={() => exec("justifyRight")}  active={fmt.justifyRight} />
          <TBtn icon="justify"     title="Justifier"         onClick={() => exec("justifyFull")}   active={fmt.justifyFull} />
          <TSep />

          <TBtn icon="list-ul"           title="Liste à puces"        onClick={() => exec("insertUnorderedList")} active={fmt.insertUnorderedList} />
          <TBtn icon="list-ol"           title="Liste numérotée"      onClick={() => exec("insertOrderedList")}   active={fmt.insertOrderedList} />
          <TBtn icon="text-indent-left"  title="Réduire le retrait"   onClick={() => exec("outdent")} />
          <TBtn icon="text-indent-right" title="Augmenter le retrait" onClick={() => exec("indent")} />
          <TSep />

          <TBtn icon="link-45deg" title="Insérer un lien"          onClick={insertLink} />
          <TBtn icon="table"      title="Insérer un tableau"       onClick={insertTable} />
          <TSep />
          <TBtn icon="eraser"     title="Effacer la mise en forme" onClick={() => { exec("removeFormat"); exec("formatBlock", "p"); }} />

        </div>

        {/* ── Zone de saisie ── */}
        <div
          ref={editorRef}
          className="wrd-editor-body"
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder || `Saisir ${label.toLowerCase()}...`}
          onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
          onKeyUp={refreshFmt}
          onMouseUp={refreshFmt}
          onSelect={refreshFmt}
          onFocus={refreshFmt}
        />
      </div>

      {error && (
        <span className="modifier-field-error">
          <i className="bi bi-exclamation-circle" /> {error}
        </span>
      )}
    </div>
  );
}

// ── Toast notification ────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`modifier-toast modifier-toast--${type}`}>
      <i className={`bi bi-${type === "success" ? "check-circle" : "exclamation-triangle"}`} />
      <span>{message}</span>
      <button className="modifier-toast-close" onClick={onClose}>×</button>
    </div>
  );
}

// ── Modal confirmation annulation ─────────────────────────
function ModalConfirmCancel({ onConfirm, onClose }) {
  return (
    <div className="modifier-overlay">
      <div className="modifier-confirm-modal">
        <div className="modifier-confirm-icon">
          <i className="bi bi-exclamation-triangle-fill" />
        </div>
        <h3>Annuler les modifications ?</h3>
        <p>Toutes les modifications non enregistrées seront perdues.</p>
        <div className="modifier-confirm-actions">
          <button className="modifier-btn-secondary" onClick={onClose}>
            Continuer l'édition
          </button>
          <button className="modifier-btn-danger" onClick={onConfirm}>
            Oui, annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PAGE MODIFIER
// ══════════════════════════════════════════════════════════
export default function Modifier() {
  useBootstrapIcons();

  // ── Responsive ───────────────────────────────────────────
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

  // ── États ────────────────────────────────────────────────
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);       // { message, type }
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isDirty,  setIsDirty]  = useState(false);

  const [form, setForm] = useState({
    titre: "",
    description: "",
    profil: "",
    Date_pub: "",
    Date_lim_can: "",
    exp: "",
    genre: "",
    Exper: "",
    quali: "",
    types_Off: "",
    statuts: "",
    fiche_poste: null,       // nouveau fichier (File object)
    fiche_poste_name: "",    // nom du fichier existant
  });

  const [errors, setErrors] = useState({});

  // ── Refs pour scroll vers erreur ─────────────────────────
  const fieldRefs = {
    titre:        useRef(null),
    description:  useRef(null),
    profil:       useRef(null),
    Date_pub:     useRef(null),
    Date_lim_can: useRef(null),
    exp:          useRef(null),
    genre:        useRef(null),
    Exper:        useRef(null),
    quali:        useRef(null),
    types_Off:    useRef(null),
    statuts:      useRef(null),
    fiche_poste:  useRef(null),
  };

  // ── Chargement initial (simulé — remplacer par fetch API) ─
  useEffect(() => {
    // Simuler un appel API : GET /api/offres/:id
    const timer = setTimeout(() => {
      setForm({
        titre:           MOCK_OFFRE.titre,
        description:     MOCK_OFFRE.description,
        profil:          MOCK_OFFRE.profil,
        Date_pub:        MOCK_OFFRE.Date_pub,
        Date_lim_can:    MOCK_OFFRE.Date_lim_can,
        exp:             MOCK_OFFRE.exp,
        genre:           MOCK_OFFRE.genre,
        Exper:           MOCK_OFFRE.Exper,
        quali:           MOCK_OFFRE.quali,
        types_Off:       MOCK_OFFRE.types_Off,
        statuts:         MOCK_OFFRE.statuts,
        fiche_poste:     null,
        fiche_poste_name: MOCK_OFFRE.fiche_poste_name,
      });
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // ── Handlers ─────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setIsDirty(true);
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0] || null;
    setForm((f) => ({ ...f, fiche_poste: file, fiche_poste_name: file ? file.name : f.fiche_poste_name }));
    setIsDirty(true);
    if (errors.fiche_poste) setErrors((prev) => ({ ...prev, fiche_poste: "" }));
  }

  function handleRemoveFile() {
    setForm((f) => ({ ...f, fiche_poste: null, fiche_poste_name: "" }));
    setIsDirty(true);
    setErrors((prev) => ({
      ...prev,
      fiche_poste: "La fiche de poste est obligatoire (PDF, DOC ou DOCX).",
    }));
  }

  // ── Validation ───────────────────────────────────────────
  function validate() {
    const newErrors = {};
    if (!form.titre.trim())
      newErrors.titre = "Le titre de l'offre est obligatoire.";
    if (isHtmlEmpty(form.description))
      newErrors.description = "La description de l'offre est obligatoire.";
    if (isHtmlEmpty(form.profil))
      newErrors.profil = "Le profil recherché est obligatoire.";
    if (!form.Date_pub)
      newErrors.Date_pub = "La date de publication est obligatoire.";
    if (!form.Date_lim_can)
      newErrors.Date_lim_can = "La date limite de candidature est obligatoire.";
    if (!form.exp)
      newErrors.exp = "Veuillez sélectionner l'expérience requise.";
    if (!form.genre)
      newErrors.genre = "Veuillez sélectionner le genre.";
    if (!form.Exper)
      newErrors.Exper = "Veuillez sélectionner le niveau d'expertise.";
    if (!form.quali)
      newErrors.quali = "Veuillez sélectionner la qualification requise.";
    if (!form.types_Off)
      newErrors.types_Off = "Veuillez sélectionner le type d'offre.";
    if (!form.statuts)
      newErrors.statuts = "Veuillez sélectionner le statut de l'offre.";
    if (!form.fiche_poste && !form.fiche_poste_name)
      newErrors.fiche_poste = "La fiche de poste est obligatoire (PDF, DOC ou DOCX).";
    return newErrors;
  }

  // ── Soumission ───────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorKey = Object.keys(newErrors)[0];
      const ref = fieldRefs[firstErrorKey];
      if (ref && ref.current) {
        ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSaving(true);
    try {
      // Remplacer par un vrai appel API : PUT /api/offres/:id
      await new Promise((res) => setTimeout(res, 900));
      setIsDirty(false);
      setToast({ message: "Offre mise à jour avec succès !", type: "success" });
    } catch {
      setToast({ message: "Une erreur est survenue. Veuillez réessayer.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  // ── Annulation ───────────────────────────────────────────
  function handleCancelClick() {
    if (isDirty) {
      setShowCancelModal(true);
    } else {
      window.history.back();
    }
  }

  // ── Écran de chargement ───────────────────────────────────
  if (loading) {
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
            <div className="modifier-page">
              <div className="modifier-skeleton-wrap">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="modifier-skeleton-block" style={{ animationDelay: `${i * 0.07}s` }} />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ── Rendu principal ───────────────────────────────────────
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
          <div className="modifier-page">

            {/* ── Breadcrumb ── */}
            <div className="modifier-breadcrumb">
              <h1>
                <i className="bi bi-pencil-square modifier-breadcrumb-icon" />
                Modifier l'offre
              </h1>
              <p>
                <a href="/acceuil">Bienvenue solibra</a>
                {" / "}
                <a href="/offres">Gestion des annonces</a>
                {" / "}
                Modifier
              </p>
            </div>

            {/* ── Card principale ── */}
            <div className="modifier-card">

              {/* En-tête de la card avec le titre actuel */}
              <div className="modifier-card-header">
                <div className="modifier-card-header-left">
                  <span className="modifier-card-label">Offre en cours d'édition</span>
                  <span className="modifier-card-title-preview">{form.titre || "—"}</span>
                </div>
                {isDirty && (
                  <span className="modifier-dirty-badge">
                    <i className="bi bi-circle-fill" /> Modifications non enregistrées
                  </span>
                )}
              </div>

              {/* ── Formulaire ── */}
              <form id="modifierForm" onSubmit={handleSubmit} className="modifier-form-body" noValidate>

                {/* Titre */}
                <div className="modifier-form-group" ref={fieldRefs.titre}>
                  <label className="modifier-form-label">
                    Titre de l'offre <span className="modifier-required-star">*</span>
                  </label>
                  <input
                    className={`modifier-form-control${errors.titre ? " modifier-input--error" : ""}`}
                    name="titre"
                    value={form.titre}
                    onChange={handleChange}
                    placeholder="Ex : Développeur Full Stack"
                  />
                  {errors.titre && (
                    <span className="modifier-field-error">
                      <i className="bi bi-exclamation-circle" /> {errors.titre}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div ref={fieldRefs.description}>
                  <WordEditor
                    editorId="editor-description"
                    label="Description de l'offre"
                    placeholder="Décrivez les missions, le contexte, les responsabilités..."
                    value={form.description}
                    error={errors.description}
                    onChange={(html) => {
                      setForm((f) => ({ ...f, description: html }));
                      setIsDirty(true);
                      if (errors.description) setErrors((prev) => ({ ...prev, description: "" }));
                    }}
                  />
                </div>

                {/* Profil */}
                <div ref={fieldRefs.profil}>
                  <WordEditor
                    editorId="editor-profil"
                    label="Profil recherché"
                    placeholder="Compétences requises, formations, qualités attendues..."
                    value={form.profil}
                    error={errors.profil}
                    onChange={(html) => {
                      setForm((f) => ({ ...f, profil: html }));
                      setIsDirty(true);
                      if (errors.profil) setErrors((prev) => ({ ...prev, profil: "" }));
                    }}
                  />
                </div>

                {/* Ligne 2 colonnes : dates */}
                <div className="modifier-row-2">
                  {/* Date de publication */}
                  <div className="modifier-form-group" ref={fieldRefs.Date_pub}>
                    <label className="modifier-form-label">
                      Date de publication <span className="modifier-required-star">*</span>
                    </label>
                    <input
                      type="date"
                      className={`modifier-form-control${errors.Date_pub ? " modifier-input--error" : ""}`}
                      name="Date_pub"
                      value={form.Date_pub}
                      onChange={handleChange}
                    />
                    {errors.Date_pub && (
                      <span className="modifier-field-error">
                        <i className="bi bi-exclamation-circle" /> {errors.Date_pub}
                      </span>
                    )}
                  </div>

                  {/* Date limite */}
                  <div className="modifier-form-group" ref={fieldRefs.Date_lim_can}>
                    <label className="modifier-form-label">
                      Date limite de candidature <span className="modifier-required-star">*</span>
                    </label>
                    <input
                      type="date"
                      className={`modifier-form-control${errors.Date_lim_can ? " modifier-input--error" : ""}`}
                      name="Date_lim_can"
                      value={form.Date_lim_can}
                      onChange={handleChange}
                    />
                    {errors.Date_lim_can && (
                      <span className="modifier-field-error">
                        <i className="bi bi-exclamation-circle" /> {errors.Date_lim_can}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ligne 3 colonnes : exp / genre / expertise */}
                <div className="modifier-row-3">
                  {/* Expérience */}
                  <div className="modifier-form-group" ref={fieldRefs.exp}>
                    <label className="modifier-form-label">
                      Expérience <span className="modifier-required-star">*</span>
                    </label>
                    <select
                      className={`modifier-form-control${errors.exp ? " modifier-input--error" : ""}`}
                      name="exp"
                      value={form.exp}
                      onChange={handleChange}
                    >
                      <option value="">Choisir...</option>
                      {["Aucune","1an","2ans","3ans","4ans","5ans","6ans","7ans","8ans","9ans","10ans"].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {errors.exp && (
                      <span className="modifier-field-error">
                        <i className="bi bi-exclamation-circle" /> {errors.exp}
                      </span>
                    )}
                  </div>

                  {/* Genre */}
                  <div className="modifier-form-group" ref={fieldRefs.genre}>
                    <label className="modifier-form-label">
                      Genre <span className="modifier-required-star">*</span>
                    </label>
                    <select
                      className={`modifier-form-control${errors.genre ? " modifier-input--error" : ""}`}
                      name="genre"
                      value={form.genre}
                      onChange={handleChange}
                    >
                      <option value="">Choisir...</option>
                      <option>Homme</option>
                      <option>Femme</option>
                      <option>Homme/Femme</option>
                    </select>
                    {errors.genre && (
                      <span className="modifier-field-error">
                        <i className="bi bi-exclamation-circle" /> {errors.genre}
                      </span>
                    )}
                  </div>

                  {/* Expertise */}
                  <div className="modifier-form-group" ref={fieldRefs.Exper}>
                    <label className="modifier-form-label">
                      Expertise <span className="modifier-required-star">*</span>
                    </label>
                    <select
                      className={`modifier-form-control${errors.Exper ? " modifier-input--error" : ""}`}
                      name="Exper"
                      value={form.Exper}
                      onChange={handleChange}
                    >
                      <option value="">Choisir...</option>
                      <option>Débutant(e)</option>
                      <option>Junior</option>
                      <option>Confirmé(e)</option>
                      <option>Expert(e)</option>
                    </select>
                    {errors.Exper && (
                      <span className="modifier-field-error">
                        <i className="bi bi-exclamation-circle" /> {errors.Exper}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ligne 3 colonnes : quali / type / statut */}
                <div className="modifier-row-3">
                  {/* Qualifications */}
                  <div className="modifier-form-group" ref={fieldRefs.quali}>
                    <label className="modifier-form-label">
                      Qualifications <span className="modifier-required-star">*</span>
                    </label>
                    <select
                      className={`modifier-form-control${errors.quali ? " modifier-input--error" : ""}`}
                      name="quali"
                      value={form.quali}
                      onChange={handleChange}
                    >
                      <option value="">Choisir...</option>
                      {["Certificat","BAC","BTS","Licence","Ingénieur","Master","Doctorat","Phd"].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {errors.quali && (
                      <span className="modifier-field-error">
                        <i className="bi bi-exclamation-circle" /> {errors.quali}
                      </span>
                    )}
                  </div>

                  {/* Type d'offre */}
                  <div className="modifier-form-group" ref={fieldRefs.types_Off}>
                    <label className="modifier-form-label">
                      Type d'offre <span className="modifier-required-star">*</span>
                    </label>
                    <select
                      className={`modifier-form-control${errors.types_Off ? " modifier-input--error" : ""}`}
                      name="types_Off"
                      value={form.types_Off}
                      onChange={handleChange}
                    >
                      <option value="">Choisir...</option>
                      {["CDD","CDI","Stages","Freelance","Volontariat","Mission temporaire"].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {errors.types_Off && (
                      <span className="modifier-field-error">
                        <i className="bi bi-exclamation-circle" /> {errors.types_Off}
                      </span>
                    )}
                  </div>

                  {/* Statut */}
                  <div className="modifier-form-group" ref={fieldRefs.statuts}>
                    <label className="modifier-form-label">
                      Statut <span className="modifier-required-star">*</span>
                    </label>
                    <select
                      className={`modifier-form-control${errors.statuts ? " modifier-input--error" : ""}`}
                      name="statuts"
                      value={form.statuts}
                      onChange={handleChange}
                    >
                      <option value="">Choisir...</option>
                      <option value="en attente">En attente</option>
                      <option value="Approuvé">Approuvé</option>
                    </select>
                    {errors.statuts && (
                      <span className="modifier-field-error">
                        <i className="bi bi-exclamation-circle" /> {errors.statuts}
                      </span>
                    )}
                  </div>
                </div>

                {/* Fiche de poste */}
                <div className="modifier-form-group" ref={fieldRefs.fiche_poste}>
                  <label className="modifier-form-label">
                    Fiche de poste <span className="modifier-required-star">*</span>
                  </label>

                  {/* Fichier existant */}
                  {form.fiche_poste_name && !form.fiche_poste && (
                    <div className="modifier-file-existing">
                      <i className="bi bi-file-earmark-text" />
                      <span className="modifier-file-existing-name">{form.fiche_poste_name}</span>
                      <span className="modifier-file-existing-tag">Fichier actuel</span>
                      <button
                        type="button"
                        className="modifier-file-remove"
                        onClick={handleRemoveFile}
                        title="Retirer le fichier"
                      >
                        <i className="bi bi-x-circle" />
                      </button>
                    </div>
                  )}

                  {/* Upload nouveau fichier */}
                  <div className={`modifier-file-upload${errors.fiche_poste ? " modifier-file-upload--error" : ""}`}>
                    <label
                      className={`modifier-file-label${errors.fiche_poste ? " modifier-file-label--error" : ""}`}
                      htmlFor="fiche_poste_input"
                    >
                      <i className="bi bi-paperclip" />
                      {form.fiche_poste
                        ? form.fiche_poste.name
                        : form.fiche_poste_name
                          ? "Remplacer le fichier (PDF, DOC, DOCX)"
                          : "Joindre un fichier (PDF, DOC, DOCX)"}
                    </label>
                    <input
                      id="fiche_poste_input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    {form.fiche_poste && (
                      <button
                        type="button"
                        className="modifier-file-remove-btn"
                        onClick={() => setForm((f) => ({ ...f, fiche_poste: null }))}
                        title="Retirer le nouveau fichier"
                      >×</button>
                    )}
                  </div>

                  {errors.fiche_poste && (
                    <span className="modifier-field-error">
                      <i className="bi bi-exclamation-circle" /> {errors.fiche_poste}
                    </span>
                  )}
                </div>

              </form>

              {/* ── Footer actions ── */}
              <div className="modifier-card-footer">
                <button
                  type="button"
                  className="modifier-btn-cancel"
                  onClick={handleCancelClick}
                  disabled={saving}
                >
                  <i className="bi bi-x-lg" /> Annuler
                </button>
                <button
                  type="submit"
                  form="modifierForm"
                  className="modifier-btn-save"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="modifier-spinner" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg" /> Enregistrer les modifications
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </main>
      </div>

      <footer className={`app-footer ${sidebarOpen ? "app-footer--shifted" : ""}`}>
        © 2025 Zenselekt · Propulsé par <strong>Empower talents &amp; careers</strong>. Tous droits réservés
      </footer>

      {/* ── Modal confirmation annulation ── */}
      {showCancelModal && (
        <ModalConfirmCancel
          onConfirm={() => { setShowCancelModal(false); window.history.back(); }}
          onClose={() => setShowCancelModal(false)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
}
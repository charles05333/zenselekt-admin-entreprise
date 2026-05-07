import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom"; // Ajout de Link et useNavigate
import './css/Offres.css';
import Header from "./component/Header";
import Navbar from "./component/Navbar";
import Swal from "sweetalert2";

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

const isHtmlEmpty = (html) => {
  if (!html) return true;
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return text.length === 0;
};

// ── Statut Badge ──────────────────────────────────────────
function StatutBadge({ statut }) {
  const isOk = statut === "Approuvé";
  return (
    <span className={`offres-statut ${isOk ? "offres-statut--ok" : "offres-statut--wait"}`}>
      <span className="offres-statut-dot" />
      {statut}
    </span>
  );
}

// ══════════════════════════════════════════════════════════
// ÉDITEUR WYSIWYG
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
    html += "</tbody><tr><p><br></p>";
    exec("insertHTML", html);
  };

  return (
    <div className="offres-form-group" id={editorId}>
      <label className="offres-form-label">
        {label} <span className="offres-required-star">*</span>
      </label>

      <div
        className={`wrd-editor-wrap${error ? " wrd-editor-wrap--error" : ""}`}
        onClick={() => setColorPicker(null)}
      >
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
            <button type="button" className="wrd-color-btn" title="Couleur du texte"
              onMouseDown={(e) => { e.preventDefault(); saveSelection(); setColorPicker((p) => p === "text" ? null : "text"); }}>
              <i className="bi bi-fonts" />
              <span className="wrd-color-bar" style={{ background: textColor }} />
            </button>
            {colorPicker === "text" && <ColorPicker onSelect={applyTextColor} onClose={() => setColorPicker(null)} />}
          </div>
          <div className="wrd-color-btn-wrap">
            <button type="button" className="wrd-color-btn" title="Surlignage"
              onMouseDown={(e) => { e.preventDefault(); saveSelection(); setColorPicker((p) => p === "bg" ? null : "bg"); }}>
              <i className="bi bi-highlighter" />
              <span className="wrd-color-bar" style={{ background: bgColor }} />
            </button>
            {colorPicker === "bg" && <ColorPicker onSelect={applyBgColor} onClose={() => setColorPicker(null)} />}
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
        <span className="offres-field-error">
          <i className="bi bi-exclamation-circle" /> {error}
        </span>
      )}
    </div>
  );
}

// ── Modal Ajout Offre ─────────────────────────────────────
function ModalAjoutOffre({ onClose, onAdd }) {
  const [form, setForm] = useState({
    titre: "", description: "", profil: "",
    Date_pub: "", Date_lim_can: "", exp: "",
    genre: "", Exper: "", quali: "",
    types_Off: "", statuts: "", fiche_poste: null,
  });
  const [errors, setErrors] = useState({});

  const fieldRefs = {
    titre: useRef(null), description: useRef(null), profil: useRef(null),
    Date_pub: useRef(null), Date_lim_can: useRef(null), exp: useRef(null),
    genre: useRef(null), Exper: useRef(null), quali: useRef(null),
    types_Off: useRef(null), statuts: useRef(null), fiche_poste: useRef(null),
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0] || null;
    setForm((f) => ({ ...f, fiche_poste: file }));
    if (errors.fiche_poste) setErrors((prev) => ({ ...prev, fiche_poste: "" }));
  }

  function validate() {
    const newErrors = {};
    if (!form.titre.trim()) newErrors.titre = "Le titre de l'offre est obligatoire.";
    if (isHtmlEmpty(form.description)) newErrors.description = "La description de l'offre est obligatoire.";
    if (isHtmlEmpty(form.profil)) newErrors.profil = "Le profil recherché est obligatoire.";
    if (!form.Date_pub) newErrors.Date_pub = "La date de publication est obligatoire.";
    if (!form.Date_lim_can) newErrors.Date_lim_can = "La date limite de candidature est obligatoire.";
    if (!form.exp) newErrors.exp = "Veuillez sélectionner l'expérience requise.";
    if (!form.genre) newErrors.genre = "Veuillez sélectionner le genre.";
    if (!form.Exper) newErrors.Exper = "Veuillez sélectionner le niveau d'expertise.";
    if (!form.quali) newErrors.quali = "Veuillez sélectionner la qualification requise.";
    if (!form.types_Off) newErrors.types_Off = "Veuillez sélectionner le type d'offre.";
    if (!form.statuts) newErrors.statuts = "Veuillez sélectionner le statut de l'offre.";
    if (!form.fiche_poste) newErrors.fiche_poste = "La fiche de poste est obligatoire (PDF, DOC ou DOCX).";
    return newErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorKey = Object.keys(newErrors)[0];
      const ref = fieldRefs[firstErrorKey];
      if (ref && ref.current) ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onAdd({ ...form, id: Date.now(), total_postulants: 0 });
    onClose();
  }

  return (
    <div className="offres-modal-overlay">
      <div className="offres-modal">
        <div className="offres-modal-header">
          <div className="offres-modal-header-inner">
            <h5>Ajouter une offre d'emploi</h5>
          </div>
          <button className="offres-modal-close" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <form id="offreForm" onSubmit={handleSubmit} className="offres-modal-body" noValidate>

          <div className="offres-form-group" ref={fieldRefs.titre}>
            <label className="offres-form-label">Titre de l'offre <span className="offres-required-star">*</span></label>
            <input
              className={`offres-form-control${errors.titre ? " offres-input--error" : ""}`}
              name="titre" value={form.titre} onChange={handleChange}
              placeholder="Ex : Développeur Full Stack"
            />
            {errors.titre && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.titre}</span>}
          </div>

          <div ref={fieldRefs.description}>
            <WordEditor editorId="editor-description" label="Description de l'offre"
              placeholder="Décrivez les missions, le contexte, les responsabilités..."
              value={form.description} error={errors.description}
              onChange={(html) => { setForm((f) => ({ ...f, description: html })); if (errors.description) setErrors((prev) => ({ ...prev, description: "" })); }}
            />
          </div>

          <div ref={fieldRefs.profil}>
            <WordEditor editorId="editor-profil" label="Profil recherché"
              placeholder="Compétences requises, formations, qualités attendues..."
              value={form.profil} error={errors.profil}
              onChange={(html) => { setForm((f) => ({ ...f, profil: html })); if (errors.profil) setErrors((prev) => ({ ...prev, profil: "" })); }}
            />
          </div>

          <div className="offres-form-row">
            <div className="offres-form-group" ref={fieldRefs.Date_pub}>
              <label className="offres-form-label">Date de publication <span className="offres-required-star">*</span></label>
              <input type="date" className={`offres-form-control${errors.Date_pub ? " offres-input--error" : ""}`}
                name="Date_pub" value={form.Date_pub} onChange={handleChange} />
              {errors.Date_pub && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.Date_pub}</span>}
            </div>
            <div className="offres-form-group" ref={fieldRefs.Date_lim_can}>
              <label className="offres-form-label">Date limite de candidature <span className="offres-required-star">*</span></label>
              <input type="date" className={`offres-form-control${errors.Date_lim_can ? " offres-input--error" : ""}`}
                name="Date_lim_can" value={form.Date_lim_can} onChange={handleChange} />
              {errors.Date_lim_can && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.Date_lim_can}</span>}
            </div>
          </div>

          <div className="offres-form-row">
            <div className="offres-form-group" ref={fieldRefs.exp}>
              <label className="offres-form-label">Expérience <span className="offres-required-star">*</span></label>
              <select className={`offres-form-control${errors.exp ? " offres-input--error" : ""}`} name="exp" value={form.exp} onChange={handleChange}>
                <option value="">Choisir l'expérience...</option>
                {["Aucune","1an","2ans","3ans","4ans","5ans","6ans","7ans","8ans","9ans","10ans"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              {errors.exp && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.exp}</span>}
            </div>
            <div className="offres-form-group" ref={fieldRefs.genre}>
              <label className="offres-form-label">Genre <span className="offres-required-star">*</span></label>
              <select className={`offres-form-control${errors.genre ? " offres-input--error" : ""}`} name="genre" value={form.genre} onChange={handleChange}>
                <option value="">Choisir le genre...</option>
                <option>Homme</option><option>Femme</option><option>Homme/Femme</option>
              </select>
              {errors.genre && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.genre}</span>}
            </div>
          </div>

          <div className="offres-form-row">
            <div className="offres-form-group" ref={fieldRefs.Exper}>
              <label className="offres-form-label">Expertise <span className="offres-required-star">*</span></label>
              <select className={`offres-form-control${errors.Exper ? " offres-input--error" : ""}`} name="Exper" value={form.Exper} onChange={handleChange}>
                <option value="">Choisir l'expertise...</option>
                <option>Débutant(e)</option><option>Junior</option><option>Confirmé(e)</option><option>Expert(e)</option>
              </select>
              {errors.Exper && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.Exper}</span>}
            </div>
            <div className="offres-form-group" ref={fieldRefs.quali}>
              <label className="offres-form-label">Qualifications <span className="offres-required-star">*</span></label>
              <select className={`offres-form-control${errors.quali ? " offres-input--error" : ""}`} name="quali" value={form.quali} onChange={handleChange}>
                <option value="">Choisir la qualification...</option>
                {["Certificat","BAC","BTS","Licence","Ingénieur","Master","Doctorat","Phd"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              {errors.quali && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.quali}</span>}
            </div>
          </div>

          <div className="offres-form-row">
            <div className="offres-form-group" ref={fieldRefs.types_Off}>
              <label className="offres-form-label">Type d'offre <span className="offres-required-star">*</span></label>
              <select className={`offres-form-control${errors.types_Off ? " offres-input--error" : ""}`} name="types_Off" value={form.types_Off} onChange={handleChange}>
                <option value="">Choisir le type...</option>
                {["CDD","CDI","Stages","Freelance","Volontariat","Mission temporaire"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
              {errors.types_Off && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.types_Off}</span>}
            </div>
            <div className="offres-form-group" ref={fieldRefs.statuts}>
              <label className="offres-form-label">Statut <span className="offres-required-star">*</span></label>
              <select className={`offres-form-control${errors.statuts ? " offres-input--error" : ""}`} name="statuts" value={form.statuts} onChange={handleChange}>
                <option value="">Choisir le statut...</option>
                <option value="en attente">En attente</option>
                <option value="Approuvé">Approuvé</option>
              </select>
              {errors.statuts && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.statuts}</span>}
            </div>
          </div>

          <div className="offres-form-group" ref={fieldRefs.fiche_poste}>
            <label className="offres-form-label">Fiche de poste <span className="offres-required-star">*</span></label>
            <div className={`offres-file-upload${errors.fiche_poste ? " offres-file-upload--error" : ""}`}>
              <label className={`offres-file-label${errors.fiche_poste ? " offres-file-label--error" : ""}`} htmlFor="fiche_poste_input">
                <i className="bi bi-paperclip" />
                {form.fiche_poste ? form.fiche_poste.name : "Joindre un fichier (PDF, DOC, DOCX)"}
              </label>
              <input id="fiche_poste_input" type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={handleFileChange} />
              {form.fiche_poste && (
                <button type="button" className="offres-file-remove"
                  onClick={() => { setForm((f) => ({ ...f, fiche_poste: null })); setErrors((prev) => ({ ...prev, fiche_poste: "La fiche de poste est obligatoire (PDF, DOC ou DOCX)." })); }}
                  title="Retirer le fichier">×</button>
              )}
            </div>
            {errors.fiche_poste && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.fiche_poste}</span>}
          </div>

        </form>

        <div className="offres-modal-footer">
          <button className="offres-btn-cancel" onClick={onClose}>Annuler</button>
          <button type="submit" form="offreForm" className="offres-btn-save">
            <i className="bi bi-check2" /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Composant Pagination ──────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const range = [];
  for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) range.push(i);

  pages.push(
    <button key={1} className={`offres-page-num${page === 1 ? " offres-page-num--active" : ""}`} onClick={() => onChange(1)}>1</button>
  );
  if (range[0] > 2) pages.push(<span key="el1" className="offres-page-ellipsis">…</span>);
  range.forEach((n) =>
    pages.push(
      <button key={n} className={`offres-page-num${page === n ? " offres-page-num--active" : ""}`} onClick={() => onChange(n)}>{n}</button>
    )
  );
  if (range[range.length - 1] < totalPages - 1) pages.push(<span key="el2" className="offres-page-ellipsis">…</span>);
  if (totalPages > 1) pages.push(
    <button key={totalPages} className={`offres-page-num${page === totalPages ? " offres-page-num--active" : ""}`} onClick={() => onChange(totalPages)}>{totalPages}</button>
  );

  return (
    <div className="offres-pagination">
      <button className="offres-page-btn" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} aria-label="Page précédente">
        <i className="bi bi-chevron-left" /><span className="offres-page-label">Précédent</span>
      </button>
      {pages}
      <button className="offres-page-btn" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label="Page suivante">
        <span className="offres-page-label">Suivant</span><i className="bi bi-chevron-right" />
      </button>
    </div>
  );
}

// ── Carte Mobile (CORRIGÉE) ──────────────────────────────
function MobileCard({ o, onDelete, onCopy, copied }) {
  const offreUrl = `https://zenselekt.com/Talents/JobsID.php?id=${o.id}`;
  const liUrl    = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(offreUrl)}`;
  const waUrl    = `https://wa.me/?text=${encodeURIComponent("Découvrez cette offre : " + o.titre + " - " + offreUrl)}`;

  return (
    <div className="offres-mobile-card">
      {/* En-tête */}
      <div className="offres-mobile-card__header">
        <div>
          <div className="offres-mobile-card__title">{o.titre}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <StatutBadge statut={o.statuts} />
            <span className="offres-type-chip">{o.types_Off}</span>
          </div>
        </div>
        <span className="offres-postulants-badge" title="Postulants">{o.total_postulants}</span>
      </div>

      {/* Grille infos */}
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

      {/* Footer */}
      <div className="offres-mobile-card__footer">
        {/* Partage - LIENS EXTERNES (garder <a>) */}
        <div className="offres-share">
          <a href={liUrl} target="_blank" rel="noreferrer" className="linkedin" title="LinkedIn">
            <i className="bi bi-linkedin" />
          </a>
          <a href={waUrl} target="_blank" rel="noreferrer" className="whatsapp" title="WhatsApp">
            <i className="bi bi-whatsapp" />
          </a>
          <button
            className={`offres-copy-btn ${copied === o.id ? "copied" : ""}`}
            onClick={() => onCopy(o.id)}
            title="Copier le lien"
          >
            <i className={`bi ${copied === o.id ? "bi-check2" : "bi-link-45deg"}`} />
          </button>
        </div>

        {/* Actions - LIENS INTERNES (corrigés avec Link) */}
        <div className="offres-actions">
          <Link
            to={`/postulants?event_id=${o.id}&poste=${encodeURIComponent(o.titre)}`}
            title="Voir les postulants"
            className="offres-action-btn"
          >
            <i className="bi bi-person-lines-fill" />
          </Link>
          <Link
            to={`/modifier/${o.id}`}
            title="Modifier"
            className="offres-action-btn offres-action-btn--edit"
          >
            <i className="bi bi-pencil-square" />
          </Link>
          <button
            className="offres-action-btn offres-action-btn--del offres-del-btn"
            onClick={() => onDelete(o.id, o.titre)}
            title="Supprimer"
          >
            <i className="bi bi-trash3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page Offres (CORRIGÉE) ────────────────────────────────
export default function Offres() {
  useBootstrapIcons();
  const navigate = useNavigate(); // Pour navigation programmatique si besoin

  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isMobile = width <= 768;
  const [sidebarOpen, setSidebarOpen] = useState(width > 768);
  useEffect(() => { if (width <= 768) setSidebarOpen(false); }, [width]);

  const [offres, setOffres]       = useState(MOCK_OFFRES);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]       = useState("");
  const [copied, setCopied]       = useState(null);
  const [page, setPage]           = useState(1);

  useEffect(() => { setPage(1); }, [search]);

  function handleAdd(offre) { setOffres((prev) => [offre, ...prev]); }

  // ── Suppression avec SweetAlert2 ─────────────────────────
  async function handleDelete(id, titre) {
    const result = await Swal.fire({
      title: "Supprimer l'offre ?",
      html: `L'offre <strong>${titre}</strong> sera supprimée définitivement.<br>Cette action est irréversible.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#6B7280",
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup:         "swal-zenselekt-popup",
        title:         "swal-zenselekt-title",
        htmlContainer: "swal-zenselekt-html",
        confirmButton: "swal-zenselekt-confirm",
        cancelButton:  "swal-zenselekt-cancel",
      },
    });

    if (result.isConfirmed) {
      setOffres((prev) => prev.filter((o) => o.id !== id));
      Swal.fire({
        title: "Supprimée !",
        text: "L'offre a été supprimée avec succès.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: "swal-zenselekt-popup",
          title: "swal-zenselekt-title",
        },
      });
    }
  }

  function handleCopy(id) {
    const url = `https://zenselekt.com/Talents/JobsID.php?id=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const filtered   = offres.filter((o) => o.titre.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tableRef = useRef(null);
  function handlePageChange(newPage) {
    setPage(newPage);
    if (tableRef.current) tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="app">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((prev) => !prev)} isMobile={isMobile} />
      <div className="layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>
          <div className="offres-page">

            <div className="offres-breadcrumb">
              <div className="offres-breadcrumb-top">
                <h1>Gestion des Offres</h1>
                <div className="offres-count-pill">
                  <span>{filtered.length}</span> offre{filtered.length !== 1 ? "s" : ""}
                </div>
              </div>
              {/* CORRECTION : lien breadcrumb avec Link */}
              <p><Link to="/acceuil">Bienvenue solibra</Link>{" / "}Gestion des annonces</p>
            </div>

            <div className="offres-card" ref={tableRef}>
              <div className="offres-toolbar">
                <div className="offres-search">
                  <i className="bi bi-search" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une offre..." />
                  {search && (
                    <button className="offres-search-clear" onClick={() => setSearch("")} title="Effacer">
                      <i className="bi bi-x" />
                    </button>
                  )}
                </div>
                <button className="offres-btn-add" onClick={() => setShowModal(true)}>
                  <i className="bi bi-plus-lg" />
                  <span>Ajouter une offre</span>
                </button>
              </div>

              {/* ── TABLE desktop (CORRIGÉE) ── */}
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={12}>
                          <div className="offres-empty">
                            <div className="offres-empty-icon"><i className="bi bi-inbox" /></div>
                            <p>Aucune offre trouvée.</p>
                            {search && <span>Essayez un terme de recherche différent.</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                    {paginated.map((o, idx) => {
                      const offreUrl = `https://zenselekt.com/Talents/JobsID.php?id=${o.id}`;
                      const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(offreUrl)}`;
                      const waUrl = `https://wa.me/?text=${encodeURIComponent("Découvrez cette offre : " + o.titre + " - " + offreUrl)}`;
                      return (
                        <tr key={o.id} style={{ animationDelay: `${idx * 40}ms` }}>
                          <td className="offres-td-titre">{o.titre}</td>
                          <td style={{ textAlign: "center" }}>
                            <span className="offres-postulants-badge">{o.total_postulants}</span>
                          </td>
                          <td>
                            <div className="offres-share">
                              <a href={liUrl} target="_blank" rel="noreferrer" className="linkedin" title="LinkedIn">
                                <i className="bi bi-linkedin" />
                              </a>
                              <a href={waUrl} target="_blank" rel="noreferrer" className="whatsapp" title="WhatsApp">
                                <i className="bi bi-whatsapp" />
                              </a>
                              <button className={`offres-copy-btn ${copied === o.id ? "copied" : ""}`} onClick={() => handleCopy(o.id)} title="Copier le lien">
                                <i className={`bi ${copied === o.id ? "bi-check2" : "bi-link-45deg"}`} />
                              </button>
                            </div>
                          </td>
                          <td className="offres-td-muted">{formatDate(o.Date_pub)}</td>
                          <td className="offres-td-muted">{formatDate(o.Date_lim_can)}</td>
                          <td className="offres-td-muted">{o.exp}</td>
                          <td className="offres-td-muted">{o.genre}</td>
                          <td className="offres-td-muted">{o.quali}</td>
                          <td className="offres-td-muted">{o.Exper}</td>
                          <td><StatutBadge statut={o.statuts} /></td>
                          <td>
                            <span className="offres-type-chip">{o.types_Off}</span>
                          </td>
                          {/* CORRECTION : actions avec Link */}
                          <td>
                            <div className="offres-actions">
                              <Link
                                to={`/postulants?event_id=${o.id}&poste=${encodeURIComponent(o.titre)}`}
                                title="Voir les postulants"
                                className="offres-action-btn"
                              >
                                <i className="bi bi-person-lines-fill" />
                              </Link>
                              <Link
                                to={`/modifier/${o.id}`}
                                title="Modifier"
                                className="offres-action-btn offres-action-btn--edit"
                              >
                                <i className="bi bi-pencil-square" />
                              </Link>
                              <button
                                className="offres-action-btn offres-action-btn--del offres-del-btn"
                                onClick={() => handleDelete(o.id, o.titre)}
                                title="Supprimer"
                              >
                                <i className="bi bi-trash3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── CARTES mobile ── */}
              <div className="offres-cards-mobile">
                {paginated.length === 0 ? (
                  <div className="offres-empty">
                    <div className="offres-empty-icon"><i className="bi bi-inbox" /></div>
                    <p>Aucune offre trouvée.</p>
                    {search && <span>Essayez un terme de recherche différent.</span>}
                  </div>
                ) : (
                  paginated.map((o) => (
                    <MobileCard
                      key={o.id}
                      o={o}
                      onDelete={handleDelete}
                      onCopy={handleCopy}
                      copied={copied}
                    />
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

      {showModal && <ModalAjoutOffre onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}
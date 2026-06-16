import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import './css/Offres.css';
import Header from "./component/Header";
import Navbar from "./component/Navbar";
import Swal from "sweetalert2";
import { useSessionGuard } from "./component/useSessionGuard";

/* ─────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────── */
const API_BASE  = "/securebackoffice/backsecurebackoffice/offres.php";
const PAGE_SIZE = 20;

// URL de redirection en cas de session expirée
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
   HOOK — chargement des offres depuis l'API
───────────────────────────────────────────────────────── */
function useOffres() {
  const [offres, setOffres]   = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchOffres = useCallback(async (page = 1, search = "") => {
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

      setOffres(json.data.offres ?? []);
      setTotal(json.data.total  ?? 0);
    } catch (err) {
      setError(err.message || "Erreur inattendue.");
      setOffres([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { offres, setOffres, total, loading, error, fetchOffres };
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

const isHtmlEmpty = (html) => {
  if (!html) return true;
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length === 0;
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

/* ═══════════════════════════════════════════════════════════
   WYSIWYG EDITOR
═══════════════════════════════════════════════════════════ */
const FONT_SIZES    = ["10","11","12","14","16","18","20","24","28","32","36"];
const FONT_FAMILIES = [
  { label:"Calibri",          value:"Calibri, sans-serif" },
  { label:"Arial",            value:"Arial, sans-serif" },
  { label:"Times New Roman",  value:"'Times New Roman', serif" },
  { label:"Georgia",          value:"Georgia, serif" },
  { label:"Verdana",          value:"Verdana, sans-serif" },
  { label:"Courier New",      value:"'Courier New', monospace" },
];
const COLORS = [
  "#000000","#434343","#666666","#999999","#b7b7b7","#cccccc","#d9d9d9","#ffffff",
  "#ff0000","#ff9900","#ffff00","#00ff00","#00ffff","#4a86e8","#0000ff","#9900ff",
  "#e60000","#ff6d00","#ffb900","#38761d","#1155cc","#1c4587","#20124d","#4a1942",
  "#cc0000","#e69138","#f1c232","#6aa84f","#3c78d8","#3d85c6","#674ea7","#a64d79",
];

function TBtn({ icon, title, onClick, active }) {
  return (
    <button type="button" className={`wrd-tbtn${active ? " wrd-tbtn--active" : ""}`}
      title={title} onMouseDown={(e) => { e.preventDefault(); onClick(e); }}>
      <i className={`bi bi-${icon}`} />
    </button>
  );
}
function TSep() { return <span className="wrd-tsep" />; }
function TDropdown({ value, options, onChange, width }) {
  return (
    <select className="wrd-tselect" style={{ width }} value={value}
      onChange={(e) => onChange(e.target.value)} onMouseDown={(e) => e.stopPropagation()}>
      {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}
function ColorPicker({ onSelect, onClose }) {
  return (
    <div className="wrd-color-picker" onMouseDown={(e) => e.preventDefault()}>
      {COLORS.map((c) => (
        <button key={c} type="button" className="wrd-color-swatch" style={{ background: c }}
          title={c} onMouseDown={(e) => { e.preventDefault(); onSelect(c); onClose(); }} />
      ))}
    </div>
  );
}

function WordEditor({ label, placeholder, value, onChange, error, editorId }) {
  const editorRef  = useRef(null);
  const savedRange = useRef(null);
  const [colorPicker, setColorPicker] = useState(null);
  const [fontSize,    setFontSize]    = useState("12");
  const [fontFamily,  setFontFamily]  = useState("Calibri, sans-serif");
  const [fmt,         setFmt]         = useState({});
  const [textColor,   setTextColor]   = useState("#000000");
  const [bgColor,     setBgColor]     = useState("#ffff00");

  useEffect(() => {
    if (editorRef.current && value) editorRef.current.innerHTML = value;
  }, []); // eslint-disable-line

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreSelection = () => {
    const sel = window.getSelection();
    if (savedRange.current && sel) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
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
        el.removeAttribute("size"); el.style.fontSize = `${val}px`;
      });
    }
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };
  const applyFont      = (val) => { setFontFamily(val); exec("fontName", val); };
  const applyTextColor = (c)   => { setTextColor(c); restoreSelection(); exec("foreColor", c); };
  const applyBgColor   = (c)   => { setBgColor(c);   restoreSelection(); exec("hiliteColor", c); };
  const insertLink     = ()    => { const u = window.prompt("URL du lien :", "https://"); if (u) exec("createLink", u); };
  const insertTable    = ()    => {
    const rows = parseInt(window.prompt("Lignes :", "3"), 10) || 3;
    const cols = parseInt(window.prompt("Colonnes :", "3"), 10) || 3;
    let html = '<table class="wrd-table"><tbody>';
    for (let r = 0; r < rows; r++) { html += "<tr>"; for (let c = 0; c < cols; c++) html += "<td>&nbsp;</td>"; html += "</tr>"; }
    html += "</tbody><tr><p><br></p>";
    exec("insertHTML", html);
  };

  return (
    <div className="offres-form-group" id={editorId}>
      <label className="offres-form-label">{label} <span className="offres-required-star">*</span></label>
      <div className={`wrd-editor-wrap${error ? " wrd-editor-wrap--error" : ""}`} onClick={() => setColorPicker(null)}>
        <div className="wrd-toolbar" onMouseDown={(e) => e.preventDefault()}>
          <TBtn icon="arrow-counterclockwise" title="Annuler"   onClick={() => exec("undo")} />
          <TBtn icon="arrow-clockwise"        title="Rétablir"  onClick={() => exec("redo")} />
          <TSep />
          <TDropdown value={fontFamily} options={FONT_FAMILIES} onChange={applyFont} width={112} />
          <TDropdown value={fontSize}   options={FONT_SIZES}    onChange={applyFontSize} width={54} />
          <TSep />
          <TBtn icon="type-bold"          title="Gras"      onClick={() => exec("bold")}          active={fmt.bold} />
          <TBtn icon="type-italic"        title="Italique"  onClick={() => exec("italic")}        active={fmt.italic} />
          <TBtn icon="type-underline"     title="Souligné"  onClick={() => exec("underline")}     active={fmt.underline} />
          <TBtn icon="type-strikethrough" title="Barré"     onClick={() => exec("strikeThrough")} active={fmt.strikeThrough} />
          <TSep />
          <div className="wrd-color-btn-wrap">
            <button type="button" className="wrd-color-btn" title="Couleur du texte"
              onMouseDown={(e) => { e.preventDefault(); saveSelection(); setColorPicker((p) => p === "text" ? null : "text"); }}>
              <i className="bi bi-fonts" /><span className="wrd-color-bar" style={{ background: textColor }} />
            </button>
            {colorPicker === "text" && <ColorPicker onSelect={applyTextColor} onClose={() => setColorPicker(null)} />}
          </div>
          <div className="wrd-color-btn-wrap">
            <button type="button" className="wrd-color-btn" title="Surlignage"
              onMouseDown={(e) => { e.preventDefault(); saveSelection(); setColorPicker((p) => p === "bg" ? null : "bg"); }}>
              <i className="bi bi-highlighter" /><span className="wrd-color-bar" style={{ background: bgColor }} />
            </button>
            {colorPicker === "bg" && <ColorPicker onSelect={applyBgColor} onClose={() => setColorPicker(null)} />}
          </div>
          <TSep />
          <TBtn icon="text-left"   title="Gauche"    onClick={() => exec("justifyLeft")}   active={fmt.justifyLeft} />
          <TBtn icon="text-center" title="Centrer"   onClick={() => exec("justifyCenter")} active={fmt.justifyCenter} />
          <TBtn icon="text-right"  title="Droite"    onClick={() => exec("justifyRight")}  active={fmt.justifyRight} />
          <TBtn icon="justify"     title="Justifier" onClick={() => exec("justifyFull")}   active={fmt.justifyFull} />
          <TSep />
          <TBtn icon="list-ul"           title="Liste à puces"     onClick={() => exec("insertUnorderedList")} active={fmt.insertUnorderedList} />
          <TBtn icon="list-ol"           title="Liste numérotée"   onClick={() => exec("insertOrderedList")}   active={fmt.insertOrderedList} />
          <TBtn icon="text-indent-left"  title="Réduire retrait"   onClick={() => exec("outdent")} />
          <TBtn icon="text-indent-right" title="Augmenter retrait" onClick={() => exec("indent")} />
          <TSep />
          <TBtn icon="link-45deg" title="Lien"    onClick={insertLink} />
          <TBtn icon="table"      title="Tableau" onClick={insertTable} />
          <TSep />
          <TBtn icon="eraser" title="Effacer mise en forme"
            onClick={() => { exec("removeFormat"); exec("formatBlock", "p"); }} />
        </div>
        <div ref={editorRef} className="wrd-editor-body" contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder || `Saisir ${label.toLowerCase()}...`}
          onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
          onKeyUp={refreshFmt} onMouseUp={refreshFmt} onSelect={refreshFmt} onFocus={refreshFmt} />
      </div>
      {error && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {error}</span>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MODAL AJOUT OFFRE
═══════════════════════════════════════════════════════════ */
function ModalAjoutOffre({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    titre: "", description: "", profil: "",
    Date_pub: "", Date_lim_can: "", exp: "",
    genre: "", Exper: "", quali: "",
    types_Off: "", fiche_poste: null,
  });
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

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
    fiche_poste:  useRef(null),
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  }
  function handleFileChange(e) {
    const file = e.target.files[0] || null;
    setForm((f) => ({ ...f, fiche_poste: file }));
    if (errors.fiche_poste) setErrors((p) => ({ ...p, fiche_poste: "" }));
  }

  function validate() {
    const e = {};
    if (!form.titre.trim())            e.titre        = "Le titre est obligatoire.";
    if (isHtmlEmpty(form.description)) e.description  = "La description est obligatoire.";
    if (isHtmlEmpty(form.profil))      e.profil       = "Le profil est obligatoire.";
    if (!form.Date_pub)                e.Date_pub     = "La date de publication est obligatoire.";
    if (!form.Date_lim_can)            e.Date_lim_can = "La date limite est obligatoire.";
    if (!form.exp)                     e.exp          = "Veuillez sélectionner l'expérience.";
    if (!form.genre)                   e.genre        = "Veuillez sélectionner le genre.";
    if (!form.Exper)                   e.Exper        = "Veuillez sélectionner l'expertise.";
    if (!form.quali)                   e.quali        = "Veuillez sélectionner la qualification.";
    if (!form.types_Off)               e.types_Off    = "Veuillez sélectionner le type d'offre.";
    if (!form.fiche_poste)             e.fiche_poste  = "La fiche de poste est obligatoire (PDF, DOC ou DOCX).";
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      fieldRefs[firstKey]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);

    const fd = new FormData();
    fd.append("titre",        form.titre.trim());
    fd.append("description",  form.description);
    fd.append("profil",       form.profil);
    fd.append("Date_pub",     form.Date_pub);
    fd.append("Date_lim_can", form.Date_lim_can);
    fd.append("exp",          form.exp);
    fd.append("genre",        form.genre);
    fd.append("Exper",        form.Exper);
    fd.append("quali",        form.quali);
    fd.append("types_Off",    form.types_Off);
    if (form.fiche_poste) fd.append("fiche_poste", form.fiche_poste);

    try {
      const res  = await secureFetch(`${API_BASE}?action=create`, { method: "POST", body: fd });

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

      if (res.ok && json.success) {
        onClose();
        await Swal.fire({
          icon: "success",
          title: "Offre soumise !",
          html: `
            <div style="text-align:left;font-size:14px;line-height:1.8;color:#3d4350;">
              <p style="margin:0 0 12px;">Votre offre <strong style="color:#1a7070;">« ${form.titre.trim()} »</strong> a bien été envoyée.</p>
              <div style="background:#f0fafa;border-radius:6px;padding:14px 16px;font-size:13px;">
                <p style="margin:0 0 8px;font-weight:700;color:#0a4f4f;">Prochaines étapes :</p>
                <ul style="margin:0;padding-left:18px;color:#3d4350;line-height:2;">
                  <li>Votre offre est <strong>en attente de validation</strong></li>
                  <li>Vous serez <strong>notifié par e-mail</strong> après approbation</li>
                  <li>Si des profils correspondent, un <strong>fichier Excel</strong> des candidats compatibles vous sera transmis</li>
                </ul>
              </div>
            </div>`,
          confirmButtonText: "Compris !",
          confirmButtonColor: "#1a7070",
          customClass: { popup: "swal-zenselekt-popup" },
        });
        onSuccess?.();
      } else {
        Swal.fire({
          icon: "error", title: "Erreur",
          text: json.message || "Une erreur est survenue.",
          confirmButtonColor: "#1a7070",
        });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur réseau", text: err.message, confirmButtonColor: "#1a7070" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="offres-modal-overlay">
      <div className="offres-modal">
        <div className="offres-modal-header">
          <div className="offres-modal-header-inner">
            <h5>Ajouter une offre d'emploi</h5>
          </div>
          <button className="offres-modal-close" onClick={onClose} disabled={submitting}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <form id="offreForm" onSubmit={handleSubmit} className="offres-modal-body" noValidate>

          <div className="offres-statut-info-banner">
            <i className="bi bi-info-circle-fill" />
            <span>Le statut est automatiquement défini à <strong>En attente</strong> lors de la création.</span>
          </div>

          <div className="offres-form-group" ref={fieldRefs.titre}>
            <label className="offres-form-label">Titre de l'offre <span className="offres-required-star">*</span></label>
            <input className={`offres-form-control${errors.titre ? " offres-input--error" : ""}`}
              name="titre" value={form.titre} onChange={handleChange}
              placeholder="Ex : Développeur Full Stack" disabled={submitting} />
            {errors.titre && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.titre}</span>}
          </div>

          <div ref={fieldRefs.description}>
            <WordEditor editorId="editor-description" label="Description de l'offre"
              placeholder="Décrivez les missions, le contexte, les responsabilités..."
              value={form.description} error={errors.description}
              onChange={(html) => { setForm((f) => ({ ...f, description: html })); if (errors.description) setErrors((p) => ({ ...p, description: "" })); }} />
          </div>

          <div ref={fieldRefs.profil}>
            <WordEditor editorId="editor-profil" label="Profil recherché"
              placeholder="Compétences requises, formations, qualités attendues..."
              value={form.profil} error={errors.profil}
              onChange={(html) => { setForm((f) => ({ ...f, profil: html })); if (errors.profil) setErrors((p) => ({ ...p, profil: "" })); }} />
          </div>

          <div className="offres-form-row">
            <div className="offres-form-group" ref={fieldRefs.Date_pub}>
              <label className="offres-form-label">Date de publication <span className="offres-required-star">*</span></label>
              <input type="date" className={`offres-form-control${errors.Date_pub ? " offres-input--error" : ""}`}
                name="Date_pub" value={form.Date_pub} onChange={handleChange} disabled={submitting} />
              {errors.Date_pub && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.Date_pub}</span>}
            </div>
            <div className="offres-form-group" ref={fieldRefs.Date_lim_can}>
              <label className="offres-form-label">Date limite de candidature <span className="offres-required-star">*</span></label>
              <input type="date" className={`offres-form-control${errors.Date_lim_can ? " offres-input--error" : ""}`}
                name="Date_lim_can" value={form.Date_lim_can} onChange={handleChange} disabled={submitting} />
              {errors.Date_lim_can && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.Date_lim_can}</span>}
            </div>
          </div>

          <div className="offres-form-row">
            <div className="offres-form-group" ref={fieldRefs.exp}>
              <label className="offres-form-label">Expérience <span className="offres-required-star">*</span></label>
              <select className={`offres-form-control${errors.exp ? " offres-input--error" : ""}`}
                name="exp" value={form.exp} onChange={handleChange} disabled={submitting}>
                <option value="">Choisir l'expérience...</option>
                {["Aucune","1an","2ans","3ans","4ans","5ans","6ans","7ans","8ans","9ans","10ans"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              {errors.exp && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.exp}</span>}
            </div>
            <div className="offres-form-group" ref={fieldRefs.genre}>
              <label className="offres-form-label">Genre <span className="offres-required-star">*</span></label>
              <select className={`offres-form-control${errors.genre ? " offres-input--error" : ""}`}
                name="genre" value={form.genre} onChange={handleChange} disabled={submitting}>
                <option value="">Choisir le genre...</option>
                <option>Homme</option><option>Femme</option><option>Homme/Femme</option>
              </select>
              {errors.genre && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.genre}</span>}
            </div>
          </div>

          <div className="offres-form-row">
            <div className="offres-form-group" ref={fieldRefs.Exper}>
              <label className="offres-form-label">Expertise <span className="offres-required-star">*</span></label>
              <select className={`offres-form-control${errors.Exper ? " offres-input--error" : ""}`}
                name="Exper" value={form.Exper} onChange={handleChange} disabled={submitting}>
                <option value="">Choisir l'expertise...</option>
                <option>Débutant(e)</option><option>Junior</option><option>Confirmé(e)</option><option>Expert(e)</option>
              </select>
              {errors.Exper && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.Exper}</span>}
            </div>
            <div className="offres-form-group" ref={fieldRefs.quali}>
              <label className="offres-form-label">Qualifications <span className="offres-required-star">*</span></label>
              <select className={`offres-form-control${errors.quali ? " offres-input--error" : ""}`}
                name="quali" value={form.quali} onChange={handleChange} disabled={submitting}>
                <option value="">Choisir la qualification...</option>
                {["Certificat","BAC","BTS","Licence","Ingénieur","Master","Doctorat","Phd"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              {errors.quali && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.quali}</span>}
            </div>
          </div>

          <div className="offres-form-row">
            <div className="offres-form-group" ref={fieldRefs.types_Off}>
              <label className="offres-form-label">Type d'offre <span className="offres-required-star">*</span></label>
              <select className={`offres-form-control${errors.types_Off ? " offres-input--error" : ""}`}
                name="types_Off" value={form.types_Off} onChange={handleChange} disabled={submitting}>
                <option value="">Choisir le type...</option>
                {["CDD","CDI","Stages","Freelance","Volontariat","Mission temporaire"].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              {errors.types_Off && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.types_Off}</span>}
            </div>
            <div className="offres-form-group">
              <label className="offres-form-label">Statut</label>
              <div className="offres-statut-readonly">
                <span className="offres-statut offres-statut--wait">
                  <span className="offres-statut-dot" />En attente
                </span>
                <span className="offres-statut-readonly-hint">Défini automatiquement</span>
              </div>
            </div>
          </div>

          <div className="offres-form-group" ref={fieldRefs.fiche_poste}>
            <label className="offres-form-label">Fiche de poste <span className="offres-required-star">*</span></label>
            <div className={`offres-file-upload${errors.fiche_poste ? " offres-file-upload--error" : ""}`}>
              <label className={`offres-file-label${errors.fiche_poste ? " offres-file-label--error" : ""}`} htmlFor="fiche_poste_input">
                <i className="bi bi-paperclip" />
                {form.fiche_poste ? form.fiche_poste.name : "Joindre un fichier (PDF, DOC, DOCX)"}
              </label>
              <input id="fiche_poste_input" type="file" accept=".pdf,.doc,.docx"
                style={{ display: "none" }} onChange={handleFileChange} disabled={submitting} />
              {form.fiche_poste && (
                <button type="button" className="offres-file-remove"
                  onClick={() => { setForm((f) => ({ ...f, fiche_poste: null })); setErrors((p) => ({ ...p, fiche_poste: "La fiche de poste est obligatoire (PDF, DOC ou DOCX)." })); }}
                  title="Retirer le fichier">×</button>
              )}
            </div>
            {errors.fiche_poste && <span className="offres-field-error"><i className="bi bi-exclamation-circle" /> {errors.fiche_poste}</span>}
          </div>
        </form>

        <div className="offres-modal-footer">
          <button className="offres-btn-cancel" onClick={onClose} disabled={submitting}>Annuler</button>
          <button type="submit" form="offreForm" className="offres-btn-save" disabled={submitting}>
            {submitting
              ? <><span className="offres-spinner" /> Envoi en cours…</>
              : <><i className="bi bi-check2" /> Enregistrer</>
            }
          </button>
        </div>
      </div>
    </div>
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
      <button className="offres-page-btn" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}>
        <i className="bi bi-chevron-left" /><span className="offres-page-label">Précédent</span>
      </button>
      {pages}
      <button className="offres-page-btn" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
        <span className="offres-page-label">Suivant</span><i className="bi bi-chevron-right" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   CARTE MOBILE
───────────────────────────────────────────────────────── */
function MobileCard({ o, onDelete, onCopy, copied }) {
  const offreUrl = `https://app.zenselekt.com/jobs/${o.id}`;
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
          <a href={liUrl} target="_blank" rel="noreferrer" className="linkedin" title="LinkedIn"><i className="bi bi-linkedin" /></a>
          <a href={waUrl} target="_blank" rel="noreferrer" className="whatsapp" title="WhatsApp"><i className="bi bi-whatsapp" /></a>
          <button className={`offres-copy-btn ${copied === o.id ? "copied" : ""}`} onClick={() => onCopy(o.id)} title="Copier le lien">
            <i className={`bi ${copied === o.id ? "bi-check2" : "bi-link-45deg"}`} />
          </button>
        </div>
        <div className="offres-actions">
          <Link to={`/postulants?event_id=${o.id}&poste=${encodeURIComponent(o.titre)}`} className="offres-action-btn" title="Voir les postulants">
            <i className="bi bi-person-lines-fill" />
          </Link>
          <Link to={`/modifier/${o.id}`} className="offres-action-btn offres-action-btn--edit" title="Modifier">
            <i className="bi bi-pencil-square" />
          </Link>
          <button className="offres-action-btn offres-action-btn--del" onClick={() => onDelete(o.id, o.titre)} title="Supprimer">
            <i className="bi bi-trash3" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function Offres() {
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

  const { offres, total, loading, error, fetchOffres } = useOffres();
  const [showModal, setShowModal] = useState(false);
  const [search,    setSearch]    = useState("");
  const [copied,    setCopied]    = useState(null);
  const [page,      setPage]      = useState(1);
  const tableRef = useRef(null);

  useEffect(() => {
    fetchOffres(page, search);
  }, [page, search, fetchOffres]);

  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handlePageChange(newPage) {
    setPage(newPage);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ── Suppression ── */
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
    });
    if (!result.isConfirmed) return;

    try {
      const fd = new FormData();
      fd.append("id", String(id));
      const res  = await secureFetch(`${API_BASE}?action=delete`, { method: "POST", body: fd });

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
      if (json.success) {
        Swal.fire({ title: "Supprimée !", text: "L'offre a été supprimée avec succès.", icon: "success", timer: 2000, showConfirmButton: false });
        fetchOffres(page, search);
      } else {
        Swal.fire({ icon: "error", title: "Erreur", text: json.message, confirmButtonColor: "#1a7070" });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur réseau", text: err.message, confirmButtonColor: "#1a7070" });
    }
  }

  /* ── Copier lien ── */
  function handleCopy(id) {
    navigator.clipboard.writeText(`https://app.zenselekt.com/jobs/${id}`).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
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
                <h1>Gestion des Offres</h1>
                <div className="offres-count-pill">
                  <span>{total}</span> offre{total !== 1 ? "s" : ""}
                </div>
              </div>
              <p>
                <Link to="/acceuil">Accueil</Link>{" / "}Gestion des annonces
              </p>
            </div>

            {/* Erreur API */}
            {error && !loading && (
              <div className="offres-api-error">
                <i className="bi bi-exclamation-triangle-fill" />
                <span>{error}</span>
                <button onClick={() => fetchOffres(page, search)}>Réessayer</button>
              </div>
            )}

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
                      <th>Actions</th>
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
                    ) : offres.length === 0 ? (
                      <tr><td colSpan={12}>
                        <div className="offres-empty">
                          <div className="offres-empty-icon"><i className="bi bi-inbox" /></div>
                          <p>Aucune offre trouvée.</p>
                          {search && <span>Essayez un terme de recherche différent.</span>}
                        </div>
                      </td></tr>
                    ) : (
                      offres.map((o, idx) => {
                        const offreUrl = `https://app.zenselekt.com/jobs/${o.id}`;
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
                                <a href={liUrl} target="_blank" rel="noreferrer" className="linkedin" title="LinkedIn"><i className="bi bi-linkedin" /></a>
                                <a href={waUrl} target="_blank" rel="noreferrer" className="whatsapp" title="WhatsApp"><i className="bi bi-whatsapp" /></a>
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
                            <td><span className="offres-type-chip">{o.types_Off}</span></td>
                            <td>
                              <div className="offres-actions">
                                <Link to={`/postulants?event_id=${o.id}&poste=${encodeURIComponent(o.titre)}`} className="offres-action-btn" title="Voir les postulants">
                                  <i className="bi bi-person-lines-fill" />
                                </Link>
                                <Link to={`/modifier/${o.id}`} className="offres-action-btn offres-action-btn--edit" title="Modifier">
                                  <i className="bi bi-pencil-square" />
                                </Link>
                                <button className="offres-action-btn offres-action-btn--del" onClick={() => handleDelete(o.id, o.titre)} title="Supprimer">
                                  <i className="bi bi-trash3" />
                                </button>
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
                ) : offres.length === 0 ? (
                  <div className="offres-empty">
                    <div className="offres-empty-icon"><i className="bi bi-inbox" /></div>
                    <p>Aucune offre trouvée.</p>
                    {search && <span>Essayez un terme de recherche différent.</span>}
                  </div>
                ) : (
                  offres.map((o) => (
                    <MobileCard key={o.id} o={o} onDelete={handleDelete} onCopy={handleCopy} copied={copied} />
                  ))
                )}
              </div>

              <div className="offres-table-footer">
                <span className="offres-footer-info">
                  {!loading && (
                    <>
                      Affichage de <strong>{total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</strong> à <strong>{Math.min(page * PAGE_SIZE, total)}</strong> sur <strong>{total}</strong> offre{total !== 1 ? "s" : ""}
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

      {showModal && (
        <ModalAjoutOffre
          onClose={() => setShowModal(false)}
          onSuccess={() => fetchOffres(1, search)}
        />
      )}
    </div>
  );
}
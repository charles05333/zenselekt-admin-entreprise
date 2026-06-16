import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import './css/Modifier.css';
import Header from "./component/Header";
import Navbar from "./component/Navbar";
import Swal from "sweetalert2";
import { useSessionGuard } from "./component/useSessionGuard";

/* ─────────────────────────────────────────────────────────
   CONFIG — identique à Offres.jsx
───────────────────────────────────────────────────────── */
const API_BASE    = "/securebackoffice/backsecurebackoffice/offres.php";
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
   SECURE FETCH — identique à Offres.jsx
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
   HELPER — redirection 401 centralisée
───────────────────────────────────────────────────────── */
async function handle401(res) {
  try {
    const json = await res.json();
    window.location.replace(json.redirect_to ?? AUTH_REDIRECT);
  } catch {
    window.location.replace(AUTH_REDIRECT);
  }
}

/* ─────────────────────────────────────────────────────────
   HELPER — HTML vide
───────────────────────────────────────────────────────── */
const isHtmlEmpty = (html) => {
  if (!html) return true;
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length === 0;
};

/* ═══════════════════════════════════════════════════════════
   WYSIWYG EDITOR — identique à Offres.jsx
═══════════════════════════════════════════════════════════ */
const FONT_SIZES    = ["10","11","12","14","16","18","20","24","28","32","36"];
const FONT_FAMILIES = [
  { label:"Calibri",         value:"Calibri, sans-serif" },
  { label:"Arial",           value:"Arial, sans-serif" },
  { label:"Times New Roman", value:"'Times New Roman', serif" },
  { label:"Georgia",         value:"Georgia, serif" },
  { label:"Verdana",         value:"Verdana, sans-serif" },
  { label:"Courier New",     value:"'Courier New', monospace" },
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
  const initialized = useRef(false);
  const [colorPicker, setColorPicker] = useState(null);
  const [fontSize,    setFontSize]    = useState("12");
  const [fontFamily,  setFontFamily]  = useState("Calibri, sans-serif");
  const [fmt,         setFmt]         = useState({});
  const [textColor,   setTextColor]   = useState("#000000");
  const [bgColor,     setBgColor]     = useState("#ffff00");

  // Initialise le contenu une seule fois quand value est disponible
  useEffect(() => {
    if (editorRef.current && value && !initialized.current) {
      editorRef.current.innerHTML = value;
      initialized.current = true;
    }
  }, [value]);

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
    html += "</tbody></table><p><br></p>";
    exec("insertHTML", html);
  };

  return (
    <div className="modifier-form-group" id={editorId}>
      <label className="modifier-form-label">{label} <span className="modifier-required-star">*</span></label>
      <div className={`wrd-editor-wrap${error ? " wrd-editor-wrap--error" : ""}`} onClick={() => setColorPicker(null)}>
        <div className="wrd-toolbar" onMouseDown={(e) => e.preventDefault()}>
          <TBtn icon="arrow-counterclockwise" title="Annuler"   onClick={() => exec("undo")} />
          <TBtn icon="arrow-clockwise"        title="Rétablir"  onClick={() => exec("redo")} />
          <TSep />
          <TDropdown value={fontFamily} options={FONT_FAMILIES} onChange={applyFont}      width={112} />
          <TDropdown value={fontSize}   options={FONT_SIZES}    onChange={applyFontSize}  width={54} />
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
      {error && <span className="modifier-field-error"><i className="bi bi-exclamation-circle" /> {error}</span>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE MODIFIER — branché sur la vraie API
═══════════════════════════════════════════════════════════ */
export default function Modifier() {
  useBootstrapIcons();

  const { id: paramId } = useParams();          // /modifier/:id
  const navigate        = useNavigate();

  /* ── Session guard ── */
  const { entreprise, checked } = useSessionGuard();

  /* ── Responsive ── */
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  const isMobile   = width <= 600;
  const [sidebarOpen, setSidebarOpen] = useState(width > 768);
  useEffect(() => { if (width <= 768) setSidebarOpen(false); }, [width]);

  /* ── États ── */
  const [loadingOffre, setLoadingOffre] = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [isDirty,      setIsDirty]      = useState(false);
  const [notFound,     setNotFound]     = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [form, setForm] = useState({
    titre: "", description: "", profil: "",
    Date_pub: "", Date_lim_can: "", exp: "",
    genre: "", Exper: "", quali: "",
    types_Off: "", statuts: "",
    fiche_poste: null,
    fiche_poste_name: "",
  });
  const [errors, setErrors] = useState({});

  /* ── Refs scroll vers erreur ── */
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

  /* ─────────────────────────────────────────────────────
     CHARGEMENT DE L'OFFRE (vraie API GET)
  ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!paramId) { setNotFound(true); setLoadingOffre(false); return; }

    const controller = new AbortController();

    (async () => {
      try {
        const res = await secureFetch(
          `${API_BASE}?action=get&id=${encodeURIComponent(paramId)}`,
          { signal: controller.signal }
        );

        if (res.status === 401) { await handle401(res); return; }

        const json = await res.json();

        if (!json.success) {
          setNotFound(true);
          setLoadingOffre(false);
          return;
        }

        const o = json.data;
        setForm({
          titre:            o.titre          ?? "",
          description:      o.Description   ?? "",
          profil:           o.Profil         ?? "",
          Date_pub:         (o.Date_pub     ?? "").slice(0, 10),
          Date_lim_can:     (o.Date_lim_can ?? "").slice(0, 10),
          exp:              o.exp            ?? "",
          genre:            o.genre          ?? "",
          Exper:            o.Exper          ?? "",
          quali:            o.quali          ?? "",
          types_Off:        o.types_Off      ?? "",
          statuts:          o.statuts        ?? "en attente",
          fiche_poste:      null,
          fiche_poste_name: o.Fiche_Post     ?? "",
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          Swal.fire({
            icon: "error", title: "Erreur de chargement",
            text: "Impossible de charger l'offre. Veuillez réessayer.",
            confirmButtonColor: "#1a7070",
          });
          setNotFound(true);
        }
      } finally {
        setLoadingOffre(false);
      }
    })();

    return () => controller.abort();
  }, [paramId]);

  /* ─────────────────────────────────────────────────────
     HANDLERS
  ───────────────────────────────────────────────────── */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setIsDirty(true);
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0] || null;
    setForm((f) => ({ ...f, fiche_poste: file, fiche_poste_name: file ? file.name : f.fiche_poste_name }));
    setIsDirty(true);
    if (errors.fiche_poste) setErrors((p) => ({ ...p, fiche_poste: "" }));
  }

  function handleRemoveFile() {
    setForm((f) => ({ ...f, fiche_poste: null, fiche_poste_name: "" }));
    setIsDirty(true);
    setErrors((p) => ({ ...p, fiche_poste: "La fiche de poste est obligatoire (PDF, DOC ou DOCX)." }));
  }

  /* ─────────────────────────────────────────────────────
     VALIDATION
  ───────────────────────────────────────────────────── */
  function validate() {
    const e = {};
    if (!form.titre.trim())            e.titre        = "Le titre de l'offre est obligatoire.";
    if (isHtmlEmpty(form.description)) e.description  = "La description de l'offre est obligatoire.";
    if (isHtmlEmpty(form.profil))      e.profil       = "Le profil recherché est obligatoire.";
    if (!form.Date_pub)                e.Date_pub     = "La date de publication est obligatoire.";
    if (!form.Date_lim_can)            e.Date_lim_can = "La date limite de candidature est obligatoire.";
    if (!form.exp)                     e.exp          = "Veuillez sélectionner l'expérience requise.";
    if (!form.genre)                   e.genre        = "Veuillez sélectionner le genre.";
    if (!form.Exper)                   e.Exper        = "Veuillez sélectionner le niveau d'expertise.";
    if (!form.quali)                   e.quali        = "Veuillez sélectionner la qualification requise.";
    if (!form.types_Off)               e.types_Off    = "Veuillez sélectionner le type d'offre.";
    if (!form.statuts)                 e.statuts      = "Veuillez sélectionner le statut de l'offre.";
    if (!form.fiche_poste && !form.fiche_poste_name)
                                       e.fiche_poste  = "La fiche de poste est obligatoire (PDF, DOC ou DOCX).";
    return e;
  }

  /* ─────────────────────────────────────────────────────
     SOUMISSION — vraie API POST update + emails
  ───────────────────────────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstKey = Object.keys(errs)[0];
      fieldRefs[firstKey]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSaving(true);

    const fd = new FormData();
    fd.append("id",          String(paramId));
    fd.append("titre",       form.titre.trim());
    fd.append("description", form.description);
    fd.append("profil",      form.profil);
    fd.append("Date_pub",    form.Date_pub);
    fd.append("Date_lim_can",form.Date_lim_can);
    fd.append("exp",         form.exp);
    fd.append("genre",       form.genre);
    fd.append("Exper",       form.Exper);
    fd.append("quali",       form.quali);
    fd.append("types_Off",   form.types_Off);
    fd.append("statuts",     form.statuts);
    if (form.fiche_poste) fd.append("fiche_poste", form.fiche_poste);

    try {
      const res = await secureFetch(`${API_BASE}?action=update`, { method: "POST", body: fd });

      if (res.status === 401) { await handle401(res); return; }

      const json = await res.json();

      if (res.ok && json.success) {
        setIsDirty(false);

        // Détermination de la couleur du badge statut dans la SweetAlert
        const isApproved = form.statuts === "Approuvé";
        const statutColor = isApproved ? "#166534" : "#b45309";
        const statutBg    = isApproved ? "#dcfce7" : "#fffbeb";

        await Swal.fire({
          icon: "success",
          title: "Offre mise à jour !",
          html: `
            <div style="text-align:left;font-size:14px;line-height:1.8;color:#3d4350;">
              <p style="margin:0 0 12px;">
                L'offre <strong style="color:#b45309;">« ${form.titre.trim()} »</strong>
                a été modifiée avec succès.
              </p>
              <div style="background:#fffbeb;border-radius:6px;padding:14px 16px;font-size:13px;">
                <p style="margin:0 0 8px;font-weight:700;color:#92400e;">Récapitulatif :</p>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                  <span style="color:#64748b;font-size:12px;">Statut :</span>
                  <span style="background:${statutBg};color:${statutColor};padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700;">
                    ${form.statuts}
                  </span>
                </div>
                <ul style="margin:8px 0 0;padding-left:18px;color:#3d4350;line-height:2;">
                  <li>Un <strong>e-mail de confirmation</strong> a été envoyé à votre adresse</li>
                  <li>Notre équipe va <strong>revalider votre offre</strong> avant publication</li>
                  <li>Vous serez <strong>notifié</strong> après approbation</li>
                </ul>
              </div>
            </div>`,
          confirmButtonText: "Retour aux offres",
          confirmButtonColor: "#b45309",
          customClass: { popup: "swal-zenselekt-popup" },
        });

        // Retour à la liste des offres après confirmation
        navigate("/offres");
      } else {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: json.message || "Une erreur est survenue lors de la modification.",
          confirmButtonColor: "#1a7070",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erreur réseau",
        text: err.message,
        confirmButtonColor: "#1a7070",
      });
    } finally {
      setSaving(false);
    }
  }

  /* ─────────────────────────────────────────────────────
     ANNULATION
  ───────────────────────────────────────────────────── */
  function handleCancelClick() {
    if (isDirty) {
      setShowCancelModal(true);
    } else {
      navigate("/offres");
    }
  }

  /* ─────────────────────────────────────────────────────
     SPINNER SESSION GUARD
  ───────────────────────────────────────────────────── */
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
        <style>{`@keyframes zen-spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: "#93a4c3", fontSize: 14 }}>Vérification en cours…</span>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────
     ÉCRAN CHARGEMENT OFFRE
  ───────────────────────────────────────────────────── */
  if (loadingOffre) {
    return (
      <div className="app">
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((p) => !p)} isMobile={isMobile} />
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

  /* ─────────────────────────────────────────────────────
     OFFRE INTROUVABLE
  ───────────────────────────────────────────────────── */
  if (notFound) {
    return (
      <div className="app">
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((p) => !p)} isMobile={isMobile} />
        <div className="layout">
          <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>
            <div className="modifier-page">
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", padding: "60px 20px", textAlign: "center",
              }}>
                <i className="bi bi-exclamation-triangle" style={{ fontSize: 48, color: "#f59e0b", marginBottom: 16 }} />
                <h2 style={{ color: "#0f1117", marginBottom: 8 }}>Offre introuvable</h2>
                <p style={{ color: "#7c8596", marginBottom: 24 }}>
                  L'offre demandée n'existe pas ou vous n'y avez pas accès.
                </p>
                <Link to="/offres" style={{
                  background: "#1a7070", color: "#fff", padding: "10px 24px",
                  borderRadius: 8, textDecoration: "none", fontWeight: 600,
                }}>
                  Retour aux offres
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────
     RENDU PRINCIPAL
  ───────────────────────────────────────────────────── */
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

            {/* ── Breadcrumb ── */}
            <div className="modifier-breadcrumb">
              <div className="modifier-breadcrumb-top">
                <h1>
                  <i className="bi bi-pencil-square modifier-breadcrumb-icon" />
                  Modifier l'offre
                </h1>
                {isDirty && (
                  <span className="modifier-dirty-badge">
                    <i className="bi bi-circle-fill" /> Modifications non enregistrées
                  </span>
                )}
              </div>
              <p>
                <Link to="/acceuil">Accueil</Link>{" / "}
                <Link to="/offres">Gestion des annonces</Link>{" / "}
                Modifier
              </p>
            </div>

            {/* ── Bannière info modification ── */}
            <div className="modifier-update-info-banner">
              <i className="bi bi-info-circle-fill" />
              <span>
                La modification de l'offre enverra automatiquement un e-mail de confirmation
                à votre adresse et une notification à l'équipe Zenselekt pour revalidation.
              </span>
            </div>

            {/* ── Card principale ── */}
            <div className="modifier-card">

              {/* En-tête avec titre actuel */}
              <div className="modifier-card-header">
                <div className="modifier-card-header-left">
                  <span className="modifier-card-label">Offre en cours d'édition</span>
                  <span className="modifier-card-title-preview">{form.titre || "—"}</span>
                </div>
                <div className="modifier-card-header-right">
                  {/* Badge statut actuel */}
                  {form.statuts && (
                    <span className={`offres-statut ${form.statuts === "Approuvé" ? "offres-statut--ok" : "offres-statut--wait"}`}>
                      <span className="offres-statut-dot" />
                      {form.statuts}
                    </span>
                  )}
                </div>
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
                    name="titre" value={form.titre} onChange={handleChange}
                    placeholder="Ex : Développeur Full Stack" disabled={saving}
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
                      if (errors.description) setErrors((p) => ({ ...p, description: "" }));
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
                      if (errors.profil) setErrors((p) => ({ ...p, profil: "" }));
                    }}
                  />
                </div>

                {/* Dates */}
                <div className="modifier-row-2">
                  <div className="modifier-form-group" ref={fieldRefs.Date_pub}>
                    <label className="modifier-form-label">
                      Date de publication <span className="modifier-required-star">*</span>
                    </label>
                    <input type="date"
                      className={`modifier-form-control${errors.Date_pub ? " modifier-input--error" : ""}`}
                      name="Date_pub" value={form.Date_pub} onChange={handleChange} disabled={saving}
                    />
                    {errors.Date_pub && (
                      <span className="modifier-field-error">
                        <i className="bi bi-exclamation-circle" /> {errors.Date_pub}
                      </span>
                    )}
                  </div>
                  <div className="modifier-form-group" ref={fieldRefs.Date_lim_can}>
                    <label className="modifier-form-label">
                      Date limite de candidature <span className="modifier-required-star">*</span>
                    </label>
                    <input type="date"
                      className={`modifier-form-control${errors.Date_lim_can ? " modifier-input--error" : ""}`}
                      name="Date_lim_can" value={form.Date_lim_can} onChange={handleChange} disabled={saving}
                    />
                    {errors.Date_lim_can && (
                      <span className="modifier-field-error">
                        <i className="bi bi-exclamation-circle" /> {errors.Date_lim_can}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expérience / Genre / Expertise */}
                <div className="modifier-row-3">
                  <div className="modifier-form-group" ref={fieldRefs.exp}>
                    <label className="modifier-form-label">Expérience <span className="modifier-required-star">*</span></label>
                    <select className={`modifier-form-control${errors.exp ? " modifier-input--error" : ""}`}
                      name="exp" value={form.exp} onChange={handleChange} disabled={saving}>
                      <option value="">Choisir...</option>
                      {["Aucune","1an","2ans","3ans","4ans","5ans","6ans","7ans","8ans","9ans","10ans"].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {errors.exp && <span className="modifier-field-error"><i className="bi bi-exclamation-circle" /> {errors.exp}</span>}
                  </div>
                  <div className="modifier-form-group" ref={fieldRefs.genre}>
                    <label className="modifier-form-label">Genre <span className="modifier-required-star">*</span></label>
                    <select className={`modifier-form-control${errors.genre ? " modifier-input--error" : ""}`}
                      name="genre" value={form.genre} onChange={handleChange} disabled={saving}>
                      <option value="">Choisir...</option>
                      <option>Homme</option><option>Femme</option><option>Homme/Femme</option>
                    </select>
                    {errors.genre && <span className="modifier-field-error"><i className="bi bi-exclamation-circle" /> {errors.genre}</span>}
                  </div>
                  <div className="modifier-form-group" ref={fieldRefs.Exper}>
                    <label className="modifier-form-label">Expertise <span className="modifier-required-star">*</span></label>
                    <select className={`modifier-form-control${errors.Exper ? " modifier-input--error" : ""}`}
                      name="Exper" value={form.Exper} onChange={handleChange} disabled={saving}>
                      <option value="">Choisir...</option>
                      <option>Débutant(e)</option><option>Junior</option><option>Confirmé(e)</option><option>Expert(e)</option>
                    </select>
                    {errors.Exper && <span className="modifier-field-error"><i className="bi bi-exclamation-circle" /> {errors.Exper}</span>}
                  </div>
                </div>

                {/* Qualification / Type / Statut */}
                <div className="modifier-row-3">
                  <div className="modifier-form-group" ref={fieldRefs.quali}>
                    <label className="modifier-form-label">Qualifications <span className="modifier-required-star">*</span></label>
                    <select className={`modifier-form-control${errors.quali ? " modifier-input--error" : ""}`}
                      name="quali" value={form.quali} onChange={handleChange} disabled={saving}>
                      <option value="">Choisir...</option>
                      {["Certificat","BAC","BTS","Licence","Ingénieur","Master","Doctorat","Phd"].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {errors.quali && <span className="modifier-field-error"><i className="bi bi-exclamation-circle" /> {errors.quali}</span>}
                  </div>
                  <div className="modifier-form-group" ref={fieldRefs.types_Off}>
                    <label className="modifier-form-label">Type d'offre <span className="modifier-required-star">*</span></label>
                    <select className={`modifier-form-control${errors.types_Off ? " modifier-input--error" : ""}`}
                      name="types_Off" value={form.types_Off} onChange={handleChange} disabled={saving}>
                      <option value="">Choisir...</option>
                      {["CDD","CDI","Stages","Freelance","Volontariat","Mission temporaire"].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {errors.types_Off && <span className="modifier-field-error"><i className="bi bi-exclamation-circle" /> {errors.types_Off}</span>}
                  </div>
                  <div className="modifier-form-group" ref={fieldRefs.statuts}>
                    <label className="modifier-form-label">Statut <span className="modifier-required-star">*</span></label>
                    <select className={`modifier-form-control${errors.statuts ? " modifier-input--error" : ""}`}
                      name="statuts" value={form.statuts} onChange={handleChange} disabled={saving}>
                      <option value="">Choisir...</option>
                      <option value="en attente">En attente</option>
                      <option value="Approuvé">Approuvé</option>
                    </select>
                    {errors.statuts && <span className="modifier-field-error"><i className="bi bi-exclamation-circle" /> {errors.statuts}</span>}
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
                      <span className="modifier-file-existing-name">
                        {form.fiche_poste_name.split("/").pop()}
                      </span>
                      <span className="modifier-file-existing-tag">Fichier actuel</span>
                      <button type="button" className="modifier-file-remove"
                        onClick={handleRemoveFile} title="Retirer le fichier" disabled={saving}>
                        <i className="bi bi-x-circle" />
                      </button>
                    </div>
                  )}

                  {/* Upload nouveau fichier */}
                  <div className={`modifier-file-upload${errors.fiche_poste ? " modifier-file-upload--error" : ""}`}>
                    <label
                      className={`modifier-file-label${errors.fiche_poste ? " modifier-file-label--error" : ""}`}
                      htmlFor="fiche_poste_input">
                      <i className="bi bi-paperclip" />
                      {form.fiche_poste
                        ? form.fiche_poste.name
                        : form.fiche_poste_name
                          ? "Remplacer le fichier (PDF, DOC, DOCX)"
                          : "Joindre un fichier (PDF, DOC, DOCX)"}
                    </label>
                    <input id="fiche_poste_input" type="file" accept=".pdf,.doc,.docx"
                      style={{ display: "none" }} onChange={handleFileChange} disabled={saving} />
                    {form.fiche_poste && (
                      <button type="button" className="modifier-file-remove-btn"
                        onClick={() => setForm((f) => ({ ...f, fiche_poste: null }))}
                        title="Retirer le nouveau fichier" disabled={saving}>×</button>
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
                <button type="button" className="modifier-btn-cancel"
                  onClick={handleCancelClick} disabled={saving}>
                  <i className="bi bi-x-lg" /> Annuler
                </button>
                <button type="submit" form="modifierForm" className="modifier-btn-save" disabled={saving}>
                  {saving ? (
                    <><span className="modifier-spinner" /> Enregistrement…</>
                  ) : (
                    <> Enregistrer les modifications</>
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
        <div className="modifier-overlay">
          <div className="modifier-confirm-modal">
            <div className="modifier-confirm-icon">
              <i className="bi bi-exclamation-triangle-fill" />
            </div>
            <h3>Annuler les modifications ?</h3>
            <p>Toutes les modifications non enregistrées seront perdues.</p>
            <div className="modifier-confirm-actions">
              <button className="modifier-btn-secondary" onClick={() => setShowCancelModal(false)}>
                Continuer l'édition
              </button>
              <button className="modifier-btn-danger"
                onClick={() => { setShowCancelModal(false); navigate("/offres"); }}>
                Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
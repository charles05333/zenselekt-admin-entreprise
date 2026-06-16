import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionGuard } from "./useSessionGuard";
import './css/Navbar.css';

/* ══════════════════════════════════════════════════════════════════════
   CATALOGUE DES MENUS (source de vérité unique)
══════════════════════════════════════════════════════════════════════ */
const NAV_CATALOG = [
  {
    icon:   "bi-grid",
    label:  "Zenselekt 3.0",
    single: true,
    path:   "/acceuil",
  },
  {
    icon:    "bi-briefcase",
    label:   "Gestion des offres d'emploi",
    permId:  "offres",
    children: [
      { label: "Consultation des Emplois / Postulants", path: "/emploi",        permId: "emploi"        },
      { label: "Candidathèque générale",                path: "/candidatheque", permId: "candidatheque" },
      { label: "Candidatures spontanées",               path: "/spontanees",    permId: "spontanees"    },
      { label: "Gestion des annonces",                  path: "/offres",        permId: "annonces"      },
    ],
  },
  {
    icon:    "bi-people",
    label:   "Gestion des utilisateurs",
    permId:  "utilisateurs",
    children: [
      { label: "Utilisateurs",              path: "/utilisateurs", permId: "liste-util" },
      { label: "Création d'un utilisateur", path: "/creerutil",    permId: "creer-util" },
    ],
  },
  {
    icon:    "bi-trophy",
    label:   "Gestion des évaluations",
    permId:  "evaluations",
    children: [
      { label: "Banque des tests",       path: "/tests",     permId: "tests"     },
      { label: "Campagnes d'évaluation", path: "/campagnes", permId: "campagnes" },
    ],
  },
  {
    icon:    "bi-clipboard-check",
    label:   "Préselection & entretiens",
    permId:  "preselection",
    children: [
      { label: "Listes des postes", path: "/postes", permId: "postes" },
    ],
  },
  {
    icon:    "bi-journal-text",
    label:   "Documentation",
    permId:  "documentation",
    children: [
      { label: "Lire la documentation", path: "/documentation", permId: "docs" },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════
   TABLES DE CORRESPONDANCE permId ↔ menuKey
   (identiques à creerUtil.jsx / modifierUtilisateur.jsx)
══════════════════════════════════════════════════════════════════════ */
const PERM_TO_MENU_KEY = {
  offres:        "gestion_offres",
  utilisateurs:  "gestion_utilisateurs",
  evaluations:   "gestion_evaluations",
  preselection:  "gestion_notations",
  documentation: "documentation",
  chatbot:       "chatbot",
};

const CHILD_PERMID_TO_KEY = {
  emploi:        "emploi_consultation",
  candidatheque: "candidatheque",
  spontanees:    "candidathequeSpon",
  annonces:      "gestion_annonces",
  "liste-util":  "utilisateurs_list",
  "creer-util":  "utilisateurs_creation",
  tests:         "banque_tests",
  campagnes:     "campagnes_evaluation",
  postes:        "listes_postes",
};

/* ══════════════════════════════════════════════════════════════════════
   HELPERS — COMPTE PRINCIPAL
   Construit une map { permId: { enabled, children: { permId: bool } } }
   depuis le tableau structuré entreprise.permissions
══════════════════════════════════════════════════════════════════════ */
function buildPermMap(permissions) {
  const map = {};
  if (!Array.isArray(permissions)) return map;
  for (const perm of permissions) {
    const childMap = {};
    if (Array.isArray(perm.children)) {
      for (const child of perm.children) {
        childMap[child.id] = !!child.enabled;
      }
    }
    map[perm.id] = { enabled: !!perm.enabled, children: childMap };
  }
  return map;
}

function buildVisibleNav(permMap) {
  return NAV_CATALOG.reduce((acc, item) => {
    if (!item.permId) { acc.push(item); return acc; }
    const perm = permMap[item.permId];
    if (!perm || !perm.enabled) return acc;
    const visibleChildren = (item.children || []).filter((child) => {
      if (!child.permId) return true;
      return perm.children[child.permId] !== false;
    });
    if (visibleChildren.length === 0) return acc;
    acc.push({ ...item, children: visibleChildren });
    return acc;
  }, []);
}

/* ══════════════════════════════════════════════════════════════════════
   HELPERS — SOUS-UTILISATEUR
   Construit la nav depuis un tableau de clés simples
   ex: ["dashboard", "gestion_offres", "emploi_consultation", ...]
   Ces clés correspondent au champ bo_sub_menu_perms en session PHP,
   exposé par session_check sous le nom subUserMenuPerms.
══════════════════════════════════════════════════════════════════════ */

/**
 * Inverse de PERM_TO_MENU_KEY :
 * "gestion_offres" → "offres", "gestion_utilisateurs" → "utilisateurs", …
 */
const MENU_KEY_TO_PERMID = Object.fromEntries(
  Object.entries(PERM_TO_MENU_KEY).map(([permId, menuKey]) => [menuKey, permId])
);

/**
 * Inverse de CHILD_PERMID_TO_KEY :
 * "emploi_consultation" → "emploi", "utilisateurs_list" → "liste-util", …
 */
const CHILD_KEY_TO_PERMID = Object.fromEntries(
  Object.entries(CHILD_PERMID_TO_KEY).map(([permId, menuKey]) => [menuKey, permId])
);

/**
 * Construit la nav visible pour un sous-utilisateur à partir de ses
 * clés de menu (format plat, tel que stocké dans bo_sub_menu_perms).
 *
 * @param {string[]} allowedKeys  ex: ["dashboard","gestion_offres","emploi_consultation"]
 * @returns item[] — même structure que NAV_CATALOG, filtrée
 */
function buildNavFromKeys(allowedKeys) {
  const keySet = new Set(Array.isArray(allowedKeys) ? allowedKeys : []);

  return NAV_CATALOG.reduce((acc, item) => {
    /* Élément sans permId = dashboard (toujours visible) */
    if (!item.permId) {
      acc.push(item);
      return acc;
    }

    /* Vérifie si la clé menu du parent est autorisée */
    const menuKey = PERM_TO_MENU_KEY[item.permId];
    if (!menuKey || !keySet.has(menuKey)) return acc;

    /* Filtre les enfants dont la clé est autorisée */
    const visibleChildren = (item.children || []).filter((child) => {
      if (!child.permId) return true;
      const childKey = CHILD_PERMID_TO_KEY[child.permId];
      return childKey ? keySet.has(childKey) : false;
    });

    /* N'affiche le parent que s'il a au moins un enfant visible */
    if (visibleChildren.length === 0) return acc;

    acc.push({ ...item, children: visibleChildren });
    return acc;
  }, []);
}

/* ══════════════════════════════════════════════════════════════════════
   HELPERS — JSON SÉCURISÉ
══════════════════════════════════════════════════════════════════════ */
async function safeJson(response) {
  const text = await response.text();
  if (!text || text.trim() === "")
    throw new Error(`Réponse serveur vide (HTTP ${response.status})`);
  const clean = text.trimStart().replace(/^\uFEFF/, "");
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("[Chatbot] Réponse non-JSON :", clean.substring(0, 300));
    throw new Error("Réponse serveur invalide");
  }
}

function decodeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&apos;/g, "'").replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function normalize(str) {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/* ══════════════════════════════════════════════════════════════════════
   RICH TEXT EDITOR
══════════════════════════════════════════════════════════════════════ */
const WORD_TEXT_COLORS = [
  ['#000000','#1F2937','#374151','#4B5563','#6B7280','#9CA3AF','#D1D5DB','#F3F4F6','#FFFFFF','#7F1D1D'],
  ['#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#6366F1','#8B5CF6','#EC4899','#14B8A6','#0EA5E9'],
  ['#991B1B','#9A3412','#854D0E','#166534','#1E40AF','#3730A3','#6D28D9','#9D174D','#0F766E','#0369A1'],
  ['#FCA5A5','#FDBA74','#FDE047','#86EFAC','#93C5FD','#A5B4FC','#C4B5FD','#F9A8D4','#5EEAD4','#7DD3FC'],
];

const WORD_HL_COLORS = [
  '#FFFF00','#00FF00','#00FFFF','#FF00FF','#FF0000','#0000FF',
  '#FFA500','#800080','#008000','#000080','#808000','#800000',
  '#C0C0C0','#000000','none',
];

function ColorPalette({ colors, flat = false, onPick, onClose }) {
  return (
    <div className="rte-palette" onMouseDown={(e) => e.stopPropagation()}>
      {flat ? (
        <div className="rte-palette__flat">
          {colors.map((c, i) => (
            <button key={i} type="button"
              className="rte-palette__swatch"
              style={{ background: c === 'none' ? 'transparent' : c,
                       border: c === 'none' ? '1px dashed #aaa' : '1px solid rgba(0,0,0,0.12)' }}
              title={c === 'none' ? 'Aucun surlignage' : c}
              onClick={() => { onPick(c); onClose(); }}>
              {c === 'none' && <span style={{ fontSize: 9, color: '#888' }}>✕</span>}
            </button>
          ))}
        </div>
      ) : (
        colors.map((row, ri) => (
          <div key={ri} className="rte-palette__row">
            {row.map((c, ci) => (
              <button key={ci} type="button"
                className="rte-palette__swatch"
                style={{ background: c, border: c === '#FFFFFF' ? '1px solid #ddd' : '1px solid rgba(0,0,0,0.08)' }}
                title={c}
                onClick={() => { onPick(c); onClose(); }} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function RichTextEditor({ editorRef, placeholder }) {
  const [fmt, setFmt] = useState({
    bold: false, italic: false, underline: false, strikeThrough: false,
    justifyLeft: true, justifyCenter: false, justifyRight: false, justifyFull: false,
    insertUnorderedList: false, insertOrderedList: false,
    superscript: false, subscript: false,
  });
  const [curFont, setCurFont] = useState('Calibri');
  const [curSize, setCurSize] = useState('11');

  const [lastTextColor, setLastTextColor] = useState('#000000');
  const [lastHlColor,   setLastHlColor]   = useState('#FFFF00');
  const [openPalette,   setOpenPalette]   = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpenPalette(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.fontSize   = '14.7px';
      editorRef.current.style.fontFamily = 'Calibri, Segoe UI, sans-serif';
      editorRef.current.focus();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const PT_SIZES  = ['8','9','10','11','12','14','16','18','20','22','24','28','36','48','72'];
  const PT_TO_LEVEL = { '8':1,'9':1,'10':2,'11':2,'12':3,'14':4,'16':4,'18':5,'20':5,'22':5,'24':6,'28':6,'36':6,'48':7,'72':7 };
  const FONTS = ['Calibri','Arial','Arial Black','Book Antiqua','Comic Sans MS',
                 'Courier New','Georgia','Impact','Tahoma','Times New Roman',
                 'Trebuchet MS','Verdana'];

  const syncFormats = useCallback(() => {
    try {
      setFmt({
        bold:                document.queryCommandState('bold'),
        italic:              document.queryCommandState('italic'),
        underline:           document.queryCommandState('underline'),
        strikeThrough:       document.queryCommandState('strikeThrough'),
        justifyLeft:         document.queryCommandState('justifyLeft'),
        justifyCenter:       document.queryCommandState('justifyCenter'),
        justifyRight:        document.queryCommandState('justifyRight'),
        justifyFull:         document.queryCommandState('justifyFull'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList:   document.queryCommandState('insertOrderedList'),
        superscript:         document.queryCommandState('superscript'),
        subscript:           document.queryCommandState('subscript'),
      });

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const node = sel.anchorNode?.nodeType === 3
          ? sel.anchorNode.parentElement
          : sel.anchorNode;
        if (node) {
          const cs = window.getComputedStyle(node);
          const fontRaw = cs.fontFamily?.split(',')[0].replace(/['"]/g, '').trim();
          if (fontRaw) setCurFont(fontRaw);
          const pxSize = parseFloat(cs.fontSize);
          if (pxSize) {
            const pt = Math.round(pxSize * 0.75);
            const closest = PT_SIZES.reduce((prev, curr) =>
              Math.abs(parseInt(curr) - pt) < Math.abs(parseInt(prev) - pt) ? curr : prev
            );
            setCurSize(closest);
          }
        }
      }
    } catch (_) {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function exec(cmd, value = null) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    syncFormats();
  }

  function applyFontSize(pt) {
    setCurSize(pt);
    const level = PT_TO_LEVEL[pt] || 3;
    exec('fontSize', String(level));
    const pxMap = {
      '8':'10.7px','9':'12px','10':'13.3px','11':'14.7px','12':'16px',
      '14':'18.7px','16':'21.3px','18':'24px','20':'26.7px','22':'29.3px',
      '24':'32px','28':'37.3px','36':'48px','48':'64px','72':'96px',
    };
    const fonts = editorRef.current?.querySelectorAll(`font[size="${level}"]`);
    fonts?.forEach(f => {
      const span = document.createElement('span');
      span.style.fontSize = pxMap[pt] || '16px';
      span.innerHTML = f.innerHTML;
      f.replaceWith(span);
    });
    syncFormats();
  }

  function applyTextColor(color) {
    setLastTextColor(color);
    exec('foreColor', color);
  }

  function applyHighlight(color) {
    setLastHlColor(color === 'none' ? '#FFFF00' : color);
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    if (color === 'none') { exec('removeFormat'); return; }
    exec('hiliteColor', color);
  }

  function handleEditorKeyDown(e) {
    if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); exec('outdent');  return; }
    if (e.key === 'Tab')               { e.preventDefault(); exec('indent');   return; }
  }

  const Btn = ({ cmd, children, title, value = null }) => (
    <button type="button"
      className={`rte-btn${fmt[cmd] ? ' rte-btn--on' : ''}`}
      onMouseDown={(e) => { e.preventDefault(); exec(cmd, value); }}
      title={title}>
      {children}
    </button>
  );

  const activeAlign = fmt.justifyCenter ? 'center'
    : fmt.justifyRight ? 'right'
    : fmt.justifyFull  ? 'full'
    : 'left';

  return (
    <div className="rte-wrap" ref={wrapRef}>

      {/* ══ LIGNE 1 ══ */}
      <div className="rte-row">

        <button type="button" className="rte-btn" title="Annuler (Ctrl+Z)"
          onMouseDown={(e) => { e.preventDefault(); exec('undo'); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M3 7v6h6"/><path d="M3 13A9 9 0 1 0 6 6.3"/>
          </svg>
        </button>
        <button type="button" className="rte-btn" title="Rétablir (Ctrl+Y)"
          onMouseDown={(e) => { e.preventDefault(); exec('redo'); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 7v6h-6"/><path d="M21 13A9 9 0 1 1 18 6.3"/>
          </svg>
        </button>

        <span className="rte-div" />

        <select className="rte-sel rte-sel--font" value={curFont}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => { setCurFont(e.target.value); exec('fontName', e.target.value); }}>
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        <select className="rte-sel rte-sel--size" value={curSize}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => applyFontSize(e.target.value)}>
          {PT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <span className="rte-div" />

        <Btn cmd="bold" title="Gras (Ctrl+G)">
          <span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'serif', lineHeight: 1 }}>B</span>
        </Btn>
        <Btn cmd="italic" title="Italique (Ctrl+I)">
          <span style={{ fontStyle: 'italic', fontSize: 13, fontFamily: 'Georgia, serif', lineHeight: 1 }}>I</span>
        </Btn>
        <Btn cmd="underline" title="Souligné (Ctrl+U)">
          <span style={{ textDecoration: 'underline', textDecorationColor: '#0a78b5', fontSize: 13, fontFamily: 'serif', lineHeight: 1 }}>U</span>
        </Btn>
        <Btn cmd="strikeThrough" title="Barré">
          <span style={{ textDecoration: 'line-through', fontSize: 13, fontFamily: 'serif', lineHeight: 1 }}>S</span>
        </Btn>

        <span className="rte-div" />

        <Btn cmd="superscript" title="Exposant">
          <span style={{ fontSize: 12, fontFamily: 'serif' }}>x<sup style={{ fontSize: 8 }}>2</sup></span>
        </Btn>
        <Btn cmd="subscript" title="Indice">
          <span style={{ fontSize: 12, fontFamily: 'serif' }}>x<sub style={{ fontSize: 8 }}>2</sub></span>
        </Btn>

        <span className="rte-div" />

        {/* Couleur texte */}
        <div className="rte-clr-wrap">
          <button type="button" className="rte-btn rte-btn--clr-main" title="Couleur du texte"
            onMouseDown={(e) => { e.preventDefault(); applyTextColor(lastTextColor); }}>
            <span className="rte-clr-letter" style={{ borderBottomColor: lastTextColor }}>A</span>
          </button>
          <button type="button" className="rte-btn rte-btn--clr-arr" title="Autres couleurs"
            onMouseDown={(e) => { e.preventDefault(); setOpenPalette(p => p === 'text' ? null : 'text'); }}>
            <svg width="7" height="5" viewBox="0 0 7 5"><path d="M0 0l3.5 5L7 0z" fill="currentColor"/></svg>
          </button>
          {openPalette === 'text' && (
            <ColorPalette colors={WORD_TEXT_COLORS} onPick={applyTextColor} onClose={() => setOpenPalette(null)} />
          )}
        </div>

        {/* Surlignage */}
        <div className="rte-clr-wrap">
          <button type="button" className="rte-btn rte-btn--clr-main" title="Couleur de surlignage"
            onMouseDown={(e) => { e.preventDefault(); applyHighlight(lastHlColor); }}>
            <span className="rte-hl-letter" style={{ background: lastHlColor }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2">
                <path d="M12 2L2 19h20L12 2z"/>
                <line x1="12" y1="9" x2="12" y2="14"/>
                <circle cx="12" cy="17" r="1" fill="#444"/>
              </svg>
            </span>
          </button>
          <button type="button" className="rte-btn rte-btn--clr-arr" title="Autres surlignages"
            onMouseDown={(e) => { e.preventDefault(); setOpenPalette(p => p === 'hl' ? null : 'hl'); }}>
            <svg width="7" height="5" viewBox="0 0 7 5"><path d="M0 0l3.5 5L7 0z" fill="currentColor"/></svg>
          </button>
          {openPalette === 'hl' && (
            <ColorPalette colors={WORD_HL_COLORS} flat onPick={applyHighlight} onClose={() => setOpenPalette(null)} />
          )}
        </div>

      </div>

      {/* ══ LIGNE 2 ══ */}
      <div className="rte-row rte-row--2">

        <button type="button"
          className={`rte-btn${activeAlign === 'left'   ? ' rte-btn--on' : ''}`}
          title="Aligner à gauche (Ctrl+L)"
          onMouseDown={(e) => { e.preventDefault(); exec('justifyLeft'); }}>
          <svg width="13" height="12" viewBox="0 0 16 14"><rect x="0" y="0" width="16" height="2" rx="1" fill="currentColor"/><rect x="0" y="4" width="11" height="2" rx="1" fill="currentColor"/><rect x="0" y="8" width="16" height="2" rx="1" fill="currentColor"/><rect x="0" y="12" width="9" height="2" rx="1" fill="currentColor"/></svg>
        </button>
        <button type="button"
          className={`rte-btn${activeAlign === 'center' ? ' rte-btn--on' : ''}`}
          title="Centrer (Ctrl+E)"
          onMouseDown={(e) => { e.preventDefault(); exec('justifyCenter'); }}>
          <svg width="13" height="12" viewBox="0 0 16 14"><rect x="0" y="0" width="16" height="2" rx="1" fill="currentColor"/><rect x="2.5" y="4" width="11" height="2" rx="1" fill="currentColor"/><rect x="0" y="8" width="16" height="2" rx="1" fill="currentColor"/><rect x="3.5" y="12" width="9" height="2" rx="1" fill="currentColor"/></svg>
        </button>
        <button type="button"
          className={`rte-btn${activeAlign === 'right'  ? ' rte-btn--on' : ''}`}
          title="Aligner à droite (Ctrl+R)"
          onMouseDown={(e) => { e.preventDefault(); exec('justifyRight'); }}>
          <svg width="13" height="12" viewBox="0 0 16 14"><rect x="0" y="0" width="16" height="2" rx="1" fill="currentColor"/><rect x="5" y="4" width="11" height="2" rx="1" fill="currentColor"/><rect x="0" y="8" width="16" height="2" rx="1" fill="currentColor"/><rect x="7" y="12" width="9" height="2" rx="1" fill="currentColor"/></svg>
        </button>
        <button type="button"
          className={`rte-btn${activeAlign === 'full'   ? ' rte-btn--on' : ''}`}
          title="Justifier (Ctrl+J)"
          onMouseDown={(e) => { e.preventDefault(); exec('justifyFull'); }}>
          <svg width="13" height="12" viewBox="0 0 16 14"><rect x="0" y="0" width="16" height="2" rx="1" fill="currentColor"/><rect x="0" y="4" width="16" height="2" rx="1" fill="currentColor"/><rect x="0" y="8" width="16" height="2" rx="1" fill="currentColor"/><rect x="0" y="12" width="13" height="2" rx="1" fill="currentColor"/></svg>
        </button>

        <span className="rte-div" />

        <button type="button" className="rte-btn" title="Interligne simple"
          onMouseDown={(e) => {
            e.preventDefault();
            editorRef.current?.focus();
            exec('insertHTML', '<div style="line-height:1.15">\u200B</div>');
          }}>
          <svg width="13" height="13" viewBox="0 0 16 16">
            <path d="M4 2h8M4 8h8M4 14h8M1 4l2-2 2 2M1 10l2 2 2-2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
        </button>

        <span className="rte-div" />

        <Btn cmd="insertUnorderedList" title="Liste à puces">
          <svg width="13" height="12" viewBox="0 0 16 14">
            <circle cx="2" cy="2" r="1.5" fill="currentColor"/>
            <rect x="5" y="1" width="11" height="2" rx="1" fill="currentColor"/>
            <circle cx="2" cy="7" r="1.5" fill="currentColor"/>
            <rect x="5" y="6" width="11" height="2" rx="1" fill="currentColor"/>
            <circle cx="2" cy="12" r="1.5" fill="currentColor"/>
            <rect x="5" y="11" width="11" height="2" rx="1" fill="currentColor"/>
          </svg>
        </Btn>

        <Btn cmd="insertOrderedList" title="Liste numérotée">
          <svg width="13" height="12" viewBox="0 0 16 14">
            <text x="0" y="3.5" fontSize="4" fill="currentColor" fontFamily="monospace">1.</text>
            <rect x="5" y="1" width="11" height="2" rx="1" fill="currentColor"/>
            <text x="0" y="8.5" fontSize="4" fill="currentColor" fontFamily="monospace">2.</text>
            <rect x="5" y="6" width="11" height="2" rx="1" fill="currentColor"/>
            <text x="0" y="13.5" fontSize="4" fill="currentColor" fontFamily="monospace">3.</text>
            <rect x="5" y="11" width="11" height="2" rx="1" fill="currentColor"/>
          </svg>
        </Btn>

        <span className="rte-div" />

        <button type="button" className="rte-btn" title="Diminuer le retrait (Maj+Tab)"
          onMouseDown={(e) => { e.preventDefault(); exec('outdent'); }}>
          <svg width="13" height="12" viewBox="0 0 16 12">
            <rect x="5" y="0" width="11" height="2" rx="1" fill="currentColor"/>
            <rect x="5" y="5" width="11" height="2" rx="1" fill="currentColor"/>
            <rect x="5" y="10" width="11" height="2" rx="1" fill="currentColor"/>
            <path d="M3 2L0 6l3 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button type="button" className="rte-btn" title="Augmenter le retrait (Tab)"
          onMouseDown={(e) => { e.preventDefault(); exec('indent'); }}>
          <svg width="13" height="12" viewBox="0 0 16 12">
            <rect x="5" y="0" width="11" height="2" rx="1" fill="currentColor"/>
            <rect x="5" y="5" width="11" height="2" rx="1" fill="currentColor"/>
            <rect x="5" y="10" width="11" height="2" rx="1" fill="currentColor"/>
            <path d="M0 2l3 4-3 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <span className="rte-div" />

        <button type="button" className="rte-btn" title="Effacer la mise en forme"
          onMouseDown={(e) => { e.preventDefault(); exec('removeFormat'); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 20H7L3 16l11-11 7 7-1.5 1.5"/>
            <path d="M6.5 17.5l5-5"/>
            <line x1="17" y1="20" x2="22" y2="20"/>
          </svg>
        </button>

      </div>

      {/* ══ ZONE DE SAISIE ══ */}
      <div
        ref={editorRef}
        className="rte-editor"
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleEditorKeyDown}
        onKeyUp={syncFormats}
        onMouseUp={syncFormats}
        onSelect={syncFormats}
        onFocus={syncFormats}
        data-placeholder={placeholder}
        spellCheck={true}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CHATBOT
══════════════════════════════════════════════════════════════════════ */
function Chatbot() {
  const [open, setOpen]           = useState(false);
  const [isExpanded, setExpanded] = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [chatState, setChatState] = useState("idle");
  const msgsRef   = useRef(null);
  const editorRef = useRef(null);

  const initMsgs = [{
    role: "bot",
    text: "👋 Bonjour ! Je suis votre assistant RH.\nQue souhaitez-vous faire ?",
    choices: [
      { label: "Trouver un candidat spécifique",          action: "find"          },
      { label: "Créer une shortlist (description texte)", action: "shortlist_text" },
    ],
  }];

  useEffect(() => {
    if (open && messages.length === 0) setMessages(initMsgs);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (msgsRef.current)
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages]);

  function lockChoices() {
    setMessages((m) => m.map((msg) => ({ ...msg, choices: undefined, type: undefined })));
  }

  function addMsg(role, text, choices, type) {
    setMessages((m) => [...m, { role, text, choices, type }]);
  }

  function handleRateLimitError(data) {
    addMsg("bot", data.message, [{ label: "Menu principal", action: "back" }]);
  }

  function buildCandidateMessages(candidates, isSearch, query) {
    const headerText = isSearch
      ? `🔍 ${candidates.length} candidat(s) trouvé(s) pour « ${query} » :`
      : `🏆 ${candidates.length} profil(s) avec une pertinence ≥ 70% :`;

    const msgs = [{ role: "bot", text: headerText }];

    candidates.forEach((c, idx) => {
      const name = decodeHtml(c.full_name || `${c.prenoms || ""} ${c.nom || ""}`.trim());
      let info = `${idx + 1}. ${name}`;
      if (c.similarity)            info += `\n   Pertinence : ${c.similarity}%`;
      if (c.secteur_activite)      info += `\n   Secteur : ${decodeHtml(c.secteur_activite)}`;
      if (c.niveau_academique)     info += `\n   Niveau : ${decodeHtml(c.niveau_academique)}`;
      if (c.email)                 info += `\n   ${decodeHtml(c.email)}`;
      if (c.tel || c.tel_whatsapp) info += `\n   ${decodeHtml(c.tel || c.tel_whatsapp)}`;
      const cvLink = c.cv_url ? [{ label: `Voir le CV — ${name}`, url: c.cv_url }] : [];
      msgs.push({ role: "bot", text: info, metadata: cvLink.length ? { links: cvLink } : undefined });
    });

    return msgs;
  }

  const MIN_PERTINENCE = 70;

  function pushCandidateResults(candidates, isSearch, query, followUpChoices) {
    if (!candidates || candidates.length === 0) return false;
    const filtered = candidates.filter(c => !c.similarity || c.similarity >= MIN_PERTINENCE);
    if (filtered.length === 0) return false;

    const msgs = buildCandidateMessages(filtered, isSearch, query);
    setMessages((m) => [
      ...m, ...msgs,
      { role: "bot", text: "Que souhaitez-vous faire ensuite ?", choices: followUpChoices },
    ]);
    return true;
  }

  function getRichTextContent() {
    if (!editorRef.current) return "";
    return editorRef.current.innerText?.trim() || "";
  }

  function clearEditor() {
    if (editorRef.current) editorRef.current.innerHTML = "";
  }

  async function matchByText(description) {
    setLoading(true);
    try {
      const response = await fetch(
        "/securebackoffice/backsecurebackoffice/chatbot.php?action=match_cvs_text",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: JSON.stringify({ job_description: description }),
        }
      );
      const data = await safeJson(response);

      if (response.status === 429 || data.rate_limited) {
        handleRateLimitError(data); setChatState("idle"); return;
      }
      if (!response.ok || !data.success) throw new Error(data.message || "Erreur lors du matching");

      const followUp = [
        { label: "Nouvelle recherche candidat", action: "find"           },
        { label: "Nouvelle shortlist",           action: "shortlist_text" },
        { label: "Menu principal",               action: "back"           },
      ];

      if (typeof data.remaining === "number" && data.remaining >= 0)
        addMsg("bot", `ℹ️ Il vous reste ${data.remaining} recherche(s) disponible(s) aujourd'hui.`);

      if (!pushCandidateResults(data.candidates, false, "", followUp)) {
        addMsg("bot", "😕 Aucun CV correspondant trouvé.", [
          { label: "Nouvelle shortlist", action: "shortlist_text" },
          { label: "Menu principal",     action: "back"           },
        ]);
      }
    } catch (err) {
      console.error("[Chatbot] matchByText error:", err);
      addMsg("bot", `Erreur : ${err.message}`, [
        { label: "Réessayer",      action: "shortlist_text" },
        { label: "Menu principal", action: "back"           },
      ]);
    } finally {
      setLoading(false); setChatState("idle");
    }
  }

  async function findCandidate(query) {
    setLoading(true);
    try {
      const response = await fetch(
        "/securebackoffice/backsecurebackoffice/chatbot.php?action=find_candidate",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: JSON.stringify({ query }),
        }
      );
      const data = await safeJson(response);

      if (response.status === 429 || data.rate_limited) {
        handleRateLimitError(data); setChatState("idle"); return;
      }
      if (!response.ok || !data.success) throw new Error(data.message || "Erreur lors de la recherche");

      const qNorm = normalize(query);
      const words = qNorm.split(/\s+/).filter(Boolean);
      const filtered = (data.candidates || []).filter((c) => {
        const fullName = normalize(`${c.prenoms || ""} ${c.nom || ""}`);
        const email    = normalize(c.email || "");
        if (words.length <= 1) return fullName.includes(qNorm) || email.includes(qNorm);
        return words.every((w) => fullName.includes(w) || email.includes(w));
      });

      const followUp = [
        { label: "Nouvelle recherche",  action: "find"           },
        { label: "Créer une shortlist", action: "shortlist_text" },
        { label: "Menu principal",      action: "back"           },
      ];

      if (typeof data.remaining === "number" && data.remaining >= 0)
        addMsg("bot", `ℹ️ Il vous reste ${data.remaining} recherche(s) disponible(s) aujourd'hui.`);

      if (!pushCandidateResults(filtered, true, query, followUp)) {
        addMsg("bot", `😕 Aucun candidat trouvé pour « ${query} ».`, [
          { label: "Réessayer",      action: "retry" },
          { label: "Menu principal", action: "back"  },
        ]);
      }
    } catch (err) {
      console.error("[Chatbot] findCandidate error:", err);
      addMsg("bot", `Erreur : ${err.message}`, [
        { label: "Réessayer",      action: "retry" },
        { label: "Menu principal", action: "back"  },
      ]);
    } finally {
      setLoading(false); setChatState("idle");
    }
  }

  function handleChoice(action) {
    lockChoices();
    switch (action) {
      case "find":
        setChatState("find");
        addMsg("user", "Trouver un candidat spécifique");
        addMsg("bot",  "Entrez le nom, prénom ou email du candidat :");
        break;
      case "shortlist_text":
        setChatState("shortlist_text");
        addMsg("user", "Créer une shortlist (description texte)");
        addMsg("bot",
          "Décrivez le profil recherché ci-dessous.\n" +
          "Précisez : intitulé du poste, compétences clés, années d'expérience, secteur, niveau...",
          undefined,
          "richEditor"
        );
        break;
      case "retry":
        setChatState("find");
        addMsg("bot", "Saisissez un autre nom, prénom ou email :");
        break;
      case "back":
        setChatState("idle");
        clearEditor();
        setMessages(initMsgs);
        break;
      default:
        break;
    }
  }

  function handleSend() {
    if (chatState === "shortlist_text") {
      const richContent = getRichTextContent();
      if (!richContent) return;
      lockChoices();
      addMsg("user", richContent);
      clearEditor();
      matchByText(richContent);
      return;
    }
    const val = input.trim();
    if (!val) return;
    setInput("");
    addMsg("user", val);
    if (chatState === "find") findCandidate(val);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <>
      <button className="zs-fab" onClick={() => setOpen((p) => !p)} title="Assistant RH IA">
        <i className="bi bi-robot" />
        <span className="zs-fab-pulse" />
      </button>

      {open && (
        <div className={`zs-window${isExpanded ? " zs-window--expanded" : ""}`}>
          <div className="zs-header">
            <div className="zs-av"><i className="bi bi-robot" /></div>
            <div className="zs-hinfo">
              <div className="zs-hname">Assistant RH Zenselekt</div>
              <div className="zs-hstatus">
                <span className="zs-dot" /> En ligne &nbsp;·&nbsp; Propulsé par Mistral AI
              </div>
            </div>
            <button className="zs-x zs-expand-btn"
              onClick={() => setExpanded((p) => !p)}
              title={isExpanded ? "Réduire" : "Agrandir"}>
              <i className={`bi ${isExpanded ? "bi-fullscreen-exit" : "bi-fullscreen"}`} />
            </button>
            <button className="zs-x" onClick={() => setOpen(false)} title="Fermer">×</button>
          </div>

          <div className="zs-msgs" ref={msgsRef}>
            {messages.map((m, i) => (
              <div key={i} className={`zs-msg zs-msg--${m.role}`}>
                {m.role === "bot" && <div className="zs-icon"><i className="bi bi-robot" /></div>}
                <div style={{ width: "100%" }}>
                  {m.text && (
                    <div className="zs-bubble" style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                  )}
                  {m.metadata?.links?.length > 0 && (
                    <div className="zs-choices">
                      {m.metadata.links.map((link, k) => (
                        <a key={k} href={link.url} target="_blank" rel="noopener noreferrer"
                          className="zs-choice--cv">
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                  {m.choices && (
                    <div className="zs-choices">
                      {m.choices.map((c, j) => (
                        <button key={j} className="zs-choice" onClick={() => handleChoice(c.action)}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {m.type === "richEditor" && chatState === "shortlist_text" && !loading && (
                    <div className="zs-rte-wrap">
                      <RichTextEditor
                        editorRef={editorRef}
                        placeholder="Décrivez les missions, le contexte, les responsabilités..."
                      />
                      <div className="zs-rte-actions">
                        <button className="zs-rte-send" onClick={handleSend} disabled={loading}>
                          Lancer la recherche
                        </button>
                        <span className="zs-rte-hint">
                          <i className="bi bi-info-circle" />
                          Ex : "Développeur React/PHP 5 ans, secteur fintech, licence minimum..."
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="zs-msg zs-msg--bot">
                <div className="zs-icon"><i className="bi bi-robot" /></div>
                <div className="zs-typing">
                  <span /><span /><span />
                  <span className="zs-typing-text">Recherche en cours...</span>
                </div>
              </div>
            )}
          </div>

          {chatState === "find" && (
            <div className="zs-input-wrap">
              <input
                className="zs-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nom, prénom ou email..."
                disabled={loading}
                autoFocus
              />
              <button className="zs-send" onClick={handleSend} disabled={loading || !input.trim()}>
                <i className="bi bi-send-fill" />
              </button>
            </div>
          )}

          {chatState === "idle" && (
            <div className="zs-input-wrap zs-input-wrap--idle">
              <span className="zs-idle-hint">
                <i className="bi bi-arrow-up-circle" /> Sélectionnez une option ci-dessus
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   NAVBAR PRINCIPALE
══════════════════════════════════════════════════════════════════════ */
export default function Navbar({ open, onClose }) {
  const [expanded, setExpanded] = useState({});
  const navigate = useNavigate();
  const { entreprise, loading, logout } = useSessionGuard();

  /* ── Carte de permissions (compte principal uniquement) ── */
  const permMap = useMemo(() => {
    if (!entreprise || entreprise.isSubUser) return {};
    return buildPermMap(entreprise.permissions || []);
  }, [entreprise]);

  /* ── Nav visible selon le type de compte ──────────────────────────
   *
   *  COMPTE PRINCIPAL  → entreprise.permissions (format structuré)
   *                       buildPermMap() + buildVisibleNav()
   *
   *  SOUS-UTILISATEUR  → entreprise.subUserMenuPerms (clés simples)
   *                       ex: ["dashboard","gestion_offres","emploi_consultation",...]
   *                       buildNavFromKeys()
   *
   *  subUserMenuPerms est exposé par session_check (PHP) depuis
   *  $_SESSION['bo_sub_menu_perms'] quand isSubUser === true.
   * ────────────────────────────────────────────────────────────────── */
  const visibleNav = useMemo(() => {
    if (!entreprise) return [NAV_CATALOG[0]];

    if (entreprise.isSubUser) {
      /* Sous-utilisateur : ses menus sont des clés simples */
      const subKeys = entreprise.subUserMenuPerms ?? [];
      return buildNavFromKeys(subKeys);
    }

    /* Compte principal : permissions structurées */
    return buildVisibleNav(permMap);
  }, [entreprise, permMap]);

  /* ── Chatbot : visible seulement pour le compte principal ──────────
   *  Le chatbot n'est accessible qu'aux entreprises qui ont la
   *  permission "chatbot" activée. Les sous-utilisateurs n'y ont
   *  pas accès directement (pas de clé "chatbot" dans subUserMenuPerms).
   * ────────────────────────────────────────────────────────────────── */
  const chatbotEnabled = useMemo(() => {
    if (!entreprise) return false;
    if (entreprise.isSubUser) return false; // jamais pour un sous-compte
    return !!(permMap["chatbot"]?.enabled);
  }, [entreprise, permMap]);

  function toggle(i) { setExpanded((e) => ({ ...e, [i]: !e[i] })); }

  function handleNavClick(item, i) {
    if (item.single && item.path) { navigate(item.path); onClose?.(); }
    else toggle(i);
  }

  function handleChildClick(child) {
    if (child.path) { navigate(child.path); onClose?.(); }
  }

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? "" : "sidebar--closed"}`}>
        {loading ? (
          <div className="sidebar-loading"><span className="sidebar-spinner" /></div>
        ) : (
          visibleNav.map((item, i) => (
            <div key={i}>
              <button
                className={`nav-item ${item.active ? "nav-item--active" : ""}`}
                onClick={() => handleNavClick(item, i)}
              >
                <i className={`bi ${item.icon} nav-icon`} />
                <span className="nav-label">{item.label}</span>
                {!item.single && (
                  <i className={`bi bi-chevron-down nav-chevron ${expanded[i] ? "open" : ""}`} />
                )}
              </button>
              {expanded[i] && item.children && (
                <div className="nav-sub">
                  {item.children.map((child, j) => (
                    <button key={j} className="nav-sub-item" onClick={() => handleChildClick(child)}>
                      <i className="bi bi-circle-fill nav-sub-dot" />
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        <div className="sidebar-divider sidebar-divider--bottom" />
        <button className="nav-item nav-item--logout" onClick={logout}>
          <i className="bi bi-box-arrow-left nav-icon" />
          <span className="nav-label">Déconnexion</span>
        </button>
      </aside>
      {chatbotEnabled && <Chatbot />}
    </>
  );
}
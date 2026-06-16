import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./component/Header";
import Navbar from "./component/Navbar";
import { useSessionGuard } from "./component/useSessionGuard";
import './css/resultatsTests.css';

/* ═══════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════ */
const API_BASE      = "/securebackoffice/backsecurebackoffice/resultatstests.php";
const AUTH_REDIRECT = "/securebackoffice/";
const BI_CDN        = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
const DOCX_CDN      = "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js";
const DOCX_CDN_FB   = "https://unpkg.com/docx@8.5.0/build/index.umd.js";

const TEST_DEFS = [
  { key: "pression", label: "Test de Pression"                   },
  { key: "domino",   label: "Test Psychotechnique – Dominos"    },
  { key: "anglais",  label: "Test d'Anglais"               },
  { key: "mbti",     label: "Test MBTI"                        },
  { key: "bigfive",  label: "Test des 5 Traits de Personnalité"},
];

const FILTER_TEST_OPTIONS = [
  { value: "",         label: "Tous les tests" },
  { value: "pression", label: "Test de Pression" },
  { value: "domino",   label: "Test Psychotechnique – Dominos" },
  { value: "anglais",  label: "Test d'Anglais" },
  { value: "mbti",     label: "Test MBTI" },
  { value: "bigfive",  label: "Test des 5 Traits de Personnalité" },
];

const MBTI_LIBELLES = {
  INTJ:"Le scientifique",   INTP:"Le penseur",    ENTJ:"Le directeur",   ENTP:"Le visionnaire",
  INFJ:"Le protecteur",       INFP:"L’idéaliste",   ENFJ:"Le donateur", ENFP:"Le charismatique",
  ISTJ:"L’exécutant", ISFJ:"L’infirmier",   ESTJ:"Le gardien",    ESFJ:"L’aide à domicile",
  ISTP:"Le mécanicien",    ISFP:"L’artiste",   ESTP:"L’homme d’action ",  ESFP:"L’acteur",
};

const NIVEAU_CODE_COLOR = {
  tres_eleve:  "#10b981",
  eleve:       "#4361ee",
  moyen:       "#f59e0b",
  faible:      "#ef4444",
  tres_faible: "#dc2626",
  a1: "#ef4444", a2: "#f59e0b", b1: "#4361ee",
  b2: "#4361ee", c1: "#10b981", c2: "#059669",
};

/* ═══════════════════════════════════════════════════════════
   UTILITAIRES
═══════════════════════════════════════════════════════════ */
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

async function secureFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: { "X-Requested-With": "XMLHttpRequest", ...(options.headers ?? {}) },
    credentials: "include",
    signal: options.signal ?? AbortSignal.timeout(20000),
  });
}

function handleAuthRedirect(res) {
  if (res.status === 401) {
    res.json()
      .then(j => window.location.replace(j.redirect_to ?? AUTH_REDIRECT))
      .catch(()  => window.location.replace(AUTH_REDIRECT));
    return true;
  }
  return false;
}

function initials(c) {
  return `${(c.prenoms ?? " ")[0]}${(c.nom ?? " ")[0]}`.toUpperCase();
}

function avatarColor(id) {
  const p = ["#4361ee","#7c3aed","#db2777","#0891b2","#059669","#d97706","#dc2626"];
  return p[id % p.length];
}

function getVisibleTestDefs(candidats) {
  const sentKeys = new Set();
  candidats.forEach(c => (c.tests_envoyes ?? []).forEach(k => sentKeys.add(k)));
  return TEST_DEFS.filter(d => sentKeys.has(d.key));
}

/* ═══════════════════════════════════════════════════════════
   COMPOSANT — BARRE DE PROGRESSION (Big Five)
═══════════════════════════════════════════════════════════ */
function PersonnaliteBar({ label, score, max = 50 }) {
  const pct = Math.min(100, Math.round((score / max) * 100));
  return (
    <div className="rt-pbar-row">
      <span className="rt-pbar-label">{label}</span>
      <div className="rt-pbar-track">
        <div className="rt-pbar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="rt-pbar-value">{score}</span>
    </div>
  );
}

function getScoreBadge(tests, key) {
  const r = tests?.[key];
  if (!r?.passe) return null;

  switch (key) {
    case "pression":
      return { label: `${r.score}/${r.score_max ?? 60}`, sub: r.niveau, color: NIVEAU_CODE_COLOR[r.niveau_code] ?? "#4361ee" };
    case "domino":
      return { label: `${r.score}/${r.score_max ?? 20}`, sub: r.niveau, color: NIVEAU_CODE_COLOR[r.niveau_code] ?? "#4361ee" };
    case "anglais":
      return { label: `${r.pourcentage?.toFixed(0)}%`, sub: r.niveau, color: NIVEAU_CODE_COLOR[r.niveau_code] ?? "#4361ee" };
    case "mbti":
      return { label: r.type, sub: MBTI_LIBELLES[r.type] ?? "", color: "#7c3aed" };
    case "bigfive":
      return { label: "Complété", sub: null, color: "#059669" };
    default:
      return null;
  }
}

/* ═══════════════════════════════════════════════════════════
   EXPORT WORD
   RÈGLE UNIQUE : description_niveau (PHP) contient déjà
   TOUT le texte narratif (préambule + score + interprétation).
   On ne génère JAMAIS de contenu statique dupliquant ce champ.
   Seuls MBTI et Big Five sont construits manuellement car
   ils n'ont pas de champ description_niveau.
═══════════════════════════════════════════════════════════ */
async function exportWord(candidat, offre) {
  if (!window.docx) {
    await new Promise((res, rej) => {
      const loadScript = (url, onFail) => {
        document.querySelectorAll("script[data-docx]").forEach(el => el.remove());
        const s = document.createElement("script");
        s.setAttribute("data-docx", "1");
        s.src = url;
        s.onload = res;
        s.onerror = onFail;
        document.head.appendChild(s);
      };
      loadScript(DOCX_CDN, () => {
        console.warn("docx CDN primary failed, trying fallback…");
        loadScript(DOCX_CDN_FB, rej);
      });
    });
  }

  const {
    Document, Packer, Paragraph, TextRun,
    AlignmentType, BorderStyle, ShadingType,
    LevelFormat,
  } = window.docx;

  const BLUE_DARK  = "1a3a6e";
  const TEAL       = "1a7070";
  const GRAY_DARK  = "1f2937";
  const GRAY_MED   = "4b5563";
  const GRAY_LIGHT = "6b7280";
  const WHITE      = "FFFFFF";

  const r            = candidat.tests ?? {};
  const testsEnvoyes = candidat.tests_envoyes ?? Object.keys(r);
  const nom          = candidat.nom ?? "";
  const prenoms      = candidat.prenoms ?? "";
  const nomComplet   = `${prenoms} ${nom}`.trim();
  const civilite     = (candidat.genre ?? candidat.Genre ?? "").toLowerCase() === "femme" ? "Madame" : "Monsieur";

  // ── Helpers de mise en forme ──────────────────────────────
  const gap = (size = 200) => new Paragraph({ spacing: { after: size } });

  const centeredBold = (text, size = 28, color = BLUE_DARK) => new Paragraph({
    children: [new TextRun({ text, bold: true, size, color, font: "Calibri" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
  });

  const centeredItalic = (text, size = 22, color = GRAY_MED) => new Paragraph({
    children: [new TextRun({ text, size, color, font: "Calibri", italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
  });

  const sectionBar = (text) => new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: WHITE, font: "Calibri" })],
    shading: { fill: TEAL, type: ShadingType.CLEAR },
    spacing: { before: 280, after: 0 },
    indent: { left: 200, right: 200 },
  });

  const subTitle = (text) => new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22, color: BLUE_DARK, font: "Calibri" })],
    spacing: { before: 180, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "d1d5db" } },
  });

  const bodyText = (text) => new Paragraph({
    children: [new TextRun({ text: String(text ?? "—"), size: 20, color: GRAY_DARK, font: "Calibri" })],
    spacing: { line: 320, after: 80 },
  });

  const italicBody = (text) => new Paragraph({
    children: [new TextRun({ text: String(text ?? ""), size: 20, color: GRAY_MED, font: "Calibri", italics: true })],
    spacing: { line: 300, after: 80 },
  });

  const blockquote = (text) => new Paragraph({
    children: [new TextRun({ text: String(text ?? ""), size: 19, color: GRAY_MED, font: "Calibri", italics: true })],
    spacing: { line: 300, after: 100 },
    indent: { left: 400 },
    border: { left: { style: BorderStyle.SINGLE, size: 8, color: "9ca3af" } },
  });

  const nonPasse = () => new Paragraph({
    children: [new TextRun({ text: "Non passé", size: 20, color: "f59e0b", font: "Calibri", bold: true })],
    spacing: { before: 80, after: 100 },
  });

  const separator = () => new Paragraph({
    spacing: { before: 300, after: 80 },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: "e5e7eb" } },
  });

  /*
   * renderDescriptionNiveau
   * Affiche le contenu brut de description_niveau ligne par ligne.
   * Ce champ contient TOUT : préambule, score, interprétation, narratif.
   * NE PAS ajouter d'autre contenu autour pour ce type de tests.
   */
  const renderDescriptionNiveau = (description) => {
    if (!description) return;
    String(description).split("\n").forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) { children.push(gap(60)); return; }
      children.push(bodyText(trimmed));
    });
  };

  // Ligne correctes / incorrectes / sans réponse
  const detailRow = (nbCorrect, nbIncorrect, nbUnanswered) => new Paragraph({
    children: [
      new TextRun({ text: `Réponses correctes : `, size: 20, color: GRAY_MED, font: "Calibri" }),
      new TextRun({ text: `${nbCorrect ?? "—"}`, bold: true, size: 20, color: "065f46", font: "Calibri" }),
      new TextRun({ text: `     |     Incorrectes : `, size: 20, color: GRAY_MED, font: "Calibri" }),
      new TextRun({ text: `${nbIncorrect ?? "—"}`, bold: true, size: 20, color: "991b1b", font: "Calibri" }),
      ...(nbUnanswered != null ? [
        new TextRun({ text: `     |     Sans réponse : `, size: 20, color: GRAY_MED, font: "Calibri" }),
        new TextRun({ text: `${nbUnanswered}`, bold: true, size: 20, color: GRAY_MED, font: "Calibri" }),
      ] : []),
    ],
    spacing: { after: 80 },
  });

  // Bloc Big Five (construit manuellement — pas de description_niveau)
  const bigFiveBlock = (label, desc, score, niveau, nomC, civ) => [
    new Paragraph({
      children: [new TextRun({ text: `${label} :`, bold: true, size: 20, color: BLUE_DARK, font: "Calibri" })],
      spacing: { before: 160, after: 40 },
    }),
    italicBody(desc),
    new Paragraph({
      children: [
        new TextRun({ text: `A ce trait de personnalité, `, size: 20, color: GRAY_DARK, font: "Calibri", italics: true }),
        new TextRun({ text: `${civ} ${nomC} `, bold: true, size: 20, color: GRAY_DARK, font: "Calibri", italics: true }),
        new TextRun({ text: `a obtenu un score de `, size: 20, color: GRAY_DARK, font: "Calibri", italics: true }),
        new TextRun({ text: `${score ?? "—"} points`, bold: true, size: 20, color: TEAL, font: "Calibri", italics: true }),
        ...(niveau ? [
          new TextRun({ text: `, ce qui signifie un niveau `, size: 20, color: GRAY_DARK, font: "Calibri", italics: true }),
          new TextRun({ text: niveau, bold: true, size: 20, color: TEAL, font: "Calibri", italics: true }),
        ] : []),
        new TextRun({ text: ".", size: 20, color: GRAY_DARK, font: "Calibri", italics: true }),
      ],
      spacing: { after: 100 },
    }),
  ];

  const children = [];

  // ── PAGE DE COUVERTURE ────────────────────────────────────
  children.push(
    gap(600),
    centeredBold(nomComplet, 40, BLUE_DARK),
    gap(60),
    centeredBold("Résultats des tests", 28, TEAL),
    gap(40),
    centeredBold(`POSTE CONCERNÉ : ${offre.toUpperCase()}`, 24, GRAY_DARK),
    gap(200),
    new Paragraph({
      children: [new TextRun({ text: " " })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL } },
      spacing: { after: 200 },
    }),
    centeredItalic("© Empower Talents & Careers — Zenselekt. Tous droits réservés.", 18, GRAY_LIGHT),
    gap(200),
  );

  const testLabels = {
    mbti:     "MBTI",
    bigfive:  "Les 5 traits de personnalité",
    pression: "Gestion de la pression",
    domino:   "Test Psychotechnique – Dominos",
    anglais:  "Test d'Anglais",
  };

  // ── LISTE DES TESTS ───────────────────────────────────────
  children.push(
    sectionBar("Résultats des tests"),
    gap(120),
    bodyText("Nous précisons que l'ensemble des données figurant ci-dessous sont relatives aux tests suivants :"),
    gap(80),
  );
  testsEnvoyes.forEach(key => {
    const label = testLabels[key] ?? key;
    children.push(new Paragraph({
      children: [new TextRun({ text: label, size: 20, color: GRAY_DARK, font: "Calibri" })],
      spacing: { after: 60 },
      indent: { left: 480, hanging: 240 },
      numbering: { reference: "bullets", level: 0 },
    }));
  });
  children.push(gap(200));

  /* ══════════════════════════════════════════════════════════
     MBTI
     Construction manuelle : report_text contient le narratif,
     la phrase d'intro (type + libellé) est ajoutée séparément.
  ══════════════════════════════════════════════════════════ */
  if (testsEnvoyes.includes("mbti")) {
    children.push(sectionBar(`Résultats au Test MBTI – ${nomComplet}`), gap(120));

    if (!r.mbti?.passe) {
      children.push(nonPasse());
    } else {
      const type    = r.mbti.type ?? "";
      const libelle = MBTI_LIBELLES[type] ?? "";

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${civilite} `, size: 20, color: GRAY_DARK, font: "Calibri" }),
            new TextRun({ text: nomComplet, bold: true, size: 20, color: GRAY_DARK, font: "Calibri" }),
            new TextRun({ text: ` possède le type de personnalité `, size: 20, color: GRAY_DARK, font: "Calibri" }),
            new TextRun({ text: `${type}${libelle ? ` — ${libelle}` : ""}`, bold: true, size: 20, color: TEAL, font: "Calibri" }),
            new TextRun({ text: ".", size: 20, color: GRAY_DARK, font: "Calibri" }),
          ],
          spacing: { after: 120 },
        }),
      );

      if (r.mbti.report_text) {
        String(r.mbti.report_text).split("\n").forEach(line => {
          const trimmed = line.trim();
          if (!trimmed) { children.push(gap(80)); return; }
          children.push(bodyText(trimmed));
        });
      } else {
        children.push(
          subTitle("Bref descriptif du profil"),
          bodyText(`${civilite} ${nomComplet} possède un type de personnalité ${type}${libelle ? ` (${libelle})` : ""}.`),
          italicBody("Veuillez consulter la fiche complète du profil pour plus d'informations."),
        );
      }
    }
    children.push(gap(200));
  }

  /* ══════════════════════════════════════════════════════════
     BIG FIVE
     Construction manuelle depuis les champs individuels.
     rapport_complet est un narratif séparé optionnel.
  ══════════════════════════════════════════════════════════ */
  if (testsEnvoyes.includes("bigfive")) {
    children.push(sectionBar(`Résultats au Test les « 5 Traits de personnalité »`), gap(120));

    if (!r.bigfive?.passe) {
      children.push(nonPasse());
    } else {
      const bf = r.bigfive;

      children.push(
        subTitle("Préambule"),
        blockquote("Les psychologues n'ont pas vocation à cataloguer les gens en les classant comme « extravertis » ou « introvertis », « agréables » ou « désagréables » et ainsi de suite."),
        blockquote("Cela dit, une règle empirique peut être établie en transposant simplement les cinq bandes de notation du questionnaire originel sur les fourchettes de score possibles pour chaque trait :"),
        blockquote("10-17 = Très faible ; 18-25 = Faible ; 26-33 = Fort ; 34-41 = Assez fort ; 42-50 = Très fort."),
        gap(120),
        subTitle("Interprétation des résultats"),
        gap(80),
      );

      const traits = [
        {
          label:  "Ouverture aux expériences",
          desc:   "Les personnes qui aiment apprendre de nouvelles choses et apprécient les nouvelles expériences marquent généralement un score élevé en Ouverture. Cette dimension englobe des traits tels qu'être perspicace et imaginatif, et avoir de multiples centres d'intérêt.",
          score:  bf.ouverture       ?? bf.score_ouverture,
          niveau: bf.niv_ouverture   ?? bf.niveau_ouverture,
        },
        {
          label:  "Conscience professionnelle",
          desc:   "Les personnes qui ont un haut degré de conscience professionnelle sont fiables et ponctuelles. Les traits incluent le fait d'être organisé, méthodique et rigoureux.",
          score:  bf.conscienciosite     ?? bf.score_conscienciosite,
          niveau: bf.niv_conscienciosite ?? bf.niveau_conscienciosite,
        },
        {
          label:  "Extraversion",
          desc:   "Les extravertis puisent leur énergie dans l'interaction avec les autres, tandis que les introvertis la puisent au fond d'eux-mêmes. L'extraversion comprend des traits de type dynamique, loquace et assertif.",
          score:  bf.extraversion     ?? bf.score_extraversion,
          niveau: bf.niv_extraversion ?? bf.niveau_extraversion,
        },
        {
          label:  "Agréabilité",
          desc:   "Ces individus sont amicaux, coopérants et doués de compassion. Les personnes ayant un score bas d'agréabilité peuvent être plus distantes. Parmi les traits, citons le fait d'être gentil, affectueux et sympathique.",
          score:  bf.agreabilite     ?? bf.score_agreabilite,
          niveau: bf.niv_agreabilite ?? bf.niveau_agreabilite,
        },
        {
          label:  "Névrosisme",
          desc:   "On parle également de Stabilité émotionnelle. Cette dimension porte sur la stabilité émotionnelle de la personne et son degré d'émotions négatives. Les personnes qui marquent un score élevé en Névrosisme sont souvent confrontées à une instabilité émotionnelle et à des émotions négatives.",
          score:  bf.nevrosisme     ?? bf.score_nevrosisme,
          niveau: bf.niv_nevrosisme ?? bf.niveau_nevrosisme,
        },
      ];

      traits.forEach(t => {
        bigFiveBlock(t.label, t.desc, t.score, t.niveau, nomComplet, civilite)
          .forEach(p => children.push(p));
      });

      if (bf.rapport_complet) {
        children.push(gap(120), subTitle("Rapport complet"), gap(80));
        String(bf.rapport_complet).split("\n").forEach(line => {
          const trimmed = line.trim();
          if (!trimmed) { children.push(gap(60)); return; }
          children.push(bodyText(trimmed));
        });
      }
    }
    children.push(gap(200));
  }

  /* ══════════════════════════════════════════════════════════
     PRESSION
     description_niveau contient TOUT :
     préambule + score + interprétation + narratif.
     On affiche uniquement sectionBar + description_niveau.
  ══════════════════════════════════════════════════════════ */
  if (testsEnvoyes.includes("pression")) {
    children.push(sectionBar("Gestion du stress et de la pression"), gap(120));

    if (!r.pression?.passe) {
      children.push(nonPasse());
    } else {
      const p = r.pression;

      renderDescriptionNiveau(p.description_niveau);

      if (p.time_spent_seconds != null) {
        children.push(new Paragraph({
          children: [new TextRun({
            text: `Temps passé : ${Math.floor(p.time_spent_seconds / 60)} min ${p.time_spent_seconds % 60} s`,
            size: 18, color: GRAY_LIGHT, font: "Calibri", italics: true,
          })],
          spacing: { after: 60 },
        }));
      }
    }
    children.push(gap(200));
  }

  /* ══════════════════════════════════════════════════════════
     DOMINO
     description_niveau contient TOUT :
     préambule + score + interprétation + narratif.
     On affiche uniquement sectionBar + description_niveau
     + la ligne correctes/incorrectes/sans réponse.
  ══════════════════════════════════════════════════════════ */
  if (testsEnvoyes.includes("domino")) {
    children.push(sectionBar("Test Psychotechnique – Dominos"), gap(120));

    if (!r.domino?.passe) {
      children.push(nonPasse());
    } else {
      const d = r.domino;

      renderDescriptionNiveau(d.description_niveau);

      if (d.nb_correct != null || d.nb_incorrect != null) {
        children.push(gap(80), detailRow(d.nb_correct, d.nb_incorrect, d.nb_unanswered));
      }
    }
    children.push(gap(200));
  }

  /* ══════════════════════════════════════════════════════════
     ANGLAIS
     description_niveau contient TOUT :
     score % + niveau + interprétation + narratif.
     On affiche uniquement sectionBar + description_niveau
     + la ligne correctes/incorrectes/sans réponse.
  ══════════════════════════════════════════════════════════ */
  if (testsEnvoyes.includes("anglais")) {
    children.push(sectionBar("Test d'Anglais"), gap(120));

    if (!r.anglais?.passe) {
      children.push(nonPasse());
    } else {
      const a = r.anglais;

      renderDescriptionNiveau(a.description_niveau);

      if (a.nb_correct != null || a.nb_incorrect != null) {
        children.push(gap(80), detailRow(a.nb_correct, a.nb_incorrect, a.nb_unanswered));
      }
    }
    children.push(gap(200));
  }

  // ── PIED DE PAGE ─────────────────────────────────────────
  children.push(
    separator(),
    new Paragraph({
      children: [new TextRun({
        text: "© Zenselekt — Empower Talents & Careers. Tous droits réservés.",
        size: 16, color: GRAY_LIGHT, font: "Calibri", italics: true,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
  );

  const doc = new Document({
    numbering: {
      config: [{
        reference: "bullets",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 480, hanging: 240 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
        },
      },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `Rapport_Evaluation_${nom}_${prenoms}_${offre.replace(/\s+/g, "_")}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/* ═══════════════════════════════════════════════════════════
   MODAL DÉTAIL CANDIDAT
═══════════════════════════════════════════════════════════ */
function DetailModal({ candidatSummary, eventId, offre, onClose, onExportWord }) {
  const [detail,    setDetail]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url  = `${API_BASE}?action=get_candidat&event_id=${eventId}&email=${encodeURIComponent(candidatSummary.email)}`;
        const res  = await secureFetch(url, { signal: ctrl.signal });
        if (handleAuthRedirect(res)) return;
        const json = await res.json();
        if (!json.success) throw new Error(json.message || "Erreur API");
        setDetail(json.data);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [candidatSummary.email, eventId]);

  const handleExport = async () => {
    if (!detail) return;
    setExporting(true);
    const raw          = detail.resultats;
    const testsEnvoyes = detail.tests_envoyes ?? [];

    const forExport = {
      ...detail.candidat,
      genre:         detail.candidat.Genre,
      tests_envoyes: testsEnvoyes,
      tests: {
        ...(testsEnvoyes.includes("pression") && {
          pression: raw.pression ? {
            passe:              true,
            score:              raw.pression.score,
            score_max:          60,
            niveau:             raw.pression.niveau_stress,
            niveau_code:        raw.pression.niveau_code,
            description_niveau: raw.pression.description_niveau,
            time_spent_seconds: raw.pression.time_spent_seconds,
          } : { passe: false },
        }),
        ...(testsEnvoyes.includes("domino") && {
          domino: raw.domino ? {
            passe:              true,
            score:              raw.domino.score,
            score_max:          20,
            niveau:             raw.domino.niveau_label,
            niveau_code:        raw.domino.niveau_code,
            description_niveau: raw.domino.description_niveau,
            nb_correct:         raw.domino.nb_correct,
            nb_incorrect:       raw.domino.nb_incorrect,
            nb_unanswered:      raw.domino.nb_unanswered,
          } : { passe: false },
        }),
        ...(testsEnvoyes.includes("anglais") && {
          anglais: raw.anglais ? {
            passe:              true,
            nb_correct:         raw.anglais.nb_correct,
            nb_incorrect:       raw.anglais.nb_incorrect,
            nb_unanswered:      raw.anglais.nb_unanswered,
            pourcentage:        raw.anglais.pourcentage,
            niveau:             raw.anglais.niveau_label,
            niveau_code:        raw.anglais.niveau_code,
            description_niveau: raw.anglais.description_niveau,
          } : { passe: false },
        }),
        ...(testsEnvoyes.includes("mbti") && {
          mbti: raw.mbti ? {
            passe:       true,
            type:        raw.mbti.mbti_type,
            report_text: raw.mbti.report_text,
          } : { passe: false },
        }),
        ...(testsEnvoyes.includes("bigfive") && {
          bigfive: raw.bigfive ? {
            passe:               true,
            ouverture:           raw.bigfive.score_ouverture,
            conscienciosite:     raw.bigfive.score_conscienciosite,
            extraversion:        raw.bigfive.score_extraversion,
            agreabilite:         raw.bigfive.score_agreabilite,
            nevrosisme:          raw.bigfive.score_nevrosisme,
            niv_ouverture:       raw.bigfive.niveau_ouverture,
            niv_conscienciosite: raw.bigfive.niveau_conscienciosite,
            niv_extraversion:    raw.bigfive.niveau_extraversion,
            niv_agreabilite:     raw.bigfive.niveau_agreabilite,
            niv_nevrosisme:      raw.bigfive.niveau_nevrosisme,
            rapport_complet:     raw.bigfive.rapport_complet,
          } : { passe: false },
        }),
      },
    };

    try { await onExportWord(forExport); }
    catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  const renderTestBlock = (def) => {
    if (!detail) return null;
    const testsEnvoyes = detail.tests_envoyes ?? [];
    if (!testsEnvoyes.includes(def.key)) return null;
    const r = detail.resultats[def.key];

    return (
      <div className="rt-section" key={def.key}>
        <div className="rt-section-title">
          <i className={`bi ${def.icon}`} style={{ marginRight: 6 }} />
          {def.label}
        </div>

        {!r ? (
          <div className="rt-not-taken">
            <i className="bi bi-hourglass-half" /> Non passé
          </div>
        ) : (
          <div className="rt-section-body">
            {def.key === "pression" && (
              <>
                <div className="rt-score-row">
                  <span className="rt-score-label">Score</span>
                  <span className="rt-score-chip">{r.score} / 60</span>
                  {r.niveau_stress && (
                    <span className="rt-niveau-badge" style={{ background: NIVEAU_CODE_COLOR[r.niveau_code] ?? "#4361ee" }}>
                      {r.niveau_stress}
                    </span>
                  )}
                </div>
                {r.time_spent_seconds != null && (
                  <p className="rt-meta-info">
                    <i className="bi bi-clock" /> Temps : {Math.floor(r.time_spent_seconds / 60)} min {r.time_spent_seconds % 60} s
                  </p>
                )}
              </>
            )}

            {def.key === "domino" && (
              <>
                <div className="rt-score-row">
                  <span className="rt-score-label">Score</span>
                  <span className="rt-score-chip">{r.score} / 20</span>
                  {r.niveau_label && (
                    <span className="rt-niveau-badge" style={{ background: NIVEAU_CODE_COLOR[r.niveau_code] ?? "#4361ee" }}>
                      {r.niveau_label}
                    </span>
                  )}
                </div>
                {(r.nb_correct != null || r.nb_incorrect != null || r.nb_unanswered != null) && (
                  <div className="rt-detail-grid">
                    <div className="rt-detail-item rt-detail-item--green">
                      <span>{r.nb_correct ?? "—"}</span><small>Correctes</small>
                    </div>
                    <div className="rt-detail-item rt-detail-item--red">
                      <span>{r.nb_incorrect ?? "—"}</span><small>Incorrectes</small>
                    </div>
                    <div className="rt-detail-item rt-detail-item--gray">
                      <span>{r.nb_unanswered ?? "—"}</span><small>Sans réponse</small>
                    </div>
                  </div>
                )}
              </>
            )}

            {def.key === "anglais" && (
              <>
                <div className="rt-score-row">
                  <span className="rt-score-label">Score</span>
                  <span className="rt-score-chip">{r.pourcentage?.toFixed(1) ?? "—"} %</span>
                  {r.niveau_label && (
                    <span className="rt-niveau-badge" style={{ background: NIVEAU_CODE_COLOR[r.niveau_code] ?? "#4361ee" }}>
                      {r.niveau_label}
                    </span>
                  )}
                </div>
                {(r.nb_correct != null || r.nb_incorrect != null || r.nb_unanswered != null) && (
                  <div className="rt-detail-grid">
                    <div className="rt-detail-item rt-detail-item--green">
                      <span>{r.nb_correct ?? "—"}</span><small>Correctes</small>
                    </div>
                    <div className="rt-detail-item rt-detail-item--red">
                      <span>{r.nb_incorrect ?? "—"}</span><small>Incorrectes</small>
                    </div>
                    <div className="rt-detail-item rt-detail-item--gray">
                      <span>{r.nb_unanswered ?? "—"}</span><small>Sans réponse</small>
                    </div>
                  </div>
                )}
              </>
            )}

            {def.key === "mbti" && (
              <div className="rt-mbti-row">
                <span className="rt-mbti-type">{r.mbti_type}</span>
                <span className="rt-mbti-libelle">{MBTI_LIBELLES[r.mbti_type] ?? ""}</span>
              </div>
            )}

            {def.key === "bigfive" && (
              <div className="rt-pbar-wrap">
                <PersonnaliteBar label="Ouverture"        score={r.score_ouverture} />
                <PersonnaliteBar label="Conscienciosité"  score={r.score_conscienciosite} />
                <PersonnaliteBar label="Extraversion"     score={r.score_extraversion} />
                <PersonnaliteBar label="Agréabilité"      score={r.score_agreabilite} />
                <PersonnaliteBar label="Névrosisme"       score={r.score_nevrosisme} />
              </div>
            )}

            {r.date_passage && (
              <p className="rt-meta-info" style={{ marginTop: 8 }}>
                <i className="bi bi-calendar-check" /> Passé le{" "}
                {new Date(r.date_passage).toLocaleDateString("fr-FR", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              </p>
            )}

            <p className="rt-meta-info" style={{ marginTop: 4, fontStyle: "italic" }}>
              
              Rapport détaillé disponible via « Imprimer en Word »
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rt-modal-overlay" onClick={onClose}>
      <div className="rt-modal" onClick={e => e.stopPropagation()}>
        <div className="rt-modal-header">
          <div className="rt-modal-candidate">
            <div className="rt-avatar" style={{ background: avatarColor(candidatSummary.id) }}>
              {initials(candidatSummary)}
            </div>
            <div>
              <h3 className="rt-modal-name">{candidatSummary.prenoms} {candidatSummary.nom}</h3>
              <span className="rt-modal-email">{candidatSummary.email}</span>
            </div>
          </div>
          <div className="rt-modal-actions">
            <button
              className={`rt-word-btn ${exporting ? "rt-word-btn--loading" : ""}`}
              onClick={handleExport}
              disabled={exporting || loading || !detail}
            >
              {exporting
                ? <><i className="bi bi-hourglass-split" /> <span className="rt-btn-label">Génération…</span></>
                : <><i className="bi bi-file-earmark-word-fill" /> <span className="rt-btn-label">Imprimer en Word</span></>
              }
            </button>
            <button className="rt-modal-close" onClick={onClose}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>

        <div className="rt-modal-body">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: 48 }}>
              <div style={{
                width: 36, height: 36, border: "3px solid #e2e8f0",
                borderTop: "3px solid #1a7070", borderRadius: "50%",
                animation: "rt-spin 0.8s linear infinite",
              }} />
              <style>{`@keyframes rt-spin { to { transform: rotate(360deg); } }`}</style>
              <span style={{ color: "#93a4c3", fontSize: 14 }}>Chargement des résultats…</span>
            </div>
          ) : error ? (
            <div style={{ padding: 24, textAlign: "center", color: "#ef4444" }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 28, marginBottom: 8 }} />
              <p>{error}</p>
            </div>
          ) : (
            TEST_DEFS.map(def => renderTestBlock(def))
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function ResultatsTests() {
  useBootstrapIcons();

  const location    = useLocation();
  const navigate    = useNavigate();
  const { checked } = useSessionGuard();

  const queryParams = new URLSearchParams(location.search);
  const poste       = queryParams.get("poste")    || "Offre d'emploi";
  const eventId     = parseInt(queryParams.get("event_id") || "0", 10);

  const [width,       setWidth]       = useState(window.innerWidth);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  useEffect(() => { if (width <= 768) setSidebarOpen(false); }, [width]);
  const isMobile = width <= 768;

  const [searchTerm,   setSearchTerm]   = useState("");
  const [filterTest,   setFilterTest]   = useState("");
  const [page,         setPage]         = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [candidats,  setCandidats]  = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const [stats,        setStats]        = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [selectedCandidat, setSelectedCandidat] = useState(null);

  const tableRef = useRef(null);

  const fetchStats = useCallback(async () => {
    if (!eventId) return;
    setLoadingStats(true);
    try {
      const res  = await secureFetch(`${API_BASE}?action=stats&event_id=${eventId}`);
      if (handleAuthRedirect(res)) return;
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch (_) {}
    finally { setLoadingStats(false); }
  }, [eventId]);

  const fetchCandidats = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        action:      "list_candidats",
        event_id:    String(eventId),
        page:        String(page),
        limit:       String(itemsPerPage),
        search:      searchTerm,
        filter_test: filterTest,
      });
      const res  = await secureFetch(`${API_BASE}?${params}`);
      if (handleAuthRedirect(res)) return;
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erreur API");
      setCandidats(json.data.candidats ?? []);
      setTotal(json.data.total ?? 0);
      setTotalPages(json.data.total_pages ?? 1);
    } catch (err) {
      setError(err.message || "Impossible de charger les candidats.");
      setCandidats([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, page, itemsPerPage, searchTerm, filterTest]);

  useEffect(() => { fetchStats(); },     [fetchStats]);
  useEffect(() => { fetchCandidats(); }, [fetchCandidats]);
  useEffect(() => { setPage(1); }, [searchTerm, filterTest, itemsPerPage]);

  const visibleTestDefs = getVisibleTestDefs(candidats);

  const kpiCandidats          = stats?.total_candidats_avec_tests ?? 0;
  const kpiCandidatsAvecTests = stats?.total_candidats_avec_tests ?? 0;

  const kpiPression  = stats?.tests_passes?.pression  ?? 0;
  const kpiMbti      = stats?.tests_passes?.mbti      ?? 0;
  const kpiDomino    = stats?.tests_passes?.domino    ?? 0;
  const kpiBigfive   = stats?.tests_passes?.bigfive   ?? 0;
  const kpiAnglais   = stats?.tests_passes?.anglais   ?? 0;
  const totalPasses  = kpiPression + kpiMbti + kpiDomino + kpiBigfive + kpiAnglais;

  const kpiEnvoyes    = stats?.tests_envoyes ?? {};
  const kpiTypesTests = Object.keys(kpiEnvoyes).length;
  const completionPct = stats?.completion_rate ?? 0;

  function progressFor(c) {
    const testsEnvoyes = c.tests_envoyes ?? [];
    const tests        = c.tests ?? {};
    if (testsEnvoyes.length === 0) return { passed: 0, possible: 0, pct: 0 };
    const passed = testsEnvoyes.filter(k => tests[k]?.passe).length;
    return { passed, possible: testsEnvoyes.length, pct: Math.round((passed / testsEnvoyes.length) * 100) };
  }

  if (!checked) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#f4f6fa",
        flexDirection: "column", gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, border: "3px solid #e2e8f0",
          borderTop: "3px solid #1a7070", borderRadius: "50%",
          animation: "rt-spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes rt-spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: "#93a4c3", fontSize: 14 }}>Vérification en cours…</span>
      </div>
    );
  }

  return (
    <div className="rt-app">
      <style>{`@keyframes rt-spin { to { transform: rotate(360deg); } }`}</style>

      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(p => !p)}
        isMobile={isMobile}
      />

      <div className="rt-layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={`rt-main ${sidebarOpen ? "rt-main--shifted" : ""}`}>
          <div className="rt-container">

            {/* Breadcrumb */}
            <div className="rt-breadcrumb">
              <div className="rt-breadcrumb-left">
                <button className="rt-back-btn" onClick={() => navigate(-1)}>
                  <i className="bi bi-arrow-left" /> Retour
                </button>
                <div>
                  <h1 className="rt-title">Résultats des Tests</h1>
                  <p className="rt-subtitle">{poste}</p>
                </div>
              </div>
            </div>

            {/* ── KPI ── */}
            <div className="rt-kpi-grid">

              <div className="rt-kpi-card rt-kpi-card--blue">
                <div className="rt-kpi-icon"><i className="bi bi-people-fill" /></div>
                <div className="rt-kpi-content">
                  <span className="rt-kpi-value">{loadingStats ? "…" : kpiCandidats}</span>
                  <span className="rt-kpi-label">Candidats avec test(s) envoyé(s)</span>
                </div>
              </div>

              <div className="rt-kpi-card rt-kpi-card--purple">
                <div className="rt-kpi-icon"><i className="bi bi-clipboard2-check-fill" /></div>
                <div className="rt-kpi-content">
                  <span className="rt-kpi-value">{loadingStats ? "…" : kpiTypesTests}</span>
                  <span className="rt-kpi-label">Types de tests envoyés</span>
                </div>
              </div>

              <div className="rt-kpi-card rt-kpi-card--green">
                <div className="rt-kpi-icon"><i className="bi bi-check-circle-fill" /></div>
                <div className="rt-kpi-content">
                  <span className="rt-kpi-value">{loadingStats ? "…" : totalPasses}</span>
                  <span className="rt-kpi-label">Tests complétés</span>
                </div>
              </div>

              <div className="rt-kpi-card rt-kpi-card--orange">
                <div className="rt-kpi-icon"><i className="bi bi-percent" /></div>
                <div className="rt-kpi-content">
                  <span className="rt-kpi-value">{loadingStats ? "…" : `${completionPct}%`}</span>
                  <span className="rt-kpi-label">
                    Taux de complétion
                    {!loadingStats && kpiCandidatsAvecTests > 0 && (
                      <span style={{ fontSize: 11, color: "#9ca3af", display: "block", fontWeight: 400 }}>
                        sur {kpiCandidatsAvecTests} destinataires
                      </span>
                    )}
                  </span>
                </div>
                {!loadingStats && (
                  <div className="rt-kpi-progress" style={{ "--pct": `${completionPct}%` }} />
                )}
              </div>

            </div>

            {/* Filtres */}
            <div className="rt-filters-card">
              <div className="rt-filters-header">
                Filtres
              </div>
              <div className="rt-filters-row">
                <div className="rt-search-wrap">
                  <i className="bi bi-search" />
                  <input
                    type="text"
                    placeholder="Nom, prénom ou email…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")}><i className="bi bi-x" /></button>
                  )}
                </div>
                <select value={filterTest} onChange={e => setFilterTest(e.target.value)}>
                  {FILTER_TEST_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {(searchTerm || filterTest) && (
                  <button className="rt-reset-btn" onClick={() => { setSearchTerm(""); setFilterTest(""); }}>
                    <i className="bi bi-arrow-counterclockwise" /> Réinitialiser
                  </button>
                )}
              </div>
            </div>

            {/* Tableau */}
            <div className="rt-table-card" ref={tableRef}>
              <div className="rt-table-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
                <div className="rt-table-meta" style={{ fontSize: 13, color: "#6b7280", padding: 0 }}>
                  {loading ? "Chargement…" : `${total} candidat(s) avec test(s) envoyé(s)`}
                </div>
                <label style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
                  Afficher
                  <select
                    value={itemsPerPage}
                    onChange={e => setItemsPerPage(Number(e.target.value))}
                    style={{ margin: "0 4px", padding: "3px 6px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  éléments
                </label>
              </div>

              {error && !loading && (
                <div className="postulant-api-error" style={{ margin: 16 }}>
                  <i className="bi bi-exclamation-triangle-fill" />
                  <span>{error}</span>
                  <button onClick={fetchCandidats}>Réessayer</button>
                </div>
              )}

              <div className="rt-table-wrapper">
                <table className="rt-table">
                  <thead>
                    <tr>
                      <th>Candidat</th>
                      {(loading ? TEST_DEFS : visibleTestDefs).map(d => (
                        <th key={d.key}>{d.label}</th>
                      ))}
                      <th className="rt-th-center">Progression</th>
                      <th className="rt-th-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }, (_, i) => (
                        <tr key={i} className="offres-skeleton-row">
                          {Array.from({ length: TEST_DEFS.length + 3 }).map((__, j) => (
                            <td key={j}><div className="offres-skeleton-cell" /></td>
                          ))}
                        </tr>
                      ))
                    ) : candidats.length === 0 ? (
                      <tr>
                        <td colSpan={visibleTestDefs.length + 3}>
                          <div className="rt-empty">
                            <i className="bi bi-inbox" />
                            <p>Aucun candidat trouvé</p>
                            {(searchTerm || filterTest) && <span>Modifiez vos filtres</span>}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      candidats.map(c => {
                        const { passed, possible, pct } = progressFor(c);
                        const tests        = c.tests ?? {};
                        const testsEnvoyes = c.tests_envoyes ?? [];

                        return (
                          <tr key={c.id}>
                            <td>
                              <div className="rt-candidate-cell">
                                <div className="rt-avatar rt-avatar--sm" style={{ background: avatarColor(c.id) }}>
                                  {initials(c)}
                                </div>
                                <div>
                                  <div className="rt-candidate-name">{c.prenoms} {c.nom}</div>
                                  <div className="rt-candidate-email">{c.email}</div>
                                </div>
                              </div>
                            </td>

                            {visibleTestDefs.map(def => {
                              const wasSent = testsEnvoyes.includes(def.key);
                              const badge   = wasSent ? getScoreBadge(tests, def.key) : null;

                              return (
                                <td key={def.key} className="rt-td-center">
                                  {!wasSent ? (
                                    <span className="rt-dash" style={{ color: "#d1d5db" }} title="Non envoyé">—</span>
                                  ) : badge ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                      <span
                                        className="rt-badge"
                                        style={{ background: badge.color + "22", color: badge.color, border: `1px solid ${badge.color}44` }}
                                      >
                                        {badge.label}
                                      </span>
                                      {badge.sub && (
                                        <span style={{ fontSize: 10, color: "#6b7280" }}>{badge.sub}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="rt-dash" style={{ color: "#f59e0b" }} title="Pas encore passé">En attente</span>
                                  )}
                                </td>
                              );
                            })}

                            <td className="rt-td-center">
                              <div className="rt-prog-wrap">
                                <div className="rt-prog-bar">
                                  <div
                                    className="rt-prog-fill"
                                    style={{
                                      width: `${pct}%`,
                                      background: pct === 100 ? "#10b981" : pct > 50 ? "#4361ee" : "#f59e0b",
                                    }}
                                  />
                                </div>
                                <span className="rt-prog-txt">{passed}/{possible}</span>
                              </div>
                            </td>

                            <td className="rt-td-center">
                              <button
                                className="rt-details-btn"
                                onClick={() => setSelectedCandidat(c)}
                              >
                                <i className="bi bi-eye-fill" /> Détails
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="postulant-pagination">
                  <span className="postulant-pagination-info">
                    Affichage de {(page - 1) * itemsPerPage + 1} à{" "}
                    {Math.min(page * itemsPerPage, total)} sur {total} éléments
                  </span>
                  <div className="postulant-pagination-controls">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      <i className="bi bi-chevron-left" /> Précédent
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let n;
                      if (totalPages <= 5)             n = i + 1;
                      else if (page <= 3)              n = i + 1;
                      else if (page >= totalPages - 2) n = totalPages - 4 + i;
                      else                             n = page - 2 + i;
                      return (
                        <button
                          key={n}
                          className={page === n ? "active" : ""}
                          onClick={() => {
                            setPage(n);
                            tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                        >
                          {n}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                      Suivant <i className="bi bi-chevron-right" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {selectedCandidat && (
        <DetailModal
          candidatSummary={selectedCandidat}
          eventId={eventId}
          offre={poste}
          onClose={() => setSelectedCandidat(null)}
          onExportWord={c => exportWord(c, poste)}
        />
      )}

      <footer className={`rt-footer ${sidebarOpen ? "rt-footer--shifted" : ""}`}>
        © 2025 Zenselekt · Propulsé par{" "}
        <strong>Empower Talents &amp; Careers</strong>. Tous droits réservés
      </footer>
    </div>
  );
}
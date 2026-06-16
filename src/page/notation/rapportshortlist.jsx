import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────────────── */
const API_ENTRETIENS = '/securebackoffice/backsecurebackoffice/entretiens.php';

/* ─────────────────────────────────────────────────────────────────
   SECURE FETCH (même pattern que le reste de l'app)
───────────────────────────────────────────────────────────────── */
async function secureFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    signal: options.signal ?? AbortSignal.timeout(30000),
  });
  return res;
}

/* ─────────────────────────────────────────────────────────────────
   RANG ORDINAL FRANÇAIS GENRÉ
───────────────────────────────────────────────────────────────── */
const toOrdinal = (n, feminin = false) => {
  if (n === 1) return feminin ? '1ère' : '1er';
  return `${n}ème`;
};

/* ══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════════════════════════ */
const RapportShortlist = () => {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const printRef   = useRef();

  const candidate  = state?.candidat;
  const evaluation = state?.evaluation;   // { criteria, notes_examinateurs, note_moyenne }
  const jobId      = state?.jobId;
  const titreOffre = state?.titreOffre || '';
  const rang       = state?.rang || 1;

  /* Infos recrutement pré-remplies depuis le parent */
  const [salaireActuel,  setSalaireActuel]  = useState(state?.salaireActuel  || '');
  const [pretentionSal,  setPretentionSal]  = useState(state?.pretentionSal  || '');
  const [disponibilite,  setDisponibilite]  = useState(state?.disponibilite  || '');

  /* Grille chargée depuis l'API (ou depuis le state si déjà présente) */
  const [criteria,    setCriteria]    = useState(evaluation?.criteria || []);
  const [loading,     setLoading]     = useState(!evaluation?.criteria?.length);
  const [erreur,      setErreur]      = useState(null);

  /* Génération IA */
  const [generating,      setGenerating]      = useState(false);
  const [genWord,         setGenWord]         = useState(false);
  const [presentation,    setPresentation]    = useState('');
  const [avisEntreprise,  setAvisEntreprise]  = useState('');
  const [genPresentation, setGenPresentation] = useState(false);
  const [genAvis,         setGenAvis]         = useState(false);

  /* ── Détection du genre ── */
  const detecterGenre = () => {
    const g = (candidate?.Genre || candidate?.genre || '').toString().trim().toLowerCase();
    if (g === 'femme') return { civilite: 'Mme', pronom: 'Elle', accord: 'e', label: 'Madame' };
    return { civilite: 'M', pronom: 'Il', accord: '', label: 'Monsieur' };
  };
  const genre      = detecterGenre();
  const nomFamille = candidate?.nom
    ? candidate.nom.trim().split(/\s+/)[0].toUpperCase()
    : '';

  /* ════════════════════════════════════════════════════════════
     CHARGEMENT GRILLE DEPUIS L'API (si non fournie dans le state)
  ════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (criteria.length > 0) { setLoading(false); return; }
    if (!jobId) { setLoading(false); return; }

    const fetchGrille = async () => {
      try {
        const res = await secureFetch(`${API_ENTRETIENS}?action=get_grille&event_id=${jobId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.success && json.grille?.criteria?.length > 0) {
          setCriteria(json.grille.criteria);
        } else {
          // Fallback : grille vide (le rapport affichera un message)
          setCriteria([]);
        }
      } catch (e) {
        console.error('[RapportShortlist] Erreur chargement grille :', e);
        setErreur('Impossible de charger la grille d\'évaluation. Vérifiez votre connexion.');
        setCriteria([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGrille();
  }, [jobId]); // eslint-disable-line

  /* ════════════════════════════════════════════════════════════
     CALCUL DES SCORES (note moyenne inter-examinateurs)
  ════════════════════════════════════════════════════════════ */
  const notesExaminateurs = evaluation?.notes_examinateurs || {};

  const getScoreMoyen = (cId, qIdx) => {
    const notesArray = Object.values(notesExaminateurs);
    if (notesArray.length === 0) return 0;
    let total = 0, count = 0;
    notesArray.forEach(n => {
      const scores  = n.scores || {};
      const cKeys   = [cId, String(cId), Number(cId)];
      const qKeys   = [qIdx, String(qIdx), Number(qIdx)];
      for (const k1 of cKeys) {
        if (scores[k1] !== undefined) {
          for (const k2 of qKeys) {
            if (scores[k1][k2] !== undefined) {
              total += Number(scores[k1][k2]);
              count++;
              return;
            }
          }
        }
      }
    });
    return count > 0 ? Math.round(total / count) : 0;
  };

  const noteObtenue = parseFloat(evaluation?.note_moyenne) || parseFloat(candidate?.note_tech_pct) || 0;
  const pourcentage = noteObtenue;

  const noteBrute = (() => {
    const notesArray = Object.values(notesExaminateurs);
    if (notesArray.length === 0) {
      return {
        total: candidate?.note_tech_totale || 0,
        max:   candidate?.note_tech_max    || 100,
      };
    }
    const avgTotal = notesArray.reduce((acc, n) => acc + (n.total || 0), 0) / notesArray.length;
    const avgMax   = notesArray.reduce((acc, n) => acc + (n.max   || 0), 0) / notesArray.length;
    return { total: Math.round(avgTotal), max: Math.round(avgMax) };
  })();

  /* ════════════════════════════════════════════════════════════
     CONTEXTE CANDIDAT (pour les prompts Mistral)
  ════════════════════════════════════════════════════════════ */
  const buildCandidatContext = () => {
    const c = candidate;
    const lines = [
      `Poste : ${titreOffre}`,
      `Candidat : ${genre.label} ${c?.nom || ''} ${c?.prenoms || ''}`,
      `Genre : ${c?.Genre || ''}`,
      `Pays de résidence : ${c?.Pays_R || ''}`,
      `Niveau académique : ${c?.Niveau || ''}`,
      `Secteur : ${c?.Secteur || ''}`,
      `Expérience : ${c?.experience || ''}`,
      `Score de présélection : ${c?.note_manuelle || 0}/100`,
      `Score technique (entretien) : ${noteBrute.total}/${noteBrute.max} (${pourcentage}%)`,
      `Rang shortlist : ${toOrdinal(rang, genre.accord === 'e')}`,
    ];
    if (salaireActuel)   lines.push(`Salaire actuel : ${salaireActuel}`);
    if (pretentionSal)   lines.push(`Prétention salariale : ${pretentionSal}`);
    if (disponibilite)   lines.push(`Disponibilité : ${disponibilite}`);

    if (criteria.length > 0) {
      lines.push('\nCritères évalués :');
      criteria.forEach(crit => {
        lines.push(`  ${crit.title} :`);
        crit.questions?.forEach((q, qIdx) => {
          const note = getScoreMoyen(crit.id, qIdx);
          lines.push(`    - ${q} → Note : ${note}/5`);
        });
      });
    }
    return lines.join('\n');
  };

  /* ════════════════════════════════════════════════════════════
     GÉNÉRATION IA — PRÉSENTATION
     Appel direct à l'API Anthropic (claude-sonnet-4-20250514)
  ════════════════════════════════════════════════════════════ */
  const generatePresentation = useCallback(async () => {
    setGenPresentation(true);
    const context = buildCandidatContext();

    const systemPrompt = `Tu es un consultant RH senior chez un cabinet de recrutement en Côte d'Ivoire.
Tu rédiges des rapports de shortlist professionnels, sobres et objectifs.
Réponds UNIQUEMENT avec le texte de la présentation, sans titre, sans introduction, sans explication.
Style : prose formelle, 3 à 4 paragraphes, environ 200 mots. Pas de liste à puces.
Adapte la rédaction au genre du candidat (${genre.label}).`;

    const userPrompt = `Rédige la présentation du dossier de candidature pour le rapport de shortlist, à partir des informations suivantes :

${context}

La présentation doit synthétiser le parcours, les compétences et la posture du candidat de façon neutre et professionnelle.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system:     systemPrompt,
          messages:   [{ role: 'user', content: userPrompt }],
        }),
      });
      const data = await res.json();
      const text = data?.content?.find(b => b.type === 'text')?.text || '';
      if (text) setPresentation(text.trim());
      else throw new Error('Réponse IA vide');
    } catch (e) {
      console.error('[IA Présentation]', e);
      // Fallback textuel si l'API échoue
      setPresentation(
        `${genre.label} ${nomFamille} présente un profil correspondant aux attentes du poste de ${titreOffre}. ` +
        `${genre.pronom} a obtenu un score technique de ${pourcentage}% lors de l'entretien d'évaluation, ` +
        `se classant ${toOrdinal(rang, genre.accord === 'e')} de la shortlist finale.\n\n` +
        `Son parcours et ses compétences ont été évalués positivement par le panel d'examinateurs. ` +
        `La cohérence entre la formation, l'expérience professionnelle et les exigences du poste constitue un point fort du dossier.`
      );
    } finally {
      setGenPresentation(false);
    }
  }, [candidate, criteria, pourcentage, rang, genre, nomFamille, titreOffre, notesExaminateurs,
      salaireActuel, pretentionSal, disponibilite]); // eslint-disable-line

  /* ════════════════════════════════════════════════════════════
     GÉNÉRATION IA — AVIS DE L'ENTREPRISE
  ════════════════════════════════════════════════════════════ */
  const generateAvisEntreprise = useCallback(async () => {
    setGenAvis(true);
    const context = buildCandidatContext();

    const systemPrompt = `Tu es un directeur des ressources humaines rédigeant l'avis officiel de l'entreprise sur un candidat shortlisté.
Réponds UNIQUEMENT avec le texte de l'avis, sans titre, sans introduction, sans explication.
Style : prose formelle et engageante, 2 à 3 paragraphes, environ 150 mots.
Utilise les civilités françaises correctes (${genre.civilite}. ${nomFamille} ou ${genre.label} ${nomFamille}).
Conclure sur une recommandation claire (recommandé / recommandé avec réserves).`;

    const userPrompt = `Rédige l'avis de l'entreprise sur ce candidat shortlisté :

${context}

L'avis doit mentionner les points forts identifiés, éventuellement des axes de progression, et conclure par une recommandation.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system:     systemPrompt,
          messages:   [{ role: 'user', content: userPrompt }],
        }),
      });
      const data = await res.json();
      const text = data?.content?.find(b => b.type === 'text')?.text || '';
      if (text) setAvisEntreprise(text.trim());
      else throw new Error('Réponse IA vide');
    } catch (e) {
      console.error('[IA Avis]', e);
      // Fallback
      const civiliteNom = `${genre.civilite}. ${nomFamille}`;
      setAvisEntreprise(
        `${civiliteNom} présente un profil ${pourcentage >= 80 ? 'solide' : 'intéressant'} correspondant aux exigences du poste de ${titreOffre}. ` +
        `${genre.pronom} a fait preuve lors des entretiens d'une maîtrise technique satisfaisante et d'aptitudes relationnelles confirmées.\n\n` +
        `Au regard de l'ensemble des éléments recueillis, ${civiliteNom} est ${pourcentage >= 70 ? 'recommandé' : 'recommandé avec réserves'} pour intégrer la shortlist finale.`
      );
    } finally {
      setGenAvis(false);
    }
  }, [candidate, criteria, pourcentage, rang, genre, nomFamille, titreOffre, notesExaminateurs,
      salaireActuel, pretentionSal, disponibilite]); // eslint-disable-line

  /* ════════════════════════════════════════════════════════════
     GÉNÉRATION PDF
  ════════════════════════════════════════════════════════════ */
  const generatePDF = async () => {
    const element = printRef.current;
    if (!element) return;
    setGenerating(true);
    try {
      const { default: jsPDF }       = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const noPrint      = element.querySelectorAll('.no-print');
      const printOnly    = element.querySelectorAll('.print-only');
      const savedDisplay = [];
      const savedPrint   = [];

      noPrint.forEach(el  => { savedDisplay.push(el.style.display); el.style.display = 'none'; });
      printOnly.forEach(el => { savedPrint.push(el.style.display);  el.style.display = 'inline'; });

      const origFont = element.style.fontFamily;
      element.style.fontFamily = 'Arial, Helvetica, sans-serif';
      await new Promise(r => setTimeout(r, 300));

      const canvas = await html2canvas(element, {
        scale: 1.5, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', logging: false,
        scrollX: 0, scrollY: 0, x: 0, y: 0,
        width: element.offsetWidth, height: element.scrollHeight,
      });

      element.style.fontFamily = origFont;
      noPrint.forEach((el, i)   => { el.style.display = savedDisplay[i]; });
      printOnly.forEach((el, i) => { el.style.display = savedPrint[i]; });

      const imgData = canvas.toDataURL('image/png');
      const pdf     = new jsPDF('p', 'mm', 'a4');
      const pageW   = pdf.internal.pageSize.getWidth();
      const pageH   = pdf.internal.pageSize.getHeight();
      const margin  = 10;
      const imgW    = pageW - margin * 2;
      const imgH    = (canvas.height * imgW) / canvas.width;

      if (imgH <= pageH - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH);
      } else {
        const pageContentH = pageH - margin * 2;
        const totalPages   = Math.ceil(imgH / pageContentH);
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, margin - page * pageContentH, imgW, imgH);
        }
      }
      pdf.save(`Rapport_Shortlist_${(candidate.nom || 'candidat').replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      alert('Erreur PDF : ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  /* ════════════════════════════════════════════════════════════
     GÉNÉRATION WORD
  ════════════════════════════════════════════════════════════ */
  const generateWord = async () => {
    setGenWord(true);
    try {
      const {
        Document, Packer, Paragraph, Table, TableRow, TableCell,
        TextRun, AlignmentType, WidthType, BorderStyle, ShadingType, VerticalAlign,
      } = await import('docx');
      const { saveAs } = await import('file-saver');

      const C_DARKBLUE = '1A1A6E';
      const C_SAUMON   = 'F9E4DA';
      const C_GRIS     = 'E0E0E0';
      const C_WHITE    = 'FFFFFF';
      const C_ORANGE   = 'FD8140';
      const C_GREEN    = '28A745';
      const C_RED      = 'DC3545';
      const C_TOTAL_BG = 'F0F0F0';
      const C_TEXT     = '1A1A1A';

      const noBorder   = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
      const stdBorders = {
        top:    { style: BorderStyle.SINGLE, size: 4, color: '999999' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: '999999' },
        left:   { style: BorderStyle.SINGLE, size: 4, color: '999999' },
        right:  { style: BorderStyle.SINGLE, size: 4, color: '999999' },
      };

      const cell = (text, opts = {}) => new TableCell({
        verticalAlign: VerticalAlign.CENTER,
        columnSpan:    opts.colSpan || 1,
        shading:       opts.bg
          ? { type: ShadingType.CLEAR, fill: opts.bg, color: opts.bg }
          : { type: ShadingType.CLEAR, fill: C_WHITE, color: C_WHITE },
        width:   opts.pct ? { size: opts.pct, type: WidthType.PERCENTAGE } : undefined,
        borders: stdBorders,
        children: [new Paragraph({
          alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing:   { before: 60, after: 60 },
          children:  [new TextRun({
            text:  String(text ?? ''),
            bold:  opts.bold  ?? false,
            size:  opts.size  ?? 18,
            color: opts.color ?? C_TEXT,
            font:  'Arial',
          })],
        })],
      });

      const spacer       = () => new Paragraph({ spacing: { before: 160, after: 80 } });
      const sectionTitle = (t) => new Paragraph({
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: t, bold: true, size: 22, color: C_DARKBLUE, font: 'Arial' })],
      });
      const bulletLine   = (label, value = '') => new Paragraph({
        bullet:  { level: 0 },
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: `${label} : `, bold: true, size: 18, font: 'Arial', color: C_TEXT }),
          new TextRun({ text: value, size: 18, font: 'Arial', color: C_TEXT }),
        ],
      });
      const sectionTitleCentered = (t) => new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing:   { before: 200, after: 100 },
        children:  [new TextRun({
          text: t, bold: true, size: 22, color: C_DARKBLUE, font: 'Arial',
          underline: { type: 'single' },
        })],
      });

      const children = [];

      // En-tête bleu
      children.push(new Table({
        width:   { size: 100, type: WidthType.PERCENTAGE },
        borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder },
        rows: [
          new TableRow({ children: [new TableCell({
            shading: { type: ShadingType.CLEAR, fill: C_DARKBLUE, color: C_DARKBLUE },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER, spacing: { before: 240, after: 0 },
              children: [new TextRun({ text: "RAPPORT DE SHORTLIST — GRILLE D'ÉVALUATION", bold: true, size: 28, color: C_WHITE, font: 'Arial' })],
            })],
          })]},),
          new TableRow({ children: [new TableCell({
            shading: { type: ShadingType.CLEAR, fill: C_DARKBLUE, color: C_DARKBLUE },
            borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER, spacing: { before: 180, after: 240 },
              children: [new TextRun({ text: `POSTE CONCERNÉ : ${titreOffre.toUpperCase()}`, bold: true, size: 22, color: C_WHITE, font: 'Arial' })],
            })],
          })]},),
        ],
      }));
      children.push(spacer());

      // Identification
      children.push(sectionTitle('Identification du candidat'));
      children.push(bulletLine('Nom & Prénoms',       `${candidate.nom} ${candidate.prenoms}`));
      children.push(bulletLine('Rang Shortlist',       toOrdinal(rang, genre.accord === 'e')));
      children.push(bulletLine('Score obtenu',         `${noteBrute.total}/${noteBrute.max} (${pourcentage}%)`));
      if (salaireActuel)  children.push(bulletLine('Salaire actuel',       salaireActuel));
      if (pretentionSal)  children.push(bulletLine('Prétention salariale', pretentionSal));
      if (disponibilite)  children.push(bulletLine('Disponibilité',        disponibilite));
      children.push(spacer());

      // Légende
      children.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            cell("Degré d'appréciation selon les critères spécifiques du poste", { bg: C_SAUMON, bold: true, pct: 52 }),
            cell('Insuffisant', { bg: C_SAUMON, bold: true, center: true }),
            cell('Faible',      { bg: C_SAUMON, bold: true, center: true }),
            cell('Moyen',       { bg: C_SAUMON, bold: true, center: true }),
            cell('Bon',         { bg: C_SAUMON, bold: true, center: true }),
            cell('Très bon',    { bg: C_SAUMON, bold: true, center: true }),
          ]}),
          new TableRow({ children: [
            cell('Note', { bold: true }),
            ...[1,2,3,4,5].map(n => cell(String(n), { center: true })),
          ]}),
        ],
      }));
      children.push(spacer());

      // Grille critères
      const gRows = [];
      gRows.push(new TableRow({ children: [
        cell("Critères d'évaluation", { bg: C_SAUMON, bold: true, pct: 52 }),
        cell('Côte de performance (note moyenne)', { bg: C_SAUMON, bold: true, center: true, colSpan: 5 }),
      ]}));
      gRows.push(new TableRow({ children: [
        cell('', { bg: C_SAUMON, pct: 52 }),
        ...[1,2,3,4,5].map(n => cell(String(n), { bg: C_SAUMON, bold: true, center: true })),
      ]}));

      if (criteria.length > 0) {
        criteria.forEach(criterion => {
          gRows.push(new TableRow({
            children: [new TableCell({
              columnSpan: 6,
              shading: { type: ShadingType.CLEAR, fill: C_GRIS, color: C_GRIS },
              borders: stdBorders,
              children: [new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [new TextRun({ text: criterion.title, bold: true, size: 18, font: 'Arial', color: C_TEXT })],
              })],
            })],
          }));
          criterion.questions?.forEach((q, qIdx) => {
            const note = getScoreMoyen(criterion.id, qIdx);
            gRows.push(new TableRow({
              children: [
                cell(`• ${q}`, { pct: 52 }),
                ...[1,2,3,4,5].map(n => cell(
                  note === n ? 'X' : '',
                  { center: true, bold: true, size: 20, color: note === n ? C_ORANGE : C_WHITE, bg: C_WHITE }
                )),
              ],
            }));
          });
        });
      } else {
        gRows.push(new TableRow({ children: [
          cell('Grille non disponible', { pct: 100, colSpan: 6 }),
        ]}));
      }

      gRows.push(new TableRow({
        children: [
          cell(`Total / ${noteBrute.max}`, { bg: C_TOTAL_BG, bold: true, size: 20, pct: 52 }),
          cell(`${noteBrute.total} (${pourcentage}%)`, {
            bg: C_TOTAL_BG, bold: true, center: true, colSpan: 5, size: 24,
            color: pourcentage >= 80 ? C_GREEN : C_RED,
          }),
        ],
      }));

      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: gRows }));
      children.push(spacer());

      // Présentation
      if (presentation) {
        children.push(sectionTitleCentered('Présentation'));
        presentation.split('\n').filter(p => p.trim()).forEach(para => {
          children.push(new Paragraph({
            alignment: AlignmentType.BOTH, spacing: { before: 60, after: 80 },
            children: [new TextRun({ text: para.trim(), size: 18, font: 'Arial', color: C_TEXT })],
          }));
        });
      }

      // Avis entreprise
      if (avisEntreprise) {
        const avisRows = [];
        avisRows.push(new TableRow({
          children: [new TableCell({
            borders: {
              top:    { style: BorderStyle.SINGLE, size: 6, color: 'B0B0B0' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: 'B0B0B0' },
              left:   { style: BorderStyle.SINGLE, size: 6, color: 'B0B0B0' },
              right:  { style: BorderStyle.SINGLE, size: 6, color: 'B0B0B0' },
            },
            shading: { type: ShadingType.CLEAR, fill: C_WHITE, color: C_WHITE },
            children: [new Paragraph({
              alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 },
              children: [new TextRun({ text: "Avis De L'Entreprise", bold: true, size: 22, color: C_DARKBLUE, font: 'Arial' })],
            })],
          })],
        }));
        avisEntreprise.split('\n').filter(p => p.trim()).forEach(para => {
          avisRows.push(new TableRow({
            children: [new TableCell({
              borders: {
                top:    { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: 'B0B0B0' },
                left:   { style: BorderStyle.SINGLE, size: 6, color: 'B0B0B0' },
                right:  { style: BorderStyle.SINGLE, size: 6, color: 'B0B0B0' },
              },
              shading: { type: ShadingType.CLEAR, fill: C_WHITE, color: C_WHITE },
              children: [new Paragraph({
                alignment: AlignmentType.BOTH, spacing: { before: 40, after: 40 },
                children: [new TextRun({ text: para.trim(), size: 18, font: 'Arial', color: C_TEXT })],
              })],
            })],
          }));
        });
        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: avisRows }));
      }

      const doc = new Document({
        sections: [{
          properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Rapport_Shortlist_${(candidate.nom || 'candidat').replace(/\s+/g, '_')}.docx`);
    } catch (err) {
      console.error(err);
      alert('Erreur Word : ' + err.message);
    } finally {
      setGenWord(false);
    }
  };

  /* ── Guards ── */
  if (!candidate) return (
    <div className="container py-4 text-center">
      <p className="text-danger fw-bold">Aucun candidat sélectionné.</p>
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>Retour</button>
    </div>
  );
  if (loading) return (
    <div className="d-flex justify-content-center mt-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Chargement de la grille…</span>
      </div>
    </div>
  );

  /* ── Styles ── */
  const colors = {
    header:   '#f9e4da',
    critere:  '#e0e0e0',
    orange:   '#FD8140',
    success:  '#28a745',
    danger:   '#dc3545',
    darkBlue: '#1a1a6e',
  };
  const tblStyle  = { width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'Arial, sans-serif' };
  const tdBorder  = { border: '1px solid #999', padding: '5px 7px', verticalAlign: 'middle', color: '#1a1a1a' };
  const thBorder  = { ...tdBorder, backgroundColor: colors.header, fontWeight: 'bold', textAlign: 'center', color: '#1a1a1a' };
  const inputStyle = {
    border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px',
    fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#1a1a1a',
    width: '100%', backgroundColor: '#fff', outline: 'none',
  };
  const iaTextareaStyle = {
    width: '100%', border: '1px dashed #aaa', borderRadius: '4px', padding: '8px',
    fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#1a1a1a',
    resize: 'vertical', minHeight: '80px', backgroundColor: '#fafafa', lineHeight: '1.6',
  };

  /* ────────────────────────────────────────────────────────────
     RENDU
  ────────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── Barre boutons ── */}
      <div
        className="no-print d-flex gap-2 p-3 bg-light border-bottom align-items-center flex-wrap"
        style={{ position: 'sticky', top: 0, zIndex: 100 }}
      >
        <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>← Retour</button>
        <button className="btn btn-success px-4" onClick={generatePDF} disabled={generating}>
          {generating
            ? <><span className="spinner-border spinner-border-sm me-2" />PDF...</>
            : 'Télécharger PDF'}
        </button>
        <button className="btn btn-primary px-4" onClick={generateWord} disabled={genWord}>
          {genWord
            ? <><span className="spinner-border spinner-border-sm me-2" />Word...</>
            : 'Télécharger Word'}
        </button>
        <div className="ms-auto d-flex align-items-center gap-3">
          <span className="text-muted small">
            Candidat : <strong>{candidate.nom} {candidate.prenoms}</strong>
            {(candidate.Genre || candidate.genre) && (
              <span className="ms-2 badge bg-secondary" style={{ fontSize: '10px' }}>{genre.label}</span>
            )}
            <span className="ms-2 badge bg-warning text-dark" style={{ fontSize: '10px' }}>
              Rang {toOrdinal(rang, genre.accord === 'e')}
            </span>
          </span>
          <span className={`badge fs-6 ${pourcentage >= 80 ? 'bg-success' : pourcentage >= 60 ? 'bg-warning text-dark' : 'bg-danger'}`}>
            {noteBrute.total}/{noteBrute.max} — {pourcentage}%
          </span>
        </div>
      </div>

      {/* ── Alerte erreur non bloquante ── */}
      {erreur && (
        <div className="no-print alert alert-warning mx-auto mt-2" style={{ maxWidth: 800 }}>
          <i className="bi bi-exclamation-triangle me-2" />
          {erreur}
        </div>
      )}

      {/* ── Rapport capturé pour PDF ── */}
      <div
        ref={printRef}
        style={{
          maxWidth: '800px', margin: '0 auto', padding: '20px 30px',
          fontFamily: 'Arial, sans-serif', fontSize: '12px',
          color: '#1a1a1a', backgroundColor: '#ffffff',
        }}
      >
        {/* Bandeau bleu */}
        <div style={{
          backgroundColor: colors.darkBlue, padding: '24px 16px',
          textAlign: 'center', marginBottom: '16px', borderRadius: '4px',
        }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px', marginBottom: '8px' }}>
            RAPPORT DE SHORTLIST — GRILLE D'ÉVALUATION PERSONNALISÉE
          </div>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', marginTop: '8px' }}>
            POSTE CONCERNÉ : {titreOffre.toUpperCase()}
          </div>
        </div>

        <hr style={{ borderTop: '2px solid #ddd', margin: '10px 0 14px 0' }} />

        {/* ── Identification ── */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: colors.darkBlue, fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
            Identification du candidat
          </div>

          {/* Nom */}
          <div style={{ fontSize: '11px', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span>•</span>
            <strong style={{ whiteSpace: 'nowrap' }}>Nom &amp; Prénoms :</strong>
            <span>{candidate.nom} {candidate.prenoms}</span>
          </div>

          {/* Rang */}
          <div style={{ fontSize: '11px', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span>•</span>
            <strong style={{ whiteSpace: 'nowrap' }}>Rang Shortlist :</strong>
            <span style={{
              background: colors.orange, color: 'white',
              borderRadius: '12px', padding: '1px 10px', fontWeight: 'bold', fontSize: '11px',
            }}>{toOrdinal(rang, genre.accord === 'e')}</span>
          </div>

          {/* Score */}
          <div style={{ fontSize: '11px', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span>•</span>
            <strong style={{ whiteSpace: 'nowrap' }}>Score obtenu :</strong>
            <span style={{ color: pourcentage >= 80 ? colors.success : colors.danger, fontWeight: 'bold' }}>
              {noteBrute.total}/{noteBrute.max} ({pourcentage}%)
            </span>
          </div>

          {/* Champs éditables */}
          {[
            { label: 'Salaire actuel',       value: salaireActuel, setter: setSalaireActuel, placeholder: 'Ex : 200 000 FCFA – 300 000 FCFA' },
            { label: 'Prétention salariale', value: pretentionSal, setter: setPretentionSal, placeholder: 'Ex : ouvert à la négociation' },
            { label: 'Disponibilité',        value: disponibilite, setter: setDisponibilite, placeholder: 'Ex : 1 mois' },
          ].map((f, i) => (
            <div key={i} style={{ fontSize: '11px', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span>•</span>
              <strong style={{ whiteSpace: 'nowrap' }}>{f.label} :</strong>
              <input
                className="no-print"
                type="text"
                value={f.value}
                placeholder={f.placeholder}
                onChange={e => f.setter(e.target.value)}
                style={{ ...inputStyle, maxWidth: '300px' }}
              />
              {f.value && <span className="print-only" style={{ display: 'none' }}>{f.value}</span>}
            </div>
          ))}
        </div>

        {/* Tableau légende */}
        <table style={{ ...tblStyle, marginBottom: '14px' }}>
          <thead>
            <tr>
              <th style={{ ...thBorder, textAlign: 'left', width: '55%' }}>
                Degré d'appréciation selon les critères spécifiques du poste
              </th>
              <th style={thBorder}>Insuffisant</th>
              <th style={thBorder}>Faible</th>
              <th style={thBorder}>Moyen</th>
              <th style={thBorder}>Bon</th>
              <th style={thBorder}>Très bon</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...tdBorder, fontWeight: 'bold' }}>Note</td>
              {[1,2,3,4,5].map(n => (
                <td key={n} style={{ ...tdBorder, textAlign: 'center' }}>{n}</td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Grille d'évaluation */}
        <table style={tblStyle}>
          <thead>
            <tr>
              <th style={{ ...thBorder, textAlign: 'left', width: '55%' }}>Critères d'évaluation</th>
              <th style={{ ...thBorder, textAlign: 'center' }} colSpan={5}>
                Côte de performance (note moyenne examinateurs)
              </th>
            </tr>
            <tr>
              <th style={{ ...thBorder, textAlign: 'left' }}></th>
              {[1,2,3,4,5].map(n => (
                <th key={n} style={{ ...thBorder, width: '7%', textAlign: 'center' }}>{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteria.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...tdBorder, textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                  Grille d'évaluation non disponible
                </td>
              </tr>
            ) : (
              criteria.map(criterion => (
                <React.Fragment key={criterion.id}>
                  <tr>
                    <td colSpan={6} style={{ ...tdBorder, backgroundColor: colors.critere, fontWeight: 'bold', paddingLeft: '8px' }}>
                      {criterion.title}
                    </td>
                  </tr>
                  {criterion.questions?.map((q, qIdx) => {
                    const note = getScoreMoyen(criterion.id, qIdx);
                    return (
                      <tr key={qIdx}>
                        <td style={{ ...tdBorder, paddingLeft: '14px' }}>• {q}</td>
                        {[1,2,3,4,5].map(n => (
                          <td key={n} style={{
                            ...tdBorder, textAlign: 'center', fontWeight: 'bold', fontSize: '14px',
                            color: note === n ? colors.orange : '#ffffff',
                          }}>
                            {note === n ? 'X' : ''}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))
            )}
            <tr>
              <td style={{ ...tdBorder, fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                Total / {noteBrute.max}
              </td>
              <td colSpan={5} style={{
                ...tdBorder, textAlign: 'center', fontWeight: 'bold', fontSize: '14px',
                backgroundColor: '#f0f0f0',
                color: pourcentage >= 80 ? colors.success : colors.danger,
              }}>
                {noteBrute.total} ({pourcentage}%)
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Présentation ── */}
        <div style={{ marginTop: '28px' }}>
          <div style={{ position: 'relative', textAlign: 'center', marginBottom: '10px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '12px', color: colors.darkBlue, textDecoration: 'underline' }}>
              Présentation
            </span>
            <button
              className="no-print"
              onClick={generatePresentation}
              disabled={genPresentation}
              style={{
                position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                fontSize: '10px', padding: '2px 8px', backgroundColor: colors.darkBlue,
                color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
              }}
            >
              {genPresentation
                ? <><span className="spinner-border spinner-border-sm" style={{ width: '9px', height: '9px' }} /> En cours...</>
                : '✦ Générer IA'}
            </button>
          </div>
          <textarea
            className="no-print"
            value={presentation}
            onChange={e => setPresentation(e.target.value)}
            placeholder="Cliquez 'Générer IA' ou saisissez la présentation..."
            style={{ ...iaTextareaStyle, minHeight: '110px', marginBottom: '6px' }}
            rows={6}
          />
          <div style={{ fontSize: '11px', lineHeight: '1.75', color: '#1a1a1a', textAlign: 'justify' }}>
            {presentation
              ? presentation.split('\n').filter(p => p.trim()).map((para, i) => (
                  <p key={i} style={{ margin: '0 0 8px 0' }}>{para}</p>
                ))
              : <p style={{ margin: '0 0 8px 0' }}>&nbsp;</p>
            }
          </div>
        </div>

        {/* ── Avis De L'Entreprise ── */}
        <div style={{ marginTop: '24px', marginBottom: '20px', border: '1px solid #b0b0b0' }}>
          <div style={{
            position: 'relative', textAlign: 'center',
            padding: '10px 16px 8px 16px', borderBottom: '1px solid #b0b0b0',
          }}>
            <span style={{ fontWeight: 'bold', fontSize: '12px', color: colors.darkBlue }}>
              Avis De L'Entreprise
            </span>
            <button
              className="no-print"
              onClick={generateAvisEntreprise}
              disabled={genAvis}
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '10px', padding: '2px 8px', backgroundColor: colors.darkBlue,
                color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
              }}
            >
              {genAvis
                ? <><span className="spinner-border spinner-border-sm" style={{ width: '9px', height: '9px' }} /> En cours...</>
                : '✦ Générer IA'}
            </button>
          </div>
          <textarea
            className="no-print"
            value={avisEntreprise}
            onChange={e => setAvisEntreprise(e.target.value)}
            placeholder="Cliquez 'Générer IA' ou saisissez l'avis de l'entreprise..."
            style={{
              ...iaTextareaStyle, minHeight: '110px', marginBottom: '0',
              border: 'none', borderBottom: '1px dashed #ccc',
              borderRadius: '0', backgroundColor: '#fafafa',
            }}
            rows={6}
          />
          <div style={{ padding: '10px 16px 6px 16px', fontSize: '11px', lineHeight: '1.75', color: '#1a1a1a', textAlign: 'justify' }}>
            {avisEntreprise
              ? avisEntreprise.split('\n').filter(p => p.trim()).map((para, i) => (
                  <p key={i} style={{ margin: '0 0 8px 0' }}>{para}</p>
                ))
              : <p style={{ margin: '0 0 8px 0' }}>&nbsp;</p>
            }
          </div>
        </div>
      </div>

      {/* ── Bannière résultat (hors PDF) ── */}
      <div className="no-print" style={{
        maxWidth: '800px', margin: '10px auto 30px auto', padding: '12px', borderRadius: '4px',
        backgroundColor: pourcentage >= 80 ? colors.success : pourcentage >= 60 ? '#f59e0b' : colors.danger,
        color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: '14px',
      }}>
        {pourcentage >= 80
          ? `ADMIS EN SHORTLIST — Rang ${toOrdinal(rang, genre.accord === 'e')} — Score : ${noteBrute.total}/${noteBrute.max} (${pourcentage}%)`
          : `EN SHORTLIST AVEC RÉSERVES — Rang ${toOrdinal(rang, genre.accord === 'e')} — Score : ${noteBrute.total}/${noteBrute.max} (${pourcentage}%)`
        }
      </div>

      <style>{`
        .no-print  { display: block; }
        .print-only { display: none; }
        @media print {
          .no-print   { display: none !important; }
          .print-only { display: inline !important; }
        }
        textarea:focus { border-color: #1a1a6e !important; outline: none !important; }
        input:focus    { border-color: #1a1a6e !important; outline: none !important; }
      `}</style>
    </>
  );
};

export default RapportShortlist;
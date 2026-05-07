import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./component/Header";
import Navbar from "./component/Navbar";
import './css/resultatsTests.css';

const BI_CDN = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
const DOCX_CDN = "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.min.js";

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

// Données MOCK
const MOCK_TESTS = [
  { id: 1, titre: "Test de Pression",              type: "pression"     },
  { id: 2, titre: "Test Psychotechnique - Dominos", type: "dominos"      },
  { id: 3, titre: "Test d'anglais",                 type: "anglais"      },
  { id: 4, titre: "Test MBTI",                      type: "mbti"         },
  { id: 5, titre: "Test des 5 Traits de Personnalité", type: "personnalite" },
];

const MBTI_LIBELLES = {
  INTJ: "L'Architecte",   INTP: "Le Logicien",   ENTJ: "Le Commandant",  ENTP: "Le Visionnaire",
  INFJ: "L'Avocat",       INFP: "Le Médiateur",  ENFJ: "Le Protagoniste",ENFP: "Le Défenseur",
  ISTJ: "Le Logisticien", ISFJ: "Le Défenseur",  ESTJ: "Le Directeur",   ESFJ: "Le Consul",
  ISTP: "Le Virtuose",    ISFP: "L'Aventurier",  ESTP: "L'Entrepreneur", ESFP: "L'Animateur",
};

const MOCK_CANDIDATS = [
  {
    id: 1, candidature_id: 30,
    nom: "KOUASSI", prenoms: "Jean-Marc", email: "jm.kouassi@email.com", genre: "homme",
    testsEnvoyes: [1, 2, 3, 4, 5],
    resultats: {
      pression:     { score_total: 47, interpretation: "Jean-Marc présente une excellente capacité à gérer le stress et à maintenir sa performance sous pression." },
      dominos:      { score_total: 17, interpretation: "Les aptitudes logiques et le raisonnement abstrait de Jean-Marc sont remarquables." },
      anglais:      { score_total: 52, commentaire_interprete: "Jean-Marc possède un niveau d'anglais professionnel avancé (C1)." },
      mbti:         { type_mbti: "ENTJ", libelle_type: "Le Commandant", interpretation_complete: "En tant qu'ENTJ, Jean-Marc est naturellement orienté vers le leadership." },
      personnalite: { score_ouverture: 78, score_conscienciosite: 85, score_extraversion: 72, score_agreabilite: 65, score_nevrosisme: 28, commentaire_interprete: "Profil Big Five très favorable." },
    },
  },
  {
    id: 2, candidature_id: 31,
    nom: "BAMBA", prenoms: "Fatoumata", email: "f.bamba@email.com", genre: "femme",
    testsEnvoyes: [1, 4, 5],
    resultats: {
      pression:     { score_total: 39, interpretation: "Fatoumata gère correctement les situations de stress modéré." },
      mbti:         { type_mbti: "INFJ", libelle_type: "L'Avocate", interpretation_complete: "Fatoumata est une INFJ, personnalité rare et idéaliste." },
      personnalite: { score_ouverture: 88, score_conscienciosite: 79, score_extraversion: 42, score_agreabilite: 91, score_nevrosisme: 35, commentaire_interprete: "Très grande ouverture d'esprit." },
    },
  },
  {
    id: 3, candidature_id: 32,
    nom: "DIARRA", prenoms: "Oumar", email: "o.diarra@email.com", genre: "homme",
    testsEnvoyes: [2, 3],
    resultats: {
      dominos: { score_total: 14, interpretation: "Oumar démontre des aptitudes logiques satisfaisantes." },
      anglais: { score_total: 38, commentaire_interprete: "Oumar possède un niveau d'anglais intermédiaire (B1)." },
    },
  },
  {
    id: 4, candidature_id: 33,
    nom: "N'GUESSAN", prenoms: "Aya Christine", email: "a.nguessan@email.com", genre: "femme",
    testsEnvoyes: [1, 2, 3, 4],
    resultats: {
      pression:     { score_total: 55, interpretation: "Aya Christine affiche un niveau de résistance au stress exceptionnel." },
      dominos:      { score_total: 19, interpretation: "Score excellent au test de dominos." },
      anglais:      { score_total: 58, commentaire_interprete: "Aya Christine possède un niveau d'anglais quasiment natif (C2)." },
      mbti:         { type_mbti: "INTJ", libelle_type: "L'Architecte", interpretation_complete: "L'INTJ est connue pour son intelligence stratégique." },
    },
  },
  {
    id: 5, candidature_id: 34,
    nom: "COULIBALY", prenoms: "Ibrahim", email: "i.coulibaly@email.com", genre: "homme",
    testsEnvoyes: [3, 5],
    resultats: {
      anglais:      { score_total: 44, commentaire_interprete: "Ibrahim dispose d'un bon niveau d'anglais professionnel (B2)." },
      personnalite: { score_ouverture: 62, score_conscienciosite: 88, score_extraversion: 58, score_agreabilite: 74, score_nevrosisme: 22, commentaire_interprete: "Conscienciosité très élevée." },
    },
  },
];

function getScoreBadge(candidat, type) {
  const r = candidat.resultats[type];
  if (!r) return null;
  switch (type) {
    case 'dominos':     return { label: `${r.score_total}/20`,  color: 'success' };
    case 'anglais':     return { label: `${r.score_total}/60`,  color: 'success' };
    case 'pression':    return { label: `${r.score_total}/60`,  color: 'success' };
    case 'mbti':        return { label: `${r.type_mbti} – ${r.libelle_type || MBTI_LIBELLES[r.type_mbti] || ''}`, color: 'info' };
    case 'personnalite':return { label: 'Complété', color: 'primary' };
    default: return null;
  }
}

function initials(c) {
  return `${c.prenoms[0]}${c.nom[0]}`.toUpperCase();
}

function avatarColor(id) {
  const palette = ['#4361ee','#7c3aed','#db2777','#0891b2','#059669','#d97706','#dc2626'];
  return palette[id % palette.length];
}

async function exportWord(candidat, offre) {
  if (!window.docx) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = DOCX_CDN;
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    AlignmentType, Table, TableRow, TableCell,
    BorderStyle, WidthType, ShadingType,
  } = window.docx;

  const BLUE   = "1a3a6e";
  const BLUE_L = "dde8f5";
  const GRAY   = "4b5563";
  const GREEN  = "065f46";
  const GREEN_L= "d1fae5";

  function heading1(text) {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, size: 28, color: BLUE, font: "Calibri" })],
      spacing: { before: 300, after: 150 },
    });
  }

  function heading2(text) {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, size: 22, color: BLUE, font: "Calibri" })],
      spacing: { before: 200, after: 100 },
    });
  }

  function body(text) {
    return new Paragraph({
      children: [new TextRun({ text, size: 20, color: "1f2937", font: "Calibri" })],
      spacing: { line: 300, after: 80 },
    });
  }

  const sections = [];

  sections.push(
    new Paragraph({
      children: [new TextRun({ text: "RAPPORT D'ÉVALUATION DES TESTS", bold: true, size: 34, color: BLUE, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: offre.toUpperCase(), size: 20, color: GRAY, font: "Calibri", italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Candidat : ${candidat.prenoms} ${candidat.nom}`, size: 22, bold: true, color: BLUE, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Email : ${candidat.email} | Genre : ${candidat.genre}`, size: 18, color: GRAY, font: "Calibri" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
  );

  const testDefs = [
    { type: 'pression',     titre: 'Test de Pression' },
    { type: 'dominos',      titre: 'Test Psychotechnique – Dominos' },
    { type: 'anglais',      titre: "Test d'Anglais" },
    { type: 'mbti',         titre: 'Test MBTI' },
    { type: 'personnalite', titre: 'Test des 5 Traits de Personnalité' },
  ];

  for (const def of testDefs) {
    if (!candidat.testsEnvoyes.some(id => {
      const t = MOCK_TESTS.find(x => x.id === id);
      return t && t.type === def.type;
    })) continue;

    const r = candidat.resultats[def.type];
    sections.push(heading1(def.titre));

    if (!r) {
      sections.push(body("⚠️ Le candidat n'a pas encore passé ce test."));
      continue;
    }

    if (def.type === 'pression' || def.type === 'dominos' || def.type === 'anglais') {
      const max = def.type === 'dominos' ? 20 : 60;
      sections.push(heading2("Score obtenu"));
      sections.push(body(`Score : ${r.score_total} / ${max}`));
    }

    if (def.type === 'mbti') {
      sections.push(heading2("Profil identifié"));
      sections.push(body(`Type MBTI : ${r.type_mbti}`));
      sections.push(body(`Profil : ${r.libelle_type || MBTI_LIBELLES[r.type_mbti] || ''}`));
    }

    if (def.type === 'personnalite') {
      sections.push(heading2("Scores Big Five"));
      sections.push(body(`Ouverture d'esprit : ${r.score_ouverture}`));
      sections.push(body(`Conscienciosité : ${r.score_conscienciosite}`));
      sections.push(body(`Extraversion : ${r.score_extraversion}`));
      sections.push(body(`Agréabilité : ${r.score_agreabilite}`));
      sections.push(body(`Névrosisme : ${r.score_nevrosisme}`));
    }

    const interp = r.interpretation || r.commentaire_interprete || r.interpretation_complete || '';
    if (interp) {
      sections.push(heading2("Interprétation"));
      sections.push(body(interp));
    }

    sections.push(new Paragraph({ spacing: { after: 200 } }));
  }

  const doc = new Document({ sections: [{ children: sections }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rapport_${candidat.nom}_${candidat.prenoms}_${offre.replace(/\s+/g, '_')}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

function PersonnaliteBar({ label, score, max = 100 }) {
  const pct = Math.round((score / max) * 100);
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

function DetailModal({ candidat, offre, onClose, onExportWord }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try { await onExportWord(candidat); }
    catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  return (
    <div className="rt-modal-overlay" onClick={onClose}>
      <div className="rt-modal" onClick={e => e.stopPropagation()}>
        <div className="rt-modal-header">
          <div className="rt-modal-candidate">
            <div className="rt-avatar" style={{ background: avatarColor(candidat.id) }}>{initials(candidat)}</div>
            <div>
              <h3 style={{ fontSize: '15px', margin: 0 }}>{candidat.prenoms} {candidat.nom}</h3>
              <span style={{ fontSize: '11px' }}>{candidat.email}</span>
            </div>
          </div>
          <div className="rt-modal-actions">
            <button
              className={`rt-word-btn ${exporting ? 'rt-word-btn--loading' : ''}`}
              onClick={handleExport}
              disabled={exporting}
              style={{ fontSize: '12px', padding: '7px 14px' }}
            >
              {exporting
                ? <><i className="bi bi-hourglass-split" /> Génération…</>
                : <><i className="bi bi-file-earmark-word-fill" /> Exporter</>
              }
            </button>
            <button className="rt-modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
          </div>
        </div>

        <div className="rt-modal-body">
          {MOCK_TESTS.filter(t => candidat.testsEnvoyes.includes(t.id)).map(test => {
            const r = candidat.resultats[test.type];
            return (
              <div className="rt-section" key={test.id}>
                <div className="rt-section-title">
                  <span className="rt-section-icon">{
                    test.type === 'pression' ? '' :
                    test.type === 'dominos'  ? '' :
                    test.type === 'anglais'  ? '' :
                    test.type === 'mbti'     ? '' : ''
                  }</span>
                  {test.titre}
                </div>

                {!r ? (
                  <div className="rt-not-taken"><i className="bi bi-hourglass-half" /> Non passé</div>
                ) : (
                  <div className="rt-section-body">
                    {(test.type === 'dominos' || test.type === 'anglais' || test.type === 'pression') && (
                      <div className="rt-score-row">
                        <span className="rt-score-label">Score</span>
                        <span className="rt-score-chip">
                          {r.score_total}/{test.type === 'dominos' ? 20 : 60}
                        </span>
                      </div>
                    )}

                    {test.type === 'mbti' && (
                      <div className="rt-mbti-row">
                        <span className="rt-mbti-type">{r.type_mbti}</span>
                        <span className="rt-mbti-libelle">{r.libelle_type || MBTI_LIBELLES[r.type_mbti]}</span>
                      </div>
                    )}

                    {test.type === 'personnalite' && (
                      <div className="rt-pbar-wrap">
                        <PersonnaliteBar label="Ouverture" score={r.score_ouverture} />
                        <PersonnaliteBar label="Conscienciosité" score={r.score_conscienciosite} />
                        <PersonnaliteBar label="Extraversion" score={r.score_extraversion} />
                        <PersonnaliteBar label="Agréabilité" score={r.score_agreabilite} />
                        <PersonnaliteBar label="Névrosisme" score={r.score_nevrosisme} />
                      </div>
                    )}

                    {(r.interpretation || r.commentaire_interprete || r.interpretation_complete) && (
                      <div className="rt-interp">
                        <div className="rt-interp-label"> Interprétation</div>
                        <p>{r.interpretation || r.commentaire_interprete || r.interpretation_complete}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ResultatsTests() {
  useBootstrapIcons();
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const poste = queryParams.get('poste') || "Offre d'emploi";

  const [width, setWidth] = useState(window.innerWidth);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTest, setFilterTest] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedCandidat, setSelectedCandidat] = useState(null);

  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => { setSidebarOpen(width > 768); }, [width]);

  const testsPresents = MOCK_TESTS.filter(t =>
    MOCK_CANDIDATS.some(c => c.testsEnvoyes.includes(t.id))
  );

  const filtered = MOCK_CANDIDATS.filter(c => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      c.nom.toLowerCase().includes(q) ||
      c.prenoms.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q);

    const matchTest = !filterTest || c.testsEnvoyes.includes(Number(filterTest));

    const passedCount = c.testsEnvoyes.filter(id => {
      const t = MOCK_TESTS.find(x => x.id === id);
      return t && c.resultats[t.type];
    }).length;
    const total = c.testsEnvoyes.length;
    const matchStatus = !filterStatus ||
      (filterStatus === 'complet' && passedCount === total && total > 0) ||
      (filterStatus === 'partiel' && passedCount > 0 && passedCount < total) ||
      (filterStatus === 'aucun' && passedCount === 0);

    return matchSearch && matchTest && matchStatus;
  });

  const totalTests = MOCK_CANDIDATS.reduce((s, c) => s + c.testsEnvoyes.length, 0);
  const totalPassed = MOCK_CANDIDATS.reduce((s, c) =>
    s + c.testsEnvoyes.filter(id => { const t = MOCK_TESTS.find(x => x.id === id); return t && c.resultats[t.type]; }).length, 0);
  const completionPct = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

  const isMobile = width <= 768;

  return (
    <div className="rt-app">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(p => !p)} isMobile={isMobile} />

      <div className="rt-layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={`rt-main ${sidebarOpen ? "rt-main--shifted" : ""}`}>
          <div className="rt-container">
            <div className="rt-breadcrumb">
              <div className="rt-breadcrumb-left">
                <button className="rt-back-btn" onClick={() => navigate(-1)}>
                  <i className="bi bi-arrow-left" /> Retour
                </button>
                <div>
                  <h1 className="rt-title"> Résultats des Tests</h1>
                  <p className="rt-subtitle"> {poste}</p>
                </div>
              </div>
            </div>

            <div className="rt-kpi-grid">
              <div className="rt-kpi-card rt-kpi-card--blue">
                <div className="rt-kpi-icon"><i className="bi bi-people-fill" /></div>
                <div className="rt-kpi-content">
                  <span className="rt-kpi-value">{MOCK_CANDIDATS.length}</span>
                  <span className="rt-kpi-label">Candidats</span>
                </div>
              </div>
              <div className="rt-kpi-card rt-kpi-card--purple">
                <div className="rt-kpi-icon"><i className="bi bi-clipboard2-check-fill" /></div>
                <div className="rt-kpi-content">
                  <span className="rt-kpi-value">{testsPresents.length}</span>
                  <span className="rt-kpi-label">Types de tests</span>
                </div>
              </div>
              <div className="rt-kpi-card rt-kpi-card--green">
                <div className="rt-kpi-icon"><i className="bi bi-check-circle-fill" /></div>
                <div className="rt-kpi-content">
                  <span className="rt-kpi-value">{totalPassed}</span>
                  <span className="rt-kpi-label">Tests complétés</span>
                </div>
              </div>
              <div className="rt-kpi-card rt-kpi-card--orange">
                <div className="rt-kpi-icon"><i className="bi bi-percent" /></div>
                <div className="rt-kpi-content">
                  <span className="rt-kpi-value">{completionPct}%</span>
                  <span className="rt-kpi-label">Taux de complétion</span>
                </div>
                <div className="rt-kpi-progress" style={{ '--pct': `${completionPct}%` }} />
              </div>
            </div>

            <div className="rt-filters-card">
              <div className="rt-filters-header">
                <i className="bi bi-funnel-fill" /> Filtres
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
                  {searchTerm && <button onClick={() => setSearchTerm("")}><i className="bi bi-x" /></button>}
                </div>
                <select value={filterTest} onChange={e => setFilterTest(e.target.value)}>
                  <option value="">Tous les tests</option>
                  {testsPresents.map(t => <option key={t.id} value={t.id}>{t.titre}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Tous les statuts</option>
                  <option value="complet">Tous complétés</option>
                  <option value="partiel">Partiellement complété</option>
                  <option value="aucun">Aucun passé</option>
                </select>
                {(searchTerm || filterTest || filterStatus) && (
                  <button className="rt-reset-btn" onClick={() => { setSearchTerm(""); setFilterTest(""); setFilterStatus(""); }}>
                    <i className="bi bi-arrow-counterclockwise" /> Réinitialiser
                  </button>
                )}
              </div>
            </div>

            <div className="rt-table-card">
              <div className="rt-table-meta">
                {filtered.length} candidat(s) affiché(s)
              </div>
              <div className="rt-table-wrapper">
                <table className="rt-table">
                  <thead>
                    <tr>
                      <th>Candidat</th>
                      {testsPresents.map(t => <th key={t.id}>{t.titre}</th>)}
                      <th className="rt-th-center">Progression</th>
                      <th className="rt-th-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={testsPresents.length + 3}>
                          <div className="rt-empty">
                            <i className="bi bi-inbox" />
                            <p>Aucun candidat trouvé</p>
                            <span>Modifiez vos filtres</span>
                          </div>
                        </td>
                      </tr>
                    ) : filtered.map(c => {
                      const passedCount = c.testsEnvoyes.filter(id => {
                        const t = MOCK_TESTS.find(x => x.id === id);
                        return t && c.resultats[t.type];
                      }).length;
                      const total = c.testsEnvoyes.length;
                      const pct = total > 0 ? Math.round((passedCount / total) * 100) : 0;

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

                          {testsPresents.map(test => {
                            if (!c.testsEnvoyes.includes(test.id)) {
                              return <td key={test.id}><span className="rt-dash">—</span></td>;
                            }
                            const badge = getScoreBadge(c, test.type);
                            return (
                              <td key={test.id} className="rt-td-center">
                                {badge
                                  ? <span className={`rt-badge rt-badge--${badge.color}`}>{badge.label}</span>
                                  : <span className="rt-badge rt-badge--warning">Non passé</span>
                                }
                              </td>
                            );
                          })}

                          <td className="rt-td-center">
                            <div className="rt-prog-wrap">
                              <div className="rt-prog-bar">
                                <div className="rt-prog-fill" style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : pct > 50 ? '#4361ee' : '#f59e0b' }} />
                              </div>
                              <span className="rt-prog-txt">{passedCount}/{total}</span>
                            </div>
                          </td>

                          <td className="rt-td-center">
                            <button
                              className="rt-details-btn"
                              onClick={() => setSelectedCandidat(c)}
                              disabled={c.testsEnvoyes.length === 0}
                            >
                              <i className="bi bi-eye-fill" /> Détails
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {selectedCandidat && (
        <DetailModal
          candidat={selectedCandidat}
          offre={poste}
          onClose={() => setSelectedCandidat(null)}
          onExportWord={c => exportWord(c, poste)}
        />
      )}

      <footer className={`rt-footer ${sidebarOpen ? "rt-footer--shifted" : ""}`}>
        ©2025 Zenselekt · Propulsé par <strong>Empower Talents &amp; Careers</strong>. Tous droits réservés
      </footer>
    </div>
  );
}
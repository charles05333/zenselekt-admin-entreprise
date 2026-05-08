import { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './css/Postulantsnotations2.css';
import Header from "../component/Header";
import Navbar from "../component/Navbar";
import TechEvaluationModal from './TechEvaluationModal';
import ExaminateurDashboard from './ExaminateurDashboard';
import ExaminateurNotationModal from './ExaminateurNotationModal';
import PreselectionSeuilModal from './PreselectionSeuilModal';

// ── Rang ordinal français genré
const toOrdinal = (n, feminin = false) => {
  if (n === 1) return feminin ? '1ère' : '1er';
  return `${n}ème`;
};

const evalFields = [
  { key: 'adequation',     label: 'Adéquation du profil avec le poste',      max: 25 },
  { key: 'experience_pro', label: 'Expérience professionnelle pertinente',     max: 25 },
  { key: 'niveau_resp',    label: 'Niveau de responsabilité',                  max: 15 },
  { key: 'formation',      label: 'Formation académique',                       max: 10 },
  { key: 'competences',    label: 'Compétences techniques clés',               max: 10 },
  { key: 'qualite_cv',     label: 'Qualité et structuration du CV',            max: 5  },
  { key: 'exp_exigeant',   label: "Expérience dans un environnement exigeant", max: 10 },
];

// ── EvaluationModal (inchangé fonctionnellement)
function EvaluationModal({
  postulant, posteTitle, scores, commentaireManuel,
  loadingEval, onScoreChange, onCommentaireChange, onSave, onClose,
}) {
  if (!postulant) return null;
  const totalScore   = Object.values(scores).reduce((a, b) => a + Number(b), 0);
  const resultatAuto = totalScore >= 70 ? 'entretien_ok' : totalScore > 0 ? 'rejete' : '';
  const getScoreClass = () => {
    if (totalScore >= 70) return 'success';
    if (totalScore >= 40) return 'warning';
    if (totalScore > 0)   return 'danger';
    return 'neutral';
  };
  return (
    <div className="modal-notation-overlay" onClick={e => e.stopPropagation()}>
      <div className="modal-eval-container" onClick={e => e.stopPropagation()}>
        <div className="eval-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2>Évaluation : {postulant.nom} {postulant.prenoms}</h2>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', fontSize: 20,
              color: '#7C8596', cursor: 'pointer', padding: '2px 8px',
              borderRadius: 6, lineHeight: 1, flexShrink: 0,
            }} title="Fermer">✕</button>
          </div>
          <p className="email">{postulant.email}</p>
          <div className="meta">
            <span>Expérience : {postulant.experience || '—'}</span>
            <span>Niveau : {postulant.Niveau || '—'}</span>
          </div>
          {postulant.note_manuelle > 0 && (
            <div className="prev-note">Déjà évalué — Note précédente : <strong>{postulant.note_manuelle}/100</strong></div>
          )}
          {posteTitle && posteTitle !== 'Poste non trouvé' && (
            <div className="poste-tag">{posteTitle}</div>
          )}
        </div>
        <div className="separator" />
        <div className={`score-total ${getScoreClass()}`}>
          <div>
            <div className="score-label">Score total</div>
            <div className="score-desc">
              {totalScore >= 70
                ? 'Ce candidat sera convoqué en entretien technique'
                : totalScore > 0 ? 'Ce candidat sera rejeté'
                : 'Remplissez les notes ci-dessous'}
            </div>
          </div>
          <div className="score-value">{totalScore} / 100</div>
        </div>
        {totalScore > 0 && (
          <div className={`decision-auto ${resultatAuto === 'entretien_ok' ? 'success' : 'danger'}`}>
            <span className="decision-label">Décision automatique :</span>
            <span>{resultatAuto === 'entretien_ok' ? 'Convoqué en entretien technique' : 'Candidat rejeté'}</span>
          </div>
        )}
        <div className="criteria-grid">
          {evalFields.map(({ key, label, max }) => {
            const value   = scores[key] || 0;
            const percent = (value / max) * 100;
            const progressClass = percent >= 70 ? 'high' : percent >= 40 ? 'medium' : 'low';
            return (
              <div key={key} className="criteria-item">
                <div className="criteria-header">
                  <span className="criteria-label">{label}</span>
                  <span className="criteria-max">/ {max}</span>
                </div>
                <div className="criteria-controls">
                  <input type="number" className="score-input" value={value} min="0" max={max} step="0.5"
                    onChange={e => onScoreChange(key, e.target.value, max)} />
                  <div className="progress-bar">
                    <div className={`progress-fill ${progressClass}`} style={{ width: `${percent}%` }} />
                  </div>
                  <span className="score-display">{value}/{max}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="commentaire-section">
          <label className="commentaire-label">Commentaires <span className="optional">(optionnel)</span></label>
          <textarea className="commentaire-textarea" rows="3"
            placeholder="Saisissez vos commentaires manuels sur ce candidat..."
            value={commentaireManuel} onChange={e => onCommentaireChange(e.target.value)} />
          <div className="commentaire-footer">
            <span>Redimensionnable</span><span>{commentaireManuel.length} caractères</span>
          </div>
        </div>
        <div className="statut-section">
          <span className="statut-label">Statut attribué</span>
          <div className={`statut-badge ${totalScore === 0 ? 'waiting' : resultatAuto === 'entretien_ok' ? 'success' : 'danger'}`}>
            {totalScore === 0 ? "En attente d'évaluation"
              : resultatAuto === 'entretien_ok' ? 'Convoqué en entretien' : 'Candidat rejeté'}
          </div>
        </div>
        <div className="actions">
          <button className="btn-cancel" onClick={onClose} disabled={loadingEval}>Annuler</button>
          <button className="btn-save" onClick={() => onSave(totalScore, resultatAuto)}
            disabled={loadingEval || totalScore === 0}>
            {loadingEval ? 'Enregistrement...' : postulant?.note_manuelle > 0 ? 'Modifier' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Composant principal
// ────────────────────────────────────────────────────────────────────────────
export default function Postulantsnotations() {
  const { eventId } = useParams();
  const location    = useLocation();
  const navigate    = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const posteTitle  = queryParams.get('poste') || 'Poste non trouvé';
  const tabParam    = queryParams.get('tab');

  const [width, setWidth]             = useState(window.innerWidth);
  const [sidebarOpen, setSidebarOpen] = useState(width > 768);
  const [activeTab, setActiveTab]     = useState(tabParam === 'shortlist' ? 'shortlist' : 'preselection');
  const [postulants, setPostulants]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showStats, setShowStats]     = useState(false);
  const [statsData, setStatsData]     = useState(null);

  // ── Modal notation CV ──
  const [selectedPostulant, setSelectedPostulant] = useState(null);
  const [showEvalModal, setShowEvalModal]          = useState(false);
  const [loadingEval, setLoadingEval]              = useState(false);
  const [scores, setScores] = useState({
    adequation: 0, experience_pro: 0, niveau_resp: 0,
    formation: 0, competences: 0, qualite_cv: 0, exp_exigeant: 0,
  });
  const [commentaireManuel, setCommentaireManuel] = useState('');

  // ── Modal évaluation technique ──
  const [showTechEval, setShowTechEval]                         = useState(false);
  const [selectedTechPostulant, setSelectedTechPostulant]       = useState(null);
  const [evaluationEnCours, setEvaluationEnCours]               = useState(null);
  const [showExaminateurDashboard, setShowExaminateurDashboard] = useState(false);
  const [selectedExaminateur, setSelectedExaminateur]           = useState(null);
  const [showExaminateurNotation, setShowExaminateurNotation]   = useState(false);

  // ══════════════════════════════════════════════════════════════════════════
  // NOUVEAUX ÉTATS — Configuration centralisée par poste
  // ══════════════════════════════════════════════════════════════════════════

  // ── Présélection : seuil unique par poste ──
  const [seuilPoste, setSeuilPoste]               = useState(null);  // number|null
  const [showSeuilPosteModal, setShowSeuilPosteModal] = useState(false);

  // ── Entretiens : grille et examinateurs uniques par poste ──
  const [criteriaPoste, setCriteriaPoste]         = useState(null);  // array|null
  const [examinateursPoste, setExaminateursPoste] = useState(null);  // array|null
  const [showGrilleModal, setShowGrilleModal]     = useState(false);
  const [showExamModal, setShowExamModal]         = useState(false);

  // ── Modal modifier candidat recruté ──
  const [showRecruteModal, setShowRecruteModal]           = useState(false);
  const [recruteModalPostulant, setRecruteModalPostulant] = useState(null);
  const [recruteInfoMap, setRecruteInfoMap]               = useState({});
  const [recruteFormData, setRecruteFormData]             = useState({ datePriseFonction: '', typeContrat: '' });

  const itemsPerPage = 10;

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => { setSidebarOpen(width > 768); }, [width]);

  useEffect(() => {
    fetchPostulants();
    loadEvaluationsFromStorage();
  }, [eventId]);

  const loadEvaluationsFromStorage = () => {
    const saved = localStorage.getItem('saas_evaluations');
    if (!saved) return;
    JSON.parse(saved).forEach(evalData => {
      if (evalData.statut === 'termine' && evalData.note_moyenne) {
        setPostulants(prev => prev.map(p =>
          p.id === evalData.candidat.id
            ? { ...p, note_tech_totale: evalData.note_moyenne, note_tech_pct: evalData.note_moyenne,
                decisions_notation: evalData.decision_finale === 'recrute' ? 'recrute' : 'rejete' }
            : p
        ));
      }
    });
  };

  const saveEvaluationToStorage = (evaluation) => {
    const saved = localStorage.getItem('saas_evaluations');
    let evaluations = saved ? JSON.parse(saved) : [];
    const idx = evaluations.findIndex(e => e.id === evaluation.id);
    if (idx >= 0) evaluations[idx] = evaluation; else evaluations.push(evaluation);
    localStorage.setItem('saas_evaluations', JSON.stringify(evaluations));
  };

  const fetchPostulants = async () => {
    setLoading(true);
    try {
      setPostulants(getMockPostulantsData());
      calculateStats(getMockPostulantsData());
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de charger les candidats', confirmButtonColor: '#2563EB' });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    let enAttente = 0, convoquesEntretien = 0, enShortlist = 0, rejetes = 0, recrutes = 0;
    data.forEach(p => {
      switch (p.decisions_notation) {
        case '':             enAttente++;          break;
        case 'entretien_ok': convoquesEntretien++; break;
        case 'en_reserve':   enShortlist++;        break;
        case 'recrute':      recrutes++;           break;
        default: if (p.decisions_notation === 'rejete') rejetes++; else enAttente++;
      }
    });
    const stats = { total: data.length, enAttente, convoquesEntretien, enShortlist, rejetes, recrutes,
      byGenre: {}, byCountry: {}, byDecision: {} };
    data.forEach(p => {
      stats.byGenre[p.Genre]    = (stats.byGenre[p.Genre]    || 0) + 1;
      stats.byCountry[p.Pays_R] = (stats.byCountry[p.Pays_R] || 0) + 1;
      stats.byDecision[p.decisions_notation] = (stats.byDecision[p.decisions_notation] || 0) + 1;
    });
    setStatsData(stats);
  };

  const getDecisionForTab = (tab) => {
    switch (tab) {
      case 'preselection':         return '';
      case 'evaluation_technique': return 'entretien_ok';
      case 'shortlist':            return 'en_reserve';
      case 'recrutes':             return 'recrute';
      default:                     return '';
    }
  };

  const getFilteredPostulants = () => {
    let filtered = postulants.filter(p => p.decisions_notation === getDecisionForTab(activeTab));
    if (searchTerm)
      filtered = filtered.filter(p =>
        `${p.nom} ${p.prenoms}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return filtered;
  };

  const getShortlistSorted = () =>
    [...postulants.filter(p => p.decisions_notation === 'en_reserve' || p.decisions_notation === 'recrute')]
      .sort((a, b) => (b.note_tech_pct || 0) - (a.note_tech_pct || 0));

  const getRangPostulant = (postulant) => {
    const idx = getShortlistSorted().findIndex(p => p.id === postulant.id);
    return idx >= 0 ? idx + 1 : 1;
  };

  const getPaginatedData = () => {
    const filtered = getFilteredPostulants();
    const sorted   = activeTab === 'shortlist' || activeTab === 'recrutes'
      ? [...filtered].sort((a, b) => (b.note_tech_pct || 0) - (a.note_tech_pct || 0))
      : filtered;
    const start = (currentPage - 1) * itemsPerPage;
    return { data: sorted.slice(start, start + itemsPerPage), total: sorted.length, totalPages: Math.ceil(sorted.length / itemsPerPage) };
  };

  const confirmClose = async (onConfirmed) => {
    const result = await Swal.fire({
      title: 'Quitter sans enregistrer ?', text: 'Toutes les données saisies seront perdues.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#DC2626', cancelButtonColor: '#6B7280',
      confirmButtonText: 'Oui, quitter', cancelButtonText: 'Non, continuer',
      reverseButtons: true, allowOutsideClick: false, allowEscapeKey: true,
    });
    if (result.isConfirmed) onConfirmed();
  };

  // ── Présélection : ouvrir directement la notation si seuil déjà défini ──
  const handleOpenEvaluation = (postulant) => {
    setSelectedPostulant(postulant);
    setScores({
      adequation: postulant.adequation || 0, experience_pro: postulant.experience_pro || 0,
      niveau_resp: postulant.niveau_resp || 0, formation: postulant.formation || 0,
      competences: postulant.competences || 0, qualite_cv: postulant.qualite_cv || 0,
      exp_exigeant: postulant.exp_exigeant || 0,
    });
    setCommentaireManuel(postulant.commentaire_manuel || '');

    if (seuilPoste !== null) {
      // Seuil déjà défini pour ce poste → notation directe
      setShowEvalModal(true);
    } else {
      // Premier candidat évalué : demander le seuil du poste d'abord
      setShowSeuilPosteModal(true);
    }
  };

  // Confirmation du seuil du poste → on l'applique et on ouvre la notation
  const handleSeuilPosteConfirm = (seuil) => {
    setSeuilPoste(seuil);
    setShowSeuilPosteModal(false);
    setShowEvalModal(true);
  };

  const handleSeuilPosteClose = () => {
    confirmClose(() => { setShowSeuilPosteModal(false); setSelectedPostulant(null); });
  };

  const handleOpenTechEvaluation = (postulant) => {
    setSelectedTechPostulant(postulant);
    setShowTechEval(true);
  };

  const handleScoreChange = (field, value, max) => {
    setScores(prev => ({ ...prev, [field]: Math.min(Math.max(0, Number(value)), max) }));
  };

  const handleSaveEvaluation = async (totalScore, resultatAuto) => {
    if (!selectedPostulant) return;
    if (totalScore === 0) {
      Swal.fire({ icon: 'warning', title: 'Notes manquantes', text: "Veuillez remplir au moins une note.", confirmButtonColor: '#2563EB' });
      return;
    }
    setLoadingEval(true);
    try {
      const updated = postulants.map(p =>
        p.id === selectedPostulant.id
          ? { ...p, ...scores, commentaire_manuel: commentaireManuel, decisions_notation: resultatAuto, note_manuelle: totalScore }
          : p
      );
      setPostulants(updated);
      calculateStats(updated);
      setShowEvalModal(false);
      await Swal.fire({
        icon: resultatAuto === 'entretien_ok' ? 'success' : 'warning',
        title: resultatAuto === 'entretien_ok' ? 'Candidat convoqué !' : 'Candidat rejeté',
        html: `<p>Score : <strong>${totalScore}/100</strong></p>`,
        confirmButtonColor: '#2563EB',
      });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: err.message, confirmButtonColor: '#2563EB' });
    } finally {
      setLoadingEval(false);
    }
  };

  const handleEvalModalClose = () => {
    const hasChanges = () => {
      const hasScores  = Object.values(scores).some(s => s > 0);
      const hasComment = commentaireManuel.trim() !== '';
      if (!hasScores && !hasComment && !selectedPostulant?.note_manuelle) return false;
      if (selectedPostulant) {
        const orig = { adequation: selectedPostulant.adequation || 0, experience_pro: selectedPostulant.experience_pro || 0,
          niveau_resp: selectedPostulant.niveau_resp || 0, formation: selectedPostulant.formation || 0,
          competences: selectedPostulant.competences || 0, qualite_cv: selectedPostulant.qualite_cv || 0,
          exp_exigeant: selectedPostulant.exp_exigeant || 0 };
        return Object.keys(scores).some(k => scores[k] !== orig[k]) || commentaireManuel !== (selectedPostulant.commentaire_manuel || '');
      }
      return hasScores || hasComment;
    };
    if (hasChanges()) {
      confirmClose(() => { setShowEvalModal(false); setSelectedPostulant(null);
        setScores({ adequation: 0, experience_pro: 0, niveau_resp: 0, formation: 0, competences: 0, qualite_cv: 0, exp_exigeant: 0 });
        setCommentaireManuel(''); });
    } else {
      setShowEvalModal(false);
      setSelectedPostulant(null);
    }
  };

  // handleTechEvalContinue : mémorise grille + examinateurs au niveau du poste
  const handleTechEvalContinue = (data) => {
    const { criteria, examinateurs, totalQuestions, totalMax, fromPosteConfig } = data;

    // Mémorisation au niveau poste si ce n'est pas déjà fait
    if (!fromPosteConfig) {
      if (!criteriaPoste) setCriteriaPoste(criteria);
      if (!examinateursPoste) setExaminateursPoste(examinateurs);
    }

    const examinateursPourEval = fromPosteConfig ? examinateurs : examinateurs;

    const nouvelleEvaluation = {
      id: Date.now(), candidat: selectedTechPostulant, jobId: eventId, titreOffre: posteTitle,
      seuilValidation: seuilPoste || 80, criteria: criteriaPoste || criteria,
      examinateurs: examinateursPourEval.map(e => ({ ...e, statut: 'en_attente' })),
      notes_examinateurs: {}, statut: 'en_cours', totalQuestions, totalMax,
      note_moyenne: null, decision_finale: null, date_creation: new Date().toISOString(),
    };
    setEvaluationEnCours(nouvelleEvaluation);
    saveEvaluationToStorage(nouvelleEvaluation);
    setShowExaminateurDashboard(true);
    setShowTechEval(false);
    Swal.fire({ title: 'Évaluation créée !', icon: 'success', confirmButtonColor: '#2563EB', timer: 3000 });
  };

  const handleTechEvalClose = (isDirty = false) => {
    if (isDirty) confirmClose(() => setShowTechEval(false));
    else setShowTechEval(false);
  };

  const handleSelectExaminateur = (examinateur) => {
    setSelectedExaminateur(examinateur);
    setShowExaminateurNotation(true);
  };

  const handleSaveExaminateurNotation = (notationData) => {
    const updated = { ...evaluationEnCours };
    if (!updated.notes_examinateurs) updated.notes_examinateurs = {};
    updated.notes_examinateurs[notationData.examinateurId] = {
      total: notationData.total, max: notationData.max, pourcentage: notationData.pourcentage,
      resultat: notationData.resultat, scores: notationData.scores,
      commentaire: notationData.commentaire, submitted_at: new Date().toISOString(),
    };
    const idx = updated.examinateurs.findIndex(e => e.id === notationData.examinateurId);
    if (idx >= 0) updated.examinateurs[idx].statut = 'termine';
    const tousNotes = updated.examinateurs.every(e => e.statut === 'termine');
    if (tousNotes) {
      updated.statut = 'termine';
      const notes   = Object.values(updated.notes_examinateurs);
      const moyenne = notes.reduce((acc, n) => acc + n.pourcentage, 0) / notes.length;
      updated.note_moyenne    = Math.round(moyenne);
      const seuil = updated.seuilValidation || 80;
      updated.decision_finale = moyenne >= seuil ? 'recrute' : 'rejete';
      Swal.fire({ title: 'Tous les examinateurs ont noté !', icon: 'success', confirmButtonColor: '#2563EB' });
      setPostulants(prev => prev.map(p =>
        p.id === updated.candidat.id
          ? { ...p, note_tech_totale: Math.round(moyenne), note_tech_pct: Math.round(moyenne),
              decisions_notation: moyenne >= seuil ? 'recrute' : 'rejete' }
          : p
      ));
    }
    setEvaluationEnCours(updated);
    saveEvaluationToStorage(updated);
    setShowExaminateurNotation(false);
    setSelectedExaminateur(null);
    Swal.fire({ title: '✅ Notation enregistrée !', icon: 'success', confirmButtonColor: '#2563EB', timer: 2000, showConfirmButton: false });
  };

  const handleExaminateurNotationClose = () => {
    confirmClose(() => { setShowExaminateurNotation(false); setSelectedExaminateur(null); });
  };

  const handleDashboardClose = () => confirmClose(() => setShowExaminateurDashboard(false));

  // ── Handlers modale grille (bouton poste) ──
  const handleGrillePosteClose = () => setShowGrilleModal(false);
  const handleGrillePosteConfirm = (data) => {
    setCriteriaPoste(data.criteria);
    setShowGrilleModal(false);
    Swal.fire({ title: '✓ Grille enregistrée !', text: 'La grille sera automatiquement appliquée à tous les candidats de ce poste.', icon: 'success', confirmButtonColor: '#2563EB' });
  };

  // ── Handlers modale examinateurs (bouton poste) ──
  const handleExamPosteClose = () => setShowExamModal(false);
  const handleExamPosteConfirm = (data) => {
    setExaminateursPoste(data.examinateurs);
    setShowExamModal(false);
    Swal.fire({ title: '✓ Examinateurs enregistrés !', text: `${data.examinateurs.length} examinateur(s) assigné(s) à ce poste.`, icon: 'success', confirmButtonColor: '#2563EB' });
  };

  // ── Handlers modal recruté ──
  const handleOpenRecruteModal = (postulant) => {
    setRecruteModalPostulant(postulant);
    const existing = recruteInfoMap[postulant.id] || {};
    setRecruteFormData({ datePriseFonction: existing.datePriseFonction || '', typeContrat: existing.typeContrat || '' });
    setShowRecruteModal(true);
  };

  const handleSaveRecruteInfo = () => {
    if (!recruteModalPostulant) return;
    setRecruteInfoMap(prev => ({ ...prev, [recruteModalPostulant.id]: { ...recruteFormData } }));
    setShowRecruteModal(false);
    setRecruteModalPostulant(null);
  };

  if (loading) return (
    <div className="app">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isMobile={width <= 768} />
      <div className="layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={`main-content ${sidebarOpen ? 'main-content--shifted' : ''}`}>
          <div className="loading-spinner">Chargement des candidats...</div>
        </main>
      </div>
    </div>
  );

  const { data: displayedData, total, totalPages } = getPaginatedData();
  const isShortlistTab = activeTab === 'shortlist' || activeTab === 'recrutes';

  // ── Styles partagés pour les boutons du poste ──
  const btnPosteStyle = (color = '#1a1a6e') => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: color, color: '#fff', border: 'none',
    borderRadius: 8, padding: '7px 14px', fontSize: 12,
    fontWeight: 700, cursor: 'pointer',
    boxShadow: `0 2px 6px rgba(0,0,0,0.2)`,
    whiteSpace: 'nowrap',
  });

  return (
    <div className="app">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} isMobile={width <= 768} />
      <div className="layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className={`main-content ${sidebarOpen ? 'main-content--shifted' : ''}`}>
          <div className="notations-page">

            {/* ── Breadcrumb ── */}
            <div className="notations-header">
              <div className="notations-breadcrumb">
                <Link to="/postes">Listes des postes</Link>
                <span> / </span>
                <span className="current">Notations</span>
              </div>

              {/* ══════════════════════════════════════════════════
                  BANDEAU POSTE : nom + boutons contextuels
              ══════════════════════════════════════════════════ */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div className="poste-banner" style={{ flex: '1 1 auto' }}>
                  POSTE : {posteTitle}
                </div>

                {/* Bouton présélection : visible uniquement dans l'onglet Présélection */}
                {activeTab === 'preselection' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => setShowSeuilPosteModal(true)}
                      style={btnPosteStyle(seuilPoste ? '#059669' : '#2563EB')}
                      title={seuilPoste ? `Seuil actuel : ${seuilPoste}%` : 'Définir le seuil de présélection pour ce poste'}
                    >
                      {seuilPoste
                        ? <><i className="bi bi-check-circle-fill" /> Seuil : {seuilPoste}%</>
                        : <><i className="bi bi-sliders" /> Créer le seuil de présélection</>}
                    </button>
                  </div>
                )}

                {/* Boutons entretiens : visibles uniquement dans l'onglet Entretiens */}
                {activeTab === 'evaluation_technique' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setShowGrilleModal(true)}
                      style={btnPosteStyle(criteriaPoste ? '#059669' : '#1a1a6e')}
                      title={criteriaPoste ? 'Grille configurée — cliquer pour modifier' : 'Créer la grille de notation pour ce poste'}
                    >
                      {criteriaPoste
                        ? <><i className="bi bi-check-circle-fill" /> Grille configurée</>
                        : <><i className="bi bi-table" /> Grille de notation</>}
                    </button>
                    <button
                      onClick={() => setShowExamModal(true)}
                      style={btnPosteStyle(examinateursPoste ? '#059669' : '#FD8140')}
                      title={examinateursPoste ? `${examinateursPoste.length} examinateur(s) — cliquer pour modifier` : 'Créer les examinateurs pour ce poste'}
                    >
                      {examinateursPoste
                        ? <><i className="bi bi-check-circle-fill" /> {examinateursPoste.length} examinateur(s)</>
                        : <><i className="bi bi-people-fill" /> Création d'examinateurs</>}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="notations-tabs">
              {[
                { key: 'preselection',         label: 'Présélection',       decision: ''            },
                { key: 'evaluation_technique',  label: 'Entretiens',         decision: 'entretien_ok' },
                { key: 'shortlist',             label: 'Shortlist',          decision: 'en_reserve'  },
                { key: 'recrutes',              label: 'Candidats Recrutés', decision: 'recrute'     },
              ].map(({ key, label, decision }) => (
                <button key={key} className={`notations-tab ${activeTab === key ? 'active' : ''}`}
                  onClick={() => { setActiveTab(key); setCurrentPage(1); }}>
                  {label}
                  <span className="tab-count">{statsData?.byDecision[decision] || 0}</span>
                </button>
              ))}
            </div>

            {/* ── Stats ── */}
            <button className="btn-stats" onClick={() => setShowStats(!showStats)}>
              <i className="bi bi-bar-chart-fill" /> Voir les statistiques
            </button>

            {showStats && statsData && (
              <div className="stats-panel">
                <div className="stats-grid">
                  <div className="stats-section">
                    <h4>Candidatures</h4>
                    <p>Total : <strong>{statsData.total}</strong></p>
                    <p>En attente : <strong>{statsData.enAttente}</strong></p>
                    <p>Convoqués entretien : <strong>{statsData.convoquesEntretien}</strong></p>
                    <p>En shortlist : <strong>{statsData.enShortlist}</strong></p>
                    <p>Rejetés : <strong>{statsData.rejetes}</strong></p>
                    <p>Recrutés : <strong>{statsData.recrutes}</strong></p>
                  </div>
                  <div className="stats-section">
                    <h4>Par genre</h4>
                    {Object.entries(statsData.byGenre).map(([g, c]) => (
                      <p key={g}>{g} : <strong>{c}</strong></p>
                    ))}
                  </div>
                  <div className="stats-section">
                    <h4>Par pays de résidence</h4>
                    {Object.entries(statsData.byCountry).slice(0, 5).map(([c, n]) => (
                      <p key={c}>{c} : <strong>{n}</strong></p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Recherche ── */}
            <div className="notations-search-bar">
              <label>Rechercher :</label>
              <input type="text" placeholder="Nom du candidat..." value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
            </div>

            {/* ── Tableau ── */}
            <div className="table-responsive-wrapper">
              <table className="notations-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nom et Prénoms</th>
                    {activeTab === 'preselection' && (
                      <>
                        <th>Genre</th><th>Pays naissance</th><th>Pays résidence</th>
                        <th>Téléphone</th><th>E-mail</th><th>Situation matrimoniale</th>
                        <th>Niveau académique</th><th>Score IA du cv</th><th>Note préselection /100</th>
                        <th>Statut</th><th>Action</th>
                      </>
                    )}
                    {activeTab === 'evaluation_technique' && (
                      <>
                        <th>Seuil requis</th><th>Note Technique</th><th>Score %</th>
                        <th>Statut</th><th>Action</th>
                      </>
                    )}
                    {isShortlistTab && (
                      <>
                        <th>Note évaluation technique</th>
                        <th>Score obtenu en %</th>
                        <th>Rang</th>
                        {activeTab === 'recrutes' && (
                          <>
                            <th>Date de prise de fonction</th>
                            <th>Type de contrat</th>
                          </>
                        )}
                        <th>Décision</th>
                        <th>Rapport</th>
                        {activeTab === 'recrutes' && <th>Action</th>}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayedData.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 'recrutes' ? 10 : isShortlistTab ? 7 : activeTab === 'evaluation_technique' ? 7 : 13} className="empty-state">
                        <div className="empty-state-icon"><i className="bi bi-inbox" /></div>
                        <p>Aucun candidat trouvé</p>
                      </td>
                    </tr>
                  ) : (
                    displayedData.map((postulant, idx) => {
                      const rangNum = isShortlistTab ? getRangPostulant(postulant) : 0;
                      return (
                        <tr key={postulant.id}>
                          <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                          <td><strong>{postulant.nom} {postulant.prenoms}</strong></td>

                          {/* Présélection */}
                          {activeTab === 'preselection' && (
                            <>
                              <td>{postulant.Genre}</td>
                              <td>{postulant.Pays_N}</td>
                              <td>{postulant.Pays_R}</td>
                              <td>{postulant.tel}</td>
                              <td>{postulant.email}</td>
                              <td>{postulant.Situation_M}</td>
                              <td>{postulant.Niveau}</td>
                              <td>{postulant.note_ia}%</td>
                              <td>{postulant.note_100}/100</td>
                              <td>
                                <span className="statut-badge statut-preselection">Présélectionné</span>
                              </td>
                              <td>
                                {/* Accès direct à la notation — le seuil est déjà défini au niveau du poste */}
                                <button className="action-btn" onClick={() => handleOpenEvaluation(postulant)}>
                                  <i className="bi bi-pencil-square" />{' '}
                                  {postulant.note_manuelle > 0 ? 'Modifier' : 'Évaluer'}
                                </button>
                              </td>
                            </>
                          )}

                          {/* Évaluation technique */}
                          {activeTab === 'evaluation_technique' && (
                            <>
                              <td>
                                {seuilPoste ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
                                    background: '#EBF2FF', color: '#2563EB', borderRadius: 20,
                                    padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                                    {seuilPoste}%
                                  </span>
                                ) : (
                                  <span style={{ color: '#A8B0BF', fontSize: 12 }}>Non défini</span>
                                )}
                              </td>
                              <td>{postulant.note_tech_totale || 0}/{postulant.note_tech_max || 100}</td>
                              <td>{postulant.note_tech_pct || 0}%</td>
                              <td>
                                <span className="statut-badge statut-entretien_ok">Évaluation OK</span>
                              </td>
                              <td>
                                {/* "Modifier notation" → sélection directe de l'examinateur si déjà configurés */}
                                <button className="action-btn" onClick={() => handleOpenTechEvaluation(postulant)}>
                                  <i className="bi bi-clipboard-check" />{' '}
                                  {postulant.note_tech_totale > 0 ? 'Modifier notation' : 'Évaluer'}
                                </button>
                              </td>
                            </>
                          )}

                          {/* Shortlist & Recrutés */}
                          {isShortlistTab && (
                            <>
                              <td style={{ fontWeight: 600, textAlign: 'center' }}>
                                {postulant.note_tech_totale || 0}/{postulant.note_tech_max || 100}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ fontWeight: 700,
                                  color: (postulant.note_tech_pct || 0) >= 80 ? '#28a745'
                                    : (postulant.note_tech_pct || 0) >= 60 ? '#f59e0b' : '#dc3545' }}>
                                  {postulant.note_tech_pct || 0}%
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ display: 'inline-block', background: '#FD8140', color: 'white',
                                  borderRadius: 20, padding: '3px 12px', fontWeight: 700, fontSize: 12,
                                  boxShadow: '0 2px 4px rgba(253,129,64,0.35)' }}>
                                  {toOrdinal(rangNum, postulant.Genre?.toLowerCase() === 'femme')}
                                </span>
                              </td>
                              {activeTab === 'recrutes' && (() => {
                                const info = recruteInfoMap[postulant.id] || {};
                                return (
                                  <>
                                    <td style={{ textAlign: 'center', fontSize: 12 }}>
                                      {info.datePriseFonction
                                        ? <span style={{ background: '#EBF2FF', color: '#2563EB', borderRadius: 12, padding: '3px 10px', fontWeight: 600 }}>{info.datePriseFonction}</span>
                                        : <span style={{ color: '#A8B0BF' }}>—</span>}
                                    </td>
                                    <td style={{ textAlign: 'center', fontSize: 12 }}>
                                      {info.typeContrat
                                        ? <span style={{ background: '#F0FDF4', color: '#065f46', borderRadius: 12, padding: '3px 10px', fontWeight: 600 }}>{info.typeContrat}</span>
                                        : <span style={{ color: '#A8B0BF' }}>—</span>}
                                    </td>
                                  </>
                                );
                              })()}
                              <td style={{ textAlign: 'center' }}>
                                {activeTab === 'shortlist' ? (
                                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <button style={{ background: '#28a745', color: 'white', border: 'none',
                                      borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                                      onClick={() => { const updated = postulants.map(p => p.id === postulant.id ? { ...p, decisions_notation: 'recrute' } : p); setPostulants(updated); calculateStats(updated); }}>
                                      Recruter
                                    </button>
                                    <button style={{ background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb',
                                      borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}
                                      onClick={() => { const updated = postulants.map(p => p.id === postulant.id ? { ...p, decisions_notation: 'rejete' } : p); setPostulants(updated); calculateStats(updated); }}>
                                      ✕ Annuler
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ background: '#d1fae5', color: '#065f46',
                                    borderRadius: 12, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>
                                    Recruté
                                  </span>
                                )}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button onClick={() => {
                                  const evalStored = (() => {
                                    try {
                                      const saved = localStorage.getItem('saas_evaluations');
                                      if (!saved) return null;
                                      return JSON.parse(saved).find(e => e.candidat?.id === postulant.id) || null;
                                    } catch { return null; }
                                  })();
                                  navigate('/rapportshortlist', {
                                    state: { candidat: postulant, evaluation: evalStored,
                                      jobId: eventId, titreOffre: posteTitle, rang: rangNum },
                                  });
                                }} style={{ background: '#FD8140', color: 'white', border: 'none',
                                  borderRadius: 8, padding: '6px 16px', fontWeight: 700,
                                  fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 6px rgba(253,129,64,0.3)' }}>
                                  Rapport
                                </button>
                              </td>
                              {activeTab === 'recrutes' && (
                                <td style={{ textAlign: 'center' }}>
                                  <button onClick={() => handleOpenRecruteModal(postulant)}
                                    style={{ background: '#1a1a6e', color: 'white', border: 'none',
                                      borderRadius: 8, padding: '6px 16px', fontWeight: 600,
                                      fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                                      boxShadow: '0 2px 6px rgba(26,26,110,0.25)' }}>
                                    Modifier
                                  </button>
                                </td>
                              )}
                            </>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="notations-pagination">
                <span className="pagination-info">
                  Affichage {((currentPage - 1) * itemsPerPage) + 1} à{' '}
                  {Math.min(currentPage * itemsPerPage, total)} sur {total} éléments
                </span>
                <div className="pagination-controls">
                  <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>&laquo;</button>
                  <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>&lsaquo;</button>
                  <span className="page-current">{currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>&rsaquo;</button>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>&raquo;</button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ══ MODAUX ══════════════════════════════════════════════════════════════ */}

      {/* Modal notation CV */}
      {showEvalModal && (
        <EvaluationModal postulant={selectedPostulant} posteTitle={posteTitle} scores={scores}
          commentaireManuel={commentaireManuel} loadingEval={loadingEval}
          onScoreChange={handleScoreChange} onCommentaireChange={setCommentaireManuel}
          onSave={handleSaveEvaluation} onClose={handleEvalModalClose} />
      )}

      {/* Modal seuil de présélection — niveau POSTE */}
      {showSeuilPosteModal && (
        <PreselectionSeuilModal
          titreOffre={posteTitle}
          seuilInitial={seuilPoste}
          onClose={handleSeuilPosteClose}
          onConfirm={handleSeuilPosteConfirm}
        />
      )}

      {/* Modal grille de notation — niveau POSTE (bouton bandeau Entretiens) */}
      {showGrilleModal && (
        <TechEvaluationModal
          postulant={{ nom: '', prenoms: '', email: '', experience: '', Niveau: '', note_manuelle: 0 }}
          jobId={eventId}
          titreOffre={posteTitle}
          seuilPreselection={seuilPoste || 80}
          criteriaPoste={criteriaPoste}
          examinateursPoste={null}           /* on force la saisie des critères uniquement */
          onClose={handleGrillePosteClose}
          onSave={handleGrillePosteConfirm}
        />
      )}

      {/* Modal examinateurs — niveau POSTE (bouton bandeau Entretiens) */}
      {showExamModal && (
        <TechEvaluationModal
          postulant={{ nom: '', prenoms: '', email: '', experience: '', Niveau: '', note_manuelle: 0 }}
          jobId={eventId}
          titreOffre={posteTitle}
          seuilPreselection={seuilPoste || 80}
          criteriaPoste={criteriaPoste || [{ id: 1, title: 'Critère par défaut', questions: ['Question de base'] }]}
          examinateursPoste={null}           /* on force le passage examinateurs */
          onClose={handleExamPosteClose}
          onSave={handleExamPosteConfirm}
        />
      )}

      {/* Modal évaluation technique — par candidat (grille + examinateurs pré-configurés si dispo) */}
      {showTechEval && selectedTechPostulant && (
        <TechEvaluationModal
          postulant={selectedTechPostulant}
          jobId={eventId}
          titreOffre={posteTitle}
          seuilPreselection={seuilPoste || 80}
          criteriaPoste={criteriaPoste}
          examinateursPoste={examinateursPoste}
          onClose={handleTechEvalClose}
          onSave={handleTechEvalContinue}
        />
      )}

      {showExaminateurDashboard && evaluationEnCours && (
        <div className="modal-notation-overlay">
          <div className="modal-notation-box"
            style={{ maxWidth: '900px', maxHeight: '85vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <ExaminateurDashboard evaluation={evaluationEnCours}
              onRefresh={() => setEvaluationEnCours({ ...evaluationEnCours })}
              onSelectExaminateur={handleSelectExaminateur} />
            <div className="modal-notation-actions" style={{ marginTop: '20px', textAlign: 'right' }}>
              <button className="btn-modal-cancel" onClick={handleDashboardClose}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showExaminateurNotation && selectedExaminateur && evaluationEnCours && (
        <ExaminateurNotationModal examinateur={selectedExaminateur} evaluation={evaluationEnCours}
          onClose={handleExaminateurNotationClose} onSave={handleSaveExaminateurNotation} />
      )}

      {/* Modal modifier candidat recruté */}
      {showRecruteModal && recruteModalPostulant && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowRecruteModal(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '28px 32px',
            minWidth: 380, maxWidth: 460, width: '90%',
            boxShadow: '0 8px 40px rgba(26,26,110,0.18)', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1a1a6e', fontSize: 16, fontWeight: 700 }}>Modifier les informations</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: 13 }}>
                    {recruteModalPostulant.nom} {recruteModalPostulant.prenoms}
                  </p>
                </div>
                <button onClick={() => setShowRecruteModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: 20, color: '#9ca3af', cursor: 'pointer', lineHeight: 1 }}>✕</button>
              </div>
              <div style={{ height: 2, background: 'linear-gradient(90deg, #1a1a6e, #FD8140)', borderRadius: 2, marginTop: 14 }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Date de prise de fonction
              </label>
              <input type="date" value={recruteFormData.datePriseFonction}
                onChange={e => setRecruteFormData(prev => ({ ...prev, datePriseFonction: e.target.value }))}
                style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px',
                  fontSize: 13, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = '#1a1a6e'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Type de contrat
              </label>
              <select value={recruteFormData.typeContrat}
                onChange={e => setRecruteFormData(prev => ({ ...prev, typeContrat: e.target.value }))}
                style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px',
                  fontSize: 13, color: '#1a1a1a', outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit', background: '#fff', cursor: 'pointer', appearance: 'auto' }}
                onFocus={e => e.target.style.borderColor = '#1a1a6e'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}>
                <option value="">— Sélectionner un type —</option>
                <option value="CDI">CDI — Contrat à Durée Indéterminée</option>
                <option value="CDD">CDD — Contrat à Durée Déterminée</option>
                <option value="Stage">Stage</option>
                <option value="Intérim">Intérim</option>
                <option value="Freelance">Freelance / Consultant</option>
                <option value="Alternance">Alternance</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRecruteModal(false)}
                style={{ background: '#f3f4f6', color: '#374151', border: 'none',
                  borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleSaveRecruteInfo}
                disabled={!recruteFormData.datePriseFonction && !recruteFormData.typeContrat}
                style={{ background: recruteFormData.datePriseFonction || recruteFormData.typeContrat ? '#1a1a6e' : '#9ca3af',
                  color: 'white', border: 'none', borderRadius: 8, padding: '9px 24px', fontSize: 13, fontWeight: 700,
                  cursor: recruteFormData.datePriseFonction || recruteFormData.typeContrat ? 'pointer' : 'not-allowed' }}>
                ✓ Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className={`app-footer ${sidebarOpen ? 'app-footer--shifted' : ''}`}>
        © 2025 Zenselekt · Propulsé par <strong>Empower talents &amp; careers</strong>. Tous droits réservés
      </footer>
    </div>
  );
}

// ── Données mock
function getMockPostulantsData() {
  return [
    { id: 1, nom: "DIALLO", prenoms: "Mamadou", Genre: "Homme", Pays_N: "Sénégal",
      Pays_R: "Sénégal", tel: "77 123 45 67", email: "mamadou.diallo@email.com",
      Situation_M: "Célibataire", Niveau: "Master", note_ia: 85, note_100: 85,
      decisions_notation: "", experience: "5 ans", poste_actuel: "Développeur Senior",
      adequation: 0, experience_pro: 0, niveau_resp: 0, formation: 0,
      competences: 0, qualite_cv: 0, exp_exigeant: 0,
      commentaire_manuel: "", note_manuelle: 0,
      note_tech_totale: 0, note_tech_max: 100, note_tech_pct: 0 },
    { id: 2, nom: "KONE", prenoms: "Aminata", Genre: "Femme", Pays_N: "Côte d'Ivoire",
      Pays_R: "Côte d'Ivoire", tel: "05 12 34 56 78", email: "aminata.kone@email.com",
      Situation_M: "Mariée", Niveau: "Licence", note_ia: 72, note_100: 72,
      decisions_notation: "entretien_ok", experience: "3 ans", poste_actuel: "Chef de projet",
      adequation: 18, experience_pro: 20, niveau_resp: 12, formation: 8,
      competences: 8, qualite_cv: 4, exp_exigeant: 7,
      commentaire_manuel: "Bon profil", note_manuelle: 77,
      note_tech_totale: 71, note_tech_max: 100, note_tech_pct: 71 },
    { id: 3, nom: "TRAORE", prenoms: "Ibrahim", Genre: "Homme", Pays_N: "Mali",
      Pays_R: "France", tel: "06 98 76 54 32", email: "ibrahim.traore@email.com",
      Situation_M: "Célibataire", Niveau: "Doctorat", note_ia: 94, note_100: 94,
      decisions_notation: "recrute", experience: "8 ans", poste_actuel: "Directeur Technique",
      adequation: 24, experience_pro: 23, niveau_resp: 14, formation: 10,
      competences: 9, qualite_cv: 5, exp_exigeant: 9,
      commentaire_manuel: "Excellent candidat", note_manuelle: 94,
      note_tech_totale: 93, note_tech_max: 100, note_tech_pct: 93 },
    { id: 4, nom: "FALL", prenoms: "Fatou", Genre: "Femme", Pays_N: "Sénégal",
      Pays_R: "Sénégal", tel: "78 98 76 54", email: "fatou.fall@email.com",
      Situation_M: "Divorcée", Niveau: "Master", note_ia: 68, note_100: 68,
      decisions_notation: "en_reserve", experience: "2 ans", poste_actuel: "Assistante Marketing",
      adequation: 12, experience_pro: 10, niveau_resp: 8, formation: 7,
      competences: 6, qualite_cv: 3, exp_exigeant: 5,
      commentaire_manuel: "", note_manuelle: 51,
      note_tech_totale: 55, note_tech_max: 100, note_tech_pct: 55 },
  ];
}
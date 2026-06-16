import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './css/Postulantsnotations2.css';
import Header from "../component/Header";
import Navbar from "../component/Navbar";
import { useSessionGuard, LOGIN_REDIRECT } from "../component/useSessionGuard";
import TechEvaluationModal from './TechEvaluationModal';
import ExaminateurDashboard from './ExaminateurDashboard';
import ExaminateurNotationModal from './ExaminateurNotationModal';
import PreselectionSeuilModal from './PreselectionSeuilModal';

/* ─────────────────────────────────────────────────────────────────────────
   CONFIG API
───────────────────────────────────────────────────────────────────────── */
const API_NOTATIONS  = '/securebackoffice/backsecurebackoffice/postulantsnotations.php';
const API_ENTRETIENS = '/securebackoffice/backsecurebackoffice/entretiens.php';
const PAGE_SIZE = 10;

/* ─────────────────────────────────────────────────────────────────────────
   BOOTSTRAP ICONS
───────────────────────────────────────────────────────────────────────── */
const BI_CDN = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css';
function useBootstrapIcons() {
  useEffect(() => {
    if (!document.querySelector(`link[href="${BI_CDN}"]`)) {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = BI_CDN;
      document.head.appendChild(l);
    }
  }, []);
}

/* ─────────────────────────────────────────────────────────────────────────
   SECURE FETCH
───────────────────────────────────────────────────────────────────────── */
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
  if (res.status === 401) {
    window.location.replace(LOGIN_REDIRECT);
    return null;
  }
  return res;
}

/* ─────────────────────────────────────────────────────────────────────────
   ORDINAL FRANÇAIS GENRÉ
───────────────────────────────────────────────────────────────────────── */
const toOrdinal = (n, feminin = false) => {
  if (n === 1) return feminin ? '1ère' : '1er';
  return `${n}ème`;
};

/* ─────────────────────────────────────────────────────────────────────────
   CHAMPS DE LA GRILLE PRÉSÉLECTION
───────────────────────────────────────────────────────────────────────── */
const evalFields = [
  { key: 'adequation',     label: 'Adéquation du profil avec le poste',       max: 25 },
  { key: 'experience_pro', label: 'Expérience professionnelle pertinente',     max: 25 },
  { key: 'niveau_resp',    label: 'Niveau de responsabilité',                  max: 15 },
  { key: 'formation',      label: 'Formation académique',                      max: 10 },
  { key: 'competences',    label: 'Compétences techniques clés',               max: 10 },
  { key: 'qualite_cv',     label: 'Qualité et structuration du CV',            max:  5 },
  { key: 'exp_exigeant',   label: "Expérience dans un environnement exigeant", max: 10 },
];

const SCORE_ZERO = Object.fromEntries(evalFields.map(({ key }) => [key, 0]));

const calcTotal = (scores) =>
  evalFields.reduce((acc, { key }) => acc + Number(scores[key] || 0), 0);

const getResultatAuto = (total, seuil) => {
  if (total === 0) return '';
  return total >= (seuil ?? 70) ? 'entretien_ok' : 'rejete';
};

/* ─────────────────────────────────────────────────────────────────────────
   LIBELLÉS DÉCISIONS
───────────────────────────────────────────────────────────────────────── */
const DECISION_LABELS = {
  '':                  { label: 'En présélection',    color: '#6b7280', bg: '#f3f4f6' },
  entretien_ok:        { label: 'Convoqué entretien', color: '#1d4ed8', bg: '#dbeafe' },
  rejete:              { label: 'Rejeté',             color: '#dc2626', bg: '#fee2e2' },
  rejete_entretien:    { label: 'Rejeté (entretien)', color: '#dc2626', bg: '#fee2e2' },
  en_reserve:          { label: 'En shortlist',       color: '#7c3aed', bg: '#ede9fe' },
  recrute:             { label: 'Recruté',            color: '#065f46', bg: '#d1fae5' },
};

/* ══════════════════════════════════════════════════════════════════════════
   COMPOSANT : BADGE DÉCISION
══════════════════════════════════════════════════════════════════════════ */
function DecisionBadge({ decision }) {
  const meta = DECISION_LABELS[decision] ?? DECISION_LABELS[''];
  return (
    <span style={{
      display: 'inline-block',
      background: meta.bg, color: meta.color,
      borderRadius: 20, padding: '3px 12px',
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {meta.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPOSANT : BOUTON RETOUR ARRIÈRE
══════════════════════════════════════════════════════════════════════════ */
const BACK_CONFIG = {
  entretien_ok:     { target: 'rejete_entretien', label: 'Rejeter ce candidat',    icon: 'bi-x-circle',              color: '#dc2626' },
  rejete_entretien: { target: 'entretien_ok',     label: 'Remettre en entretien',  icon: 'bi-arrow-counterclockwise', color: '#1d4ed8' },
  rejete:           { target: '',                 label: 'Remettre en présélection', icon: 'bi-arrow-counterclockwise', color: '#6b7280' },
  en_reserve:       { target: 'entretien_ok',     label: 'Remettre en entretien',  icon: 'bi-arrow-counterclockwise', color: '#1d4ed8' },
  recrute:          { target: 'en_reserve',       label: 'Remettre en shortlist',  icon: 'bi-arrow-counterclockwise', color: '#7c3aed' },
};

function BackButton({ postulant, onReset, loading }) {
  const cfg = BACK_CONFIG[postulant.decisions_notation];
  if (!cfg) return null;
  return (
    <button
      onClick={() => onReset(postulant, cfg.target)}
      disabled={loading}
      title={cfg.label}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'none', border: `1px solid ${cfg.color}`,
        color: cfg.color, borderRadius: 6,
        padding: '4px 10px', fontSize: 11, fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap',
      }}
    >
      <i className={`bi ${cfg.icon}`} />
      {cfg.label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPOSANT : MODAL ÉVALUATION CV (PRÉSÉLECTION)
══════════════════════════════════════════════════════════════════════════ */
function EvaluationModal({
  postulant, posteTitle, seuil, scores, commentaireManuel,
  loadingEval, onScoreChange, onCommentaireChange, onSave, onClose,
}) {
  if (!postulant) return null;
  const totalScore   = calcTotal(scores);
  const resultatAuto = getResultatAuto(totalScore, seuil);

  const getScoreClass = () => {
    if (totalScore >= (seuil ?? 70)) return 'success';
    if (totalScore >= 40)            return 'warning';
    if (totalScore > 0)              return 'danger';
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
            <div className="prev-note">
              Déjà évalué — Note précédente : <strong>{postulant.note_manuelle}/100</strong>
            </div>
          )}
          {posteTitle && posteTitle !== 'Poste non trouvé' && (
            <div className="poste-tag">{posteTitle}</div>
          )}
          {seuil !== null && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
              background: '#EBF2FF', color: '#2563EB', borderRadius: 20,
              padding: '4px 12px', fontSize: 12, fontWeight: 600,
            }}>
              <i className="bi bi-sliders" /> Seuil de présélection : {seuil}/100
            </div>
          )}
        </div>

        <div className="separator" />

        <div className={`score-total ${getScoreClass()}`}>
          <div>
            <div className="score-label">Score total</div>
            <div className="score-desc">
              {totalScore === 0
                ? 'Remplissez les notes ci-dessous'
                : totalScore >= (seuil ?? 70)
                  ? 'Ce candidat sera convoqué en entretien'
                  : 'Ce candidat sera rejeté'}
            </div>
          </div>
          <div className="score-value">{totalScore} / 100</div>
        </div>

        {totalScore > 0 && (
          <div className={`decision-auto ${resultatAuto === 'entretien_ok' ? 'success' : 'danger'}`}>
            <span className="decision-label">Décision automatique :</span>
            <span>{resultatAuto === 'entretien_ok' ? 'Convoqué en entretien' : 'Candidat rejeté'}</span>
          </div>
        )}

        <div className="criteria-grid">
          {evalFields.map(({ key, label, max }) => {
            const value        = scores[key] || 0;
            const percent      = (value / max) * 100;
            const progressClass = percent >= 70 ? 'high' : percent >= 40 ? 'medium' : 'low';
            return (
              <div key={key} className="criteria-item">
                <div className="criteria-header">
                  <span className="criteria-label">{label}</span>
                  <span className="criteria-max">/ {max}</span>
                </div>
                <div className="criteria-controls">
                  <input
                    type="number" className="score-input"
                    value={value} min="0" max={max} step="0.5"
                    onChange={e => onScoreChange(key, e.target.value, max)}
                  />
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
          <label className="commentaire-label">
            Commentaires <span className="optional">(optionnel)</span>
          </label>
          <textarea
            className="commentaire-textarea" rows="3"
            placeholder="Saisissez vos commentaires sur ce candidat..."
            value={commentaireManuel}
            onChange={e => onCommentaireChange(e.target.value)}
          />
          <div className="commentaire-footer">
            <span>Redimensionnable</span>
            <span>{commentaireManuel.length} caractères</span>
          </div>
        </div>

        <div className="statut-section">
          <span className="statut-label">Statut attribué</span>
          <div className={`statut-badge ${
            totalScore === 0 ? 'waiting'
            : resultatAuto === 'entretien_ok' ? 'success' : 'danger'
          }`}>
            {totalScore === 0
              ? "En attente d'évaluation"
              : resultatAuto === 'entretien_ok' ? 'Convoqué en entretien' : 'Candidat rejeté'}
          </div>
        </div>

        <div className="actions">
          <button className="btn-cancel" onClick={onClose} disabled={loadingEval}>Annuler</button>
          <button
            className="btn-save"
            onClick={() => onSave(totalScore, resultatAuto)}
            disabled={loadingEval || totalScore === 0}
          >
            {loadingEval ? 'Enregistrement...' : postulant.note_manuelle > 0 ? 'Modifier' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════════════════════════════════ */
export default function Postulantsnotations() {
  useBootstrapIcons();

  const { eventId }  = useParams();
  const location     = useLocation();
  const navigate     = useNavigate();
  const queryParams  = new URLSearchParams(location.search);
  const posteTitle   = queryParams.get('poste') || 'Poste non trouvé';
  const tabParam     = queryParams.get('tab');

  const { checked }  = useSessionGuard();

  const [width, setWidth]             = useState(window.innerWidth);
  const [sidebarOpen, setSidebarOpen] = useState(width > 768);
  const [activeTab, setActiveTab]     = useState(tabParam === 'shortlist' ? 'shortlist' : 'preselection');

  /* ── Données présélection ── */
  const [postulants,  setPostulants]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm,  setSearchTerm]  = useState('');

  /* ── Données entretiens ── */
  const [postulantsEntretien,   setPostulantsEntretien]   = useState([]);
  const [loadingEntretien,      setLoadingEntretien]      = useState(false);
  const [errorEntretien,        setErrorEntretien]        = useState('');
  const [totalEntretien,        setTotalEntretien]        = useState(0);
  const [totalPagesEntretien,   setTotalPagesEntretien]   = useState(1);
  const [currentPageEntretien,  setCurrentPageEntretien]  = useState(1);
  const [searchEntretien,       setSearchEntretien]       = useState('');

  /* ── Grille / Examinateurs ── */
  const [grillePoste,    setGrillePoste]    = useState(null);
  const [loadingGrille,  setLoadingGrille]  = useState(false);
  const [examinateursPoste,   setExaminateursPoste]   = useState(null);
  const [loadingExaminateurs, setLoadingExaminateurs] = useState(false);

  /* ── Retour arrière ── */
  const [resettingId, setResettingId] = useState(null);

  /* ── Stats ── */
  const [statsData, setStatsData] = useState(null);
  const [showStats, setShowStats] = useState(false);

  /* ── Seuil présélection ── */
  const [seuilPoste,          setSeuilPoste]          = useState(null);
  const [seuilLoaded,         setSeuilLoaded]         = useState(false);
  const [showSeuilPosteModal, setShowSeuilPosteModal] = useState(false);

  /* ── Modal notation CV ── */
  const [selectedPostulant, setSelectedPostulant] = useState(null);
  const [showEvalModal,     setShowEvalModal]     = useState(false);
  const [loadingEval,       setLoadingEval]       = useState(false);
  const [scores,            setScores]            = useState(SCORE_ZERO);
  const [commentaireManuel, setCommentaireManuel] = useState('');

  /* ── Modaux évaluation technique ── */
  const [showTechEval,             setShowTechEval]             = useState(false);
  const [selectedTechPostulant,    setSelectedTechPostulant]    = useState(null);
  const [evaluationEnCours,        setEvaluationEnCours]        = useState(null);
  const [loadingEvalOpen,          setLoadingEvalOpen]          = useState(false);
  const [showExaminateurDashboard, setShowExaminateurDashboard] = useState(false);
  const [selectedExaminateur,      setSelectedExaminateur]      = useState(null);
  const [showExaminateurNotation,  setShowExaminateurNotation]  = useState(false);
  const [showGrilleModal,          setShowGrilleModal]          = useState(false);
  const [showExamModal,            setShowExamModal]            = useState(false);

  /* ── Modal recrutés (persistance BDD) ── */
  const [showRecruteModal,      setShowRecruteModal]      = useState(false);
  const [recruteModalPostulant, setRecruteModalPostulant] = useState(null);
  const [recruteInfoMap,        setRecruteInfoMap]        = useState({});   // { [postulant_id]: { date_prise_fonction, type_contrat } }
  const [recruteFormData,       setRecruteFormData]       = useState({ datePriseFonction: '', typeContrat: '' });
  const [savingRecrutement,     setSavingRecrutement]     = useState(false);
  const [savingRecruteId,       setSavingRecruteId]       = useState(null); // spinner par ligne

  /* ── Responsive ── */
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  useEffect(() => { setSidebarOpen(width > 768); }, [width]);

  /* ════════════════════════════════════════════════════════════
     CHARGEMENTS INITIAUX
  ════════════════════════════════════════════════════════════ */
  const loadSeuil = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await secureFetch(`${API_NOTATIONS}?action=get_seuil&event_id=${eventId}`);
      if (!res) return;
      const json = await res.json();
      if (json.success) setSeuilPoste(json.seuil ?? null);
    } catch { /* non critique */ } finally { setSeuilLoaded(true); }
  }, [eventId]);

  const loadGrille = useCallback(async () => {
    if (!eventId) return;
    setLoadingGrille(true);
    try {
      const res = await secureFetch(`${API_ENTRETIENS}?action=get_grille&event_id=${eventId}`);
      if (!res) return;
      const json = await res.json();
      setGrillePoste(json.success && json.grille ? json.grille : null);
    } catch (e) { console.error('[Grille]', e); setGrillePoste(null); }
    finally { setLoadingGrille(false); }
  }, [eventId]);

  const loadExaminateurs = useCallback(async () => {
    if (!eventId) return;
    setLoadingExaminateurs(true);
    try {
      const res = await secureFetch(`${API_ENTRETIENS}?action=get_examinateurs&event_id=${eventId}`);
      if (!res) return;
      const json = await res.json();
      setExaminateursPoste(
        json.success && Array.isArray(json.examinateurs) && json.examinateurs.length > 0
          ? json.examinateurs : null
      );
    } catch (e) { console.error('[Examinateurs]', e); setExaminateursPoste(null); }
    finally { setLoadingExaminateurs(false); }
  }, [eventId]);

  /* ── Chargement des infos recrutement (date, contrat) depuis BDD ── */
  const loadRecrutements = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await secureFetch(`${API_NOTATIONS}?action=get_recrutements&event_id=${eventId}`);
      if (!res) return;
      const json = await res.json();
      if (json.success && json.recrutements) {
        // Normaliser vers le format interne : { datePriseFonction, typeContrat }
        const map = {};
        Object.entries(json.recrutements).forEach(([pid, info]) => {
          map[Number(pid)] = {
            datePriseFonction: info.date_prise_fonction || '',
            typeContrat:       info.type_contrat        || '',
          };
        });
        setRecruteInfoMap(map);
      }
    } catch (e) { console.error('[Recrutements]', e); }
  }, [eventId]);

  const loadPostulants = useCallback(async (page = 1, search = '') => {
    if (!eventId) { setError('Aucune offre sélectionnée.'); setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const url = `${API_NOTATIONS}?action=list&event_id=${eventId}&page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(search)}`;
      const res = await secureFetch(url);
      if (!res) return;
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Erreur API');
      const data = json.data ?? [];
      setPostulants(data);
      setTotal(json.total ?? data.length);
      setTotalPages(json.total_pages ?? 1);
      calculateStats(data);
    } catch (e) { setError(e.message || 'Erreur chargement.'); }
    finally { setLoading(false); }
  }, [eventId]);

  const loadPostulantsEntretien = useCallback(async (page = 1, search = '') => {
    if (!eventId) return;
    setLoadingEntretien(true); setErrorEntretien('');
    try {
      const url = `${API_ENTRETIENS}?action=get_postulants_entretien&event_id=${eventId}&page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(search)}`;
      const res = await secureFetch(url);
      if (!res) return;
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Erreur API entretiens');
      const data = json.data ?? [];
      setPostulantsEntretien(data);
      setTotalEntretien(json.total ?? data.length);
      setTotalPagesEntretien(json.total_pages ?? 1);
    } catch (e) { setErrorEntretien(e.message || 'Erreur chargement entretiens.'); }
    finally { setLoadingEntretien(false); }
  }, [eventId]);

  const loadTotalEntretien = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await secureFetch(`${API_ENTRETIENS}?action=get_postulants_entretien&event_id=${eventId}&page=1&limit=1`);
      if (!res) return;
      const json = await res.json();
      if (json.success) setTotalEntretien(json.total ?? 0);
    } catch { /* non critique */ }
  }, [eventId]);

  useEffect(() => {
    if (!checked) return;
    loadSeuil();
    loadGrille();
    loadExaminateurs();
    loadPostulants(1, '');
    loadTotalEntretien();
    loadRecrutements(); // ← charger les infos recrutement au démarrage
  }, [checked, loadSeuil, loadGrille, loadExaminateurs, loadPostulants, loadTotalEntretien, loadRecrutements]);

  useEffect(() => {
    if (!checked) return;
    if (activeTab === 'evaluation_technique') loadPostulantsEntretien(currentPageEntretien, searchEntretien);
  }, [activeTab, checked]); // eslint-disable-line

  useEffect(() => {
    if (!checked || !seuilLoaded) return;
    loadPostulants(currentPage, searchTerm);
  }, [currentPage, searchTerm]); // eslint-disable-line

  useEffect(() => {
    if (!checked || activeTab !== 'evaluation_technique') return;
    loadPostulantsEntretien(currentPageEntretien, searchEntretien);
  }, [currentPageEntretien, searchEntretien]); // eslint-disable-line

  /* ════════════════════════════════════════════════════════════
     STATISTIQUES
  ════════════════════════════════════════════════════════════ */
  const calculateStats = (data) => {
    const counts = { '': 0, entretien_ok: 0, en_reserve: 0, rejete: 0, recrute: 0 };
    const byGenre = {}, byCountry = {};
    data.forEach(p => {
      const dec = p.decisions_notation || '';
      counts[dec] = (counts[dec] || 0) + 1;
      byGenre[p.Genre]    = (byGenre[p.Genre]    || 0) + 1;
      byCountry[p.Pays_R] = (byCountry[p.Pays_R] || 0) + 1;
    });
    setStatsData({ total: data.length, byDecision: counts, byGenre, byCountry });
  };

  /* ════════════════════════════════════════════════════════════
     FILTRAGE PAR ONGLET
  ════════════════════════════════════════════════════════════ */
  const getFilteredByTab = () => {
    const tabDecision = {
      preselection: ['', 'rejete'],
      shortlist:    ['en_reserve'],
      recrutes:     ['recrute'],
    }[activeTab] ?? [''];
    return postulants.filter(p => tabDecision.includes(p.decisions_notation || ''));
  };

  const getShortlistSorted = () =>
    [...postulants.filter(p => ['en_reserve', 'recrute'].includes(p.decisions_notation || ''))]
      .sort((a, b) => (b.note_tech_pct || 0) - (a.note_tech_pct || 0));

  const getRangPostulant = (p) => {
    const idx = getShortlistSorted().findIndex(s => s.id === p.id);
    return idx >= 0 ? idx + 1 : 1;
  };

  const displayedData  = activeTab === 'evaluation_technique' ? postulantsEntretien : getFilteredByTab();
  const isShortlistTab = activeTab === 'shortlist' || activeTab === 'recrutes';

  /* ════════════════════════════════════════════════════════════
     RETOUR ARRIÈRE
  ════════════════════════════════════════════════════════════ */
  const handleReset = useCallback(async (postulant, targetDecision) => {
    const cfg = BACK_CONFIG[postulant.decisions_notation];
    if (!cfg) return;

    const targetLabel  = DECISION_LABELS[targetDecision]?.label ?? 'étape précédente';
    const currentLabel = DECISION_LABELS[postulant.decisions_notation]?.label ?? '';

    const result = await Swal.fire({
      title: 'Confirmer l\'action',
      html: `<p style="margin-bottom:12px"><strong>${postulant.nom} ${postulant.prenoms}</strong></p>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap">
          <span style="background:#fee2e2;color:#dc2626;border-radius:20px;padding:4px 14px;font-size:13px;font-weight:600">${currentLabel}</span>
          <span style="color:#6b7280;font-size:18px">→</span>
          <span style="background:#dbeafe;color:#1d4ed8;border-radius:20px;padding:4px 14px;font-size:13px;font-weight:600">${targetLabel}</span>
        </div>
        ${targetDecision === ''
          ? '<p style="margin-top:14px;color:#6b7280;font-size:12px">Les scores de présélection seront remis à zéro.</p>'
          : targetDecision === 'rejete_entretien'
            ? '<p style="margin-top:14px;color:#6b7280;font-size:12px">Le candidat restera visible dans l\'onglet Entretiens avec le statut Rejeté.</p>'
            : '<p style="margin-top:14px;color:#6b7280;font-size:12px">Seule la décision sera modifiée.</p>'}`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Confirmer', cancelButtonText: 'Annuler', reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    setResettingId(postulant.id);

    /* CAS 1 : entretien_ok → rejete_entretien */
    if (postulant.decisions_notation === 'entretien_ok' && targetDecision === 'rejete_entretien') {
      try {
        const res = await secureFetch(`${API_NOTATIONS}?action=set_decision_entretien`, {
          method: 'POST',
          body: JSON.stringify({ postulant_id: postulant.id, decisions_notation: 'rejete_entretien' }),
        });
        if (!res) return;
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setPostulantsEntretien(prev =>
          prev.map(p => p.id !== postulant.id ? p : { ...p, decisions_notation: 'rejete_entretien' })
        );
        await Swal.fire({
          icon: 'success', title: 'Candidat rejeté',
          html: `<strong>${postulant.nom} ${postulant.prenoms}</strong> a été rejeté de l'entretien.<br>
                 <small style="color:#6b7280">Il reste visible dans l'onglet Entretiens.</small>`,
          confirmButtonColor: '#2563EB', timer: 2500, showConfirmButton: false,
        });
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Erreur', text: e.message, confirmButtonColor: '#2563EB' });
      } finally { setResettingId(null); }
      return;
    }

    /* CAS 2 : rejete_entretien → entretien_ok */
    if (postulant.decisions_notation === 'rejete_entretien' && targetDecision === 'entretien_ok') {
      try {
        const res = await secureFetch(`${API_NOTATIONS}?action=set_decision_entretien`, {
          method: 'POST',
          body: JSON.stringify({ postulant_id: postulant.id, decisions_notation: 'entretien_ok' }),
        });
        if (!res) return;
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setPostulantsEntretien(prev =>
          prev.map(p => p.id !== postulant.id ? p : { ...p, decisions_notation: 'entretien_ok' })
        );
        await Swal.fire({
          icon: 'success', title: 'Candidat réintégré',
          html: `<strong>${postulant.nom} ${postulant.prenoms}</strong> est de nouveau en entretien.`,
          confirmButtonColor: '#2563EB', timer: 2500, showConfirmButton: false,
        });
      } catch (e) {
        Swal.fire({ icon: 'error', title: 'Erreur', text: e.message, confirmButtonColor: '#2563EB' });
      } finally { setResettingId(null); }
      return;
    }

    /* CAS 3 : en_reserve → entretien_ok  |  recrute → en_reserve  |  rejete → '' */
    try {
      const res = await secureFetch(`${API_NOTATIONS}?action=reset_notation`, {
        method: 'POST',
        body: JSON.stringify({ postulant_id: postulant.id, target_decision: targetDecision }),
      });
      if (!res) return;
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setPostulants(prev => prev.map(p => {
        if (p.id !== postulant.id) return p;
        const updated = { ...p, decisions_notation: targetDecision };
        if (targetDecision === '') Object.assign(updated, { ...SCORE_ZERO, note_manuelle: 0 });
        return updated;
      }));

      // Si on retire quelqu'un de shortlist/recruté : supprimer ses infos recrutement localement
      if (['en_reserve', 'recrute'].includes(postulant.decisions_notation) && targetDecision === 'entretien_ok') {
        setRecruteInfoMap(prev => {
          const next = { ...prev };
          delete next[postulant.id];
          return next;
        });
        loadPostulantsEntretien(currentPageEntretien, searchEntretien);
        loadTotalEntretien();
      }

      setPostulants(prev => { calculateStats(prev); return prev; });

      await Swal.fire({
        icon: 'success', title: 'Retour effectué',
        html: `<strong>${postulant.nom} ${postulant.prenoms}</strong> → <strong>${targetLabel}</strong>.`,
        confirmButtonColor: '#2563EB', timer: 2500, showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e.message, confirmButtonColor: '#2563EB' });
    } finally { setResettingId(null); }
  }, [currentPageEntretien, searchEntretien, loadPostulantsEntretien, loadTotalEntretien]);

  /* ════════════════════════════════════════════════════════════
     SEUIL PRÉSÉLECTION
  ════════════════════════════════════════════════════════════ */
  const handleSeuilPosteConfirm = async (seuil) => {
    try {
      const res = await secureFetch(`${API_NOTATIONS}?action=set_seuil`, {
        method: 'POST',
        body: JSON.stringify({ event_id: Number(eventId), seuil }),
      });
      if (!res) return;
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setSeuilPoste(seuil);
      setShowSeuilPosteModal(false);
      if (selectedPostulant) setShowEvalModal(true);
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e.message, confirmButtonColor: '#2563EB' });
    }
  };

  const handleSeuilPosteClose = () => {
    confirmClose(() => { setShowSeuilPosteModal(false); setSelectedPostulant(null); });
  };

  /* ════════════════════════════════════════════════════════════
     GRILLE / EXAMINATEURS (depuis bandeau)
  ════════════════════════════════════════════════════════════ */
  const handleGrillePosteConfirm = async (data) => {
    try {
      const res = await secureFetch(`${API_ENTRETIENS}?action=save_grille`, {
        method: 'POST',
        body: JSON.stringify({
          event_id: Number(eventId),
          seuil_shortlist: data.seuilShortlist ?? grillePoste?.seuil_shortlist ?? 80,
          criteria: data.criteria,
        }),
      });
      if (!res) return;
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setGrillePoste(json.data);
      setShowGrilleModal(false);
      Swal.fire({ title: 'Grille enregistrée !', icon: 'success', confirmButtonColor: '#2563EB', timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e.message, confirmButtonColor: '#2563EB' });
    }
  };

  const handleExamPosteConfirm = async (data) => {
    try {
      const res = await secureFetch(`${API_ENTRETIENS}?action=save_examinateurs`, {
        method: 'POST',
        body: JSON.stringify({ event_id: Number(eventId), examinateurs: data.examinateurs }),
      });
      if (!res) return;
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setExaminateursPoste(json.examinateurs);
      setShowExamModal(false);
      Swal.fire({ title: 'Examinateurs enregistrés !', icon: 'success', confirmButtonColor: '#2563EB', timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e.message, confirmButtonColor: '#2563EB' });
    }
  };

  /* ════════════════════════════════════════════════════════════
     NOTATION CV (PRÉSÉLECTION)
  ════════════════════════════════════════════════════════════ */
  const handleOpenEvaluation = (postulant) => {
    setSelectedPostulant(postulant);
    setScores({
      adequation:     postulant.adequation     || 0,
      experience_pro: postulant.experience_pro || 0,
      niveau_resp:    postulant.niveau_resp    || 0,
      formation:      postulant.formation      || 0,
      competences:    postulant.competences    || 0,
      qualite_cv:     postulant.qualite_cv     || 0,
      exp_exigeant:   postulant.exp_exigeant   || 0,
    });
    setCommentaireManuel(postulant.commentaire_manuel || '');
    if (seuilPoste !== null) setShowEvalModal(true);
    else setShowSeuilPosteModal(true);
  };

  const handleSaveEvaluation = async (totalScore, resultatAuto) => {
    if (!selectedPostulant) return;
    if (totalScore === 0) {
      Swal.fire({ icon: 'warning', title: 'Notes manquantes', text: 'Veuillez remplir au moins une note.', confirmButtonColor: '#2563EB' });
      return;
    }
    setLoadingEval(true);
    try {
      const res = await secureFetch(`${API_NOTATIONS}?action=save_notation`, {
        method: 'POST',
        body: JSON.stringify({ postulant_id: selectedPostulant.id, scores, note_manuelle: totalScore, decisions_notation: resultatAuto, commentaire_manuel: commentaireManuel }),
      });
      if (!res) return;
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setPostulants(prev => prev.map(p =>
        p.id !== selectedPostulant.id ? p : { ...p, ...scores, note_manuelle: totalScore, decisions_notation: resultatAuto, commentaire_manuel: commentaireManuel }
      ));
      calculateStats(postulants.map(p => p.id !== selectedPostulant.id ? p : { ...p, decisions_notation: resultatAuto }));
      if (resultatAuto === 'entretien_ok') loadTotalEntretien();

      setShowEvalModal(false); setSelectedPostulant(null); setScores(SCORE_ZERO); setCommentaireManuel('');
      await Swal.fire({
        icon: resultatAuto === 'entretien_ok' ? 'success' : 'warning',
        title: resultatAuto === 'entretien_ok' ? 'Candidat convoqué !' : 'Candidat rejeté',
        html: `<p>Score : <strong>${totalScore}/100</strong></p>`,
        confirmButtonColor: '#2563EB', timer: 2500, showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e.message, confirmButtonColor: '#2563EB' });
    } finally { setLoadingEval(false); }
  };

  const handleEvalModalClose = () => {
    const hasChanges = () => {
      const hasScores = Object.values(scores).some(s => s > 0);
      if (!hasScores && !commentaireManuel.trim() && !selectedPostulant?.note_manuelle) return false;
      if (selectedPostulant) {
        const orig = {
          adequation: selectedPostulant.adequation || 0, experience_pro: selectedPostulant.experience_pro || 0,
          niveau_resp: selectedPostulant.niveau_resp || 0, formation: selectedPostulant.formation || 0,
          competences: selectedPostulant.competences || 0, qualite_cv: selectedPostulant.qualite_cv || 0,
          exp_exigeant: selectedPostulant.exp_exigeant || 0,
        };
        return Object.keys(scores).some(k => scores[k] !== orig[k]) || commentaireManuel !== (selectedPostulant.commentaire_manuel || '');
      }
      return hasScores || !!commentaireManuel.trim();
    };
    if (hasChanges()) {
      confirmClose(() => { setShowEvalModal(false); setSelectedPostulant(null); setScores(SCORE_ZERO); setCommentaireManuel(''); });
    } else {
      setShowEvalModal(false); setSelectedPostulant(null);
    }
  };

  const handleScoreChange = (field, value, max) => {
    setScores(prev => ({ ...prev, [field]: Math.min(Math.max(0, Number(value)), max) }));
  };

  /* ════════════════════════════════════════════════════════════
     SHORTLIST — RECRUTER (persistance BDD)
     ────────────────────────────────────────────────────────────
     Appelle save_recrutement avec decisions_notation = 'recrute'
     + date/contrat si déjà renseignés dans recruteInfoMap
  ════════════════════════════════════════════════════════════ */
  const handleRecruterPostulant = useCallback(async (postulant) => {
    const confirm = await Swal.fire({
      title: 'Recruter ce candidat ?',
      html: `<strong>${postulant.nom} ${postulant.prenoms}</strong> sera marqué comme recruté.`,
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#28a745', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Oui, recruter', cancelButtonText: 'Annuler', reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    setSavingRecruteId(postulant.id);
    const existingInfo = recruteInfoMap[postulant.id] || {};
    try {
      const res = await secureFetch(`${API_NOTATIONS}?action=save_recrutement`, {
        method: 'POST',
        body: JSON.stringify({
          postulant_id:        postulant.id,
          event_id:            Number(eventId),
          decisions_notation:  'recrute',
          date_prise_fonction: existingInfo.datePriseFonction || '',
          type_contrat:        existingInfo.typeContrat       || '',
        }),
      });
      if (!res) return;
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setPostulants(prev => prev.map(p =>
        p.id === postulant.id ? { ...p, decisions_notation: 'recrute' } : p
      ));
      calculateStats(postulants.map(p =>
        p.id === postulant.id ? { ...p, decisions_notation: 'recrute' } : p
      ));

      await Swal.fire({
        icon: 'success', title: 'Candidat recruté !',
        html: `<strong>${postulant.nom} ${postulant.prenoms}</strong> a été marqué comme recruté.`,
        confirmButtonColor: '#2563EB', timer: 2500, showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e.message, confirmButtonColor: '#2563EB' });
    } finally { setSavingRecruteId(null); }
  }, [eventId, recruteInfoMap, postulants]);

  /* ════════════════════════════════════════════════════════════
     SHORTLIST — ANNULER (rejeter depuis shortlist → en_reserve)
     Utilise reset_notation : recrute / en_reserve → …
     Ici pour le bouton "✕ Annuler" dans l'onglet Shortlist :
     passe en_reserve → rejete (retire de la shortlist)
  ════════════════════════════════════════════════════════════ */
  const handleAnnulerShortlist = useCallback(async (postulant) => {
    const confirm = await Swal.fire({
      title: 'Retirer de la shortlist ?',
      html: `<strong>${postulant.nom} ${postulant.prenoms}</strong> sera retiré de la shortlist et marqué comme rejeté.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280',
      confirmButtonText: 'Retirer', cancelButtonText: 'Annuler', reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    setSavingRecruteId(postulant.id);
    try {
      const res = await secureFetch(`${API_NOTATIONS}?action=save_recrutement`, {
        method: 'POST',
        body: JSON.stringify({
          postulant_id:       postulant.id,
          event_id:           Number(eventId),
          decisions_notation: 'rejete',
        }),
      });
      if (!res) return;
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setPostulants(prev => prev.map(p =>
        p.id === postulant.id ? { ...p, decisions_notation: 'rejete' } : p
      ));
      // Nettoyer les infos recrutement localement
      setRecruteInfoMap(prev => {
        const next = { ...prev };
        delete next[postulant.id];
        return next;
      });
      calculateStats(postulants.map(p =>
        p.id === postulant.id ? { ...p, decisions_notation: 'rejete' } : p
      ));
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e.message, confirmButtonColor: '#2563EB' });
    } finally { setSavingRecruteId(null); }
  }, [eventId, postulants]);

  /* ════════════════════════════════════════════════════════════
     MODAL RECRUTEMENT — ouverture (shortlist ou recrutés)
  ════════════════════════════════════════════════════════════ */
  const handleOpenRecruteModal = (p) => {
    setRecruteModalPostulant(p);
    const existing = recruteInfoMap[p.id] || {};
    setRecruteFormData({
      datePriseFonction: existing.datePriseFonction || '',
      typeContrat:       existing.typeContrat       || '',
    });
    setShowRecruteModal(true);
  };

  /* ════════════════════════════════════════════════════════════
     MODAL RECRUTEMENT — sauvegarde BDD
  ════════════════════════════════════════════════════════════ */
  const handleSaveRecruteInfo = async () => {
    if (!recruteModalPostulant) return;
    setSavingRecrutement(true);
    try {
      const res = await secureFetch(`${API_NOTATIONS}?action=save_recrutement`, {
        method: 'POST',
        body: JSON.stringify({
          postulant_id:        recruteModalPostulant.id,
          event_id:            Number(eventId),
          decisions_notation:  recruteModalPostulant.decisions_notation || 'recrute',
          date_prise_fonction: recruteFormData.datePriseFonction || '',
          type_contrat:        recruteFormData.typeContrat       || '',
        }),
      });
      if (!res) return;
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      // Mettre à jour le cache local
      setRecruteInfoMap(prev => ({
        ...prev,
        [recruteModalPostulant.id]: {
          datePriseFonction: recruteFormData.datePriseFonction,
          typeContrat:       recruteFormData.typeContrat,
        },
      }));
      setShowRecruteModal(false);
      setRecruteModalPostulant(null);
      Swal.fire({
        icon: 'success', title: 'Informations enregistrées',
        confirmButtonColor: '#2563EB', timer: 2000, showConfirmButton: false,
      });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: e.message, confirmButtonColor: '#2563EB' });
    } finally { setSavingRecrutement(false); }
  };

  /* ════════════════════════════════════════════════════════════
     CONFIRMATION ABANDON
  ════════════════════════════════════════════════════════════ */
  const confirmClose = async (onConfirmed) => {
    const result = await Swal.fire({
      title: 'Quitter sans enregistrer ?', text: 'Toutes les données saisies seront perdues.',
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#DC2626', cancelButtonColor: '#6B7280',
      confirmButtonText: 'Oui, quitter', cancelButtonText: 'Non, continuer', reverseButtons: true,
    });
    if (result.isConfirmed) onConfirmed();
  };

  /* ════════════════════════════════════════════════════════════
     HELPER — Construction objet évaluation
  ════════════════════════════════════════════════════════════ */
  const buildEvaluationEnCours = useCallback((postulant, grille, examinateurs, existingEvalsMap = {}) => ({
    id:                 Date.now(),
    candidat:           postulant,
    jobId:              eventId,
    titreOffre:         posteTitle,
    seuilValidation:    grille.seuil_shortlist ?? 80,
    criteria:           grille.criteria,
    examinateurs:       examinateurs.map(e => ({
      ...e,
      statut: existingEvalsMap[e.id] ? 'termine' : 'en_attente',
    })),
    notes_examinateurs: existingEvalsMap,
    statut:             'en_cours',
    totalQuestions:     grille.total_questions,
    totalMax:           grille.total_max,
    note_moyenne:       null,
    decision_finale:    null,
    date_creation:      new Date().toISOString(),
  }), [eventId, posteTitle]);

  /* ════════════════════════════════════════════════════════════
     ÉVALUATION TECHNIQUE — ouverture avec rechargement BDD
  ════════════════════════════════════════════════════════════ */
  const handleOpenTechEvaluation = useCallback(async (p) => {
    setSelectedTechPostulant(p);

    const grilleOk = grillePoste !== null;
    const examsOk  = Array.isArray(examinateursPoste) && examinateursPoste.length > 0;

    if (!grilleOk || !examsOk) {
      if (!grilleOk && !examsOk) {
        Swal.fire({
          icon: 'warning', title: 'Configuration requise',
          html: `<p style="color:#374151;margin-bottom:12px">Avant d'évaluer ce candidat, veuillez compléter les deux étapes :</p>
            <div style="display:flex;flex-direction:column;gap:8px;text-align:left">
              <div style="display:flex;align-items:center;gap:10px;background:#FEF3C7;border-radius:8px;padding:10px 14px">
                <span style="background:#F59E0B;color:white;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0">1</span>
                <span style="color:#92400E;font-size:13px;font-weight:600">Créer les <strong>examinateurs</strong></span>
              </div>
              <div style="display:flex;align-items:center;gap:10px;background:#FEF3C7;border-radius:8px;padding:10px 14px">
                <span style="background:#F59E0B;color:white;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0">2</span>
                <span style="color:#92400E;font-size:13px;font-weight:600">Définir la <strong>grille de notation</strong></span>
              </div>
            </div>`,
          confirmButtonColor: '#2563EB', confirmButtonText: 'Compris',
        });
      } else if (!grilleOk) {
        Swal.fire({
          icon: 'warning', title: 'Étape 2 manquante',
          html: `<p style="color:#374151">La <strong>grille de notation</strong> n'a pas encore été configurée.</p>`,
          confirmButtonColor: '#2563EB', confirmButtonText: 'Configurer la grille',
          showCancelButton: true, cancelButtonText: 'Annuler', cancelButtonColor: '#6b7280', reverseButtons: true,
        }).then(r => { if (r.isConfirmed) setShowGrilleModal(true); });
      } else {
        Swal.fire({
          icon: 'warning', title: 'Étape 1 manquante',
          html: `<p style="color:#374151">Aucun <strong>examinateur</strong> n'a encore été créé.</p>`,
          confirmButtonColor: '#FD8140', confirmButtonText: 'Créer les examinateurs',
          showCancelButton: true, cancelButtonText: 'Annuler', cancelButtonColor: '#6b7280', reverseButtons: true,
        }).then(r => { if (r.isConfirmed) setShowExamModal(true); });
      }
      return;
    }

    setLoadingEvalOpen(true);
    try {
      const res = await secureFetch(
        `${API_ENTRETIENS}?action=get_evaluations&event_id=${eventId}&postulant_id=${p.id}`
      );

      let existingEvalsMap = {};
      if (res) {
        const json = await res.json();
        if (json.success && Array.isArray(json.evaluations)) {
          json.evaluations.forEach(ev => {
            existingEvalsMap[ev.examinateur_id] = {
              total:        ev.note_totale,
              max:          ev.note_max,
              pourcentage:  ev.pourcentage,
              resultat:     ev.resultat,
              scores:       ev.scores,
              commentaire:  ev.commentaire ?? '',
              submitted_at: ev.submitted_at,
            };
          });
        }
      }

      const evaluation = buildEvaluationEnCours(p, grillePoste, examinateursPoste, existingEvalsMap);
      setEvaluationEnCours(evaluation);
      setShowExaminateurDashboard(true);
    } catch (e) {
      console.error('[handleOpenTechEvaluation]', e);
      const evaluation = buildEvaluationEnCours(p, grillePoste, examinateursPoste, {});
      setEvaluationEnCours(evaluation);
      setShowExaminateurDashboard(true);
    } finally {
      setLoadingEvalOpen(false);
    }
  }, [grillePoste, examinateursPoste, buildEvaluationEnCours, eventId]);

  const handleTechEvalClose = (isDirty = false) => {
    if (isDirty) confirmClose(() => setShowTechEval(false));
    else setShowTechEval(false);
  };

  /* ════════════════════════════════════════════════════════════
     ÉVALUATION TECHNIQUE — sauvegarde via TechEvaluationModal
  ════════════════════════════════════════════════════════════ */
  const handleTechEvalContinue = async (data) => {
    const { criteria, examinateurs, totalQuestions, totalMax, seuilShortlist } = data;

    let grilleActuelle = grillePoste;
    if (!grilleActuelle || JSON.stringify(grilleActuelle.criteria) !== JSON.stringify(criteria)) {
      try {
        const res = await secureFetch(`${API_ENTRETIENS}?action=save_grille`, {
          method: 'POST',
          body: JSON.stringify({ event_id: Number(eventId), seuil_shortlist: seuilShortlist ?? 80, criteria }),
        });
        if (res) { const json = await res.json(); if (json.success) { grilleActuelle = json.data; setGrillePoste(json.data); } }
      } catch (e) { console.error('[save_grille]', e); }
    }

    let examinateursBDD = examinateursPoste;
    if (!examinateursBDD && Array.isArray(examinateurs) && examinateurs.length > 0) {
      try {
        const res = await secureFetch(`${API_ENTRETIENS}?action=save_examinateurs`, {
          method: 'POST',
          body: JSON.stringify({ event_id: Number(eventId), examinateurs }),
        });
        if (res) { const json = await res.json(); if (json.success) { examinateursBDD = json.examinateurs; setExaminateursPoste(json.examinateurs); } }
      } catch (e) { console.error('[save_examinateurs]', e); }
    }

    const examsList = examinateursBDD ?? examinateurs ?? [];
    const grilleFinale = {
      seuil_shortlist: seuilShortlist ?? grilleActuelle?.seuil_shortlist ?? 80,
      criteria: grilleActuelle?.criteria ?? criteria,
      total_questions: grilleActuelle?.total_questions ?? totalQuestions,
      total_max: grilleActuelle?.total_max ?? totalMax,
    };

    const nouvelleEval = buildEvaluationEnCours(selectedTechPostulant, grilleFinale, examsList, {});
    setEvaluationEnCours(nouvelleEval);
    setShowExaminateurDashboard(true);
    setShowTechEval(false);
    Swal.fire({ title: 'Évaluation créée !', icon: 'success', confirmButtonColor: '#2563EB', timer: 2000, showConfirmButton: false });
  };

  /* ════════════════════════════════════════════════════════════
     ÉVALUATION TECHNIQUE — notation examinateur
  ════════════════════════════════════════════════════════════ */
  const handleSelectExaminateur = (ex) => {
    setSelectedExaminateur(ex);
    setShowExaminateurNotation(true);
  };

  const handleSaveExaminateurNotation = async (notationData) => {
    if (!evaluationEnCours) return;

    try {
      const res = await secureFetch(`${API_ENTRETIENS}?action=save_evaluation`, {
        method: 'POST',
        body: JSON.stringify({
          event_id:       Number(eventId),
          postulant_id:   evaluationEnCours.candidat.id,
          examinateur_id: notationData.examinateurId,
          scores:         notationData.scores,
          commentaire:    notationData.commentaire ?? '',
        }),
      });

      if (res) {
        const json = await res.json();
        if (!json.success) {
          Swal.fire({ icon: 'error', title: 'Erreur API', text: json.message, confirmButtonColor: '#2563EB' });
          return;
        }

        if (json.data?.tous_notes) {
          const dec = json.data.decision_finale;
          setPostulantsEntretien(prev => prev.map(p =>
            p.id !== evaluationEnCours.candidat.id ? p : {
              ...p, note_tech_totale: json.data.note_totale, note_tech_pct: json.data.note_moyenne,
              note_moyenne_entretien: json.data.note_moyenne, decisions_notation: dec,
            }
          ));
          setPostulants(prev => prev.map(p =>
            p.id !== evaluationEnCours.candidat.id ? p : {
              ...p, note_tech_totale: json.data.note_totale, note_tech_pct: json.data.note_moyenne, decisions_notation: dec,
            }
          ));
          loadTotalEntretien();
        }
      }
    } catch (e) { console.error('[save_evaluation]', e); }

    const updated = { ...evaluationEnCours };
    updated.notes_examinateurs = {
      ...updated.notes_examinateurs,
      [notationData.examinateurId]: {
        total:        notationData.total,
        max:          notationData.max,
        pourcentage:  notationData.pourcentage,
        resultat:     notationData.resultat,
        scores:       notationData.scores,
        commentaire:  notationData.commentaire,
        submitted_at: new Date().toISOString(),
      },
    };

    const idx = updated.examinateurs.findIndex(e => e.id === notationData.examinateurId);
    if (idx >= 0) updated.examinateurs[idx] = { ...updated.examinateurs[idx], statut: 'termine' };

    const tousNotes = updated.examinateurs.every(e => e.statut === 'termine');
    if (tousNotes) {
      updated.statut = 'termine';
      const notes    = Object.values(updated.notes_examinateurs);
      const moyenne  = notes.reduce((acc, n) => acc + n.pourcentage, 0) / notes.length;
      updated.note_moyenne    = Math.round(moyenne);
      updated.decision_finale = moyenne >= (updated.seuilValidation || 80) ? 'en_reserve' : 'rejete';
    }

    setEvaluationEnCours(updated);
    setShowExaminateurNotation(false);
    setSelectedExaminateur(null);

    Swal.fire({ title: 'Notation enregistrée !', icon: 'success', confirmButtonColor: '#2563EB', timer: 2000, showConfirmButton: false });
  };

  const handleExaminateurNotationClose = () =>
    confirmClose(() => { setShowExaminateurNotation(false); setSelectedExaminateur(null); });
  const handleDashboardClose = () =>
    confirmClose(() => setShowExaminateurDashboard(false));

  /* ════════════════════════════════════════════════════════════
     NAVIGATION VERS LE RAPPORT
     Passe la grille et les évaluations dans le state navigate
  ════════════════════════════════════════════════════════════ */
  const handleNavigateToRapport = useCallback(async (postulant, rang) => {
    // Charger les évaluations de ce candidat depuis l'API
    let evaluationState = null;
    if (grillePoste) {
      try {
        const res = await secureFetch(
          `${API_ENTRETIENS}?action=get_evaluations&event_id=${eventId}&postulant_id=${postulant.id}`
        );
        if (res) {
          const json = await res.json();
          if (json.success && Array.isArray(json.evaluations)) {
            const notesMap = {};
            json.evaluations.forEach(ev => {
              notesMap[ev.examinateur_id] = {
                total:        ev.note_totale,
                max:          ev.note_max,
                pourcentage:  ev.pourcentage,
                resultat:     ev.resultat,
                scores:       ev.scores,
                commentaire:  ev.commentaire ?? '',
                submitted_at: ev.submitted_at,
              };
            });
            evaluationState = {
              criteria:           grillePoste.criteria,
              notes_examinateurs: notesMap,
              note_moyenne:       postulant.note_tech_pct ?? 0,
            };
          }
        }
      } catch (e) { console.error('[Rapport évaluations]', e); }
    }

    const recruteInfo = recruteInfoMap[postulant.id] || {};
    navigate('/rapportshortlist', {
      state: {
        candidat:    postulant,
        evaluation:  evaluationState,
        jobId:       eventId,
        titreOffre:  posteTitle,
        rang,
        // Infos recrutement pré-remplies si disponibles
        salaireActuel:    '',
        pretentionSal:    '',
        disponibilite:    '',
        datePriseFonction: recruteInfo.datePriseFonction || '',
        typeContrat:       recruteInfo.typeContrat       || '',
      },
    });
  }, [eventId, posteTitle, grillePoste, recruteInfoMap, navigate]);

  /* ════════════════════════════════════════════════════════════
     GUARD SESSION
  ════════════════════════════════════════════════════════════ */
  if (!checked) {
    return <div className="app"><div className="loading-spinner">Vérification en cours…</div></div>;
  }

  /* ─────────────────────────────────────────────────────────
     STYLES BANDEAU
  ───────────────────────────────────────────────────────── */
  const btnPosteStyle = (color = '#1a1a6e') => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: color, color: '#fff', border: 'none',
    borderRadius: 8, padding: '7px 14px', fontSize: 12,
    fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
  });

  /* ─────────────────────────────────────────────────────────
     COMPTEURS ONGLETS
  ───────────────────────────────────────────────────────── */
  const tabCounts = {
    preselection:         (statsData?.byDecision?.[''] || 0) + (statsData?.byDecision?.['rejete'] || 0),
    evaluation_technique: totalEntretien,
    shortlist:            statsData?.byDecision?.['en_reserve']   || 0,
    recrutes:             statsData?.byDecision?.['recrute']      || 0,
  };

  /* ─────────────────────────────────────────────────────────
     RENDU
  ───────────────────────────────────────────────────────── */
  return (
    <div className="app">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(p => !p)} isMobile={width <= 768} />
      <div className="layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={`main-content ${sidebarOpen ? 'main-content--shifted' : ''}`}>
          <div className="notations-page">

            {/* ── Breadcrumb + bandeau ── */}
            <div className="notations-header">
              <div className="notations-breadcrumb">
                <Link to="/postes">Listes des postes</Link>
                <span> / </span>
                <span className="current">Notations</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div className="poste-banner" style={{ flex: '1 1 auto' }}>POSTE : {posteTitle}</div>

                {activeTab === 'preselection' && (
                  <button onClick={() => setShowSeuilPosteModal(true)}
                    style={btnPosteStyle(seuilPoste ? '#059669' : '#2563EB')}
                    title={seuilPoste ? `Seuil actuel : ${seuilPoste}%` : 'Définir le seuil de présélection'}>
                    {seuilPoste
                      ? <><i className="bi bi-check-circle-fill" /> Seuil : {seuilPoste}/100</>
                      : <><i className="bi bi-sliders" /> Créer le seuil de présélection</>}
                  </button>
                )}

                {activeTab === 'evaluation_technique' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => setShowGrilleModal(true)} disabled={loadingGrille} style={btnPosteStyle(grillePoste ? '#059669' : '#1a1a6e')}>
                      {loadingGrille ? <><i className="bi bi-hourglass-split" /> Chargement…</>
                        : grillePoste ? <><i className="bi bi-check-circle-fill" /> Grille configurée ({grillePoste.total_questions}Q)</>
                        : <><i className="bi bi-table" /> Grille de notation</>}
                    </button>
                    <button onClick={() => setShowExamModal(true)} disabled={loadingExaminateurs} style={btnPosteStyle(examinateursPoste ? '#059669' : '#FD8140')}>
                      {loadingExaminateurs ? <><i className="bi bi-hourglass-split" /> Chargement…</>
                        : examinateursPoste ? <><i className="bi bi-check-circle-fill" /> {examinateursPoste.length} examinateur(s)</>
                        : <><i className="bi bi-people-fill" /> Création d'examinateurs</>}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Indicateur étapes entretiens ── */}
            {activeTab === 'evaluation_technique' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: '#F8FAFF', border: '1px solid #E0E7FF',
                borderRadius: 10, padding: '10px 16px', marginBottom: 16, flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a6e', marginRight: 4 }}>Étapes requises :</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: examinateursPoste ? '#D1FAE5' : '#FEF3C7', color: examinateursPoste ? '#065f46' : '#92400E', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                  Étape 1 — Examinateurs {examinateursPoste ? `(${examinateursPoste.length})` : 'non créés'}
                </div>
                <span style={{ color: '#CBD5E1', fontSize: 16 }}>›</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: grillePoste ? '#D1FAE5' : '#FEF3C7', color: grillePoste ? '#065f46' : '#92400E', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                  Étape 2 — Grille {grillePoste ? `(${grillePoste.total_questions} questions)` : 'non configurée'}
                </div>
                <span style={{ color: '#CBD5E1', fontSize: 16 }}>›</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: (grillePoste && examinateursPoste) ? '#DBEAFE' : '#F3F4F6', color: (grillePoste && examinateursPoste) ? '#1d4ed8' : '#9ca3af', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                  Étape 3 — Évaluer les candidats
                  {(grillePoste && examinateursPoste) && <span style={{ fontSize: 11, fontWeight: 500 }}>(disponible)</span>}
                </div>
              </div>
            )}

            {/* ── Erreurs ── */}
            {error && !loading && (
              <div className="postulants-error" style={{ marginBottom: 16 }}>
                <i className="bi bi-exclamation-circle-fill" />
                <span>{error}</span>
                <button onClick={() => loadPostulants(currentPage, searchTerm)}>Réessayer</button>
              </div>
            )}
            {errorEntretien && !loadingEntretien && activeTab === 'evaluation_technique' && (
              <div className="postulants-error" style={{ marginBottom: 16 }}>
                <i className="bi bi-exclamation-circle-fill" />
                <span>{errorEntretien}</span>
                <button onClick={() => loadPostulantsEntretien(currentPageEntretien, searchEntretien)}>Réessayer</button>
              </div>
            )}

            {/* ── Onglets ── */}
            <div className="notations-tabs">
              {[
                { key: 'preselection',        label: 'Présélection'        },
                { key: 'evaluation_technique', label: 'Entretiens'         },
                { key: 'shortlist',            label: 'Shortlist'          },
                { key: 'recrutes',             label: 'Candidats Recrutés' },
              ].map(({ key, label }) => (
                <button key={key}
                  className={`notations-tab ${activeTab === key ? 'active' : ''}`}
                  onClick={() => { setActiveTab(key); setCurrentPage(1); setCurrentPageEntretien(1); }}>
                  {label}
                  <span className="tab-count">{tabCounts[key] ?? 0}</span>
                </button>
              ))}
            </div>

            {/* ── Stats ── */}
            <button className="btn-stats" onClick={() => setShowStats(v => !v)}>
              <i className="bi bi-bar-chart-fill" /> Voir les statistiques
            </button>
            {showStats && statsData && (
              <div className="stats-panel">
                <div className="stats-grid">
                  <div className="stats-section">
                    <h4>Candidatures</h4>
                    <p>Total : <strong>{statsData.total}</strong></p>
                    <p>En présélection : <strong>{statsData.byDecision?.[''] || 0}</strong></p>
                    <p>Rejetés : <strong>{statsData.byDecision?.['rejete'] || 0}</strong></p>
                    <p>Convoqués entretien : <strong>{totalEntretien}</strong></p>
                    <p>En shortlist : <strong>{statsData.byDecision?.['en_reserve'] || 0}</strong></p>
                    <p>Recrutés : <strong>{statsData.byDecision?.['recrute'] || 0}</strong></p>
                  </div>
                  <div className="stats-section">
                    <h4>Par genre</h4>
                    {Object.entries(statsData.byGenre || {}).map(([g, c]) => (
                      <p key={g}>{g} : <strong>{c}</strong></p>
                    ))}
                  </div>
                  <div className="stats-section">
                    <h4>Par pays de résidence</h4>
                    {Object.entries(statsData.byCountry || {}).slice(0, 5).map(([c, n]) => (
                      <p key={c}>{c} : <strong>{n}</strong></p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Recherche ── */}
            <div className="notations-search-bar">
              <label>Rechercher :</label>
              <input type="text" placeholder="Nom du candidat..."
                value={activeTab === 'evaluation_technique' ? searchEntretien : searchTerm}
                onChange={e => {
                  if (activeTab === 'evaluation_technique') { setSearchEntretien(e.target.value); setCurrentPageEntretien(1); }
                  else { setSearchTerm(e.target.value); setCurrentPage(1); }
                }}
              />
            </div>

            {/* ══════════════════════════════════════════════════
                TABLEAU
            ══════════════════════════════════════════════════ */}
            <div className="table-responsive-wrapper">
              {(activeTab === 'evaluation_technique' ? (loadingEntretien || loadingEvalOpen) : loading) ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af' }}>
                  <i className="bi bi-hourglass-split" style={{ fontSize: 24, display: 'block', marginBottom: 12 }} />
                  {loadingEvalOpen ? 'Chargement des évaluations…' : 'Chargement des candidats…'}
                </div>
              ) : (
                <table className="notations-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nom et Prénoms</th>
                      {activeTab === 'preselection' && (
                        <>
                          <th>Genre</th><th>Pays naissance</th><th>Pays résidence</th>
                          <th>Téléphone</th><th>E-mail</th><th>Situation matrimoniale</th>
                          <th>Niveau académique</th><th>Score IA</th>
                          <th>Note présélection /100</th><th>Statut</th><th>Actions</th>
                        </>
                      )}
                      {activeTab === 'evaluation_technique' && (
                        <>
                          <th>E-mail</th><th>Seuil requis</th><th>Note technique</th>
                          <th>Score %</th><th>Examinateurs notés</th><th>Statut entretien</th><th>Actions</th>
                        </>
                      )}
                      {isShortlistTab && (
                        <>
                          <th>Note technique</th><th>Score %</th><th>Rang</th>
                          {activeTab === 'recrutes' && (<><th>Date de prise de fonction</th><th>Type de contrat</th></>)}
                          <th>Décision</th><th>Rapport</th>
                          {activeTab === 'recrutes' && <th>Actions</th>}
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedData.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="empty-state">
                          <div className="empty-state-icon"><i className="bi bi-inbox" /></div>
                          <p>Aucun candidat trouvé</p>
                        </td>
                      </tr>
                    ) : (
                      displayedData.map((postulant, idx) => {
                        const rangNum    = isShortlistTab ? getRangPostulant(postulant) : 0;
                        const isResetting = resettingId === postulant.id;
                        const isSavingRecr = savingRecruteId === postulant.id;

                        return (
                          <tr key={postulant.id} style={{ opacity: (isResetting || isSavingRecr) ? 0.5 : 1 }}>
                            <td>{idx + 1}</td>
                            <td><strong>{postulant.nom} {postulant.prenoms}</strong></td>

                            {/* ── Présélection ── */}
                            {activeTab === 'preselection' && (
                              <>
                                <td>{postulant.Genre}</td>
                                <td>{postulant.Pays_N}</td>
                                <td>{postulant.Pays_R}</td>
                                <td>{postulant.tel}</td>
                                <td>{postulant.email}</td>
                                <td>{postulant.Situation_M}</td>
                                <td>{postulant.Niveau}</td>
                                <td>
                                  {postulant.note_ia != null
                                    ? <span style={{ fontWeight: 700, color: postulant.note_ia >= 80 ? '#16a34a' : postulant.note_ia >= 60 ? '#0a78b5' : postulant.note_ia >= 40 ? '#d97706' : '#dc2626' }}>
                                        {postulant.note_ia}%
                                      </span>
                                    : <span style={{ color: '#9ca3af' }}>—</span>}
                                </td>
                                <td>
                                  {postulant.note_manuelle > 0
                                    ? <strong style={{ color: '#1a1a6e' }}>{postulant.note_manuelle}/100</strong>
                                    : <span style={{ color: '#9ca3af' }}>—</span>}
                                </td>
                                <td><DecisionBadge decision={postulant.decisions_notation || ''} /></td>
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                                    <button className="action-btn" onClick={() => handleOpenEvaluation(postulant)} disabled={isResetting}>
                                      {postulant.note_manuelle > 0 ? 'Modifier' : 'Évaluer'}
                                    </button>
                                    {postulant.decisions_notation === 'rejete' && (
                                      <BackButton postulant={postulant} onReset={handleReset} loading={isResetting} />
                                    )}
                                  </div>
                                </td>
                              </>
                            )}

                            {/* ── Entretiens ── */}
                            {activeTab === 'evaluation_technique' && (
                              <>
                                <td style={{ fontSize: 12, color: '#6b7280' }}>{postulant.email}</td>
                                <td>
                                  {grillePoste?.seuil_shortlist != null
                                    ? <span style={{ background: '#EBF2FF', color: '#2563EB', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{grillePoste.seuil_shortlist}%</span>
                                    : <span style={{ color: '#A8B0BF', fontSize: 12 }}>Non défini</span>}
                                </td>
                                <td>
                                  {postulant.note_tech_totale != null
                                    ? <strong>{postulant.note_tech_totale}/{postulant.note_tech_max ?? (grillePoste?.total_max ?? '?')}</strong>
                                    : <span style={{ color: '#9ca3af' }}>—</span>}
                                </td>
                                <td>
                                  {postulant.note_moyenne_entretien != null
                                    ? <span style={{ fontWeight: 700, color: postulant.note_moyenne_entretien >= (grillePoste?.seuil_shortlist ?? 80) ? '#16a34a' : postulant.note_moyenne_entretien >= 50 ? '#d97706' : '#dc2626' }}>
                                        {postulant.note_moyenne_entretien}%
                                      </span>
                                    : <span style={{ color: '#9ca3af' }}>—</span>}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  {postulant.nb_exam_notes > 0
                                    ? <span style={{ background: '#F0FDF4', color: '#065f46', borderRadius: 12, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                                        {postulant.nb_exam_notes} / {examinateursPoste?.length ?? '?'}
                                      </span>
                                    : <span style={{ color: '#9ca3af', fontSize: 12 }}>En attente</span>}
                                </td>
                                <td>
                                  <DecisionBadge decision={postulant.decisions_notation} />
                                </td>
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                                    {postulant.decisions_notation !== 'rejete_entretien' && (
                                      <button
                                        className="action-btn"
                                        onClick={() => handleOpenTechEvaluation(postulant)}
                                        disabled={isResetting || loadingEvalOpen}
                                        style={{ opacity: (!grillePoste || !examinateursPoste) ? 0.65 : 1 }}
                                      >
                                        {loadingEvalOpen && selectedTechPostulant?.id === postulant.id
                                          ? <><i className="bi bi-hourglass-split" /> Chargement…</>
                                          : <>{' '}{postulant.nb_exam_notes > 0 ? 'Voir / Modifier' : 'Évaluer'}</>
                                        }
                                      </button>
                                    )}
                                    <BackButton postulant={postulant} onReset={handleReset} loading={isResetting} />
                                  </div>
                                </td>
                              </>
                            )}

                            {/* ── Shortlist & Recrutés ── */}
                            {isShortlistTab && (() => {
                              const info = recruteInfoMap[postulant.id] || {};
                              return (
                                <>
                                  <td style={{ fontWeight: 600, textAlign: 'center' }}>
                                    {postulant.note_tech_totale || 0}/{postulant.note_tech_max || 100}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span style={{ fontWeight: 700, color: (postulant.note_tech_pct || 0) >= 80 ? '#28a745' : (postulant.note_tech_pct || 0) >= 60 ? '#f59e0b' : '#dc3545' }}>
                                      {postulant.note_tech_pct || 0}%
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span style={{ display: 'inline-block', background: '#FD8140', color: 'white', borderRadius: 20, padding: '3px 12px', fontWeight: 700, fontSize: 12, boxShadow: '0 2px 4px rgba(253,129,64,0.35)' }}>
                                      {toOrdinal(rangNum, postulant.Genre?.toLowerCase() === 'femme')}
                                    </span>
                                  </td>

                                  {/* Colonnes date / contrat (onglet Recrutés uniquement) */}
                                  {activeTab === 'recrutes' && (
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
                                  )}

                                  {/* Colonne Décision */}
                                  <td style={{ textAlign: 'center' }}>
                                    {activeTab === 'shortlist' ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                                          <button
                                            style={{ background: isSavingRecr ? '#9ca3af' : '#28a745', color: 'white', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: isSavingRecr ? 'not-allowed' : 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                            disabled={isResetting || isSavingRecr}
                                            onClick={() => handleRecruterPostulant(postulant)}
                                          >
                                            {isSavingRecr
                                              ? <><i className="bi bi-hourglass-split" /> Enregistrement…</>
                                              : 'Recruter'}
                                          </button>
                                          <button
                                            style={{ background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: isSavingRecr ? 'not-allowed' : 'pointer' }}
                                            disabled={isResetting || isSavingRecr}
                                            onClick={() => handleAnnulerShortlist(postulant)}
                                          >
                                            ✕ Retirer
                                          </button>
                                        </div>
                                        <BackButton postulant={postulant} onReset={handleReset} loading={isResetting || isSavingRecr} />
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                                        <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 12, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>Recruté</span>
                                        <BackButton postulant={postulant} onReset={handleReset} loading={isResetting} />
                                      </div>
                                    )}
                                  </td>

                                  {/* Colonne Rapport */}
                                  <td style={{ textAlign: 'center' }}>
                                    <button
                                      onClick={() => handleNavigateToRapport(postulant, rangNum)}
                                      style={{ background: '#FD8140', color: 'white', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                                    >
                                      Rapport
                                    </button>
                                  </td>

                                  {/* Colonne Actions (onglet Recrutés) */}
                                  {activeTab === 'recrutes' && (
                                    <td style={{ textAlign: 'center' }}>
                                      <button
                                        onClick={() => handleOpenRecruteModal(postulant)}
                                        disabled={isSavingRecr}
                                        style={{ background: isSavingRecr ? '#9ca3af' : '#1a1a6e', color: 'white', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600, fontSize: 12, cursor: isSavingRecr ? 'not-allowed' : 'pointer' }}
                                      >
                                        Modifier
                                      </button>
                                    </td>
                                  )}
                                </>
                              );
                            })()}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── Pagination présélection ── */}
            {!loading && activeTab === 'preselection' && totalPages > 1 && (
              <div className="notations-pagination">
                <span className="pagination-info">Page {currentPage} / {totalPages} — {total} candidat{total !== 1 ? 's' : ''}</span>
                <div className="pagination-controls">
                  <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>&laquo;</button>
                  <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>&lsaquo;</button>
                  <span className="page-current">{currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>&rsaquo;</button>
                  <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>&raquo;</button>
                </div>
              </div>
            )}

            {/* ── Pagination entretiens ── */}
            {!loadingEntretien && activeTab === 'evaluation_technique' && totalPagesEntretien > 1 && (
              <div className="notations-pagination">
                <span className="pagination-info">Page {currentPageEntretien} / {totalPagesEntretien} — {totalEntretien} candidat{totalEntretien !== 1 ? 's' : ''}</span>
                <div className="pagination-controls">
                  <button onClick={() => setCurrentPageEntretien(1)} disabled={currentPageEntretien === 1}>&laquo;</button>
                  <button onClick={() => setCurrentPageEntretien(p => p - 1)} disabled={currentPageEntretien === 1}>&lsaquo;</button>
                  <span className="page-current">{currentPageEntretien} / {totalPagesEntretien}</span>
                  <button onClick={() => setCurrentPageEntretien(p => p + 1)} disabled={currentPageEntretien === totalPagesEntretien}>&rsaquo;</button>
                  <button onClick={() => setCurrentPageEntretien(totalPagesEntretien)} disabled={currentPageEntretien === totalPagesEntretien}>&raquo;</button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* ══ MODAUX ══════════════════════════════════════════════════════════════ */}

      {showEvalModal && (
        <EvaluationModal
          postulant={selectedPostulant} posteTitle={posteTitle} seuil={seuilPoste}
          scores={scores} commentaireManuel={commentaireManuel} loadingEval={loadingEval}
          onScoreChange={handleScoreChange} onCommentaireChange={setCommentaireManuel}
          onSave={handleSaveEvaluation} onClose={handleEvalModalClose}
        />
      )}

      {showSeuilPosteModal && (
        <PreselectionSeuilModal
          titreOffre={posteTitle} seuilInitial={seuilPoste}
          onClose={handleSeuilPosteClose} onConfirm={handleSeuilPosteConfirm}
        />
      )}

      {showGrilleModal && (
        <TechEvaluationModal
          postulant={{ nom: '', prenoms: '', email: '', experience: '', Niveau: '', note_manuelle: 0 }}
          jobId={eventId} titreOffre={posteTitle}
          seuilPreselection={grillePoste?.seuil_shortlist ?? seuilPoste ?? 80}
          criteriaPoste={grillePoste?.criteria ?? null}
          examinateursPoste={examinateursPoste ?? []}
          forceStep="criteria"
          onClose={() => setShowGrilleModal(false)}
          onSave={async (data) => { await handleGrillePosteConfirm(data); setShowGrilleModal(false); }}
        />
      )}

      {showExamModal && (
        <TechEvaluationModal
          postulant={{ nom: '', prenoms: '', email: '', experience: '', Niveau: '', note_manuelle: 0 }}
          jobId={eventId} titreOffre={posteTitle}
          seuilPreselection={grillePoste?.seuil_shortlist ?? seuilPoste ?? 80}
          criteriaPoste={grillePoste?.criteria ?? [{ id: 1, title: 'Critère par défaut', questions: ['Question de base'] }]}
          examinateursPoste={examinateursPoste}
          forceStep="examinateurs"
          onClose={() => setShowExamModal(false)}
          onSave={handleExamPosteConfirm}
        />
      )}

      {showTechEval && selectedTechPostulant && (
        <TechEvaluationModal
          postulant={selectedTechPostulant} jobId={eventId} titreOffre={posteTitle}
          seuilPreselection={grillePoste?.seuil_shortlist ?? seuilPoste ?? 80}
          criteriaPoste={grillePoste?.criteria ?? null}
          examinateursPoste={examinateursPoste}
          onClose={handleTechEvalClose} onSave={handleTechEvalContinue}
        />
      )}

      {showExaminateurDashboard && evaluationEnCours && (
        <div className="modal-notation-overlay">
          <div className="modal-notation-box" style={{ maxWidth: '900px', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <ExaminateurDashboard
              evaluation={evaluationEnCours}
              onRefresh={() => setEvaluationEnCours({ ...evaluationEnCours })}
              onSelectExaminateur={handleSelectExaminateur}
            />
            <div className="modal-notation-actions" style={{ marginTop: 20, textAlign: 'right' }}>
              <button className="btn-modal-cancel" onClick={handleDashboardClose}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showExaminateurNotation && selectedExaminateur && evaluationEnCours && (
        <ExaminateurNotationModal
          examinateur={selectedExaminateur}
          evaluation={evaluationEnCours}
          onClose={handleExaminateurNotationClose}
          onSave={handleSaveExaminateurNotation}
        />
      )}

      {/* ── Modal infos recrutement (date prise de fonction + type contrat) ── */}
      {showRecruteModal && recruteModalPostulant && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowRecruteModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 12, padding: '28px 32px', minWidth: 380, maxWidth: 460, width: '90%', boxShadow: '0 8px 40px rgba(26,26,110,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1a1a6e', fontSize: 16, fontWeight: 700 }}>Modifier les informations</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: 13 }}>
                    {recruteModalPostulant.nom} {recruteModalPostulant.prenoms}
                  </p>
                </div>
                <button
                  onClick={() => setShowRecruteModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: 20, color: '#9ca3af', cursor: 'pointer', lineHeight: 1 }}
                >✕</button>
              </div>
              <div style={{ height: 2, background: 'linear-gradient(90deg, #1a1a6e, #FD8140)', borderRadius: 2, marginTop: 14 }} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Date de prise de fonction
              </label>
              <input
                type="date"
                value={recruteFormData.datePriseFonction}
                onChange={e => setRecruteFormData(prev => ({ ...prev, datePriseFonction: e.target.value }))}
                style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Type de contrat
              </label>
              <select
                value={recruteFormData.typeContrat}
                onChange={e => setRecruteFormData(prev => ({ ...prev, typeContrat: e.target.value }))}
                style={{ width: '100%', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fff', cursor: 'pointer' }}
              >
                <option value="">— Sélectionner —</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Stage">Stage</option>
                <option value="Intérim">Intérim</option>
                <option value="Freelance">Freelance / Consultant</option>
                <option value="Alternance">Alternance</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRecruteModal(false)}
                disabled={savingRecrutement}
                style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveRecruteInfo}
                disabled={savingRecrutement || (!recruteFormData.datePriseFonction && !recruteFormData.typeContrat)}
                style={{
                  background: savingRecrutement || (!recruteFormData.datePriseFonction && !recruteFormData.typeContrat) ? '#9ca3af' : '#1a1a6e',
                  color: 'white', border: 'none', borderRadius: 8, padding: '9px 24px',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                {savingRecrutement
                  ? <><i className="bi bi-hourglass-split" /> Enregistrement…</>
                  : '✓ Enregistrer'}
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
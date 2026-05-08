// TechEvaluationModal.jsx — Version optimisée
// La grille et les examinateurs sont configurés UNE FOIS par poste.
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import ExaminateurModal from './ExaminateurModal';
import './css/Postulantsnotations.css';

const PERCENTAGES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/**
 * Props :
 *  - postulant         : objet candidat
 *  - jobId / titreOffre
 *  - seuilPreselection : number (seuil du poste, déjà défini)
 *  - criteriaPoste     : array|null — grille déjà configurée pour ce poste
 *  - examinateursPoste : array|null — examinateurs déjà configurés pour ce poste
 *  - onClose / onSave
 */
const TechEvaluationModal = ({
  postulant, jobId, titreOffre, seuilPreselection,
  criteriaPoste, examinateursPoste,
  onClose, onSave,
}) => {
  const DEFAULT_CRITERIA = [
    { id: 1, title: "1. Evaluation générale du candidat",
      questions: ["Présentation générale du candidat (élocution et pertinence du discours).", "Motivation du candidat."] },
    { id: 2, title: "2. Capacités techniques et professionnelles",
      questions: ["BAC +5 en gestion, en finance, en contrôle de gestion, en comptabilité ou équivalent.",
        "Capacité à produire des reportings fiables, interpréter les résultats et fournir des analyses pertinentes pour la prise de décision.",
        "Niveau de compétence sur ERP, Excel avancé, tableaux de bord, outils de simulation et d'analyse des données.",
        "Connaissance du système fiscal et comptable."] },
    { id: 3, title: "3. Connaissance du métier, de ses contraintes et des compétences",
      questions: ["Capacité à mettre en place et suivre des indicateurs de performance (KPI).",
        "Capacité à travailler sur des projets multi-secteurs.", "Connaissance du cadre fiscal et comptable sous-régional.",
        "Capacité à gérer simultanément plusieurs projets.", "Compréhension des enjeux et transition énergétique.",
        "Maîtrise des imputations analytiques, calcul des coûts et suivi de la rentabilité par projet.",
        "Capacité à respecter la confidentialité et à travailler en toute transparence.", "Expérience en management d'équipe."] },
  ];

  const grilleDuPoste = criteriaPoste && criteriaPoste.length > 0 ? criteriaPoste : null;

  // Détermination de l'étape initiale
  const initialStep = grilleDuPoste
    ? (examinateursPoste && examinateursPoste.length > 0 ? 'select_exam' : 'examinateurs')
    : 'criteria';

  const [step, setStep]                       = useState(initialStep);
  const [criteria, setCriteria]               = useState(grilleDuPoste || DEFAULT_CRITERIA);
  const [newCriterionTitle, setNewCriterionTitle] = useState('');
  const [seuilShortlist, setSeuilShortlist]   = useState(seuilPreselection || 80);
  const [selectedExam, setSelectedExam]       = useState(null);

  const showWarning = (msg) => Swal.fire({ title: 'Attention', text: msg, icon: 'warning', confirmButtonColor: '#f59e0b', allowOutsideClick: false });
  const showSuccess = (msg, timer = 1500) => Swal.fire({ title: 'Succès', text: msg, icon: 'success', timer, showConfirmButton: false, allowOutsideClick: false });
  const showConfirm = async (title, html, okText, cancelText) => {
    const r = await Swal.fire({ title, html, icon: 'question', showCancelButton: true,
      confirmButtonColor: '#28a745', cancelButtonColor: '#6b7280',
      confirmButtonText: okText, cancelButtonText: cancelText, allowOutsideClick: false });
    return r.isConfirmed;
  };

  const updateCriterionTitle = (cId, v) => setCriteria(prev => prev.map(c => c.id === cId ? { ...c, title: v } : c));
  const removeCriterion = async (cId, title) => {
    if (await showConfirm('Supprimer le critère', `Supprimer "<strong>${title}</strong>" et toutes ses questions ?`, 'Oui, supprimer', 'Annuler'))
      setCriteria(prev => prev.filter(c => c.id !== cId));
  };
  const addCriterion = () => {
    if (!newCriterionTitle.trim()) { showWarning('Veuillez saisir un titre pour le critère'); return; }
    const nextId = criteria.length ? Math.max(...criteria.map(c => c.id)) + 1 : 1;
    setCriteria(prev => [...prev, { id: nextId, title: newCriterionTitle.trim(), questions: [] }]);
    setNewCriterionTitle(''); showSuccess('Nouveau critère ajouté');
  };
  const addQuestion = (cId) => setCriteria(prev => prev.map(c => c.id === cId ? { ...c, questions: [...c.questions, ''] } : c));
  const updateQuestion = (cId, qIdx, v) => setCriteria(prev => prev.map(c =>
    c.id === cId ? { ...c, questions: c.questions.map((q, i) => i === qIdx ? v : q) } : c));
  const removeQuestion = async (cId, qIdx, txt) => {
    if (!txt.trim()) { setCriteria(prev => prev.map(c => c.id === cId ? { ...c, questions: c.questions.filter((_, i) => i !== qIdx) } : c)); return; }
    if (await showConfirm('Supprimer la question', 'Voulez-vous vraiment supprimer cette question ?', 'Oui, supprimer', 'Annuler'))
      setCriteria(prev => prev.map(c => c.id === cId ? { ...c, questions: c.questions.filter((_, i) => i !== qIdx) } : c));
  };

  const totalQuestions = criteria.reduce((acc, c) => acc + c.questions.length, 0);
  const totalMax = totalQuestions * 5;
  const seuilPoints = Math.round(totalMax * (seuilShortlist / 100));

  const handleClose = async () => {
    if (step === 'criteria') {
      if (await showConfirm('Quitter', 'Les modifications non enregistrées seront perdues.', 'Oui, quitter', 'Annuler')) onClose();
    } else onClose();
  };

  const handleCriteriaValidated = async () => {
    const criteriaVides = criteria.filter(c => c.questions.length === 0);
    if (criteria.length === 0) { showWarning('Ajoutez au moins un critère avant de continuer'); return; }
    if (criteriaVides.length > 0) {
      await Swal.fire({ title: 'Critères sans questions',
        html: `<p>Le critère "<strong>${criteriaVides[0].title}</strong>" n'a aucune question.<br>Ajoutez au moins une question à chaque critère.</p>`,
        icon: 'warning', confirmButtonColor: '#f59e0b', allowOutsideClick: false }); return;
    }
    let hasEmpty = false;
    criteria.forEach(c => c.questions.forEach(q => { if (!q.trim()) hasEmpty = true; }));
    if (hasEmpty) { showWarning('Veuillez remplir toutes les questions vides avant de continuer'); return; }
    if (await showConfirm('Valider les critères',
      `<div style="text-align:center">
        <p><strong>${criteria.length}</strong> critère(s) · <strong>${totalQuestions}</strong> question(s)</p>
        <p>Note maximale : <strong>${totalMax} pts</strong></p>
        <p style="color:#059669">Seuil Shortlist : <strong>${seuilPoints} pts (${seuilShortlist}%)</strong></p>
        <p style="margin-top:12px">Cette grille sera utilisée pour <strong>tous les candidats</strong> de ce poste.</p>
      </div>`,
      'Continuer vers les examinateurs', 'Modifier les critères')) setStep('examinateurs');
  };

  const handleExaminateursValidated = (examinateursList) => {
    onSave({ criteria, examinateurs: examinateursList, totalQuestions, totalMax, seuilShortlist });
  };

  /* ── ÉTAPE : sélection de l'examinateur (grille + examinateurs déjà configurés) ── */
  if (step === 'select_exam') {
    return (
      <div className="modal-notation-overlay" onClick={onClose}>
        <div className="modal-notation-box" onClick={e => e.stopPropagation()}
          style={{ maxWidth: 520, padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 17, color: '#1a1a6e' }}>
                Notation — {postulant.nom} {postulant.prenoms}
              </h4>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0 0' }}>{postulant.email}</p>
              {titreOffre && (
                <span style={{ display: 'inline-block', marginTop: 6, background: '#FFF3EC', color: '#FD8140',
                  borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>
                  {titreOffre}
                </span>
              )}
            </div>
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', fontSize: 20, color: '#9ca3af', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ height: 2, background: 'linear-gradient(90deg, #1a1a6e, #FD8140)', borderRadius: 2, marginBottom: 20 }} />

          <p style={{ fontWeight: 600, color: '#374151', marginBottom: 14, fontSize: 14 }}>
            Choisissez l'examinateur qui va noter ce candidat :
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {examinateursPoste.map(exam => (
              <button key={exam.id} onClick={() => setSelectedExam(exam)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  border: selectedExam?.id === exam.id ? '2px solid #2563EB' : '2px solid #E5E7EB',
                  borderRadius: 10,
                  background: selectedExam?.id === exam.id ? '#EBF2FF' : '#fff',
                  cursor: 'pointer', transition: 'all .15s', textAlign: 'left',
                }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%',
                  background: selectedExam?.id === exam.id ? '#2563EB' : '#E5E7EB',
                  color: selectedExam?.id === exam.id ? '#fff' : '#6b7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {exam.nom?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: 14 }}>{exam.nom}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {exam.email} · <span style={{ textTransform: 'capitalize' }}>{exam.role}</span>
                  </div>
                </div>
                {selectedExam?.id === exam.id && (
                  <div style={{ marginLeft: 'auto', color: '#2563EB', fontSize: 18 }}>✓</div>
                )}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose}
              style={{ background: '#f3f4f6', color: '#374151', border: 'none',
                borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Annuler
            </button>
            <button
              onClick={() => {
                if (!selectedExam) { showWarning('Veuillez sélectionner un examinateur'); return; }
                const crit = criteriaPoste || [];
                const tq   = crit.reduce((a, c) => a + c.questions.length, 0);
                onSave({ criteria: crit, examinateurs: [selectedExam], totalQuestions: tq,
                  totalMax: tq * 5, seuilShortlist: seuilPreselection || 80, fromPosteConfig: true });
              }}
              disabled={!selectedExam}
              style={{ background: selectedExam ? '#1a1a6e' : '#9ca3af', color: 'white', border: 'none',
                borderRadius: 8, padding: '9px 24px', fontSize: 13, fontWeight: 700,
                cursor: selectedExam ? 'pointer' : 'not-allowed',
                boxShadow: selectedExam ? '0 2px 8px rgba(26,26,110,0.25)' : 'none', transition: 'all .2s' }}>
              ✍️ Noter ce candidat
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── ÉTAPE : création de la grille ── */
  if (step === 'criteria') {
    return (
      <div className="modal-notation-overlay" onClick={handleClose}>
        <div className="modal-notation-box" onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '820px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px 0 24px', flexShrink: 0 }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h4 style={{ margin: 0, fontSize: '18px' }}>
                  Grille de notation — <span style={{ color: '#FD8140' }}>{titreOffre}</span>
                </h4>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0' }}>
                  Cette grille sera utilisée pour <strong>tous les candidats</strong> de ce poste.
                </p>
              </div>
              {postulant.note_manuelle >= 70 && (
                <div className="text-center p-2 rounded text-white" style={{ backgroundColor: '#28a745', minWidth: '80px' }}>
                  <div className="fw-bold fs-5">{postulant.note_manuelle}</div>
                  <div style={{ fontSize: '0.7rem' }}>/ 100</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
              {titreOffre && (
                <div className="p-2 rounded" style={{ backgroundColor: '#fff3ec', flex: '1 1 auto' }}>
                  <p className="text-uppercase fw-semibold small mb-0" style={{ color: '#FD8140' }}>{titreOffre}</p>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F0FDF4',
                border: '1px solid #BBF7D0', borderRadius: '8px', padding: '8px 12px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', color: '#065F46', fontWeight: 600 }}>Seuil Shortlist :</span>
                <select value={seuilShortlist} onChange={(e) => setSeuilShortlist(Number(e.target.value))}
                  style={{ border: '1px solid #A7F3D0', borderRadius: '6px', padding: '3px 8px',
                    fontSize: '13px', fontWeight: '700', color: '#059669', background: '#fff', cursor: 'pointer' }}>
                  {PERCENTAGES.map(p => <option key={p} value={p}>{p}%</option>)}
                </select>
                <span style={{ fontSize: '11px', color: '#6B7280' }}>
                  (≥ {seuilPoints} pts / {totalMax > 0 ? totalMax : '—'})
                </span>
              </div>
            </div>
            <hr style={{ margin: '12px 0' }} />
            <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
              <span>
                <strong>{criteria.length}</strong> critère(s) &nbsp;·&nbsp;
                <strong>{totalQuestions}</strong> question(s) &nbsp;·&nbsp;
                Note max : <strong>{totalMax} pts</strong>
                &nbsp;|&nbsp; Seuil : <strong>{totalMax > 0 ? seuilPoints : '—'} pts ({seuilShortlist}%)</strong>
              </span>
            </div>
            <div className="bg-white shadow-sm rounded border p-3 mb-4">
              <table className="table table-bordered table-sm mb-0 text-center" style={{ fontSize: '0.85rem' }}>
                <thead className="table-light">
                  <tr>
                    <th className="text-start">Degré d'appréciation selon les critères spécifiques du poste</th>
                    <th>Insuffisant</th><th>Faible</th><th>Moyen</th><th>Bon</th><th>Très bon</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="fw-bold text-start">Note</td>
                    <td className="fw-bold">1</td><td className="fw-bold">2</td>
                    <td className="fw-bold">3</td><td className="fw-bold">4</td><td className="fw-bold">5</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '0 24px' }}>
            {criteria.map((criterion, cIdx) => (
              <div key={criterion.id} className="bg-white shadow-sm rounded border mb-4 overflow-hidden">
                <div className="d-flex align-items-center gap-2 p-3"
                  style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #dee2e6' }}>
                  <span className="fw-bold text-muted small me-1">#{cIdx + 1}</span>
                  <input type="text" className="form-control form-control-sm fw-bold"
                    value={criterion.title} onChange={(e) => updateCriterionTitle(criterion.id, e.target.value)}
                    style={{ fontSize: '0.95rem' }} />
                  <span className="badge bg-secondary flex-shrink-0">{criterion.questions.length} q.</span>
                  <button className="btn btn-sm btn-outline-danger flex-shrink-0"
                    onClick={() => removeCriterion(criterion.id, criterion.title)}>✕</button>
                </div>
                <div className="p-3">
                  {criterion.questions.length === 0 && (
                    <p className="text-warning small fst-italic mb-2">Aucune question. Cliquez sur « + Ajouter une question »</p>
                  )}
                  {criterion.questions.map((q, qIdx) => (
                    <div key={qIdx} className="d-flex align-items-start gap-2 mb-2">
                      <span className="text-muted small mt-2" style={{ minWidth: '20px' }}>▪</span>
                      <input type="text" className="form-control form-control-sm"
                        value={q} placeholder="Saisir le sous-critère..."
                        onChange={(e) => updateQuestion(criterion.id, qIdx, e.target.value)} />
                      <button className="btn btn-sm btn-outline-danger flex-shrink-0"
                        onClick={() => removeQuestion(criterion.id, qIdx, q)}>✕</button>
                    </div>
                  ))}
                  <button className="btn btn-sm btn-outline-primary mt-1"
                    onClick={() => addQuestion(criterion.id)}>+ Ajouter une question</button>
                </div>
              </div>
            ))}
            <div className="bg-white shadow-sm rounded border p-3 mb-4">
              <p className="fw-semibold mb-2 small text-uppercase text-muted">Ajouter un nouveau critère</p>
              <div className="d-flex gap-2">
                <input type="text" className="form-control form-control-sm"
                  placeholder="Ex : 4. Compétences comportementales"
                  value={newCriterionTitle} onChange={(e) => setNewCriterionTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCriterion()} />
                <button className="btn btn-sm text-white flex-shrink-0"
                  style={{ backgroundColor: '#FD8140' }} onClick={addCriterion}>+ Ajouter</button>
              </div>
            </div>
          </div>
          <div className="modal-notation-actions"
            style={{ padding: '16px 24px 24px 24px', flexShrink: 0, borderTop: '1px solid #E5E7EB', background: 'white' }}>
            <button className="btn-modal-cancel" onClick={handleClose}>Annuler</button>
            <button className="btn-modal-save" onClick={handleCriteriaValidated}>
              Continuer ({totalQuestions} questions) →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── ÉTAPE : création des examinateurs ── */
  return (
    <ExaminateurModal postulant={postulant} onClose={onClose} onSave={handleExaminateursValidated} />
  );
};

export default TechEvaluationModal;
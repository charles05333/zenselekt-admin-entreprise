// ExaminateurNotationModal.jsx — Corrigé : rechargement des scores existants à l'ouverture
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import './css/ExaminateurNotationModal.css';

const ExaminateurNotationModal = ({ examinateur, evaluation, onClose, onSave }) => {
  const criteria = evaluation.criteria;

  /* ─────────────────────────────────────────────────────────────────────────
     INITIALISATION DES SCORES EXISTANTS
     Si l'examinateur a déjà noté (présent dans notes_examinateurs ou scores
     stockés dans evaluation.notes_examinateurs[examinateur.id].scores),
     on pré-remplit le state pour permettre la modification.
  ───────────────────────────────────────────────────────────────────────── */
  const existingNote = evaluation?.notes_examinateurs?.[examinateur.id] ?? null;

  const initScores = () => {
    if (existingNote?.scores && typeof existingNote.scores === 'object') {
      return existingNote.scores;
    }
    return {};
  };

  const [scores, setScores]           = useState(initScores);
  const [commentaire, setCommentaire] = useState(existingNote?.commentaire ?? '');

  /* ────────────────────────────────────────────────────────── */

  const totalQuestions = criteria.reduce((acc, c) => acc + c.questions.length, 0);
  const totalMax       = totalQuestions * 5;

  const setScore = (cId, qIdx, note) => {
    setScores(prev => ({
      ...prev,
      [cId]: { ...(prev[cId] || {}), [qIdx]: note },
    }));
  };

  const getScore = (cId, qIdx) => scores?.[cId]?.[qIdx] || null;

  const totalObtained = Object.values(scores).reduce(
    (acc, qMap) => acc + Object.values(qMap).reduce((a, v) => a + v, 0), 0
  );

  const pourcentage   = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
  const resultatAuto  = pourcentage >= (evaluation?.seuilValidation ?? 80) ? 'recrute' : 'rejete';
  const notesRemplies = Object.values(scores).reduce(
    (acc, qMap) => acc + Object.values(qMap).filter(v => v > 0).length, 0
  );
  const isComplete = notesRemplies === totalQuestions;

  /* ─── Alertes ─── */
  const showConfirmAlert = async (title, message, confirmText, cancelText) => {
    const result = await Swal.fire({
      title, html: message, icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745', cancelButtonColor: '#6b7280',
      confirmButtonText: confirmText, cancelButtonText: cancelText,
      allowOutsideClick: false,
    });
    return result.isConfirmed;
  };

  /* ─── Fermeture ─── */
  const handleClose = async () => {
    if (!isComplete) {
      const result = await Swal.fire({
        title: 'Notation incomplète',
        html: `<div style="text-align:center">
          <p>Vous avez noté <strong>${notesRemplies}/${totalQuestions}</strong> questions.</p>
          <p>Veuillez noter toutes les questions avant de fermer.</p>
        </div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#28a745', cancelButtonColor: '#6b7280',
        confirmButtonText: 'Continuer la notation',
        cancelButtonText: 'Fermer quand même',
        allowOutsideClick: false,
      });
      if (!result.isConfirmed) onClose();
      return;
    }
    onClose();
  };

  /* ─── Sauvegarde ─── */
  const handleSave = async () => {
    if (!isComplete) {
      await Swal.fire({
        title: 'Notation incomplète',
        html: `<div style="text-align:center">
          <p>Vous avez noté <strong>${notesRemplies}/${totalQuestions}</strong> questions.</p>
          <p>Veuillez noter toutes les questions avant d'enregistrer.</p>
        </div>`,
        icon: 'warning',
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'Continuer la notation',
        allowOutsideClick: false,
      });
      return;
    }

    const isModification = existingNote !== null;
    const confirmed = await showConfirmAlert(
      isModification ? 'Modifier la notation' : 'Confirmation',
      `<div style="text-align:center">
        <p style="font-size:1.2rem">Score : <strong>${pourcentage}%</strong></p>
        <p>${resultatAuto === 'recrute' ? 'Ce candidat sera recommandé' : 'Ce candidat ne sera pas retenu'}</p>
        <p style="font-size:12px;color:#6b7280;margin-top:10px">
          ${isModification ? 'Voulez-vous mettre à jour cette notation ?' : 'Souhaitez-vous enregistrer cette notation ?'}
        </p>
      </div>`,
      isModification ? 'Oui, modifier' : 'Oui, enregistrer',
      'Annuler',
    );

    if (confirmed) {
      onSave({
        examinateurId: examinateur.id,
        scores,
        commentaire,
        total:       totalObtained,
        max:         totalMax,
        pourcentage,
        resultat:    resultatAuto,
      });
      Swal.fire({
        title: isModification ? '✅ Notation mise à jour !' : '✅ Notation enregistrée !',
        icon: 'success', timer: 1500, showConfirmButton: false, allowOutsideClick: false,
      });
    }
  };

  /* ─── Rendu ─── */
  return (
    <div className="notation-modal-overlay" onClick={handleClose}>
      <div className="notation-modal-container" onClick={e => e.stopPropagation()}>

        {/* En-tête */}
        <div className="notation-modal-header">
          <div>
            <h2>
              {existingNote ? 'Modifier la notation — ' : 'Notation par : '}
              {examinateur.nom}
            </h2>
            <p>{examinateur.email} · Rôle : {examinateur.role}</p>
            <p className="candidat-name">
              Candidat : {evaluation.candidat.nom} {evaluation.candidat.prenoms}
            </p>
          </div>
          <div className="header-actions">
            <div className={`progress-indicator ${isComplete ? 'complete' : 'incomplete'}`}>
              {notesRemplies}/{totalQuestions} notées
            </div>
            <button className="close-btn" onClick={handleClose} title="Fermer">✕</button>
          </div>
        </div>

        {/* Bannière modification */}
        {existingNote && (
          <div style={{
            background: '#EBF2FF', borderLeft: '4px solid #2563EB',
            padding: '10px 16px', marginBottom: 12, borderRadius: '0 8px 8px 0',
            fontSize: 13, color: '#1d4ed8', fontWeight: 600,
          }}>
            ✏️ Mode modification — Les notes précédentes ont été rechargées.
          </div>
        )}

        {/* Avertissement si incomplet */}
        {!isComplete && (
          <div className="warning-banner">
            Veuillez noter toutes les questions ({notesRemplies}/{totalQuestions}) avant d'enregistrer.
          </div>
        )}

        {/* Score temps réel */}
        <div className={`score-card ${pourcentage >= (evaluation?.seuilValidation ?? 80) ? 'score-success' : pourcentage >= 50 ? 'score-warning' : 'score-danger'}`}>
          <div>
            <span className="score-label">Score en cours</span>
            <small>{notesRemplies}/{totalQuestions} questions notées</small>
          </div>
          <div className="score-value">
            <span className="value">{totalObtained}/{totalMax}</span>
            <span className="percentage">{pourcentage}%</span>
          </div>
        </div>

        {/* Légende */}
        <div className="legend-table-wrapper">
          <table className="legend-table">
            <thead>
              <tr>
                <th>Degré d'appréciation selon les critères spécifiques du poste</th>
                <th>Insuffisant</th><th>Faible</th><th>Moyen</th><th>Bon</th><th>Très bon</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="note-label">Note</td>
                <td>1</td><td>2</td><td>3</td><td>4</td><td>5</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Grille d'évaluation */}
        <div className="eval-table-wrapper">
          <table className="eval-table">
            <thead>
              <tr>
                <th>Critères d'évaluation</th>
                <th colSpan={5}>Côte de performance</th>
              </tr>
              <tr>
                <th></th>
                {[1, 2, 3, 4, 5].map(n => (
                  <th key={n} className="note-header">{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map(criterion => (
                <React.Fragment key={criterion.id}>
                  <tr className="category-row">
                    <td colSpan={6} className="category-title">{criterion.title}</td>
                  </tr>
                  {criterion.questions.map((q, qIdx) => (
                    <tr key={qIdx} className="question-row">
                      <td className="question-text">
                        <span className="bullet">-</span> {q}
                      </td>
                      {[1, 2, 3, 4, 5].map(note => (
                        <td key={note} className="note-cell">
                          <button
                            className={`note-dot ${getScore(criterion.id, qIdx) === note ? 'active' : ''}`}
                            onClick={() => setScore(criterion.id, qIdx, note)}
                          >
                            {getScore(criterion.id, qIdx) === note ? '✕' : '·'}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              <tr className="total-row">
                <td className="total-label">Total / {totalMax}</td>
                <td colSpan={5} className="total-value">
                  {totalObtained} / {totalMax} ({pourcentage}%)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Commentaires */}
        <div className="commentaire-section">
          <label>Commentaires / Observations</label>
          <textarea
            rows="3"
            placeholder="Observations sur le candidat..."
            value={commentaire}
            onChange={e => setCommentaire(e.target.value)}
          />
        </div>

        {/* Décision automatique */}
        <div className="decision-section">
          <label>Décision automatique :</label>
          <span className={`decision-badge ${resultatAuto === 'recrute' ? 'success' : totalObtained > 0 ? 'danger' : 'warning'}`}>
            {totalObtained === 0
              ? "En attente de notation"
              : resultatAuto === 'recrute'
                ? 'Admis en Shortlist'
                : 'Rejeté'}
          </span>
        </div>

        {/* Boutons */}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={handleClose}>Annuler</button>
          <button className="btn-save" onClick={handleSave} disabled={!isComplete}>
            {existingNote ? 'Modifier la notation' : 'Enregistrer la notation'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExaminateurNotationModal;
// EvalGrid.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './css/EvalGrid.css';

const EvalGrid = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const candidate = state?.candidat;
  const criteria = state?.criteria || [];
  const jobId = state?.jobId;
  const titreOffre = state?.titreOffre;
  const examinateurId = state?.examinateurId;
  const examinateurNom = state?.examinateurNom;

  const [scores, setScores] = useState({});
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const setScore = (cId, qIdx, note) => {
    setScores(prev => ({
      ...prev,
      [cId]: { ...(prev[cId] || {}), [qIdx]: note }
    }));
  };

  const getScore = (cId, qIdx) => scores?.[cId]?.[qIdx] || null;

  const totalQuestions = criteria.reduce((acc, c) => acc + c.questions.length, 0);
  const totalMax = totalQuestions * 5;

  const totalObtained = Object.values(scores).reduce((acc, qMap) =>
    acc + Object.values(qMap).reduce((a, v) => a + v, 0), 0
  );

  const pourcentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
  const resultatAuto = pourcentage >= 80 ? 'recrute' : 'rejete';

  const notesRemplies = Object.values(scores).reduce((acc, qMap) =>
    acc + Object.values(qMap).filter(v => v > 0).length, 0
  );

  const handleBack = () => navigate(-1);

  // Vérifier si des modifications ont été faites
  const hasUnsavedChanges = () => {
    return notesRemplies > 0 || commentaire.trim() !== '';
  };

  // Fonction de fermeture avec confirmation
  const handleCloseWithConfirm = async (callback) => {
    if (hasUnsavedChanges()) {
      const result = await Swal.fire({
        title: 'Quitter sans enregistrer ?',
        text: 'Toutes les données non enregistrées seront perdues.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DC2626',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Oui, quitter',
        cancelButtonText: 'Non, rester',
        reverseButtons: true,
      });
      if (result.isConfirmed && callback) {
        callback();
      }
    } else if (callback) {
      callback();
    }
  };

  const handleSave = async () => {
    if (!candidate?.id) {
      setMessage({ type: 'danger', text: '❌ ID candidat introuvable' });
      return;
    }

    if (notesRemplies < totalQuestions) {
      setMessage({
        type: 'warning',
        text: `⚠️ Veuillez noter toutes les questions (${notesRemplies}/${totalQuestions} notées)`
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (resultatAuto === 'recrute') {
        await Swal.fire({
          title: '✅ Candidat admis en Shortlist !',
          html: `
            <div style="font-size:1rem; margin-top:8px;">
              <p><strong>${candidate.nom} ${candidate.prenoms || ''}</strong></p>
              <p style="font-size:2.2rem; font-weight:bold; color:#28a745; margin:8px 0;">
                ${totalObtained} <span style="font-size:1rem; color:#777;">/ ${totalMax}</span>
              </p>
              <p>Score : <strong>${pourcentage}%</strong> — ✅ Passage en Shortlist</p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745',
        });
      } else {
        await Swal.fire({
          title: 'Candidat rejeté',
          html: `
            <div style="font-size:1rem; margin-top:8px;">
              <p><strong>${candidate.nom} ${candidate.prenoms || ''}</strong></p>
              <p style="font-size:2.2rem; font-weight:bold; color:#dc3545; margin:8px 0;">
                ${totalObtained} <span style="font-size:1rem; color:#777;">/ ${totalMax}</span>
              </p>
              <p>Score : <strong>${pourcentage}%</strong> — Candidat rejeté</p>
            </div>
          `,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545',
        });
      }

      navigate(`/postulants-notation/${jobId}?poste=${encodeURIComponent(titreOffre || '')}`);

    } catch (err) {
      setMessage({ type: 'danger', text: `❌ Erreur : ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  if (!candidate) {
    return (
      <div className="eval-grid-container">
        <div className="eval-grid-error">
          <p className="text-danger fw-bold">Aucun candidat sélectionné.</p>
          <button className="btn-back" onClick={() => navigate(-1)}>Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="eval-grid-container">
      <div className="eval-grid-wrapper">

        <div className="eval-header">
          <div>
            <h2>Notation Technique : {candidate.nom} {candidate.prenoms || ''}</h2>
            <p className="text-muted">{candidate.email}</p>
            {examinateurNom && (
              <div className="examinateur-badge">
                👤 Notation par : {examinateurNom}
              </div>
            )}
            {titreOffre && (
              <div className="offre-badge">
                {titreOffre}
              </div>
            )}
          </div>
          <button className="btn-modify" onClick={() => handleCloseWithConfirm(handleBack)}>
            ← Modifier les critères
          </button>
        </div>

        <div className={`score-card ${pourcentage >= 80 ? 'score-success' : pourcentage >= 50 ? 'score-warning' : 'score-danger'}`}>
          <div>
            <span className="score-label">Score en cours</span>
            <small>
              {notesRemplies < totalQuestions
                ? `${notesRemplies}/${totalQuestions} questions notées`
                : pourcentage >= 80
                  ? 'Ce candidat sera admis en Shortlist'
                  : 'Ce candidat sera rejeté (seuil : 80%)'
              }
            </small>
          </div>
          <div className="score-value">
            <span className="value">{totalObtained}/{totalMax}</span>
            <span className="percentage">{pourcentage}%</span>
          </div>
        </div>

        {message && (
          <div className={`alert-message alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="legend-table-wrapper">
          <table className="legend-table">
            <thead>
              <tr>
                <th>Degré d'appréciation selon les critères spécifiques du poste</th>
                <th>Insuffisant</th>
                <th>Faible</th>
                <th>Moyen</th>
                <th>Bon</th>
                <th>Très bon</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="fw-bold">Note</td>
                <td className="fw-bold">1</td>
                <td className="fw-bold">2</td>
                <td className="fw-bold">3</td>
                <td className="fw-bold">4</td>
                <td className="fw-bold">5</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="eval-grid-table-wrapper">
          <table className="eval-grid-table">
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
              {criteria.map((criterion) => (
                <React.Fragment key={criterion.id}>
                  <tr className="category-row">
                    <td colSpan={6} className="category-title">
                      {criterion.title}
                    </td>
                  </tr>
                  {criterion.questions.map((q, qIdx) => (
                    <tr key={qIdx} className="question-row">
                      <td className="question-text">
                        <span className="bullet">▪</span> {q}
                      </td>
                      {[1, 2, 3, 4, 5].map(note => (
                        <td key={note} className="note-cell">
                          <button
                            className={`note-btn ${getScore(criterion.id, qIdx) === note ? 'active' : ''}`}
                            onClick={() => setScore(criterion.id, qIdx, note)}
                          >
                            {getScore(criterion.id, qIdx) === note ? '✓' : note}
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

        <div className="commentaire-section">
          <label>Commentaires / Observations</label>
          <textarea
            rows="4"
            placeholder="Observations sur le candidat..."
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />
        </div>

        <div className="decision-section">
          <label>Décision automatique :</label>
          <span className={`decision-badge ${resultatAuto === 'recrute' ? 'success' : totalObtained > 0 ? 'danger' : 'warning'}`}>
            {totalObtained === 0
              ? 'En attente de notation'
              : resultatAuto === 'recrute'
                ? 'Admis en Shortlist'
                : 'Rejeté'
            }
          </span>
        </div>

        <div className="eval-actions">
          <button className="btn-cancel" onClick={() => handleCloseWithConfirm(handleBack)}>
            Annuler
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={loading || totalObtained === 0}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer l\'évaluation'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EvalGrid;
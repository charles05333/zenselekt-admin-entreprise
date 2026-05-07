// PreselectionSeuilModal.jsx
import React, { useState } from 'react';
import './css/PreselectionSeuilModal.css';

const PERCENTAGES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const PreselectionSeuilModal = ({ postulant, titreOffre, onClose, onConfirm }) => {
  const [selectedSeuil, setSelectedSeuil] = useState(null);

  const handleConfirm = () => {
    if (!selectedSeuil) return;
    onConfirm(selectedSeuil);
  };

  const getSeuilDescription = (seuil) => {
    if (!seuil) return null;
    if (seuil <= 30) return { label: 'Seuil bas', color: 'warn', desc: 'La plupart des candidats passeront cette étape.' };
    if (seuil <= 60) return { label: 'Seuil modéré', color: 'info', desc: 'Niveau standard pour une sélection équilibrée.' };
    if (seuil <= 80) return { label: 'Seuil élevé', color: 'ok', desc: 'Niveau recommandé pour des postes exigeants.' };
    return { label: 'Seuil très élevé', color: 'danger', desc: 'Seuls les candidats excellents passeront.' };
  };

  const info = selectedSeuil ? getSeuilDescription(selectedSeuil) : null;

  return (
    <div className="psm-overlay" onClick={onClose}>
      <div className="psm-box" onClick={(e) => e.stopPropagation()}>

        <div className="psm-header">
          <div className="psm-header-left">
           
            <div>
              <h3>Seuil de présélection</h3>
              <p>Quel score minimum doit atteindre le candidat pour accéder à l'évaluation technique ?</p>
            </div>
          </div>
          <button className="psm-close" onClick={onClose}>✕</button>
        </div>

        {postulant && (
          <div className="psm-candidat">
            <div className="psm-candidat-avatar">
              {postulant.nom?.[0]}{postulant.prenoms?.[0]}
            </div>
            <div>
              <div className="psm-candidat-name">{postulant.nom} {postulant.prenoms}</div>
              <div className="psm-candidat-sub">{postulant.email} · {postulant.experience || '—'} d'expérience</div>
            </div>
            {titreOffre && (
              <div className="psm-poste-tag">{titreOffre}</div>
            )}
          </div>
        )}

        <div className="psm-body">
          <div className="psm-section-label">Choisissez le pourcentage minimum requis</div>

          <div className="psm-pct-grid">
            {PERCENTAGES.map((pct) => (
              <button
                key={pct}
                className={`psm-pct-btn ${selectedSeuil === pct ? 'selected' : ''} ${pct >= 80 ? 'high' : pct >= 50 ? 'mid' : 'low'}`}
                onClick={() => setSelectedSeuil(pct)}
              >
                {pct}%
              </button>
            ))}
          </div>

          {info && (
            <div className={`psm-info-card psm-info-${info.color}`}>
              <span className="psm-info-badge">{info.label}</span>
              <p>{info.desc}</p>
              <p className="psm-info-note">
                Le candidat devra obtenir au moins <strong>{selectedSeuil}%</strong> sur la grille de notation technique pour être admis en shortlist.
              </p>
            </div>
          )}

          {!selectedSeuil && (
            <div className="psm-placeholder">
              Sélectionnez un pourcentage ci-dessus pour continuer
            </div>
          )}
        </div>

        <div className="psm-footer">
          <button className="psm-btn-cancel" onClick={onClose}>Annuler</button>
          <button
            className="psm-btn-confirm"
            onClick={handleConfirm}
            disabled={!selectedSeuil}
          >
            Continuer vers la notation →
          </button>
        </div>

      </div>
    </div>
  );
};

export default PreselectionSeuilModal;
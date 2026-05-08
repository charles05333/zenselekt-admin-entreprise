// PreselectionSeuilModal.jsx — Version optimisée
// Le seuil est défini UNE FOIS par poste, pas par candidat.
import React, { useState } from 'react';
import './css/PreselectionSeuilModal.css';

const PERCENTAGES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/**
 * Props :
 *  - titreOffre       : string — nom du poste
 *  - seuilInitial     : number|null — seuil déjà défini pour ce poste
 *  - onClose          : () => void
 *  - onConfirm        : (seuil: number) => void
 */
const PreselectionSeuilModal = ({ titreOffre, seuilInitial, onClose, onConfirm }) => {
  const [selectedSeuil, setSelectedSeuil] = useState(seuilInitial || null);

  const handleConfirm = () => {
    if (!selectedSeuil) return;
    onConfirm(selectedSeuil);
  };

  const getSeuilDescription = (seuil) => {
    if (!seuil) return null;
    if (seuil <= 30) return { label: 'Seuil bas',        color: 'warn',   desc: 'La plupart des candidats passeront cette étape.' };
    if (seuil <= 60) return { label: 'Seuil modéré',     color: 'info',   desc: 'Niveau standard pour une sélection équilibrée.' };
    if (seuil <= 80) return { label: 'Seuil élevé',      color: 'ok',     desc: 'Niveau recommandé pour des postes exigeants.' };
    return             { label: 'Seuil très élevé', color: 'danger', desc: 'Seuls les candidats excellents passeront.' };
  };

  const info = selectedSeuil ? getSeuilDescription(selectedSeuil) : null;

  return (
    <div className="psm-overlay" onClick={onClose}>
      <div className="psm-box" onClick={(e) => e.stopPropagation()}>

        <div className="psm-header">
          <div className="psm-header-left">
            <div>
              <h3>Seuil de présélection — Poste</h3>
              <p>
                Ce seuil s'appliquera <strong>automatiquement à tous les candidats</strong> de ce poste.
                Il ne sera configuré qu'une seule fois.
              </p>
            </div>
          </div>
          <button className="psm-close" onClick={onClose}>✕</button>
        </div>

        {/* Affichage du poste — remplace l'affichage du candidat */}
        {titreOffre && (
          <div className="psm-candidat" style={{ background: '#EBF2FF', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            <div className="psm-candidat-avatar" style={{ background: '#2563EB', fontSize: 18 }}>📋</div>
            <div>
              <div className="psm-candidat-name" style={{ color: '#1a1a6e' }}>{titreOffre}</div>
              <div className="psm-candidat-sub">Ce seuil s'appliquera à l'ensemble des candidats liés à ce poste</div>
            </div>
            {seuilInitial && (
              <div className="psm-poste-tag" style={{ background: '#FD8140', color: '#fff' }}>
                Seuil actuel : {seuilInitial}%
              </div>
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
                Chaque candidat devra obtenir au moins <strong>{selectedSeuil}%</strong> à la notation CV
                pour accéder à l'étape Entretiens.
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
            {seuilInitial ? '✓ Mettre à jour le seuil' : '✓ Définir le seuil pour ce poste'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PreselectionSeuilModal;
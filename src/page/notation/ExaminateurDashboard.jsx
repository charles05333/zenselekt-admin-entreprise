// ExaminateurDashboard.jsx
import React from 'react';

const ExaminateurDashboard = ({ evaluation, onSelectExaminateur }) => {
  const examinateurs = evaluation?.examinateurs || [];
  const notesExaminateurs = evaluation?.notes_examinateurs || {};

  const handleCardClick = (examinateur) => {
    if (onSelectExaminateur) {
      onSelectExaminateur(examinateur);
    }
  };

  return (
    <div className="examinateur-dashboard" style={{ padding: '16px', minWidth: '600px' }}>
      <div className="dashboard-header">
        <h4>👥 Examinateurs ({examinateurs.length})</h4>
        <span className="dashboard-hint">Cliquez sur un examinateur pour le noter</span>
      </div>

      <div className="examinateurs-list">
        {examinateurs.map((examinateur) => {
          const note = notesExaminateurs[examinateur.id];
          const estNoté = note !== undefined;

          return (
            <div 
              key={examinateur.id} 
              className={`examinateur-card ${estNoté ? 'completed' : 'pending'}`}
              onClick={() => handleCardClick(examinateur)}
              style={{ cursor: 'pointer' }}
            >
              <div className="examinateur-card-header">
                <div className="examinateur-avatar">
                  {examinateur.nom.charAt(0)}{examinateur.nom.split(' ')[1]?.charAt(0) || ''}
                </div>
                <div className="examinateur-card-info">
                  <strong className="examinateur-name">{examinateur.nom}</strong>
                  <small>{examinateur.email}</small>
                  <span className={`role-badge role-${examinateur.role}`}>
                    {examinateur.role === 'rh' && '👥 RH'}
                    {examinateur.role === 'technique' && '💻 Technique'}
                    {examinateur.role === 'manager' && '👔 Manager'}
                    {examinateur.role === 'examinateur' && '📝 Examinateur'}
                  </span>
                </div>
                <div className="examinateur-action-icon">
                  {estNoté ? '✅' : '✏️'}
                </div>
              </div>
              <div className="examinateur-card-body">
                {estNoté ? (
                  <>
                    <div className="note-display">
                      <span className="note-value">{note.total}</span>
                      <span className="note-max">/{note.max}</span>
                    </div>
                    <div className="note-bar">
                      <div className="note-bar-fill" style={{ width: `${note.pourcentage}%` }} />
                    </div>
                    <div className={`decision-badge ${note.resultat === 'recrute' ? 'success' : 'danger'}`}>
                      {note.resultat === 'recrute' ? '✅ Recommandé' : '❌ Non recommandé'}
                    </div>
                    {note.commentaire && (
                      <div className="commentaire-preview">
                                        <small>📝 {note.commentaire.substring(0, 50)}...</small>
                                      </div>
                                    )}
                                    <div className="modifier-hint">✏️ Cliquez pour modifier</div>
                                  </>
                                ) : (
                                  <div className="pending-message">
                                    <span className="pending-icon">✏️</span>
                                    <span>Cliquez pour noter</span>
                                    <small>Grille de notation personnalisée</small>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {examinateurs.length > 0 && (
                        <div className="dashboard-summary">
                          <div className="summary-title">État des notations</div>
                          <div className="summary-stats">
                            <div className="stat">
                              <span className="stat-label">Notés</span>
                              <span className="stat-value">{Object.keys(notesExaminateurs).length}/{examinateurs.length}</span>
                            </div>
                            <div className="stat">
                              <span className="stat-label">Recommandés</span>
                              <span className="stat-value">{Object.values(notesExaminateurs).filter(n => n?.resultat === 'recrute').length}</span>
                            </div>
                            <div className="stat">
                              <span className="stat-label">Non recommandés</span>
                              <span className="stat-value">{Object.values(notesExaminateurs).filter(n => n?.resultat === 'rejete').length}</span>
                            </div>
                          </div>
                          {Object.keys(notesExaminateurs).length === examinateurs.length && (
                            <div className="summary-finale">
                              🎉 Tous les examinateurs ont noté ! Décision finale disponible.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                };

export default ExaminateurDashboard;
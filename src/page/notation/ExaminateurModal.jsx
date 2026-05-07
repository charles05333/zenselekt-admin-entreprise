// ExaminateurModal.jsx - Version complète corrigée
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import './css/ExaminateurModal.css';

const ExaminateurModal = ({ postulant, onClose, onSave }) => {
  const [examinateurs, setExaminateurs] = useState([]);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('examinateur');

  const ajouterExaminateur = () => {
    if (!nom.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez saisir un nom',
        confirmButtonColor: '#f39c12'
      });
      return;
    }
    if (!email.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez saisir un email',
        confirmButtonColor: '#f39c12'
      });
      return;
    }
    if (!email.includes('@')) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez saisir un email valide',
        confirmButtonColor: '#f39c12'
      });
      return;
    }

    const nouvelExaminateur = {
      id: Date.now(),
      nom: nom.trim(),
      email: email.trim(),
      role: role,
      scores: null,
      commentaire: ''
    };
    
    console.log("Ajout examinateur:", nouvelExaminateur);
    setExaminateurs([...examinateurs, nouvelExaminateur]);
    setNom('');
    setEmail('');
    setRole('examinateur');
    
    Swal.fire({
      icon: 'success',
      title: 'Succès',
      text: 'Examinateur ajouté avec succès',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const supprimerExaminateur = (id, nomExaminateur) => {
    console.log("Suppression demandée pour id:", id);
    console.log("Liste actuelle:", examinateurs);
    
    Swal.fire({
      title: 'Confirmation',
      text: `Voulez-vous vraiment supprimer ${nomExaminateur} ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        const nouvelleListe = examinateurs.filter(e => e.id !== id);
        console.log("Nouvelle liste:", nouvelleListe);
        setExaminateurs(nouvelleListe);
        
        Swal.fire({
          icon: 'success',
          title: 'Supprimé',
          text: `${nomExaminateur} a été supprimé`,
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const handleSubmit = () => {
    if (examinateurs.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez ajouter au moins un examinateur',
        confirmButtonColor: '#f39c12'
      });
      return;
    }
    
    Swal.fire({
      title: 'Confirmation',
      html: `
        <div style="text-align: center;">
          <p>Vous allez noter le candidat avec <strong>${examinateurs.length}</strong> examinateur(s)</p>
          <div style="background: #f3f4f6; padding: 10px; border-radius: 10px; margin-top: 10px;">
            ${examinateurs.map(e => `
              <div style="text-align: left; margin: 5px 0;">
                <strong>${e.nom}</strong> - ${e.role === 'rh' ? 'RH' : e.role === 'technique' ? 'Technique' : e.role === 'manager' ? 'Manager' : 'Examinateur'}
              </div>
            `).join('')}
          </div>
          <p style="margin-top: 15px;">Souhaitez-vous continuer ?</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4caf50',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, continuer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        onSave(examinateurs);
        setTimeout(() => {
          onClose();
        }, 500);
      }
    });
  };

  const getRoleLabel = (roleValue) => {
    const roles = {
      'rh': 'RH',
      'technique': 'Technique',
      'manager': 'Manager',
      'examinateur': 'Examinateur'
    };
    return roles[roleValue] || roles.examinateur;
  };

  return (
    <div className="examinateur-modal-overlay" onClick={onClose}>
      <div className="examinateur-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="examinateur-modal-header">
          <div>
            <h3>👥 Sélectionnez les examinateurs</h3>
            <p className="text-muted">Chaque examinateur pourra noter le candidat indépendamment</p>
            {postulant && (
              <div className="candidat-info">
                <strong>Candidat :</strong> {postulant.nom} {postulant.prenoms} ({postulant.email})
              </div>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="examinateur-form">
          <div className="form-row">
            <input 
              type="text" 
              placeholder="Nom complet" 
              value={nom} 
              onChange={(e) => setNom(e.target.value)} 
              className="form-input"
            />
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="form-input"
            />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="form-select">
              <option value="examinateur">Examinateur</option>
              <option value="rh">RH</option>
              <option value="technique">Technique</option>
              <option value="manager">Manager</option>
            </select>
            <button onClick={ajouterExaminateur} className="btn-add">
              + Ajouter
            </button>
          </div>
        </div>

        {examinateurs.length > 0 && (
          <div className="examinateur-liste">
            <div className="examinateur-liste-header">
              <h4>Examinateurs sélectionnés ({examinateurs.length})</h4>
              <span className="liste-hint">Cliquez sur ✕ pour supprimer</span>
            </div>
            {examinateurs.map((e, idx) => (
              <div key={e.id} className="examinateur-item">
                <div className="examinateur-info">
                  <span className="examinateur-num">#{idx + 1}</span>
                  <span className="examinateur-nom">{e.nom}</span>
                  <span className="examinateur-email">{e.email}</span>
                  <span className={`examinateur-role role-${e.role}`}>
                    {getRoleLabel(e.role)}
                  </span>
                </div>
                <button 
                  onClick={() => supprimerExaminateur(e.id, e.nom)} 
                  className="btn-remove" 
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="examinateur-info-bulle">
          <div className="info-icon">ℹ️</div>
          <div className="info-text">
            <strong>Comment ça fonctionne ?</strong><br />
            1. Ajoutez les examinateurs qui vont noter ce candidat<br />
            2. Chaque examinateur aura sa propre grille de notation<br />
            3. Vous pourrez suivre la progression de chaque examinateur<br />
            4. La décision finale sera basée sur la moyenne des notes
          </div>
        </div>

        <div className="examinateur-actions">
          <button className="btn-cancel" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-continue" onClick={handleSubmit} disabled={examinateurs.length === 0}>
            Valider et commencer la notation ({examinateurs.length} examinateur(s))
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExaminateurModal;
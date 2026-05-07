import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./component/Header";
import Navbar from "./component/Navbar";
import './css/postulantCampagne.css';

const BI_CDN = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";

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

// ── Tous les tests disponibles (source : Tests.jsx MOCK_TESTS) ─────────────
const TESTS_DISPONIBLES = [
  {
    id: 1,
    titre: "Test de Pression",
    description: "Évaluer la gestion du stress et la capacité à prendre des décisions sous pression.",
  },
  {
    id: 2,
    titre: "Test Psychotechnique - Dominos",
    description: "Mesurer les aptitudes logiques, le raisonnement abstrait et la vitesse de traitement.",
  },
  {
    id: 3,
    titre: "Test d'anglais",
    description: "Évaluer la maîtrise de la langue anglaise en contexte professionnel.",
  },
  {
    id: 4,
    titre: "Test MBTI",
    description: "Classifie les individus en 16 types selon quatre dimensions comportementales.",
  },
  {
    id: 5,
    titre: "Test des 5 Traits de Personnalité",
    description: "Évalue cinq dimensions OCEAN pour un profil psychologique complet.",
  },
];

// ── Mock data des postulants (mis à jour avec l'image) ─────────────────────
const MOCK_POSTULANTS = [
  {
    id: 1,
    nom: "KOUASSI",
    prenoms: "Jean-Marc",
    email: "jm.kouassi@email.com",
    telephone: "+225 07 01 23 45 67",
    telephoneWhatsapp: "+225 07 01 23 45 67",
    secteurActivite: "Informatique / Télécoms",
    niveauAcademique: "master",
    genre: "homme",
  },
  {
    id: 2,
    nom: "BAMBA",
    prenoms: "Fatoumata",
    email: "f.bamba@email.com",
    telephone: "+225 05 67 89 12 34",
    telephoneWhatsapp: "+225 05 67 89 12 34",
    secteurActivite: "Banque / Assurance",
    niveauAcademique: "master",
    genre: "femme",
  },
  {
    id: 3,
    nom: "DIARRA",
    prenoms: "Oumar",
    email: "o.diarra@email.com",
    telephone: "+225 04 56 78 90 12",
    telephoneWhatsapp: "+225 04 56 78 90 12",
    secteurActivite: "Commerce / Négoce / Distribution",
    niveauAcademique: "licence",
    genre: "homme",
  },
  {
    id: 4,
    nom: "N'GUESSAN",
    prenoms: "Aya Christine",
    email: "a.nguessan@email.com",
    telephone: "+225 06 78 90 12 34",
    telephoneWhatsapp: "+225 06 78 90 12 34",
    secteurActivite: "Santé",
    niveauAcademique: "doctorat",
    genre: "femme",
  },
  {
    id: 5,
    nom: "COULIBALY",
    prenoms: "Ibrahim",
    email: "i.coulibaly@email.com",
    telephone: "+225 07 89 01 23 45",
    telephoneWhatsapp: "+225 07 89 01 23 45",
    secteurActivite: "BTP / Matériaux de construction",
    niveauAcademique: "ingenieur",
    genre: "homme",
  },
];

const SECTEURS_ACTIVITE = [
   "Agriculture / Élevage / Pêche", "Agroalimentaire", "Architecture / Urbanisme / Design",
    "Art / Culture / Spectacle", "Artisanat / Métiers manuels", "Audit / Expertise comptable",
    "Bailleur / Organisme international", "Banque / Assurance / Microfinance",
    "Bois / Papier / Carton / Imprimerie", "BTP / Matériaux de construction",
    "Chimie / Parachimie", "Commerce / Négoce / Distribution",
    "Communication / Marketing / Publicité", "Droit / Juridique / Notariat",
    "Économie / Statistiques / Recherche", "Édition / Multimédia / Presse",
    "Education / Formation / Enseignement", "Électronique / Électricité / Énergie",
    "Environnement / Développement durable", "Études et conseils / Consulting",
    "Finance / Comptabilité / Gestion", "Hôtellerie / Restauration / Tourisme",
    "Humanitaire / ONG / Associatif", "Immobilier / Foncier",
    "Industrie pharmaceutique", "Informatique / Télécoms / Numérique",
    "Machines et équipements / Automobile", "Management / Direction générale",
    "Mines / Pétrole / Énergie", "Métallurgie / Travail du métal",
    "Plastique / Caoutchouc", "Ressources humaines / Recrutement",
    "Santé / Médical / Paramédical", "Sécurité / Défense / Gardiennage",
    "Services aux entreprises / Facilities", "Sport / Bien-être / Loisirs",
    "Textile / Habillement / Chaussure", "Transports / Logistique / Supply Chain",
    "Autre / Non classifié",
];

const NIVEAUX_ACADEMIQUES = [
     { value: "cepe",          label: "CEPE (Certificat d'études primaires)" },
    { value: "bepc",          label: "BEPC / Brevet" },
    { value: "cap",           label: "CAP" },
    { value: "bac",           label: "Baccalauréat" },
    { value: "bt",            label: "BT (Brevet de technicien)" },
    { value: "bp",            label: "BP (Brevet professionnel)" },
    { value: "bts",           label: "BTS" },
    { value: "dut",           label: "DUT" },
    { value: "dts",           label: "DTS" },
    { value: "deug",          label: "DEUG / DEUST (Bac +2)" },
    { value: "licence",       label: "Licence / Bachelor (Bac +3)" },
    { value: "licence_pro",   label: "Licence professionnelle (Bac +3)" },
    { value: "master",        label: "Master 1 (Bac +4)" },
    { value: "master2",       label: "Master 2 / DEA / DESS (Bac +5)" },
    { value: "ingenieur",     label: "Diplôme d'ingénieur (Bac +5)" },
    { value: "grandes_ecoles",label: "Grande École (Bac +5)" },
    { value: "doctorat",      label: "Doctorat / PhD (Bac +8)" },
    { value: "autre",         label: "Autre / Non précisé" },
];

// ── Modals ────────────────────────────────────────────────────────────────

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="postulant-modal-overlay" onClick={onCancel}>
      <div className="postulant-modal postulant-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="postulant-modal-header postulant-modal-header--warning">
          <h3><i className="bi bi-question-circle" /> Confirmation</h3>
          <button className="postulant-modal-close" onClick={onCancel}><i className="bi bi-x" /></button>
        </div>
        <div className="postulant-modal-body">
          <p>{message}</p>
        </div>
        <div className="postulant-modal-footer">
          <button className="postulant-modal-cancel" onClick={onCancel}>Annuler</button>
          <button className="postulant-modal-submit postulant-modal-submit--warning" onClick={onConfirm}>
             Confirmer l'envoi
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({ message, onClose }) {
  return (
    <div className="postulant-modal-overlay" onClick={onClose}>
      <div className="postulant-modal postulant-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="postulant-modal-header postulant-modal-header--success">
          <h3><i className="bi bi-check-circle" /> Envoi réussi</h3>
          <button className="postulant-modal-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>
        <div className="postulant-modal-body">
          <p>{message}</p>
        </div>
        <div className="postulant-modal-footer">
          <button className="postulant-modal-submit postulant-modal-submit--success" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}

function ErrorModal({ message, onClose }) {
  return (
    <div className="postulant-modal-overlay" onClick={onClose}>
      <div className="postulant-modal postulant-modal--sm" onClick={(e) => e.stopPropagation()}>
        <div className="postulant-modal-header postulant-modal-header--danger">
          <h3> Erreur</h3>
          <button className="postulant-modal-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>
        <div className="postulant-modal-body">
          <p>{message}</p>
        </div>
        <div className="postulant-modal-footer">
          <button className="postulant-modal-submit postulant-modal-submit--danger" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────

export default function PostulantCampagne() {
  useBootstrapIcons();
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const poste = queryParams.get('poste') || "Offre d'emploi";
  const offreId = queryParams.get('offre_id') || "1";

  const [width, setWidth] = useState(window.innerWidth);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSecteur, setSelectedSecteur] = useState("");
  const [selectedNiveau, setSelectedNiveau] = useState("");

  // Sélection de tests (multi-select)
  const [selectedTests, setSelectedTests] = useState([]);

  // Sélection des candidats
  const [selectedCandidats, setSelectedCandidats] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Modals
  const [modal, setModal] = useState(null);
  const [modalMessage, setModalMessage] = useState("");

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    setSidebarOpen(width > 768);
  }, [width]);

  // Filtrage
  const filteredPostulants = MOCK_POSTULANTS.filter(p => {
    const matchSearch = searchTerm === "" ||
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prenoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSecteur = selectedSecteur === "" || p.secteurActivite === selectedSecteur;
    const matchNiveau = selectedNiveau === "" || p.niveauAcademique === selectedNiveau;
    return matchSearch && matchSecteur && matchNiveau;
  });

  const totalPages = Math.ceil(filteredPostulants.length / itemsPerPage);
  const paginatedPostulants = filteredPostulants.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Met à jour selectAll quand la sélection change ou quand la page change
  useEffect(() => {
    if (paginatedPostulants.length > 0) {
      const allSelectedInPage = paginatedPostulants.every(c => selectedCandidats.includes(c.id));
      setSelectAll(allSelectedInPage);
    } else {
      setSelectAll(false);
    }
  }, [selectedCandidats, paginatedPostulants]);

  // Fonctions de sélection des candidats
  const toggleSelectCandidat = (id) => {
    setSelectedCandidats(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      const currentPageIds = paginatedPostulants.map(c => c.id);
      setSelectedCandidats(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      const currentPageIds = paginatedPostulants.map(c => c.id);
      const newSelected = [...new Set([...selectedCandidats, ...currentPageIds])];
      setSelectedCandidats(newSelected);
    }
  };

  const selectAllFiltered = () => {
    const allFilteredIds = filteredPostulants.map(c => c.id);
    setSelectedCandidats(allFilteredIds);
    setModalMessage(`${allFilteredIds.length} candidat(s) sélectionné(s) sur tous les filtres`);
    setModal('success');
    setTimeout(() => closeModal(), 1500);
  };

  const clearSelection = () => {
    setSelectedCandidats([]);
    setSelectAll(false);
  };

  // Toggle test dans le multi-select
  const toggleTest = (id) => {
    setSelectedTests(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  // Clic bouton principal "Envoyer les tests aux candidats"
  const handleEnvoyerClick = () => {
    if (selectedTests.length === 0) {
      setModalMessage("Veuillez sélectionner au moins un test avant d'envoyer.");
      setModal('error');
      return;
    }
    
    if (selectedCandidats.length === 0) {
      setModalMessage("Veuillez sélectionner au moins un candidat.");
      setModal('error');
      return;
    }
    
    const testsText = selectedTests.length === 1 ? "le test sélectionné" : "les tests sélectionnés";
    const testsList = selectedTests.map(id => TESTS_DISPONIBLES.find(t => t.id === id)?.titre).join(", ");
    const candidatsText = selectedCandidats.length === 1
      ? "1 candidat"
      : `${selectedCandidats.length} candidats`;
    
    setModalMessage(`Êtes-vous sûr de vouloir envoyer ${testsText} (${testsList}) à ${candidatsText} ?`);
    setModal('confirm');
  };

  const handleConfirmSend = () => {
    setModal(null);
    
    const selectedCandidatsData = MOCK_POSTULANTS.filter(c => selectedCandidats.includes(c.id));
    const selectedTestsData = TESTS_DISPONIBLES.filter(t => selectedTests.includes(t.id));
    
    setTimeout(() => {
      setModalMessage(
        `Tests envoyés avec succès à ${selectedCandidatsData.length} candidat(s).\n\n` +
        `Tests: ${selectedTestsData.map(t => t.titre).join(', ')}\n` +
        `👥 Candidats: ${selectedCandidatsData.map(c => `${c.prenoms} ${c.nom}`).join(', ')}`
      );
      setModal('success');
    }, 500);
  };

  const closeModal = () => {
    setModal(null);
    setModalMessage("");
  };

  // Navigation vers la page résultats des tests
  const handleVoirResultats = () => {
    navigate(`/resultatstests?offre_id=${offreId}&poste=${encodeURIComponent(poste)}`);
  };

  const isMobile = width <= 768;

  return (
    <div className="postulant-app">
      <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(p => !p)} isMobile={isMobile} />

      <div className="postulant-layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={`postulant-main ${sidebarOpen ? "postulant-main--shifted" : ""}`}>
          <div className="postulant-container">

            {/* Breadcrumb */}
            <div className="postulant-breadcrumb">
              <div className="postulant-breadcrumb-left">
                <button className="postulant-back-btn" onClick={() => navigate(-1)}>
                  <i className="bi bi-arrow-left" />
                  <span>Retour</span>
                </button>
                <h1 className="postulant-title">
                  <i className="bi bi-people-fill" />
                  Liste des Postulants
                </h1>
              </div>
              <div className="postulant-breadcrumb-right">
                <span className="postulant-offre-badge">
                 
                  {poste}
                </span>
              </div>
            </div>

            {/* Filtres */}
            <div className="postulant-filters-card">
              <div className="postulant-filters-header">
                <i className="bi bi-funnel-fill" />
                <span>Filtres de recherche</span>
              </div>
              <div className="postulant-filters-grid">
                <div className="postulant-filter-group">
                  <label> Recherche rapide</label>
                  <div className="postulant-search-input">
                    <i className="bi bi-search" />
                    <input
                      type="text"
                      placeholder="Nom, prénom ou email..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setPage(1); clearSelection(); }}
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} className="postulant-clear-btn">
                        <i className="bi bi-x" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="postulant-filter-group">
                  <label> Secteur d'activité</label>
                  <select value={selectedSecteur} onChange={(e) => { setSelectedSecteur(e.target.value); setPage(1); clearSelection(); }}>
                    <option value="">Tous les secteurs</option>
                    {SECTEURS_ACTIVITE.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="postulant-filter-group">
                  <label>Niveau académique</label>
                  <select value={selectedNiveau} onChange={(e) => { setSelectedNiveau(e.target.value); setPage(1); clearSelection(); }}>
                    <option value="">Tous les niveaux</option>
                    {NIVEAUX_ACADEMIQUES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>
              </div>

              {(selectedSecteur || selectedNiveau || searchTerm) && (
                <div className="postulant-filters-actions">
                  <button onClick={() => { setSelectedSecteur(""); setSelectedNiveau(""); setSearchTerm(""); setPage(1); clearSelection(); }} className="postulant-reset-btn">
                    <i className="bi bi-arrow-counterclockwise" />
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>

            {/* Sélection des tests + boutons */}
            <div className="postulant-filters-card">
              <div className="postulant-filters-header">
                <i className="bi bi-check2-square" />
                <span>Sélectionner le ou les tests à envoyer</span>
              </div>

              <div className="postulant-tests-grid">
                {TESTS_DISPONIBLES.map(test => (
                  <label
                    key={test.id}
                    className={`postulant-test-item ${selectedTests.includes(test.id) ? "postulant-test-item--selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTests.includes(test.id)}
                      onChange={() => toggleTest(test.id)}
                    />
                    <div className="postulant-test-content">
                      <strong>{test.titre}</strong>
                      <small>{test.description}</small>
                    </div>
                  </label>
                ))}
              </div>

              <p className="postulant-test-hint">
                <i className="bi bi-info-circle" />
                Cochez un ou plusieurs tests, sélectionnez des candidats, puis cliquez sur Envoyer.
              </p>

              <div className="postulant-filters-actions">
                {/* ── Groupe gauche : boutons d'action ── */}
                <div className="postulant-action-group">
                  <button className="postulant-action-btn" onClick={handleEnvoyerClick}>
                    <i className="bi bi-envelope-paper-fill" />
                    ENVOYER LES TESTS AUX CANDIDATS SÉLECTIONNÉS
                  </button>

                  {/* ✅ NOUVEAU BOUTON : Résultats des tests */}
                  <button className="postulant-results-btn" onClick={handleVoirResultats}>
                    <i className="bi bi-bar-chart-line-fill" />
                    RÉSULTATS DES TESTS
                  </button>
                </div>

                <div className="postulant-stats">
                  <i className="bi bi-check-square-fill" />
                  <span>{selectedCandidats.length} / {filteredPostulants.length} candidat(s) sélectionné(s)</span>
                </div>
              </div>
            </div>

            {/* Tableau des candidats */}
            <div className="postulant-table-card">
              <div className="postulant-table-header">
                <div className="postulant-table-controls">
                  <div className="postulant-table-controls-left">
                    <label>
                      Afficher
                      <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }}>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      éléments
                    </label>
                  </div>
                  
                  <div className="postulant-table-controls-right">
                    {filteredPostulants.length > 0 && (
                      <>
                        <button className="postulant-select-all-btn" onClick={toggleSelectAll}>
                          <i className={`bi ${selectAll ? 'bi-check-all' : 'bi-check-square'}`} />
                          {selectAll ? 'Désélectionner la page' : 'Sélectionner la page'}
                        </button>
                        <button className="postulant-select-all-btn" onClick={selectAllFiltered}>
                          <i className="bi bi-check2-all" />
                          Tout sélectionner ({filteredPostulants.length})
                        </button>
                        {selectedCandidats.length > 0 && (
                          <button className="postulant-clear-selection-btn" onClick={clearSelection}>
                            <i className="bi bi-x-circle" />
                            Effacer
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="postulant-table-wrapper">
                <table className="postulant-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>
                        <input
                          type="checkbox"
                          checked={selectAll && paginatedPostulants.length > 0}
                          onChange={toggleSelectAll}
                          disabled={paginatedPostulants.length === 0}
                        />
                      </th>
                      <th>Nom</th>
                      <th>Prénom(s)</th>
                      <th>Email</th>
                      <th>Téléphone</th>
                      <th>Téléphone WhatsApp</th>
                      <th>Secteur d'activité</th>
                      <th>Niveau académique</th>
                      <th>Genre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPostulants.length === 0 ? (
                      <tr>
                        <td colSpan={9}>
                          <div className="postulant-empty-state">
                            <i className="bi bi-inbox" />
                            <p>Aucun postulant trouvé</p>
                            <span>Essayez de modifier vos filtres de recherche</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedPostulants.map(postulant => (
                        <tr key={postulant.id} className={selectedCandidats.includes(postulant.id) ? "postulant-row-selected" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedCandidats.includes(postulant.id)}
                              onChange={() => toggleSelectCandidat(postulant.id)}
                            />
                          </td>
                          <td><strong>{postulant.nom}</strong></td>
                          <td>{postulant.prenoms}</td>
                          <td className="postulant-email">{postulant.email}</td>
                          <td>{postulant.telephone}</td>
                          <td>{postulant.telephoneWhatsapp}</td>
                          <td><span className="postulant-badge secteur">{postulant.secteurActivite}</span></td>
                          <td><span className="postulant-badge niveau">{postulant.niveauAcademique}</span></td>
                          <td>
                            <span className={`postulant-gender ${postulant.genre}`}>
                              <i className={`bi ${postulant.genre === 'homme' ? 'bi-gender-male' : 'bi-gender-female'}`} />
                              {postulant.genre}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="postulant-pagination">
                  <span className="postulant-pagination-info">
                    Affichage de l'élément {(page - 1) * itemsPerPage + 1} à {Math.min(page * itemsPerPage, filteredPostulants.length)} sur {filteredPostulants.length} éléments
                  </span>
                  <div className="postulant-pagination-controls">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      <i className="bi bi-chevron-left" /> Précédent
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (page <= 3) pageNum = i + 1;
                      else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = page - 2 + i;
                      return (
                        <button key={pageNum} className={page === pageNum ? "active" : ""} onClick={() => setPage(pageNum)}>
                          {pageNum}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                      Suivant <i className="bi bi-chevron-right" />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Modals */}
      {modal === 'confirm' && (
        <ConfirmModal
          message={modalMessage}
          onConfirm={handleConfirmSend}
          onCancel={closeModal}
        />
      )}
      {modal === 'success' && (
        <SuccessModal message={modalMessage} onClose={closeModal} />
      )}
      {modal === 'error' && (
        <ErrorModal message={modalMessage} onClose={closeModal} />
      )}

      <footer className={`postulant-footer ${sidebarOpen ? "postulant-footer--shifted" : ""}`}>
        © 2025 Zenselekt · Propulsé par <strong>Empower talents &amp; careers</strong>. Tous droits réservés
      </footer>
    </div>
  );
}
import { useState, useEffect } from "react";
import Header from "./component/Header";
import Navbar from "./component/Navbar";
import "./css/Documentation.css";

// ── Bootstrap Icons via CDN ──────────────────────────────
const BI_CDN =
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
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

// ── Structure de la documentation ─────────────────────────
const DOCS = [
  {
    id: "intro",
    label: "Introduction",
    icon: "bi-house",
    sections: [
      {
        id: "presentation",
        title: "Présentation de Zenselekt 3.0",
        content: `Zenselekt 3.0 est une plateforme de gestion RH entreprise conçue pour centraliser et digitaliser l'intégralité du cycle de recrutement : de la publication d'une offre jusqu'au recrutement final du candidat.

La solution s'adresse aux équipes RH de PME, ETI et grandes entreprises souhaitant piloter leurs processus de recrutement avec rigueur, traçabilité et efficacité.`,
      },
      {
        id: "perimetre",
        title: "Périmètre fonctionnel",
        content: `La plateforme couvre les domaines suivants :

• Gestion des offres d'emploi et des annonces
• Gestion de la candidathèque et des postulants
• Campagnes d'évaluation (tests psychotechniques, MBTI, Big Five, Anglais, Pression)
• Présélection, notation et shortlisting
• Gestion des utilisateurs et des droits d'accès
• Tableau de bord analytique en temps réel`,
      },
    ],
  },
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: "bi-grid",
    sections: [
      {
        id: "kpis",
        title: "Indicateurs clés (KPIs)",
        content: `Le tableau de bord affiche en temps réel les indicateurs suivants :

• Candidats inscrits — nombre total de candidats enregistrés sur la plateforme pour votre compte.
• Annonces postées — annonces publiées et vous concernant directement.
• Annonces en cours — annonces actives dont la date limite de candidature n'est pas encore dépassée.
• Candidats recrutés — nombre de candidats ayant abouti à un recrutement validé.
• Taux de conversion — ratio recrutés / inscrits, exprimé en pourcentage.

Chaque indicateur est accompagné d'un delta mensuel (↑ hausse, ↓ baisse, → stable) pour suivre l'évolution dans le temps.`,
      },
      {
        id: "graphiques",
        title: "Graphiques analytiques",
        content: `Deux graphiques interactifs sont disponibles :

Graphique linéaire — Candidats par niveau d'étude : visualise la répartition des candidats selon leur diplôme (Licence, Master, Ingénieur, Doctorat, BTS, DUT). Survolez un point pour afficher le détail.

Graphique donut — Candidats par secteur d'activité : répartition sectorielle interactive. Cliquez sur un segment ou une légende pour filtrer l'affichage et isoler un secteur.

Le sélecteur de période (7j, 30j, 3m, 1an) permet d'ajuster la fenêtre temporelle des données affichées.`,
      },
    ],
  },
  {
    id: "offres",
    label: "Offres d'emploi",
    icon: "bi-briefcase",
    sections: [
      {
        id: "gestion-annonces",
        title: "Gestion des annonces",
        content: `La page Offres d'emploi liste l'ensemble des annonces associées à votre compte. Pour chaque offre, les informations suivantes sont affichées :

• Titre du poste
• Type de contrat (CDI, CDD, Stage, etc.)
• Qualification requise et niveau d'expérience
• Dates de publication et de clôture
• Nombre de postulants
• Statut (Approuvé, En attente, Clôturé)

Les offres peuvent être filtrées par type de contrat ou par statut. Une barre de recherche permet de retrouver rapidement une annonce par mot-clé.`,
      },
      {
        id: "postulants",
        title: "Consultation des postulants",
        content: `En cliquant sur une offre, vous accédez à la liste des candidats ayant postulé. Depuis cette vue, vous pouvez :

• Consulter le profil complet de chaque postulant
• Accéder à ses résultats de tests si une campagne d'évaluation a été lancée
• Modifier le statut du candidat dans le processus (En attente, Présélectionné, Retenu, Refusé)
• Exporter la liste au format PDF ou Excel`,
      },
      {
        id: "candidatheque",
        title: "Candidathèque générale",
        content: `La candidathèque centralise l'ensemble des profils enregistrés sur la plateforme, indépendamment de toute offre spécifique. Elle permet :

• La recherche multicritère (nom, compétences, secteur, niveau d'étude)
• La consultation des profils complets avec historique de candidatures
• L'ajout manuel d'un candidat externe

Les candidatures spontanées sont accessibles via le menu dédié et suivent le même circuit de traitement.`,
      },
    ],
  },
  {
    id: "evaluations",
    label: "Évaluations",
    icon: "bi-trophy",
    sections: [
      {
        id: "banque-tests",
        title: "Banque des tests",
        content: `Zenselekt 3.0 intègre une batterie de tests psychométriques et de compétences, activables par campagne :

• Test de Pression — évalue la gestion du stress et la capacité décisionnelle sous contrainte.
• Test Psychotechnique Dominos — mesure les aptitudes logiques et le raisonnement abstrait.
• Test d'Anglais — évalue la maîtrise écrite en contexte professionnel (grammaire, vocabulaire, compréhension).
• Test MBTI — classifie les profils de personnalité selon 16 types (Extraversion/Introversion, Sensation/Intuition, Pensée/Sentiment, Jugement/Perception).
• Big Five (OCEAN) — évalue cinq dimensions fondamentales : Ouverture, Conscienciosité, Extraversion, Agréabilité, Névrosisme.

Chaque test dispose d'un statut (Activé / Désactivé) gérable depuis la banque des tests.`,
      },
      {
        id: "campagnes",
        title: "Campagnes d'évaluation",
        content: `Une campagne d'évaluation permet d'associer un ou plusieurs tests à un groupe de candidats ciblé (par offre, par poste ou manuellement sélectionné).

Étapes de création d'une campagne :
1. Nommer la campagne et définir sa période de validité.
2. Sélectionner les tests à inclure depuis la banque.
3. Assigner les candidats concernés.
4. Lancer la campagne — les candidats reçoivent un lien d'accès sécurisé.
5. Suivre l'avancement en temps réel (taux de complétion, résultats).

Les résultats sont automatiquement consolidés dans la fiche de chaque candidat et alimentent le module de présélection.`,
      },
    ],
  },
  {
    id: "preselection",
    label: "Présélection",
    icon: "bi-clipboard-check",
    sections: [
      {
        id: "postes",
        title: "Gestion des postes",
        content: `La liste des postes regroupe les positions ouvertes au recrutement, indépendamment des annonces publiées. Un poste peut être associé à plusieurs offres et à plusieurs vagues de recrutement.

Depuis la vue poste, vous accédez au module de présélection complet :

• Notation manuelle par examinateur (grille critériée)
• Visualisation des scores de tests
• Génération d'un rapport de shortlist exportable (PDF / Word)`,
      },
      {
        id: "notation",
        title: "Notation et shortlisting",
        content: `Le module de notation permet à un ou plusieurs examinateurs d'évaluer les candidats présélectionnés selon des critères définis.

Fonctionnalités disponibles :

• Grille d'évaluation configurable (compétences techniques, soft skills, adéquation culturelle)
• Notation individuelle ou collégiale avec réconciliation des scores
• Définition d'un seuil de présélection automatique
• Classement automatique des candidats par score global
• Export du rapport de shortlist au format PDF ou Word, incluant les profils, scores et recommandations`,
      },
    ],
  },
  {
    id: "utilisateurs",
    label: "Utilisateurs",
    icon: "bi-people",
    sections: [
      {
        id: "gestion-users",
        title: "Gestion des utilisateurs",
        content: `La page Utilisateurs liste l'ensemble des comptes ayant accès à votre espace Zenselekt. Elle affiche pour chaque utilisateur :

• Adresse email
• Rôle attribué
• Modules accessibles
• Date de création du compte
• Statut (Actif / Inactif)

Le bandeau de quota indique le nombre d'utilisateurs créés par rapport au plafond autorisé par votre pack.`,
      },
      {
        id: "creation-user",
        title: "Création d'un utilisateur",
        content: `Pour créer un nouvel utilisateur, accédez à Gestion des utilisateurs › Création d'un utilisateur.

Les informations obligatoires sont :
• Adresse email professionnelle
• Rôle (Administrateur, Responsable RH, Examinateur, Lecteur)
• Sélection des modules accessibles

Un email d'invitation est automatiquement envoyé à l'adresse renseignée avec un lien de création de mot de passe, valide 48 heures.`,
      },
      {
        id: "droits",
        title: "Gestion des droits d'accès",
        content: `Chaque utilisateur se voit attribuer un accès granulaire aux modules suivants :

• Dashboard — lecture des KPIs et graphiques
• Offres d'emploi — consultation et gestion des annonces
• Utilisateurs — création et modification des comptes
• Messages — accès à la messagerie interne
• Évaluations — gestion des tests et campagnes
• Présélection — notation et génération de shortlists

Les droits peuvent être modifiés à tout moment depuis la fiche utilisateur, sans déconnexion requise.`,
      },
    ],
  },
  {
    id: "faq",
    label: "FAQ",
    icon: "bi-question-circle",
    sections: [
      {
        id: "faq-general",
        title: "Questions fréquentes",
        content: `Comment réinitialiser mon mot de passe ?
Contactez l'assistance technique par téléphone au +225 07 58 03 40 78 ou par email à contact@zenselekt.com. Un administrateur générera un lien de réinitialisation.

Peut-on importer une liste de candidats existants ?
Oui, via la candidathèque générale. Un import CSV est disponible depuis le bouton "Importer" en haut de la liste. Le format attendu est documenté dans le modèle téléchargeable depuis la même page.

Les tests sont-ils accessibles sur mobile ?
Oui. L'interface candidat est entièrement responsive. Les tests peuvent être complétés depuis un smartphone ou une tablette.

Comment contacter le support ?
Téléphone : +225 07 58 03 40 78
Email : contact@zenselekt.com
Disponibilité : du lundi au vendredi, 8h–18h (heure d'Abidjan)`,
      },
    ],
  },
];

// ── Composant principal ────────────────────────────────────
export default function Documentation() {
  useBootstrapIcons();

  const [width, setWidth] = useState(0);
  useEffect(() => {
    setWidth(window.innerWidth);
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isMobile = width > 0 && width <= 600;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (width > 0) setSidebarOpen(width > 768);
  }, [width]);

  const [activeChapter, setActiveChapter] = useState("intro");
  const [activeSection, setActiveSection] = useState("presentation");
  const [search, setSearch] = useState("");

  const chapter = DOCS.find((d) => d.id === activeChapter) || DOCS[0];
  const section =
    chapter.sections.find((s) => s.id === activeSection) ||
    chapter.sections[0];

  // Filtrage de recherche
  const searchResults = search.trim()
    ? DOCS.flatMap((ch) =>
        ch.sections
          .filter(
            (s) =>
              s.title.toLowerCase().includes(search.toLowerCase()) ||
              s.content.toLowerCase().includes(search.toLowerCase())
          )
          .map((s) => ({ chapterId: ch.id, chapterLabel: ch.label, ...s }))
      )
    : [];

  function handleChapterClick(chId) {
    setActiveChapter(chId);
    const ch = DOCS.find((d) => d.id === chId);
    if (ch) setActiveSection(ch.sections[0].id);
    setSearch("");
  }

  function handleResultClick(chapterId, sectionId) {
    setActiveChapter(chapterId);
    setActiveSection(sectionId);
    setSearch("");
  }

  // Formatage du contenu (bullet lists)
  function renderContent(text) {
    return text.split("\n\n").map((para, i) => {
      const lines = para.split("\n");
      const hasBullets = lines.some((l) => l.startsWith("•"));
      if (hasBullets) {
        const intro = lines.filter((l) => !l.startsWith("•"));
        const bullets = lines.filter((l) => l.startsWith("•"));
        return (
          <div key={i} className="doc-para">
            {intro.map((l, j) => l && <p key={j}>{l}</p>)}
            <ul className="doc-list">
              {bullets.map((b, j) => (
                <li key={j}>{b.replace(/^•\s*/, "")}</li>
              ))}
            </ul>
          </div>
        );
      }
      // Numérotation
      const isNumbered = lines.every(
        (l, idx) => idx === 0 || l.match(/^\d+\./)
      );
      if (isNumbered && lines.length > 1) {
        return (
          <div key={i} className="doc-para">
            <p>{lines[0]}</p>
            <ol className="doc-list doc-list--ordered">
              {lines.slice(1).map((l, j) => (
                <li key={j}>{l.replace(/^\d+\.\s*/, "")}</li>
              ))}
            </ol>
          </div>
        );
      }
      return (
        <div key={i} className="doc-para">
          {lines.map((l, j) => (
            <p key={j}>{l}</p>
          ))}
        </div>
      );
    });
  }

  return (
    <div className="app">
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        isMobile={isMobile}
      />

      <div className="layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main
          className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}
        >
          {/* ── Titre page ── */}
          <div className="page-title">
            <h1>Documentation</h1>
            <p className="page-sub">Centre d'aide &rsaquo; Zenselekt 3.0</p>
          </div>

          <div className="doc-shell">
            {/* ── Colonne de navigation ── */}
            <aside className="doc-nav">
              {/* Barre de recherche */}
              <div className="doc-search-wrap">
                <i className="bi bi-search doc-search-icon" />
                <input
                  className="doc-search"
                  type="text"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="doc-search-clear"
                    onClick={() => setSearch("")}
                    type="button"
                  >
                    <i className="bi bi-x" />
                  </button>
                )}
              </div>

              {/* Résultats de recherche */}
              {search.trim() && (
                <div className="doc-results">
                  {searchResults.length === 0 ? (
                    <p className="doc-results-empty">Aucun résultat</p>
                  ) : (
                    searchResults.map((r) => (
                      <button
                        key={`${r.chapterId}-${r.id}`}
                        className="doc-result-item"
                        onClick={() => handleResultClick(r.chapterId, r.id)}
                        type="button"
                      >
                        <span className="doc-result-chapter">
                          {r.chapterLabel}
                        </span>
                        <span className="doc-result-title">{r.title}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Navigation par chapitres */}
              {!search.trim() && (
                <nav className="doc-chapters">
                  {DOCS.map((ch) => (
                    <div key={ch.id} className="doc-chapter-group">
                      <button
                        className={`doc-chapter-btn ${activeChapter === ch.id ? "doc-chapter-btn--active" : ""}`}
                        onClick={() => handleChapterClick(ch.id)}
                        type="button"
                      >
                        <i className={`bi ${ch.icon}`} />
                        <span>{ch.label}</span>
                      </button>

                      {activeChapter === ch.id && (
                        <div className="doc-sections">
                          {ch.sections.map((s) => (
                            <button
                              key={s.id}
                              className={`doc-section-btn ${activeSection === s.id ? "doc-section-btn--active" : ""}`}
                              onClick={() => setActiveSection(s.id)}
                              type="button"
                            >
                              {s.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
              )}
            </aside>

            {/* ── Contenu principal ── */}
            <article className="doc-content">
              {/* Breadcrumb */}
              <div className="doc-breadcrumb">
                <span>{chapter.label}</span>
                <i className="bi bi-chevron-right" />
                <span className="doc-breadcrumb-active">{section.title}</span>
              </div>

              <h2 className="doc-section-title">{section.title}</h2>
              <div className="doc-body">{renderContent(section.content)}</div>

              {/* Navigation prev / next */}
              <div className="doc-nav-btns">
                {(() => {
                  const allSections = DOCS.flatMap((ch) =>
                    ch.sections.map((s) => ({
                      ...s,
                      chapterId: ch.id,
                      chapterLabel: ch.label,
                    }))
                  );
                  const idx = allSections.findIndex(
                    (s) => s.id === activeSection && s.chapterId === activeChapter
                  );
                  const prev = allSections[idx - 1];
                  const next = allSections[idx + 1];
                  return (
                    <>
                      {prev ? (
                        <button
                          className="doc-nav-btn doc-nav-btn--prev"
                          onClick={() =>
                            handleResultClick(prev.chapterId, prev.id)
                          }
                          type="button"
                        >
                          <i className="bi bi-arrow-left" />
                          <span>
                            <em>{prev.chapterLabel}</em>
                            {prev.title}
                          </span>
                        </button>
                      ) : (
                        <div />
                      )}
                      {next ? (
                        <button
                          className="doc-nav-btn doc-nav-btn--next"
                          onClick={() =>
                            handleResultClick(next.chapterId, next.id)
                          }
                          type="button"
                        >
                          <span>
                            <em>{next.chapterLabel}</em>
                            {next.title}
                          </span>
                          <i className="bi bi-arrow-right" />
                        </button>
                      ) : (
                        <div />
                      )}
                    </>
                  );
                })()}
              </div>
            </article>
          </div>
        </main>
      </div>

      <footer
        className={`app-footer ${sidebarOpen ? "app-footer--shifted" : ""}`}
      >
        © 2025 Zenselekt · Propulsé par{" "}
        <strong>Empower talents &amp; careers</strong>. Tous droits réservés
      </footer>
    </div>
  );
}
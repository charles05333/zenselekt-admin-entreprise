import { useState, useEffect } from "react";
import Header from "./component/Header";
import Navbar from "./component/Navbar";
import "./css/Documentation.css";
import { useSessionGuard } from "./component/useSessionGuard";

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
        content: `Zenselekt 3.0 est une plateforme RH intelligente qui digitalise l'ensemble du cycle de recrutement. Grâce à son moteur de matching IA, elle analyse automatiquement les CV, identifie les meilleurs profils pour chaque poste et accompagne les recruteurs dans leurs décisions. La solution intègre également un assistant RH intelligent, des outils de gestion des candidatures, des évaluations, des entretiens et un suivi complet du processus de recrutement, offrant ainsi une expérience moderne, rapide et performante aux équipes RH.`,
      },
      {
        id: "perimetre",
        title: "Périmètre fonctionnel",
        content: `La plateforme couvre les domaines suivants :
• Gestion des offres d'emploi et des annonces
• Gestion de la candidathèque et des postulants
• Gestion des candidatures spontanées
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
  id: "dashboard",
  title: "Tableau de bord",
  content: `Le tableau de bord est la page d'accueil de votre espace Zenselekt. Il affiche en temps réel une vue synthétique de votre activité de recrutement.

Les indicateurs clés affichés sont :

- Candidats inscrits — nombre total de candidats enregistrés sur la plateforme
- Annonces postées — nombre total d'annonces publiées vous concernant
- Annonces en cours — annonces actives dont la date limite n'est pas encore dépassée
- Candidats recrutés — nombre de candidats ayant abouti à un recrutement validé
- Taux de conversion — ratio recrutés / inscrits exprimé en pourcentage avec jauge visuelle

Chaque indicateur est accompagné d'un delta mensuel (↑ hausse, ↓ baisse, → stable) pour suivre l'évolution dans le temps.

Deux graphiques interactifs sont disponibles :

- Graphique linéaire — répartition des candidats inscrits par niveau d'étude. Survolez un point pour afficher le détail.
- Graphique donut — répartition des candidats par secteur d'activité. Cliquez sur un segment ou une entrée de légende pour isoler un secteur.

Un sélecteur de période (7j, 30j, 3m, 1an) permet d'ajuster la fenêtre temporelle des données affichées sur les graphiques.

La carte d'abonnement affiche votre forfait actif, le type de facturation, les modules activés sur votre compte et l'état de l'assistant IA si celui-ci est inclus dans votre pack.`,
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
  content: `La page Gestion des annonces permet de créer, publier et administrer vos offres d'emploi.

Pour créer une offre, renseignez les informations suivantes :

• Titre du poste
• Description détaillée de l'offre
• Profil recherché
• Dates de publication et de clôture
• Niveau d'expérience requis
• Genre souhaité
• Niveau d'expertise
• Qualification académique
• Type de contrat (CDI, CDD, Stage, Freelance, etc.)
• Fiche de poste (PDF, DOC ou DOCX)

Une fois l'offre enregistrée, son statut est automatiquement défini à « En attente » jusqu'à sa validation par l'équipe Zenselekt.

La liste des offres permet également de :

• Consulter le nombre de candidatures reçues
• Modifier ou supprimer une offre
• Accéder aux postulants
• Partager l'offre sur LinkedIn
• Partager l'offre sur WhatsApp
• Copier le lien public de l'offre pour une diffusion rapide

Une barre de recherche est disponible pour retrouver facilement une offre à partir de son titre.`
},
      {
  id: "Liste des offres",
  title: "Gestion des Offres",
  content: `La page gestion des offres permet d'accéder aux candidatures reçues pour chaque offre publiée.

Pour chaque offre, les informations suivantes sont affichées :

• Titre de l'offre
• Nombre total de postulants
• Type de contrat
• Dates de publication et de clôture
• Niveau d'expérience requis
• Qualification demandée
• Niveau d'expertise
• Statut de l'offre

Depuis cette interface, vous pouvez :

• Rechercher rapidement une offre à l'aide de la barre de recherche
• Consulter le nombre de candidatures reçues pour chaque annonce
• Partager l'offre via LinkedIn
• Partager l'offre via WhatsApp
• Copier le lien public de l'offre
• Accéder à la liste des postulants en cliquant sur l'icône « Voir les postulants »

Cette page constitue le point d'entrée vers la gestion des candidatures associées à chaque offre d'emploi.`
},
     {
  id: "Postulants",
  title: "Gestion des postulants",
  content: `La page Gestion des postulants centralise toutes les candidatures reçues pour une offre d'emploi et permet de piloter l'ensemble du processus de recrutement.

Pour chaque candidat, les informations suivantes sont affichées :

- Nom et prénom
- Adresse email et téléphone
- Secteur d'activité
- Niveau académique et niveau d'anglais
- Commune et quartier
- Genre
- Documents joints (CV, lettre de motivation, diplômes)
- Score de compatibilité Empower AI (sur 100)
- Décision de recrutement en cours

Depuis cette interface, vous pouvez :

- Rechercher un candidat par nom, email, secteur ou commune
- Filtrer par secteur, niveau académique, niveau d'anglais, genre, score IA, commune, quartier ou décision
- Consulter le profil complet d'un candidat via le panneau latéral (profil, documents, décision, historique)
- Analyser un ou tous les candidats avec Empower AI pour obtenir un score et un rapport détaillé
- Modifier la décision de recrutement (retenu, entretien validé, recruté, non retenu, etc.)
- Envoyer automatiquement un email de notification au candidat lors de chaque changement de décision
- Sélectionner plusieurs candidats pour un envoi d'email groupé ou un changement de décision en lot
- Visualiser le pipeline de recrutement en vue Kanban avec déplacement par glisser-déposer
- Exporter la liste filtrée au format Excel

Cette page constitue le centre de pilotage des candidatures pour chaque offre d'emploi publiée.`,
},

     {
  id: "candidatheque",
  title: "Candidathèque générale",
  content: `La Candidathèque générale centralise l'ensemble des profils enregistrés sur la plateforme, indépendamment de toute offre spécifique.

Pour chaque candidat, les informations suivantes sont affichées :

- Nom et prénom
- Adresse email et téléphone
- Niveau académique et niveau d'anglais
- Secteur d'activité
- Genre, commune et quartier
- Nationalité et pays de résidence
- Situation matrimoniale et nombre d'enfants
- Statut dans le pipeline de recrutement
- Tags recruteur
- Documents joints (CV, lettre de motivation, diplômes)

Depuis cette interface, vous pouvez :

- Rechercher un candidat par nom, prénom, email ou secteur
- Filtrer par statut pipeline, secteur, niveau académique, niveau d'anglais, genre, commune ou quartier
- Trier les colonnes du tableau par ordre croissant ou décroissant
- Consulter la fiche complète d'un candidat via le panneau latéral
- Modifier le statut pipeline d'un candidat (Nouveau, À contacter, Entretien planifié, Retenu, Refusé, Archivé)
- Ajouter des tags et des notes recruteur personnalisés sur chaque profil
- Contacter un candidat directement par email ou WhatsApp depuis sa fiche
- Sélectionner plusieurs candidats pour changer leur statut en lot ou exporter la sélection
- Exporter la liste complète ou filtrée au format Excel

Cette page constitue le vivier de talents global de votre entreprise sur la plateforme Zenselekt.`,
},

      {
  id: "spontanees",
  title: "Candidatures spontanées",
  content: `La page Candidatures spontanées centralise toutes les candidatures reçues en dehors de toute offre d'emploi publiée.

Pour chaque candidature, les informations suivantes sont affichées :

- Nom et prénom
- Adresse email et téléphone
- Genre et date de naissance
- Secteur d'activité
- Niveau académique et niveau d'anglais
- Commune et quartier
- Date de soumission et délai depuis le dépôt
- Statut dans le pipeline de traitement
- Documents joints (CV, lettre de motivation, diplôme)
- Tags recruteur

Depuis cette interface, vous pouvez :

- Rechercher une candidature par nom, prénom, email ou secteur
- Filtrer par statut, secteur, niveau académique, niveau d'anglais, genre, période de dépôt ou présence d'un diplôme
- Trier les colonnes du tableau par ordre croissant ou décroissant
- Consulter la fiche complète d'une candidature via le panneau latéral
- Modifier le statut de traitement (Nouvelle, En cours d'examen, Entretien planifié, Retenue, Refusée, Archivée)
- Ajouter des tags et des notes recruteur personnalisés sur chaque dossier
- Contacter un candidat directement par email ou WhatsApp depuis sa fiche
- Télécharger le CV, la lettre de motivation ou le diplôme joint
- Sélectionner plusieurs candidatures pour changer leur statut en lot ou exporter la sélection
- Exporter la liste complète ou filtrée au format Excel

Cette page constitue le point d'entrée pour la gestion des candidatures reçues en dehors des offres d'emploi publiées.`,
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
  title: "Banque de tests",
  content: `La page Banque de tests centralise l'ensemble des tests disponibles sur la plateforme Zenselekt.

Pour chaque test, les informations suivantes sont affichées :

- Identifiant du test
- Titre du test
- Lien d'accès direct au test
- Description détaillée
- Date de création

Depuis cette interface, vous pouvez :

- Rechercher un test par titre ou mot-clé
- Trier les colonnes par identifiant, titre ou date de création
- Choisir le nombre d'éléments affichés par page (10, 25, 50 ou 100)
- Accéder directement à un test via son lien en cliquant sur « Accéder au test »
- Consulter la description complète de chaque test en cliquant sur « Voir plus »

Les tests disponibles sur la plateforme sont :

- Test de Pression — évalue la gestion du stress et la capacité décisionnelle sous contrainte
- Test Psychotechnique Dominos — mesure les aptitudes logiques et le raisonnement abstrait
- Test d'Anglais — évalue la maîtrise écrite en contexte professionnel (grammaire, vocabulaire, compréhension)
- Test MBTI — classifie les profils de personnalité selon 16 types
- Big Five (OCEAN) — évalue cinq dimensions fondamentales : Ouverture, Conscienciosité, Extraversion, Agréabilité, Névrosisme

Cette page constitue le référentiel des tests utilisables dans les campagnes d'évaluation.`,
},
  {
  id: "campagnes",
  title: "Campagnes d'évaluation",
  content: `La page Campagnes d'évaluation liste l'ensemble des offres d'emploi publiées et permet d'envoyer des tests aux candidats associés à chaque offre.

Pour chaque offre, les informations suivantes sont affichées :

- Titre du poste
- Nombre total de postulants
- Date de publication
- Date limite de candidature
- Expérience requise
- Genre ciblé
- Qualification demandée
- Niveau d'expertise
- Statut de l'offre (Approuvé / En attente)
- Type de contrat

Depuis cette interface, vous pouvez :

- Rechercher une offre par titre ou mot-clé
- Consulter le nombre de candidatures reçues pour chaque annonce
- Accéder à la gestion des envois de tests pour une offre en cliquant sur l'icône « Envoi des tests »

Cette page constitue le point d'entrée pour l'envoi de tests d'évaluation aux candidats de chaque offre d'emploi publiée.`,
},

      {
  id: "envoi-tests",
  title: "Envoi des tests",
  content: `La page Envoi des tests permet de sélectionner des tests et de les envoyer aux candidats d'une offre d'emploi donnée.

Pour chaque candidat, les informations suivantes sont affichées :

- Nom et prénom
- Adresse email
- Téléphone et WhatsApp
- Secteur d'activité
- Niveau académique
- Genre

Depuis cette interface, vous pouvez :

- Rechercher un candidat par nom, prénom ou email
- Filtrer les candidats par secteur d'activité ou niveau académique
- Sélectionner un ou plusieurs tests à envoyer parmi les tests actifs disponibles
- Sélectionner un ou plusieurs candidats destinataires
- Sélectionner ou désélectionner tous les candidats de la page courante
- Prévisualiser et personnaliser l'email avant l'envoi (objet, salutation, introduction, clôture, signature)
- Envoyer les tests sélectionnés aux candidats sélectionnés
- Accéder directement à la page des résultats des tests via le bouton « Résultats des tests »

L'email envoyé à chaque candidat contient un lien d'accès direct et personnalisé pour chaque test sélectionné.`,
},

{
  id: "resultats-tests",
  title: "Résultats des tests",
  content: `La page Résultats des tests affiche les résultats obtenus par les candidats d'une offre pour l'ensemble des tests qui leur ont été envoyés.

Les indicateurs clés affichés en haut de page sont :

- Nombre de candidats avec au moins un test envoyé
- Nombre de types de tests envoyés
- Nombre total de tests complétés
- Taux de complétion global

Pour chaque candidat, les informations suivantes sont affichées :

- Nom, prénom et email
- Score ou résultat pour chaque test envoyé (Test de Pression, Dominos, Anglais, MBTI, Big Five)
- Progression (nombre de tests complétés sur le nombre envoyé)

Depuis cette interface, vous pouvez :

- Rechercher un candidat par nom, prénom ou email
- Filtrer les candidats par type de test
- Choisir le nombre d'éléments affichés par page
- Consulter le détail des résultats d'un candidat en cliquant sur « Détails »
- Exporter le rapport complet d'un candidat au format Word depuis sa fiche de détail

Le rapport Word généré contient pour chaque test passé : le score obtenu, le niveau, l'interprétation détaillée et, pour le Big Five et le MBTI, une analyse narrative complète du profil.`,
},
    ],
  },
  {
    id: "preselection & entretien",
    label: "Présélection & entretien",
    icon: "bi-clipboard-check",
    sections: [
    {
  id: "postes",
  title: "Listes des postes",
  content: `La page Présélection & entretiens liste l'ensemble des offres d'emploi publiées et donne accès au pipeline complet de recrutement pour chaque poste.

Pour chaque offre, les informations suivantes sont affichées :

- Titre du poste
- Nombre total de postulants
- Boutons de partage (LinkedIn, WhatsApp)
- Date de publication et date limite de candidature
- Expérience requise, genre ciblé, qualification et niveau d'expertise
- Statut de l'offre (Approuvé / En attente)
- Type de contrat

Depuis cette interface, vous pouvez :

- Rechercher une offre par titre ou mot-clé
- Accéder au pipeline de recrutement d'un poste en cliquant sur « Accéder »
- Partager une offre via LinkedIn ou WhatsApp

Cette page constitue le point d'entrée vers la gestion complète du pipeline de recrutement pour chaque offre publiée.`,
},
{
  id: "notation",
  title: "Pipeline de recrutement",
  content: `La page Pipeline de recrutement centralise l'ensemble du processus de sélection des candidats pour un poste donné. Elle est organisée en quatre onglets.

L'onglet Présélection permet d'évaluer les candidats sur leur CV selon une grille critériée sur 100 points :

- Adéquation du profil avec le poste (25 pts)
- Expérience professionnelle pertinente (25 pts)
- Niveau de responsabilité (15 pts)
- Formation académique (10 pts)
- Compétences techniques clés (10 pts)
- Expérience dans un environnement exigeant (10 pts)
- Qualité et structuration du CV (5 pts)

Un seuil de présélection configurable détermine automatiquement si le candidat est convoqué en entretien ou rejeté. Les candidats rejetés peuvent être remis en présélection.

L'onglet Entretiens liste les candidats convoqués. Pour chaque candidat, une évaluation technique collégiale est réalisée par des examinateurs selon une grille de notation configurable. Deux étapes préalables sont requises : créer les examinateurs, puis définir la grille de notation. Une fois tous les examinateurs ayant noté, une décision finale est calculée automatiquement.

L'onglet Shortlist affiche les candidats ayant validé l'entretien, classés par score technique. Depuis cet onglet, vous pouvez recruter un candidat ou le retirer de la shortlist.

L'onglet Candidats recrutés liste les candidats marqués comme recrutés avec leur date de prise de fonction et type de contrat. Un rapport individuel exportable est disponible pour chaque candidat recruté.

Des statistiques globales (répartition par décision, genre, pays) sont accessibles via le bouton « Voir les statistiques ».`,
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
  content: `La page Gestion des utilisateurs liste l'ensemble des comptes collaborateurs ayant accès à votre espace Zenselekt.

Pour chaque utilisateur, les informations suivantes sont affichées :

- Adresse email
- Rôle attribué
- Menus accessibles
- Date de création du compte
- Statut (Actif / Inactif)

Un bandeau de quota indique le nombre d'utilisateurs créés par rapport au plafond autorisé par votre pack d'abonnement.

Depuis cette interface, vous pouvez :

- Rechercher un utilisateur par email ou rôle
- Filtrer la liste par statut (Tous, Actifs, Inactifs)
- Consulter le détail d'un utilisateur via le panneau latéral
- Modifier les informations et permissions d'un utilisateur
- Activer ou désactiver un compte
- Supprimer un utilisateur

Cette page constitue le point central de gestion des accès collaborateurs à votre espace Zenselekt.`,
},
{
  id: "creation-user",
  title: "Création d'un utilisateur",
  content: `La page Création d'un utilisateur permet d'ajouter un nouveau collaborateur à votre espace Zenselekt en trois étapes.

Étape 1 — Identifiants :

- Adresse email du collaborateur (obligatoire)
- Rôle (optionnel, ex : Responsable RH)
- Mot de passe et confirmation (minimum 7 caractères)

Étape 2 — Permissions :

Sélection des menus auxquels l'utilisateur aura accès parmi les modules disponibles selon votre abonnement : Dashboard, Gestion des offres d'emploi, Gestion des utilisateurs, Gestion des évaluations, Présélection & entretiens, Documentation. Le Dashboard est toujours actif et ne peut pas être retiré.

Étape 3 — Confirmation :

Récapitulatif complet des informations saisies avant la création définitive du compte.

La création est bloquée si le quota d'utilisateurs autorisé par votre pack est atteint. Le nombre d'emplacements disponibles est affiché en haut de la page.`,
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
Disponibilité : du lundi au vendredi, 09h–17h30 (heure d'Abidjan)`,
      },
    ],
  },
];

// ── Écran de chargement session ────────────────────────────
function SessionLoader() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#f4f6fa",
      flexDirection: "column",
      gap: 16,
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: "3px solid #e2e8f0",
        borderTop: "3px solid #1a7070",
        borderRadius: "50%",
        animation: "zen-spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes zen-spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: "#93a4c3", fontSize: 14, fontFamily: "DM Sans, sans-serif" }}>
        Vérification en cours…
      </span>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────
export default function Documentation() {
  useBootstrapIcons();

  // ✅ Guard session — même pattern qu'accueil.jsx
  const { checked } = useSessionGuard();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = () => {
      setSidebarOpen(window.innerWidth > 768);
    };
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

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

  function renderContent(text) {
    return text.split("\n\n").map((para, i) => {
      const lines = para.split("\n");

      // ── Paragraphe avec puces ──
      const hasBullets = lines.some((l) => l.startsWith("•"));
      if (hasBullets) {
        const intro = lines.filter((l) => l.trim() && !l.startsWith("•"));
        const bullets = lines.filter((l) => l.startsWith("•"));
        return (
          <div key={i} className="doc-para">
            {intro.map((l, j) => (
              <p key={j}>{l}</p>
            ))}
            <ul className="doc-list">
              {bullets.map((b, j) => (
                <li key={j}>{b.replace(/^•\s*/, "")}</li>
              ))}
            </ul>
          </div>
        );
      }

      // ── Paragraphe numéroté ──
      const bodyLines = lines.slice(1);
      const isNumbered =
        lines.length > 1 &&
        bodyLines.length > 0 &&
        bodyLines.every((l) => /^\d+\./.test(l));

      if (isNumbered) {
        return (
          <div key={i} className="doc-para">
            <p>{lines[0]}</p>
            <ol className="doc-list doc-list--ordered">
              {bodyLines.map((l, j) => (
                <li key={j}>{l.replace(/^\d+\.\s*/, "")}</li>
              ))}
            </ol>
          </div>
        );
      }

      // ── Paragraphe de texte brut ──
      return (
        <div key={i} className="doc-para">
          {lines
            .filter((l) => l.trim())
            .map((l, j) => (
              <p key={j}>{l}</p>
            ))}
        </div>
      );
    });
  }

  // ✅ Bloquer tout rendu tant que la session n'est pas confirmée
  if (!checked) {
    return <SessionLoader />;
  }

  return (
    <div className="app">
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
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
                    (s) =>
                      s.id === activeSection && s.chapterId === activeChapter
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
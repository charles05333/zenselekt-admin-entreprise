import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

/* ── Pages ── */
import Acceuil               from "./page/Acceuil.jsx";
import Offres                from "./page/offres.jsx";
import Postulants            from "./page/postulants.jsx";
import Candidatheque         from "./page/candidatheque.jsx";
import Modifier              from "./page/Modifier";
import Emploi                from "./page/emploi.jsx";
import Spontanees            from "./page/spontanees.jsx";
import CreerUtil             from "./page/creerutil.jsx";
import Utilisateurs          from "./page/utilisateurs.jsx";
import Modifierutil          from "./page/modifierutil";
import Tests                 from "./page/tests.jsx";
import Campagnes             from "./page/campagnes.jsx";
import PostulantCampagne     from "./page/postulantCampagne.jsx";
import Resultatstests        from "./page/resultatstests.jsx";
import Postes                from "./page/postes.jsx";
import Postulantsnotations   from "./page/notation/postulantsnotations.jsx";
import Evalgrid              from "./page/notation/evalgrid.jsx";
import Rapportshortlist      from "./page/notation/rapportshortlist.jsx";
import Documentation         from "./page/documentation.jsx";
import NotFound              from "./page/NotFound.jsx";

/* ── Auth (page de login — toujours accessible) ── */
import App from "./App.jsx";

/* ── Guards ── */
import ProtectedRoute from "./page/ProtectedRoute.jsx";

/* ═══════════════════════════════════════════════════════════════════════
   ROUTES DONT LE CHEMIN N'EST PAS DANS ROUTE_PERMISSION_MAP
   (pages internes liées à une route protégée parente)
   → on les protège via le parent le plus proche

   /modifier/:id        → dépend de "offres"        (permId annonces)
   /modifierutil/:id    → dépend de "utilisateurs"  (permId liste-util)
   /postulants          → dépend de "emploi"         (permId emploi)
   /postulantcampagne   → dépend de "campagnes"      (permId campagnes)
   /resultatstests      → dépend de "campagnes"      (permId campagnes)
   /postulantsnotations → dépend de "postes"         (permId postes)
   /evalgrid            → dépend de "postes"         (permId postes)
   /rapportshortlist    → dépend de "postes"         (permId postes)
═══════════════════════════════════════════════════════════════════════ */

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename="/securebackoffice">
      <Routes>

        {/* ── Login — public, aucune protection ── */}
        <Route path="/" element={<App />} />

        {/* ════════════════════════════════════════════════════════
            DASHBOARD — toujours accessible après login
        ════════════════════════════════════════════════════════ */}
        <Route
          path="/acceuil"
          element={
            <ProtectedRoute path="/acceuil">
              <Acceuil />
            </ProtectedRoute>
          }
        />

        {/* ════════════════════════════════════════════════════════
            GESTION DES OFFRES D'EMPLOI
        ════════════════════════════════════════════════════════ */}
        <Route
          path="/offres"
          element={
            <ProtectedRoute path="/offres">
              <Offres />
            </ProtectedRoute>
          }
        />

        {/* /modifier/:id — sous-page de /offres */}
        <Route
          path="/modifier/:id"
          element={
            <ProtectedRoute path="/offres">
              <Modifier />
            </ProtectedRoute>
          }
        />

        <Route
          path="/emploi"
          element={
            <ProtectedRoute path="/emploi">
              <Emploi />
            </ProtectedRoute>
          }
        />

        {/* /postulants — sous-page de /emploi */}
        <Route
          path="/postulants"
          element={
            <ProtectedRoute path="/emploi">
              <Postulants />
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidatheque"
          element={
            <ProtectedRoute path="/candidatheque">
              <Candidatheque />
            </ProtectedRoute>
          }
        />

        <Route
          path="/spontanees"
          element={
            <ProtectedRoute path="/spontanees">
              <Spontanees />
            </ProtectedRoute>
          }
        />

        {/* ════════════════════════════════════════════════════════
            GESTION DES UTILISATEURS
        ════════════════════════════════════════════════════════ */}
        <Route
          path="/utilisateurs"
          element={
            <ProtectedRoute path="/utilisateurs">
              <Utilisateurs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/creerutil"
          element={
            <ProtectedRoute path="/creerutil">
              <CreerUtil />
            </ProtectedRoute>
          }
        />

        {/* /modifierutil/:id — sous-page de /utilisateurs */}
        <Route
          path="/modifierutil/:id"
          element={
            <ProtectedRoute path="/utilisateurs">
              <Modifierutil />
            </ProtectedRoute>
          }
        />

        {/* ════════════════════════════════════════════════════════
            GESTION DES ÉVALUATIONS
        ════════════════════════════════════════════════════════ */}
        <Route
          path="/tests"
          element={
            <ProtectedRoute path="/tests">
              <Tests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/campagnes"
          element={
            <ProtectedRoute path="/campagnes">
              <Campagnes />
            </ProtectedRoute>
          }
        />

        {/* /postulantcampagne — sous-page de /campagnes */}
        <Route
          path="/postulantcampagne"
          element={
            <ProtectedRoute path="/campagnes">
              <PostulantCampagne />
            </ProtectedRoute>
          }
        />

        {/* /resultatstests — sous-page de /campagnes */}
        <Route
          path="/resultatstests"
          element={
            <ProtectedRoute path="/campagnes">
              <Resultatstests />
            </ProtectedRoute>
          }
        />

        {/* ════════════════════════════════════════════════════════
            PRÉSELECTION & ENTRETIENS
        ════════════════════════════════════════════════════════ */}
        <Route
          path="/postes"
          element={
            <ProtectedRoute path="/postes">
              <Postes />
            </ProtectedRoute>
          }
        />

        {/* /postulantsnotations/:eventId — sous-page de /postes */}
        <Route
          path="/postulantsnotations/:eventId"
          element={
            <ProtectedRoute path="/postes">
              <Postulantsnotations />
            </ProtectedRoute>
          }
        />

        {/* /evalgrid — sous-page de /postes */}
        <Route
          path="/evalgrid"
          element={
            <ProtectedRoute path="/postes">
              <Evalgrid />
            </ProtectedRoute>
          }
        />

        {/* /rapportshortlist — sous-page de /postes */}
        <Route
          path="/rapportshortlist"
          element={
            <ProtectedRoute path="/postes">
              <Rapportshortlist />
            </ProtectedRoute>
          }
        />

        {/* ════════════════════════════════════════════════════════
            DOCUMENTATION
        ════════════════════════════════════════════════════════ */}
        <Route
          path="/documentation"
          element={
            <ProtectedRoute path="/documentation">
              <Documentation />
            </ProtectedRoute>
          }
        />

        {/* ════════════════════════════════════════════════════════
            404 — route inconnue
        ════════════════════════════════════════════════════════ */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <BrowserRouter basename="/securebackoffice">
//       <Routes>
//         <Route path="/" element={<App />} />
//         <Route path="/acceuil" element={<Acceuil />} />
//         <Route path="/offres" element={<Offres />} />
//         <Route path="/modifier/:id" element={<Modifier />} />
//         <Route path="/emploi" element={<Emploi />} />
 // <Route path="/postulants" element={<Postulants />} />
      //  <Route path="/candidatheque" element={<Candidatheque />} />
      //  <Route path="/spontanees" element={<Spontanees />} />
      //  <Route path="/creerutil" element={<CreerUtil />} />
      //  <Route path="/utilisateurs" element={<Utilisateurs />} />
       // <Route path="/tests" element={<Tests />} />
       //  <Route path="/pression" element={<Pression />} />
      //   <Route path="/mbti" element={<MBTI />} />
        // <Route path="/bigfive" element={<Bigfive />} />
       //  <Route path="/domino" element={<DOMINO />} />
       //  <Route path="/anglais" element={<Anglais />} />
//       </Routes>
//     </BrowserRouter>
//   </React.StrictMode>
// );
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Acceuil from "./page/Acceuil.jsx";
import Offres from "./page/offres.jsx";
import Postulants from "./page/postulants.jsx";
import Candidatheque from "./page/candidatheque.jsx";
import Modifier from "./page/Modifier";
import Emploi from "./page/emploi.jsx";
import Spontanees from "./page/spontanees.jsx";
import CreerUtil from "./page/creerutil.jsx";
import Utilisateurs from "./page/utilisateurs.jsx";
import Modifierutil from "./page/modifierutil";
import Tests from "./page/tests.jsx";
import Pression from "./page/tests/pression.jsx";
import MBTI from "./page/tests/mbti.jsx";
import DOMINO from "./page/tests/domino.jsx";
import Bigfive from "./page/tests/bigfive.jsx";
import Anglais from "./page/tests/anglais.jsx";
import Campagnes from "./page/campagnes.jsx";
import PostulantCampagne from "./page/postulantCampagne.jsx"; 
import Resultatstests from "./page/resultatstests.jsx";
import Postes from "./page/postes.jsx";
import Postulantsnotations from "./page/notation/postulantsnotations.jsx";
import Evalgrid from './page/notation/evalgrid.jsx';
import Rapportshortlist from './page/notation/rapportshortlist.jsx';
import Documentation from "./page/documentation.jsx";



// Pages
import App from "./App.jsx";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/acceuil" element={<Acceuil />} />
        <Route path="/offres" element={<Offres />} />
        <Route path="/modifier/:id" element={<Modifier />} />
          <Route path="/modifierutil/:id" element={<Modifierutil />} />
        <Route path="/emploi" element={<Emploi />} />
        <Route path="/postulants" element={<Postulants />} />
        <Route path="/candidatheque" element={<Candidatheque />} />
        <Route path="/spontanees" element={<Spontanees />} />
        <Route path="/creerutil" element={<CreerUtil />} />
        <Route path="/utilisateurs" element={<Utilisateurs />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/pression" element={<Pression />} />
        <Route path="/mbti" element={<MBTI />} />
        <Route path="/bigfive" element={<Bigfive />} />
        <Route path="/domino" element={<DOMINO />} />
        <Route path="/anglais" element={<Anglais />} />
        <Route path="/campagnes" element={<Campagnes />} />
        <Route path="/postulantcampagne" element={<PostulantCampagne />} />
        <Route path="/resultatstests" element={<Resultatstests />} />
        <Route path="/postes" element={<Postes />} />
         <Route path="/postulantsnotations/:eventId" element={<Postulantsnotations />} />
          <Route path="/evalgrid" element={<Evalgrid />} />
          <Route path="/rapportshortlist" element={<Rapportshortlist />} />
        <Route path="/documentation" element={<Documentation />} />
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
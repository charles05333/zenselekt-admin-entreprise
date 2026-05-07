import { useState, useEffect, useRef, useCallback } from "react";
import './css/mbti.css';
import Swal from "sweetalert2";
import loImg from "./images/logo_empower.png";

// ── Bootstrap Icons ───────────────────────────────────────
const BI_CDN = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";

// ── Questions MBTI ────────────────────────────────────────
const PARTS = [
  {
    key: "part1",
    label: "Partie 1",
    leftLetter: "e",
    rightLetter: "i",
    title: "Extraversion (E) vs Introversion (I)",
    questions: [
      { left: "Vous êtes dynamique", right: "Vous êtes calme" },
      { left: "Vous aimez parler", right: "Vous aimez écouter" },
      { left: "Vous pensez à voix haute", right: "Vous réfléchissez posément" },
      { left: "Vous agissez, puis pensez", right: "Vous pensez, puis agissez" },
      { left: "Vous n'aimez pas être seul", right: "Vous vous sentez bien quand vous êtes seul" },
      { left: "Vous aimez établir de nouveaux contacts", right: "Vous préférez approfondir les contacts existants" },
      { left: "Vous préférez parler plutôt qu'écrire", right: "Vous êtes considéré comme plutôt secret et réservé" },
      { left: "Vous pouvez facilement être distrait", right: "Vous possédez une bonne capacité de concentration" },
      { left: "Vous préférez faire plusieurs choses à la fois", right: "Vous préférez vous concentrer sur une seule chose à la fois" },
      { left: "Vous avez parfois un discours changeant", right: "Vous êtes indépendant" },
    ],
  },
  {
    key: "part2",
    label: "Partie 2",
    leftLetter: "s",
    rightLetter: "n",
    title: "Sensation (S) vs Intuition (N)",
    questions: [
      { left: "Vous vous attachez aux faits et détails", right: "Vous vous intéressez aux idées" },
      { left: "Vous aimez les choses utiles", right: "Vous remarquez tout ce qui est nouveau et différent" },
      { left: "Vous vivez dans l'instant présent", right: "Vous pensez aux implications futures" },
      { left: "Vous faites confiance à l'expérience", right: "Vous suivez votre instinct" },
      { left: "Vous aimez approfondir vos compétences", right: "Vous aimez apprendre de nouvelles compétences" },
      { left: "Vous restez fidèle aux méthodes éprouvées", right: "Vous n'aimez pas la routine" },
      { left: "Vous préférez les instructions étape par étape", right: "Vous cherchez à comprendre" },
      { left: "Vous êtes pratique", right: "Vous êtes théorique" },
      { left: "Vous aimez ce qui est concret, réel, directement observable", right: "Vous êtes attiré par les idées originales" },
      { left: "Vous êtes réaliste : vous voyez ce qui existe", right: "Vous êtes imaginatif : vous voyez les possibilités" },
    ],
  },
  {
    key: "part3",
    label: "Partie 3",
    leftLetter: "t",
    rightLetter: "f",
    title: "Pensée (T) vs Sentiment (F)",
    questions: [
      { left: "Vous vous efforcez d'être objectif dans vos décisions", right: "Vous fondez vos décisions sur vos valeurs et vos sentiments" },
      { left: "Vous apparaissez calme et réservé", right: "Vous êtes sociable et amical" },
      { left: "Vous avez un sens aigu de la justice", right: "Vous avez tendance à la clémence" },
      { left: "Vous vous impliquez peu, vous prenez de la distance", right: "Vous prenez les choses à cœur" },
      { left: "Vous êtes critique (vous remarquez vite les failles et les défauts)", right: "Vous tentez de faire plaisir (prompt à faire des compliments)" },
      { left: "Vous adorez argumenter pour le plaisir", right: "Vous évitez la discussion et le conflit" },
      { left: "Vous êtes franc et direct", right: "Vous êtes diplomate et faites preuve de tact" },
      { left: "Vous êtes motivé par vos projets", right: "Vous êtes motivé par l'estime des autres" },
      { left: "Vous aimez vous placer en observateur", right: "Vous êtes sensible (facilement blessé)" },
      { left: "Vous êtes sensible à la logique", right: "Vous faites confiance à vos impressions" },
    ],
  },
  {
    key: "part4",
    label: "Partie 4",
    leftLetter: "j",
    rightLetter: "p",
    title: "Jugement (J) vs Perception (P)",
    questions: [
      { left: "Vous aimez organiser et planifier", right: "Vous aimez vivre de façon flexible" },
      { left: "Vous êtes sérieux et conventionnel", right: "Vous êtes ludique et non-conventionnel" },
      { left: "Vous suivez votre calendrier et êtes parfaitement ponctuel", right: "Vous n'avez ni heure ni délais" },
      { left: "Vous aimez terminer vos projets", right: "Vous aimez démarrer des projets" },
      { left: "Vous travaillez d'abord, vous vous amusez ensuite", right: "Vous vous amusez d'abord et travaillez ensuite" },
      { left: "Vous n'aimez pas le stress de dernière minute", right: "Vous rechignez à vous engager" },
      { left: "Vous ne discutez pas les règles", right: "Vous discutez les règles" },
      { left: "Vous cherchez à maîtriser", right: "Vous cherchez à comprendre" },
      { left: "Vous êtes à l'aise au sein de structures bien définies", right: "Vous aimez conserver votre liberté d'action" },
      { left: "Vous n'aimez pas le provisoire, l'incertain", right: "Vous restez ouvert, aimez vivre des expériences, vous adapter" },
    ],
  },
];

const TOTAL_QUESTIONS = PARTS.reduce((acc, p) => acc + p.questions.length, 0); // 40

// ── Composant Progression ─────────────────────────────────
function ProgressBar({ answered, total }) {
  const pct = Math.round((answered / total) * 100);
  return (
    <div className="mb-progress-wrap">
      <div className="mb-progress-info">
        <span><strong>{answered}</strong> / {total} réponses</span>
        <span className="mb-progress-pct">{pct}%</span>
      </div>
      <div className="mb-progress-track">
        <div className="mb-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Composant Succès ──────────────────────────────────────
function SuccessScreen({ prenom, nom, genre }) {
  const civilite = genre === "M" ? "M." : "Mme";
  return (
    <div className="mb-success">
      <div className="mb-success-icon">
        <i className="bi bi-check-circle-fill" />
      </div>
      <h2>Merci {civilite} {prenom} {nom} !</h2>
      <p>Votre test MBTI a été soumis avec succès.</p>
      <span>Vos résultats seront consultés par notre équipe.</span>
    </div>
  );
}

// ── Composant DéjàPassé ───────────────────────────────────
function AlreadyTakenScreen({ date }) {
  return (
    <div className="mb-success">
      <div className="mb-success-icon mb-success-icon--info">
        <i className="bi bi-info-circle-fill" />
      </div>
      <h2>Test déjà passé</h2>
      <p>Vous avez déjà passé ce test{date ? ` le ${date}` : ""}.</p>
      <span>Vous ne pouvez passer ce test qu'une seule fois.</span>
    </div>
  );
}

// ── App principale ────────────────────────────────────────
export default function MBTI() {
  // Inject Bootstrap Icons
  useEffect(() => {
    if (!document.querySelector(`link[href="${BI_CDN}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet"; link.href = BI_CDN;
      document.head.appendChild(link);
    }
  }, []);

  // Lire les params URL
  const urlParams = new URLSearchParams(window.location.search);
  const initPrenom = urlParams.get("prenoms") || "";
  const initNom    = urlParams.get("nom")     || "";
  const initEmail  = urlParams.get("email")   || "";
  const initPoste  = urlParams.get("poste")   || "";
  const offreId    = urlParams.get("offre_id") || "";

  const [prenom] = useState(initPrenom);
  const [nom]    = useState(initNom);
  const [email]  = useState(initEmail);
  const [poste]  = useState(initPoste);
  const [genre, setGenre] = useState("");

  // Phase : "identity" | "test" | "submitted"
  const [phase, setPhase]               = useState("identity");
  const [currentPartIdx, setCurrentPartIdx] = useState(0);

  const [answers, setAnswers]           = useState({});
  const [submitted, setSubmitted]       = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [alreadyDate, setAlreadyDate]   = useState("");
  const [loading, setLoading]           = useState(false);

  const startTimeRef = useRef(null);

  // Vérifier si test déjà passé
  useEffect(() => {
    if (!email) return;
    fetch("check_test_taken_mbti.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, offre_id: offreId }),
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.already_taken) {
          setAlreadyTaken(true);
          setAlreadyDate(result.date_passage || "");
        }
      })
      .catch(() => {});
  }, [email, offreId]);

  // Empêcher retour arrière
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handler = () => {
      if (!submitted) window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [submitted]);

  // Nombre de réponses
  const answeredCount = Object.keys(answers).length;

  // Réponse à une question
  const handleAnswer = useCallback((key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Démarrer le test
  function handleStartTest() {
    if (!genre) {
      Swal.fire({
        icon: "error",
        title: "Champs requis",
        text: "Veuillez sélectionner votre genre.",
        confirmButtonColor: "#6C0277",
      });
      return;
    }
    startTimeRef.current = new Date();
    setPhase("test");
    setCurrentPartIdx(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Vérifier que toutes les questions de la partie courante sont répondues
  function currentPartAllAnswered() {
    const part = PARTS[currentPartIdx];
    return part.questions.every((_, qIdx) => answers[`${part.key}_${qIdx}`] !== undefined);
  }

  // Partie suivante
  function handleNextPart() {
    if (!currentPartAllAnswered()) {
      Swal.fire({
        icon: "warning",
        title: "Questions non répondues",
        text: "Veuillez répondre à toutes les questions de cette partie avant de continuer.",
        confirmButtonColor: "#6C0277",
      });
      return;
    }
    setCurrentPartIdx((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Partie précédente
  function handlePrevPart() {
    setCurrentPartIdx((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Valider l'équilibre gauche/droite
  function validateBalance() {
    const errors = [];
    PARTS.forEach((part) => {
      let countLeft = 0, countRight = 0;
      part.questions.forEach((_, qIdx) => {
        const val = answers[`${part.key}_${qIdx}`];
        if (val === part.leftLetter) countLeft++;
        if (val === part.rightLetter) countRight++;
      });
      if (countLeft === countRight) {
        errors.push(`${part.label} : ${countLeft} à gauche = ${countRight} à droite`);
      }
    });
    return errors;
  }

  // Soumettre le test
  async function handleSubmit() {
    if (submitted || loading) return;

    // Vérifier toutes les questions
    if (answeredCount < TOTAL_QUESTIONS) {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Questions non répondues",
        text: `Vous avez répondu à ${answeredCount}/${TOTAL_QUESTIONS} questions. Soumettre quand même ?`,
        showCancelButton: true,
        confirmButtonText: "Continuer",
        cancelButtonText: "Soumettre quand même",
        confirmButtonColor: "#6C0277",
        cancelButtonColor: "#dc2626",
      });
      if (confirm.isConfirmed) return;
    }

    // Vérifier l'équilibre
    const balanceErrors = validateBalance();
    if (balanceErrors.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Erreur de validation",
        html: `
          <p style="margin-bottom:12px;">Le nombre de cases cochées à gauche ne doit <strong>pas</strong> être égal au nombre à droite pour chaque partie :</p>
          ${balanceErrors.map((e) => `<div style="color:#dc2626;margin:6px 0;">❌ ${e}</div>`).join("")}
        `,
        confirmButtonColor: "#6C0277",
      });
      return;
    }

    // Calcul scores
    const scores = { e: 0, i: 0, s: 0, n: 0, t: 0, f: 0, j: 0, p: 0 };
    Object.values(answers).forEach((v) => {
      if (scores.hasOwnProperty(v)) scores[v]++;
    });

    setLoading(true);

    const timeSpent = Math.floor((new Date() - startTimeRef.current) / 1000);
    const data = {
      firstName: prenom,
      lastName: nom,
      email,
      genre,
      titrePoste: poste,
      offreId: offreId || null,
      scores,
      answers,
      startTime: startTimeRef.current.toISOString(),
      timeSpent,
    };

    try {
      const response = await fetch("save_test_mbti_results.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        setSubmitted(true);
      } else if (result.error_code === "TEST_ALREADY_TAKEN") {
        setLoading(false);
        Swal.fire({
          icon: "info",
          title: "Test déjà passé",
          text: result.message,
          confirmButtonColor: "#6C0277",
        });
      } else {
        throw new Error(result.message || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible de sauvegarder les résultats.",
        confirmButtonColor: "#6C0277",
      });
    }
  }

  // ── Rendu ────────────────────────────────────────────────
  if (alreadyTaken) {
    return (
      <div className="mb-page">
        <header className="mb-header">
          <img src={loImg} alt="Logo Empower" className="mb-logo" />
        </header>
        <div className="mb-container">
          <AlreadyTakenScreen date={alreadyDate} />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mb-page">
        <header className="mb-header">
          <img src={loImg} alt="Logo Empower" className="mb-logo" />
        </header>
        <div className="mb-container">
          <SuccessScreen prenom={prenom} nom={nom} genre={genre} />
        </div>
      </div>
    );
  }

  const currentPart = PARTS[currentPartIdx];
  const isLastPart  = currentPartIdx === PARTS.length - 1;

  return (
    <div className="mb-page">
      {/* Header fixe */}
      <header className="mb-header">
        <img src={loImg} alt="Logo Empower" className="mb-logo" />
        <div className="mb-header-title">Test de personnalité MBTI</div>
      </header>

      <div className="mb-container">

        {/* ── Phase Identité ── */}
        {phase === "identity" && (
          <>
            <div className="mb-section-header">
              <i className="bi bi-person-badge"></i>
              <span>Identité du candidat</span>
            </div>

            <div className="mb-card mb-identity-card">
              <div className="mb-notice">
                <i className="bi bi-info-circle"></i>
                <div>
                  <span>Choisissez sur chaque ligne la phrase qui vous correspond le mieux.</span>
                  <br />
                  <strong>Le nombre de cases cochées à gauche ne doit pas être égal au nombre de cases cochées à droite pour chaque partie.</strong>
                </div>
              </div>

              <div className="mb-form-row">
                <div className="mb-form-group">
                  <label className="mb-label">Prénom(s)</label>
                  <input className="mb-input mb-input--readonly" type="text" value={prenom} readOnly />
                </div>
                <div className="mb-form-group">
                  <label className="mb-label">Nom de famille</label>
                  <input className="mb-input mb-input--readonly" type="text" value={nom} readOnly />
                </div>
              </div>

              <div className="mb-form-row">
                <div className="mb-form-group">
                  <label className="mb-label">Adresse e-mail</label>
                  <input className="mb-input mb-input--readonly" type="email" value={email} readOnly />
                </div>
                <div className="mb-form-group">
                  <label className="mb-label">Genre <span className="mb-required">*</span></label>
                  <select className="mb-input mb-select" value={genre} onChange={(e) => setGenre(e.target.value)}>
                    <option value="">Sélectionnez...</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>

              {poste && (
                <div className="mb-form-row mb-form-row--single">
                  <div className="mb-form-group">
                    <label className="mb-label">Poste concerné</label>
                    <input className="mb-input mb-input--readonly" type="text" value={poste} readOnly />
                  </div>
                </div>
              )}

              <div className="mb-start-wrap">
                <button className="mb-start-btn" onClick={handleStartTest}>
                  <i className="bi bi-play-circle-fill"></i> Commencer le test
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Phase Test ── */}
        {phase === "test" && (
          <>
            {/* Progression sticky */}
            <div className="mb-sticky-progress">
              <ProgressBar answered={answeredCount} total={TOTAL_QUESTIONS} />
            </div>

            {/* Stepper parties */}
            <div className="mb-stepper">
              {PARTS.map((p, idx) => {
                const partAnswered = p.questions.every((_, qIdx) => answers[`${p.key}_${qIdx}`] !== undefined);
                return (
                  <div
                    key={p.key}
                    className={`mb-step ${idx === currentPartIdx ? "mb-step--active" : ""} ${partAnswered ? "mb-step--done" : ""}`}
                  >
                    <div className="mb-step-dot">
                      {partAnswered ? <i className="bi bi-check2"></i> : idx + 1}
                    </div>
                    <span className="mb-step-label">{p.label}</span>
                  </div>
                );
              })}
            </div>

            {/* En-tête partie courante */}
            <div className="mb-section-header">
              <i className="bi bi-chat-square-text"></i>
              <span>{currentPart.label} — {currentPart.title}</span>
            </div>

            {/* Questions */}
            <div className="mb-questions-list">
              {currentPart.questions.map((q, qIdx) => {
                const key = `${currentPart.key}_${qIdx}`;
                const selected = answers[key];
                const questionNum = currentPartIdx * 10 + qIdx + 1;
                return (
                  <div
                    key={key}
                    className={`mb-card mb-question-card ${selected ? "mb-question-card--answered" : ""}`}
                  >
                    <div className="mb-question-meta">
                      <span className="mb-question-num">Question {questionNum}</span>
                      {selected && (
                        <span className="mb-answered-badge">
                          <i className="bi bi-check2"></i> Répondu
                        </span>
                      )}
                    </div>

                    <div className="mb-dual-options">
                      {/* Option Gauche */}
                      <label
                        className={`mb-dual-option mb-dual-option--left ${selected === currentPart.leftLetter ? "mb-dual-option--selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name={key}
                          value={currentPart.leftLetter}
                          checked={selected === currentPart.leftLetter}
                          onChange={() => handleAnswer(key, currentPart.leftLetter)}
                        />
                        <span className="mb-dual-radio"></span>
                        <span className="mb-dual-text">{q.left}</span>
                      </label>

                      {/* Séparateur */}
                      <div className="mb-dual-separator">
                        <span>ou</span>
                      </div>

                      {/* Option Droite */}
                      <label
                        className={`mb-dual-option mb-dual-option--right ${selected === currentPart.rightLetter ? "mb-dual-option--selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name={key}
                          value={currentPart.rightLetter}
                          checked={selected === currentPart.rightLetter}
                          onChange={() => handleAnswer(key, currentPart.rightLetter)}
                        />
                        <span className="mb-dual-radio"></span>
                        <span className="mb-dual-text">{q.right}</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="mb-nav-wrap">
              {currentPartIdx > 0 && (
                <button className="mb-nav-btn mb-nav-btn--prev" onClick={handlePrevPart}>
                  <i className="bi bi-arrow-left"></i> Partie précédente
                </button>
              )}

              {!isLastPart ? (
                <button className="mb-nav-btn mb-nav-btn--next" onClick={handleNextPart}>
                  Partie suivante <i className="bi bi-arrow-right"></i>
                </button>
              ) : (
                <div className="mb-submit-wrap">
                  <div className="mb-submit-info">
                    {answeredCount < TOTAL_QUESTIONS && (
                      <span className="mb-submit-warning">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        {TOTAL_QUESTIONS - answeredCount} question{TOTAL_QUESTIONS - answeredCount > 1 ? "s" : ""} sans réponse
                      </span>
                    )}
                  </div>
                  <button
                    className={`mb-submit-btn ${loading ? "mb-submit-btn--loading" : ""}`}
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="mb-spinner"></span> Envoi en cours…</>
                    ) : (
                      <><i className="bi bi-check-circle-fill"></i> Valider le test</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
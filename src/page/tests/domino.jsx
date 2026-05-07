import { useState, useEffect, useRef, useCallback } from "react";
import './css/domino.css';
import Swal from "sweetalert2";
import loImg from "./images/logo_empower.png";

const BI_CDN = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";

const SERIES = [
  {
    title: "Série 1",
    question: [[1,3], [5,4], [5,6]],
    answer: [5,4],
    options: [[1,2], [4,4], [1,1], [5,4]],
    solution: "Il s'agissait d'une symétrie axiale"
  },
  {
    title: "Série 2",
    question: [[3,3], [2,1], [4,2]],
    answer: [5,4],
    options: [[5,4], [3,3], [2,2], [1,5]],
    solution: "Il s'agissait d'une superposition visuelle"
  },
  {
    title: "Série 3",
    question: [[1,2], [3,1], [5,0]],
    answer: [0,2],
    options: [[0,2], [2,3], [4,1], [1,1]],
    solution: "Il s'agissait d'une progression croisée en diagonale: +2 / -1"
  },
  {
    title: "Série 4",
    question: [[2,3], [1,2], [2,6]],
    answer: [1,4],
    options: [[1,4], [3,2], [2,5], [4,1]],
    solution: "Il s'agissait d'une multiplication"
  },
  {
    title: "Série 5",
    question: [[4,2], [2,3], [5,4]],
    answer: [6,5],
    options: [[6,5], [4,3], [3,4], [5,2]],
    solution: "Il s'agissait d'une superposition visuelle"
  },
  {
    title: "Série 6",
    question: [[2,3], [3,2], [4,1]],
    answer: [1,4],
    options: [[1,4], [5,0], [3,3], [2,2]],
    solution: "Il s'agissait d'une progression croisée en diagonale: +1 / -1"
  },
  {
    title: "Série 7",
    question: [[1,2], [3,4], [5,6]],
    answer: [3,4],
    options: [[3,4], [1,2], [6,5], [4,3]],
    solution: "Il s'agissait d'une Similarité"
  },
  {
    title: "Série 8",
    question: [[0,1], [1,0], [2,6]],
    answer: [3,5],
    options: [[3,5], [2,4], [4,6], [1,3]],
    solution: "Il s'agissait d'une progression croisée en diagonale: +1 / -1"
  },
  {
    title: "Série 9",
    question: [[6,1], [5,2], [4,3]],
    answer: [4,3],
    options: [[4,3], [3,4], [2,5], [1,6]],
    solution: "Il s'agissait d'une symétrie axiale"
  },
  {
    title: "Série 10",
    question: [[6,6], [3,3], [0,0]],
    answer: [3,3],
    options: [[3,3], [4,4], [2,2], [5,5]],
    solution: "Il s'agissait d'une progression simple: -3 en haut, -3 en bas"
  }
];

const TOTAL_SERIES = SERIES.length;
const TIMER_SECONDS = 600; // 10 minutes

// ── Domino dot positions (en % dans la zone de dots) ─────
const DOT_POSITIONS = {
  0: [],
  1: [[50, 50]],
  2: [[30, 28], [70, 72]],
  3: [[30, 22], [50, 50], [70, 78]],
  4: [[28, 26], [72, 26], [28, 74], [72, 74]],
  5: [[28, 22], [72, 22], [50, 50], [28, 78], [72, 78]],
  6: [[28, 18], [72, 18], [28, 50], [72, 50], [28, 82], [72, 82]],
};

// ── Composant Dots ────────────────────────────────────────
function DominoDots({ count }) {
  const positions = DOT_POSITIONS[count] || [];
  return (
    <div className="dn-dots-field">
      {positions.map(([left, top], i) => (
        <span
          key={i}
          className="dn-dot"
          style={{ left: `${left}%`, top: `${top}%` }}
        />
      ))}
    </div>
  );
}

// ── Composant Domino ──────────────────────────────────────
function DominoPiece({
  top,
  bottom,
  isQuestion = false,
  isSelected = false,
  isOption = false,
  onClick
}) {
  return (
    <div
      className={[
        "dn-domino",
        isOption ? "dn-domino--option" : "",
        isSelected ? "dn-domino--selected" : "",
      ].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      {/* Moitié supérieure */}
      <div className="dn-half">
        {isQuestion ? (
          <span className="dn-question-mark">?</span>
        ) : (
          <DominoDots count={top} />
        )}
      </div>

      {/* Séparateur */}
      <div className="dn-divider" />

      {/* Moitié inférieure */}
      <div className="dn-half">
        {isQuestion ? (
          <span className="dn-question-mark">?</span>
        ) : (
          <DominoDots count={bottom} />
        )}
      </div>
    </div>
  );
}

// ── Composant Timer ───────────────────────────────────────
function TimerDisplay({ seconds }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds <= 60;
  return (
    <div className={`dn-timer ${isUrgent ? "dn-timer--urgent" : ""}`}>
      <i className="bi bi-clock"></i>
      <span>{mins}:{secs.toString().padStart(2, "0")}</span>
      <span className="dn-timer-label">minutes : secondes</span>
    </div>
  );
}

// ── Composant Progression ─────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="dn-progress-wrap">
      <div className="dn-progress-info">
        <span><strong>{current}</strong> / {total} séries</span>
        <span className="dn-progress-pct">{pct}%</span>
      </div>
      <div className="dn-progress-track">
        <div className="dn-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Composant Succès ──────────────────────────────────────
function SuccessScreen({ prenom, genre }) {
  const civilite = genre === "M" ? "M." : genre === "F" ? "Mme" : "";
  return (
    <div className="dn-success">
      <div className="dn-success-icon">
        <i className="bi bi-check-circle-fill" />
      </div>
      <h2>Test soumis avec succès</h2>
      <p>Merci {[civilite, prenom].filter(Boolean).join(" ") || "!"}</p>
      <span>Vos résultats ont été enregistrés et seront analysés par notre équipe.</span>
    </div>
  );
}

// ── Composant Déjà Passé ──────────────────────────────────
function AlreadyTakenScreen() {
  return (
    <div className="dn-success">
      <div className="dn-success-icon dn-success-icon--info">
        <i className="bi bi-info-circle-fill" />
      </div>
      <h2>Test déjà complété</h2>
      <p>Vous avez déjà passé ce test.</p>
      <span>Vous ne pouvez passer ce test qu'une seule fois.</span>
    </div>
  );
}

// ── App principale ────────────────────────────────────────
export default function Domino() {
  useEffect(() => {
    if (!document.querySelector(`link[href="${BI_CDN}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet"; link.href = BI_CDN;
      document.head.appendChild(link);
    }
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const initPrenom = urlParams.get("prenoms") || "";
  const initNom    = urlParams.get("nom")     || "";
  const initEmail  = urlParams.get("email")   || "";
  const initGenre  = urlParams.get("genre")   || "";
  const initPoste  = urlParams.get("poste")   || "";
  const offreId    = urlParams.get("offre_id") || "";

  const prenomFromUrl = Boolean(urlParams.get("prenoms"));
  const nomFromUrl    = Boolean(urlParams.get("nom"));
  const emailFromUrl  = Boolean(urlParams.get("email"));
  const genreFromUrl  = Boolean(urlParams.get("genre"));

  const [prenom, setPrenom] = useState(initPrenom);
  const [nom, setNom]       = useState(initNom);
  const [email, setEmail]   = useState(initEmail);
  const [genre, setGenre]   = useState(initGenre);

  // phase: "identity" | "test" | "submitted"
  const [phase, setPhase]               = useState("identity");
  const [currentSeries, setCurrentSeries] = useState(0);
  const [userAnswers, setUserAnswers]   = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted]       = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [timeLeft, setTimeLeft]         = useState(TIMER_SECONDS);

  const startTimeRef  = useRef(null);
  const timerRef      = useRef(null);

  // Vérifier si test déjà passé
  useEffect(() => {
    if (!initEmail) return;
    fetch("check_test_taken_Domino.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: initEmail, offre_id: offreId }),
    })
      .then((r) => r.json())
      .then((result) => { if (result.already_taken) setAlreadyTaken(true); })
      .catch(() => {});
  }, [initEmail, offreId]);

  // Empêcher retour arrière
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handler = () => {
      if (!submitted) window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [submitted]);

  // Timer
  useEffect(() => {
    if (phase !== "test") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          endTest();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const endTest = useCallback(async () => {
    if (submitted) return;
    clearInterval(timerRef.current);
    setUserAnswers((prev) => {
      saveResults(prev);
      return prev;
    });
  }, [submitted]);

  async function saveResults(answers) {
    const endTime = new Date();
    const timeSpent = Math.floor((endTime - startTimeRef.current) / 1000);

    let correct = 0, incorrect = 0, unanswered = 0;
    SERIES.forEach((serie, i) => {
      const ans = answers[i];
      if (ans) {
        if (ans[0] === serie.answer[0] && ans[1] === serie.answer[1]) correct++;
        else incorrect++;
      } else {
        unanswered++;
      }
    });

    const score = correct * 2;
    const data = {
      prenom,
      nom,
      email,
      genre,
      titrePoste: initPoste,
      offreId: offreId || null,
      results: { correct, incorrect, unanswered, score, timeSpent },
      answers: Object.values(answers),
      startTime: startTimeRef.current.toISOString(),
      timeSpent,
    };

    try {
      await fetch("save_test_results_domino.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
    }

    setSubmitted(true);
    setPhase("submitted");
  }

  async function handleStartTest() {
    if (!genre) {
      Swal.fire({
        icon: "error",
        title: "Champ requis",
        text: "Veuillez sélectionner votre genre.",
        confirmButtonColor: "#6C0277",
      });
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Swal.fire({
        icon: "error",
        title: "Email invalide",
        text: "Veuillez saisir une adresse e-mail valide.",
        confirmButtonColor: "#6C0277",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "info",
      title: "Prêt à commencer ?",
      html: "<p>Vous avez <strong>10 minutes</strong> pour compléter les 10 séries de dominos.</p><p>Identifiez le domino manquant dans chaque série.</p>",
      showCancelButton: true,
      confirmButtonText: "Commencer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#6C0277",
    });

    if (result.isConfirmed) {
      startTimeRef.current = new Date();
      setPhase("test");
      setCurrentSeries(0);
      // Vérifier s'il y a déjà une réponse pour la première série
      const existingAnswer = userAnswers[0];
      if (existingAnswer) {
        const optionIndex = SERIES[0].options.findIndex(
          (opt) => opt[0] === existingAnswer[0] && opt[1] === existingAnswer[1]
        );
        setSelectedOption(optionIndex !== -1 ? optionIndex : null);
      } else {
        setSelectedOption(null);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleSelectOption(index, value) {
    // On peut changer d'avis librement
    setSelectedOption(index);
    setUserAnswers((prev) => ({ ...prev, [currentSeries]: value }));
  }

  function handleNext() {
    const next = currentSeries + 1;
    if (next < TOTAL_SERIES) {
      setCurrentSeries(next);
      // Restaurer la réponse déjà donnée pour cette série
      const existingAnswer = userAnswers[next];
      if (existingAnswer) {
        const optionIndex = SERIES[next].options.findIndex(
          (opt) => opt[0] === existingAnswer[0] && opt[1] === existingAnswer[1]
        );
        setSelectedOption(optionIndex !== -1 ? optionIndex : null);
      } else {
        setSelectedOption(null);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      clearInterval(timerRef.current);
      setUserAnswers((prev) => {
        saveResults(prev);
        return prev;
      });
    }
  }

  function handlePrevious() {
    if (currentSeries > 0) {
      const prev = currentSeries - 1;
      setCurrentSeries(prev);
      // Restaurer la réponse déjà donnée pour la série précédente
      const existingAnswer = userAnswers[prev];
      if (existingAnswer) {
        const optionIndex = SERIES[prev].options.findIndex(
          (opt) => opt[0] === existingAnswer[0] && opt[1] === existingAnswer[1]
        );
        setSelectedOption(optionIndex !== -1 ? optionIndex : null);
      } else {
        setSelectedOption(null);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const isLastSeries = currentSeries === TOTAL_SERIES - 1;
  const serie = SERIES[currentSeries];

  // ── Rendu ────────────────────────────────────────────────
  if (alreadyTaken) {
    return (
      <div className="dn-page">
        <header className="dn-header">
          <img src={loImg} alt="Logo Empower" className="dn-logo" />
          <div className="dn-header-title">Test de raisonnement logique — Dominos</div>
        </header>
        <div className="dn-container"><AlreadyTakenScreen /></div>
      </div>
    );
  }

  if (phase === "submitted") {
    return (
      <div className="dn-page">
        <header className="dn-header">
          <img src={loImg} alt="Logo Empower" className="dn-logo" />
          <div className="dn-header-title">Test de raisonnement logique — Dominos</div>
        </header>
        <div className="dn-container"><SuccessScreen prenom={prenom} genre={genre} /></div>
      </div>
    );
  }

  return (
    <div className="dn-page">
      <header className="dn-header">
        <img src={loImg} alt="Logo Empower" className="dn-logo" />
        <div className="dn-header-title">Test de raisonnement logique — Dominos</div>
        {phase === "test" && <TimerDisplay seconds={timeLeft} />}
      </header>

      <div className="dn-container">

        {/* ── Phase Identité ── */}
        {phase === "identity" && (
          <>
            <div className="dn-section-header">
              <i className="bi bi-person-badge"></i>
              <span>Identité du candidat</span>
            </div>

            <div className="dn-card dn-identity-card">
              <div className="dn-notice">
                <i className="bi bi-info-circle"></i>
                <div>
                  <span>Ce test comporte <strong>10 séries</strong> de dominos à compléter en <strong>10 minutes maximum</strong>. Pour chaque série, identifiez le domino qui complète logiquement la séquence.</span>
                </div>
              </div>

              <div className="dn-form-row">
                <div className="dn-form-group">
                  <label className="dn-label">Prénom(s)</label>
                  {prenomFromUrl
                    ? <input className="dn-input dn-input--readonly" type="text" value={prenom} readOnly />
                    : <input className="dn-input" type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Votre prénom (facultatif)" />
                  }
                </div>
                <div className="dn-form-group">
                  <label className="dn-label">Nom de famille</label>
                  {nomFromUrl
                    ? <input className="dn-input dn-input--readonly" type="text" value={nom} readOnly />
                    : <input className="dn-input" type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom (facultatif)" />
                  }
                </div>
              </div>

              <div className="dn-form-row">
                <div className="dn-form-group">
                  <label className="dn-label">Adresse e-mail</label>
                  {emailFromUrl
                    ? <input className="dn-input dn-input--readonly" type="email" value={email} readOnly />
                    : <input className="dn-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Votre e-mail (facultatif)" />
                  }
                </div>
                <div className="dn-form-group">
                  <label className="dn-label">Genre <span className="dn-required">*</span></label>
                  {genreFromUrl
                    ? <input className="dn-input dn-input--readonly" type="text" value={genre === "M" ? "Masculin" : genre === "F" ? "Féminin" : genre} readOnly />
                    : (
                      <select className="dn-input dn-select" value={genre} onChange={(e) => setGenre(e.target.value)}>
                        <option value="">Sélectionnez...</option>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </select>
                    )
                  }
                </div>
              </div>

              {initPoste && (
                <div className="dn-form-row dn-form-row--single">
                  <div className="dn-form-group">
                    <label className="dn-label">Poste concerné</label>
                    <input className="dn-input dn-input--readonly" type="text" value={initPoste} readOnly />
                  </div>
                </div>
              )}

              <div className="dn-start-wrap">
                <button className="dn-start-btn" onClick={handleStartTest}>
                  <i className="bi bi-play-circle-fill"></i> Commencer le test
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Phase Test ── */}
        {phase === "test" && (
          <>
            <div className="dn-sticky-progress">
              <ProgressBar current={currentSeries + 1} total={TOTAL_SERIES} />
            </div>

            <div className="dn-section-header">
              <i className="bi bi-grid-3x3-gap"></i>
              <span>{serie.title}</span>
            </div>

            <div className="dn-card dn-series-card">
              {/* Question dominos */}
              <p className="dn-question-label">Quelle est la suite logique ?</p>
              <div className="dn-dominos-row">
                {serie.question.map(([top, bottom], i) => (
                  <DominoPiece key={i} top={top} bottom={bottom} />
                ))}
                <DominoPiece isQuestion />
              </div>

              <div className="dn-divider-section"></div>

              {/* Options */}
              <p className="dn-options-label">
                <i className="bi bi-hand-index"></i> Sélectionnez le domino manquant
              </p>
              <div className="dn-options-row">
                {serie.options.map(([top, bottom], i) => (
                  <DominoPiece
                    key={i}
                    top={top}
                    bottom={bottom}
                    isOption
                    isSelected={selectedOption === i}
                    onClick={() => handleSelectOption(i, [top, bottom])}
                  />
                ))}
              </div>
            </div>

            <div className="dn-nav-wrap">
              <div className="dn-nav-buttons">
                {currentSeries > 0 && (
                  <button className="dn-prev-btn" onClick={handlePrevious}>
                    <i className="bi bi-arrow-left-circle-fill"></i> Série précédente
                  </button>
                )}
                <button
                  className="dn-next-btn"
                  onClick={handleNext}
                  disabled={selectedOption === null}
                >
                  {isLastSeries ? (
                    <><i className="bi bi-check-circle-fill"></i> Terminer le test</>
                  ) : (
                    <><i className="bi bi-arrow-right-circle-fill"></i> Série suivante</>
                  )}
                </button>
              </div>
              {selectedOption === null && (
                <span className="dn-nav-hint">
                  <i className="bi bi-info-circle"></i> Sélectionnez un domino pour continuer
                </span>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
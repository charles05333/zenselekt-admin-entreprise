import { useState, useEffect, useRef, useCallback } from "react";
import './css/big-five.css';
import Swal from "sweetalert2";
import loImg from "./images/logo_empower.png";

// ── Bootstrap Icons ───────────────────────────────────────
const BI_CDN = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";

// ── Questions Big Five ────────────────────────────────────
const QUESTIONS = [
  { num: 1,  text: "Je porte attention aux détails.",                                            values: [1,2,3,4,5], trait: "conscienciosite" },
  { num: 2,  text: "Je n'ai pas grand-chose à dire.",                                           values: [5,4,3,2,1], trait: "extraversion" },
  { num: 3,  text: "Je me sens bien avec moi-même.",                                            values: [5,4,3,2,1], trait: "nevrosisme" },
  { num: 4,  text: "Je vote plutôt pour des candidats progressistes.",                          values: [1,2,3,4,5], trait: "ouverture" },
  { num: 5,  text: "Je me débarrasse sans tarder des tâches ménagères.",                        values: [1,2,3,4,5], trait: "conscienciosite" },
  { num: 6,  text: "Je ne m'aime pas.",                                                          values: [1,2,3,4,5], trait: "nevrosisme" },
  { num: 7,  text: "Je remets les choses à plus tard et gaspille mon temps.",                   values: [5,4,3,2,1], trait: "conscienciosite" },
  { num: 8,  text: "Je respecte les autres.",                                                    values: [1,2,3,4,5], trait: "agreabilite" },
  { num: 9,  text: "Je me sens à l'aise en compagnie des autres.",                             values: [1,2,3,4,5], trait: "extraversion" },
  { num: 10, text: "Je suis très satisfait(e) de moi-même.",                                   values: [5,4,3,2,1], trait: "nevrosisme" },
  { num: 11, text: "Je me fais facilement de nouveaux amis.",                                   values: [1,2,3,4,5], trait: "extraversion" },
  { num: 12, text: "Je n'aime pas attirer l'attention.",                                        values: [5,4,3,2,1], trait: "extraversion" },
  { num: 13, text: "Je suis convaincu(e) de l'importance de l'art.",                           values: [1,2,3,4,5], trait: "ouverture" },
  { num: 14, text: "J'évite les discussions philosophiques.",                                   values: [5,4,3,2,1], trait: "ouverture" },
  { num: 15, text: "J'accepte les gens tels qu'ils sont.",                                      values: [1,2,3,4,5], trait: "agreabilite" },
  { num: 16, text: "Je ne vais pas au bout des choses.",                                        values: [5,4,3,2,1], trait: "conscienciosite" },
  { num: 17, text: "J'ai de fréquentes sautes d'humeur.",                                       values: [1,2,3,4,5], trait: "nevrosisme" },
  { num: 18, text: "Je me contente de faire le minimum nécessaire.",                            values: [5,4,3,2,1], trait: "conscienciosite" },
  { num: 19, text: "J'ai souvent le moral à zéro.",                                             values: [1,2,3,4,5], trait: "nevrosisme" },
  { num: 20, text: "J'aime entendre parler de nouvelles idées.",                                values: [1,2,3,4,5], trait: "ouverture" },
  { num: 21, text: "Je suis un(e) vrai(e) boute-en-train.",                                    values: [1,2,3,4,5], trait: "extraversion" },
  { num: 22, text: "Je dirais que je mène une vie assez terne.",                                values: [5,4,3,2,1], trait: "extraversion" },
  { num: 23, text: "Je cherche à me venger de ceux qui m'ont blessé(e).",                      values: [5,4,3,2,1], trait: "agreabilite" },
  { num: 24, text: "Je vote plutôt pour des candidats conservateurs.",                          values: [5,4,3,2,1], trait: "ouverture" },
  { num: 25, text: "Je tire la conversation vers le haut.",                                     values: [1,2,3,4,5], trait: "ouverture" },
  { num: 26, text: "Je reste en retrait.",                                                       values: [5,4,3,2,1], trait: "extraversion" },
  { num: 27, text: "Je m'agace rarement.",                                                       values: [5,4,3,2,1], trait: "nevrosisme" },
  { num: 28, text: "Je ne parle pas beaucoup.",                                                  values: [5,4,3,2,1], trait: "extraversion" },
  { num: 29, text: "Je panique facilement.",                                                     values: [1,2,3,4,5], trait: "nevrosisme" },
  { num: 30, text: "Je me tiens toujours prêt(e).",                                             values: [1,2,3,4,5], trait: "conscienciosite" },
  { num: 31, text: "J'ai du mal à me mettre au travail.",                                       values: [5,4,3,2,1], trait: "conscienciosite" },
  { num: 32, text: "Je possède une imagination fertile.",                                        values: [1,2,3,4,5], trait: "ouverture" },
  { num: 33, text: "Je soupçonne les autres d'avoir des intentions cachées.",                   values: [5,4,3,2,1], trait: "agreabilite" },
  { num: 34, text: "Je dis toujours du bien de tout le monde.",                                 values: [1,2,3,4,5], trait: "agreabilite" },
  { num: 35, text: "Je ne m'intéresse pas aux idées abstraites.",                               values: [5,4,3,2,1], trait: "ouverture" },
  { num: 36, text: "J'ai rarement le cafard.",                                                   values: [5,4,3,2,1], trait: "nevrosisme" },
  { num: 37, text: "J'ai la langue bien acérée.",                                               values: [5,4,3,2,1], trait: "agreabilite" },
  { num: 38, text: "Je n'aime pas visiter les musées.",                                         values: [5,4,3,2,1], trait: "ouverture" },
  { num: 39, text: "Je me sens souvent triste.",                                                 values: [1,2,3,4,5], trait: "nevrosisme" },
  { num: 40, text: "Je me dérobe souvent de mes obligations.",                                  values: [5,4,3,2,1], trait: "conscienciosite" },
  { num: 41, text: "Je n'apprécie pas l'art.",                                                  values: [5,4,3,2,1], trait: "ouverture" },
  { num: 42, text: "Je suis doué(e) pour la vie en société.",                                  values: [1,2,3,4,5], trait: "extraversion" },
  { num: 43, text: "Je pense que les autres sont bien intentionnés.",                           values: [1,2,3,4,5], trait: "agreabilite" },
  { num: 44, text: "Je fais des projets et je m'y tiens.",                                     values: [1,2,3,4,5], trait: "conscienciosite" },
  { num: 45, text: "Je sais captiver les gens.",                                                 values: [1,2,3,4,5], trait: "extraversion" },
  { num: 46, text: "Je ne me laisse pas facilement perturber.",                                 values: [5,4,3,2,1], trait: "nevrosisme" },
  { num: 47, text: "Je me montre volontiers insultant(e).",                                     values: [5,4,3,2,1], trait: "agreabilite" },
  { num: 48, text: "Je mets les gens à l'aise.",                                                values: [1,2,3,4,5], trait: "agreabilite" },
  { num: 49, text: "Je mène mes projets à bien.",                                               values: [1,2,3,4,5], trait: "conscienciosite" },
  { num: 50, text: "Je rabaisse les autres.",                                                    values: [5,4,3,2,1], trait: "agreabilite" },
];

const TOTAL_QUESTIONS = QUESTIONS.length; // 50

const RATING_LABELS = {
  1: "Tout à fait faux",
  2: "Plutôt faux",
  3: "Ni vrai, ni faux",
  4: "Plutôt vrai",
  5: "Tout à fait vrai",
};

// ── Composant Progression ─────────────────────────────────
function ProgressBar({ answered, total }) {
  const pct = Math.round((answered / total) * 100);
  return (
    <div className="bf-progress-wrap">
      <div className="bf-progress-info">
        <span><strong>{answered}</strong> / {total} réponses</span>
        <span className="bf-progress-pct">{pct}%</span>
      </div>
      <div className="bf-progress-track">
        <div className="bf-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Composant Succès ──────────────────────────────────────
function SuccessScreen({ prenom, nom, genre }) {
  const civilite = genre === "M" ? "M." : genre === "F" ? "Mme" : "";
  const displayName = [civilite, prenom, nom].filter(Boolean).join(" ");
  return (
    <div className="bf-success">
      <div className="bf-success-icon">
        <i className="bi bi-check-circle-fill" />
      </div>
      <h2>Merci {displayName || "!"}</h2>
      <p>Votre test de personnalité a été soumis avec succès.</p>
      <span>Vos résultats seront analysés par notre équipe.</span>
    </div>
  );
}

// ── Composant DéjàPassé ───────────────────────────────────
function AlreadyTakenScreen({ date }) {
  return (
    <div className="bf-success">
      <div className="bf-success-icon bf-success-icon--info">
        <i className="bi bi-info-circle-fill" />
      </div>
      <h2>Test déjà passé</h2>
      <p>Vous avez déjà passé ce test{date ? ` le ${date}` : ""}.</p>
      <span>Vous ne pouvez passer ce test qu'une seule fois.</span>
    </div>
  );
}

// ── App principale ────────────────────────────────────────
export default function BigFive() {
  // Inject Bootstrap Icons
  useEffect(() => {
    if (!document.querySelector(`link[href="${BI_CDN}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet"; link.href = BI_CDN;
      document.head.appendChild(link);
    }
  }, []);

  // Lire les params URL (tous facultatifs)
  const urlParams = new URLSearchParams(window.location.search);
  const initPrenom = urlParams.get("prenoms") || "";
  const initNom    = urlParams.get("nom")     || "";
  const initEmail  = urlParams.get("email")   || "";
  const initPoste  = urlParams.get("poste")   || "";
  const offreId    = urlParams.get("offre_id") || "";

  // Les champs sont éditables si non fournis via URL, readonly sinon
  const prenomFromUrl = Boolean(urlParams.get("prenoms"));
  const nomFromUrl    = Boolean(urlParams.get("nom"));
  const emailFromUrl  = Boolean(urlParams.get("email"));

  const [prenom, setPrenom] = useState(initPrenom);
  const [nom, setNom]       = useState(initNom);
  const [email, setEmail]   = useState(initEmail);
  const [poste]             = useState(initPoste);
  const [genre, setGenre]   = useState("");

  // Phase : "identity" | "test" | "submitted"
  const [phase, setPhase]               = useState("identity");
  const [answers, setAnswers]           = useState({});
  const [submitted, setSubmitted]       = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [alreadyDate, setAlreadyDate]   = useState("");
  const [loading, setLoading]           = useState(false);

  const startTimeRef = useRef(null);

  // Vérifier si test déjà passé (uniquement si email fourni via URL)
  useEffect(() => {
    if (!initEmail) return;
    fetch("check_test_taken_Personnalite.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: initEmail, offre_id: offreId }),
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.already_taken) {
          setAlreadyTaken(true);
          setAlreadyDate(result.date_passage || "");
        }
      })
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

  const answeredCount = Object.keys(answers).length;

  // Réponse à une question
  const handleAnswer = useCallback((questionNum, scoreValue) => {
    setAnswers((prev) => ({ ...prev, [questionNum]: scoreValue }));
  }, []);

  // Démarrer le test
  async function handleStartTest() {
    // Seul le genre est obligatoire
    if (!genre) {
      Swal.fire({
        icon: "error",
        title: "Champ requis",
        text: "Veuillez sélectionner votre genre.",
        confirmButtonColor: "#6C0277",
      });
      return;
    }

    // Vérification email basique si saisi manuellement
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
      html: "<p>Vous allez répondre à 50 affirmations.</p><p>Répondez spontanément et honnêtement.</p>",
      showCancelButton: true,
      confirmButtonText: "Commencer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#6C0277",
    });

    if (result.isConfirmed) {
      startTimeRef.current = new Date();
      setPhase("test");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Soumettre le test
  async function handleSubmit() {
    if (submitted || loading) return;

    if (answeredCount < TOTAL_QUESTIONS) {
      Swal.fire({
        icon: "warning",
        title: "Questions non répondues",
        html: `<p>${answeredCount}/${TOTAL_QUESTIONS} questions répondues</p><p>Veuillez répondre à toutes les questions.</p>`,
        confirmButtonColor: "#6C0277",
      });
      return;
    }

    // Calcul scores Big Five
    const scores = {
      ouverture: 0,
      conscienciosite: 0,
      extraversion: 0,
      agreabilite: 0,
      nevrosisme: 0,
    };

    QUESTIONS.forEach((q) => {
      const answer = answers[q.num];
      if (answer !== undefined) {
        scores[q.trait] += answer;
      }
    });

    setLoading(true);

    const timeSpent = Math.floor((new Date() - startTimeRef.current) / 1000);
    const data = {
      firstName: prenom || null,
      lastName: nom || null,
      email: email || null,
      genre,
      titrePoste: poste || null,
      offreId: offreId || null,
      scores,
      answers,
      startTime: startTimeRef.current.toISOString(),
      timeSpent,
    };

    try {
      const response = await fetch("save_personality_results.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        setSubmitted(true);
      } else {
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: result.message || "Une erreur est survenue.",
          confirmButtonColor: "#6C0277",
        });
      }
    } catch {
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
      <div className="bf-page">
        <header className="bf-header">
          <img src={loImg} alt="Logo Empower" className="bf-logo" />
          <div className="bf-header-title">Test des 5 traits de personnalité</div>
        </header>
        <div className="bf-container">
          <AlreadyTakenScreen date={alreadyDate} />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bf-page">
        <header className="bf-header">
          <img src={loImg} alt="Logo Empower" className="bf-logo" />
          <div className="bf-header-title">Test des 5 traits de personnalité</div>
        </header>
        <div className="bf-container">
          <SuccessScreen prenom={prenom} nom={nom} genre={genre} />
        </div>
      </div>
    );
  }

  return (
    <div className="bf-page">
      {/* Header fixe */}
      <header className="bf-header">
        <img src={loImg} alt="Logo Empower" className="bf-logo" />
        <div className="bf-header-title">Test des 5 traits de personnalité</div>
      </header>

      <div className="bf-container">

        {/* ── Phase Identité ── */}
        {phase === "identity" && (
          <>
            <div className="bf-section-header">
              <i className="bi bi-person-badge"></i>
              <span>Identité du candidat</span>
            </div>

            <div className="bf-card bf-identity-card">
              {/* Notice */}
              <div className="bf-notice">
                <i className="bi bi-info-circle"></i>
                <div>
                  <span>Ce test comporte <strong>50 affirmations</strong>. Pour chaque affirmation, évaluez votre accord sur une échelle de <strong>1 à 5</strong> :</span>
                  <div className="bf-notice-scale">
                    {[1,2,3,4,5].map((v) => (
                      <span key={v} className="bf-notice-scale-item">
                        <strong>{v}</strong> = {RATING_LABELS[v]}
                      </span>
                    ))}
                  </div>
                  <span>Répondez spontanément, il n'y a pas de bonnes ou mauvaises réponses. Le test prend environ <strong>10–15 minutes</strong>.</span>
                </div>
              </div>

              <div className="bf-form-row">
                <div className="bf-form-group">
                  <label className="bf-label">Prénom(s)</label>
                  {prenomFromUrl ? (
                    <input className="bf-input bf-input--readonly" type="text" value={prenom} readOnly />
                  ) : (
                    <input
                      className="bf-input"
                      type="text"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      placeholder="Votre prénom (facultatif)"
                    />
                  )}
                </div>
                <div className="bf-form-group">
                  <label className="bf-label">Nom de famille</label>
                  {nomFromUrl ? (
                    <input className="bf-input bf-input--readonly" type="text" value={nom} readOnly />
                  ) : (
                    <input
                      className="bf-input"
                      type="text"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder="Votre nom (facultatif)"
                    />
                  )}
                </div>
              </div>

              <div className="bf-form-row">
                <div className="bf-form-group">
                  <label className="bf-label">Adresse e-mail</label>
                  {emailFromUrl ? (
                    <input className="bf-input bf-input--readonly" type="email" value={email} readOnly />
                  ) : (
                    <input
                      className="bf-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Votre e-mail (facultatif)"
                    />
                  )}
                </div>
                <div className="bf-form-group">
                  <label className="bf-label">Genre <span className="bf-required">*</span></label>
                  <select className="bf-input bf-select" value={genre} onChange={(e) => setGenre(e.target.value)}>
                    <option value="">Sélectionnez...</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>

              {poste && (
                <div className="bf-form-row bf-form-row--single">
                  <div className="bf-form-group">
                    <label className="bf-label">Poste concerné</label>
                    <input className="bf-input bf-input--readonly" type="text" value={poste} readOnly />
                  </div>
                </div>
              )}

              <div className="bf-start-wrap">
                <button className="bf-start-btn" onClick={handleStartTest}>
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
            <div className="bf-sticky-progress">
              <ProgressBar answered={answeredCount} total={TOTAL_QUESTIONS} />
            </div>

            {/* En-tête section */}
            <div className="bf-section-header">
              <i className="bi bi-chat-square-text"></i>
              <span>De manière générale…</span>
            </div>

            {/* Questions */}
            <div className="bf-questions-list">
              {QUESTIONS.map((q) => {
                const selected = answers[q.num];
                return (
                  <div
                    key={q.num}
                    className={`bf-card bf-question-card ${selected !== undefined ? "bf-question-card--answered" : ""}`}
                  >
                    <div className="bf-question-meta">
                      <span className="bf-question-num">Question {q.num}</span>
                      {selected !== undefined && (
                        <span className="bf-answered-badge">
                          <i className="bi bi-check2"></i> Répondu
                        </span>
                      )}
                    </div>

                    <p className="bf-question-text">{q.text}</p>

                    {/* Échelle 1–5 */}
                    <div className="bf-scale-legend">
                      <span>Tout à fait faux</span>
                      <span>Tout à fait vrai</span>
                    </div>
                    <div className="bf-rating-wrap">
                      {[1, 2, 3, 4, 5].map((displayValue, idx) => {
                        const scoreValue = q.values[idx];
                        const isSelected = selected === scoreValue;
                        return (
                          <label
                            key={displayValue}
                            className={`bf-rating-option ${isSelected ? "bf-rating-option--selected" : ""}`}
                            onClick={() => handleAnswer(q.num, scoreValue)}
                          >
                            <input
                              type="radio"
                              name={`q${q.num}`}
                              value={scoreValue}
                              checked={isSelected}
                              onChange={() => handleAnswer(q.num, scoreValue)}
                            />
                            <span className="bf-rating-number">{displayValue}</span>
                            <span className="bf-rating-label">{RATING_LABELS[displayValue]}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bouton Soumettre */}
            <div className="bf-submit-wrap">
              <div className="bf-submit-info">
                {answeredCount < TOTAL_QUESTIONS && (
                  <span className="bf-submit-warning">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    {TOTAL_QUESTIONS - answeredCount} question{TOTAL_QUESTIONS - answeredCount > 1 ? "s" : ""} sans réponse
                  </span>
                )}
              </div>
              <div className="bf-submit-actions">
                <button
                  className="bf-scroll-top-btn"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                >
                  <i className="bi bi-arrow-up-circle"></i> Retour en haut
                </button>
                <button
                  className={`bf-submit-btn ${loading ? "bf-submit-btn--loading" : ""}`}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <><span className="bf-spinner"></span> Envoi en cours…</>
                  ) : (
                    <><i className="bi bi-check-circle-fill"></i> Soumettre le test</>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
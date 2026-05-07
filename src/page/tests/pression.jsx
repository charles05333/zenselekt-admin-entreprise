import { useState, useEffect, useRef, useCallback } from "react";
import './css/pression.css';
import Swal from "sweetalert2";
import loImg from "./images/logo_empower.png";

// ── Bootstrap Icons ───────────────────────────────────────
const BI_CDN = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";

// ── Questions ─────────────────────────────────────────────
const QUESTIONS = [
  { q: "Quelle importance accordez-vous au succès ?", options: [{ text: "Une importance moyenne.", value: "a" }, { text: "Une très grande importance.", value: "b" }, { text: "Le succès ne me préoccupe pas beaucoup.", value: "c" }] },
  { q: "Vous est-il déjà arrivé de prendre des jours de congé parce que vous étiez stressé(e) ?", options: [{ text: "Une ou deux fois.", value: "a" }, { text: "Plus de deux fois.", value: "b" }, { text: "Jamais.", value: "c" }] },
  { q: "Vous considère-t-on comme une personne sachant conserver son sang froid en période de crise ?", options: [{ text: "Parfois, mais ceux qui arrivent à garder la tête froide en période de crise n'ont généralement pas saisi la gravité de la situation.", value: "a" }, { text: "Pas vraiment.", value: "b" }, { text: "Oui, je pense être à juste titre perçu(e) ainsi.", value: "c" }] },
  { q: "Parmi les propositions suivantes, laquelle est la plus à même de vous détendre et de réduire votre stress après une journée particulièrement éprouvante ?", options: [{ text: "Quelques heures de sommeil dans ma chaise longue préférée.", value: "a" }, { text: "Une bonne rasade de whiskey ou d'un autre alcool.", value: "b" }, { text: "Une barre chocolatée.", value: "c" }] },
  { q: "Les délais vous stimulent-ils ?", options: [{ text: "Non, mais les délais sont un mal nécessaire avec lequel il faut apprendre à vivre.", value: "a" }, { text: "Non, les délais ont tendance à me stresser et je préfère travailler à mon rythme.", value: "b" }, { text: "Oui, je pense que je travaille mieux quand je suis sous pression.", value: "c" }] },
  { q: "Pensez-vous que la vie actuelle génère plus de stress qu'il y a 40 ans ?", options: [{ text: "Peut-être.", value: "a" }, { text: "Oui.", value: "b" }, { text: "Non.", value: "c" }] },
  { q: "Votre neveu vous demande de garder ses trois enfants un peu turbulents pendant le week-end en raison d'une crise familiale. Comment envisagez-vous cette situation ?", options: [{ text: "Cela m'inquiète terriblement.", value: "a" }, { text: "L'idée de garder ces trois enfants me terrifie à un point tel que je chercherai probablement un moyen d'y échapper.", value: "b" }, { text: "C'est un nouveau défi que je relèverai avec plaisir.", value: "c" }] },
  { q: "Le stress vous a-t-il déjà conduit(e) à endommager des choses ?", options: [{ text: "Non, je n'ai jamais rien fait de tel mais il m'est déjà arrivé de raccrocher brutalement le téléphone.", value: "a" }, { text: "Oui.", value: "b" }, { text: "Non.", value: "c" }] },
  { q: "Vous arrive-t-il d'être ennuyé(e) par des petits riens ?", options: [{ text: "Oui, parfois.", value: "a" }, { text: "Assez souvent.", value: "b" }, { text: "Rarement voire jamais.", value: "c" }] },
  { q: "Que ressentiriez-vous si vous deviez vous familiariser avec une nouvelle technologie ?", options: [{ text: "Rien de particulier. Si je devais me familiariser avec un nouvel outil de travail pour des raisons professionnelles, je m'adapterais sans difficulté.", value: "a" }, { text: "Cela m'inquièterait un peu.", value: "b" }, { text: "J'aime apprendre des choses nouvelles, je trouve cela très intéressant.", value: "c" }] },
  { q: "Quel est, à votre avis, l'objectif premier des week-ends ?", options: [{ text: "La possibilité de passer du temps avec ses amis et sa famille.", value: "a" }, { text: "La possibilité de ne pas travailler aussi dur que durant la semaine même si je ne parviens jamais à me détendre complètement.", value: "b" }, { text: "La possibilité de se détendre et d'oublier le travail.", value: "c" }] },
  { q: "Que ressentez-vous lorsque vous effectuez des travaux chez vous ?", options: [{ text: "Cela ne me dérange pas particulièrement car c'est nécessaire.", value: "a" }, { text: "Je suis un peu tendu(e) durant les travaux car cela perturbe ma routine.", value: "b" }, { text: "Je suis très content(e) et parfois excité(e) selon la nature des travaux effectués.", value: "c" }] },
  { q: "Avez-vous des amis de confiance vers lesquels vous tourner en cas de difficulté ?", options: [{ text: "Peut-être.", value: "a" }, { text: "Pas vraiment.", value: "b" }, { text: "Oui.", value: "c" }] },
  { q: "Avez-vous l'impression que nous vivons dans un monde encore plus compétitif qu'auparavant ?", options: [{ text: "Le monde moderne est peut-être un peu plus compétitif que celui de nos parents ou grands-parents.", value: "a" }, { text: "Oui, j'en suis convaincu(e).", value: "b" }, { text: "Non, je pense que la compétition est restée la même.", value: "c" }] },
  { q: "Vous arrive-t-il de discuter avec les autres de ce que vous ressentez ?", options: [{ text: "Parfois.", value: "a" }, { text: "Rarement voire jamais.", value: "b" }, { text: "Assez souvent.", value: "c" }] },
  { q: "Pensez-vous qu'il soit nécessaire de toujours vous efforcer d'aller de l'avant ?", options: [{ text: "Parfois.", value: "a" }, { text: "Oui, je pense que c'est la seule manière de réussir dans la vie.", value: "b" }, { text: "Non, la vie est bien trop courte.", value: "c" }] },
  { q: "Travailler sur différents projets en même temps vous dérange-t-il ?", options: [{ text: "Non.", value: "a" }, { text: "Oui, je préfère me concentrer sur une chose à la fois.", value: "b" }, { text: "Au contraire, je préfère cela.", value: "c" }] },
  { q: "Vous arrive-t-il de vous en vouloir ou d'être en colère après avoir commis une erreur ou si les choses ne se déroulent pas comme prévu ?", options: [{ text: "Parfois, comme la plupart des gens, je suppose.", value: "a" }, { text: "Probablement plus souvent que les autres.", value: "b" }, { text: "Probablement moins souvent que la plupart des gens.", value: "c" }] },
  { q: "Avez-vous déjà suivi un traitement, ou pris des médicaments, contre le stress ?", options: [{ text: "Parfois.", value: "a" }, { text: "Assez souvent.", value: "b" }, { text: "Jamais.", value: "c" }] },
  { q: "Votre santé a-t-elle déjà été affectée par la mort ou la maladie d'un être proche ?", options: [{ text: "Non, mais cela pourrait arriver dans le futur, je ne sais pas.", value: "a" }, { text: "Oui.", value: "b" }, { text: "Non, cela m'est arrivé et j'en ai beaucoup souffert comme tout un chacun mais cela n'a jamais eu de répercussions sur ma santé.", value: "c" }] },
  { q: "Avez-vous déjà souffert du stress des examens ?", options: [{ text: "Les examens me stressent un peu mais pas plus que la plupart des gens.", value: "a" }, { text: "Oui.", value: "b" }, { text: "Non.", value: "c" }] },
  { q: "Que pensez-vous des traitements alternatifs comme l'acupuncture pour soigner le stress ?", options: [{ text: "Je ne sais pas trop quoi en penser. J'y viendrais peut-être si le besoin s'en fait sentir.", value: "a" }, { text: "Je n'envisagerai jamais un tel traitement.", value: "b" }, { text: "Cela peut être très bénéfique.", value: "c" }] },
  { q: "Vous arrive-t-il d'être stressé(e) à l'idée d'accomplir certaines corvées ménagères comme la lessive ou la tonte de la pelouse ?", options: [{ text: "Non cela ne me stresse pas même si ces tâches ne sont pas particulièrement réjouissantes.", value: "a" }, { text: "Oui.", value: "b" }, { text: "Jamais.", value: "c" }] },
  { q: "Vous est-t-il facile de faire le vide et de vous détendre complètement ?", options: [{ text: "Cela dépend des moments.", value: "a" }, { text: "C'est quasiment voire carrément impossible.", value: "b" }, { text: "J'ai la chance de pouvoir assez facilement faire le vide et me détendre.", value: "c" }] },
  { q: "Vous est-il souvent arrivé d'être sous pression et de n'arriver à combattre ce stress qu'en vous immergeant dans le travail ?", options: [{ text: "Parfois.", value: "a" }, { text: "Plus souvent que je ne le voudrais.", value: "b" }, { text: "Rarement voire jamais.", value: "c" }] },
  { q: "Vous êtes coincé(e) dans un embouteillage. Que ressentez-vous ?", options: [{ text: "De la colère.", value: "a" }, { text: "De la frustration.", value: "b" }, { text: "De l'ennui.", value: "c" }] },
  { q: "Ressentez-vous plus ou moins de pression avec l'âge ?", options: [{ text: "À peu près pareil.", value: "a" }, { text: "Plus.", value: "b" }, { text: "Moins.", value: "c" }] },
  { q: "Que ressentiriez-vous si vous deviez déménager à nouveau ?", options: [{ text: "J'aime assez ma maison actuelle mais cela pourrait présenter certains avantages.", value: "a" }, { text: "Je préfère éviter tous les tracas liés à un déménagement.", value: "b" }, { text: "Cela demande beaucoup de travail mais c'est généralement un évènement que l'on prend plaisir à planifier.", value: "c" }] },
  { q: "Le stress a-t-il souvent eu des répercussions sur votre vie sexuelle ?", options: [{ text: "Parfois.", value: "a" }, { text: "Relativement souvent.", value: "b" }, { text: "Jamais.", value: "c" }] },
  { q: "Avez-vous souffert du stress après avoir arrêté de fumer ou de boire du café ?", options: [{ text: "Non, mis à part quelques crises de manque.", value: "a" }, { text: "Oui.", value: "b" }, { text: "Non.", value: "c" }] },
];

const TOTAL_SECONDS = 15 * 60;

// ── Composant Timer ───────────────────────────────────────
function Timer({ secondsLeft }) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isUrgent = secondsLeft <= 120;

  return (
    <div className={`pr-timer-wrap ${isUrgent ? "pr-timer-wrap--urgent" : ""}`}>
      <div className="pr-timer-digits">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>
      <div className="pr-timer-label">Temps restant</div>
    </div>
  );
}

// ── Composant Progression ─────────────────────────────────
function ProgressBar({ answered, total }) {
  const pct = Math.round((answered / total) * 100);
  return (
    <div className="pr-progress-wrap">
      <div className="pr-progress-info">
        <span><strong>{answered}</strong> / {total} questions</span>
        <span className="pr-progress-pct">{pct}%</span>
      </div>
      <div className="pr-progress-track">
        <div className="pr-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Composant Succès ──────────────────────────────────────
function SuccessScreen({ prenom, nom, genre }) {
  const civilite = genre === "M" ? "M." : "Mme";
  return (
    <div className="pr-success">
      <div className="pr-success-icon">
        <i className="bi bi-check-circle-fill" />
      </div>
      <h2>Merci {civilite} {prenom} {nom} !</h2>
      <p>Votre test a été soumis avec succès.</p>
      <span>Vos résultats seront consultés par notre équipe.</span>
    </div>
  );
}

// ── Composant DéjàPassé ───────────────────────────────────
function AlreadyTakenScreen({ date }) {
  return (
    <div className="pr-success">
      <div className="pr-success-icon pr-success-icon--info">
        <i className="bi bi-info-circle-fill" />
      </div>
      <h2>Test déjà passé</h2>
      <p>Vous avez déjà passé ce test{date ? ` le ${date}` : ""}.</p>
      <span>Vous ne pouvez passer ce test qu'une seule fois.</span>
    </div>
  );
}

// ── App principale ────────────────────────────────────────
export default function Pression() {
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
  const offreId    = urlParams.get("offre_id") || "";

  const [prenom] = useState(initPrenom);
  const [nom]    = useState(initNom);
  const [email]  = useState(initEmail);
  const [genre, setGenre] = useState("");

  const [answers, setAnswers]           = useState({});
  const [secondsLeft, setSecondsLeft]   = useState(TOTAL_SECONDS);
  const [submitted, setSubmitted]       = useState(false);
  const [timeUp, setTimeUp]             = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [alreadyDate, setAlreadyDate]   = useState("");
  const [loading, setLoading]           = useState(false);

  const startTimeRef = useRef(new Date());
  const timerRef     = useRef(null);

  // Vérifier si test déjà passé
  useEffect(() => {
    if (!email) return;
    fetch("check_test_taken_pression.php", {
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

  // Avertissement champs manquants
  useEffect(() => {
    if (!initPrenom || !initNom || !initEmail) {
      Swal.fire({
        icon: "warning",
        title: "Informations manquantes",
        text: "Certaines informations sont manquantes.",
        confirmButtonColor: "#6C0277",
      });
    }
  }, []);

  // Timer
  useEffect(() => {
    if (submitted || alreadyTaken) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current);
          setTimeUp(true);
          Swal.fire({
            icon: "warning",
            title: "Temps écoulé",
            text: "Le temps imparti pour ce test est écoulé. Le formulaire est maintenant verrouillé.",
            confirmButtonColor: "#6C0277",
          });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [submitted, alreadyTaken]);

  // Empêcher retour arrière
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handler = () => {
      if (!submitted) window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [submitted]);

  const handleAnswer = useCallback((qIdx, value) => {
    if (timeUp) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: value }));
  }, [timeUp]);

  const answeredCount = Object.keys(answers).length;

  async function handleSubmit() {
    if (submitted || loading || timeUp) return;

    if (!genre) {
      Swal.fire({ icon: "error", title: "Champs requis", text: "Veuillez sélectionner votre genre.", confirmButtonColor: "#6C0277" });
      return;
    }
    if (!prenom || !nom || !email) {
      Swal.fire({ icon: "error", title: "Champs requis", text: "Veuillez remplir tous les champs obligatoires.", confirmButtonColor: "#6C0277" });
      return;
    }
    if (answeredCount < QUESTIONS.length) {
      Swal.fire({ icon: "warning", title: "Questions non répondues", text: `Veuillez répondre à toutes les questions (${answeredCount}/${QUESTIONS.length}).`, confirmButtonColor: "#6C0277" });
      return;
    }

    // Calcul score
    let score = 0;
    for (let i = 0; i < QUESTIONS.length; i++) {
      if (answers[i] === "a") score += 1;
      else if (answers[i] === "c") score += 2;
    }

    setLoading(true);
    clearInterval(timerRef.current);

    const timeSpent = Math.floor((new Date() - startTimeRef.current) / 1000);
    const data = {
      prenom, nom, email, genre,
      offre_id: offreId || null,
      score,
      answers,
      startTime: startTimeRef.current.toISOString(),
      timeSpent,
    };

    try {
      const response = await fetch("save_test_pression.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        setSubmitted(true);
      } else {
        setLoading(false);
        Swal.fire({ icon: "error", title: "Erreur", text: result.message || "Une erreur est survenue.", confirmButtonColor: "#6C0277" });
      }
    } catch {
      setLoading(false);
      Swal.fire({ icon: "error", title: "Erreur", text: "Impossible de sauvegarder les résultats.", confirmButtonColor: "#6C0277" });
    }
  }

  // ── Rendu ────────────────────────────────────────────────
  if (alreadyTaken) {
    return (
      <div className="pr-page">
        <header className="pr-header">
          <img src={loImg} alt="Logo Empower" className="pr-logo" />
        </header>
        <div className="pr-container">
          <AlreadyTakenScreen date={alreadyDate} />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="pr-page">
        <header className="pr-header">
          <img src={loImg} alt="Logo Empower" className="pr-logo" />
        </header>
        <div className="pr-container">
          <SuccessScreen prenom={prenom} nom={nom} genre={genre} />
        </div>
      </div>
    );
  }

  return (
    <div className="pr-page">
      {/* Header fixe */}
      <header className="pr-header">
        <img src={loImg} alt="Logo Empower" className="pr-logo" />
        <Timer secondsLeft={secondsLeft} />
      </header>

      <div className="pr-container">

        {/* Progression sticky */}
        <div className="pr-sticky-progress">
          <ProgressBar answered={answeredCount} total={QUESTIONS.length} />
        </div>

        {/* Bannière temps écoulé */}
        {timeUp && (
          <div className="pr-timeup-banner">
            <i className="bi bi-clock-history"></i>
            Temps écoulé — le formulaire est désormais verrouillé.
          </div>
        )}

        {/* Bloc Identité */}
        <div className="pr-section-header">
          <i className="bi bi-person-badge"></i>
          <span>Identité du candidat</span>
        </div>

        <div className="pr-card pr-identity-card">
          <div className="pr-form-row">
            <div className="pr-form-group">
              <label className="pr-label">Prénom <span className="pr-required">*</span></label>
              <input className="pr-input pr-input--readonly" type="text" value={prenom} readOnly />
            </div>
            <div className="pr-form-group">
              <label className="pr-label">Nom de famille <span className="pr-required">*</span></label>
              <input className="pr-input pr-input--readonly" type="text" value={nom} readOnly />
            </div>
          </div>
          <div className="pr-form-row">
            <div className="pr-form-group">
              <label className="pr-label">Adresse e-mail <span className="pr-required">*</span></label>
              <input className="pr-input pr-input--readonly" type="email" value={email} readOnly />
            </div>
            <div className="pr-form-group">
              <label className="pr-label">Genre <span className="pr-required">*</span></label>
              <select
                className="pr-input pr-select"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                disabled={timeUp}
              >
                <option value="">Sélectionnez...</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bloc Questions */}
        <div className="pr-section-header">
          <i className="bi bi-chat-square-text"></i>
          <span>Comment réagissez-vous sous la pression ?</span>
        </div>

        <div className={`pr-questions-list ${timeUp ? "pr-questions-list--locked" : ""}`}>
          {QUESTIONS.map((q, idx) => (
            <div
              key={idx}
              className={`pr-card pr-question-card ${answers[idx] ? "pr-question-card--answered" : ""}`}
            >
              <div className="pr-question-meta">
                <span className="pr-question-num">Question {idx + 1}</span>
                {answers[idx] && <span className="pr-answered-badge"><i className="bi bi-check2"></i> Répondu</span>}
              </div>
              <p className="pr-question-text">{q.q}</p>
              <div className="pr-options">
                {q.options.map((opt) => (
                  <label
                    key={opt.value}
                    className={`pr-option ${answers[idx] === opt.value ? "pr-option--selected" : ""} ${timeUp ? "pr-option--disabled" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`q${idx}`}
                      value={opt.value}
                      checked={answers[idx] === opt.value}
                      onChange={() => handleAnswer(idx, opt.value)}
                      disabled={timeUp}
                    />
                    <span className="pr-option-radio"></span>
                    <span className="pr-option-text">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bouton Soumettre */}
        <div className="pr-submit-wrap">
          <div className="pr-submit-info">
            {timeUp ? (
              <span className="pr-submit-warning pr-submit-warning--locked">
                <i className="bi bi-lock-fill"></i> Formulaire verrouillé
              </span>
            ) : answeredCount < QUESTIONS.length ? (
              <span className="pr-submit-warning">
                <i className="bi bi-exclamation-triangle-fill"></i>
                {QUESTIONS.length - answeredCount} question{QUESTIONS.length - answeredCount > 1 ? "s" : ""} sans réponse
              </span>
            ) : null}
          </div>
          <button
            className={`pr-submit-btn ${loading ? "pr-submit-btn--loading" : ""} ${timeUp ? "pr-submit-btn--locked" : ""}`}
            onClick={handleSubmit}
            disabled={loading || timeUp}
          >
            {loading ? (
              <><span className="pr-spinner"></span> Envoi en cours…</>
            ) : (
              <>Soumettre mes réponses</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
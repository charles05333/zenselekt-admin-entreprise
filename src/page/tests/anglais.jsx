import { useState, useEffect, useRef, useCallback } from "react";
import './css/anglais.css';
import Swal from "sweetalert2";
import loImg from "./images/logo_empower.png";

// ── Bootstrap Icons ───────────────────────────────────────
const BI_CDN = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";

// ── Durée du test (45 min) ─────────────────────────────────
const TIMER_DURATION = 45 * 60;

// ── Questions Anglais ─────────────────────────────────────
const SECTIONS = [
  {
    key: "section1",
    label: "Section 1",
    title: "Grammar Exercises",
    info: "Questions 1 à 20 — Choisissez la meilleure réponse.",
    questions: [
      {
        id: 1,
        text: "The text _________ in PDF format; I had requested a Word file.",
        options: [
          { value: "a", label: "was sent" },
          { value: "b", label: "is sending" },
          { value: "c", label: "sends" },
          { value: "d", label: "were sent" },
        ],
      },
      {
        id: 2,
        text: "As _________ learn more about science they become less sure about the meaning of life.",
        options: [
          { value: "a", label: "the student" },
          { value: "b", label: "the students they" },
          { value: "c", label: "students" },
          { value: "d", label: "student" },
        ],
      },
      {
        id: 3,
        text: "Please return the _________ form to confirm your reservation at the conference.",
        options: [
          { value: "a", label: "enclosing" },
          { value: "b", label: "enclosure" },
          { value: "c", label: "enclose" },
          { value: "d", label: "enclosed" },
        ],
      },
      {
        id: 4,
        text: "We spent several weeks collecting _________ but the company paid little attention to our recommendations.",
        options: [
          { value: "a", label: "informations" },
          { value: "b", label: "the informations" },
          { value: "c", label: "informing" },
          { value: "d", label: "information" },
        ],
      },
      {
        id: 5,
        text: "_________ months of planning, I am finally going to visit my aunt in New Zealand.",
        options: [
          { value: "a", label: "After" },
          { value: "b", label: "Before" },
          { value: "c", label: "Not until" },
          { value: "d", label: "Next" },
        ],
      },
      {
        id: 6,
        text: "The caves presented a frightening challenge because he was claustrophobic and afraid _________ the dark.",
        options: [
          { value: "a", label: "being in" },
          { value: "b", label: "by" },
          { value: "c", label: "for" },
          { value: "d", label: "of" },
        ],
      },
      {
        id: 7,
        text: "She was starting a new business. Her advisor told her that in the first month of operation, sales should increase _________.",
        options: [
          { value: "a", label: "every day" },
          { value: "b", label: "all day" },
          { value: "c", label: "all days" },
          { value: "d", label: "day on day" },
        ],
      },
      {
        id: 8,
        text: "Political unrest seemed to be sweeping the Middle East so we changed our travel plans, _________ instead a place with less turmoil.",
        options: [
          { value: "a", label: "for choosing" },
          { value: "b", label: "choice" },
          { value: "c", label: "choosing" },
          { value: "d", label: "chosen" },
        ],
      },
      {
        id: 9,
        text: "The Twilight series is _________ fads in cinema. People are not indifferent; they either love it or they hate it.",
        options: [
          { value: "a", label: "the one of late" },
          { value: "b", label: "a later" },
          { value: "c", label: "one of the latest" },
          { value: "d", label: "the last" },
        ],
      },
      {
        id: 10,
        text: "The president of the national assembly said the _________ new employment program will need more study before it can be adopted by the government.",
        options: [
          { value: "a", label: "prime minister" },
          { value: "b", label: "prime ministers" },
          { value: "c", label: "prime's minister" },
          { value: "d", label: "prime minister's" },
        ],
      },
      {
        id: 11,
        text: "The NBA players refused to play _________ they didn't think they were getting a fair share of revenues.",
        options: [
          { value: "a", label: "in spite of" },
          { value: "b", label: "because" },
          { value: "c", label: "nevertheless" },
          { value: "d", label: "although" },
        ],
      },
      {
        id: 12,
        text: "Driving in France can be confusing if _________ driving in England or Australia.",
        options: [
          { value: "a", label: "you are used to" },
          { value: "b", label: "you use to" },
          { value: "c", label: "you have to" },
          { value: "d", label: "you can be used to" },
        ],
      },
      {
        id: 13,
        text: "The others were _________ inspired by my effort but it wasn't enough for us to succeed.",
        options: [
          { value: "a", label: "great" },
          { value: "b", label: "greatness" },
          { value: "c", label: "greatly" },
          { value: "d", label: "grateful" },
        ],
      },
      {
        id: 14,
        text: "According to some recent DNA studies, _________ are descended from true Celtic tribes.",
        options: [
          { value: "a", label: "neither the Scots nor the Irish" },
          { value: "b", label: "not the Scots or the Irish" },
          { value: "c", label: "neither the Scots and the Irish" },
          { value: "d", label: "both the Scots nor the Irish" },
        ],
      },
      {
        id: 15,
        text: "There were _________ of people at the rally who responded wildly to the inflammatory speech.",
        options: [
          { value: "a", label: "a thousand" },
          { value: "b", label: "thousands" },
          { value: "c", label: "the thousands" },
          { value: "d", label: "five thousands" },
        ],
      },
      {
        id: 16,
        text: "Large corporations regularly _________ vast sums of money to protect their intellectual property rights.",
        options: [
          { value: "a", label: "are spending" },
          { value: "b", label: "spend" },
          { value: "c", label: "will spent" },
          { value: "d", label: "to spend" },
        ],
      },
      {
        id: 17,
        text: "The result of your development will _________ the amount of planning you put into it.",
        options: [
          { value: "a", label: "depend on" },
          { value: "b", label: "depending on" },
          { value: "c", label: "depend of" },
          { value: "d", label: "depends on" },
        ],
      },
      {
        id: 18,
        text: "We received financial help in _________ of our research projects that concerned high tech.",
        options: [
          { value: "a", label: "every" },
          { value: "b", label: "each" },
          { value: "c", label: "the whole" },
          { value: "d", label: "that" },
        ],
      },
      {
        id: 19,
        text: "I found it _________ to solve the problem than to explain it.",
        options: [
          { value: "a", label: "more easier" },
          { value: "b", label: "easiest" },
          { value: "c", label: "very easy" },
          { value: "d", label: "easier" },
        ],
      },
      {
        id: 20,
        text: "Last summer we _________ to Rome especially to see Vatican City.",
        options: [
          { value: "a", label: "had traveled" },
          { value: "b", label: "traveled" },
          { value: "c", label: "have traveled" },
          { value: "d", label: "travel" },
        ],
      },
    ],
  },
  {
    key: "section2",
    label: "Section 2",
    title: "Find the Error",
    info: "Questions 21 à 35 — Identifiez l'erreur (A, B, C ou D) dans chaque phrase.",
    questions: [
      {
        id: 21,
        parts: [
          { letter: "A", text: "Sadfully, I find that" },
          { letter: "B", text: "Australians are often portrayed as eccentric and undisciplined." },
          { letter: "C", text: "What's more," },
          { letter: "D", text: "it is a myth that tourists seem to enjoy." },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
      {
        id: 22,
        parts: [
          { letter: "A", text: "The succession to the crown" },
          { letter: "B", text: "was not clear. Some thought" },
          { letter: "C", text: "that the crown prince was not the" },
          { letter: "D", text: "legitimate hair to the throne." },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
      {
        id: 23,
        parts: [
          { letter: "A", text: "The weather was impossible." },
          { letter: "B", text: "Bitter cold, snowy and ice and the very short days transformed the" },
          { letter: "C", text: "daily activities into adventures" },
          { letter: "D", text: "for which no one could predict the outcome." },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
      {
        id: 24,
        parts: [
          { letter: "A", text: "My father loved to smoke a pipe." },
          { letter: "B", text: "I can remember the fragrance of cherries that" },
          { letter: "C", text: "were always presently in the living room" },
          { letter: "D", text: "as he sat smoking and reading the evening news." },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
      {
        id: 25,
        parts: [
          { letter: "A", text: "For the telethon, the six of us" },
          { letter: "B", text: "are agreed to swim 5 km each in 1 km increments." },
          { letter: "C", text: "The sponsor promised to donate" },
          { letter: "D", text: "one hundred dollars for every km swum." },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
      {
        id: 26,
        parts: [
          { letter: "A", text: "People don't appreciate what" },
          { letter: "B", text: "they get for free. That's why some politicians" },
          { letter: "C", text: "have suggested that students should pay" },
          { letter: "D", text: "for them university education." },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
      {
        id: 27,
        parts: [
          { letter: "A", text: "The Cabot trail, in Nova Scotia, Canada," },
          { letter: "B", text: "is one of the most beautiful bike routes in the world" },
          { letter: "C", text: "but you had better be in good physical condition" },
          { letter: "D", text: "for it takes severals days to complete." },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
      {
        id: 28,
        parts: [
          { letter: "A", text: "The professor explained the" },
          { letter: "B", text: "concept of carbon footprint when I was not in class" },
          { letter: "C", text: "so I missed the question" },
          { letter: "D", text: "when he came up on the exam." },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
      {
        id: 29,
        parts: [
          { letter: "A", text: "When I mentioned Picasso, I was referring" },
          { letter: "B", text: "to perhaps the most creative" },
          { letter: "C", text: "and innovation painter of the 20th century;" },
          { letter: "D", text: "Bart thought I was talking about a car!" },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
      {
        id: 30,
        parts: [
          { letter: "A", text: "Some creationists belief the proposition" },
          { letter: "B", text: "that the earth and the heavens were created in seven days," },
          { letter: "C", text: "which is in direct conflict" },
          { letter: "D", text: "with modern geological theory." },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
      {
        id: 31,
        parts: [
          { letter: "A", text: "The school district introduced" },
          { letter: "B", text: "a new lunch program of healthy meals" },
          { letter: "C", text: "but many children, used to good-tasting junk food," },
          { letter: "D", text: "refusing to eat." },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
      {
        id: 32,
        parts: [
          { letter: "A", text: "The hacker had shown an early talent for programming." },
          { letter: "B", text: "By the age of twelve she had developed" },
          { letter: "C", text: "a program that can predicted" },
          { letter: "D", text: "stock market performance based on the weather." },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
      {
        id: 33,
        parts: [
          { letter: "A", text: "Next summer we are planning a trip to China." },
          { letter: "B", text: "But apart from the Great Wall and" },
          { letter: "C", text: "the Forbidden City, we haven't not yet" },
          { letter: "D", text: "decided what we want to see." },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
      {
        id: 34,
        parts: [
          { letter: "A", text: "Throughout Bill Clinton has not" },
          { letter: "B", text: "been president for ten years, his influence" },
          { letter: "C", text: "in Washington D.C. and the rest of the" },
          { letter: "D", text: "world has never been greater." },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
      {
        id: 35,
        parts: [
          { letter: "A", text: "More frequent concussions in" },
          { letter: "B", text: "physical contact sports such as hockey and football have" },
          { letter: "C", text: "led to further researches and" },
          { letter: "D", text: "more regulations to prevent repetitive blows to the head." },
        ],
        options: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
          { value: "c", label: "C" },
          { value: "d", label: "D" },
        ],
      },
    ],
  },
  {
    key: "section3",
    label: "Section 3",
    title: "Vocabulary Exercises",
    info: "Questions 36 à 60 — Choisissez le mot qui a le sens le plus proche du mot souligné.",
    questions: [
      {
        id: 36,
        text: "No one could understand why people were <strong>loyal</strong> to this idea.",
        options: [
          { value: "a", label: "scornful" },
          { value: "b", label: "devoted" },
          { value: "c", label: "doubtful" },
          { value: "d", label: "confounded" },
        ],
      },
      {
        id: 37,
        text: "The <strong>fake</strong> watches sold well on the street corner.",
        options: [
          { value: "a", label: "expensive" },
          { value: "b", label: "cheap" },
          { value: "c", label: "counterfeit" },
          { value: "d", label: "plastic" },
        ],
      },
      {
        id: 38,
        text: "Her job was to <strong>combine</strong> the ingredients.",
        options: [
          { value: "a", label: "separate" },
          { value: "b", label: "discover" },
          { value: "c", label: "blend" },
          { value: "d", label: "hide" },
        ],
      },
      {
        id: 39,
        text: "If you don't follow the rules you could be <strong>fired</strong>.",
        options: [
          { value: "a", label: "let go" },
          { value: "b", label: "taken on" },
          { value: "c", label: "flamed" },
          { value: "d", label: "ignored" },
        ],
      },
      {
        id: 40,
        text: "It was surprising to hear her describe the car as <strong>lovely</strong>.",
        options: [
          { value: "a", label: "bright" },
          { value: "b", label: "pretty" },
          { value: "c", label: "big" },
          { value: "d", label: "ordinary" },
        ],
      },
      {
        id: 41,
        text: "His approach to work made a <strong>lasting</strong> impression on all those around him.",
        options: [
          { value: "a", label: "noticeable" },
          { value: "b", label: "permanent" },
          { value: "c", label: "transitory" },
          { value: "d", label: "important" },
        ],
      },
      {
        id: 42,
        text: "We were not sure that now was the best time for this subject to be <strong>discussed</strong>.",
        options: [
          { value: "a", label: "detested" },
          { value: "b", label: "converted" },
          { value: "c", label: "altered" },
          { value: "d", label: "considered" },
        ],
      },
      {
        id: 43,
        text: "My objective is not to <strong>outwit</strong> my customers, but to let them come to their own conclusions.",
        options: [
          { value: "a", label: "lie to" },
          { value: "b", label: "get the better of" },
          { value: "c", label: "enlighten" },
          { value: "d", label: "help" },
        ],
      },
      {
        id: 44,
        text: "The street vendor only <strong>shook his head</strong> when I asked if this food was spicy.",
        options: [
          { value: "a", label: "indicated no" },
          { value: "b", label: "laughed at me" },
          { value: "c", label: "greeted me" },
          { value: "d", label: "looked down at me" },
        ],
      },
      {
        id: 45,
        text: "Seeing the bear, the hunter's <strong>fear</strong> was apparent.",
        options: [
          { value: "a", label: "joy" },
          { value: "b", label: "excitement" },
          { value: "c", label: "stupor" },
          { value: "d", label: "alarm" },
        ],
      },
      {
        id: 46,
        text: "<strong>stumble</strong>",
        options: [
          { value: "a", label: "stop" },
          { value: "b", label: "falter" },
          { value: "c", label: "strip" },
          { value: "d", label: "impose" },
        ],
      },
      {
        id: 47,
        text: "<strong>rekindle</strong>",
        options: [
          { value: "a", label: "renew" },
          { value: "b", label: "burn" },
          { value: "c", label: "require" },
          { value: "d", label: "return" },
        ],
      },
      {
        id: 48,
        text: "<strong>flattering</strong>",
        options: [
          { value: "a", label: "cautious" },
          { value: "b", label: "numerous" },
          { value: "c", label: "matching" },
          { value: "d", label: "admiring" },
        ],
      },
      {
        id: 49,
        text: "<strong>haste</strong>",
        options: [
          { value: "a", label: "doubt" },
          { value: "b", label: "insecurity" },
          { value: "c", label: "speed" },
          { value: "d", label: "slowness" },
        ],
      },
      {
        id: 50,
        text: "<strong>abolish</strong>",
        options: [
          { value: "a", label: "take off" },
          { value: "b", label: "command" },
          { value: "c", label: "eliminate" },
          { value: "d", label: "shine" },
        ],
      },
      {
        id: 51,
        text: "<strong>get along</strong>",
        options: [
          { value: "a", label: "manage" },
          { value: "b", label: "lose" },
          { value: "c", label: "go down" },
          { value: "d", label: "search" },
        ],
      },
      {
        id: 52,
        text: "<strong>hole</strong>",
        options: [
          { value: "a", label: "entire" },
          { value: "b", label: "gap" },
          { value: "c", label: "filling" },
          { value: "d", label: "circle" },
        ],
      },
      {
        id: 53,
        text: "<strong>dull</strong>",
        options: [
          { value: "a", label: "temperate" },
          { value: "b", label: "unemployment" },
          { value: "c", label: "boring" },
          { value: "d", label: "sharp" },
        ],
      },
      {
        id: 54,
        text: "<strong>enable</strong>",
        options: [
          { value: "a", label: "realise" },
          { value: "b", label: "skill" },
          { value: "c", label: "inform" },
          { value: "d", label: "allow" },
        ],
      },
      {
        id: 55,
        text: "<strong>snag</strong>",
        options: [
          { value: "a", label: "branch" },
          { value: "b", label: "problem" },
          { value: "c", label: "treat" },
          { value: "d", label: "forget" },
        ],
      },
      {
        id: 56,
        text: "<strong>gracious</strong>",
        options: [
          { value: "a", label: "friendly" },
          { value: "b", label: "no cost" },
          { value: "c", label: "slick" },
          { value: "d", label: "worthless" },
        ],
      },
      {
        id: 57,
        text: "<strong>tip</strong>",
        options: [
          { value: "a", label: "fight" },
          { value: "b", label: "imperfection" },
          { value: "c", label: "matter" },
          { value: "d", label: "advice" },
        ],
      },
      {
        id: 58,
        text: "<strong>focus</strong>",
        options: [
          { value: "a", label: "concentrate" },
          { value: "b", label: "cover up" },
          { value: "c", label: "streak" },
          { value: "d", label: "color" },
        ],
      },
      {
        id: 59,
        text: "<strong>settle on</strong>",
        options: [
          { value: "a", label: "question" },
          { value: "b", label: "clear up" },
          { value: "c", label: "deliberate" },
          { value: "d", label: "exhaust" },
        ],
      },
      {
        id: 60,
        text: "<strong>pursue</strong>",
        options: [
          { value: "a", label: "sack" },
          { value: "b", label: "trade" },
          { value: "c", label: "buy" },
          { value: "d", label: "follow" },
        ],
      },
    ],
  },
];

const TOTAL_QUESTIONS = SECTIONS.reduce((acc, s) => acc + s.questions.length, 0); // 60

// ── Composant Timer ───────────────────────────────────────
function Timer({ seconds }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isWarning = seconds <= 300;
  return (
    <div className={`an-timer ${isWarning ? "an-timer--warning" : ""}`}>
      <i className="bi bi-clock"></i>
      <span className="an-timer-display">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
      <span className="an-timer-label">restantes</span>
    </div>
  );
}

// ── Composant Progression ─────────────────────────────────
function ProgressBar({ answered, total }) {
  const pct = Math.round((answered / total) * 100);
  return (
    <div className="an-progress-wrap">
      <div className="an-progress-info">
        <span><strong>{answered}</strong> / {total} réponses</span>
        <span className="an-progress-pct">{pct}%</span>
      </div>
      <div className="an-progress-track">
        <div className="an-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Composant Succès ──────────────────────────────────────
function SuccessScreen({ prenom, nom, genre }) {
  const civilite = genre === "M" ? "M." : "Mme";
  return (
    <div className="an-success">
      <div className="an-success-icon">
        <i className="bi bi-check-circle-fill" />
      </div>
      <h2>Merci {civilite} {prenom} {nom} !</h2>
      <p>Votre test d'anglais a été soumis avec succès.</p>
      <span>Vos résultats seront consultés par notre équipe.</span>
    </div>
  );
}

// ── Composant DéjàPassé ───────────────────────────────────
function AlreadyTakenScreen({ date }) {
  return (
    <div className="an-success">
      <div className="an-success-icon an-success-icon--info">
        <i className="bi bi-info-circle-fill" />
      </div>
      <h2>Test déjà passé</h2>
      <p>Vous avez déjà passé ce test{date ? ` le ${date}` : ""}.</p>
      <span>Vous ne pouvez passer ce test qu'une seule fois.</span>
    </div>
  );
}

// ── Rendu d'une question ──────────────────────────────────
function QuestionCard({ question, sectionIdx, qIdx, selected, onAnswer }) {
  const globalNum = SECTIONS.slice(0, sectionIdx).reduce((acc, s) => acc + s.questions.length, 0) + qIdx + 1;
  const isError = !!question.parts; // Section 2 : Find the Error

  return (
    <div className={`an-card an-question-card ${selected ? "an-question-card--answered" : ""}`}>
      <div className="an-question-meta">
        <span className="an-question-num">Question {globalNum}</span>
        {selected && (
          <span className="an-answered-badge">
            <i className="bi bi-check2"></i> Répondu
          </span>
        )}
      </div>

      {isError ? (
        <div className="an-error-parts">
          {question.parts.map((p) => (
            <div key={p.letter} className="an-error-part">
              <span className="an-error-letter">{p.letter})</span>
              <span>{p.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <p
          className="an-question-text"
          dangerouslySetInnerHTML={{ __html: question.text }}
        />
      )}

      <div className="an-options-grid">
        {question.options.map((opt) => (
          <label
            key={opt.value}
            className={`an-option ${selected === opt.value ? "an-option--selected" : ""}`}
            onClick={() => onAnswer(question.id, opt.value)}
          >
            <input
              type="radio"
              name={`q${question.id}`}
              value={opt.value}
              checked={selected === opt.value}
              onChange={() => onAnswer(question.id, opt.value)}
            />
            <span className="an-option-letter">{opt.value.toUpperCase()}</span>
            <span className="an-option-text">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── App principale ────────────────────────────────────────
export default function Anglais() {
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
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);

  const [answers, setAnswers]           = useState({});
  const [submitted, setSubmitted]       = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [alreadyDate, setAlreadyDate]   = useState("");
  const [loading, setLoading]           = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const timerRef   = useRef(null);
  const startTimeRef = useRef(null);

  // Vérifier si test déjà passé
  useEffect(() => {
    if (!email) return;
    fetch("check_test_taken_Anglais.php", {
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

  // Nettoyer le timer au démontage
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const answeredCount = Object.keys(answers).length;

  const handleAnswer = useCallback((id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
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

    Swal.fire({
      icon: "question",
      title: "Prêt ?",
      html: "<p>45 minutes · 60 questions</p>",
      showCancelButton: true,
      confirmButtonText: "Commencer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#6C0277",
    }).then((result) => {
      if (result.isConfirmed) {
        startTimeRef.current = new Date();
        setPhase("test");
        setCurrentSectionIdx(0);
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Lancer le timer
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              handleSubmit(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    });
  }

  // Vérifier que toutes les questions de la section courante sont répondues
  function currentSectionAllAnswered() {
    const section = SECTIONS[currentSectionIdx];
    return section.questions.every((q) => answers[q.id] !== undefined);
  }

  function handleNextSection() {
    if (!currentSectionAllAnswered()) {
      Swal.fire({
        icon: "warning",
        title: "Questions non répondues",
        text: "Veuillez répondre à toutes les questions de cette section avant de continuer.",
        confirmButtonColor: "#6C0277",
      });
      return;
    }
    setCurrentSectionIdx((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePrevSection() {
    setCurrentSectionIdx((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Calculer le score
  function computeScore() {
    const answerKey = {
      1: "a", 2: "c", 3: "d", 4: "d", 5: "a", 6: "d", 7: "a", 8: "c", 9: "c", 10: "d",
      11: "b", 12: "a", 13: "c", 14: "a", 15: "b", 16: "b", 17: "a", 18: "b", 19: "d", 20: "b",
      21: "a", 22: "d", 23: "b", 24: "c", 25: "b", 26: "d", 27: "d", 28: "d", 29: "c", 30: "a",
      31: "d", 32: "c", 33: "c", 34: "a", 35: "c",
      36: "b", 37: "c", 38: "c", 39: "a", 40: "b", 41: "b", 42: "d", 43: "b", 44: "a", 45: "d",
      46: "b", 47: "a", 48: "d", 49: "c", 50: "c", 51: "a", 52: "b", 53: "c", 54: "a", 55: "b",
      56: "a", 57: "d", 58: "a", 59: "c", 60: "d",
    };
    let correct = 0, incorrect = 0, unanswered = 0;
    for (let i = 1; i <= 60; i++) {
      if (answers[i]) {
        if (answers[i] === answerKey[i]) correct++;
        else incorrect++;
      } else unanswered++;
    }
    const score = correct * 3 - incorrect;
    const percentage = ((correct / 60) * 100).toFixed(1);
    let level = "Débutant";
    if (percentage >= 80) level = "Avancé";
    else if (percentage >= 60) level = "Intermédiaire";
    else if (percentage >= 40) level = "Pré-intermédiaire";
    return { correct, incorrect, unanswered, score, percentage, level };
  }

  // Soumettre
  async function handleSubmit(forced = false) {
    if (submitted || loading) return;

    if (!forced && answeredCount < TOTAL_QUESTIONS) {
      const confirm = await Swal.fire({
        icon: "warning",
        title: "Questions non répondues",
        text: `Vous avez répondu à ${answeredCount}/${TOTAL_QUESTIONS} questions. Soumettre quand même ?`,
        showCancelButton: true,
        confirmButtonText: "Soumettre",
        cancelButtonText: "Continuer",
        confirmButtonColor: "#6C0277",
        cancelButtonColor: "#dc2626",
      });
      if (!confirm.isConfirmed) return;
    }

    clearInterval(timerRef.current);
    setLoading(true);

    const timeSpent = Math.floor((new Date() - startTimeRef.current) / 1000);
    const results = computeScore();

    const data = {
      firstName: prenom,
      lastName: nom,
      email,
      genre,
      titrePoste: poste,
      offreId: offreId || null,
      results,
      answers,
      startTime: startTimeRef.current.toISOString(),
      timeSpent,
    };

    try {
      const response = await fetch("save_test_results.php", {
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

  // ── Rendu ─────────────────────────────────────────────────
  if (alreadyTaken) {
    return (
      <div className="an-page">
        <header className="an-header">
          <img src={loImg} alt="Logo Empower" className="an-logo" />
        </header>
        <div className="an-container">
          <AlreadyTakenScreen date={alreadyDate} />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="an-page">
        <header className="an-header">
          <img src={loImg} alt="Logo Empower" className="an-logo" />
        </header>
        <div className="an-container">
          <SuccessScreen prenom={prenom} nom={nom} genre={genre} />
        </div>
      </div>
    );
  }

  const currentSection = SECTIONS[currentSectionIdx];
  const isLastSection  = currentSectionIdx === SECTIONS.length - 1;

  return (
    <div className="an-page">
      {/* Header fixe */}
      <header className="an-header">
        <img src={loImg} alt="Logo Empower" className="an-logo" />
        <div className="an-header-title">Test d'anglais</div>
        {phase === "test" && <Timer seconds={timeLeft} />}
      </header>

      <div className="an-container">

        {/* ── Phase Identité ── */}
        {phase === "identity" && (
          <>
            <div className="an-section-header">
              <i className="bi bi-person-badge"></i>
              <span>Identité du candidat</span>
            </div>

            <div className="an-card an-identity-card">
              <div className="an-notice">
                <i className="bi bi-info-circle"></i>
                <div>
                  <strong>Instructions :</strong>
                  <ul className="an-notice-list">
                    <li>Vous avez <strong>45 minutes</strong> pour compléter <strong>60 questions</strong></li>
                    <li>Le test est divisé en <strong>3 sections</strong></li>
                    <li>Chaque bonne réponse vaut <strong>3 points</strong></li>
                    <li>Chaque mauvaise réponse retire <strong>1 point</strong></li>
                    <li>Les questions non répondues ne comptent pas</li>
                  </ul>
                </div>
              </div>

              <div className="an-form-row">
                <div className="an-form-group">
                  <label className="an-label">Prénom(s)</label>
                  <input className="an-input an-input--readonly" type="text" value={prenom} readOnly />
                </div>
                <div className="an-form-group">
                  <label className="an-label">Nom de famille</label>
                  <input className="an-input an-input--readonly" type="text" value={nom} readOnly />
                </div>
              </div>

              <div className="an-form-row">
                <div className="an-form-group">
                  <label className="an-label">Adresse e-mail</label>
                  <input className="an-input an-input--readonly" type="email" value={email} readOnly />
                </div>
                <div className="an-form-group">
                  <label className="an-label">Genre <span className="an-required">*</span></label>
                  <select className="an-input an-select" value={genre} onChange={(e) => setGenre(e.target.value)}>
                    <option value="">Sélectionnez...</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>

              {poste && (
                <div className="an-form-row an-form-row--single">
                  <div className="an-form-group">
                    <label className="an-label">Poste concerné</label>
                    <input className="an-input an-input--readonly" type="text" value={poste} readOnly />
                  </div>
                </div>
              )}

              <div className="an-alert-warn">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span><strong>Important :</strong> Une fois le test commencé, le chronomètre se lancera. Assurez-vous d'être dans un endroit calme.</span>
              </div>

              <div className="an-start-wrap">
                <button className="an-start-btn" onClick={handleStartTest}>
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
            <div className="an-sticky-progress">
              <ProgressBar answered={answeredCount} total={TOTAL_QUESTIONS} />
            </div>

            {/* Stepper sections */}
            <div className="an-stepper">
              {SECTIONS.map((s, idx) => {
                const sectionDone = s.questions.every((q) => answers[q.id] !== undefined);
                return (
                  <div
                    key={s.key}
                    className={`an-step ${idx === currentSectionIdx ? "an-step--active" : ""} ${sectionDone ? "an-step--done" : ""}`}
                  >
                    <div className="an-step-dot">
                      {sectionDone ? <i className="bi bi-check2"></i> : idx + 1}
                    </div>
                    <span className="an-step-label">{s.label}</span>
                  </div>
                );
              })}
            </div>

            {/* En-tête section courante */}
            <div className="an-section-header">
              <i className="bi bi-translate"></i>
              <span>{currentSection.label} — {currentSection.title}</span>
            </div>

            <div className="an-section-info">{currentSection.info}</div>

            {/* Questions */}
            <div className="an-questions-list">
              {currentSection.questions.map((q, qIdx) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  sectionIdx={currentSectionIdx}
                  qIdx={qIdx}
                  selected={answers[q.id]}
                  onAnswer={handleAnswer}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="an-nav-wrap">
              {currentSectionIdx > 0 && (
                <button className="an-nav-btn an-nav-btn--prev" onClick={handlePrevSection}>
                  <i className="bi bi-arrow-left"></i> Section précédente
                </button>
              )}

              {!isLastSection ? (
                <button className="an-nav-btn an-nav-btn--next" onClick={handleNextSection}>
                  Section suivante <i className="bi bi-arrow-right"></i>
                </button>
              ) : (
                <div className="an-submit-wrap">
                  <div className="an-submit-info">
                    {answeredCount < TOTAL_QUESTIONS && (
                      <span className="an-submit-warning">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        {TOTAL_QUESTIONS - answeredCount} question{TOTAL_QUESTIONS - answeredCount > 1 ? "s" : ""} sans réponse
                      </span>
                    )}
                  </div>
                  <button
                    className={`an-submit-btn ${loading ? "an-submit-btn--loading" : ""}`}
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="an-spinner"></span> Envoi en cours…</>
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
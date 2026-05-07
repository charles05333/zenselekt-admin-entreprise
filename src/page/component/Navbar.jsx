import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './css/Navbar.css';

const NAV = [
  { icon: "bi-grid",            label: "Zenselekt 3.0",               single: true, active: true, path: "/acceuil" },
  {
    icon: "bi-briefcase",
    label: "Gestion des offres d'emploi",
    children: [
      { label: "Consultation des Emplois/Postulants", path: "/emploi" },
      { label: "Candidathèque générale",              path: "/candidatheque" },
      { label: "Candidatures spontanées",             path: "/spontanees" },
      { label: "Gestion des annonces",                path: "/offres" },
    ]
  },
  {
    icon: "bi-people",
    label: "Gestion des utilisateurs",
    children: [
      { label: "Utilisateurs",             path: "/utilisateurs" },
     { label: "Création d'un utilisateur", path: "/creerutil" },
    ]
  },
  {
    icon: "bi-trophy",
    label: "Gestion des évaluations",
    children: [
      { label: "Banque des tests",          path: "/tests" },
      { label: "Campagnes d'évalutation",   path: "/campagnes" },
    ]
  },
  {
    icon: "bi-clipboard-check",
    label: "Préselection & entretiens",
    children: [
      { label: "Listes des postes", path: "/postes" },
    ]
  },
  {
    icon: "bi-journal-text",
    label: "Documentation",
    children: [
      { label: "Lire la documentation", path: "/documentation" },
    ]
  }
];

// ── Chatbot ───────────────────────────────────────────────
function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatState, setChatState] = useState("idle");
  const msgsRef = useRef(null);

  const initMsgs = [{
    role: "bot",
    text: "👋 Bonjour ! Je suis votre\nassistant RH.\nQue souhaitez-vous faire ?",
    choices: [
      { label: "Trouver un candidat spécifique", action: "find" },
      { label: "Créer une shortlist de candidats", action: "shortlist" },
    ],
  }];

  useEffect(() => { if (open && messages.length === 0) setMessages(initMsgs); }, [open]);
  useEffect(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, [messages]);

  function lockChoices() { setMessages((m) => m.map((msg) => ({ ...msg, choices: undefined }))); }
  function addMsg(role, text, choices) { setMessages((m) => [...m, { role, text, choices }]); }

  function handleChoice(action) {
    lockChoices();
    if (action === "find") {
      setChatState("find");
      addMsg("user", "Trouver un candidat spécifique");
      addMsg("bot", "Entrez le nom, prénom ou email du candidat :");
    } else if (action === "shortlist") {
      addMsg("user", "Créer une shortlist de candidats");
      addMsg("bot", "Fonctionnalité disponible en version complète.", [{ label: "↩ Menu principal", action: "back" }]);
    } else if (action === "retry") {
      setChatState("find");
      addMsg("bot", "Saisissez un autre nom, prénom ou email :");
    } else if (action === "back") {
      setChatState("idle");
      setMessages(initMsgs);
    }
  }

  function handleSend() {
    const val = input.trim();
    if (!val || chatState !== "find") return;
    setInput("");
    addMsg("user", val);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addMsg("bot", `😕 Aucun candidat trouvé pour "${val}" dans la démo.`, [
        { label: "Réessayer", action: "retry" },
        { label: "↩ Menu", action: "back" },
      ]);
      setChatState("idle");
    }, 1200);
  }

  return (
    <>
      <button className="zs-fab" onClick={() => setOpen((prev) => !prev)} title="Assistant RH">
        <i className="bi bi-robot" />
      </button>

      {open && (
        <div className="zs-window">
          <div className="zs-header">
            <div className="zs-av"><i className="bi bi-robot" /></div>
            <div className="zs-hinfo">
              <div className="zs-hname">Assistant RH Zenselekt</div>
              <div className="zs-hstatus">
                <span className="zs-dot" /> En ligne &nbsp;·&nbsp; Propulsé par EMPOWER-IA
              </div>
            </div>
            <button className="zs-x" onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="zs-msgs" ref={msgsRef}>
            {messages.map((m, i) => (
              <div key={i} className={`zs-msg zs-msg--${m.role}`}>
                {m.role === "bot" && (
                  <div className="zs-icon"><i className="bi bi-robot" /></div>
                )}
                <div>
                  <div className="zs-bubble" style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                  {m.choices && (
                    <div className="zs-choices">
                      {m.choices.map((c, j) => (
                        <button key={j} className="zs-choice" onClick={() => handleChoice(c.action)}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="zs-msg zs-msg--bot">
                <div className="zs-icon"><i className="bi bi-robot" /></div>
                <div className="zs-typing"><span /><span /><span /></div>
              </div>
            )}
          </div>

          <div className="zs-input-wrap">
            <input
              className="zs-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Tapez votre réponse…"
              disabled={chatState !== "find"}
            />
            <button
              className="zs-send"
              onClick={handleSend}
              disabled={chatState !== "find" || !input.trim()}
            >
              <i className="bi bi-send-fill" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Navbar (Sidebar) ──────────────────────────────────────
export default function Navbar({ open, onClose }) {
  const [expanded, setExpanded] = useState({});
  const navigate = useNavigate();

  function toggle(i) {
    setExpanded((e) => ({ ...e, [i]: !e[i] }));
  }

  function handleNavClick(item, i) {
    if (item.single && item.path) {
      navigate(item.path);
    } else {
      toggle(i);
    }
  }

  function handleChildClick(child) {
    if (child.path) {
      navigate(child.path);
      onClose && onClose();
    }
  }

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${open ? "" : "sidebar--closed"}`}>
        {NAV.map((item, i) => (
          <div key={i}>
            <button
              className={`nav-item ${item.active ? "nav-item--active" : ""}`}
              onClick={() => handleNavClick(item, i)}
            >
              <i className={`bi ${item.icon} nav-icon`} />
              <span className="nav-label">{item.label}</span>
              {!item.single && (
                <i className={`bi bi-chevron-down nav-chevron ${expanded[i] ? "open" : ""}`} />
              )}
            </button>

            {expanded[i] && item.children && (
              <div className="nav-sub">
                {item.children.map((child, j) => (
                  <button
                    key={j}
                    className="nav-sub-item"
                    onClick={() => handleChildClick(child)}
                  >
                    <i className="bi bi-circle-fill nav-sub-dot" />
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </aside>

      <Chatbot />
    </>
  );
}
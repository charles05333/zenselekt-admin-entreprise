import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from 'sweetalert2';
import './css/Postulants.css';
import Header from "./component/Header";
import Navbar from "./component/Navbar";
import { useSessionGuard, LOGIN_REDIRECT } from "./component/useSessionGuard";

// ── Bootstrap Icons ───────────────────────────────────────
const BI_CDN = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
function useBootstrapIcons() {
    useEffect(() => {
        if (!document.querySelector(`link[href="${BI_CDN}"]`)) {
            const l = document.createElement("link"); l.rel = "stylesheet"; l.href = BI_CDN;
            document.head.appendChild(l);
        }
    }, []);
}

// ── Config API ────────────────────────────────────────────
const API_BASE       = "/securebackoffice/backsecurebackoffice";
const API_POSTULANTS = `${API_BASE}/postulants.php`;
const API_MAIL       = `${API_BASE}/envoiMail.php`;

// ── Pagination ────────────────────────────────────────────
const PAGE_SIZE = 100;

// ── Décisions ─────────────────────────────────────────────
const DECISIONS_MAP = {
    en_attente:   { label: "En cours de traitement",    cls: "en-cours",   color: "#6b7280" },
    refuse_cv:    { label: "Non retenu — CV",           cls: "refuse-cv",  color: "#991b1b" },
    retenu:       { label: "Retenu pour entretien",     cls: "retenu",     color: "#0a78b5" },
    entretien_ok: { label: "Entretien validé",          cls: "entretien",  color: "#1b6630" },
    refuse:       { label: "Non retenu",                cls: "refuse",     color: "#991b1b" },
    en_reserve:   { label: "En réserve",                cls: "reserve",    color: "#b45309" },
    recrute:      { label: "Recruté(e)",                cls: "recrute",    color: "#5b21b6" },
};

const KANBAN_COLUMNS = [
    { key: "en_attente",   label: "En attente",    icon: "bi-hourglass-split" },
    { key: "retenu",       label: "Retenus",        icon: "bi-bookmark-check" },
    { key: "entretien_ok", label: "Entretiens",     icon: "bi-chat-square-text" },
    { key: "en_reserve",   label: "En réserve",     icon: "bi-archive" },
    { key: "recrute",      label: "Recrutés",       icon: "bi-trophy" },
    { key: "refuse",       label: "Non retenus",    icon: "bi-x-circle" },
];

// ── EMAIL TEMPLATES avec placeholders (bruts, non résolus côté JS) ──
// ── EMAIL TEMPLATES avec placeholders (bruts, non résolus côté JS) ──
// IMPORTANT: Utiliser des apostrophes normales ' et pas &apos; ou ’
const EMAIL_TEMPLATES = {
    en_attente: {
        sujet: "Votre candidature pour le poste de {poste} est en cours d’évaluation",
        corps: "Nous avons bien reçu votre candidature pour le poste de {poste} et nous vous informons qu'elle est actuellement en cours d’évaluation par notre équipe.\n\nNous reviendrons vers vous dans les meilleurs délais.\n\nCordialement,\nL’équipe de recrutement de {entreprise}"
    },
    refuse_cv: {
        sujet: "Réponse à votre candidature pour le poste de {poste}",
        corps: "Nous vous remercions de l’intérêt que vous avez porté au poste de {poste} au sein de {entreprise}.\n\nAprès analyse de votre CV, nous avons le regret de vous informer que votre profil ne correspond pas aux critères requis pour ce poste.\n\nNous vous souhaitons bonne continuation dans vos recherches.\n\nCordialement,\nL’équipe de recrutement de {entreprise}"
    },
    retenu: {
        sujet: "Votre candidature pour le poste de {poste} est retenue — Invitation à un entretien",
        corps: "Nous avons le plaisir de vous informer que votre candidature pour le poste de {poste} au sein de {entreprise} a été retenue.\n\nNous vous contacterons prochainement pour fixer la date et l’heure de l’entretien.\n\nCordialement,\nL’équipe de recrutement de {entreprise}"
    },
    entretien_ok: {
        sujet: "Entretien validé pour le poste de {poste} — Prochaine étape",
        corps: "Nous vous informons que votre entretien pour le poste de {poste} au sein de {entreprise} a été validé avec succès. Votre dossier est en cours d’examen final.\n\nNous vous tiendrons informé(e) très prochainement de la suite donnée à votre candidature.\n\nCordialement,\nL’équipe de recrutement de {entreprise}"
    },
    refuse: {
        sujet: "Réponse à votre candidature pour le poste de {poste}",
        corps: "Nous vous remercions de l’intérêt que vous avez porté au poste de {poste} au sein de {entreprise}.\n\nAprès examen approfondi de votre dossier, nous avons le regret de vous informer que votre profil ne correspond pas aux critères requis pour ce poste.\n\nNous vous souhaitons bonne continuation dans vos recherches.\n\nCordialement,\nL’équipe de recrutement de {entreprise}"
    },
    en_reserve: {
        sujet: "Votre candidature pour le poste de {poste} est mise en réserve",
        corps: "Votre candidature pour le poste de {poste} au sein de {entreprise} a été examinée avec attention.\n\nBien que votre profil ne corresponde pas à nos besoins immédiats, nous souhaitons conserver votre dossier dans notre vivier de talents.\n\nNous ne manquerons pas de vous recontacter si une opportunité correspondant à votre profil se présente.\n\nCordialement,\nL’équipe de recrutement de {entreprise}"
    },
    recrute: {
        sujet: "Félicitations — Vous êtes recruté(e) pour le poste de {poste} !",
        corps: "Nous avons le grand plaisir de vous informer que vous avez été sélectionné(e) pour rejoindre l’équipe de {entreprise} en tant que {poste}.\n\nNous vous contacterons très prochainement pour les modalités de votre intégration.\n\nBienvenue parmi nous !\n\nCordialement,\nL’équipe de recrutement de {entreprise}"
    },
};

// ── Fonction de résolution des placeholders POUR LA PRÉVISUALISATION SEULEMENT ──
// Côté JS, on résout seulement pour l'affichage dans le drawer et la modale
// Pour l'envoi, on envoie les templates bruts au PHP
function resolveTemplateForPreview(tpl, posteVal, entrepriseVal) {
    const p = posteVal || "ce poste";
    const e = entrepriseVal || "notre entreprise";
    return {
        sujet: tpl.sujet.replace(/\{poste\}/g, p).replace(/\{entreprise\}/g, e),
        corps: tpl.corps.replace(/\{poste\}/g, p).replace(/\{entreprise\}/g, e),
    };
}

const SECTEURS = [
    "Agriculture / Élevage / Pêche","Agroalimentaire","Architecture / Urbanisme / Design",
    "Art / Culture / Spectacle","Artisanat / Métiers manuels","Audit / Expertise comptable",
    "Bailleur / Organisme international","Banque / Assurance / Microfinance",
    "Bois / Papier / Carton / Imprimerie","BTP / Matériaux de construction",
    "Chimie / Parachimie","Commerce / Négoce / Distribution",
    "Communication / Marketing / Publicité","Droit / Juridique / Notariat",
    "Économie / Statistiques / Recherche","Édition / Multimédia / Presse",
    "Education / Formation / Enseignement","Électronique / Électricité / Énergie",
    "Environnement / Développement durable","Études et conseils / Consulting",
    "Finance / Comptabilité / Gestion","Hôtellerie / Restauration / Tourisme",
    "Humanitaire / ONG / Associatif","Immobilier / Foncier",
    "Industrie pharmaceutique","Informatique / Télécoms / Numérique",
    "Machines et équipements / Automobile","Management / Direction générale",
    "Mines / Pétrole / Énergie","Métallurgie / Travail du métal",
    "Plastique / Caoutchouc","Ressources humaines / Recrutement",
    "Santé / Médical / Paramédical","Sécurité / Défense / Gardiennage",
    "Services aux entreprises / Facilities","Sport / Bien-être / Loisirs",
    "Textile / Habillement / Chaussure","Transports / Logistique / Supply Chain",
    "Autre / Non classifié",
];

const COMMUNES = [
    "Abobo","Adjamé","Attécoubé","Cocody","Koumassi","Marcory","Plateau",
    "Port-Bouët","Treichville","Yopougon","Aboisso","Adzopé","Agboville",
    "Bouaké","Bondoukou","Dabou","Daloa","Daoukro","Dimbokro","Divo",
    "Ferkessédougou","Gagnoa","Grand-Bassam","Guiglo","Issia","Jacqueville",
    "Katiola","Korhogo","Man","Minignan","Odienné","San-Pédro","Sassandra",
    "Séguéla","Soubré","Tabou","Toumodi","Yamoussoukro",
    "Autres / Hors Côte d'Ivoire",
];

const NIVEAUX = [
    { value: "cepe",           label: "CEPE" },
    { value: "bepc",           label: "BEPC / Brevet" },
    { value: "cap",            label: "CAP" },
    { value: "bac",            label: "Baccalauréat" },
    { value: "bt",             label: "BT" },
    { value: "bp",             label: "BP" },
    { value: "bts",            label: "BTS" },
    { value: "dut",            label: "DUT" },
    { value: "dts",            label: "DTS" },
    { value: "deug",           label: "DEUG / DEUST" },
    { value: "licence",        label: "Licence / Bachelor" },
    { value: "licence_pro",    label: "Licence pro" },
    { value: "master",         label: "Master 1" },
    { value: "master2",        label: "Master 2 / DEA" },
    { value: "ingenieur",      label: "Ingénieur" },
    { value: "grandes_ecoles", label: "Grande École" },
    { value: "doctorat",       label: "Doctorat / PhD" },
    { value: "autre",          label: "Autre" },
];

// ── Helpers ───────────────────────────────────────────────
const getNoteClass    = (n) => !n ? "pending" : n >= 80 ? "excellent" : n >= 60 ? "good" : n >= 40 ? "average" : "low";
const getNoteLabel    = (n) => !n ? "Non évalué" : `${Math.round(n)}%`;
const getDecisionInfo = (d) => DECISIONS_MAP[d] || DECISIONS_MAP["en_attente"];
const formatDate      = (ts) => new Date(ts).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
const getInitials     = (prenoms, nom) => `${prenoms?.[0]||""}${nom?.[0]||""}`.toUpperCase();

function countByDecision(list) {
    const counts = {};
    list.forEach((p) => { counts[p.decision] = (counts[p.decision] || 0) + 1; });
    return counts;
}

// ── secureFetch ───────────────────────────────────────────
async function secureFetch(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
        signal: options.signal ?? AbortSignal.timeout(90000),
    });
    if (res.status === 401) {
        window.location.replace(LOGIN_REDIRECT);
        return null;
    }
    return res;
}

// ── Helper notification avec SweetAlert2 ──────────────────
function showNotification(icon, title, message, timer = 3000) {
    Swal.fire({
        icon: icon,
        title: title,
        text: message,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true,
        background: icon === 'success' ? '#f0fdf4' : icon === 'error' ? '#fef2f2' : '#fffbeb',
        color: icon === 'success' ? '#166534' : icon === 'error' ? '#991b1b' : '#92400e'
    });
}

// ══════════════════════════════════════════════════════════
// COMPOSANT : MODAL DÉTAIL SCORE IA
// ══════════════════════════════════════════════════════════
function IaScoreModal({ candidat, onClose, onReanalyze, analyzing }) {
    useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    if (!candidat) return null;

    const note = candidat.note_ia;
    const nc   = getNoteClass(note);
    const commentaire = candidat.commentaire_ia || "";

    const lines     = commentaire.split("\n\n");
    const resume    = lines[0] || "";
    const restLines = lines.slice(1);

    const evalScores = [
        { label: "Expérience professionnelle", value: candidat.eval_experience,     max: 25 },
        { label: "Formation académique",        value: candidat.eval_formation,      max: 20 },
        { label: "Compétences techniques",      value: candidat.eval_competences,    max: 20 },
        { label: "Niveau de responsabilité",    value: candidat.eval_responsabilite, max: 15 },
        { label: "Expérience secteur",          value: candidat.eval_secteur,        max: 15 },
        { label: "Qualité du CV",               value: candidat.eval_cv,             max: 5  },
    ];

    const hasScores  = evalScores.some(s => s.value > 0);
    const gaugeColor = note >= 80 ? "#16a34a" : note >= 60 ? "#0a78b5" : note >= 40 ? "#d97706" : "#dc2626";
    const bgColor    = note >= 80 ? "#f0fdf4" : note >= 60 ? "#eff6ff" : note >= 40 ? "#fffbeb" : "#fff5f5";

    return (
        <>
            <div className="drawer-overlay" onClick={onClose} style={{ zIndex: 1100 }} />
            <div className="ia-score-modal" style={{ zIndex: 1101 }}>
                <div className="ia-score-modal__header">
                    <div className="ia-score-modal__header-left">
                        <div className="ia-score-modal__avatar" style={{ background: gaugeColor + "22", color: gaugeColor }}>
                            <i className="bi bi-robot" />
                        </div>
                        <div>
                            <h3 className="ia-score-modal__title">Analyse Empower AI</h3>
                            <p className="ia-score-modal__subtitle">{candidat.prenoms} {candidat.nom}</p>
                        </div>
                    </div>
                    <button className="drawer-close" onClick={onClose} title="Fermer (Esc)">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <div className="ia-score-modal__body">
                    <div className="ia-score-modal__score-block" style={{ background: bgColor, borderColor: gaugeColor + "33" }}>
                        <div className="ia-score-modal__score-circle">
                            <svg viewBox="0 0 80 80" className="ia-score-modal__gauge-svg">
                                <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="7" />
                                <circle
                                    cx="40" cy="40" r="34" fill="none"
                                    stroke={gaugeColor} strokeWidth="7"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 34}`}
                                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - (note || 0) / 100)}`}
                                    transform="rotate(-90 40 40)"
                                    style={{ transition: "stroke-dashoffset 1s ease" }}
                                />
                            </svg>
                            <div className="ia-score-modal__score-center">
                                <span className="ia-score-modal__score-value" style={{ color: gaugeColor }}>
                                    {note ? `${Math.round(note)}%` : "—"}
                                </span>
                                <span className="ia-score-modal__score-label">Compatibilité</span>
                            </div>
                        </div>
                        <div className="ia-score-modal__score-info">
                            <span className={`postulants-note postulants-note--${nc}`} style={{ fontSize: 13 }}>
                                {nc === "excellent" ? "🏆 Excellent profil" :
                                 nc === "good"      ? "Bon candidat" :
                                 nc === "average"   ? "Profil moyen" :
                                 nc === "low"       ? "Faible compatibilité" :
                                                      "Non évalué"}
                            </span>
                            <p className="ia-score-modal__resume">{resume || "Aucune analyse disponible."}</p>
                        </div>
                    </div>

                    {hasScores && (
                        <div className="ia-score-modal__section">
                            <div className="ia-score-modal__section-title">
                                <i className="bi bi-bar-chart-line" /> Détail des scores
                            </div>
                            <div className="ia-score-modal__bars">
                                {evalScores.map((s) => {
                                    const pct = s.max > 0 ? Math.round((s.value / s.max) * 100) : 0;
                                    const barColor = pct >= 80 ? "#16a34a" : pct >= 60 ? "#0a78b5" : pct >= 40 ? "#d97706" : "#dc2626";
                                    return (
                                        <div key={s.label} className="ia-score-modal__bar-row">
                                            <div className="ia-score-modal__bar-label">
                                                <span>{s.label}</span>
                                            </div>
                                            <div className="ia-score-modal__bar-track">
                                                <div
                                                    className="ia-score-modal__bar-fill"
                                                    style={{ width: `${pct}%`, background: barColor }}
                                                />
                                            </div>
                                            <span className="ia-score-modal__bar-score" style={{ color: barColor }}>
                                                {s.value}/{s.max}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {restLines.length > 0 && (
                        <div className="ia-score-modal__section">
                            <div className="ia-score-modal__section-title">
                                <i className="bi bi-chat-square-quote" /> Analyse détaillée
                            </div>
                            <div className="ia-score-modal__detail-lines">
                                {restLines.map((line, i) => (
                                    <p key={i} className="ia-score-modal__detail-line">{line}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="ia-score-modal__footer">
                        <button
                            className="drawer-btn-save"
                            onClick={() => onReanalyze(candidat.id)}
                            disabled={analyzing}
                            style={{ width: "100%" }}
                        >
                            {analyzing
                                ? <><i className="bi bi-hourglass-split" /> Analyse en cours…</>
                                : <><i className="bi bi-arrow-clockwise" /> Relancer l'analyse Empower AI</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// ══════════════════════════════════════════════════════════
// COMPOSANT : DRAWER PROFIL CANDIDAT
// ══════════════════════════════════════════════════════════
function CandidatDrawer({ candidat, poste, entreprise, onClose, onSaveDecision, saving, onAnalyze, analyzing }) {
    const [activeTab, setActiveTab] = useState("profil");
    const [decisionVal, setDecisionVal] = useState(candidat.decision || "en_attente");

    useEffect(() => {
        setDecisionVal(candidat.decision || "en_attente");
    }, [candidat.decision]);

    useEffect(() => {
        const h = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    if (!candidat) return null;
    const nc  = getNoteClass(candidat.note_ia);
    const dec = getDecisionInfo(candidat.decision);

    function handleDecisionSave() {
        if (decisionVal && decisionVal !== candidat.decision) {
            onSaveDecision(candidat.id, decisionVal);
        }
    }

    return (
        <>
            <div className="drawer-overlay" onClick={onClose} />
            <aside className="drawer">
                <div className="drawer-header">
                    <div className="drawer-header-left">
                        <div className="drawer-avatar">{getInitials(candidat.prenoms, candidat.nom)}</div>
                        <div>
                            <h2 className="drawer-name">{candidat.prenoms} {candidat.nom}</h2>
                            <p className="drawer-meta">{candidat.email} · {candidat.tel}</p>
                        </div>
                    </div>
                    <button className="drawer-close" onClick={onClose} title="Fermer (Esc)">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <div className="drawer-tabs">
                    {[
                        { key: "profil",     label: "Profil"     },
                        { key: "docs",       label: "Documents"  },
                        { key: "decision",   label: "Décision"  },
                        { key: "historique", label: "Historique" },
                    ].map((t) => (
                        <button key={t.key}
                            className={`drawer-tab${activeTab === t.key ? " drawer-tab--active" : ""}`}
                            onClick={() => setActiveTab(t.key)}>
                             {t.label}
                        </button>
                    ))}
                </div>

                <div className="drawer-body">

                    {activeTab === "profil" && (
                        <div className="drawer-section-list">
                            <DrawerRow label="Secteur"           value={candidat.Secteur}  />
                            <DrawerRow label="Niveau académique" value={candidat.Niveau}   />
                            <DrawerRow label="Niveau anglais"    value={candidat.Niveau_A} />
                            <DrawerRow label="Commune"           value={candidat.Commune}  />
                            <DrawerRow label="Quartier"          value={candidat.Quartier} />
                            <DrawerRow label="Genre"             value={candidat.Genre}    />
                            <DrawerRow label="WhatsApp"          value={candidat.telwhat}  />
                            {candidat.noteTest != null && (
                                <DrawerRow label="Test anglais" value={`${candidat.noteTest}/20 ${candidat.classementTest ? `— ${candidat.classementTest}` : ''}`} />
                            )}
                            {candidat.notePression != null && (
                                <DrawerRow label="Test personnalité" value={`${candidat.notePression}/20 ${candidat.classementPression ? `— ${candidat.classementPression}` : ''}`} />
                            )}
                            {candidat.noteDomino != null && (
                                <DrawerRow label="Domino" value={`${candidat.noteDomino}/20 ${candidat.classementDomino ? `— ${candidat.classementDomino}` : ''}`} />
                            )}
                            {candidat.Ref_A && (
                                <div className="drawer-ref-block">
                                    <div className="drawer-ref-title">Références académiques</div>
                                    <pre className="drawer-ref-content">{candidat.Ref_A}</pre>
                                </div>
                            )}
                            {candidat.Ref_P && (
                                <div className="drawer-ref-block">
                                    <div className="drawer-ref-title">Références professionnelles</div>
                                    <pre className="drawer-ref-content">{candidat.Ref_P}</pre>
                                </div>
                            )}
                            <div className="drawer-ia-block">
                                <div className="drawer-ia-header">
                                    <span>Analyse Empower AI</span>
                                    <span className={`postulants-note postulants-note--${nc}`}>{getNoteLabel(candidat.note_ia)}</span>
                                </div>
                                {candidat.commentaire_ia ? (
                                    <p className="drawer-ia-comment">{candidat.commentaire_ia.split("\n\n")[0]}</p>
                                ) : (
                                    <p className="drawer-ia-comment" style={{ color: "#9ca3af", fontStyle: "italic" }}>
                                        Aucune analyse effectuée. Cliquez sur "Analyser IA" pour évaluer ce candidat.
                                    </p>
                                )}
                                <button
                                    className="drawer-btn-save"
                                    style={{ marginTop: 10 }}
                                    onClick={() => onAnalyze(candidat.id)}
                                    disabled={analyzing}
                                >
                                    {analyzing
                                        ? <><i className="bi bi-hourglass-split" /> Analyse en cours…</>
                                        : candidat.note_ia
                                            ? <><i className="bi bi-arrow-clockwise" /> Ré-analyser avec Empower AI</>
                                            : <><i className="bi bi-robot" /> Analyser avec Empower AI</>
                                    }
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === "docs" && (
                        <div className="drawer-docs-list">
                            <DrawerDoc label="Curriculum Vitae"     url={candidat.cv_url}     color="green" />
                            <DrawerDoc label="Lettre de motivation"  url={candidat.lettre_url}   color="blue"  />
                            {candidat.diplomes?.map((url, i) => (
                                <DrawerDoc key={i} label={`Diplôme ${i + 1}`} url={url}  color="amber" />
                            ))}
                            {!candidat.cv_url && !candidat.lettre_url && (!candidat.diplomes || candidat.diplomes.length === 0) && (
                                <div className="drawer-empty"><i className="bi bi-folder-x" /> Aucun document fourni</div>
                            )}
                        </div>
                    )}

                    {activeTab === "decision" && (
                        <div className="drawer-decision-tab">
                            <div className="drawer-field-group">
                                <label className="drawer-field-label">Décision de recrutement</label>
                                <select className="drawer-select" value={decisionVal}
                                    onChange={(e) => setDecisionVal(e.target.value)}>
                                    <option value="">-- Sélectionner --</option>
                                    {Object.entries(DECISIONS_MAP).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </select>
                            </div>
                            {decisionVal && EMAIL_TEMPLATES[decisionVal] && (() => {
                                // Résolution uniquement pour la prévisualisation
                                const preview = resolveTemplateForPreview(EMAIL_TEMPLATES[decisionVal], poste, entreprise);
                                return (
                                    <div className="drawer-email-preview">
                                        <div className="drawer-email-preview-label">Email qui sera envoyé au candidat</div>
                                        <div className="drawer-email-subject">{preview.sujet}</div>
                                        <pre className="drawer-email-body">{preview.corps}</pre>
                                    </div>
                                );
                            })()}
                            <button className="drawer-btn-save"
                                onClick={handleDecisionSave}
                                disabled={saving || !decisionVal || decisionVal === candidat.decision}>
                                {saving
                                    ? <><i className="bi bi-hourglass-split" /> Enregistrement…</>
                                    : <><i className="bi bi-envelope-check" /> Enregistrer &amp; Notifier</>
                                }
                            </button>
                        </div>
                    )}

                    {activeTab === "historique" && (
                        <div className="drawer-history">
                            {(candidat.audit || []).length === 0 ? (
                                <div className="drawer-empty"><i className="bi bi-clock-history" /> Aucune action enregistrée</div>
                            ) : (
                                <div className="drawer-timeline">
                                    {[...candidat.audit].reverse().map((entry, i) => {
                                        const oldDec = getDecisionInfo(entry.oldDecision);
                                        const newDec = getDecisionInfo(entry.newDecision);
                                        return (
                                            <div key={i} className="drawer-timeline-item">
                                                <div className="drawer-timeline-dot" />
                                                <div className="drawer-timeline-content">
                                                    <div className="drawer-timeline-action">
                                                        <span className={`postulants-decision postulants-decision--${oldDec.cls}`} style={{ fontSize:11, padding:"2px 8px" }}>{oldDec.label}</span>
                                                        <i className="bi bi-arrow-right" style={{ fontSize:11, color:"#9ca3af" }} />
                                                        <span className={`postulants-decision postulants-decision--${newDec.cls}`} style={{ fontSize:11, padding:"2px 8px" }}>{newDec.label}</span>
                                                    </div>
                                                    <div className="drawer-timeline-meta">
                                                        <i className="bi bi-clock" /> {formatDate(entry.ts)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}

function DrawerRow({ label, value }) {
    if (!value) return null;
    return (
        <div className="drawer-row">
            <span className="drawer-row-label">{label}</span>
            <span className="drawer-row-value">{value}</span>
        </div>
    );
}

function DrawerDoc({ label, url, icon = "bi-file-earmark", color = "gray" }) {
    return (
        <div className={`drawer-doc drawer-doc--${color}`}>
           
            <span className="drawer-doc-label">{label}</span>
            {url ? (
                <a className="drawer-doc-btn" href={url} target="_blank" rel="noreferrer">
                    <i className="bi bi-download" /> Télécharger
                </a>
            ) : (
                <span className="drawer-doc-missing">Non fourni</span>
            )}
        </div>
    );
}

// ── Modal générique ───────────────────────────────────────
function Modal({ open, title, onClose, children, actions, size }) {
    useEffect(() => {
        if (!open) return;
        const h = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [open, onClose]);
    if (!open) return null;
    return (
        <div className="zs-modal-overlay" onClick={onClose}>
            <div className={`zs-modal${size === "lg" ? " zs-modal--lg" : ""}`} onClick={(e) => e.stopPropagation()}>
                <div className="zs-modal-header">
                    <h3 className="zs-modal-title">{title}</h3>
                    <button className="zs-modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
                </div>
                <div className="zs-modal-body">{children}</div>
                {actions && <div className="zs-modal-footer">{actions}</div>}
            </div>
        </div>
    );
}

// ── Email modal ───────────────────────────────────────────
function EmailModal({ open, onClose, candidats, emailTypeKey, poste, entreprise, onSend }) {
    const [corps, setCorps] = useState("");
    const [step, setStep]   = useState(1);
    const tpl = EMAIL_TEMPLATES[emailTypeKey] || EMAIL_TEMPLATES["en_attente"];
    
    // Résolution pour la prévisualisation seulement
    const preview = resolveTemplateForPreview(tpl, poste, entreprise);

    useEffect(() => {
        if (open) {
            // On garde le template BRUT avec les placeholders pour l'édition
            // car l'utilisateur peut modifier le corps
            setCorps(tpl.corps);
            setStep(1);
        }
    }, [open, emailTypeKey]);

    if (!open) return null;
    
    return (
        <Modal open={open} onClose={onClose} title={`Email — ${candidats.length} candidat(s)`} size="lg"
            actions={
                step === 1 ? (
                    <>
                        <button className="zs-btn zs-btn--ghost" onClick={onClose}>Annuler</button>
                        <button className="zs-btn zs-btn--primary" onClick={() => setStep(2)}>
                            <i className="bi bi-arrow-right" /> Vérifier avant envoi
                        </button>
                    </>
                ) : (
                    <>
                        <button className="zs-btn zs-btn--ghost" onClick={() => setStep(1)}>← Retour</button>
                        <button className="zs-btn zs-btn--send" onClick={() => { onSend(corps); onClose(); }}>
                             Confirmer l'envoi à {candidats.length} candidat(s)
                        </button>
                    </>
                )
            }>
            {step === 1 ? (
                <>
                    <div className="email-modal-field">
                        <div className="email-modal-field-label">Destinataires ({candidats.length})</div>
                        <div className="email-modal-recipients">
                            {candidats.map((c) => <span key={c.id} className="email-modal-chip">{c.prenoms} {c.nom}</span>)}
                        </div>
                    </div>
                    <div className="email-modal-field">
                        <div className="email-modal-field-label">Objet</div>
                        <div className="email-modal-subject">{preview.sujet}</div>
                    </div>
                    <div className="email-modal-field">
                        <div className="email-modal-field-label">Corps du message — modifiable</div>
                        <textarea className="email-modal-textarea" value={corps} onChange={(e) => setCorps(e.target.value)} />
                    </div>
                </>
            ) : (
                <div className="email-modal-confirm">
                    <p>Vous allez envoyer un email à <strong>{candidats.length} candidat(s)</strong>.</p>
                    <p>Objet : <em>{preview.sujet}</em></p>
                    <div className="email-modal-recipients" style={{ marginTop:12 }}>
                        {candidats.map((c) => <span key={c.id} className="email-modal-chip">{c.prenoms} {c.nom}</span>)}
                    </div>
                </div>
            )}
        </Modal>
    );
}

// ── Analytics ─────────────────────────────────────────────
function AnalyticsBanner({ postulants }) {
    const counts = countByDecision(postulants);
    const total  = postulants.length;
    const avgIA  = postulants.filter(p => p.note_ia).reduce((s, p) => s + p.note_ia, 0) /
        (postulants.filter(p => p.note_ia).length || 1);
    const hommes = postulants.filter(p => p.Genre?.toLowerCase() === "homme").length;
    const femmes = postulants.filter(p => p.Genre?.toLowerCase() === "femme").length;

    const stats = [
        { label: "Total candidats",  value: total,                                                color: "blue"   },
        { label: "Score IA moyen",   value: `${Math.round(avgIA || 0)}%`,                         color: "purple" },
        { label: "Retenus",          value: counts["retenu"] || 0,                                color: "green"  },
        { label: "Recrutés",         value: counts["recrute"] || 0,                               color: "gold"   },
        { label: "Non retenus",      value: (counts["refuse"] || 0) + (counts["refuse_cv"] || 0), color: "red"    },
        { label: "Hommes / Femmes",  value: `${hommes} / ${femmes}`,                              color: "teal"   },
    ];
    return (
        <div className="analytics-banner">
            {stats.map((s, i) => (
                <div key={i} className={`analytics-stat analytics-stat--${s.color}`}>
                    <div>
                        <div className="analytics-stat-value">{s.value}</div>
                        <div className="analytics-stat-label">{s.label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Kanban ────────────────────────────────────────────────
function KanbanView({ postulants, onCardClick, onDecisionChange, onScoreClick }) {
    const [dragId, setDragId] = useState(null);
    function handleDragStart(e, id) { setDragId(id); e.dataTransfer.effectAllowed = "move"; }
    function handleDrop(e, colKey) { e.preventDefault(); if (dragId !== null) { onDecisionChange(dragId, colKey); setDragId(null); } }
    function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }

    return (
        <div className="kanban-board">
            {KANBAN_COLUMNS.map((col) => {
                const cards = postulants.filter((p) => (p.decision || "en_attente") === col.key);
                const dec   = getDecisionInfo(col.key);
                return (
                    <div key={col.key} className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.key)}>
                        <div className="kanban-column-header">
                            <span className={`kanban-column-icon kanban-icon--${dec.cls}`}><i className={`bi ${col.icon}`} /></span>
                            <span className="kanban-column-label">{col.label}</span>
                            <span className="kanban-column-count">{cards.length}</span>
                        </div>
                        <div className="kanban-cards">
                            {cards.length === 0 && <div className="kanban-empty"><i className="bi bi-inbox" /> Glissez un candidat ici</div>}
                            {cards.map((p) => (
                                <div key={p.id}
                                    className={`kanban-card${dragId === p.id ? " kanban-card--dragging" : ""}`}
                                    draggable onDragStart={(e) => handleDragStart(e, p.id)} onClick={() => onCardClick(p)}>
                                    <div className="kanban-card-header">
                                        <div className="kanban-card-avatar">{getInitials(p.prenoms, p.nom)}</div>
                                        <div className="kanban-card-info">
                                            <div className="kanban-card-name">{p.prenoms} {p.nom}</div>
                                            <div className="kanban-card-sector">{p.Secteur}</div>
                                        </div>
                                    </div>
                                    <div className="kanban-card-footer">
                                        <span
                                            className={`postulants-note postulants-note--${getNoteClass(p.note_ia)}`}
                                            style={{ fontSize:11, padding:"2px 8px", cursor: p.note_ia ? "pointer" : "default" }}
                                            onClick={(e) => { e.stopPropagation(); if (p.note_ia) onScoreClick(p); }}
                                            title={p.note_ia ? "Voir le détail de l'analyse IA" : ""}
                                        >
                                            {getNoteLabel(p.note_ia)}
                                        </span>
                                        <span className="kanban-card-commune">{p.Commune}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Bulk bar ──────────────────────────────────────────────
function BulkActionBar({ count, onEmail, onDecision, onDeselect, emailType, setEmailType }) {
    if (count === 0) return null;
    return (
        <div className="bulk-bar">
            <div className="bulk-bar-left">
                <button className="bulk-bar-deselect" onClick={onDeselect}><i className="bi bi-x-circle" /></button>
                <span className="bulk-bar-count"><strong>{count}</strong> candidat{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}</span>
            </div>
            <div className="bulk-bar-actions">
                <select className="bulk-bar-select" value={emailType} onChange={(e) => setEmailType(e.target.value)}>
                    <option value="">Template email…</option>
                    {Object.entries(DECISIONS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button className="bulk-bar-btn bulk-bar-btn--email"    onClick={onEmail}    disabled={!emailType}>Envoyer email</button>
                <button className="bulk-bar-btn bulk-bar-btn--decision" onClick={onDecision}>Changer décision</button>
            </div>
        </div>
    );
}

// ── Bulk decision modal ───────────────────────────────────
function BulkDecisionModal({ open, onClose, count, onSave }) {
    const [val, setVal] = useState("");
    useEffect(() => { if (open) setVal(""); }, [open]);
    return (
        <Modal open={open} onClose={onClose} title={`Changer la décision — ${count} candidat(s)`}
            actions={
                <>
                    <button className="zs-btn zs-btn--ghost" onClick={onClose}>Annuler</button>
                    <button className="zs-btn zs-btn--primary" onClick={() => { if (val) { onSave(val); onClose(); } }} disabled={!val}>
                        <i className="bi bi-check2" /> Appliquer
                    </button>
                </>
            }>
            <div className="email-modal-field">
                <div className="email-modal-field-label">Nouvelle décision pour {count} candidat(s)</div>
                <select className="drawer-select" value={val} onChange={(e) => setVal(e.target.value)}>
                    <option value="">-- Sélectionner --</option>
                    {Object.entries(DECISIONS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>
            {val && (
                <div className="zs-modal-info-block">
                    <i className="bi bi-info-circle" /> Les {count} candidat(s) passeront au statut <strong>{getDecisionInfo(val).label}</strong>.
                </div>
            )}
        </Modal>
    );
}

// ── Progress modal ────────────────────────────────────────
function ProgressModal({ current, total }) {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    return (
        <div className="postulants-progress-overlay">
            <div className="postulants-progress-box">
                <i className="bi bi-hourglass-split" />
                <h5>Analyse en cours avec Empower AI</h5>
                <div className="postulants-progress-track">
                    <div className="postulants-progress-bar" style={{ width:`${pct}%` }}>{pct > 10 && `${pct}%`}</div>
                </div>
                <p className="postulants-progress-detail">{current} candidat(s) analysé(s) sur {total}</p>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
                    Chaque analyse prend ~10-20 secondes via Mistral AI
                </p>
            </div>
        </div>
    );
}

// ── Pagination ────────────────────────────────────────────
function Pagination({ page, totalPages, onChange }) {
    if (totalPages <= 1) return null;
    const pages = [];
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) range.push(i);
    pages.push(<button key={1} className={`postulants-page-num${page===1?" postulants-page-num--active":""}`} onClick={() => onChange(1)}>1</button>);
    if (range[0] > 2) pages.push(<span key="el1" className="postulants-page-ellipsis">…</span>);
    range.forEach((n) => pages.push(<button key={n} className={`postulants-page-num${page===n?" postulants-page-num--active":""}`} onClick={() => onChange(n)}>{n}</button>));
    if (range[range.length-1] < totalPages-1) pages.push(<span key="el2" className="postulants-page-ellipsis">…</span>);
    if (totalPages > 1) pages.push(<button key={totalPages} className={`postulants-page-num${page===totalPages?" postulants-page-num--active":""}`} onClick={() => onChange(totalPages)}>{totalPages}</button>);
    return (
        <div className="postulants-pagination">
            <button className="postulants-page-btn" onClick={() => onChange(Math.max(1,page-1))} disabled={page===1}><i className="bi bi-chevron-left" /><span className="postulants-page-label">Précédent</span></button>
            {pages}
            <button className="postulants-page-btn" onClick={() => onChange(Math.min(totalPages,page+1))} disabled={page===totalPages}><span className="postulants-page-label">Suivant</span><i className="bi bi-chevron-right" /></button>
        </div>
    );
}

// ── Skeleton ──────────────────────────────────────────────
function TableSkeleton() {
    return (
        <div style={{ padding: "24px 0" }}>
            {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8, marginBottom: 10, opacity: 1 - i * 0.15 }} />
            ))}
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════
export default function Postulants() {
    useBootstrapIcons();

    const [searchParams] = useSearchParams();
    const eventId = searchParams.get("event_id") || "";
    const poste   = searchParams.get("poste")    || "";

    const { checked } = useSessionGuard();

    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const h = () => setWidth(window.innerWidth);
        window.addEventListener("resize", h);
        return () => window.removeEventListener("resize", h);
    }, []);
    const isMobile = width <= 600;
    const [sidebarOpen, setSidebarOpen] = useState(width > 768);
    useEffect(() => { if (width <= 768) setSidebarOpen(false); }, [width]);

    // ── État principal ────────────────────────────────────
    const [postulants,  setPostulants]  = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState("");
    const [saving,      setSaving]      = useState(false);
    const [analyzing,   setAnalyzing]   = useState(false);
    const [viewMode,    setViewMode]    = useState("table");
    const [entrepriseNom, setEntrepriseNom] = useState("");

    // ── Filtres ───────────────────────────────────────────
    const [search,         setSearch]         = useState("");
    const [page,           setPage]           = useState(1);
    const [filterSecteur,  setFilterSecteur]  = useState("");
    const [filterNiveau,   setFilterNiveau]   = useState("");
    const [filterAnglais,  setFilterAnglais]  = useState("");
    const [filterGenre,    setFilterGenre]    = useState("");
    const [filterNoteIA,   setFilterNoteIA]   = useState("");
    const [filterCommune,  setFilterCommune]  = useState("");
    const [filterQuartier, setFilterQuartier] = useState("");
    const [filterDecision, setFilterDecision] = useState("");
    const [filtersOpen,    setFiltersOpen]    = useState(true);
    const [sortKey,        setSortKey]        = useState("");
    const [sortDir,        setSortDir]        = useState("asc");

    const [selectedIds,           setSelectedIds]           = useState(new Set());
    const [emailType,             setEmailType]             = useState("");
    const [drawerCandidat,        setDrawerCandidat]        = useState(null);
    const [scoreModalCandidat,    setScoreModalCandidat]    = useState(null);
    const [emailModalOpen,        setEmailModalOpen]        = useState(false);
    const [bulkDecisionModalOpen, setBulkDecisionModalOpen] = useState(false);
    const [progressAnalyze,       setProgressAnalyze]       = useState(null);
    const tableRef = useRef(null);

    // ── Chargement ────────────────────────────────────────
    const loadPostulants = useCallback(async () => {
        if (!eventId) { setError("Aucune offre sélectionnée (event_id manquant)."); setLoading(false); return; }
        setLoading(true);
        setError("");
        try {
            const res = await secureFetch(`${API_POSTULANTS}?event_id=${eventId}`);
            if (!res) return;
            const json = await res.json();
            if (!json.success) throw new Error(json.message || "Erreur API");
            
            const postulantsData = json.data || [];
            // Récupérer le nom de l'entreprise depuis le premier candidat
            if (postulantsData.length > 0 && postulantsData[0].entreprise_nom) {
                setEntrepriseNom(postulantsData[0].entreprise_nom);
            }
            
            setPostulants(postulantsData.map(p => ({ ...p, audit: [] })));
        } catch (e) {
            setError(e.message || "Erreur lors du chargement des postulants.");
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { if (checked) loadPostulants(); }, [checked, loadPostulants]);

    // ── Helpers UI ────────────────────────────────────────
    function handleSort(key) {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("asc"); }
    }
    function SortIcon({ col }) {
        if (sortKey !== col) return <i className="bi bi-arrow-down-up sort-icon sort-icon--inactive" />;
        return <i className={`bi bi-arrow-${sortDir === "asc" ? "up" : "down"} sort-icon sort-icon--active`} />;
    }

    useEffect(() => { setPage(1); setSelectedIds(new Set()); },
        [search, filterSecteur, filterNiveau, filterAnglais, filterGenre, filterNoteIA, filterCommune, filterQuartier, filterDecision]);

    // ── Filtrage + tri ────────────────────────────────────
    const filtered = postulants.filter((p) => {
        const q    = search.toLowerCase();
        const ms   = !q   || `${p.nom} ${p.prenoms} ${p.email} ${p.Secteur} ${p.Commune}`.toLowerCase().includes(q);
        const mSec = !filterSecteur  || p.Secteur === filterSecteur;
        const mNiv = !filterNiveau   || p.Niveau  === filterNiveau;
        const mAng = !filterAnglais  || p.Niveau_A=== filterAnglais;
        const mGen = !filterGenre    || p.Genre?.toLowerCase() === filterGenre;
        const mCom = !filterCommune  || p.Commune === filterCommune;
        const mQua = !filterQuartier || p.Quartier?.toLowerCase().includes(filterQuartier.toLowerCase());
        const mDec = !filterDecision || (p.decision || "en_attente") === filterDecision;
        let mNote  = true;
        if (filterNoteIA) {
            const n = p.note_ia;
            if      (filterNoteIA === "excellent")  mNote = n != null && n >= 80;
            else if (filterNoteIA === "bon")        mNote = n != null && n >= 60 && n < 80;
            else if (filterNoteIA === "moyen")      mNote = n != null && n >= 40 && n < 60;
            else if (filterNoteIA === "faible")     mNote = n != null && n < 40;
            else if (filterNoteIA === "non-evalue") mNote = n === null || n === 0;
        }
        return ms && mSec && mNiv && mAng && mGen && mCom && mQua && mDec && mNote;
    });

    const sorted = [...filtered].sort((a, b) => {
        if (!sortKey) return 0;
        let va = a[sortKey], vb = b[sortKey];
        if (sortKey === "note_ia") { va = va ?? -1; vb = vb ?? -1; }
        if (typeof va === "string") va = va.toLowerCase();
        if (typeof vb === "string") vb = vb.toLowerCase();
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ?  1 : -1;
        return 0;
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    function handlePageChange(n) {
        setPage(n);
        tableRef.current?.scrollIntoView({ behavior:"smooth", block:"start" });
    }

    // ── Sauvegarde décision + envoi email individuel ──────
    const handleSaveDecision = useCallback(async (id, decision) => {
        setSaving(true);
        try {
            const res = await secureFetch(`${API_POSTULANTS}?action=decision`, {
                method: "POST",
                body: JSON.stringify({ postulant_id: id, decision }),
            });
            if (!res) return;
            const json = await res.json();
            if (!json.success) throw new Error(json.message);

            const mkAudit = (p) => ({ oldDecision: p.decision || "en_attente", newDecision: decision, ts: Date.now() });
            setPostulants((prev) => prev.map((p) =>
                p.id !== id ? p : { ...p, decision, audit: [...(p.audit || []), mkAudit(p)] }
            ));
            setDrawerCandidat((prev) =>
                prev?.id !== id ? prev : { ...prev, decision, audit: [...(prev.audit || []), mkAudit(prev)] }
            );

            const tpl = EMAIL_TEMPLATES[decision];
            if (tpl) {
                // Envoi des templates BRUTS avec placeholders - le PHP fera les remplacements
                const mailRes = await secureFetch(`${API_MAIL}?action=send_one`, {
                    method: "POST",
                    body: JSON.stringify({
                        postulant_id: id,
                        decision,
                        sujet: tpl.sujet,   // ← brut avec {poste} et {entreprise}
                        corps: tpl.corps,   // ← brut avec {poste} et {entreprise}
                        poste: poste,
                    }),
                });
                if (mailRes) {
                    const mailJson = await mailRes.json();
                    if (mailJson.success) {
                        showNotification('success', 'Succès', 'Décision enregistrée & email envoyé.');
                    } else {
                        showNotification('warning', 'Attention', `Décision enregistrée, email échoué : ${mailJson.message}`);
                    }
                }
            } else {
                showNotification('success', 'Succès', 'Décision enregistrée.');
            }
        } catch (e) {
            showNotification('error', 'Erreur', `❌ ${e.message}`);
        } finally {
            setSaving(false);
        }
    }, [poste]);

    function handleBulkDecision(decision) {
        [...selectedIds].forEach((id) => handleSaveDecision(id, decision));
        setSelectedIds(new Set());
    }

    // ── Analyse IA ────────────────────────────────────────
    const handleAnalyze = useCallback(async (id) => {
        setAnalyzing(id);
        try {
            const res = await secureFetch(`${API_POSTULANTS}?action=analyze_ia`, {
                method: "POST",
                body: JSON.stringify({ postulant_id: id }),
            });
            if (!res) return;
            const json = await res.json();

            if (!json.success) { 
                showNotification('error', 'Erreur', `❌ ${json.message}`); 
                return; 
            }

            const updates = {
                note_ia:             json.note_ia,
                commentaire_ia:      json.commentaire_ia,
                note_100:            json.note_100,
                eval_experience:     json.eval_scores?.experience     ?? 0,
                eval_formation:      json.eval_scores?.formation      ?? 0,
                eval_competences:    json.eval_scores?.competences    ?? 0,
                eval_responsabilite: json.eval_scores?.responsabilite ?? 0,
                eval_secteur:        json.eval_scores?.secteur        ?? 0,
                eval_cv:             json.eval_scores?.qualite_cv     ?? 0,
            };

            setPostulants((prev) => prev.map((p) => p.id !== id ? p : { ...p, ...updates }));
            setDrawerCandidat((prev) => prev?.id === id ? { ...prev, ...updates } : prev);
            setScoreModalCandidat((prev) => prev?.id === id ? { ...prev, ...updates } : prev);

            showNotification('success', 'Analyse terminée', `✅ Score : ${Math.round(json.note_ia)}%`);
        } catch (e) {
            showNotification('error', 'Erreur', `❌ ${e.message}`);
        } finally {
            setAnalyzing(false);
        }
    }, []);

    async function handleAnalyzeAll() {
        const total = filtered.length;
        if (!total) return;
        
        Swal.fire({
            title: 'Analyse en cours',
            text: `Analyse de ${total} candidat(s) par Empower AI...`,
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
        
        setProgressAnalyze({ current: 0, total });
        for (let i = 0; i < total; i++) {
            await handleAnalyze(filtered[i].id);
            setProgressAnalyze({ current: i + 1, total });
            if (i < total - 1) await new Promise((r) => setTimeout(r, 500));
        }
        setProgressAnalyze(null);
        Swal.close();
        showNotification('success', 'Terminé', ` ${total} candidat(s) analysé(s) par Empower AI.`);
    }

    function handleScoreClick(candidat) { setScoreModalCandidat(candidat); }

    // ── Export Excel ──────────────────────────────────────
    function handleExportExcel() {
        const doExport = () => {
            const XLSX = window.XLSX;
            const wb   = XLSX.utils.book_new();
            const headers = ["Nom","Prénoms","Email","Téléphone","WhatsApp","Secteur","Niveau","Anglais","Commune","Quartier","Genre","Score IA (%)","Décision"];
            const rows = filtered.map((p) => [
                p.nom, p.prenoms, p.email, p.tel, p.telwhat,
                p.Secteur, p.Niveau, p.Niveau_A, p.Commune, p.Quartier, p.Genre,
                p.note_ia ?? "", getDecisionInfo(p.decision).label,
            ]);
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            XLSX.utils.book_append_sheet(wb, ws, "Postulants");
            const filename = poste
                ? `postulants_${poste.replace(/[^a-z0-9]/gi,"_")}.xlsx`
                : eventId ? `postulants_offre_${eventId}.xlsx` : "postulants.xlsx";
            XLSX.writeFile(wb, filename);
        };
        if (window.XLSX) { doExport(); }
        else {
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
            s.onload = doExport;
            document.head.appendChild(s);
        }
    }

    // ── Sélection ─────────────────────────────────────────
    const allPageSelected = paginated.length > 0 && paginated.every((p) => selectedIds.has(p.id));
    function toggleSelect(id) {
        setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
    }
    function toggleSelectAll() {
        if (allPageSelected) setSelectedIds(new Set());
        else setSelectedIds(new Set(paginated.map((p) => p.id)));
    }
    const selectedCandidats = postulants.filter((p) => selectedIds.has(p.id));
    const decisionCounts    = countByDecision(postulants);

    function handleEnvoiEmail() { if (!selectedIds.size || !emailType) return; setEmailModalOpen(true); }

    // ── Envoi email en masse ──────────────────────────────
    async function handleEmailSent(corps) {
    const ids = [...selectedIds];
    const tpl = EMAIL_TEMPLATES[emailType] || EMAIL_TEMPLATES["en_attente"];
    
    Swal.fire({
        title: 'Envoi en cours',
        text: `Envoi de ${ids.length} email(s)...`,
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });
    
    try {
        const res = await secureFetch(`${API_MAIL}?action=send_bulk`, {
            method: "POST",
            body: JSON.stringify({
                postulant_ids: ids,
                decision:      emailType,
                sujet:         tpl.sujet,
                corps:         corps,
                poste:         poste,
            }),
        });
        if (!res) return;
        const json = await res.json();
        Swal.close();
        
        if (!json.success) throw new Error(json.message);

        // ✅ AJOUT : mettre à jour la décision de chaque candidat sélectionné
        setPostulants((prev) =>
            prev.map((p) => {
                if (!selectedIds.has(p.id)) return p;
                const audit = [
                    ...(p.audit || []),
                    { oldDecision: p.decision || "en_attente", newDecision: emailType, ts: Date.now() }
                ];
                return { ...p, decision: emailType, audit };
            })
        );

        // ✅ AJOUT : mettre à jour aussi le drawer si un candidat concerné est ouvert
        setDrawerCandidat((prev) => {
            if (!prev || !selectedIds.has(prev.id)) return prev;
            const audit = [
                ...(prev.audit || []),
                { oldDecision: prev.decision || "en_attente", newDecision: emailType, ts: Date.now() }
            ];
            return { ...prev, decision: emailType, audit };
        });

        // ✅ AJOUT : persister la décision en base via l'API pour chaque candidat
        await Promise.allSettled(
            ids.map((id) =>
                secureFetch(`${API_POSTULANTS}?action=decision`, {
                    method: "POST",
                    body: JSON.stringify({ postulant_id: id, decision: emailType }),
                })
            )
        );
        
        setSelectedIds(new Set());
        setEmailType("");
        
        const msg = json.data.failed 
            ? `${json.data.sent} email(s) envoyé(s) — ${json.data.failed} échec(s)`
            : `${json.data.sent} email(s) envoyé(s) avec succès`;
        showNotification('success', 'Envoi terminé', `${msg} — décisions mises à jour`);
    } catch (e) {
        Swal.close();
        showNotification('error', 'Erreur', ` ${e.message}`);
    }
}

    // ── Carte mobile ──────────────────────────────────────
    function renderMobileCard(p) {
        const nc  = getNoteClass(p.note_ia);
        const dec = getDecisionInfo(p.decision);
        return (
            <div className="postulants-mobile-card" key={p.id} onClick={() => setDrawerCandidat(p)}>
                <div className="postulants-mobile-card__header">
                    <label style={{ display:"flex",alignItems:"flex-start",gap:8,flex:1,cursor:"pointer" }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="postulants-checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} style={{ marginTop:2,flexShrink:0 }} />
                        <div>
                            <div className="postulants-mobile-card__name">{p.prenoms} {p.nom}</div>
                            <div className="postulants-mobile-card__email">{p.email}</div>
                        </div>
                    </label>
                    <span
                        className={`postulants-note postulants-note--${nc}`}
                        onClick={(e) => { e.stopPropagation(); if (p.note_ia) handleScoreClick(p); }}
                        style={{ cursor: p.note_ia ? "pointer" : "default" }}
                        title={p.note_ia ? "Voir le détail de l'analyse" : ""}
                    >
                        {getNoteLabel(p.note_ia)}
                    </span>
                </div>
                <div className="postulants-mobile-card__grid">
                    <div className="postulants-mobile-card__item"><span className="postulants-mobile-card__label">Secteur</span><span className="postulants-mobile-card__value">{p.Secteur}</span></div>
                    <div className="postulants-mobile-card__item"><span className="postulants-mobile-card__label">Niveau</span><span className="postulants-mobile-card__value">{p.Niveau}</span></div>
                    <div className="postulants-mobile-card__item"><span className="postulants-mobile-card__label">Commune</span><span className="postulants-mobile-card__value">{p.Commune}</span></div>
                    <div className="postulants-mobile-card__item"><span className="postulants-mobile-card__label">Genre</span><span className="postulants-mobile-card__value">{p.Genre}</span></div>
                </div>
                <div className="postulants-mobile-card__footer">
                    <span className={`postulants-decision postulants-decision--${dec.cls}`}>{dec.label}</span>
                    <button className="drawer-analyze-btn" onClick={e => { e.stopPropagation(); handleAnalyze(p.id); }} disabled={analyzing === p.id}>
                        <i className={`bi ${analyzing === p.id ? "bi-hourglass-split" : "bi-robot"}`} />
                        {analyzing === p.id ? "Analyse…" : p.note_ia ? "Ré-analyser" : "Analyser"}
                    </button>
                </div>
            </div>
        );
    }

    // ── Guard session ─────────────────────────────────────
    if (!checked) {
        return (
            <div className="session-guard">
                <div className="session-guard__spinner" />
                <span className="session-guard__label">Vérification en cours…</span>
            </div>
        );
    }

    return (
        <div className="app">
            <Header sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((p) => !p)} isMobile={isMobile} />
            <div className="layout">
                <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>
                    <div className="postulants-page">

                        <div className="postulants-breadcrumb">
                            <h1>
                                {poste
                                    ? <span style={{ color:"var(--blue-zt)",fontWeight:700 }}>{poste}</span>
                                    : <>Liste des Postulants</>
                                }
                                <span className="groq-badge">⚡ Empower AI</span>
                            </h1>
                            <p>
                                <a href="/securebackoffice/acceuil">Accueil</a>{" / "}
                                <a href="/securebackoffice/offres">Gestion des Offres</a>
                            </p>
                        </div>

                        {error && !loading && (
                            <div className="postulants-error">
                                <i className="bi bi-exclamation-circle-fill postulants-error__icon" />
                                <span className="postulants-error__msg">{error}</span>
                                <button className="postulants-error__btn" onClick={loadPostulants}>Réessayer</button>
                            </div>
                        )}

                        <AnalyticsBanner postulants={postulants} />

                        <div className="postulants-card" ref={tableRef}>

                            <div className="postulants-toolbar">
                                <div className="postulants-search">
                                    <i className="bi bi-search" />
                                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher nom, email, secteur, commune…" />
                                    {search && <button className="postulants-search-clear" onClick={() => setSearch("")}><i className="bi bi-x" /></button>}
                                </div>
                                <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                                    <div className="view-toggle">
                                        <button className={`view-toggle-btn${viewMode==="table"  ?" view-toggle-btn--active":""}`} onClick={() => setViewMode("table")}  title="Vue tableau"><i className="bi bi-table"  /></button>
                                        <button className={`view-toggle-btn${viewMode==="kanban" ?" view-toggle-btn--active":""}`} onClick={() => setViewMode("kanban")} title="Vue Kanban"><i className="bi bi-kanban" /></button>
                                    </div>
                                    <button className={`postulants-btn-filters${filtersOpen?" postulants-btn-filters--active":""}`} onClick={() => setFiltersOpen(v => !v)}>
                                        <i className="bi bi-funnel" /><span>Filtres</span>
                                        {(filterSecteur||filterNiveau||filterAnglais||filterGenre||filterNoteIA||filterCommune||filterQuartier||filterDecision) && <span className="filter-active-dot" />}
                                    </button>
                                    <button className="postulants-btn-export" onClick={handleExportExcel} title={`Exporter ${filtered.length} candidat(s)`}>
                                        <i className="bi bi-file-earmark-excel-fill" /><span>Exporter ({filtered.length})</span>
                                    </button>
                                    <button className="postulants-btn-analyze" onClick={handleAnalyzeAll} disabled={!!progressAnalyze}>
                                        <i className="bi bi-robot" /><span>Analyser tout</span>
                                    </button>
                                </div>
                            </div>

                            {filtersOpen && (
                                <div className="postulants-filters">
                                    <div className="postulants-filter-group">
                                        <label className="postulants-filter-label">Secteur</label>
                                        <select className="postulants-filter-select" value={filterSecteur} onChange={(e) => setFilterSecteur(e.target.value)}>
                                            <option value="">Tous les secteurs</option>
                                            {SECTEURS.map((s) => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="postulants-filter-group">
                                        <label className="postulants-filter-label">Niveau académique</label>
                                        <select className="postulants-filter-select" value={filterNiveau} onChange={(e) => setFilterNiveau(e.target.value)}>
                                            <option value="">Tous les niveaux</option>
                                            {NIVEAUX.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                                        </select>
                                    </div>
                                    <div className="postulants-filter-group">
                                        <label className="postulants-filter-label">Niveau Anglais</label>
                                        <select className="postulants-filter-select" value={filterAnglais} onChange={(e) => setFilterAnglais(e.target.value)}>
                                            <option value="">Tous</option>
                                            {["faible","moyen","courant","bilingue"].map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
                                        </select>
                                    </div>
                                    <div className="postulants-filter-group">
                                        <label className="postulants-filter-label">Genre</label>
                                        <select className="postulants-filter-select" value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}>
                                            <option value="">Tous</option>
                                            <option value="homme">Homme</option>
                                            <option value="femme">Femme</option>
                                        </select>
                                    </div>
                                    <div className="postulants-filter-group">
                                        <label className="postulants-filter-label">Score IA</label>
                                        <select className="postulants-filter-select" value={filterNoteIA} onChange={(e) => setFilterNoteIA(e.target.value)}>
                                            <option value="">Tous</option>
                                            <option value="excellent">Excellent (80–100%)</option>
                                            <option value="bon">Bon (60–79%)</option>
                                            <option value="moyen">Moyen (40–59%)</option>
                                            <option value="faible">Faible (0–39%)</option>
                                            <option value="non-evalue">Non évalué</option>
                                        </select>
                                    </div>
                                    <div className="postulants-filter-group">
                                        <label className="postulants-filter-label">Commune</label>
                                        <select className="postulants-filter-select" value={filterCommune} onChange={(e) => setFilterCommune(e.target.value)}>
                                            <option value="">Toutes</option>
                                            {COMMUNES.map((c) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="postulants-filter-group">
                                        <label className="postulants-filter-label">Quartier</label>
                                        <input className="postulants-filter-input" type="text" placeholder="Tapez un quartier…" value={filterQuartier} onChange={(e) => setFilterQuartier(e.target.value)} />
                                    </div>
                                    <div className="postulants-filter-group">
                                        <label className="postulants-filter-label">Décision</label>
                                        <select className="postulants-filter-select" value={filterDecision} onChange={(e) => setFilterDecision(e.target.value)}>
                                            <option value="">Toutes</option>
                                            {Object.entries(DECISIONS_MAP).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}{decisionCounts[k] ? ` (${decisionCounts[k]})` : ""}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {(filterSecteur||filterNiveau||filterAnglais||filterGenre||filterNoteIA||filterCommune||filterQuartier||filterDecision) && (
                                        <div className="postulants-filter-group postulants-filter-group--reset">
                                            <button className="postulants-filter-reset" onClick={() => {
                                                setFilterSecteur(""); setFilterNiveau(""); setFilterAnglais(""); setFilterGenre("");
                                                setFilterNoteIA(""); setFilterCommune(""); setFilterQuartier(""); setFilterDecision("");
                                            }}>
                                                <i className="bi bi-x-circle" /> Réinitialiser
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {loading ? <TableSkeleton /> : viewMode === "kanban" ? (
                                <KanbanView
                                    postulants={filtered}
                                    onCardClick={(p) => setDrawerCandidat(p)}
                                    onDecisionChange={handleSaveDecision}
                                    onScoreClick={handleScoreClick}
                                />
                            ) : (
                                <>
                                    <div className="postulants-table-wrap">
                                        <table className="postulants-table--desktop">
                                            <thead>
                                                <tr>
                                                    <th style={{ width:36,textAlign:"center" }}>
                                                        <input type="checkbox" className="postulants-checkbox" checked={allPageSelected} onChange={toggleSelectAll} />
                                                    </th>
                                                    <th className="sortable" onClick={() => handleSort("nom")}>Nom &amp; Prénom <SortIcon col="nom" /></th>
                                                    <th className="sortable" onClick={() => handleSort("email")}>Email <SortIcon col="email" /></th>
                                                    <th>Téléphone</th>
                                                    <th className="sortable" onClick={() => handleSort("Secteur")}>Secteur <SortIcon col="Secteur" /></th>
                                                    <th className="sortable" onClick={() => handleSort("Niveau")}>Niveau <SortIcon col="Niveau" /></th>
                                                    <th className="sortable" onClick={() => handleSort("Niveau_A")}>Anglais <SortIcon col="Niveau_A" /></th>
                                                    <th className="sortable" onClick={() => handleSort("Commune")}>Commune <SortIcon col="Commune" /></th>
                                                    <th>Genre</th>
                                                    <th>CV</th>
                                                    <th>Lettre</th>
                                                    <th>Diplômes</th>
                                                    <th className="sortable" onClick={() => handleSort("note_ia")}>Score IA <SortIcon col="note_ia" /></th>
                                                    <th className="sortable" onClick={() => handleSort("decision")}>Décision <SortIcon col="decision" /></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginated.length === 0 && (
                                                    <tr><td colSpan={14}><div className="postulants-empty">Aucun postulant trouvé.</div></td></tr>
                                                )}
                                                {paginated.map((p) => {
                                                    const nc  = getNoteClass(p.note_ia);
                                                    const dec = getDecisionInfo(p.decision);
                                                    const sel = selectedIds.has(p.id);
                                                    const isBeingAnalyzed = analyzing === p.id;
                                                    return (
                                                        <tr key={p.id} className={sel ? "postulants-tr--selected" : ""}>
                                                            <td style={{ textAlign:"center" }} onClick={e => e.stopPropagation()}>
                                                                <input type="checkbox" className="postulants-checkbox" checked={sel} onChange={() => toggleSelect(p.id)} />
                                                            </td>
                                                            <td className="postulants-td-name postulants-td-clickable" onClick={() => setDrawerCandidat(p)}>
                                                                <div className="td-name-inner">
                                                                    <div className="td-avatar">{getInitials(p.prenoms, p.nom)}</div>
                                                                    <span>{p.prenoms} {p.nom}</span>
                                                                </div>
                                                            </td>
                                                            <td className="postulants-td-muted">{p.email}</td>
                                                            <td className="postulants-td-muted">{p.tel}</td>
                                                            <td className="postulants-td-muted">{p.Secteur}</td>
                                                            <td className="postulants-td-muted">{p.Niveau}</td>
                                                            <td className="postulants-td-muted">{p.Niveau_A}</td>
                                                            <td className="postulants-td-muted">{p.Commune}</td>
                                                            <td className="postulants-td-muted">{p.Genre}</td>
                                                            <td>{p.cv_url     ? <a className="postulants-btn-dl postulants-btn-dl--cv"     href={p.cv_url}     target="_blank" rel="noreferrer"><i className="bi bi-download" /> CV</a>    : "—"}</td>
                                                            <td>{p.lettre_url ? <a className="postulants-btn-dl postulants-btn-dl--lettre" href={p.lettre_url} target="_blank" rel="noreferrer"><i className="bi bi-download" /> Lettre</a> : "—"}</td>
                                                            <td>
                                                                {p.diplomes?.length > 0
                                                                    ? <div className="postulants-diplomes-cell">
                                                                        {p.diplomes.map((url,i) => (
                                                                            <a key={i} className="postulants-btn-dl postulants-btn-dl--diplome" href={url} target="_blank" rel="noreferrer">
                                                                                <i className="bi bi-download" /> Diplôme {i+1}
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                    : "—"
                                                                }
                                                            </td>
                                                            <td>
                                                                <div className="postulants-score-cell">
                                                                    <span
                                                                        className={`postulants-note postulants-note--${nc}`}
                                                                        onClick={() => p.note_ia ? handleScoreClick(p) : handleAnalyze(p.id)}
                                                                        style={{ cursor: "pointer" }}
                                                                        title={p.note_ia ? "Cliquer pour voir le détail de l'analyse" : "Cliquer pour analyser ce candidat"}
                                                                    >
                                                                        {isBeingAnalyzed
                                                                            ? <><i className="bi bi-hourglass-split postulants-note--analyzing" /> …</>
                                                                            : getNoteLabel(p.note_ia)
                                                                        }
                                                                    </span>
                                                                    <button
                                                                        className="postulants-analyze-btn"
                                                                        onClick={() => handleAnalyze(p.id)}
                                                                        disabled={isBeingAnalyzed}
                                                                        title="Analyser avec Mistral AI"
                                                                    >
                                                                        <i className={`bi ${isBeingAnalyzed ? "bi-hourglass-split" : "bi-robot"}`} />
                                                                        {isBeingAnalyzed ? "Analyse…" : p.note_ia ? "Ré-analyser" : "Analyser"}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={`postulants-decision postulants-decision--${dec.cls}`} onClick={() => setDrawerCandidat(p)} style={{ cursor:"pointer" }}>
                                                                    {dec.label}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="postulants-cards-mobile">
                                        {paginated.length === 0 && <div className="postulants-empty">Aucun postulant trouvé.</div>}
                                        {paginated.map(renderMobileCard)}
                                    </div>
                                </>
                            )}

                            {!loading && viewMode === "table" && (
                                <div className="postulants-table-footer">
                                    <span className="postulants-footer-info">
                                        Affichage de <strong>{filtered.length===0?0:(page-1)*PAGE_SIZE+1}</strong> à <strong>{Math.min(page*PAGE_SIZE,filtered.length)}</strong> sur <strong>{filtered.length}</strong> postulant{filtered.length!==1?"s":""}
                                        {search && <span className="postulants-footer-search"> — « {search} »</span>}
                                    </span>
                                    <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <footer className={`app-footer ${sidebarOpen ? "app-footer--shifted" : ""}`}>
                © 2025 Zenselekt · Propulsé par <strong>Empower Talents &amp; Careers</strong>. Tous droits réservés
            </footer>

            <BulkActionBar count={selectedIds.size} emailType={emailType} setEmailType={setEmailType}
                onEmail={handleEnvoiEmail} onDecision={() => setBulkDecisionModalOpen(true)}
                onDeselect={() => setSelectedIds(new Set())} />

            {drawerCandidat && (
                <CandidatDrawer
                    candidat={drawerCandidat}
                    poste={poste}
                    entreprise={entrepriseNom}
                    onClose={() => setDrawerCandidat(null)}
                    onSaveDecision={handleSaveDecision}
                    saving={saving}
                    onAnalyze={handleAnalyze}
                    analyzing={analyzing === drawerCandidat.id}
                />
            )}

            {scoreModalCandidat && (
                <IaScoreModal
                    candidat={scoreModalCandidat}
                    onClose={() => setScoreModalCandidat(null)}
                    onReanalyze={handleAnalyze}
                    analyzing={analyzing === scoreModalCandidat.id}
                />
            )}

            <EmailModal
                open={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                candidats={selectedCandidats}
                emailTypeKey={emailType}
                poste={poste}
                entreprise={entrepriseNom}
                onSend={handleEmailSent}
            />

            <BulkDecisionModal
                open={bulkDecisionModalOpen}
                onClose={() => setBulkDecisionModalOpen(false)}
                count={selectedIds.size}
                onSave={handleBulkDecision}
            />

            {progressAnalyze && <ProgressModal current={progressAnalyze.current} total={progressAnalyze.total} />}
        </div>
    );
}
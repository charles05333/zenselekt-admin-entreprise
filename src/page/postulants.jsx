import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import './css/Postulants.css';
import Header from "./component/Header";
import Navbar from "./component/Navbar";

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

// ── Pagination ────────────────────────────────────────────
const PAGE_SIZE = 100;

// ── Mock data ─────────────────────────────────────────────
const MOCK_POSTULANTS = [
    { id: 1, nom: "KOUASSI", prenoms: "Jean-Marc", email: "jm.kouassi@gmail.com", tel: "+225 07 01 23 45", telwhat: "+225 07 01 23 45", Secteur: "Informatique / Télécoms", Niveau: "licence", Niveau_A: "courant", Commune: "Cocody", Quartier: "Riviera 3", Genre: "Homme", cv_url: "#", lettre_url: "#", diplomes: ["#"], Ref_A: "Prof. Diallo - Université FHB\nTel: +225 07 00 00 01", Ref_P: "M. Traoré - DSI Orange CI", note_ia: 87, commentaire_ia: "Candidat très qualifié. Maîtrise React/Node.js confirmée. Portfolio solide avec 3 projets déployés en production. Expérience de 4 ans pertinente.", decision: "retenu" },
    { id: 2, nom: "BAMBA", prenoms: "Fatoumata", email: "f.bamba@yahoo.fr", tel: "+225 05 45 67 89", telwhat: "+225 05 45 67 89", Secteur: "Finance / Comptabilité", Niveau: "master", Niveau_A: "moyen", Commune: "Plateau", Quartier: "Centre", Genre: "Femme", cv_url: "#", lettre_url: "#", diplomes: ["#", "#"], Ref_A: "Dr. Soro - ESCAE Abidjan", Ref_P: "Mme Koffi - DRH SGBCI", note_ia: 73, commentaire_ia: "Bonne candidate en finance. 5 ans d'audit interne. Niveau d'anglais perfectible mais compensé par une forte expertise technique.", decision: "entretien_ok" },
    { id: 3, nom: "DIARRA", prenoms: "Oumar", email: "o.diarra@hotmail.com", tel: "+225 01 02 03 04", telwhat: "+225 01 02 03 04", Secteur: "Commerce / Négoce / Distribution", Niveau: "bts", Niveau_A: "faible", Commune: "Yopougon", Quartier: "Selmer", Genre: "Homme", cv_url: "#", lettre_url: null, diplomes: [], Ref_A: "M. Coulibaly - Lycée Technique", Ref_P: "", note_ia: 41, commentaire_ia: "Profil junior. Expérience limitée à des stages. Potentiel à confirmer sur le moyen terme.", decision: "refuse" },
    { id: 4, nom: "N'GUESSAN", prenoms: "Aya Christine", email: "a.nguessan@gmail.com", tel: "+225 07 77 88 99", telwhat: "+225 07 77 88 99", Secteur: "Santé", Niveau: "ingenieur", Niveau_A: "bilingue", Commune: "Marcory", Quartier: "Zone 4", Genre: "Femme", cv_url: "#", lettre_url: "#", diplomes: ["#"], Ref_A: "Prof. Yao - INP-HB Yamoussoukro", Ref_P: "Dr. Adou - CHU de Cocody", note_ia: null, commentaire_ia: "", decision: "en_attente" },
    { id: 5, nom: "COULIBALY", prenoms: "Ibrahim", email: "i.coulibaly@outlook.com", tel: "+225 05 55 44 33", telwhat: "+225 05 55 44 33", Secteur: "BTP / Matériaux de construction", Niveau: "master", Niveau_A: "courant", Commune: "Abobo", Quartier: "Avocatier", Genre: "Homme", cv_url: "#", lettre_url: "#", diplomes: ["#"], Ref_A: "", Ref_P: "M. Ba - DG Colas CI", note_ia: 62, commentaire_ia: "8 ans d'expérience en BTP. Normes ivoiriennes et internationales maîtrisées. Leadership confirmé sur chantiers de grande envergure.", decision: "en_reserve" },
];

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

// FIX 4 : ajout de la propriété "icon" dans chaque colonne Kanban
const KANBAN_COLUMNS = [
    { key: "en_attente",   label: "En attente",    icon: "bi-hourglass-split" },
    { key: "retenu",       label: "Retenus",        icon: "bi-bookmark-check" },
    { key: "entretien_ok", label: "Entretiens",     icon: "bi-chat-square-text" },
    { key: "en_reserve",   label: "En réserve",     icon: "bi-archive" },
    { key: "recrute",      label: "Recrutés",       icon: "bi-trophy" },
    { key: "refuse",       label: "Non retenus",    icon: "bi-x-circle" },
];

// ── Templates email ───────────────────────────────────────
const EMAIL_TEMPLATES = {
    en_attente:   { sujet: "Votre candidature est en cours d'évaluation",               corps: "Madame, Monsieur,\n\nNous avons bien reçu votre candidature et nous vous informons qu'elle est actuellement en cours d'évaluation par notre équipe.\n\nNous reviendrons vers vous dans les meilleurs délais.\n\nCordialement,\nL'équipe de recrutement" },
    refuse_cv:    { sujet: "Réponse à votre candidature — Analyse de votre CV",          corps: "Madame, Monsieur,\n\nNous vous remercions de l'intérêt que vous avez porté à notre offre d'emploi et du temps consacré à nous soumettre votre candidature.\n\nAprès une analyse attentive de votre CV, nous avons le regret de vous informer que votre profil ne correspond pas aux critères requis pour ce poste.\n\nNous conservons néanmoins votre dossier et ne manquerons pas de vous recontacter si une opportunité correspondant à votre profil se présente.\n\nCordialement,\nL'équipe de recrutement" },
    retenu:       { sujet: "Votre candidature est retenue – Invitation à un entretien",  corps: "Madame, Monsieur,\n\nNous avons le plaisir de vous informer que votre candidature a été retenue et que nous souhaitons vous rencontrer dans le cadre d'un entretien de recrutement.\n\nNous vous contacterons prochainement pour fixer la date et l'heure.\n\nCordialement,\nL'équipe de recrutement" },
    entretien_ok: { sujet: "Entretien validé – Prochaine étape",                         corps: "Madame, Monsieur,\n\nNous vous informons que votre entretien a été validé avec succès. Votre dossier est en cours d'examen pour la décision finale.\n\nNous vous remercions pour votre disponibilité et vous tiendrons informé(e) très prochainement.\n\nCordialement,\nL'équipe de recrutement" },
    refuse:       { sujet: "Réponse à votre candidature",                                corps: "Madame, Monsieur,\n\nNous vous remercions de l'intérêt que vous avez porté à notre offre d'emploi.\n\nAprès examen attentif de votre dossier, nous avons le regret de vous informer que votre profil ne correspond pas aux critères requis pour ce poste.\n\nNous vous souhaitons bonne chance dans vos recherches.\n\nCordialement,\nL'équipe de recrutement" },
    en_reserve:   { sujet: "Votre candidature est mise en réserve",                      corps: "Madame, Monsieur,\n\nNous vous informons que votre candidature a été examinée avec attention. Bien que votre profil ne corresponde pas exactement au poste actuellement ouvert, nous souhaitons conserver votre dossier dans notre vivier de talents.\n\nNous ne manquerons pas de vous recontacter si une opportunité correspondant à votre profil se présente.\n\nCordialement,\nL'équipe de recrutement" },
    recrute:      { sujet: "Félicitations – Vous êtes recruté(e) !",                     corps: "Madame, Monsieur,\n\nNous avons le grand plaisir de vous informer que votre candidature a été retenue et que vous avez été sélectionné(e) pour rejoindre notre équipe.\n\nNous vous contacterons très prochainement pour les modalités de votre intégration.\n\nBienvenue parmi nous !\n\nCordialement,\nL'équipe de recrutement" },
};

const SECTEURS = [
    "Agriculture / Élevage / Pêche", "Agroalimentaire", "Architecture / Urbanisme / Design",
    "Art / Culture / Spectacle", "Artisanat / Métiers manuels", "Audit / Expertise comptable",
    "Bailleur / Organisme international", "Banque / Assurance / Microfinance",
    "Bois / Papier / Carton / Imprimerie", "BTP / Matériaux de construction",
    "Chimie / Parachimie", "Commerce / Négoce / Distribution",
    "Communication / Marketing / Publicité", "Droit / Juridique / Notariat",
    "Économie / Statistiques / Recherche", "Édition / Multimédia / Presse",
    "Education / Formation / Enseignement", "Électronique / Électricité / Énergie",
    "Environnement / Développement durable", "Études et conseils / Consulting",
    "Finance / Comptabilité / Gestion", "Hôtellerie / Restauration / Tourisme",
    "Humanitaire / ONG / Associatif", "Immobilier / Foncier",
    "Industrie pharmaceutique", "Informatique / Télécoms / Numérique",
    "Machines et équipements / Automobile", "Management / Direction générale",
    "Mines / Pétrole / Énergie", "Métallurgie / Travail du métal",
    "Plastique / Caoutchouc", "Ressources humaines / Recrutement",
    "Santé / Médical / Paramédical", "Sécurité / Défense / Gardiennage",
    "Services aux entreprises / Facilities", "Sport / Bien-être / Loisirs",
    "Textile / Habillement / Chaussure", "Transports / Logistique / Supply Chain",
    "Autre / Non classifié",
];
const COMMUNES = [
    "Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", "Marcory", "Plateau",
    "Port-Bouët", "Treichville", "Yopougon", "Aboisso", "Adzopé", "Agboville",
    "Bouaké", "Bondoukou", "Dabou", "Daloa", "Daoukro", "Dimbokro", "Divo",
    "Ferkessédougou", "Gagnoa", "Grand-Bassam", "Guiglo", "Issia", "Jacqueville",
    "Katiola", "Korhogo", "Man", "Minignan", "Odienné", "San-Pédro", "Sassandra",
    "Séguéla", "Soubré", "Tabou", "Toumodi", "Yamoussoukro",
    "Autres / Hors Côte d'Ivoire",
];

const NIVEAUX = [
    { value: "cepe",          label: "CEPE (Certificat d'études primaires)" },
    { value: "bepc",          label: "BEPC / Brevet" },
    { value: "cap",           label: "CAP" },
    { value: "bac",           label: "Baccalauréat" },
    { value: "bt",            label: "BT (Brevet de technicien)" },
    { value: "bp",            label: "BP (Brevet professionnel)" },
    { value: "bts",           label: "BTS" },
    { value: "dut",           label: "DUT" },
    { value: "dts",           label: "DTS" },
    { value: "deug",          label: "DEUG / DEUST (Bac +2)" },
    { value: "licence",       label: "Licence / Bachelor (Bac +3)" },
    { value: "licence_pro",   label: "Licence professionnelle (Bac +3)" },
    { value: "master",        label: "Master 1 (Bac +4)" },
    { value: "master2",       label: "Master 2 / DEA / DESS (Bac +5)" },
    { value: "ingenieur",     label: "Diplôme d'ingénieur (Bac +5)" },
    { value: "grandes_ecoles",label: "Grande École (Bac +5)" },
    { value: "doctorat",      label: "Doctorat / PhD (Bac +8)" },
    { value: "autre",         label: "Autre / Non précisé" },
];

// ── Helpers ───────────────────────────────────────────────
const getNoteClass  = (n) => !n ? "pending" : n >= 80 ? "excellent" : n >= 60 ? "good" : n >= 40 ? "average" : "low";
const getNoteLabel  = (n) => !n ? "Non évalué" : `${Math.round(n)}%`;
const getDecisionInfo = (d) => DECISIONS_MAP[d] || DECISIONS_MAP["en_attente"];
const formatDate    = (ts) => new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const getInitials   = (prenoms, nom) => `${prenoms?.[0] || ""}${nom?.[0] || ""}`.toUpperCase();

// ── Comptage par statut ───────────────────────────────────
function countByDecision(list) {
    const counts = {};
    list.forEach((p) => { counts[p.decision] = (counts[p.decision] || 0) + 1; });
    return counts;
}

// ══════════════════════════════════════════════════════════
// COMPOSANT : DRAWER PROFIL CANDIDAT
// ══════════════════════════════════════════════════════════
function CandidatDrawer({ candidat, onClose, onSaveDecision, onAnalyze }) {
    const [activeTab, setActiveTab] = useState("profil");
    const [decisionVal, setDecisionVal] = useState(candidat.decision);

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
                        { key: "profil",     label: "Profil",      icon: "bi-person" },
                        { key: "docs",       label: "Documents",   icon: "bi-folder" },
                        { key: "decision",   label: "Décision",    icon: "bi-clipboard-check" },
                        { key: "historique", label: "Historique",  icon: "bi-clock-history" },
                    ].map((t) => (
                        <button
                            key={t.key}
                            className={`drawer-tab${activeTab === t.key ? " drawer-tab--active" : ""}`}
                            onClick={() => setActiveTab(t.key)}
                        >
                            <i className={`bi ${t.icon}`} /> {t.label}
                        </button>
                    ))}
                </div>

                <div className="drawer-body">

                    {/* ── Tab Profil ─────────────────────────────── */}
                    {activeTab === "profil" && (
                        <div className="drawer-section-list">
                            {/* FIX 2 : DrawerRow — suppression de la prop "icon" inutilisée */}
                            <DrawerRow label="Secteur"           value={candidat.Secteur}  />
                            <DrawerRow label="Niveau académique" value={candidat.Niveau}   />
                            <DrawerRow label="Niveau anglais"    value={candidat.Niveau_A} />
                            <DrawerRow label="Commune"           value={candidat.Commune}  />
                            <DrawerRow label="Quartier"          value={candidat.Quartier} />
                            <DrawerRow label="Genre"             value={candidat.Genre}    />
                            <DrawerRow label="WhatsApp"          value={candidat.telwhat}  />

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

                            {candidat.commentaire_ia && (
                                <div className="drawer-ia-block">
                                    <div className="drawer-ia-header">
                                        <span>Analyse Empower AI</span>
                                        <span className={`postulants-note postulants-note--${nc}`}>{getNoteLabel(candidat.note_ia)}</span>
                                    </div>
                                    <p className="drawer-ia-comment">{candidat.commentaire_ia}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Tab Documents ──────────────────────────── */}
                    {activeTab === "docs" && (
                        <div className="drawer-docs-list">
                            {/* FIX 3 : DrawerDoc — ajout des valeurs de "icon" et "color" */}
                            <DrawerDoc label="Curriculum Vitae"       url={candidat.cv_url}     icon="bi-file-earmark-person" color="green" />
                            <DrawerDoc label="Lettre de motivation"   url={candidat.lettre_url} icon="bi-file-earmark-text"   color="blue"  />
                            {candidat.diplomes?.map((url, i) => (
                                <DrawerDoc key={i} label={`Diplôme ${i + 1}`} url={url} icon="bi-mortarboard" color="amber" />
                            ))}
                            {!candidat.cv_url && !candidat.lettre_url && (!candidat.diplomes || candidat.diplomes.length === 0) && (
                                <div className="drawer-empty"><i className="bi bi-folder-x" /> Aucun document fourni</div>
                            )}
                        </div>
                    )}

                    {/* ── Tab Décision ───────────────────────────── */}
                    {activeTab === "decision" && (
                        <div className="drawer-decision-tab">
                            <div className="drawer-field-group">
                                <label className="drawer-field-label">Décision de recrutement</label>
                                <select
                                    className="drawer-select"
                                    value={decisionVal}
                                    onChange={(e) => setDecisionVal(e.target.value)}
                                >
                                    <option value="">-- Sélectionner --</option>
                                    {Object.entries(DECISIONS_MAP).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </select>
                            </div>

                            {decisionVal && EMAIL_TEMPLATES[decisionVal] && (
                                <div className="drawer-email-preview">
                                    <div className="drawer-email-preview-label">Email qui sera envoyé au candidat</div>
                                    <div className="drawer-email-subject">{EMAIL_TEMPLATES[decisionVal].sujet}</div>
                                    <pre className="drawer-email-body">{EMAIL_TEMPLATES[decisionVal].corps}</pre>
                                </div>
                            )}

                            <button
                                className="drawer-btn-save"
                                onClick={handleDecisionSave}
                                disabled={!decisionVal || decisionVal === candidat.decision}
                            >
                                <i className="bi bi-envelope-check" /> Enregistrer &amp; Notifier le candidat
                            </button>
                        </div>
                    )}

                    {/* ── Tab Historique ─────────────────────────── */}
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
                                                        <span className={`postulants-decision postulants-decision--${oldDec.cls}`} style={{ fontSize: 11, padding: "2px 8px" }}>
                                                            {oldDec.label}
                                                        </span>
                                                        <i className="bi bi-arrow-right" style={{ fontSize: 11, color: "#9ca3af" }} />
                                                        <span className={`postulants-decision postulants-decision--${newDec.cls}`} style={{ fontSize: 11, padding: "2px 8px" }}>
                                                            {newDec.label}
                                                        </span>
                                                    </div>
                                                    <div className="drawer-timeline-meta">
                                                        <i className="bi bi-person-circle" /> {entry.user} · <i className="bi bi-clock" /> {formatDate(entry.ts)}
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

// FIX 2 : DrawerRow — suppression de la prop "icon" (jamais transmise, causait un className invalide)
function DrawerRow({ label, value }) {
    if (!value) return null;
    return (
        <div className="drawer-row">
            <span className="drawer-row-label">{label}</span>
            <span className="drawer-row-value">{value}</span>
        </div>
    );
}

// FIX 3 : DrawerDoc — "icon" et "color" sont maintenant des props requises avec valeur par défaut
function DrawerDoc({ label, url, icon = "bi-file-earmark", color = "gray" }) {
    return (
        <div className={`drawer-doc drawer-doc--${color}`}>
            <i className={`bi ${icon} drawer-doc-icon`} />
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

// ══════════════════════════════════════════════════════════
// COMPOSANT : MODAL NATIVE
// ══════════════════════════════════════════════════════════
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
            <div
                className={`zs-modal${size === "lg" ? " zs-modal--lg" : ""}`}
                onClick={(e) => e.stopPropagation()}
            >
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

// ══════════════════════════════════════════════════════════
// COMPOSANT : MODAL EMAIL GROUPÉ
// ══════════════════════════════════════════════════════════
function EmailModal({ open, onClose, candidats, emailTypeKey, onSend }) {
    const tpl = EMAIL_TEMPLATES[emailTypeKey] || EMAIL_TEMPLATES["en_attente"];
    const [corps, setCorps] = useState(tpl.corps);
    const [step, setStep]   = useState(1);

    useEffect(() => {
        if (open) { setCorps((EMAIL_TEMPLATES[emailTypeKey] || EMAIL_TEMPLATES["en_attente"]).corps); setStep(1); }
    }, [open, emailTypeKey]);

    if (!open) return null;
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Email — ${candidats.length} candidat(s)`}
            size="lg"
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
                            <i className="bi bi-send-fill" /> Confirmer l'envoi à {candidats.length} candidat(s)
                        </button>
                    </>
                )
            }
        >
            {step === 1 ? (
                <>
                    <div className="email-modal-field">
                        <div className="email-modal-field-label">Destinataires ({candidats.length})</div>
                        <div className="email-modal-recipients">
                            {candidats.map((c) => (
                                <span key={c.id} className="email-modal-chip">{c.prenoms} {c.nom}</span>
                            ))}
                        </div>
                    </div>
                    <div className="email-modal-field">
                        <div className="email-modal-field-label">Objet</div>
                        <div className="email-modal-subject">{tpl.sujet}</div>
                    </div>
                    <div className="email-modal-field">
                        <div className="email-modal-field-label">Corps du message — modifiable</div>
                        <textarea
                            className="email-modal-textarea"
                            value={corps}
                            onChange={(e) => setCorps(e.target.value)}
                        />
                    </div>
                </>
            ) : (
                <div className="email-modal-confirm">
                    <p>Vous allez envoyer un email à <strong>{candidats.length} candidat(s)</strong>.</p>
                    <p>Objet : <em>{tpl.sujet}</em></p>
                    <div className="email-modal-recipients" style={{ marginTop: 12 }}>
                        {candidats.map((c) => (
                            <span key={c.id} className="email-modal-chip">{c.prenoms} {c.nom}</span>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
}

// ══════════════════════════════════════════════════════════
// COMPOSANT : ANALYTICS MINI-DASHBOARD
// ══════════════════════════════════════════════════════════
function AnalyticsBanner({ postulants }) {
    const counts  = countByDecision(postulants);
    const total   = postulants.length;
    const avgIA   = postulants.filter(p => p.note_ia).reduce((s, p) => s + p.note_ia, 0) /
        (postulants.filter(p => p.note_ia).length || 1);
    const hommes  = postulants.filter(p => p.Genre === "Homme").length;
    const femmes  = postulants.filter(p => p.Genre === "Femme").length;

    const stats = [
        { label: "Total candidats",   value: total,                                                   color: "blue"   },
        { label: "Score IA moyen",    value: `${Math.round(avgIA || 0)}%`,                            color: "purple" },
        { label: "Retenus",           value: counts["retenu"] || 0,                                   color: "green"  },
        { label: "Recrutés",          value: counts["recrute"] || 0,                                  color: "gold"   },
        { label: "Non retenus",       value: (counts["refuse"] || 0) + (counts["refuse_cv"] || 0),    color: "red"    },
        { label: "Hommes / Femmes",   value: `${hommes} / ${femmes}`,                                 color: "teal"   },
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

// ══════════════════════════════════════════════════════════
// COMPOSANT : KANBAN VIEW
// ══════════════════════════════════════════════════════════
function KanbanView({ postulants, onCardClick, onDecisionChange }) {
    const [dragId, setDragId] = useState(null);

    function handleDragStart(e, id) {
        setDragId(id);
        e.dataTransfer.effectAllowed = "move";
    }

    function handleDrop(e, colKey) {
        e.preventDefault();
        if (dragId !== null) { onDecisionChange(dragId, colKey); setDragId(null); }
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }

    return (
        <div className="kanban-board">
            {KANBAN_COLUMNS.map((col) => {
                const cards = postulants.filter((p) => p.decision === col.key);
                const dec   = getDecisionInfo(col.key);
                return (
                    <div
                        key={col.key}
                        className="kanban-column"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.key)}
                    >
                        <div className="kanban-column-header">
                            {/* FIX 4 : col.icon est maintenant toujours défini */}
                            <span className={`kanban-column-icon kanban-icon--${dec.cls}`}>
                                <i className={`bi ${col.icon}`} />
                            </span>
                            <span className="kanban-column-label">{col.label}</span>
                            <span className="kanban-column-count">{cards.length}</span>
                        </div>
                        <div className="kanban-cards">
                            {cards.length === 0 && (
                                <div className="kanban-empty">
                                    <i className="bi bi-inbox" /> Glissez un candidat ici
                                </div>
                            )}
                            {cards.map((p) => {
                                const nc = getNoteClass(p.note_ia);
                                return (
                                    <div
                                        key={p.id}
                                        className={`kanban-card${dragId === p.id ? " kanban-card--dragging" : ""}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, p.id)}
                                        onClick={() => onCardClick(p)}
                                    >
                                        <div className="kanban-card-header">
                                            <div className="kanban-card-avatar">{getInitials(p.prenoms, p.nom)}</div>
                                            <div className="kanban-card-info">
                                                <div className="kanban-card-name">{p.prenoms} {p.nom}</div>
                                                <div className="kanban-card-sector">{p.Secteur}</div>
                                            </div>
                                        </div>
                                        <div className="kanban-card-footer">
                                            <span className={`postulants-note postulants-note--${nc}`} style={{ fontSize: 11, padding: "2px 8px" }}>
                                                {getNoteLabel(p.note_ia)}
                                            </span>
                                            <span className="kanban-card-commune">{p.Commune}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// COMPOSANT : BARRE D'ACTIONS GROUPÉES
// ══════════════════════════════════════════════════════════
function BulkActionBar({ count, onEmail, onDecision, onDeselect, emailType, setEmailType }) {
    if (count === 0) return null;
    return (
        <div className="bulk-bar">
            <div className="bulk-bar-left">
                <button className="bulk-bar-deselect" onClick={onDeselect} title="Désélectionner tout">
                    <i className="bi bi-x-circle" />
                </button>
                <span className="bulk-bar-count"><strong>{count}</strong> candidat{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}</span>
            </div>
            <div className="bulk-bar-actions">
                <select
                    className="bulk-bar-select"
                    value={emailType}
                    onChange={(e) => setEmailType(e.target.value)}
                    title="Choisir le template email"
                >
                    <option value="">Template email…</option>
                    {Object.entries(DECISIONS_MAP).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
                <button className="bulk-bar-btn bulk-bar-btn--email"     onClick={onEmail}    disabled={!emailType}>Envoyer email</button>
                <button className="bulk-bar-btn bulk-bar-btn--decision"  onClick={onDecision}>Changer décision</button>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// COMPOSANT : MODAL CHANGEMENT DÉCISION EN MASSE
// ══════════════════════════════════════════════════════════
function BulkDecisionModal({ open, onClose, count, onSave }) {
    const [val, setVal] = useState("");
    useEffect(() => { if (open) setVal(""); }, [open]);
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Changer la décision — ${count} candidat(s)`}
            actions={
                <>
                    <button className="zs-btn zs-btn--ghost" onClick={onClose}>Annuler</button>
                    <button className="zs-btn zs-btn--primary" onClick={() => { if (val) { onSave(val); onClose(); } }} disabled={!val}>
                        <i className="bi bi-check2" /> Appliquer
                    </button>
                </>
            }
        >
            <div className="email-modal-field">
                <div className="email-modal-field-label">Nouvelle décision pour {count} candidat(s)</div>
                <select className="drawer-select" value={val} onChange={(e) => setVal(e.target.value)}>
                    <option value="">-- Sélectionner --</option>
                    {Object.entries(DECISIONS_MAP).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                    ))}
                </select>
            </div>
            {val && (
                <div className="zs-modal-info-block">
                    <i className="bi bi-info-circle" /> Les {count} candidat(s) sélectionnés passeront au statut <strong>{getDecisionInfo(val).label}</strong>.
                </div>
            )}
        </Modal>
    );
}

// ── Progression Analyse ───────────────────────────────────
function ProgressModal({ current, total }) {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    return (
        <div className="postulants-progress-overlay">
            <div className="postulants-progress-box">
                <i className="bi bi-hourglass-split" />
                <h5>Analyse en cours avec Empower AI</h5>
                <div className="postulants-progress-track">
                    <div className="postulants-progress-bar" style={{ width: `${pct}%` }}>{pct > 10 && `${pct}%`}</div>
                </div>
                <p className="postulants-progress-detail">{current} candidat(s) analysé(s) sur {total}</p>
                <p className="postulants-progress-hint"><i className="bi bi-info-circle" /> Cette opération peut prendre plusieurs minutes</p>
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
    pages.push(<button key={1} className={`postulants-page-num${page === 1 ? " postulants-page-num--active" : ""}`} onClick={() => onChange(1)}>1</button>);
    if (range[0] > 2) pages.push(<span key="el1" className="postulants-page-ellipsis">…</span>);
    range.forEach((n) => pages.push(<button key={n} className={`postulants-page-num${page === n ? " postulants-page-num--active" : ""}`} onClick={() => onChange(n)}>{n}</button>));
    if (range[range.length - 1] < totalPages - 1) pages.push(<span key="el2" className="postulants-page-ellipsis">…</span>);
    if (totalPages > 1) pages.push(<button key={totalPages} className={`postulants-page-num${page === totalPages ? " postulants-page-num--active" : ""}`} onClick={() => onChange(totalPages)}>{totalPages}</button>);
    return (
        <div className="postulants-pagination">
            <button className="postulants-page-btn" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}><i className="bi bi-chevron-left" /><span className="postulants-page-label">Précédent</span></button>
            {pages}
            <button className="postulants-page-btn" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}><span className="postulants-page-label">Suivant</span><i className="bi bi-chevron-right" /></button>
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════
export default function Postulants() {
    useBootstrapIcons();

    // FIX 1 : utilisation de useSearchParams() au lieu de window.location.search
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get("event_id") || "";
    const poste   = searchParams.get("poste")    || "";

    const [width, setWidth] = useState(window.innerWidth);
    useEffect(() => {
        const h = () => setWidth(window.innerWidth);
        window.addEventListener("resize", h);
        return () => window.removeEventListener("resize", h);
    }, []);
    const isMobile = width <= 600;
    const [sidebarOpen, setSidebarOpen] = useState(width > 768);
    useEffect(() => { if (width <= 768) setSidebarOpen(false); }, [width]);

    const [postulants, setPostulants] = useState(
        MOCK_POSTULANTS.map(p => ({ ...p, audit: [] }))
    );

    const [viewMode, setViewMode] = useState("table");

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

    const [sortKey, setSortKey] = useState("");
    const [sortDir, setSortDir] = useState("asc");

    function handleSort(key) {
        if (sortKey === key) { setSortDir(d => d === "asc" ? "desc" : "asc"); }
        else { setSortKey(key); setSortDir("asc"); }
    }

    function SortIcon({ col }) {
        if (sortKey !== col) return <i className="bi bi-arrow-down-up sort-icon sort-icon--inactive" />;
        return <i className={`bi bi-arrow-${sortDir === "asc" ? "up" : "down"} sort-icon sort-icon--active`} />;
    }

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [emailType,   setEmailType]   = useState("");
    const [drawerCandidat, setDrawerCandidat] = useState(null);

    const [emailModalOpen,       setEmailModalOpen]       = useState(false);
    const [bulkDecisionModalOpen,setBulkDecisionModalOpen]= useState(false);
    const [successMsg,           setSuccessMsg]           = useState("");

    const [progressAnalyze, setProgressAnalyze] = useState(null);
    const tableRef = useRef(null);

    function showSuccess(msg) {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(""), 3000);
    }

    useEffect(() => {
        setPage(1);
        setSelectedIds(new Set());
    }, [search, filterSecteur, filterNiveau, filterAnglais, filterGenre, filterNoteIA, filterCommune, filterQuartier, filterDecision]);

    const filtered = postulants.filter((p) => {
        const q    = search.toLowerCase();
        const ms   = !q   || `${p.nom} ${p.prenoms} ${p.email} ${p.Secteur} ${p.Commune}`.toLowerCase().includes(q);
        const mSec = !filterSecteur  || p.Secteur === filterSecteur;
        const mNiv = !filterNiveau   || p.Niveau  === filterNiveau;
        const mAng = !filterAnglais  || p.Niveau_A=== filterAnglais;
        const mGen = !filterGenre    || p.Genre.toLowerCase() === filterGenre;
        const mCom = !filterCommune  || p.Commune === filterCommune;
        const mQua = !filterQuartier || p.Quartier.toLowerCase().includes(filterQuartier.toLowerCase());
        const mDec = !filterDecision || p.decision=== filterDecision;
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
        tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const handleSaveDecision = useCallback((id, decision) => {
        setPostulants((prev) => prev.map((p) => {
            if (p.id !== id) return p;
            const auditEntry = { user: "Recruteur", oldDecision: p.decision, newDecision: decision, ts: Date.now() };
            return { ...p, decision, audit: [...(p.audit || []), auditEntry] };
        }));
        setDrawerCandidat((prev) => {
            if (!prev || prev.id !== id) return prev;
            const auditEntry = { user: "Recruteur", oldDecision: prev.decision, newDecision: decision, ts: Date.now() };
            return { ...prev, decision, audit: [...(prev.audit || []), auditEntry] };
        });
        showSuccess("Décision enregistrée — candidat notifié.");
    }, []);

    function handleBulkDecision(decision) {
        selectedIds.forEach((id) => handleSaveDecision(id, decision));
        setSelectedIds(new Set());
        showSuccess(`Décision appliquée à ${selectedIds.size} candidat(s).`);
    }

    function handleAnalyze(id) {
        const result = { note_ia: Math.round(50 + Math.random() * 50), commentaire_ia: "Analyse IA simulée — remplacer par l'appel API Empower AI." };
        setPostulants((prev) => prev.map((p) => p.id !== id ? p : { ...p, ...result }));
        setDrawerCandidat((prev) => prev?.id === id ? { ...prev, ...result } : prev);
        showSuccess("Analyse IA terminée.");
    }

    async function handleAnalyzeAll() {
        const total = filtered.length;
        if (!total) return;
        setProgressAnalyze({ current: 0, total });
        for (let i = 0; i < total; i++) {
            await new Promise((r) => setTimeout(r, 400));
            const id = filtered[i].id;
            setPostulants((prev) => prev.map((p) => p.id !== id ? p : {
                ...p, note_ia: Math.round(50 + Math.random() * 50), commentaire_ia: "Analyse IA simulée.",
            }));
            setProgressAnalyze({ current: i + 1, total });
        }
        setProgressAnalyze(null);
        showSuccess(`${total} candidat(s) analysés.`);
    }

    function handleExportExcel() {
        const doExport = () => {
            const XLSX = window.XLSX;
            const wb   = XLSX.utils.book_new();
            const headers = ["Nom","Prénoms","Email","Téléphone","WhatsApp","Secteur","Niveau","Anglais","Commune","Quartier","Genre","CV","Lettre de motivation","Diplôme 1","Diplôme 2","Diplôme 3","Score IA (%)","Commentaire IA","Décision"];
            const rows = filtered.map((p) => [p.nom,p.prenoms,p.email,p.tel,p.telwhat,p.Secteur,p.Niveau,p.Niveau_A,p.Commune,p.Quartier,p.Genre,p.cv_url||"",p.lettre_url||"",p.diplomes?.[0]||"",p.diplomes?.[1]||"",p.diplomes?.[2]||"",p.note_ia??""  ,p.commentaire_ia??"",getDecisionInfo(p.decision).label]);
            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
            ws["!cols"] = [{wch:15},{wch:20},{wch:28},{wch:18},{wch:18},{wch:28},{wch:12},{wch:10},{wch:14},{wch:16},{wch:10},{wch:30},{wch:30},{wch:30},{wch:30},{wch:30},{wch:12},{wch:45},{wch:28}];
            XLSX.utils.book_append_sheet(wb, ws, "Postulants");
            const filename = poste ? `postulants_${poste.replace(/[^a-z0-9]/gi,"_")}.xlsx` : eventId ? `postulants_offre_${eventId}.xlsx` : "postulants.xlsx";
            XLSX.writeFile(wb, filename, { cellStyles: true });
        };
        const XLSX_CDN = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        if (window.XLSX) { doExport(); }
        else { const s = document.createElement("script"); s.src = XLSX_CDN; s.onload = doExport; document.head.appendChild(s); }
    }

    const allPageSelected = paginated.length > 0 && paginated.every((p) => selectedIds.has(p.id));
    function toggleSelect(id) {
        setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
    }
    function toggleSelectAll() {
        if (allPageSelected) { setSelectedIds(new Set()); }
        else { setSelectedIds(new Set(paginated.map((p) => p.id))); }
    }
    const selectedCandidats = postulants.filter((p) => selectedIds.has(p.id));
    const decisionCounts    = countByDecision(postulants);

    function handleEnvoiEmail() {
        if (!selectedIds.size || !emailType) return;
        setEmailModalOpen(true);
    }
    function handleEmailSent() {
        setSelectedIds(new Set());
        showSuccess(`Email envoyé à ${selectedCandidats.length} candidat(s).`);
    }

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
                    <span className={`postulants-note postulants-note--${nc}`}>{getNoteLabel(p.note_ia)}</span>
                </div>
                <div className="postulants-mobile-card__grid">
                    <div className="postulants-mobile-card__item"><span className="postulants-mobile-card__label">Secteur</span><span className="postulants-mobile-card__value">{p.Secteur}</span></div>
                    <div className="postulants-mobile-card__item"><span className="postulants-mobile-card__label">Niveau</span><span className="postulants-mobile-card__value">{p.Niveau}</span></div>
                    <div className="postulants-mobile-card__item"><span className="postulants-mobile-card__label">Commune</span><span className="postulants-mobile-card__value">{p.Commune}</span></div>
                    <div className="postulants-mobile-card__item"><span className="postulants-mobile-card__label">Genre</span><span className="postulants-mobile-card__value">{p.Genre}</span></div>
                </div>
                <div className="postulants-mobile-card__footer">
                    <span className={`postulants-decision postulants-decision--${dec.cls}`}>
                        {dec.label}
                    </span>
                    <button className="drawer-analyze-btn" onClick={e => { e.stopPropagation(); handleAnalyze(p.id); }}>
                        <i className="bi bi-robot" /> {p.note_ia ? "Ré-analyser" : "Analyser"}
                    </button>
                </div>
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

                        {successMsg && (
                            <div className="zs-toast zs-toast--success">
                                <i className="bi bi-check-circle-fill" /> {successMsg}
                            </div>
                        )}

                        <div className="postulants-breadcrumb">
                            <h1>
                                {poste
                                    ? <span style={{ color:"var(--blue-zt)",fontWeight:700 }}>{poste}</span>
                                    : <>Liste des Postulants</>
                                }
                                <span className="groq-badge">⚡ Empower AI</span>
                            </h1>
                            <p>
                                <a href="/acceuil">Bienvenue solibra</a>{" / "}
                                <a href="/offres">Gestion des Offres</a>
                            </p>
                        </div>

                        <AnalyticsBanner postulants={postulants} />

                        <div className="postulants-card" ref={tableRef}>

                            <div className="postulants-toolbar">
                                <div className="postulants-search">
                                    <i className="bi bi-search" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Rechercher nom, email, secteur, commune…"
                                    />
                                    {search && (
                                        <button className="postulants-search-clear" onClick={() => setSearch("")} title="Effacer">
                                            <i className="bi bi-x" />
                                        </button>
                                    )}
                                </div>

                                <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
                                    <div className="view-toggle">
                                        <button className={`view-toggle-btn${viewMode==="table"  ? " view-toggle-btn--active":""}`} onClick={() => setViewMode("table")}  title="Vue tableau"><i className="bi bi-table"  /></button>
                                        <button className={`view-toggle-btn${viewMode==="kanban" ? " view-toggle-btn--active":""}`} onClick={() => setViewMode("kanban")} title="Vue Kanban"><i className="bi bi-kanban" /></button>
                                    </div>
                                    <button
                                        className={`postulants-btn-filters${filtersOpen?" postulants-btn-filters--active":""}`}
                                        onClick={() => setFiltersOpen(v => !v)}
                                    >
                                        <i className="bi bi-funnel" />
                                        <span>Filtres</span>
                                        {(filterSecteur||filterNiveau||filterAnglais||filterGenre||filterNoteIA||filterCommune||filterQuartier||filterDecision) && (
                                            <span className="filter-active-dot" />
                                        )}
                                    </button>
                                    <button className="postulants-btn-export" onClick={handleExportExcel} title={`Exporter ${filtered.length} candidat(s)`}>
                                        <i className="bi bi-file-earmark-excel-fill" />
                                        <span>Exporter ({filtered.length})</span>
                                    </button>
                                    <button className="postulants-btn-analyze" onClick={handleAnalyzeAll}>
                                        <i className="bi bi-robot" />
                                        <span>Analyser IA</span>
                                    </button>
                                </div>
                            </div>

                            {filtersOpen && (
                                <div className="postulants-filters">
                                    <div className="postulants-filter-group">
                                        <label className="postulants-filter-label">Secteur d'activité</label>
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
                                            <option value="">Tous les niveaux</option>
                                            {["faible","moyen","courant","bilingue"].map((v) => (
                                                <option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="postulants-filter-group">
                                        <label className="postulants-filter-label">Genre</label>
                                        <select className="postulants-filter-select" value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}>
                                            <option value="">Tous les genres</option>
                                            <option value="homme">Homme</option>
                                            <option value="femme">Femme</option>
                                        </select>
                                    </div>
                                    <div className="postulants-filter-group">
                                        <label className="postulants-filter-label">Score IA</label>
                                        <select className="postulants-filter-select" value={filterNoteIA} onChange={(e) => setFilterNoteIA(e.target.value)}>
                                            <option value="">Tous les candidats</option>
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
                                            <option value="">Toutes les communes</option>
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
                                            <option value="">Toutes les décisions</option>
                                            {Object.entries(DECISIONS_MAP).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}{decisionCounts[k] ? ` (${decisionCounts[k]})` : ""}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {(filterSecteur||filterNiveau||filterAnglais||filterGenre||filterNoteIA||filterCommune||filterQuartier||filterDecision) && (
                                        <div className="postulants-filter-group postulants-filter-group--reset">
                                            <button className="postulants-filter-reset" onClick={() => {
                                                setFilterSecteur(""); setFilterNiveau(""); setFilterAnglais("");
                                                setFilterGenre("");   setFilterNoteIA(""); setFilterCommune("");
                                                setFilterQuartier(""); setFilterDecision("");
                                            }}>
                                                <i className="bi bi-x-circle" /> Réinitialiser les filtres
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {viewMode === "kanban" ? (
                                <KanbanView
                                    postulants={filtered}
                                    onCardClick={(p) => setDrawerCandidat(p)}
                                    onDecisionChange={handleSaveDecision}
                                />
                            ) : (
                                <>
                                    <div className="postulants-table-wrap">
                                        <table className="postulants-table--desktop">
                                            <thead>
                                                <tr>
                                                    <th style={{ width:36,textAlign:"center" }}>
                                                        <input type="checkbox" className="postulants-checkbox" checked={allPageSelected} onChange={toggleSelectAll} title="Tout sélectionner" />
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
                                                    return (
                                                        <tr key={p.id} className={sel ? "postulants-tr--selected" : ""}>
                                                            <td style={{ textAlign:"center" }} onClick={e => e.stopPropagation()}>
                                                                <input type="checkbox" className="postulants-checkbox" checked={sel} onChange={() => toggleSelect(p.id)} />
                                                            </td>
                                                            <td className="postulants-td-name postulants-td-clickable" onClick={() => setDrawerCandidat(p)} title="Voir le profil complet">
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
                                                                {p.diplomes?.length > 0 ? (
                                                                    <div style={{ display:"flex",flexDirection:"column",gap:3,alignItems:"center" }}>
                                                                        {p.diplomes.map((url,i) => (
                                                                            <a key={i} className="postulants-btn-dl postulants-btn-dl--diplome" href={url} target="_blank" rel="noreferrer">
                                                                                <i className="bi bi-download" /> Diplôme {i+1}
                                                                            </a>
                                                                        ))}
                                                                    </div>
                                                                ) : "—"}
                                                            </td>
                                                            <td>
                                                                <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
                                                                    <span
                                                                        className={`postulants-note postulants-note--${nc}`}
                                                                        onClick={() => setDrawerCandidat(p)}
                                                                        title="Voir l'analyse complète"
                                                                        style={{ cursor:"pointer" }}
                                                                    >
                                                                        {getNoteLabel(p.note_ia)}
                                                                    </span>
                                                                    <button className="postulants-analyze-btn" onClick={() => handleAnalyze(p.id)}>
                                                                        <i className="bi bi-robot" />{p.note_ia ? "Ré-analyser" : "Analyser"}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span
                                                                    className={`postulants-decision postulants-decision--${dec.cls}`}
                                                                    onClick={() => setDrawerCandidat(p)}
                                                                    title="Modifier la décision"
                                                                >
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

                            {viewMode === "table" && (
                                <div className="postulants-table-footer">
                                    <span className="postulants-footer-info">
                                        Affichage de l'élément{" "}
                                        <strong>{filtered.length === 0 ? 0 : (page-1)*PAGE_SIZE+1}</strong> à{" "}
                                        <strong>{Math.min(page*PAGE_SIZE, filtered.length)}</strong> sur{" "}
                                        <strong>{filtered.length}</strong> postulant{filtered.length !== 1 ? "s" : ""}
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
                © 2025 Zenselekt · Propulsé par <strong>Empower talents &amp; careers</strong>. Tous droits réservés
            </footer>

            <BulkActionBar
                count={selectedIds.size}
                emailType={emailType}
                setEmailType={setEmailType}
                onEmail={handleEnvoiEmail}
                onDecision={() => setBulkDecisionModalOpen(true)}
                onDeselect={() => setSelectedIds(new Set())}
            />

            {drawerCandidat && (
                <CandidatDrawer
                    candidat={drawerCandidat}
                    onClose={() => setDrawerCandidat(null)}
                    onSaveDecision={handleSaveDecision}
                    onAnalyze={handleAnalyze}
                />
            )}

            <EmailModal
                open={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                candidats={selectedCandidats}
                emailTypeKey={emailType}
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
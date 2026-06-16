import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./component/Header";
import Navbar from "./component/Navbar";
import { useSessionGuard } from "./component/useSessionGuard";
import './css/postulantCampagne.css';

const API_BASE      = "/securebackoffice/backsecurebackoffice/postulantCampagne.php";
const AUTH_REDIRECT = "/securebackoffice/";

const BI_CDN = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
function useBootstrapIcons() {
  useEffect(() => {
    if (!document.querySelector(`link[href="${BI_CDN}"]`)) {
      const link = document.createElement("link");
      link.rel  = "stylesheet";
      link.href = BI_CDN;
      document.head.appendChild(link);
    }
  }, []);
}

async function secureFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      ...(options.headers ?? {}),
    },
    credentials: "include",
    signal: options.signal ?? AbortSignal.timeout(20000),
  });
}

function handleAuthRedirect(res) {
  if (res.status === 401) {
    res.json()
      .then(j => window.location.replace(j.redirect_to ?? AUTH_REDIRECT))
      .catch(() => window.location.replace(AUTH_REDIRECT));
    return true;
  }
  return false;
}

const SECTEURS_ACTIVITE = [
  "Agriculture / Élevage / Pêche", "Agroalimentaire",
  "Architecture / Urbanisme / Design", "Art / Culture / Spectacle",
  "Artisanat / Métiers manuels", "Audit / Expertise comptable",
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

const NIVEAUX_ACADEMIQUES = [
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

/* ═══════════════════════════════════════════════════════════
   APERÇU EMAIL — rendu visuel fidèle
═══════════════════════════════════════════════════════════ */
function EmailPreview({ candidatPrenom, candidatNom, poste, entrepriseNom, tests, bodyLines }) {
  return (
    <div style={{ background: "#f0f4f8", borderRadius: 8, padding: 12 }}>
      <div style={{
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #dde3ea",
        overflow: "hidden",
        fontSize: 13,
        color: "#3d4350",
      }}>
        {/* Header email */}
        <div style={{ background: "#0f6655", padding: "18px 24px", textAlign: "center" }}>
          <div style={{
            width: 130, height: 22, background: "rgba(255,255,255,0.3)",
            borderRadius: 4, margin: "0 auto 8px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>LOGO ZENSELEKT</span>
          </div>
          <p style={{ margin: 0, color: "#cef0ea", fontSize: 11 }}>
            Propulsé par <strong style={{ color: "#fff" }}>Empower Talents &amp; Careers</strong>
          </p>
        </div>

        {/* Body email */}
        <div style={{ padding: "20px 24px" }}>
          {/* Ligne 1 : Bonjour */}
          <p style={{ fontWeight: 700, color: "#0f1117", fontSize: 15, marginBottom: 12 }}>
            Bonjour {candidatPrenom} {candidatNom},
          </p>

          {/* Paragraphe d'invitation */}
          <p style={{ color: "#3d4350", lineHeight: 1.75, marginBottom: 16, fontSize: 14 }}>
            Dans le cadre de votre candidature au poste de{" "}
            <strong style={{ color: "#0f6655" }}>« {poste || "Poste non défini"} »</strong>{" "}
            chez <strong>{entrepriseNom || "notre entreprise"}</strong>,
            nous vous invitons à compléter le(s) test(s) suivant(s) :
          </p>

          {/* Bloc tests */}
          <div style={{ background: "#f0faf8", borderRadius: 8, padding: "0 16px", marginBottom: 16 }}>
            {tests.map(t => (
              <div key={t.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "11px 0", borderBottom: "1px solid #e4e9ef",
              }}>
                <strong style={{ fontSize: 13, color: "#0f1117" }}>{t.titre}</strong>
                <span style={{
                  display: "inline-block", background: "#0f6655", color: "#fff",
                  borderRadius: 5, fontSize: 11, padding: "5px 12px", fontWeight: 700,
                }}>
                  Commencer →
                </span>
              </div>
            ))}
          </div>

          {/* Lignes du corps personnalisé (après les tests) */}
          {bodyLines.filter(l => l.trim()).map((line, i) => (
            <p key={i} style={{ margin: "0 0 8px", color: "#3d4350", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-line" }}>
              {line}
            </p>
          ))}

          <p style={{ margin: "12px 0 0", color: "#7c8596", fontSize: 12 }}>
            Pour toute question :{" "}
            <a href="mailto:contact@zenselekt.com" style={{ color: "#0f6655", fontWeight: 600 }}>
              contact@zenselekt.com
            </a>
          </p>
        </div>

        {/* Footer email */}
        <div style={{
          background: "#f8fafc", borderTop: "1px solid #e4e9ef",
          padding: "12px 24px", textAlign: "center",
        }}>
          <p style={{ margin: 0, color: "#a8b0bf", fontSize: 11 }}>
            © 2025 Zenselekt · Propulsé par{" "}
            <strong style={{ color: "#6b7280" }}>Empower Talents &amp; Careers</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MODAL — APERÇU & PERSONNALISATION DU CORPS D'EMAIL
═══════════════════════════════════════════════════════════ */
function PreviewModal({ tests, candidats, poste, entrepriseNom, onConfirm, onCancel, loading }) {
  const defaultSubject     = `Invitation aux tests — ${poste} | Zenselekt`;
  const defaultGreeting    = `Bonjour [Prénom] [Nom],`;
  const defaultIntro       = `Dans le cadre de votre candidature au poste de « ${poste} » chez ${entrepriseNom || "notre entreprise"}, nous vous invitons à compléter le(s) test(s) suivant(s) :`;
  const defaultClosing     = `Merci de compléter ces évaluations dans les 48 heures.\nVos résultats seront analysés par notre équipe.`;
  const defaultSignature   = `Pour toute question : contact@zenselekt.com`;

  const [subject,   setSubject]   = useState(defaultSubject);
  const [greeting,  setGreeting]  = useState(defaultGreeting);
  const [intro,     setIntro]     = useState(defaultIntro);
  const [closing,   setClosing]   = useState(defaultClosing);
  const [signature, setSignature] = useState(defaultSignature);
  const [tab,       setTab]       = useState("editor");

  /* On envoie tout le corps assemblé comme custom_message au PHP.
     Le PHP reçoit ce texte et le met en forme via nl2br dans l'email. */
  const assembledBody = [greeting, "", intro, "", ...(tests.map(t => `• ${t.titre}`)), "", closing, "", signature].join("\n");

  const handleConfirm = () => onConfirm({
    subject,
    customMsg: JSON.stringify({ greeting, intro, closing, signature }),
  });

  const IS = { /* inputStyle */
    width: "100%", padding: "9px 12px",
    border: "1px solid #d1d5db", borderRadius: 8,
    fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", color: "#111827",
    transition: "border-color .2s", background: "#fff",
  };
  const LS = { /* labelStyle */
    fontSize: 11, color: "#6b7280", textTransform: "uppercase",
    letterSpacing: ".5px", fontWeight: 600,
    display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
  };
  const focus = e => (e.target.style.borderColor = "#0f6655");
  const blur  = e => (e.target.style.borderColor = "#d1d5db");

  /* Champ réutilisable */
  const Field = ({ label, icon, value, onChange, rows = 1, hint }) => (
    <div style={{ marginBottom: 18 }}>
      <label style={LS}><i className={`bi ${icon}`} /> {label}</label>
      {rows === 1
        ? <input type="text" value={value} onChange={e => onChange(e.target.value)}
            style={IS} onFocus={focus} onBlur={blur} />
        : <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)}
            style={{ ...IS, resize: "vertical", lineHeight: 1.65 }}
            onFocus={focus} onBlur={blur} />
      }
      {hint && (
        <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 5 }}>
          <i className="bi bi-info-circle" /> {hint}
        </p>
      )}
    </div>
  );

  return (
    <div className="postulant-modal-overlay" onClick={onCancel}>
      <div
        className="postulant-modal"
        style={{ maxWidth: 680, width: "95%", maxHeight: "92vh", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="postulant-modal-header" style={{ background: "#0f6655", flexShrink: 0 }}>
          <h3 style={{ color: "#fff", margin: 0 }}>
            
            Aperçu &amp; personnalisation de l'email
          </h3>
          <button className="postulant-modal-close" onClick={onCancel} disabled={loading}>
            <i className="bi bi-x" />
          </button>
        </div>

        {/* Corps scrollable */}
        <div style={{ overflowY: "auto", flex: 1 }}>

          {/* Destinataires */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <p style={{ ...LS, marginBottom: 8 }}>
            
              Destinataires —{" "}
              <span style={{ background: "#e8edff", color: "#4338ca", borderRadius: 20, fontSize: 11, padding: "2px 8px", fontWeight: 600 }}>
                {candidats.length} candidat(s)
              </span>
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {candidats.slice(0, 10).map(c => (
                <span key={c.id} style={{ background: "#e8edff", color: "#4338ca", borderRadius: 20, fontSize: 12, padding: "3px 10px" }}>
                  {c.prenoms} {c.nom}
                </span>
              ))}
              {candidats.length > 10 && (
                <span style={{ background: "#dbeafe", color: "#1e40af", borderRadius: 20, fontSize: 12, padding: "3px 10px" }}>
                  +{candidats.length - 10} autres
                </span>
              )}
            </div>
          </div>

          {/* Tests sélectionnés */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <p style={{ ...LS, marginBottom: 8 }}>
             Tests sélectionnés
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tests.map(t => (
                <span key={t.id} style={{ background: "#d1fae5", color: "#065f46", borderRadius: 20, fontSize: 12, padding: "3px 10px" }}>
                  {t.titre}
                </span>
              ))}
            </div>
          </div>

          {/* Onglets */}
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", padding: "0 20px" }}>
            {[
              ["editor",  "bi-pencil-square", "Rédiger"],
              ["preview", "bi-eye",           "Aperçu visuel"],
              ["raw",     "bi-code-slash",    "Contenu brut"],
            ].map(([key, icon, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                padding: "10px 14px", fontSize: 13, border: "none",
                background: "none", cursor: "pointer",
                borderBottom: tab === key ? "2px solid #0f6655" : "2px solid transparent",
                color: tab === key ? "#0f6655" : "#6b7280",
                fontWeight: tab === key ? 600 : 400,
                transition: "color .2s", display: "flex", alignItems: "center", gap: 6,
              }}>
                <i className={`bi ${icon}`} /> {label}
              </button>
            ))}
          </div>

          {/* ── Onglet RÉDIGER ── */}
          {tab === "editor" && (
            <div style={{ padding: 20 }}>

              {/* Objet */}
              <Field label="Objet de l'email" 
                value={subject} onChange={setSubject} rows={1} />

              {/* Séparateur visuel */}
              <div style={{ borderTop: "1px dashed #e5e7eb", margin: "4px 0 18px", position: "relative" }}>
                <span style={{
                  position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                  background: "#f9fafb", padding: "0 10px",
                  fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px",
                }}>Corps de l'email</span>
              </div>

              {/* Salutation */}
              <Field label="Salutation"
                value={greeting} onChange={setGreeting} rows={1}
                hint="Utilisez [Prénom] et [Nom] — ils seront remplacés pour chaque candidat." />

              {/* Intro */}
              <Field label="Paragraphe d'introduction"
                value={intro} onChange={setIntro} rows={3} />

              {/* Bloc tests — non modifiable ici car généré dynamiquement */}
              <div style={{
                background: "#f0faf8", border: "1px solid #d1fae5",
                borderRadius: 8, padding: "10px 14px", marginBottom: 18,
              }}>
                <p style={{ ...LS, marginBottom: 8, color: "#065f46" }}>
                  <i className="bi bi-link-45deg" /> Liens des tests (insérés automatiquement)
                </p>
                {tests.map(t => (
                  <div key={t.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "6px 0", borderBottom: "1px solid #d1fae5", fontSize: 13,
                  }}>
                    <span style={{ color: "#065f46", fontWeight: 600 }}>{t.titre}</span>
                    <span style={{
                      background: "#0f6655", color: "#fff",
                      borderRadius: 4, fontSize: 11, padding: "3px 10px",
                    }}>Commencer →</span>
                  </div>
                ))}
              </div>

              {/* Clôture */}
              <Field label="Texte de clôture"
                value={closing} onChange={setClosing} rows={3} />

              {/* Signature */}
              <Field label="Signature / Contact" 
                value={signature} onChange={setSignature} rows={1} />

            </div>
          )}

          {/* ── Onglet APERÇU VISUEL ── */}
          {tab === "preview" && (
            <div style={{ padding: 20 }}>
              <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10, textAlign: "center" }}>
                <i className="bi bi-info-circle" /> Aperçu pour le premier destinataire — personnalisé pour chacun à l'envoi.
              </p>
              {/* Rendu visuel de l'email */}
              <div style={{ background: "#f0f4f8", borderRadius: 8, padding: 12 }}>
                <div style={{
                  background: "#fff", borderRadius: 8,
                  border: "1px solid #dde3ea", overflow: "hidden",
                  fontSize: 13, color: "#3d4350",
                }}>
                  {/* Header */}
                  <div style={{ background: "#0f6655", padding: "18px 24px", textAlign: "center" }}>
                    <div style={{
                      width: 130, height: 22, background: "rgba(255,255,255,0.3)",
                      borderRadius: 4, margin: "0 auto 8px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>LOGO ZENSELEKT</span>
                    </div>
                    <p style={{ margin: 0, color: "#cef0ea", fontSize: 11 }}>
                      Propulsé par <strong style={{ color: "#fff" }}>Empower Talents &amp; Careers</strong>
                    </p>
                  </div>
                  {/* Body */}
                  <div style={{ padding: "20px 24px" }}>
                    {/* Salutation personnalisée */}
                    <p style={{ fontWeight: 700, color: "#0f1117", fontSize: 15, marginBottom: 14 }}>
                      {greeting
                        .replace("[Prénom]", candidats[0]?.prenoms ?? "Prénom")
                        .replace("[Nom]",    candidats[0]?.nom     ?? "Nom")}
                    </p>
                    {/* Intro */}
                    <p style={{ color: "#3d4350", lineHeight: 1.75, marginBottom: 14, fontSize: 14, whiteSpace: "pre-line" }}>
                      {intro}
                    </p>
                    {/* Tests */}
                    <div style={{ background: "#f0faf8", borderRadius: 8, padding: "0 16px", marginBottom: 14 }}>
                      {tests.map(t => (
                        <div key={t.id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "11px 0", borderBottom: "1px solid #e4e9ef",
                        }}>
                          <strong style={{ fontSize: 13, color: "#0f1117" }}>{t.titre}</strong>
                          <span style={{
                            background: "#0f6655", color: "#fff",
                            borderRadius: 5, fontSize: 11, padding: "5px 12px", fontWeight: 700,
                          }}>Commencer →</span>
                        </div>
                      ))}
                    </div>
                    {/* Clôture */}
                    <p style={{ color: "#3d4350", fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-line", marginBottom: 10 }}>
                      {closing}
                    </p>
                    {/* Signature */}
                    <p style={{ color: "#7c8596", fontSize: 12, marginTop: 8 }}>
                      {signature}
                    </p>
                  </div>
                  {/* Footer */}
                  <div style={{
                    background: "#f8fafc", borderTop: "1px solid #e4e9ef",
                    padding: "12px 24px", textAlign: "center",
                  }}>
                    <p style={{ margin: 0, color: "#a8b0bf", fontSize: 11 }}>
                      © 2025 Zenselekt · Propulsé par{" "}
                      <strong style={{ color: "#6b7280" }}>Empower Talents &amp; Careers</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Onglet BRUT ── */}
          {tab === "raw" && (
            <div style={{ padding: 20 }}>
              <pre style={{
                background: "#f3f4f6", borderRadius: 8, padding: 16,
                fontSize: 12, overflowX: "auto", color: "#374151",
                lineHeight: 1.7, margin: 0,
              }}>
{`Objet : ${subject}

${greeting.replace("[Prénom]", candidats[0]?.prenoms ?? "Prénom").replace("[Nom]", candidats[0]?.nom ?? "Nom")}

${intro}

${tests.map(t => `• ${t.titre}  →  [lien du test]`).join("\n")}

${closing}

${signature}

© 2025 Zenselekt · Empower Talents & Careers`}
              </pre>
            </div>
          )}
        </div>

        {/* Pied de modal */}
        <div className="postulant-modal-footer" style={{ justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="bi bi-info-circle" />
            Personnalisé pour chaque destinataire
          </span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="postulant-modal-cancel" onClick={onCancel} disabled={loading}>
              Annuler
            </button>
            <button
              className="postulant-modal-submit postulant-modal-submit--success"
              onClick={handleConfirm}
              disabled={loading || !subject.trim()}
            >
              {loading ? (
                <>
                  <i className="bi bi-arrow-repeat" style={{ animation: "zen-spin .7s linear infinite" }} />
                  Envoi en cours…
                </>
              ) : (
                <>
                  
                  Envoyer à {candidats.length} candidat(s)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MODALS SUCCÈS / ERREUR
═══════════════════════════════════════════════════════════ */
function SuccessModal({ message, onClose }) {
  return (
    <div className="postulant-modal-overlay" onClick={onClose}>
      <div className="postulant-modal postulant-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="postulant-modal-header postulant-modal-header--success">
          <h3><i className="bi bi-check-circle" /> Envoi réussi</h3>
          <button className="postulant-modal-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>
        <div className="postulant-modal-body">
          <p style={{ whiteSpace: "pre-line" }}>{message}</p>
        </div>
        <div className="postulant-modal-footer">
          <button className="postulant-modal-submit postulant-modal-submit--success" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}

function ErrorModal({ message, onClose }) {
  return (
    <div className="postulant-modal-overlay" onClick={onClose}>
      <div className="postulant-modal postulant-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="postulant-modal-header postulant-modal-header--danger">
          <h3><i className="bi bi-x-circle" /> Erreur</h3>
          <button className="postulant-modal-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>
        <div className="postulant-modal-body">
          <p>{message}</p>
        </div>
        <div className="postulant-modal-footer">
          <button className="postulant-modal-submit postulant-modal-submit--danger" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function PostulantCampagne() {
  useBootstrapIcons();

  const location    = useLocation();
  const navigate    = useNavigate();
  const { checked } = useSessionGuard();

  const queryParams = new URLSearchParams(location.search);
  const poste       = queryParams.get("poste")     || "Offre d'emploi";
  const eventId     = parseInt(queryParams.get("event_id") || "0", 10);

  const [width,       setWidth]       = useState(window.innerWidth);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  useEffect(() => { if (width <= 768) setSidebarOpen(false); }, [width]);
  const isMobile = width <= 768;

  const [searchTerm,      setSearchTerm]      = useState("");
  const [selectedSecteur, setSelectedSecteur] = useState("");
  const [selectedNiveau,  setSelectedNiveau]  = useState("");
  const [page,            setPage]            = useState(1);
  const [itemsPerPage,    setItemsPerPage]    = useState(10);

  const [postulants, setPostulants] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingP,   setLoadingP]   = useState(true);
  const [errorP,     setErrorP]     = useState(null);

  const [tests,         setTests]         = useState([]);
  const [loadingT,      setLoadingT]      = useState(true);
  const [errorT,        setErrorT]        = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);

  const [selectedCandidats, setSelectedCandidats] = useState([]);
  const [selectAll,         setSelectAll]          = useState(false);

  const [modal,        setModal]        = useState(null);
  const [modalMessage, setModalMessage] = useState("");
  const [sending,      setSending]      = useState(false);

  const tableRef = useRef(null);

  const fetchTests = useCallback(async () => {
    setLoadingT(true);
    setErrorT(null);
    try {
      const res  = await secureFetch(`${API_BASE}?action=list_tests`);
      if (handleAuthRedirect(res)) return;
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erreur API");
      setTests(json.data.tests ?? []);
    } catch (err) {
      setErrorT(err.message || "Impossible de charger les tests.");
    } finally {
      setLoadingT(false);
    }
  }, []);

  const fetchPostulants = useCallback(async () => {
    if (!eventId) return;
    setLoadingP(true);
    setErrorP(null);
    try {
      const params = new URLSearchParams({
        action:   "list_postulants",
        event_id: String(eventId),
        page:     String(page),
        limit:    String(itemsPerPage),
        search:   searchTerm,
        secteur:  selectedSecteur,
        niveau:   selectedNiveau,
      });
      const res  = await secureFetch(`${API_BASE}?${params}`);
      if (handleAuthRedirect(res)) return;
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Erreur API");
      setPostulants(json.data.postulants ?? []);
      setTotal(json.data.total ?? 0);
      setTotalPages(json.data.total_pages ?? 1);
    } catch (err) {
      setErrorP(err.message || "Impossible de charger les postulants.");
      setPostulants([]);
    } finally {
      setLoadingP(false);
    }
  }, [eventId, page, itemsPerPage, searchTerm, selectedSecteur, selectedNiveau]);

  useEffect(() => { fetchTests(); },      [fetchTests]);
  useEffect(() => { fetchPostulants(); }, [fetchPostulants]);

  useEffect(() => {
    setPage(1);
    setSelectedCandidats([]);
  }, [searchTerm, selectedSecteur, selectedNiveau, itemsPerPage]);

  useEffect(() => {
    if (postulants.length === 0) { setSelectAll(false); return; }
    setSelectAll(postulants.every(p => selectedCandidats.includes(p.id)));
  }, [selectedCandidats, postulants]);

  const toggleCandidat = id =>
    setSelectedCandidats(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );

  const toggleSelectAll = () => {
    const ids = postulants.map(p => p.id);
    if (selectAll) {
      setSelectedCandidats(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedCandidats(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const clearSelection = () => { setSelectedCandidats([]); setSelectAll(false); };

  const toggleTest = id =>
    setSelectedTests(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );

  const handleEnvoyerClick = () => {
    if (selectedTests.length === 0) {
      setModalMessage("Veuillez sélectionner au moins un test avant d'envoyer.");
      setModal("error");
      return;
    }
    if (selectedCandidats.length === 0) {
      setModalMessage("Veuillez sélectionner au moins un candidat.");
      setModal("error");
      return;
    }
    setModal("preview");
  };

  const handleConfirmSend = async ({ subject, customMsg } = {}) => {
    setSending(true);
    try {
      const res = await secureFetch(`${API_BASE}?action=send_tests`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id:       eventId,
          test_ids:       selectedTests,
          candidat_ids:   selectedCandidats,
          poste,
          subject:        subject ?? "",
          custom_message: customMsg ?? "",
        }),
      });
      if (handleAuthRedirect(res)) return;
      const json = await res.json();
      setModal(null);
      setModalMessage(json.message);
      setModal(json.success ? "success" : "error");
      if (json.success) {
        setSelectedCandidats([]);
        setSelectedTests([]);
      }
    } catch (err) {
      setModal(null);
      setModalMessage(err.message || "Erreur lors de l'envoi.");
      setModal("error");
    } finally {
      setSending(false);
    }
  };

  const closeModal = () => { setModal(null); setModalMessage(""); };

  const skeletonRows = Array.from({ length: 5 }, (_, i) => i);

  if (!checked) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#f4f6fa",
        flexDirection: "column", gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, border: "3px solid #e2e8f0",
          borderTop: "3px solid #1a7070", borderRadius: "50%",
          animation: "zen-spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes zen-spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: "#93a4c3", fontSize: 14 }}>Vérification en cours…</span>
      </div>
    );
  }

  return (
    <div className="postulant-app">
      <style>{`@keyframes zen-spin { to { transform: rotate(360deg); } }`}</style>

      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(p => !p)}
        isMobile={isMobile}
      />

      <div className="postulant-layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={`postulant-main ${sidebarOpen ? "postulant-main--shifted" : ""}`}>
          <div className="postulant-container">

            {/* Breadcrumb */}
            <div className="postulant-breadcrumb">
              <div className="postulant-breadcrumb-left">
                <button className="postulant-back-btn" onClick={() => navigate(-1)}>
                  <i className="bi bi-arrow-left" />
                  <span>Retour</span>
                </button>
                <h1 className="postulant-title">
                  <span>Liste des Postulants</span>
                </h1>
              </div>
              <div className="postulant-breadcrumb-right">
                <span className="postulant-offre-badge">
                  {poste || "Offre d'emploi"}
                </span>
              </div>
            </div>

            {/* Filtres */}
            <div className="postulant-filters-card">
              <div className="postulant-filters-header">
                <span>Filtres de recherche</span>
              </div>
              <div className="postulant-filters-grid">

                <div className="postulant-filter-group">
                  <label>Recherche rapide</label>
                  <div className="postulant-search-input">
                    <i className="bi bi-search" />
                    <input
                      type="text"
                      placeholder="Nom, prénom ou email..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button onClick={() => setSearchTerm("")} className="postulant-clear-btn">
                        <i className="bi bi-x" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="postulant-filter-group">
                  <label>Secteur d'activité</label>
                  <select value={selectedSecteur} onChange={e => setSelectedSecteur(e.target.value)}>
                    <option value="">Tous les secteurs</option>
                    {SECTEURS_ACTIVITE.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="postulant-filter-group">
                  <label>Niveau académique</label>
                  <select value={selectedNiveau} onChange={e => setSelectedNiveau(e.target.value)}>
                    <option value="">Tous les niveaux</option>
                    {NIVEAUX_ACADEMIQUES.map(n => (
                      <option key={n.value} value={n.value}>{n.label}</option>
                    ))}
                  </select>
                </div>

              </div>

              {(searchTerm || selectedSecteur || selectedNiveau) && (
                <div className="postulant-filters-actions">
                  <button className="postulant-reset-btn" onClick={() => {
                    setSearchTerm("");
                    setSelectedSecteur("");
                    setSelectedNiveau("");
                  }}>
                    <i className="bi bi-arrow-counterclockwise" /> Réinitialiser
                  </button>
                </div>
              )}
            </div>

            {/* Sélection des tests */}
            <div className="postulant-filters-card">
              <div className="postulant-filters-header">
                <i className="bi bi-check2-square" />
                <span>Sélectionner le ou les tests à envoyer</span>
              </div>

              {loadingT ? (
                <div className="postulant-tests-grid">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="postulant-test-item" style={{ opacity: .5, pointerEvents: "none" }}>
                      <div style={{ height: 14, background: "#e2e8f0", borderRadius: 4, margin: "6px 0" }} />
                      <div style={{ height: 10, background: "#e2e8f0", borderRadius: 4, width: "70%" }} />
                    </div>
                  ))}
                </div>
              ) : errorT ? (
                <div className="postulant-api-error" style={{ margin: "16px 0" }}>
                  <i className="bi bi-exclamation-triangle-fill" />
                  <span>{errorT}</span>
                  <button onClick={fetchTests}>Réessayer</button>
                </div>
              ) : tests.length === 0 ? (
                <p style={{ color: "#7c8596", fontSize: 14, padding: "12px 0" }}>
                  Aucun test actif disponible.
                </p>
              ) : (
                <div className="postulant-tests-grid">
                  {tests.map(test => (
                    <label
                      key={test.id}
                      className={`postulant-test-item${selectedTests.includes(test.id) ? " postulant-test-item--selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTests.includes(test.id)}
                        onChange={() => toggleTest(test.id)}
                      />
                      <div className="postulant-test-content">
                        <strong>{test.titre}</strong>
                        <small>{test.description}</small>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <p className="postulant-test-hint">
                <i className="bi bi-info-circle" />
                Cochez un ou plusieurs tests, sélectionnez des candidats,
                puis cliquez sur Envoyer pour prévisualiser et personnaliser l'email avant l'envoi.
              </p>

              <div className="postulant-filters-actions">
                <div className="postulant-action-group">
                  <button className="postulant-action-btn" onClick={handleEnvoyerClick}>
                    <i className="bi bi-envelope-paper-fill" />
                    ENVOYER LES TESTS AUX CANDIDATS SÉLECTIONNÉS
                  </button>
                  <button className="postulant-results-btn"
                    onClick={() => navigate(`/resultatstests?event_id=${eventId}&poste=${encodeURIComponent(poste)}`)}>
                    RÉSULTATS DES TESTS
                  </button>
                </div>
                <div className="postulant-stats">
                  <i className="bi bi-check-square-fill" />
                  <span>{selectedCandidats.length} / {total} candidat(s) sélectionné(s)</span>
                </div>
              </div>
            </div>

            {/* Tableau des candidats */}
            <div className="postulant-table-card" ref={tableRef}>

              {errorP && !loadingP && (
                <div className="postulant-api-error" style={{ margin: "16px 0" }}>
                  <i className="bi bi-exclamation-triangle-fill" />
                  <span>{errorP}</span>
                  <button onClick={fetchPostulants}>Réessayer</button>
                </div>
              )}

              <div className="postulant-table-header">
                <div className="postulant-table-controls">
                  <div className="postulant-table-controls-left">
                    <label>
                      Afficher
                      <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))}>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      éléments
                    </label>
                  </div>
                  <div className="postulant-table-controls-right">
                    {!loadingP && postulants.length > 0 && (
                      <>
                        <button className="postulant-select-all-btn" onClick={toggleSelectAll}>
                        
                          {selectAll ? "Désélectionner la page" : "Sélectionner la page"}
                        </button>
                        {selectedCandidats.length > 0 && (
                          <button className="postulant-clear-selection-btn" onClick={clearSelection}>
                            <i className="bi bi-x-circle" />
                            Effacer ({selectedCandidats.length})
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="postulant-table-wrapper">
                <table className="postulant-table">
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>
                        <input
                          type="checkbox"
                          checked={selectAll && postulants.length > 0}
                          onChange={toggleSelectAll}
                          disabled={postulants.length === 0 || loadingP}
                        />
                      </th>
                      <th>Nom</th>
                      <th>Prénom(s)</th>
                      <th>Email</th>
                      <th>Téléphone</th>
                      <th>WhatsApp</th>
                      <th>Secteur d'activité</th>
                      <th>Niveau académique</th>
                      <th>Genre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingP ? (
                      skeletonRows.map(i => (
                        <tr key={i} className="offres-skeleton-row">
                          {Array.from({ length: 9 }).map((_, j) => (
                            <td key={j}><div className="offres-skeleton-cell" /></td>
                          ))}
                        </tr>
                      ))
                    ) : postulants.length === 0 ? (
                      <tr>
                        <td colSpan={9}>
                          <div className="postulant-empty-state">
                            <i className="bi bi-inbox" />
                            <p>Aucun postulant trouvé</p>
                            {(searchTerm || selectedSecteur || selectedNiveau) && (
                              <span>Essayez de modifier vos filtres</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      postulants.map(p => (
                        <tr key={p.id} className={selectedCandidats.includes(p.id) ? "postulant-row-selected" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedCandidats.includes(p.id)}
                              onChange={() => toggleCandidat(p.id)}
                            />
                          </td>
                          <td><strong>{p.nom}</strong></td>
                          <td>{p.prenoms}</td>
                          <td className="postulant-email">{p.email}</td>
                          <td>{p.tel}</td>
                          <td>{p.telwhat}</td>
                          <td><span className="postulant-badge secteur">{p.Secteur}</span></td>
                          <td><span className="postulant-badge niveau">{p.Niveau}</span></td>
                          <td>
                            <span className={`postulant-gender ${(p.Genre || "").toLowerCase()}`}>
                              
                              {p.Genre}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="postulant-pagination">
                  <span className="postulant-pagination-info">
                    Affichage de {(page - 1) * itemsPerPage + 1} à{" "}
                    {Math.min(page * itemsPerPage, total)} sur {total} éléments
                  </span>
                  <div className="postulant-pagination-controls">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      <i className="bi bi-chevron-left" /> Précédent
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let n;
                      if (totalPages <= 5)             n = i + 1;
                      else if (page <= 3)              n = i + 1;
                      else if (page >= totalPages - 2) n = totalPages - 4 + i;
                      else                             n = page - 2 + i;
                      return (
                        <button
                          key={n}
                          className={page === n ? "active" : ""}
                          onClick={() => {
                            setPage(n);
                            tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                        >
                          {n}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                      Suivant <i className="bi bi-chevron-right" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {modal === "preview" && (
        <PreviewModal
          tests={tests.filter(t => selectedTests.includes(t.id))}
          candidats={postulants.filter(p => selectedCandidats.includes(p.id))}
          poste={poste}
          entrepriseNom=""
          onConfirm={handleConfirmSend}
          onCancel={closeModal}
          loading={sending}
        />
      )}
      {modal === "success" && <SuccessModal message={modalMessage} onClose={closeModal} />}
      {modal === "error"   && <ErrorModal   message={modalMessage} onClose={closeModal} />}

      <footer className={`postulant-footer ${sidebarOpen ? "postulant-footer--shifted" : ""}`}>
        © 2025 Zenselekt · Propulsé par{" "}
        <strong>Empower talents &amp; careers</strong>. Tous droits réservés
      </footer>
    </div>
  );
}
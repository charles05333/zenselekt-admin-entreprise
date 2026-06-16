import { useState, useEffect, useRef, useCallback } from "react";
import "./assets/css/index.css";
import zenImg from "./assets/img/zen.png";

/* ─────────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────────── */
const API_BASE = "/securebackoffice/backsecurebackoffice/index.php";

/* ─────────────────────────────────────────────────────────────
   ICÔNES SVG
───────────────────────────────────────────────────────────── */
const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconEyeOn = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   HOOK — SWEETALERT2 (chargement dynamique)
───────────────────────────────────────────────────────────── */
function useSweetAlert() {
  useEffect(() => {
    if (!document.querySelector('link[href*="sweetalert2"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css";
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[src*="sweetalert2"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      document.head.appendChild(script);
    }
  }, []);
}

/* ─────────────────────────────────────────────────────────────
   HELPER — fetch sécurisé
   Centralise les headers obligatoires pour la validation CSRF [FIX #1].
   X-Requested-With est requis côté PHP pour accepter la requête.
───────────────────────────────────────────────────────────── */
async function secureFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      // [FIX #1] Header CSRF — validé côté PHP dans validateCsrfRequest()
      "X-Requested-With": "XMLHttpRequest",
      ...(options.headers ?? {}),
    },
    credentials: "include",
    signal: options.signal ?? AbortSignal.timeout(15000),
  });
}

/* ─────────────────────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────────────────────── */
export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [erreur, setErreur]             = useState("");
  const [loading, setLoading]           = useState(false);
  const [redirecting, setRedirecting]   = useState(false);

  useSweetAlert();

  const emailRef  = useRef(null);
  const erreurRef = useRef(null);

  useEffect(() => { emailRef.current?.focus(); }, []);
  useEffect(() => { if (erreur) erreurRef.current?.focus(); }, [erreur]);

  /* ── Validation ── */
  const validateForm = useCallback(() => {
    if (!email.trim() || !password) {
      setErreur("Email et mot de passe requis.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErreur("Adresse email invalide.");
      return false;
    }
    if (password.length < 8) {
      setErreur("Mot de passe trop court.");
      return false;
    }
    if (password.length > 128) {
      setErreur("Mot de passe trop long.");
      return false;
    }
    return true;
  }, [email, password]);

  /* ── Mot de passe oublié ── */
  const handleForgotPassword = useCallback(() => {
    if (!window.Swal) return;
    window.Swal.fire({
      title: "Mot de passe oublié ?",
      html: `
        <p style="color:#4a5568;font-size:14px;margin-bottom:18px;line-height:1.6;">
          Veuillez contacter l'assistance technique pour réinitialiser votre mot de passe.
        </p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <a href="tel:+2250758034078" style="
            display:flex;align-items:center;gap:10px;
            background:#f0fafa;border:1px solid #c6e8e8;
            border-radius:10px;padding:12px 16px;
            text-decoration:none;color:#1a7070;font-size:14px;font-weight:500;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a7070" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.08 6.08l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            +225 07 58 03 40 78
          </a>
          <a href="mailto:contact@zenselekt.com" style="
            display:flex;align-items:center;gap:10px;
            background:#f0fafa;border:1px solid #c6e8e8;
            border-radius:10px;padding:12px 16px;
            text-decoration:none;color:#1a7070;font-size:14px;font-weight:500;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a7070" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            contact@zenselekt.com
          </a>
        </div>`,
      icon: "info",
      confirmButtonText: "Fermer",
      confirmButtonColor: "#1a7070",
    });
  }, []);

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");

    if (!validateForm()) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("email",    email.trim());
    formData.append("mdp",      password);

    try {
      // [FIX #1] secureFetch injecte automatiquement X-Requested-With: XMLHttpRequest
      const response = await secureFetch(API_BASE, {
        method: "POST",
        body:   formData,
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setErreur("Erreur serveur inattendue.");
        return;
      }

      if (response.status === 429) {
        setErreur(data.message || "Trop de tentatives. Réessayez plus tard.");
        return;
      }

      if (response.ok && data.success) {
        /*
         * [FIX #4] sessionStorage supprimé.
         * Les données entreprise (email, forfait, permissions…) ne sont
         * plus stockées côté client — elles restent exclusivement en
         * session PHP, inaccessibles à un éventuel script XSS.
         *
         * Le reste de l'application récupère le profil via :
         *   GET /securebackoffice/backsecurebackoffice/index.php?action=session_check
         * qui retourne les données depuis $_SESSION de façon sécurisée.
         *
         * Ligne supprimée :
         *   sessionStorage.setItem("bo_entreprise", JSON.stringify(data.entreprise));
         */
        setRedirecting(true);
        setTimeout(() => {
          window.location.href = data.redirect || "/acceuil";
        }, 400);
      } else {
        setErreur(data.message || "Identifiants incorrects.");
      }
    } catch (err) {
      if (err.name === "TimeoutError" || err.name === "AbortError") {
        setErreur("La requête a expiré. Vérifiez votre connexion.");
      } else {
        setErreur(`Erreur réseau : ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ── */
  return (
    <section className="login-outer" aria-label="Connexion Backoffice">
      <div className="login-card" role="main">

        {/* Logo */}
        <div className="brand">
          <img src={zenImg} alt="Logo Zenselekt" className="brand-logo" />
        </div>

        <p className="login-subtitle">
          Connectez-vous en entrant les informations ci-dessous
        </p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} noValidate aria-label="Formulaire de connexion">

          {/* Message d'erreur */}
          {erreur && (
            <p ref={erreurRef} className="error-message"
              role="alert" aria-live="assertive" tabIndex={-1}>
              <IconAlert />
              <span>{erreur}</span>
            </p>
          )}

          {/* Email */}
          <div className="field-wrap">
            <label htmlFor="login-email" className="sr-only">Adresse email</label>
            <input
              id="login-email"
              ref={emailRef}
              type="email"
              className="field-input"
              placeholder="Email"
              value={email}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              maxLength={254}
              onChange={(e) => { setEmail(e.target.value); setErreur(""); }}
              aria-required="true"
              aria-invalid={erreur ? "true" : "false"}
              disabled={loading || redirecting}
            />
          </div>

          {/* Mot de passe */}
          <div className="field-wrap">
            <label htmlFor="login-password" className="sr-only">Mot de passe</label>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              className="field-input password-input"
              placeholder="Mot de passe"
              value={password}
              autoComplete="current-password"
              maxLength={128}
              onChange={(e) => { setPassword(e.target.value); setErreur(""); }}
              aria-required="true"
              disabled={loading || redirecting}
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={showPassword}
              disabled={loading || redirecting}
            >
              {showPassword ? <IconEyeOff /> : <IconEyeOn />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="submit-btn"
            disabled={loading || redirecting}
            aria-busy={loading}
          >
            {redirecting ? (
              <><span className="spinner" aria-hidden="true" /> Redirection…</>
            ) : loading ? (
              <><span className="spinner" aria-hidden="true" /> Connexion…</>
            ) : (
              "Valider"
            )}
          </button>
        </form>

        <div className="divider" aria-hidden="true" />

        <p className="forgot" onClick={handleForgotPassword} style={{ cursor: "pointer" }}>
          Mot de passe oublié ?
        </p>
      </div>
    </section>
  );
}
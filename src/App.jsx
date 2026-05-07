import { useState, useEffect } from "react";
import "./assets/css/index.css";
import zenImg from "./assets/img/zen.png";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");

  // Charger SweetAlert2 dynamiquement
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    document.head.appendChild(script);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("mdp", password);

      const response = await fetch("", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        window.location.href = "/page/demo.php";
      } else {
        const data = await response.json();
        setErreur(data.message || "Identifiants incorrects.");
      }
    } catch (err) {
      setErreur("Erreur de connexion au serveur.");
    }
  };

  const handleForgotPassword = () => {
    if (!window.Swal) return;

    window.Swal.fire({
      title: "Mot de passe oublié ?",
      html: `
        <p style="color:#4a5568; font-size:14px; margin-bottom:18px; line-height:1.6;">
          Veuillez contacter l'assistance technique pour réinitialiser votre mot de passe.
        </p>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <a href="tel:+2250758034078" style="
            display:flex; align-items:center; gap:10px;
            background:#f0fafa; border:1px solid #c6e8e8;
            border-radius:10px; padding:12px 16px;
            text-decoration:none; color:#1a7070; font-size:14px; font-weight:500;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a7070" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.08 6.08l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            +225 07 58 03 40 78
          </a>
          <a href="mailto:contact@zenselekt.com" style="
            display:flex; align-items:center; gap:10px;
            background:#f0fafa; border:1px solid #c6e8e8;
            border-radius:10px; padding:12px 16px;
            text-decoration:none; color:#1a7070; font-size:14px; font-weight:500;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a7070" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            contact@zenselekt.com
          </a>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Fermer",
      confirmButtonColor: "#1a7070",
      customClass: {
        popup: "swal-custom-popup",
        title: "swal-custom-title",
        confirmButton: "swal-custom-btn",
      },
    });
  };

  return (
    <section className="login-outer">
      <div className="login-card">
        <div className="brand">
          <img src={zenImg} alt="Logo Zenselekt" className="brand-logo" />
        </div>

        <p className="login-subtitle">
          Connectez-vous en entrant les informations ci-dessous
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {erreur && <p className="error-message">{erreur}</p>}

          <div className="field-wrap">
            <input
              id="email"
              type="text"
              className="field-input"
              name="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field-wrap">
            <input
              id="password-field"
              type={showPassword ? "text" : "password"}
              className="field-input password-input"
              name="mdp"
              required
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <button type="submit" className="submit-btn">
            Valider
          </button>
        </form>

        <div className="divider" />
        <p className="forgot" onClick={handleForgotPassword}>
          Mot de passe oublié ?
        </p>
      </div>
    </section>
  );
}
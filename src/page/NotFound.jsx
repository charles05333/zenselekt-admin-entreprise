import { Link } from "react-router-dom";
import "./css/NotFound.css";
import zenImg from "../assets/img/zen.png";

export default function NotFound() {
  return (
    <div className="nf-page">
      <header className="nf-topbar">
        <Link to="/acceuil" className="nf-topbar__back" aria-label="Retour à l'accueil">
          <i className="fas fa-arrow-left" aria-hidden="true" /> Accueil
        </Link>
        <img src={zenImg} alt="Zenselekt — retour à l'accueil" className="nf-topbar__logo" />
      </header>

      <main className="nf-main">
        <div className="nf-card">
          <div className="nf-icon-wrap" aria-hidden="true">
            <i className="fas fa-map-signs" />
          </div>

          <h1 className="nf-code">404</h1>
          <h2 className="nf-title">Page introuvable</h2>
          <p className="nf-desc">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>

         
        </div>
      </main>
    </div>
  );
}
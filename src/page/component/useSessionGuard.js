/**
 * useSessionGuard.js
 * Hook centralisé pour :
 *  - Récupérer les données de session depuis le serveur (session_check)
 *  - Proposer une déconnexion avec confirmation SweetAlert
 *  - Rediriger vers /securebackoffice/ si session invalide/expirée
 */

import { useState, useEffect, useCallback } from "react";

const SESSION_CHECK_URL =
  "/securebackoffice/backsecurebackoffice/index.php?action=session_check";
const LOGOUT_URL =
  "/securebackoffice/backsecurebackoffice/index.php?action=logout";

// ✅ URL de redirection vers le login — cohérente partout
export const LOGIN_REDIRECT = "/securebackoffice/";

/* ── Chargement dynamique SweetAlert2 ── */
function loadSwal() {
  return new Promise((resolve) => {
    if (window.Swal) return resolve(window.Swal);

    if (!document.querySelector('link[href*="sweetalert2"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css";
      document.head.appendChild(link);
    }

    if (!document.querySelector('script[src*="sweetalert2"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      script.onload = () => resolve(window.Swal);
      document.head.appendChild(script);
    } else {
      const id = setInterval(() => {
        if (window.Swal) {
          clearInterval(id);
          resolve(window.Swal);
        }
      }, 50);
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   HOOK PRINCIPAL
───────────────────────────────────────────────────────────── */
export function useSessionGuard() {
  const [entreprise, setEntreprise] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [checked, setChecked]       = useState(false);

  /* ── 1. Vérification session au montage ── */
  useEffect(() => {
    let cancelled = false;

    fetch(SESSION_CHECK_URL, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(10000),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.entreprise) {
          setEntreprise(data.entreprise);
          setChecked(true);
        } else {
          window.location.replace(LOGIN_REDIRECT);
        }
      })
      .catch(() => {
        if (!cancelled) window.location.replace(LOGIN_REDIRECT);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  /* ── 2. Déconnexion avec confirmation SweetAlert ── */
  const logout = useCallback(async () => {
    const Swal = await loadSwal();

    const result = await Swal.fire({
      title: "Déconnexion",
      text: "Êtes-vous sûr de vouloir vous déconnecter ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui, me déconnecter",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#c53030",
      cancelButtonColor: "#1a7070",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Déconnexion…",
      text: "Veuillez patienter.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await fetch(LOGOUT_URL, {
        method: "POST",
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      /* On redirige quand même si la requête échoue */
    } finally {
      window.location.replace(LOGIN_REDIRECT);
    }
  }, []);

  return { entreprise, loading, checked, logout };
}
export default function SessionLoader() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#f4f6fa",
      flexDirection: "column",
      gap: 16,
    }}>
      <style>{`@keyframes zen-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        width: 40,
        height: 40,
        border: "3px solid #e2e8f0",
        borderTop: "3px solid #1a7070",
        borderRadius: "50%",
        animation: "zen-spin 0.8s linear infinite",
      }} />
      <span style={{ color: "#93a4c3", fontSize: 14, fontFamily: "DM Sans, sans-serif" }}>
        Vérification en cours…
      </span>
    </div>
  );
}
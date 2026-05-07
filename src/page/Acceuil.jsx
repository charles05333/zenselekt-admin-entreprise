import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import './css/accueil.css';
import Header from "./component/Header";
import Navbar from "./component/Navbar";

// ── Bootstrap Icons via CDN ──────────────────────────────
const BI_CDN = "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css";
function useBootstrapIcons() {
  useEffect(() => {
    if (!document.querySelector(`link[href="${BI_CDN}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = BI_CDN;
      document.head.appendChild(link);
    }
  }, []);
}

// ── Mock data (à déplacer dans /src/data/mockData.js pour branchement API) ──
const MOCK_STATS = {
  candidats:     { value: 15, delta: +3,  label: "Candidats inscrits sur la plateforme",    icon: "bi-person",       iconColor: "#4154f1", iconBg: "rgba(65,84,241,0.09)",   delay: "0ms"   },
  annonces:      { value: 2,  delta:  0,  label: "Annonces postées vous concernant",         icon: "bi-briefcase",    iconColor: "#2eca6a", iconBg: "rgba(46,202,106,0.09)",  delay: "60ms"  },
  annoncesCours: { value: 1,  delta: -1,  label: "Annonces en cours vous concernant",        icon: "bi-bag",          iconColor: "#2eca6a", iconBg: "rgba(46,202,106,0.09)",  delay: "120ms" },
  recrutes:      { value: 7,  delta: +2,  label: "Candidats recrutés",                       icon: "bi-person-check", iconColor: "#0a78b5", iconBg: "rgba(10,120,181,0.09)",  delay: "180ms" },
};

const MOCK_NIVEAUX = [
  { niveau: "Licence",   total: 1 },
  { niveau: "Master",    total: 6 },
  { niveau: "Ingénieur", total: 4 },
  { niveau: "Doctorat",  total: 1 },
  { niveau: "BTS",       total: 2 },
  { niveau: "DUT",       total: 1 },
];

const MOCK_SECTEURS = [
  { secteur: "Informatique / Télécoms",             total: 4, color: "#9c6fce" },
  { secteur: "Santé",                               total: 3, color: "#a8ce2a" },
  { secteur: "Management",                          total: 2, color: "#4b2fa0" },
  { secteur: "Métallurgie / Travail du métal",      total: 2, color: "#888888" },
  { secteur: "Chimie / Parachimie",                 total: 2, color: "#e91e8c" },
  { secteur: "Environnement",                       total: 5, color: "#29b6f6" },
  { secteur: "Agroalimentaire",                     total: 3, color: "#26c6da" },
  { secteur: "Bois / Papier / Carton / Imprimerie", total: 3, color: "#80deea" },
  { secteur: "Études et conseils",                  total: 1, color: "#6a1b9a" },
];

// ── Utility : delta badge ─────────────────────────────────
function DeltaBadge({ delta }) {
  if (delta === 0) return <span className="delta delta--neutral">→ Stable</span>;
  if (delta > 0)  return <span className="delta delta--up">↑ +{delta} ce mois</span>;
  return              <span className="delta delta--down">↓ {delta} vs mois passé</span>;
}

// ── Progress bar (% de la valeur max fixée à 30 pour les stats) ──────────────
function StatProgress({ value, max = 30, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="stat-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="stat-progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Period Selector ───────────────────────────────────────
const PERIODS = ["7j", "30j", "3m", "1an"];
function PeriodSelector({ value, onChange }) {
  return (
    <div className="period-selector" role="group" aria-label="Sélecteur de période">
      {PERIODS.map((p) => (
        <button
          key={p}
          className={`period-pill${value === p ? " period-pill--active" : ""}`}
          onClick={() => onChange(p)}
          aria-pressed={value === p}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

// ── Taux de conversion card ───────────────────────────────
function ConversionCard({ recrutes, candidats, delay }) {
  const taux = candidats > 0 ? Math.round((recrutes / candidats) * 100) : 0;
  const circumference = 2 * Math.PI * 22;
  const offset = circumference - (taux / 100) * circumference;

  return (
    <div className="stat-card stat-card--conversion" style={{ animationDelay: delay }}>
      <h5 className="stat-label">Taux de conversion</h5>
      <div className="stat-row">
        <div className="conversion-gauge" aria-label={`Taux de conversion : ${taux}%`}>
          <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(10,120,181,0.12)" strokeWidth="5" />
            <circle
              cx="26" cy="26" r="22" fill="none"
              stroke="#0a78b5" strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <span className="conversion-pct">{taux}%</span>
        </div>
        <div className="conversion-info">
          <div className="stat-value">{taux}<span className="stat-value-unit">%</span></div>
          <div className="conversion-sub">{recrutes} recrutés / {candidats} inscrits</div>
        </div>
      </div>
      <StatProgress value={taux} max={100} color="#0a78b5" />
    </div>
  );
}

// ── Tooltip ───────────────────────────────────────────────
function Tooltip({ x, y, label, value, visible }) {
  if (!visible) return null;
  return (
    <g>
      <rect
        x={x - 44} y={y - 42} width={88} height={34}
        rx={6} fill="#1a2f5e"
        filter="drop-shadow(0 2px 6px rgba(0,0,0,0.18))"
      />
      <polygon points={`${x - 6},${y - 8} ${x + 6},${y - 8} ${x},${y}`} fill="#1a2f5e" />
      <text x={x} y={y - 26} textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize={10} fontFamily="DM Sans, sans-serif">{label}</text>
      <text x={x} y={y - 12} textAnchor="middle" fill="#fff" fontSize={13} fontWeight="600" fontFamily="DM Sans, sans-serif">{value}</text>
    </g>
  );
}

// ── Line Chart SVG ─────────────────────────────────────────
function LineChart({ data }) {
  const [tooltip, setTooltip] = useState({ idx: -1 });
  const [period, setPeriod] = useState("30j");

  const W = 960, H = 420;
  const PL = 55, PR = 25, PT = 45, PB = 55;
  const iW = W - PL - PR;
  const iH = H - PT - PB;

  // Mémoisation des calculs SVG
  const { pts, pathD, areaD, yTicks } = useMemo(() => {
    const maxV = Math.max(...data.map((d) => d.total));
    const minV = Math.min(...data.map((d) => d.total));
    const padding = Math.max(1, Math.round((maxV - minV) * 0.2));
    const yMax = maxV + padding;
    const yMin = Math.max(0, minV - padding);

    const yScale = (v) => PT + iH - ((v - yMin) / (yMax - yMin)) * iH;
    const xStep = iW / (data.length - 1);

    const computedPts = data.map((d, i) => ({
      x: PL + i * xStep,
      y: yScale(d.total),
      label: d.niveau,
      val: d.total,
    }));

    const step = Math.ceil((yMax - yMin) / 6);
    const ticks = [];
    for (let v = yMin; v <= yMax; v += step) ticks.push(v);

    const pd = computedPts.map((p, i) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      const prev = computedPts[i - 1];
      const cpx = xStep * 0.4;
      return `C ${prev.x + cpx},${prev.y} ${p.x - cpx},${p.y} ${p.x},${p.y}`;
    }).join(" ");

    const ad = pd + ` L ${computedPts[computedPts.length - 1].x},${PT + iH} L ${computedPts[0].x},${PT + iH} Z`;

    return { pts: computedPts, pathD: pd, areaD: ad, yTicks: ticks };
  }, [data, iW, iH]);

  const activeTooltip = tooltip.idx >= 0 ? pts[tooltip.idx] : null;

  return (
    <div className="linechart-wrap">
      <div className="chart-controls">
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="linechart-svg"
        role="img"
        aria-label="Graphique du nombre de candidats inscrits par niveau d'étude"
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1a7dc4" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#1a7dc4" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((v) => {
          const y = PT + iH - ((v - yTicks[0]) / (yTicks[yTicks.length - 1] - yTicks[0] || 1)) * iH;
          return (
            <g key={v}>
              <line x1={PL} y1={y} x2={W - PR} y2={y}
                stroke={v === yTicks[0] ? "#d4dff0" : "#edf2fa"}
                strokeWidth={v === yTicks[0] ? 1.5 : 1}
                strokeDasharray={v === yTicks[0] ? "none" : "4 3"} />
              <text x={PL - 10} y={y + 4} textAnchor="end"
                fontSize={11} fill="#93a4c3" fontFamily="DM Sans, sans-serif">{v}</text>
            </g>
          );
        })}

        {pts.map((p, i) => (
          <line key={i} x1={p.x} y1={PT} x2={p.x} y2={PT + iH}
            stroke="#edf2fa" strokeWidth={1} strokeDasharray="4 3" />
        ))}

        <text x={14} y={PT + iH / 2} textAnchor="middle"
          fontSize={11} fill="#93a4c3" fontFamily="DM Sans, sans-serif"
          transform={`rotate(-90, 14, ${PT + iH / 2})`}>
          Nombre de candidats
        </text>
        <text x={PL + iW / 2} y={H - 6} textAnchor="middle"
          fontSize={11} fill="#93a4c3" fontFamily="DM Sans, sans-serif">
          Niveau
        </text>

        {pts.map((p, i) => (
          <text key={i} x={p.x} y={PT + iH + 20} textAnchor="middle"
            fontSize={11} fill="#5a6f99" fontFamily="DM Sans, sans-serif">
            {p.label}
          </text>
        ))}

        <path d={areaD} fill="url(#areaGrad)" />
        <path d={pathD} fill="none" stroke="#1a7dc4" strokeWidth={2}
          strokeLinejoin="round" strokeLinecap="round" />

        {pts.map((p, i) => (
          <g key={i}
            onMouseEnter={() => setTooltip({ idx: i })}
            onMouseLeave={() => setTooltip({ idx: -1 })}
            style={{ cursor: "pointer" }}
            role="graphics-symbol"
            aria-label={`${p.label} : ${p.val} candidats`}
          >
            <circle cx={p.x} cy={p.y} r={18} fill="transparent" />
            <circle cx={p.x} cy={p.y} r={tooltip.idx === i ? 10 : 8} fill="#1a7dc4" fillOpacity="0.1"
              style={{ transition: "r 0.15s" }} />
            <circle cx={p.x} cy={p.y} r={tooltip.idx === i ? 6 : 4.5} fill="#fff" stroke="#1a7dc4"
              strokeWidth={2.5} style={{ transition: "r 0.15s" }} />
          </g>
        ))}

        {activeTooltip && (
          <Tooltip
            x={activeTooltip.x}
            y={activeTooltip.y}
            label={activeTooltip.label}
            value={`${activeTooltip.val} candidat${activeTooltip.val > 1 ? "s" : ""}`}
            visible
          />
        )}

        <rect x={PL + iW / 2 - 75} y={PT - 30} width={10} height={10} fill="#1a7dc4" rx={3} aria-hidden="true" />
        <text x={PL + iW / 2 - 53} y={PT - 22} fontSize={10.5} fill="#5a6f99"
          fontFamily="DM Sans, sans-serif">
          Candidats par Niveau
        </text>
      </svg>
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────
function DonutChart({ data, onFilter }) {
  const [activeSecteur, setActiveSecteur] = useState(null);
  const [period, setPeriod] = useState("30j");
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  const total = useMemo(() => data.reduce((s, d) => s + d.total, 0), [data]);

  const segs = useMemo(() => {
    const circ = 2 * Math.PI * 72;
    let cumul = 0;
    return data.map((d) => {
      const pct = d.total / total;
      const seg = { ...d, offset: cumul, dash: pct * circ, gap: circ - pct * circ };
      cumul += pct;
      return seg;
    });
  }, [data, total]);

  const r = 72, cx = 92, cy = 92, stroke = 28;
  const circ = 2 * Math.PI * r;

  const handleSegmentClick = useCallback((secteur) => {
    const next = activeSecteur === secteur ? null : secteur;
    setActiveSecteur(next);
    if (onFilter) onFilter(next);
  }, [activeSecteur, onFilter]);

  const col1 = data.slice(0, 5);
  const col2 = data.slice(5);

  return (
    <div className="donut-outer">
      <div className="chart-controls">
        <PeriodSelector value={period} onChange={setPeriod} />
        {activeSecteur && (
          <button
            className="filter-clear-btn"
            onClick={() => { setActiveSecteur(null); if (onFilter) onFilter(null); }}
          >
            <i className="bi bi-x" aria-hidden="true" /> {activeSecteur}
          </button>
        )}
      </div>
      <div className="donut-wrap">
        <div className="donut-svg-wrap">
          <svg
            width={184} height={184}
            viewBox="0 0 184 184"
            role="img"
            aria-label={`Répartition par secteur d'activité — ${total} candidats`}
          >
            <circle cx={cx} cy={cy} r={r} fill="none"
              stroke="#edf2fa" strokeWidth={stroke} />
            {segs.map((s, i) => {
              const isActive = activeSecteur === null || activeSecteur === s.secteur;
              const isHovered = hoveredIdx === i;
              return (
                <circle
                  key={i} cx={cx} cy={cy} r={r} fill="none"
                  stroke={s.color}
                  strokeWidth={isHovered ? stroke + 4 : stroke}
                  strokeDasharray={`${s.dash} ${s.gap}`}
                  strokeDashoffset={-s.offset * circ}
                  transform={`rotate(-90 ${cx} ${cy})`}
                  strokeLinecap="round"
                  opacity={isActive ? 1 : 0.25}
                  style={{ transition: "opacity 0.3s ease, stroke-width 0.2s ease", cursor: "pointer" }}
                  onClick={() => handleSegmentClick(s.secteur)}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(-1)}
                  role="button"
                  aria-label={`${s.secteur} : ${s.total} candidats — cliquez pour filtrer`}
                  aria-pressed={activeSecteur === s.secteur}
                />
              );
            })}
            <text x={cx} y={cy - 6} textAnchor="middle" fill="#0a78b5"
              fontSize={24} fontWeight="800" fontFamily="Syne, sans-serif">{total}</text>
            <text x={cx} y={cy + 13} textAnchor="middle" fill="#93a4c3"
              fontSize={10} fontFamily="DM Sans, sans-serif">candidats</text>
          </svg>
          {hoveredIdx >= 0 && (
            <div className="donut-tooltip">
              <span className="donut-tooltip-swatch" style={{ background: segs[hoveredIdx].color }} />
              <span className="donut-tooltip-label">{segs[hoveredIdx].secteur}</span>
              <span className="donut-tooltip-val">{segs[hoveredIdx].total}</span>
            </div>
          )}
        </div>

        <div className="donut-legend">
          <div className="donut-legend-col">
            {col1.map((d, i) => (
              <button
                key={i}
                className={`donut-legend-item${activeSecteur === d.secteur ? " donut-legend-item--active" : ""}`}
                onClick={() => handleSegmentClick(d.secteur)}
                aria-pressed={activeSecteur === d.secteur}
              >
                <div className="donut-swatch" style={{ background: d.color }} />
                <span>{d.secteur}</span>
                <span className="donut-legend-count">{d.total}</span>
              </button>
            ))}
          </div>
          <div className="donut-legend-col">
            {col2.map((d, i) => (
              <button
                key={i}
                className={`donut-legend-item${activeSecteur === d.secteur ? " donut-legend-item--active" : ""}`}
                onClick={() => handleSegmentClick(d.secteur)}
                aria-pressed={activeSecteur === d.secteur}
              >
                <div className="donut-swatch" style={{ background: d.color }} />
                <span>{d.secteur}</span>
                <span className="donut-legend-count">{d.total}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────
function StatCard({ iconClass, label, value, delta, iconColor, iconBg, delay }) {
  const [count, setCount] = useState(0);
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (prefersReducedMotion.current) {
      setCount(value);
      return;
    }
    let start = null;
    const duration = 800;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div className="stat-card" style={{ animationDelay: delay }}>
      <h5 className="stat-label">{label}</h5>
      <div className="stat-row">
        <div className="stat-icon-wrap" style={{ background: iconBg }} aria-hidden="true">
          <i className={`bi ${iconClass}`} style={{ color: iconColor, fontSize: 20, lineHeight: 0 }} />
        </div>
        <div className="stat-value" aria-live="polite" aria-atomic="true">{count}</div>
      </div>
      {delta !== undefined && <DeltaBadge delta={delta} />}
      <StatProgress value={count} max={30} color={iconColor} />
    </div>
  );
}

// ── Skeleton Loader ───────────────────────────────────────
function StatCardSkeleton({ delay }) {
  return (
    <div className="stat-card stat-card--skeleton" style={{ animationDelay: delay }}>
      <div className="skeleton skeleton--text" style={{ width: "70%", height: 12, marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }} />
        <div className="skeleton skeleton--text" style={{ width: 48, height: 28 }} />
      </div>
      <div className="skeleton skeleton--text" style={{ width: 90, height: 10, marginTop: 10 }} />
    </div>
  );
}

// ── App ───────────────────────────────────────────────────
export default function App() {
  useBootstrapIcons();

  // Correction : initialiser à 0, lire dans useEffect (safe SSR)
  const [width, setWidth] = useState(0);
  useEffect(() => {
    setWidth(window.innerWidth);
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const isMobile = width > 0 && width <= 600;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSecteurFilter, setActiveSecteurFilter] = useState(null);

  // Simuler un chargement asynchrone (à remplacer par fetch API)
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (width > 0) setSidebarOpen(width > 768);
  }, [width]);

  const statsArray = Object.entries(MOCK_STATS);

  return (
    <div className="app">
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        isMobile={isMobile}
      />

      <div className="layout">
        <Navbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className={`main-content ${sidebarOpen ? "main-content--shifted" : ""}`}>

          <div className="page-title">
            <h1>Zenselekt 3.0</h1>
            <p className="page-sub">Bienvenue Solibra</p>
          </div>

          {/* ── Stat Cards ── */}
          <div className="stats-grid">
            {isLoading
              ? statsArray.map(([key], i) => (
                  <StatCardSkeleton key={key} delay={`${i * 60}ms`} />
                ))
              : statsArray.map(([key, stat]) => (
                  <StatCard
                    key={key}
                    iconClass={stat.icon}
                    label={stat.label}
                    value={stat.value}
                    delta={stat.delta}
                    iconColor={stat.iconColor}
                    iconBg={stat.iconBg}
                    delay={stat.delay}
                  />
                ))
            }
            {!isLoading && (
              <ConversionCard
                recrutes={MOCK_STATS.recrutes.value}
                candidats={MOCK_STATS.candidats.value}
                delay="240ms"
              />
            )}
          </div>

          {/* ── Line Chart ── */}
          <div className="chart-card">
            <h5 className="chart-title">Nombre de candidats inscrits par niveau d'étude</h5>
            {isLoading
              ? <div className="chart-skeleton"><div className="skeleton" style={{ width: "100%", height: 280, borderRadius: 8 }} /></div>
              : <LineChart data={MOCK_NIVEAUX} />
            }
          </div>

          {/* ── Donut Chart ── */}
          <div className="chart-card" style={{ marginTop: 20 }}>
            <h5 className="chart-title">
              Nombre de candidats inscrits par secteur d'activité
              {activeSecteurFilter && (
                <span className="chart-title-filter"> — {activeSecteurFilter}</span>
              )}
            </h5>
            {isLoading
              ? <div className="chart-skeleton"><div className="skeleton" style={{ width: 184, height: 184, borderRadius: "50%", margin: "0 auto" }} /></div>
              : <DonutChart data={MOCK_SECTEURS} onFilter={setActiveSecteurFilter} />
            }
          </div>

        </main>
      </div>

      <footer className={`app-footer ${sidebarOpen ? "app-footer--shifted" : ""}`}>
        © 2025 Zenselekt · Propulsé par <strong>Empower talents &amp; careers</strong>. Tous droits réservés
      </footer>
    </div>
  );
}
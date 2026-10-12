import { useState } from "react";

const orbitPath =
  "M 545 180 A 205 116 0 1 1 135 180 A 205 116 0 1 1 545 180";

function formatReading(value, suffix) {
  return Number.isFinite(value) ? `${value.toFixed(1)}${suffix}` : "—";
}

export default function OrbitSimulation({ anomalies }) {
  const [selectedId, setSelectedId] = useState(null);
  const orbitEvents = anomalies.slice(0, 6);
  const selected =
    orbitEvents.find((anomaly) => anomaly.id === selectedId) ??
    orbitEvents[0] ??
    null;

  return (
    <section className="panel orbit-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">ORBITAL VIEW / ILLUSTRATIVE</p>
          <h2>Satellite position</h2>
        </div>
        <span className="panel-index">01</span>
      </div>

      <div className="orbit-legend">
        <span><i className="legend-dot satellite-dot" /> SATELLITE</span>
        <span><i className="legend-dot anomaly-dot" /> ANOMALY EVENT</span>
      </div>

      <div className="orbit-stage">
        <svg
          className="orbit-svg"
          viewBox="0 0 680 360"
          role="group"
          aria-label="Illustrative 2D orbit around Earth with recent anomaly markers"
        >
          <defs>
            <radialGradient id="earth-fill" cx="35%" cy="30%">
              <stop offset="0%" stopColor="#5bd4df" />
              <stop offset="62%" stopColor="#247ca7" />
              <stop offset="100%" stopColor="#153b71" />
            </radialGradient>
            <linearGradient id="orbit-stroke" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#39d5cf" stopOpacity=".58" />
              <stop offset="100%" stopColor="#8d7cff" stopOpacity=".28" />
            </linearGradient>
            <clipPath id="earth-clip">
              <circle cx="340" cy="180" r="69" />
            </clipPath>
          </defs>

          <circle className="orbit-glow" cx="340" cy="180" r="142" />
          <ellipse
            className="orbit-path"
            cx="340"
            cy="180"
            rx="205"
            ry="116"
          />
          <ellipse
            className="orbit-path orbit-path-inner"
            cx="340"
            cy="180"
            rx="231"
            ry="135"
            transform="rotate(-10 340 180)"
          />

          <g className="earth">
            <circle cx="340" cy="180" r="69" fill="url(#earth-fill)" />
            <g clipPath="url(#earth-clip)" fill="#75d6c0" opacity=".62">
              <path d="M279 135l22-12 15 8-4 15-17 4-6 14-17-6-7-11z" />
              <path d="M322 119l13 8 17-3 12 13-8 10-16-3-8 12-15-7-2-14-12-7z" />
              <path d="M365 168l16-8 14 8 6 17-12 8-3 18-14 9-12-13 7-18-11-9z" />
              <path d="M304 193l15-7 16 8 6 16-9 14-19-5-10-12z" />
              <path d="M390 129l15 7 5 15-10 7-12-9z" />
              <path d="M267 188l18-4 8 13-11 13-15-7z" />
            </g>
            <circle className="earth-atmosphere" cx="340" cy="180" r="76" />
            <path className="earth-equator" d="M274 180h132" />
          </g>

          {orbitEvents.map((anomaly, index) => {
            const angle =
              -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(orbitEvents.length, 1);
            const x = 340 + 205 * Math.cos(angle);
            const y = 180 + 116 * Math.sin(angle);
            const isSelected = selected?.id === anomaly.id;

            return (
              <g
                key={anomaly.id}
                className={`orbit-event${isSelected ? " is-selected" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`Select ${anomaly.anomaly_type || "unknown"} anomaly`}
                aria-pressed={isSelected}
                onClick={() => setSelectedId(anomaly.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedId(anomaly.id);
                  }
                }}
              >
                <circle className="event-hit-area" cx={x} cy={y} r="15" />
                <circle className="event-ring" cx={x} cy={y} r="7" />
                <circle className="event-core" cx={x} cy={y} r="3" />
                <title>{anomaly.anomaly_type || "Unknown anomaly"}</title>
              </g>
            );
          })}

          <g className="orbiting-satellite">
            <animateMotion
              dur="24s"
              repeatCount="indefinite"
              rotate="auto"
              path={orbitPath}
            />
            <g transform="translate(-17 -12)">
              <path className="satellite-panel" d="M1 5h9v14H1zM24 5h9v14h-9z" />
              <path className="satellite-body" d="M11 3h12v18H11z" />
              <path className="satellite-detail" d="M14 6h6v5h-6zM16 21v5m-4 0h8" />
            </g>
          </g>
        </svg>
        <span className="orbit-label orbit-label-1">LEO · SIMULATED</span>
        <span className="orbit-label orbit-label-2">EARTH</span>
      </div>

      <div className="orbit-event-detail" aria-live="polite">
        {selected ? (
          <>
            <span className="event-status-dot" />
            <div className="event-detail-main">
              <span className="detail-label">SELECTED EVENT</span>
              <strong>{selected.anomaly_type || "Unknown anomaly"}</strong>
              <span className="event-time">
                {new Date(selected.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="event-reading">
              <span className="detail-label">TEMP</span>
              <strong>{formatReading(selected.temperature_c, "°")}</strong>
            </div>
            <div className="event-reading">
              <span className="detail-label">BATTERY</span>
              <strong>{formatReading(selected.battery_pct, "%")}</strong>
            </div>
          </>
        ) : (
          <div className="no-event">
            <span className="detail-label">NO ANOMALIES DETECTED</span>
            <span>Recent flagged events will appear along the orbit.</span>
          </div>
        )}
      </div>
      <p className="simulation-note">
        Illustrative 2D simulation · marker positions are not measured spacecraft coordinates
      </p>
    </section>
  );
}

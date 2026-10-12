import { useEffect, useState } from "react";
import { getTelemetry, getAnomalies, getStats } from "./api/telemetry";
import StatsCards from "./components/StatsCards";
import TelemetryLineChart from "./components/TelemetryLineChart";
import AnomalyBarChart from "./components/AnomalyBarChart";
import AnomalyTable from "./components/AnomalyTable";
import OrbitSimulation from "./components/OrbitSimulation";
import "./App.css";

function App() {
  const [telemetry, setTelemetry] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    Promise.all([getTelemetry(), getAnomalies(), getStats()])
      .then(([readings, flagged, summary]) => {
        if (!isCurrent) return;
        setTelemetry(readings);
        setAnomalies(flagged);
        setStats(summary);
        setError(null);
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Perigee dashboard home">
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          <span>PERIGEE</span>
        </a>
        <div className="topbar-meta">
          <span className={`connection-indicator${!isLoading && !error ? " is-connected" : ""}`}>
            <span className="connection-dot" />
            {isLoading ? "CONNECTING" : error ? "FEED UNAVAILABLE" : "FEED CONNECTED"}
          </span>
          <span className="topbar-divider" />
          <span className="topbar-label">MISSION CONTROL</span>
        </div>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">SPACECRAFT MONITORING / OVERVIEW</p>
          <h1>Satellite health</h1>
          <p className="page-subtitle">
            A clear view of telemetry, orbital context, and detected anomalies.
          </p>
        </div>
        <div className="heading-tag">
          <span className="heading-tag-icon" aria-hidden="true">✳</span>
          PERIGEE-01
        </div>
      </section>

      {error ? (
        <section className="dashboard-message error-panel" role="alert">
          <div className="message-icon" aria-hidden="true">!</div>
          <div>
            <h2>Could not load the telemetry feed</h2>
            <p>{error}</p>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setIsLoading(true);
              setError(null);
              setRefreshKey((key) => key + 1);
            }}
          >
            Try again
          </button>
        </section>
      ) : isLoading ? (
        <section className="dashboard-message loading-panel" aria-live="polite">
          <span className="loading-orbit" aria-hidden="true" />
          <div>
            <h2>Connecting to telemetry</h2>
            <p>Retrieving the latest spacecraft readings…</p>
          </div>
        </section>
      ) : (
        <>
          <StatsCards stats={stats} />

          <section className="primary-grid" aria-label="Orbit and telemetry">
            <OrbitSimulation anomalies={anomalies} />
            <TelemetryLineChart data={telemetry} />
          </section>

          <section className="secondary-grid" aria-label="Anomaly overview">
            <AnomalyBarChart anomalies={anomalies} />
            <aside className="insight-card">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">AT A GLANCE</p>
                  <h2>Signal summary</h2>
                </div>
                <span className="panel-index">02</span>
              </div>
              <p className="insight-copy">
                Perigee monitors incoming spacecraft readings and flags unusual
                patterns for review.
              </p>
              <div className="insight-rule" />
              <div className="insight-row">
                <span className="insight-bullet" />
                <span>Detection model</span>
                <strong>Isolation Forest</strong>
              </div>
              <div className="insight-row">
                <span className="insight-bullet muted" />
                <span>Tracked signals</span>
                <strong>7 channels</strong>
              </div>
              <div className="insight-footnote">
                Orbit illustration is simulated; no position telemetry is available.
              </div>
            </aside>
          </section>

          <AnomalyTable anomalies={anomalies} />
          <footer className="dashboard-footer">
            <span>PERIGEE TELEMETRY CONSOLE</span>
            <span>MONITORING SIMULATED SPACECRAFT DATA</span>
          </footer>
        </>
      )}
    </main>
  );
}

export default App;

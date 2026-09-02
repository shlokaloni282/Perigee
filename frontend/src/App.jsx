import { useEffect, useState } from "react";
import { getTelemetry, getAnomalies, getStats } from "./api/telemetry";
import StatsCards from "./components/StatsCards";
import TelemetryLineChart from "./components/TelemetryLineChart";
import AnomalyBarChart from "./components/AnomalyBarChart";
import AnomalyTable from "./components/AnomalyTable";

function App() {
  const [telemetry, setTelemetry] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getTelemetry(), getAnomalies(), getStats()])
      .then(([t, a, s]) => {
        setTelemetry(t);
        setAnomalies(a);
        setStats(s);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error)
    return <div style={{ color: "red", padding: "2rem" }}>Error: {error}</div>;

  return (
    <div
      style={{
        background: "#0f0f1a",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ color: "#fff" }}>SatGuard — Satellite Health Dashboard</h1>
      <StatsCards stats={stats} />
      <TelemetryLineChart data={telemetry} />
      <AnomalyBarChart anomalies={anomalies} />
      <AnomalyTable anomalies={anomalies} />
    </div>
  );
}

export default App;

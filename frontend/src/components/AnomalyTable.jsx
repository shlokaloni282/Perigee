export default function AnomalyTable({ anomalies }) {
  const recent = anomalies.slice(0, 10);
  return (
    <div
      style={{
        background: "#1e1e2e",
        padding: "1rem",
        borderRadius: "8px",
        color: "#fff",
      }}
    >
      <h3>Recent Anomalies</h3>
      <table style={{ width: "100%", fontSize: "0.85rem" }}>
        <thead>
          <tr style={{ textAlign: "left", opacity: 0.7 }}>
            <th>Timestamp</th>
            <th>Type</th>
            <th>Temp (°C)</th>
            <th>Battery (%)</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.timestamp).toLocaleString()}</td>
              <td>{a.anomaly_type || "—"}</td>
              <td>{a.temperature_c?.toFixed(1)}</td>
              <td>{a.battery_pct?.toFixed(1)}</td>
              <td>{a.anomaly_score?.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

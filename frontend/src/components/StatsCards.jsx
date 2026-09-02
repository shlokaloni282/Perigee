export default function StatsCards({ stats }) {
  if (!stats) return null;
  const cards = [
    { label: "Total Readings", value: stats.total_readings },
    { label: "Anomalies Detected", value: stats.anomaly_count },
    {
      label: "Anomaly Rate",
      value: `${(stats.anomaly_rate * 100).toFixed(2)}%`,
    },
  ];
  return (
    <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            flex: 1,
            padding: "1rem",
            background: "#1e1e2e",
            borderRadius: "8px",
            color: "#fff",
          }}
        >
          <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>{c.label}</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}

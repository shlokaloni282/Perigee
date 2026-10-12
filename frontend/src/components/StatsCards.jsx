const metrics = [
  { label: "Telemetry readings", key: "total_readings", note: "ALL RECORDED" },
  { label: "Anomalies detected", key: "anomaly_count", note: "NEEDS REVIEW" },
];

export default function StatsCards({ stats }) {
  if (!stats) return null;

  const cards = [
    ...metrics.map((metric, index) => ({
      ...metric,
      value: stats[metric.key]?.toLocaleString() ?? "—",
      index: `0${index + 1}`,
    })),
    {
      label: "Anomaly rate",
      value:
        Number.isFinite(stats.anomaly_rate)
          ? `${(stats.anomaly_rate * 100).toFixed(2)}%`
          : "—",
      note: "OF TOTAL READINGS",
      index: "03",
    },
  ];

  return (
    <section className="stats-grid" aria-label="Telemetry summary">
      {cards.map((card, index) => (
        <article className={`stat-card stat-card-${index + 1}`} key={card.label}>
          <div className="stat-card-top">
            <span className="stat-card-label">{card.label}</span>
            <span className="stat-card-index">{card.index}</span>
          </div>
          <strong className="stat-card-value">{card.value}</strong>
          <span className="stat-card-note">{card.note}</span>
        </article>
      ))}
    </section>
  );
}

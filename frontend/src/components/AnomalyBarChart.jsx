import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AnomalyBarChart({ anomalies }) {
  const counts = {};
  anomalies.forEach((a) => {
    const type = a.anomaly_type || "unknown";
    counts[type] = (counts[type] || 0) + 1;
  });
  const chartData = Object.entries(counts).map(([type, count]) => ({
    type,
    count,
  }));

  return (
    <div
      style={{
        background: "#1e1e2e",
        padding: "1rem",
        borderRadius: "8px",
        marginBottom: "2rem",
      }}
    >
      <h3 style={{ color: "#fff" }}>Anomalies by Type</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="type" stroke="#aaa" />
          <YAxis stroke="#aaa" allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#f472b6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

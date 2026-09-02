import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function TelemetryLineChart({ data }) {
  const chartData = data.map((d) => ({
    timestamp: new Date(d.timestamp).toLocaleString(),
    temperature: d.temperature_c,
    battery: d.battery_pct,
    power: d.power_draw_w,
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
      <h3 style={{ color: "#fff" }}>Telemetry Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="timestamp" hide />
          <YAxis stroke="#aaa" />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#f87171"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="battery"
            stroke="#60a5fa"
            dot={false}
          />
          <Line type="monotone" dataKey="power" stroke="#34d399" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

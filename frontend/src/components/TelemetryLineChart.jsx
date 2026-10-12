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
  const chartData = data.map((reading) => ({
    timestamp: new Date(reading.timestamp).toLocaleString(),
    temperature: reading.temperature_c,
    battery: reading.battery_pct,
    power: reading.power_draw_w,
  }));

  return (
    <section className="panel telemetry-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">LIVE SIGNALS / ALL CHANNELS</p>
          <h2>Telemetry trends</h2>
        </div>
        <span className="chart-period">RECENT READINGS</span>
      </div>
      <div className="chart-wrap">
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 8, left: -18, bottom: 2 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="#24313e" vertical={false} />
              <XAxis dataKey="timestamp" hide />
              <YAxis
                stroke="#718096"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#8292a3", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#111b25",
                  border: "1px solid #314252",
                  borderRadius: "8px",
                  color: "#e8f0f5",
                }}
                labelStyle={{ color: "#8ea0b0", marginBottom: 5 }}
                formatter={(value) =>
                  Number.isFinite(Number(value)) ? Number(value).toFixed(1) : value
                }
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={7}
                wrapperStyle={{ color: "#aab8c5", fontSize: 11, paddingTop: 8 }}
                formatter={(value) => value.toUpperCase()}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                name="Temperature"
                stroke="#ff8b78"
                strokeWidth={1.8}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="battery"
                name="Battery"
                stroke="#63aef5"
                strokeWidth={1.8}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="power"
                name="Power"
                stroke="#43d6b0"
                strokeWidth={1.8}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">No telemetry readings to chart yet.</div>
        )}
      </div>
      <p className="chart-caption">
        Temperature, battery, and power values · most recent data first
      </p>
    </section>
  );
}

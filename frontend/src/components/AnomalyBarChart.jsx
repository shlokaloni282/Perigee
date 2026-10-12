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
  const counts = anomalies.reduce((result, anomaly) => {
    const type = anomaly.anomaly_type || "unknown";
    result[type] = (result[type] || 0) + 1;
    return result;
  }, {});
  const chartData = Object.entries(counts).map(([type, count]) => ({
    type,
    count,
  }));

  return (
    <section className="panel anomaly-chart-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">DETECTION / CATEGORY BREAKDOWN</p>
          <h2>Anomalies by type</h2>
        </div>
        <span className="chart-period">{anomalies.length} FLAGGED</span>
      </div>
      <div className="bar-chart-wrap">
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="#24313e" vertical={false} />
              <XAxis
                dataKey="type"
                stroke="#718096"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#9aabba", fontSize: 10 }}
                interval={0}
              />
              <YAxis
                stroke="#718096"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#8292a3", fontSize: 10 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#111b25",
                  border: "1px solid #314252",
                  borderRadius: "8px",
                  color: "#e8f0f5",
                }}
              />
              <Bar dataKey="count" name="Events" fill="#ffad66" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">No anomaly events detected.</div>
        )}
      </div>
    </section>
  );
}

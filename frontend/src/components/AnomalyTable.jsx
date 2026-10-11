import { Fragment, useState } from "react";
import { explainAnomaly } from "../api/telemetry";

function getSourceUrl(link) {
  try {
    const url = new URL(link);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export default function AnomalyTable({ anomalies }) {
  const recent = anomalies.slice(0, 10);
  const [expandedId, setExpandedId] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleExplain(anomaly) {
    if (expandedId === anomaly.id) {
      setExpandedId(null);
      setExplanation(null);
      setError(null);
      return;
    }

    setExpandedId(anomaly.id);
    setExplanation(null);
    setError(null);
    setLoading(true);

    try {
      setExplanation(await explainAnomaly(anomaly.id));
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          requestError.message ||
          "Unable to load the anomaly explanation.",
      );
    } finally {
      setLoading(false);
    }
  }

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
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((a) => (
            <Fragment key={a.id}>
              <tr>
                <td>{new Date(a.timestamp).toLocaleString()}</td>
                <td>{a.anomaly_type || "—"}</td>
                <td>{a.temperature_c?.toFixed(1)}</td>
                <td>{a.battery_pct?.toFixed(1)}</td>
                <td>{a.anomaly_score?.toFixed(3)}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleExplain(a)}
                    disabled={loading}
                    aria-expanded={expandedId === a.id}
                  >
                    {expandedId === a.id ? "Hide" : "Explain"}
                  </button>
                </td>
              </tr>
              {expandedId === a.id && (
                <tr>
                  <td colSpan="6">
                    <div
                      style={{
                        padding: "0.75rem",
                        background: "#29293b",
                        borderRadius: "6px",
                        textAlign: "left",
                      }}
                    >
                      {loading && <p>Loading explanation…</p>}
                      {error && (
                        <p role="alert" style={{ color: "#ff9b9b" }}>
                          Explanation failed: {error}
                        </p>
                      )}
                      {explanation && (
                        <>
                          <h4>Anomaly Explanation</h4>
                          <p>{explanation.summary || "No summary provided."}</p>

                          {explanation.causes?.length > 0 && (
                            <>
                              <h4>Possible causes</h4>
                              <ul>
                                {explanation.causes.map((cause, index) => (
                                  <li key={`${cause.cause}-${index}`}>
                                    {cause.cause}{" "}
                                    <span>
                                      (confidence: {cause.confidence || "unknown"}
                                      {cause.evidence?.length > 0 &&
                                        `; sources: ${cause.evidence
                                          .map((source) => `[${source}]`)
                                          .join(", ")}`}
                                      )
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}

                          {explanation.conflicts?.length > 0 && (
                            <>
                              <h4>Conflicting information</h4>
                              <ul>
                                {explanation.conflicts.map((conflict, index) => (
                                  <li key={`${conflict.topic}-${index}`}>
                                    <strong>{conflict.topic}</strong>
                                    <ul>
                                      {conflict.claims?.map((claim, claimIndex) => (
                                        <li key={`${claim.source}-${claimIndex}`}>
                                          [{claim.source}] {claim.claim}
                                        </li>
                                      ))}
                                    </ul>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}

                          {explanation.followup_used && (
                            <p>
                              Follow-up search: {explanation.followup_query}
                            </p>
                          )}

                          {explanation.sources?.length > 0 && (
                            <>
                              <h4>Sources</h4>
                              <ol>
                                {explanation.sources.map((source, index) => {
                                  const href = getSourceUrl(source.link);
                                  return (
                                    <li key={source.link || `${source.title}-${index}`}>
                                      {href ? (
                                        <a
                                          href={href}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{ color: "#a9c7ff" }}
                                        >
                                          {source.title}
                                        </a>
                                      ) : (
                                        source.title
                                      )}{" "}
                                      ({source.source_type})
                                    </li>
                                  );
                                })}
                              </ol>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

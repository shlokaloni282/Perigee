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
    <section className="panel anomaly-table-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">REVIEW QUEUE / LATEST EVENTS</p>
          <h2>Recent anomalies</h2>
        </div>
        <span className="chart-period">SHOWING {recent.length} OF {anomalies.length}</span>
      </div>
      <div className="table-scroll">
      <table className="anomaly-table">
        <thead>
          <tr style={{ textAlign: "left", opacity: 0.7 }}>
            <th scope="col">Timestamp</th>
            <th scope="col">Type</th>
            <th scope="col">Temp (°C)</th>
            <th scope="col">Battery (%)</th>
            <th scope="col">Score</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {recent.length === 0 && (
            <tr>
              <td className="empty-table" colSpan="6">No anomalies to review.</td>
            </tr>
          )}
          {recent.map((a) => (
            <Fragment key={a.id}>
              <tr>
                <td className="timestamp-cell">{new Date(a.timestamp).toLocaleString()}</td>
                <td><span className="anomaly-type">{a.anomaly_type || "unknown"}</span></td>
                <td>{a.temperature_c?.toFixed(1) ?? "—"}</td>
                <td>{a.battery_pct?.toFixed(1) ?? "—"}</td>
                <td className="score-cell">{a.anomaly_score?.toFixed(3) ?? "—"}</td>
                <td>
                  <button
                    className="explain-button"
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
                    <div className="explanation-panel">
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

                        {/* Provenance: how much SerpApi work produced this briefing. */}
                        <div className="provenance-summary">
                          {explanation.stats && (
                            <span>
                              {explanation.stats.live_searches} new SerpApi
                              searches ({explanation.stats.searches} queries) ·{" "}
                              {explanation.stats.sources_retrieved} results
                              retrieved · {explanation.stats.sources_kept} kept
                              after filtering ·{" "}
                            </span>
                          )}
                          {explanation.source_mix && (
                            <span>
                              {explanation.source_mix.official} official /{" "}
                              {explanation.source_mix.research} research /{" "}
                              {explanation.source_mix["news/other"]} news-other ·{" "}
                            </span>
                          )}
                          Follow-up search:{" "}
                          {explanation.followup_used
                            ? `yes — ${explanation.followup_query}`
                            : "not needed"}
                        </div>

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
                                          className="source-link"
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
    </section>
  );
}

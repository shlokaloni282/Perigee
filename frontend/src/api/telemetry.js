import axios from "axios";

const API_BASE = "http://127.0.0.1:8000/api";

export const getTelemetry = () =>
  axios.get(`${API_BASE}/telemetry/`).then((res) => res.data);
export const getAnomalies = () =>
  axios.get(`${API_BASE}/telemetry/anomalies/`).then((res) => res.data);
export const getStats = () =>
  axios.get(`${API_BASE}/telemetry/stats/`).then((res) => res.data);

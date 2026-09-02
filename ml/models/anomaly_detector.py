import pandas as pd  # type: ignore[import]
from sklearn.ensemble import IsolationForest  # type: ignore[import]
from sklearn.preprocessing import StandardScaler  # type: ignore[import]
from sklearn.metrics import classification_report  # type: ignore[import]
try:
    import joblib  # type: ignore[import]
except Exception:  # pragma: no cover - fallback for older sklearn bundles
    # Older scikit-learn bundled joblib under sklearn.externals
    from sklearn.externals import joblib  # type: ignore[import]

FEATURE_COLS = [
    "temperature_c", "battery_pct", "power_draw_w",
    "orientation_pitch", "orientation_roll", "orientation_yaw",
    "comms_signal_pct",
]

class TelemetryAnomalyDetector:
    def __init__(self, contamination=0.03):
        self.scaler = StandardScaler()
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=200,
            random_state=42,
        )
        self.is_fitted = False

    def fit(self, df: pd.DataFrame):
        X = self.scaler.fit_transform(df[FEATURE_COLS])
        self.model.fit(X)
        self.is_fitted = True
        return self

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        """Returns df with anomaly_score and predicted_anomaly columns.
        predicted_anomaly: 1 = anomaly, 0 = normal (mapped from sklearn's -1/1)
        """
        if not self.is_fitted:
            raise RuntimeError("Model not fitted yet")

        X = self.scaler.transform(df[FEATURE_COLS])
        raw_pred = self.model.predict(X)          # -1 = anomaly, 1 = normal
        scores = self.model.decision_function(X)  # lower = more anomalous

        result = df.copy()
        result["anomaly_score"] = scores
        result["predicted_anomaly"] = (raw_pred == -1).astype(int)
        return result

    def save(self, path="models/isolation_forest.joblib"):
        joblib.dump({"model": self.model, "scaler": self.scaler}, path)

    @classmethod
    def load(cls, path="models/isolation_forest.joblib"):
        obj = cls()
        saved = joblib.load(path)
        obj.model = saved["model"]
        obj.scaler = saved["scaler"]
        obj.is_fitted = True
        return obj


if __name__ == "__main__":
    df = pd.read_csv("data/telemetry.csv")

    detector = TelemetryAnomalyDetector(contamination=0.03)
    detector.fit(df)
    results = detector.predict(df)

    # Quick eval against injected ground truth
    print(classification_report(df["is_anomaly"], results["predicted_anomaly"]))

    detector.save()
    print("Model saved to models/isolation_forest.joblib")
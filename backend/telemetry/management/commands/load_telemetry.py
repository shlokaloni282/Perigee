import os
import joblib  # type: ignore[import-not-found]
import pandas as pd  # type: ignore[import-not-found]
from django.conf import settings
from django.core.management.base import BaseCommand
from telemetry.models import TelemetryReading

CSV_PATH = os.path.join(settings.BASE_DIR, "..", "ml", "data", "telemetry.csv")
MODEL_PATH = os.path.join(settings.BASE_DIR, "..", "ml", "models", "isolation_forest.joblib")

FEATURE_COLS = [
    "temperature_c", "battery_pct", "power_draw_w",
    "orientation_pitch", "orientation_roll", "orientation_yaw",
    "comms_signal_pct",
]

class Command(BaseCommand):
    help = "Load telemetry.csv into the database and run anomaly detection on it"

    def handle(self, *args, **kwargs):
        df = pd.read_csv(CSV_PATH)
        saved = joblib.load(MODEL_PATH)
        model = saved["model"]
        scaler = saved["scaler"]

        X_scaled = scaler.transform(df[FEATURE_COLS])
        predictions = model.predict(X_scaled)
        scores = model.decision_function(X_scaled)

        objs = []
        for i, row in df.iterrows():
            objs.append(TelemetryReading(
                timestamp=row["timestamp"],
                temperature_c=row["temperature_c"],
                battery_pct=row["battery_pct"],
                power_draw_w=row["power_draw_w"],
                orientation_pitch=row["orientation_pitch"],
                orientation_roll=row["orientation_roll"],
                orientation_yaw=row["orientation_yaw"],
                comms_signal_pct=row["comms_signal_pct"],
                is_anomaly=bool(row["is_anomaly"]),
                anomaly_type=row["anomaly_type"] if pd.notna(row["anomaly_type"]) else None,
                predicted_anomaly=(predictions[i] == -1),
                anomaly_score=scores[i],
            ))

        TelemetryReading.objects.bulk_create(objs)
        self.stdout.write(self.style.SUCCESS(f"Loaded {len(objs)} telemetry readings."))
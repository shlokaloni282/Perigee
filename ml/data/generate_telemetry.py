try:
    import numpy as np  # type: ignore
except ImportError as exc:
    raise ImportError("numpy is required to run generate_telemetry.py. Install it with pip install numpy.") from exc
import pandas as pd  # type: ignore
from datetime import datetime, timedelta


np.random.seed(42)

def generate_telemetry(
    n_hours=720,
    anomaly_rate=0.03,
    start_time=None
):
  if start_time is None:
    start_time = datetime(2026, 7, 1)

  timestamps = [start_time + timedelta(hours=i) for i in range(n_hours)]

  # Generate normal telemetry data with realistic daily/orbital cycles
  t = np.arange(n_hours)
  orbital_cycle = np.sin(2 * np.pi * t / 24)  # Daily cycle

  temperature = 20 + 8 * orbital_cycle + np.random.normal(0, 1.0, n_hours)  # Temperature in Celsius
  battery = 85 + 5 * orbital_cycle + np.random.normal(0, 5, n_hours)  # Battery percentage
  battery = np.clip(battery, 0, 100)
  power_draw = 150 + 20 * np.abs(orbital_cycle) + np.random.normal(0, 5, n_hours)   # Watts
  orientation_pitch = np.random.normal(0, 0.5, n_hours)   # degrees deviation
  orientation_roll = np.random.normal(0, 0.5, n_hours)
  orientation_yaw = np.random.normal(0, 0.5, n_hours)
  comms_signal = 90 + np.random.normal(0, 3, n_hours)     # signal strength %
  comms_signal = np.clip(comms_signal, 0, 100)

  df = pd.DataFrame({
    "timestamp": timestamps,
    "temperature_c": temperature,
    "battery_pct": battery,
    "power_draw_w": power_draw,
    "orientation_pitch": orientation_pitch,
    "orientation_roll": orientation_roll,
    "orientation_yaw": orientation_yaw,
    "comms_signal_pct": comms_signal,
    "is_anomaly": 0,
  })

  # --- Inject anomalies ---
  n_anomalies = int(n_hours * anomaly_rate)
  anomaly_indices = np.random.choice(n_hours, n_anomalies, replace=False)

  for idx in anomaly_indices:
    anomaly_type = np.random.choice(
      ["temp_spike", "battery_drop", "power_surge", "comms_dropout", "orientation_drift"]
    )
    if anomaly_type == "temp_spike":
      df.loc[idx, "temperature_c"] += np.random.choice([1, -1]) * np.random.uniform(15, 25)
    elif anomaly_type == "battery_drop":
      df.loc[idx, "battery_pct"] -= np.random.uniform(20, 40)
    elif anomaly_type == "power_surge":
      df.loc[idx, "power_draw_w"] += np.random.uniform(80, 150)
    elif anomaly_type == "comms_dropout":
      df.loc[idx, "comms_signal_pct"] -= np.random.uniform(50, 90)
    elif anomaly_type == "orientation_drift":
      axis = np.random.choice(["orientation_pitch", "orientation_roll", "orientation_yaw"])
      df.loc[idx, axis] += np.random.choice([1, -1]) * np.random.uniform(5, 15)

    df.loc[idx, "is_anomaly"] = 1
    df.loc[idx, "anomaly_type"] = anomaly_type

  df["battery_pct"] = df["battery_pct"].clip(0, 100)
  df["comms_signal_pct"] = df["comms_signal_pct"].clip(0, 100)

  return df

if __name__ == "__main__":
    df = generate_telemetry()
    df.to_csv("data/telemetry.csv", index=False)
    print(f"Generated {len(df)} readings, {df['is_anomaly'].sum()} anomalies")
    print(df.head())


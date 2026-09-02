# Perigee — Satellite Health & Anomaly Detection Platform

Perigee is a full-stack platform that monitors simulated satellite telemetry and flags anomalies in real time using machine learning. It combines a Python/scikit-learn anomaly detection model, a Django REST API, and a React dashboard to turn raw telemetry data into an actionable, visual health report.

<!--![Dashboard Screenshot](docs/dashboard-screenshot.png)-->
<!-- Replace with an actual screenshot of your dashboard before pushing -->

## Overview

Satellites continuously stream telemetry — temperature, battery level, power draw, orientation, and communication signal strength. SatGuard simulates this data, trains an **Isolation Forest** model to detect abnormal readings (temperature spikes, power surges, communication dropouts, orientation drift, and battery issues), and serves both the raw data and the model's predictions through a REST API to a live dashboard.

## Features

- **Anomaly detection** on 7 telemetry features using an Isolation Forest model with a fitted `StandardScaler`
- **REST API** built with Django REST Framework exposing telemetry data, filtered anomalies, and summary statistics
- **Interactive dashboard** built with React + Recharts, showing:
  - Live stats cards (total readings, anomaly count, anomaly rate)
  - Multi-metric telemetry trend line chart
  - Anomaly breakdown by type (bar chart)
  - A table of the most recent flagged anomalies
- Ground-truth anomaly labels included in the dataset for model evaluation

## Tech Stack

| Layer | Technology |
|---|---|
| ML / Data | Python, Pandas, scikit-learn (Isolation Forest), joblib |
| Backend | Django, Django REST Framework, SQLite |
| Frontend | React (Vite), Recharts, Axios |
| Tooling | Git, VS Code |

## Architecture

```
ml/
├── data/
│   ├── generate_telemetry.py   # synthetic telemetry data generator
│   └── telemetry.csv           # generated dataset (720 hourly readings)
├── models/
│   ├── anomaly_detector.py     # trains the Isolation Forest model
│   └── isolation_forest.joblib # saved {model, scaler} dict
└── notebooks/
    └── explore.ipynb           # exploratory data analysis

backend/
├── satguard_backend/           # Django project settings & root URLs
└── telemetry/
    ├── models.py                # TelemetryReading model
    ├── serializers.py           # DRF serializer
    ├── views.py                 # API views (list, anomalies, stats)
    ├── urls.py                  # app-level routes
    └── management/commands/
        └── load_telemetry.py    # loads CSV → DB, runs model predictions

frontend/
└── src/
    ├── api/telemetry.js         # Axios calls to the Django API
    ├── components/               # StatsCards, charts, anomaly table
    └── App.jsx                   # dashboard layout
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/telemetry/` | All telemetry readings |
| `GET /api/telemetry/anomalies/` | Only readings flagged as anomalies by the model |
| `GET /api/telemetry/stats/` | Summary stats: total readings, anomaly count, anomaly rate |

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1      # Windows PowerShell
pip install -r requirements.txt
python manage.py makemigrations telemetry
python manage.py migrate
python manage.py load_telemetry   # loads CSV data + runs anomaly detection
python manage.py runserver
```
Backend runs at `http://127.0.0.1:8000`.

### Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

> Make sure the backend is running before starting the frontend — the dashboard fetches live data from the Django API on load.

## Dataset

The telemetry dataset simulates 30 days of hourly satellite readings (720 rows) with the following columns:

`timestamp, temperature_c, battery_pct, power_draw_w, orientation_pitch, orientation_roll, orientation_yaw, comms_signal_pct, is_anomaly, anomaly_type`

`is_anomaly` and `anomaly_type` are ground-truth labels injected during data generation, useful for evaluating the Isolation Forest model's predictions against known anomalies (comms dropouts, battery drops, orientation drift, power surges, temperature spikes).

## Future Work

- LLM-generated plain-English explanations for flagged anomalies
- Time-series forecasting of upcoming telemetry values
- Real-time simulated data streaming via WebSockets
- Deployment (Render/Railway for backend, Vercel for frontend)


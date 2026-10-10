from django.urls import path

from .views import AnomalyListView, TelemetryListView, explain_anomaly, telemetry_stats

urlpatterns = [
    path("telemetry/", TelemetryListView.as_view(), name="telemetry-list"),
    path("telemetry/anomalies/", AnomalyListView.as_view(), name="telemetry-anomalies"),
    path("telemetry/stats/", telemetry_stats, name="telemetry-stats"),
    path("telemetry/anomalies/<int:pk>/explain/", explain_anomaly, name="explain-anomaly"),
]
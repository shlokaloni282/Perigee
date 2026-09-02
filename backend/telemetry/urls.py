from django.urls import path
from . import views

urlpatterns = [
    path("telemetry/", views.TelemetryListView.as_view(), name="telemetry-list"),
    path("telemetry/anomalies/", views.AnomalyListView.as_view(), name="telemetry-anomalies"),
    path("telemetry/stats/", views.telemetry_stats, name="telemetry-stats"),
]
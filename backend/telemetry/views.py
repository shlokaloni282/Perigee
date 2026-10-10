import sys
from pathlib import Path

from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import TelemetryReading
from .serializers import TelemetryReadingSerializer

# Make the project-root `agent/` package importable from Django
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))


class TelemetryListView(generics.ListAPIView):
    queryset = TelemetryReading.objects.all()
    serializer_class = TelemetryReadingSerializer


class AnomalyListView(generics.ListAPIView):
    queryset = TelemetryReading.objects.filter(is_anomaly=True)
    serializer_class = TelemetryReadingSerializer


@api_view(["GET"])
def telemetry_stats(request):
    total = TelemetryReading.objects.count()
    anomalies = TelemetryReading.objects.filter(is_anomaly=True).count()
    return Response({
        "total_readings": total,
        "anomaly_count": anomalies,
        "anomaly_rate": round(anomalies / total, 4) if total else 0,
    })


@api_view(["GET"])
def explain_anomaly(request, pk):
    """Run the search agent on one flagged anomaly and return its briefing."""
    try:
        reading = TelemetryReading.objects.get(pk=pk, is_anomaly=True)
    except TelemetryReading.DoesNotExist:
        return Response({"error": "Anomaly not found"}, status=404)

    anomaly = {
        "timestamp": str(reading.timestamp),
        "anomaly_type": reading.anomaly_type,
        "temperature_c": reading.temperature_c,
        "battery_pct": reading.battery_pct,
        "power_draw_w": reading.power_draw_w,
        "comms_signal_pct": reading.comms_signal_pct,
    }
    try:
        from agent.orchestrator import explain
        return Response(explain(anomaly))
    except Exception as e:
        return Response({"error": str(e)}, status=502)
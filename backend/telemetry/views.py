from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import TelemetryReading
from .serializers import TelemetryReadingSerializer

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
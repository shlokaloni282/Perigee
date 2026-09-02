import importlib.util

if importlib.util.find_spec("rest_framework") is not None:
    from rest_framework import serializers
else:
    class _FallbackSerializer:
        pass

    class serializers:
        ModelSerializer = _FallbackSerializer

from .models import TelemetryReading


class TelemetryReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = TelemetryReading
        fields = "__all__"
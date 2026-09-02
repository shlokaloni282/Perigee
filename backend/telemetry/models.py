from django.db import models

class TelemetryReading(models.Model):
    timestamp = models.DateTimeField()
    temperature_c = models.FloatField()
    battery_pct = models.FloatField()
    power_draw_w = models.FloatField()
    orientation_pitch = models.FloatField()
    orientation_roll = models.FloatField()
    orientation_yaw = models.FloatField()
    comms_signal_pct = models.FloatField()

    # ground truth from the dataset
    is_anomaly = models.BooleanField(default=False)
    anomaly_type = models.CharField(max_length=50, blank=True, null=True)

    # model's own prediction
    predicted_anomaly = models.BooleanField(default=False)
    anomaly_score = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.timestamp} - {'ANOMALY' if self.is_anomaly else 'normal'}"
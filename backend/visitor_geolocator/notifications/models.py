from django.db import models
from django.core.exceptions import ValidationError

from visitor_geolocator.core.models import WebsiteVisitorGeolocatorUser


class NotificationPreferences(models.Model):
    """Model to store user notification preferences"""

    class Meta:
        db_table = "website_visitor_geolocator_notification_preferences"

    website_visitor_geolocator_user = models.OneToOneField(
        WebsiteVisitorGeolocatorUser,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
    )

    # Notification chance (0-100)
    notification_chance = models.IntegerField(
        default=100, help_text="Chance of receiving notifications (0-100)"
    )

    # Notification types
    new_visitor_notifications = models.BooleanField(default=True)
    daily_summary_notifications = models.BooleanField(default=False)
    weekly_summary_notifications = models.BooleanField(default=False)

    # Notification timing
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)

    # Effects
    notification_vibration = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notification preferences for {self.website_visitor_geolocator_user.user.email}"

    def clean(self):
        """Validate notification chance"""
        if self.notification_chance < 0 or self.notification_chance > 100:
            raise ValidationError("Notification chance must be between 0 and 100")

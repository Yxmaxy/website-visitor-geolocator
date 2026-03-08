from django.db import models

from visitor_geolocator.core.models import WebsiteVisitorGeolocatorUser


class SummaryNotificationPreferences(models.Model):
    """WVG-specific summary notification preferences.

    Frequency and quiet hours preferences are managed by django-simple-notifications
    via simple_notifications.NotificationPreferences.
    """

    class Meta:
        db_table = "website_visitor_geolocator_summary_notification_preferences"

    website_visitor_geolocator_user = models.OneToOneField(
        WebsiteVisitorGeolocatorUser,
        on_delete=models.CASCADE,
        related_name="summary_notification_preferences",
    )

    new_visitor_notifications = models.BooleanField(default=True)
    daily_summary_notifications = models.BooleanField(default=False)
    weekly_summary_notifications = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Summary notification preferences for {self.website_visitor_geolocator_user.user.email}"

from rest_framework import serializers

from visitor_geolocator.notifications.models import SummaryNotificationPreferences


class SummaryNotificationPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for WVG summary notification preferences."""

    class Meta:
        model = SummaryNotificationPreferences
        fields = [
            "new_visitor_notifications",
            "daily_summary_notifications",
            "weekly_summary_notifications",
        ]

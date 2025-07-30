from rest_framework import serializers

from visitor_geolocator.notifications.models import NotificationPreferences


class NotificationPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for NotificationPreferences model"""

    class Meta:
        model = NotificationPreferences
        fields = [
            "id",
            "notification_chance",
            "new_visitor_notifications",
            "daily_summary_notifications",
            "weekly_summary_notifications",
            "quiet_hours_start",
            "quiet_hours_end",
            "notification_vibration",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_notification_chance(self, value):
        """Validate notification chance is between 0 and 100"""
        if value < 0 or value > 100:
            raise serializers.ValidationError(
                "Notification chance must be between 0 and 100"
            )
        return value

    def validate(self, attrs):
        """Validate quiet hours if both are provided"""
        quiet_start = attrs.get("quiet_hours_start")
        quiet_end = attrs.get("quiet_hours_end")

        if quiet_start and not quiet_end:
            raise serializers.ValidationError(
                "Quiet hours end is required if start time is provided"
            )

        if quiet_end and not quiet_start:
            raise serializers.ValidationError(
                "Quiet hours start is required if end time is provided"
            )

        if quiet_start and quiet_end and quiet_start >= quiet_end:
            raise serializers.ValidationError(
                "Quiet hours start must be before end time"
            )

        return attrs

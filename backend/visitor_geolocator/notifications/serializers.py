from rest_framework import serializers
from visitor_geolocator.notifications.models import (
    PushSubscription,
    NotificationPreferences,
)


class PushSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for PushSubscription model"""

    class Meta:
        model = PushSubscription
        fields = ["id", "endpoint", "p256dh", "auth", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_endpoint(self, value):
        """Validate endpoint URL"""
        if not value:
            raise serializers.ValidationError("Endpoint is required")
        return value

    def validate_p256dh(self, value):
        """Validate p256dh key"""
        if not value:
            raise serializers.ValidationError("p256dh key is required")
        return value

    def validate_auth(self, value):
        """Validate auth key"""
        if not value:
            raise serializers.ValidationError("auth key is required")
        return value


class PushSubscriptionCreateSerializer(serializers.Serializer):
    """Serializer for creating push subscriptions"""

    endpoint = serializers.URLField()
    keys = serializers.DictField(child=serializers.CharField(), validators=[])

    def validate_keys(self, value):
        """Validate keys object"""
        required_keys = ["p256dh", "auth"]
        for key in required_keys:
            if key not in value:
                raise serializers.ValidationError(f"Missing required key: {key}")
            if not value[key]:
                raise serializers.ValidationError(f"Key {key} cannot be empty")
        return value

    def create(self, validated_data): ...
    def update(self, instance, validated_data): ...


class SubscriptionStatusSerializer(serializers.Serializer):
    """Serializer for subscription status response"""

    success = serializers.BooleanField()
    subscribed = serializers.BooleanField()
    subscription = PushSubscriptionSerializer(allow_null=True)

    def create(self, validated_data): ...
    def update(self, instance, validated_data): ...


class PushNotificationResponseSerializer(serializers.Serializer):
    """Serializer for push notification responses"""

    success = serializers.BooleanField()
    message = serializers.CharField(allow_blank=True)
    error = serializers.CharField(allow_blank=True, required=False)

    def create(self, validated_data): ...
    def update(self, instance, validated_data): ...


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

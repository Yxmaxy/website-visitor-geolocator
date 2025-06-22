from django.db import models

from visitor_geolocator.core.models import WebsiteVisitorGeolocatorUser


class PushSubscription(models.Model):
    """Model to store push notification subscriptions for clients"""

    class Meta:
        db_table = "website_visitor_geolocator_push_subscription"

    website_visitor_geolocator_user = models.ForeignKey(
        WebsiteVisitorGeolocatorUser, on_delete=models.CASCADE
    )
    endpoint = models.URLField(max_length=500)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Push subscription for {self.website_visitor_geolocator_user.user.username}"

    def to_dict(self):
        """Convert subscription to dictionary format for web push"""
        return {
            "endpoint": self.endpoint,
            "keys": {"p256dh": self.p256dh, "auth": self.auth},
        }

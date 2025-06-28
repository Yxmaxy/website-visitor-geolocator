import json
import logging
import random
from datetime import datetime
from typing import Dict, Any, Optional
from pywebpush import webpush, WebPushException

from django.conf import settings
from django.contrib.auth.models import AbstractUser

from visitor_geolocator.core.models import Visitor
from visitor_geolocator.notifications.models import (
    PushSubscription,
    NotificationPreferences,
)

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for handling push notifications"""

    @staticmethod
    def handle_new_visitor(visitor: Visitor):
        """Send a new visitor notification to the domain owner"""
        try:
            subscriptions = PushSubscription.objects.filter(
                website_visitor_geolocator_user=visitor.domain.created_by
            )

            # skip if no subscriptions exist
            if not subscriptions.exists():
                return

            try:
                preferences = NotificationPreferences.objects.get(
                    website_visitor_geolocator_user=visitor.domain.created_by
                )
            except NotificationPreferences.DoesNotExist:
                preferences = None

            # skip if new visitor notifications are disabled
            if preferences and not preferences.new_visitor_notifications:
                return

            # take chance into account if set
            if preferences and preferences.notification_chance < 100:
                chance = random.randint(1, 100)
                if chance > preferences.notification_chance:
                    return

            # skip if in quiet hours
            if preferences and NotificationService._is_in_quiet_hours(preferences):
                return

            for subscription in subscriptions:
                NotificationService.send_push_notification(
                    subscription=subscription,
                    title=f"New visitor on {visitor.domain}",
                    body=f"New visitor on {visitor.domain} from {visitor.location_description}",
                    preferences=preferences,
                )

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error handling new visitor notification: %s", e)

    @staticmethod
    def _is_in_quiet_hours(preferences: NotificationPreferences) -> bool:
        """Check if current time is within quiet hours"""
        if not preferences.quiet_hours_start or not preferences.quiet_hours_end:
            return False

        now = datetime.now().time()
        start = preferences.quiet_hours_start
        end = preferences.quiet_hours_end

        # handle quiet hours that span midnight
        if start <= end:
            return start <= now <= end
        return now >= start or now <= end

    @staticmethod
    def send_push_notification(
        subscription: PushSubscription,
        title: str,
        body: str,
        data: Dict[str, Any] = None,
        preferences: NotificationPreferences = None,
    ):
        """Send a push notification to a specific subscription using pywebpush"""
        try:
            if (
                not settings.VAPID_PRIVATE_KEY
                or not settings.VAPID_PUBLIC_KEY
                or not settings.VAPID_EMAIL
            ):
                raise ValueError("VAPID keys or email are not set")

            # Determine vibration and sound based on preferences
            vibrate = (
                [200, 100, 50]
                if (not preferences or preferences.notification_vibration)
                else []
            )

            notification_payload = {
                "title": title,
                "body": body,
                "data": data or {},
                "vibrate": vibrate,
                "icon": "/static/img/notification-icon.png",
                "badge": "/static/img/badge-icon.png",
            }

            payload = json.dumps(notification_payload)

            subscription_info = {
                "endpoint": subscription.endpoint,
                "keys": {
                    "p256dh": subscription.p256dh,
                    "auth": subscription.auth,
                },
            }

            webpush(
                subscription_info,
                payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": f"mailto:{settings.VAPID_EMAIL}",
                },
            )
            return True

        except WebPushException as ex:
            logger.error("WebPushException: %s", ex)
            if ex.response and ex.response.json():
                logger.error("Response: %s", ex.response.json())
            return False
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error sending push notification: %s", e)
            return False

    @staticmethod
    def create_subscription(
        user: AbstractUser, endpoint: str, p256dh: str, auth: str
    ) -> PushSubscription:
        """Delete existing subscription and create a new one"""
        NotificationService.delete_subscription(user.website_visitor_geolocator_user)

        subscription = PushSubscription.objects.create(
            website_visitor_geolocator_user=user.website_visitor_geolocator_user,
            endpoint=endpoint,
            p256dh=p256dh,
            auth=auth,
        )

        return subscription

    @staticmethod
    def delete_subscription(user: AbstractUser) -> bool:
        """Delete push subscription for a user"""
        try:
            PushSubscription.objects.filter(
                website_visitor_geolocator_user=user.website_visitor_geolocator_user
            ).delete()
            return True
        except Exception:  # pylint: disable=broad-exception-caught
            return False

    @staticmethod
    def get_user_subscription(user: AbstractUser) -> Optional[PushSubscription]:
        """Get push subscription for a user"""
        try:
            return PushSubscription.objects.get(
                website_visitor_geolocator_user=user.website_visitor_geolocator_user
            )
        except PushSubscription.DoesNotExist:
            return None

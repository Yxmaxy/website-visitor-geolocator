import json
import logging
from typing import Dict, Any, Optional

from django.conf import settings
from django.contrib.auth.models import User
from visitor_geolocator.core.models import Visitor
from visitor_geolocator.notifications.models import PushSubscription
from pywebpush import webpush, WebPushException

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for handling push notifications"""

    @staticmethod
    def handle_new_visitor(visitor: Visitor):
        """Send a new visitor notification to the domain owner"""
        try:
            subscriptions = PushSubscription.objects.filter(
                website_visitor_geolocator_user=visitor.domain.created_by.website_visitor_geolocator_user
            )

            if not subscriptions.exists():
                return

            for subscription in subscriptions:
                NotificationService.send_push_notification(
                    subscription=subscription,
                    title=f"New visitor on {visitor.domain}",
                    body=f"New visitor on {visitor.domain} from {visitor.location_description}",
                )

        except Exception as e:
            logger.error(f"Error handling new visitor notification: {e}")

    @staticmethod
    def send_push_notification(
        subscription: PushSubscription,
        title: str,
        body: str,
        data: Dict[str, Any] = None,
    ):
        """Send a push notification to a specific subscription using pywebpush"""
        try:
            if (
                not settings.VAPID_PRIVATE_KEY
                or not settings.VAPID_PUBLIC_KEY
                or not settings.VAPID_EMAIL
            ):
                raise Exception("VAPID keys or email are not set")

            notification_payload = {
                "title": title,
                "body": body,
                "data": data or {},
                "vibrate": [200, 100, 200],
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

            logger.info(f"Sending push notification with payload: {payload}")

            webpush(
                subscription_info,
                payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={
                    "sub": f"mailto:{settings.VAPID_EMAIL}",
                },
            )
            logger.info(
                f"Push notification sent successfully to {subscription.endpoint}"
            )
            return True
        except WebPushException as ex:
            logger.error(f"WebPushException: {ex}")
            if ex.response and ex.response.json():
                logger.error(f"Response: {ex.response.json()}")
            return False
        except Exception as e:
            logger.error(f"Error sending push notification: {e}")
            return False

    @staticmethod
    def create_subscription(
        user: User, endpoint: str, p256dh: str, auth: str
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
    def delete_subscription(user: User) -> bool:
        """Delete push subscription for a user"""
        try:
            PushSubscription.objects.filter(
                website_visitor_geolocator_user=user.website_visitor_geolocator_user
            ).delete()
            return True
        except Exception:
            return False

    @staticmethod
    def get_user_subscription(user: User) -> Optional[PushSubscription]:
        """Get push subscription for a user"""
        try:
            return PushSubscription.objects.get(
                website_visitor_geolocator_user=user.website_visitor_geolocator_user
            )
        except PushSubscription.DoesNotExist:
            return None

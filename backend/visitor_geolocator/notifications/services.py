import json
import base64
import time
import logging
import requests
import urllib.parse
from typing import Dict, Any, Optional

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

from django.conf import settings
from django.contrib.auth.models import User

from visitor_geolocator.core.models import Visitor
from visitor_geolocator.notifications.models import PushSubscription

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
        """Send a push notification to a specific subscription"""
        try:
            if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PRIVATE_KEY:
                raise Exception("VAPID keys are not set")

            notification_payload = {
                "title": title,
                "body": body,
                "data": data or {},
                "icon": "/static/img/notification-icon.png",  # TODO: icon location!
                "badge": "/static/img/badge-icon.png",
                "vibrate": [50, 100, 50],
            }

            payload = json.dumps(notification_payload)

            if vapid_token := NotificationService.generate_vapid_jwt(
                subscription.endpoint
            ):
                headers = {
                    "Content-Type": "application/json",
                    "TTL": "86400",  # 24 hours
                    "Authorization": f"vapid t={vapid_token}, k={settings.VAPID_PUBLIC_KEY}",
                    "Crypto-Key": f"p256ecdsa={settings.VAPID_PUBLIC_KEY}",
                }

                response = requests.post(
                    subscription.endpoint, data=payload, headers=headers
                )

                success = response.status_code == 201
                error_message = None if success else f"HTTP {response.status_code}"

        except Exception as e:
            success = False
            error_message = str(e)

        if success == False:
            logger.error(f"Error sending push notification: {error_message}")
            return False
        return True

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

    @staticmethod
    def generate_vapid_jwt(endpoint: str) -> str:
        """Generate VAPID JWT token for the given endpoint"""
        try:
            parsed_url = urllib.parse.urlparse(endpoint)
            audience = f"{parsed_url.scheme}://{parsed_url.netloc}"

            payload = {
                "aud": audience,
                "exp": int(time.time()) + 12 * 3600,  # 12 hours from now
                "sub": settings.VAPID_EMAIL,
            }

            try:
                private_key_b64 = settings.VAPID_PRIVATE_KEY + "=" * (
                    4 - len(settings.VAPID_PRIVATE_KEY) % 4
                )

                # Decode base64url to bytes
                private_key_bytes = base64.urlsafe_b64decode(private_key_b64)

                # Create EC private key from the raw bytes
                # VAPID uses P-256 curve, so we need to create the key properly
                private_key = ec.derive_private_key(
                    int.from_bytes(private_key_bytes, "big"),
                    ec.SECP256R1(),
                    default_backend(),
                )

                # Serialize to PEM format
                private_key_pem = private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption(),
                )

                # Sign the JWT with the PEM-formatted private key
                token = jwt.encode(payload, private_key_pem, algorithm="ES256")

                return token

            except Exception as key_error:
                logger.error(f"Error converting VAPID private key: {key_error}")
                return None

        except jwt.InvalidKeyError as e:
            logger.error(f"Invalid VAPID private key format: {e}")
            return None
        except Exception as e:
            logger.error(f"Error generating VAPID JWT: {e}")
            return None

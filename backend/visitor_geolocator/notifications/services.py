import logging

from visitor_geolocator.core.models import Visitor
from visitor_geolocator.notifications.models import SummaryNotificationPreferences

from simple_notifications.services import NotificationService, NotificationSubscriptionService

logger = logging.getLogger(__name__)


class VisitorNotificationService:
    """Service for handling push notifications"""

    @staticmethod
    def handle_new_visitor(visitor: Visitor):
        """Send a new visitor notification to the domain owner"""
        try:
            subscriptions = NotificationSubscriptionService.get_user_subscriptions(
                user=visitor.domain.created_by.user,
            )

            if not subscriptions.exists():
                return

            try:
                preferences = SummaryNotificationPreferences.objects.get(
                    website_visitor_geolocator_user=visitor.domain.created_by
                )
            except SummaryNotificationPreferences.DoesNotExist:
                preferences = None

            # skip if new visitor notifications are disabled
            if preferences and not preferences.new_visitor_notifications:
                return

            for subscription in subscriptions:
                NotificationService.send_push_notification(
                    subscription=subscription,
                    title=f"New visitor on {visitor.domain}",
                    body=f"New visitor on {visitor.domain} from {visitor.location_description}",
                    icon="/logo.svg",
                    badge="/logo.svg",
                    data={"url": f"/visitors?ip={visitor.ip_address}"},
                )

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error handling new visitor notification: %s", e)

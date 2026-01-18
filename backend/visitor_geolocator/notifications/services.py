import logging
import random
from datetime import datetime

from django.conf import settings

from visitor_geolocator.core.models import Visitor
from visitor_geolocator.notifications.models import NotificationPreferences

from simple_notifications.services import NotificationService

logger = logging.getLogger(__name__)


class VisitorNotificationService:
    """Service for handling push notifications"""

    @staticmethod
    def handle_new_visitor(visitor: Visitor):
        """Send a new visitor notification to the domain owner"""
        try:
            subscription = NotificationService.get_user_subscription(
                user=visitor.domain.created_by.user,
                app_name=settings.WEBSITE_VISITOR_GEOLOCATOR_NOTIFICATIONS_APP_NAME,
            )

            # skip if no subscriptions exist
            if not subscription:
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
            if preferences and VisitorNotificationService.is_in_quiet_hours(
                preferences
            ):
                return

            NotificationService.send_push_notification(
                subscription=subscription,
                title=f"New visitor on {visitor.domain}",
                body=f"New visitor on {visitor.domain} from {visitor.location_description}",
                icon="/logo.svg",
                badge="/logo.svg",
            )

        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error handling new visitor notification: %s", e)

    @staticmethod
    def is_in_quiet_hours(preferences: NotificationPreferences) -> bool:
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

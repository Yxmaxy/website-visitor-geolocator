import re
from datetime import timedelta

from django.utils import timezone

from visitor_geolocator.core.models import Visitor, Domain
from visitor_geolocator.statistics.models import Area, LevelChoices


class StatisticsService:
    """Service class for generating visitor statistics"""

    @staticmethod
    def get_visitors(domains: list[Domain], days: int = None):
        """
        Get domain visitors limited by days
        """
        queryset = Visitor.objects.filter(domain__in=domains)
        if days:
            start_date = timezone.now() - timedelta(days=days)
            queryset = queryset.filter(created_at__gte=start_date)

        return queryset.order_by("-created_at")

    @staticmethod
    def get_visitors_by_area(
        domains: list[Domain],
        days: int = None,
        level: LevelChoices = LevelChoices.COUNTRY,
    ):
        """
        Get visitor count by area for a specific domain or all domains
        Returns only visitor statistics without geometry data (geometries fetched separately)
        """
        queryset = StatisticsService.get_visitors(domains, days)

        area_stats = []

        areas = Area.objects.filter(level=level)
        for area in areas:
            visitor_count = queryset.filter(location__within=area.geometry).count()

            if visitor_count > 0:
                area_stats.append(
                    {
                        "area_name": area.name,
                        "visitor_count": visitor_count,
                    }
                )

        area_stats.sort(key=lambda x: x["visitor_count"], reverse=True)

        return area_stats

    @staticmethod
    def get_user_agent_distribution(domains: list[Domain], days: int = None):
        """
        Get user agent distribution using regex patterns
        """
        queryset = StatisticsService.get_visitors(domains, days)

        browser_patterns = {
            "Chrome": r"Chrome/[0-9.]+",
            "Safari": r"Safari/[0-9.]+(?!.*Chrome)",
            "Firefox": r"Firefox/[0-9.]+",
            "Edge": r"Edge/[0-9.]+",
            "Opera": r"Opera/[0-9.]+",
            "Internet Explorer": r"MSIE [0-9.]+|Trident/[0-9.]+",
        }

        browser_counts = {browser: 0 for browser in browser_patterns}
        browser_counts["Other"] = 0

        for visitor in queryset:
            user_agent = visitor.user_agent
            for browser, pattern in browser_patterns.items():
                if re.search(pattern, user_agent, re.IGNORECASE):
                    browser_counts[browser] += 1
                    break
            else:
                browser_counts["Other"] += 1

        distribution = [
            {"browser": browser, "count": count}
            for browser, count in browser_counts.items()
            if count > 0
        ]

        return sorted(distribution, key=lambda x: x["count"], reverse=True)

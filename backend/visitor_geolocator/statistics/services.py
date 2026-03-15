import re
from datetime import datetime

from django.utils import timezone
from django.db.models import Count, Subquery, OuterRef
from django.db.models.functions import TruncDate

from visitor_geolocator.core.models import Visitor, Domain
from visitor_geolocator.statistics.models import Area, LevelChoices


class StatisticsService:
    """Service class for generating visitor statistics"""

    @staticmethod
    def get_visitors(domains: list[Domain], from_date: datetime = None, to_date: datetime = None, ip_address: str = None):
        """
        Get domain visitors limited by days
        """
        queryset = Visitor.objects.select_related("domain").filter(domain__in=domains)

        date_filters = {}
        if from_date:
            date_filters["created_at__date__gte"] = from_date
        if to_date:
            date_filters["created_at__date__lte"] = to_date

        if date_filters:
            queryset = queryset.filter(**date_filters)

        if ip_address:
            queryset = queryset.filter(ip_address=ip_address)

        return queryset

    @staticmethod
    def get_visitors_by_area(
        domains: list[Domain],
        from_date: datetime = None,
        to_date: datetime = None,
        level: LevelChoices = LevelChoices.COUNTRY,
    ):
        """
        Get visitor count by area for a specific domain or all domains
        Returns only visitor statistics without geometry data (geometries fetched separately)
        """
        visitors = StatisticsService.get_visitors(domains, from_date, to_date)

        areas = Area.objects.filter(level=level)
        area_subquery = areas.filter(geometry__contains=OuterRef("location")).values(
            "name"
        )[:1]

        visitors_with_area = visitors.annotate(area_name=Subquery(area_subquery))
        visitors_with_area = visitors_with_area.exclude(area_name__isnull=True)

        area_stats = (
            visitors_with_area.values("area_name")
            .annotate(visitor_count=Count("id"))
            .order_by("-visitor_count", "area_name")
        )

        return list(area_stats)

    @staticmethod
    def get_user_agent_distribution(domains: list[Domain], from_date: datetime = None, to_date: datetime = None):
        """
        Get user agent distribution using regex patterns
        """
        queryset = StatisticsService.get_visitors(domains, from_date, to_date)

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

    @staticmethod
    def get_visitors_by_date(domains: list[Domain], from_date: datetime = None, to_date: datetime = None, ip_address: str = None):
        """
        Get visitor count grouped by date
        Returns list of dicts with 'date' and 'count' keys, only for dates that have data
        """
        visitors = StatisticsService.get_visitors(domains, from_date, to_date, ip_address)

        date_stats = (
            visitors.annotate(date=TruncDate("created_at"))
            .values("date")
            .annotate(count=Count("id"))
            .order_by("date")
        )

        return [
            {"date": str(stat["date"]), "count": stat["count"]}
            for stat in date_stats
            if stat["date"] is not None
        ]

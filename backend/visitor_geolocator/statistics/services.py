from datetime import datetime

from django.db import models
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
        Get user agent distribution from parsed user agent data
        """
        queryset = StatisticsService.get_visitors(domains, from_date, to_date)

        distribution = (
            queryset
            .filter(user_agent_parsed__isnull=False)
            .values(browser=models.F("user_agent_parsed__browser"))
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        return list(distribution)

    @staticmethod
    def get_operating_system_distribution(domains: list[Domain], from_date: datetime = None, to_date: datetime = None):
        """
        Get operating system distribution from parsed user agent data
        """
        queryset = StatisticsService.get_visitors(domains, from_date, to_date)

        distribution = (
            queryset
            .filter(user_agent_parsed__isnull=False)
            .values(operating_system=models.F("user_agent_parsed__os"))
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        return list(distribution)

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

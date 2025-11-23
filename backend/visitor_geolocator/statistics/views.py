from typing import Optional
from datetime import datetime
from rest_framework.request import Request
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter

from visitor_geolocator.core.models import Domain
from visitor_geolocator.statistics.models import Area, LevelChoices
from visitor_geolocator.statistics.pagination import StatisticsPagination
from visitor_geolocator.statistics.services import StatisticsService
from visitor_geolocator.statistics.serializers import (
    AreaGeometriesQuerySerializer,
    AreaGeometriesResponseSerializer,
    AreaStatisticsSerializer,
    AreaStatisticsResponseSerializer,
    StatisticsSerializer,
    UserAgentDistributionSerializer,
    VisitorSerializer,
    VisitorCountByDateSerializer,
)
from visitor_geolocator.core.services import DomainService, UserService
from visitor_geolocator.frontend.permissions import (
    HasWebsiteVisitorGeolocatorPermission,
)


class StatisticsMixin:
    statistics_serializer_class = StatisticsSerializer

    def get_statistic_parameters(self) -> tuple[list[Domain], Optional[datetime], Optional[datetime]]:
        self.statistics_serializer = self.statistics_serializer_class(data=self.request.query_params)
        self.statistics_serializer.is_valid(raise_exception=True)

        domain_id = self.statistics_serializer.validated_data.get("domain_id")
        from_date = self.statistics_serializer.validated_data.get("from_date")
        to_date = self.statistics_serializer.validated_data.get("to_date")

        wvg_user = UserService.get_wvg_user(self.request.user)
        domains = DomainService.get_owner_domains(wvg_user)
        if domain_id:
            domains = domains.filter(id=domain_id)

        domains = domains.order_by("id")
        return domains, from_date, to_date


class AreaGeometriesAPIView(APIView):
    """API view for area geometries"""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]

    def get(self, request: Request):
        """Get area geometries for a specific level"""
        serializer = AreaGeometriesQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        level_param: int = serializer.validated_data.get("level", LevelChoices.COUNTRY)
        areas = Area.objects.filter(level=level_param)

        geojson_data = {
            "type": "FeatureCollection",
            "features": [feature for area in areas if (feature := area.geojson_feature) is not None],
        }

        response_serializer = AreaGeometriesResponseSerializer(data=geojson_data)
        response_serializer.is_valid(raise_exception=True)

        return Response(response_serializer.validated_data)


class AreaStatisticsAPIView(StatisticsMixin, ListAPIView):
    """API view for area-based visitor statistics"""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]
    serializer_class = AreaStatisticsResponseSerializer
    statistics_serializer_class = AreaStatisticsSerializer
    pagination_class = StatisticsPagination

    def get_queryset(self):
        domains, from_date, to_date = self.get_statistic_parameters()
        level: int = self.statistics_serializer.validated_data.get("level", LevelChoices.COUNTRY)

        return StatisticsService.get_visitors_by_area(domains, from_date, to_date, level)


class VisitorListAPIView(StatisticsMixin, ListAPIView):
    """API view for visitor list"""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]
    serializer_class = VisitorSerializer
    pagination_class = StatisticsPagination
    filter_backends = [OrderingFilter]
    ordering_fields = ["ip_address", "location_description", "domain__domain", "created_at", "user_agent"]
    ordering = ["-created_at"]

    def get_queryset(self):
        domains, from_date, to_date = self.get_statistic_parameters()
        return StatisticsService.get_visitors(domains, from_date, to_date)


class VisitorCountAPIView(StatisticsMixin, ListAPIView):
    """API view for visitor count by date"""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]
    serializer_class = VisitorCountByDateSerializer

    def get_queryset(self):
        """Get visitor count grouped by date"""
        domains, from_date, to_date = self.get_statistic_parameters()
        return StatisticsService.get_visitors_by_date(domains, from_date, to_date)


class UserAgentDistributionAPIView(StatisticsMixin, ListAPIView):
    """API view for user agent distribution"""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]
    serializer_class = UserAgentDistributionSerializer
    pagination_class = StatisticsPagination

    def get_queryset(self):
        """Get user agent distribution"""
        domains, from_date, to_date = self.get_statistic_parameters()
        return StatisticsService.get_user_agent_distribution(domains, from_date, to_date)

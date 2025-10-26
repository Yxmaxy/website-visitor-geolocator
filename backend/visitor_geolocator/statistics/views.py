from rest_framework.request import Request
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from visitor_geolocator.statistics.models import Area, LevelChoices
from visitor_geolocator.statistics.services import StatisticsService
from visitor_geolocator.statistics.serializers import (
    AreaGeometriesQuerySerializer,
    AreaGeometriesResponseSerializer,
    AreaStatisticsSerializer,
    AreaStatisticsResponseSerializer,
    StatisticsSerializer,
    UserAgentDistributionSerializer,
    VisitorSerializer,
)
from visitor_geolocator.core.services import DomainService, UserService
from visitor_geolocator.frontend.permissions import (
    HasWebsiteVisitorGeolocatorPermission,
)


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


class AreaStatisticsAPIView(APIView):
    """API view for area-based visitor statistics"""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]

    def get(self, request: Request):
        """Get visitor statistics by area"""
        serializer = AreaStatisticsSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        level: int = serializer.validated_data.get("level", LevelChoices.COUNTRY)

        from_date = serializer.validated_data.get("from_date")
        to_date = serializer.validated_data.get("to_date")
        domain_id: int = serializer.validated_data.get("domain_id")

        wvg_user = UserService.get_wvg_user(request.user)
        domains = DomainService.get_owner_domains(wvg_user)
        if domain_id:
            domains = domains.filter(id=domain_id)

        data = StatisticsService.get_visitors_by_area(domains, from_date, to_date, level)

        response_serializer = AreaStatisticsResponseSerializer(data=data, many=True)
        response_serializer.is_valid(raise_exception=True)

        return Response(response_serializer.validated_data)


class VisitorListAPIView(ListAPIView):
    """API view for visitor list"""

    class CustomPagination(PageNumberPagination):
        page_size = 5
        page_size_query_param = "page_size"
        max_page_size = 100

        def get_paginated_response(self, data):
            return Response({
                "count": self.page.paginator.count,
                "total_pages": self.page.paginator.num_pages,
                "next": self.page.next_page_number() if self.page.has_next() else None,
                "previous": self.page.previous_page_number() if self.page.has_previous() else None,
                "results": data,
            })


    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]
    serializer_class = VisitorSerializer
    pagination_class = CustomPagination

    def get_queryset(self):
        serializer = StatisticsSerializer(data=self.request.query_params)
        serializer.is_valid(raise_exception=True)

        domain_id = serializer.validated_data.get("domain_id")
        from_date = serializer.validated_data.get("from_date")
        to_date = serializer.validated_data.get("to_date")

        wvg_user = UserService.get_wvg_user(self.request.user)
        domains = DomainService.get_owner_domains(wvg_user)
        if domain_id:
            domains = domains.filter(id=domain_id)

        domains = domains.order_by("id")
        return StatisticsService.get_visitors(domains, from_date, to_date)


class UserAgentDistributionAPIView(APIView):
    """API view for user agent distribution"""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]

    def get(self, request):
        """Get user agent distribution"""
        serializer = StatisticsSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        domain_id = serializer.validated_data.get("domain_id")
        from_date = serializer.validated_data.get("from_date")
        to_date = serializer.validated_data.get("to_date")

        wvg_user = UserService.get_wvg_user(request.user)
        domains = DomainService.get_owner_domains(wvg_user)
        if domain_id:
            domains = domains.filter(id=domain_id)

        data = StatisticsService.get_user_agent_distribution(domains, from_date, to_date)

        response_serializer = UserAgentDistributionSerializer(data=data, many=True)
        response_serializer.is_valid(raise_exception=True)

        return Response(response_serializer.validated_data)

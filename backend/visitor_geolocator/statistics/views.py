import json
from rest_framework.request import Request
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from visitor_geolocator.statistics.models import Area, LevelChoices
from visitor_geolocator.statistics.services import StatisticsService
from visitor_geolocator.statistics.serializers import (
    AreaGeometriesQuerySerializer,
    AreaGeometriesResponseSerializer,
    AreaStatisticsSerializer,
    AreaStatisticsResponseSerializer,
    StatisticsDayRangeSerializer,
    UserAgentDistributionSerializer,
    VisitorSerializer,
)
from visitor_geolocator.core.services import DomainService, UserService
from visitor_geolocator.frontend.permissions import (
    HasWebsiteVisitorGeolocatorPermission,
)


class AreaGeometriesAPIView(APIView):
    """API view for area geometries only"""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]

    def get(self, request: Request):
        """Get area geometries for a specific level"""
        # Validate query parameters
        serializer = AreaGeometriesQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        level_param = serializer.validated_data.get("level", LevelChoices.COUNTRY)

        areas = Area.objects.filter(level=level_param)

        # Convert to GeoJSON format
        geojson_features = []
        for area in areas:
            if area.geometry and area.geometry.valid:
                simplified_geometry = area.simplified_geometry
                geojson_geometry: dict = json.loads(simplified_geometry.geojson)

                if (
                    geojson_geometry
                    and geojson_geometry.get("type")
                    and geojson_geometry.get("coordinates")
                ):
                    feature_data = {
                        "type": "Feature",
                        "properties": {
                            "name": area.name,
                            "level": level_param,
                        },
                        "geometry": geojson_geometry,
                    }
                    geojson_features.append(feature_data)

        geojson_data = {
            "type": "FeatureCollection",
            "features": geojson_features,
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

        domain_id = serializer.validated_data.get("domain_id")
        days = serializer.validated_data.get("days", 30)
        level = serializer.validated_data.get("level", LevelChoices.COUNTRY)

        wvg_user = UserService.get_wvg_user(request.user)
        domains = DomainService.get_owner_domains(wvg_user)
        if domain_id:
            domains = domains.filter(id=domain_id)

        data = StatisticsService.get_visitors_by_area(domains, days, level)

        response_serializer = AreaStatisticsResponseSerializer(data=data, many=True)
        response_serializer.is_valid(raise_exception=True)

        return Response(response_serializer.validated_data)


class LatestVisitorsAPIView(APIView):
    """API view for latest visitors"""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]

    def get(self, request):
        """Get latest visitors"""
        serializer = StatisticsDayRangeSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        domain_id = serializer.validated_data.get("domain_id")
        days = serializer.validated_data.get("days", 30)

        wvg_user = UserService.get_wvg_user(request.user)
        domains = DomainService.get_owner_domains(wvg_user)
        if domain_id:
            domains = domains.filter(id=domain_id)

        domains = domains.order_by("id")
        visitors_queryset = StatisticsService.get_visitors(domains, days)

        visitor_serializer = VisitorSerializer(visitors_queryset, many=True)
        return Response(visitor_serializer.data)


class UserAgentDistributionAPIView(APIView):
    """API view for user agent distribution"""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]

    def get(self, request):
        """Get user agent distribution"""
        serializer = StatisticsDayRangeSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        domain_id = serializer.validated_data.get("domain_id")
        days = serializer.validated_data.get("days", 30)

        wvg_user = UserService.get_wvg_user(request.user)
        domains = DomainService.get_owner_domains(wvg_user)
        if domain_id:
            domains = domains.filter(id=domain_id)

        data = StatisticsService.get_user_agent_distribution(domains, days)

        response_serializer = UserAgentDistributionSerializer(data=data, many=True)
        response_serializer.is_valid(raise_exception=True)

        return Response(response_serializer.validated_data)

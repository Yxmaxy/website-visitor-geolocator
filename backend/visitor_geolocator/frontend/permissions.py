from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.views import APIView


class HasWebsiteVisitorGeolocatorPermission(BasePermission):
    def has_permission(self, request: Request, view: APIView) -> bool:
        return request.user.has_perm(
            "website_visitor_geolocator_core.website_visitor_geolocator_enabled"
        )

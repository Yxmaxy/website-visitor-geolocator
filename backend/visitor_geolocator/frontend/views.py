from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.shortcuts import get_object_or_404
from django.contrib.auth import logout

from visitor_geolocator.core.models import Domain, WebsiteVisitorGeolocatorUser
from visitor_geolocator.core.services import UserService
from visitor_geolocator.frontend.serializers import UserSerializer, DomainSerializer
from visitor_geolocator.notifications.models import SummaryNotificationPreferences
from visitor_geolocator.notifications.serializers import SummaryNotificationPreferencesSerializer
from visitor_geolocator.frontend.permissions import (
    HasWebsiteVisitorGeolocatorPermission,
)


class UserAPIView(APIView):
    """View for user operations"""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]

    def get(self, request):
        """Retrieves the user from the request."""
        wvg_user, _ = WebsiteVisitorGeolocatorUser.objects.get_or_create(
            user=request.user
        )
        serializer = UserSerializer(data={"user": wvg_user.user.email})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


class DomainListCreateAPIView(ListCreateAPIView):
    """View for listing and creating domains"""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]
    serializer_class = DomainSerializer

    def get_queryset(self):
        """Get all domains for the authenticated user."""
        wvg_user = UserService.get_wvg_user(self.request.user)
        return Domain.objects.filter(created_by=wvg_user)

    def perform_create(self, serializer):
        """Set the created_by field when creating a domain"""
        wvg_user = UserService.get_wvg_user(self.request.user)
        serializer.save(created_by=wvg_user)


class DomainRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    """View for retrieving, updating, and deleting a specific domain"""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]
    serializer_class = DomainSerializer

    def get_object(self):
        """Get the domain object or return 404"""
        wvg_user = UserService.get_wvg_user(self.request.user)
        return get_object_or_404(Domain, id=self.kwargs["pk"], created_by=wvg_user)


class NotificationPreferencesAPIView(APIView):
    """View for WVG summary notification preferences."""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]

    def _get_wvg_user_and_prefs(self, request):
        wvg_user, _ = WebsiteVisitorGeolocatorUser.objects.get_or_create(user=request.user)
        preferences, _ = SummaryNotificationPreferences.objects.get_or_create(
            website_visitor_geolocator_user=wvg_user
        )
        return preferences

    def get(self, request):
        preferences = self._get_wvg_user_and_prefs(request)
        serializer = SummaryNotificationPreferencesSerializer(preferences)
        return Response(serializer.data)

    def put(self, request):
        preferences = self._get_wvg_user_and_prefs(request)
        serializer = SummaryNotificationPreferencesSerializer(
            preferences, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class LogoutView(APIView):
    """View for user logout"""

    permission_classes = [IsAuthenticated, HasWebsiteVisitorGeolocatorPermission]

    def get(self, request):
        """Logout the user"""
        logout(request)
        return Response({"success": True, "message": "Successfully logged out"})

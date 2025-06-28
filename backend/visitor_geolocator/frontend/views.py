from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.shortcuts import get_object_or_404
from django.contrib.auth import logout

from visitor_geolocator.core.models import Domain, WebsiteVisitorGeolocatorUser
from visitor_geolocator.frontend.serializers import UserSerializer, DomainSerializer
from visitor_geolocator.notifications.models import NotificationPreferences
from visitor_geolocator.notifications.serializers import (
    NotificationPreferencesSerializer,
)


class UserAPIView(APIView):
    """View for user operations"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieves the user from the request."""
        user, _ = WebsiteVisitorGeolocatorUser.objects.get_or_create(user=request.user)
        serializer = UserSerializer(data={"user": user.user.email})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)


class DomainListCreateAPIView(ListCreateAPIView):
    """View for listing and creating domains"""

    permission_classes = [IsAuthenticated]

    queryset = Domain.objects.all()
    serializer_class = DomainSerializer

    def get_queryset(self):
        """Get all domains for the authenticated user."""
        return Domain.objects.filter(
            created_by=self.request.user.website_visitor_geolocator_user
        )

    def perform_create(self, serializer):
        """Set the created_by field when creating a domain"""
        serializer.save(created_by=self.request.user.website_visitor_geolocator_user)


class DomainRetrieveUpdateDestroyAPIView(RetrieveUpdateDestroyAPIView):
    """View for retrieving, updating, and deleting a specific domain"""

    permission_classes = [IsAuthenticated]
    serializer_class = DomainSerializer

    def get_object(self):
        """Get the domain object or return 404"""
        return get_object_or_404(
            Domain,
            id=self.kwargs["pk"],
            created_by=self.request.user.website_visitor_geolocator_user,
        )


class NotificationPreferencesAPIView(APIView):
    """View for notification preferences operations"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get user notification preferences"""
        user, _ = WebsiteVisitorGeolocatorUser.objects.get_or_create(user=request.user)
        preferences, _ = NotificationPreferences.objects.get_or_create(
            website_visitor_geolocator_user=user
        )

        serializer = NotificationPreferencesSerializer(preferences)
        return Response(serializer.data)

    def put(self, request):
        """Update user notification preferences"""
        user, _ = WebsiteVisitorGeolocatorUser.objects.get_or_create(user=request.user)
        preferences, _ = NotificationPreferences.objects.get_or_create(
            website_visitor_geolocator_user=user
        )

        serializer = NotificationPreferencesSerializer(
            preferences, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)


class LogoutView(APIView):
    """View for user logout"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Logout the user"""
        logout(request)
        return Response({"success": True, "message": "Successfully logged out"})

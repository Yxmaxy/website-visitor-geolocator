from rest_framework import serializers

from visitor_geolocator.core.models import Domain
from visitor_geolocator.core.services import DomainService


class UserSerializer(serializers.Serializer):
    """Serializer for user information"""

    user = serializers.EmailField()

    def create(self, validated_data):
        """Create a user"""
        return validated_data

    def update(self, instance, validated_data):
        """Update a user"""
        instance.user = validated_data.get("user", instance.user)
        instance.save()
        return instance


class DomainSerializer(serializers.ModelSerializer):
    """Serializer for Domain model"""

    script_url = serializers.SerializerMethodField()

    class Meta:
        model = Domain
        fields = [
            "id",
            "domain",
            "api_key",
            "geolocation_api_token_ipinfo",
            "active",
            "created_at",
            "script_url",
        ]
        read_only_fields = ["id", "api_key", "created_at", "script_url"]
        extra_kwargs = {"geolocation_api_token_ipinfo": {"required": False}}

    def get_script_url(self, obj):
        """Get the script URL for the domain"""
        request = self.context.get("request")
        if request:
            return DomainService.get_script_url(obj, request)
        return None

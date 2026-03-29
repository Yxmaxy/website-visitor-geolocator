from rest_framework import serializers

from visitor_geolocator.core.models import Visitor
from visitor_geolocator.statistics.models import LevelChoices


# Area Geometries

class AreaGeometriesQuerySerializer(serializers.Serializer):
    level = serializers.IntegerField(required=False, default=LevelChoices.COUNTRY)

    def validate_level(self, value):
        if value not in LevelChoices.values:
            raise serializers.ValidationError("Invalid level value")
        return value


class AreaGeometriesResponseSerializer(serializers.Serializer):
    type = serializers.CharField(default="FeatureCollection")
    features = serializers.ListField(child=serializers.DictField())


# Statistics

class StatisticsSerializer(serializers.Serializer):
    """
    Base serializer for statistics query parameters.
    """
    from_date = serializers.DateField(required=False, allow_null=True)
    to_date = serializers.DateField(required=False, allow_null=True)

    domain_id = serializers.IntegerField(required=False, allow_null=True)
    ip_address = serializers.CharField(required=False, allow_null=True)

    def validate(self, attrs: dict):
        from_date = attrs.get("from_date")
        to_date = attrs.get("to_date")
        if from_date and to_date and from_date > to_date:
            raise serializers.ValidationError("From date must be before to date")
        return attrs


class AreaStatisticsSerializer(StatisticsSerializer, AreaGeometriesQuerySerializer):
    """Serializer for area statistics query parameters"""


class AreaStatisticsResponseSerializer(serializers.Serializer):
    """Serializer for area statistics response"""

    area_name = serializers.CharField()
    visitor_count = serializers.IntegerField()


class VisitorSerializer(serializers.ModelSerializer):
    """Serializer for visitor data"""

    class Meta:
        model = Visitor
        fields = "__all__"

    domain = serializers.ReadOnlyField(source="domain.domain")


class UserAgentDistributionSerializer(serializers.Serializer):
    """Serializer for user agent distribution response"""

    browser = serializers.CharField()
    count = serializers.IntegerField()


class OperatingSystemDistributionSerializer(serializers.Serializer):
    """Serializer for operating system distribution response"""

    operating_system = serializers.CharField()
    count = serializers.IntegerField()


class VisitorCountByDateSerializer(serializers.Serializer):
    """Serializer for visitor count by date response"""

    date = serializers.CharField()
    count = serializers.IntegerField()

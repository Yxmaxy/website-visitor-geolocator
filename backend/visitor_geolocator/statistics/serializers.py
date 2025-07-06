from rest_framework import serializers

from visitor_geolocator.core.models import Visitor
from visitor_geolocator.statistics.models import LevelChoices


class StatisticsDayRangeSerializer(serializers.Serializer):
    """
    Base serializer for statistics range query parameters.
    Used for statistic endpoints which support last x days range.
    """

    domain_id = serializers.IntegerField(required=False, allow_null=True)
    days = serializers.IntegerField(default=30, min_value=1, max_value=365)

    def create(self, validated_data): ...
    def update(self, instance, validated_data): ...


class AreaStatisticsSerializer(StatisticsDayRangeSerializer):
    level = serializers.IntegerField(required=False, default=LevelChoices.COUNTRY)


class AreaStatisticsResponseSerializer(serializers.Serializer):
    """Serializer for area statistics response"""

    area_name = serializers.CharField()
    visitor_count = serializers.IntegerField()

    def create(self, validated_data): ...
    def update(self, instance, validated_data): ...


class AreaGeometriesQuerySerializer(serializers.Serializer):
    """Serializer for area geometries query parameters"""

    level = serializers.IntegerField(required=False, default=LevelChoices.COUNTRY)

    def validate_level(self, value):
        if value not in LevelChoices.values:
            raise serializers.ValidationError("Invalid level value")
        return value

    def create(self, validated_data): ...
    def update(self, instance, validated_data): ...


class AreaGeometryFeatureSerializer(serializers.Serializer):
    """Serializer for individual area geometry feature"""

    type = serializers.CharField(default="Feature")
    properties = serializers.DictField()
    geometry = serializers.DictField()

    def create(self, validated_data): ...
    def update(self, instance, validated_data): ...


class AreaGeometriesResponseSerializer(serializers.Serializer):
    """Serializer for area geometries response"""

    type = serializers.CharField(default="FeatureCollection")
    features = AreaGeometryFeatureSerializer(many=True)

    def create(self, validated_data): ...
    def update(self, instance, validated_data): ...


class VisitorSerializer(serializers.ModelSerializer):
    """Serializer for visitor data"""

    class Meta:
        model = Visitor
        fields = "__all__"

    domain = serializers.SerializerMethodField()

    def get_domain(self, obj: Visitor) -> str:
        return str(obj.domain)


class UserAgentDistributionSerializer(serializers.Serializer):
    """Serializer for user agent distribution response"""

    browser = serializers.CharField()
    count = serializers.IntegerField()

    def create(self, validated_data): ...
    def update(self, instance, validated_data): ...

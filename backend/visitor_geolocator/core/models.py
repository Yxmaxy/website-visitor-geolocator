import uuid

from django.conf import settings
from django.db import models
from django.contrib.gis.db import models as gis_models


class WebsiteVisitorGeolocatorPermissions(models.Model):
    class Meta:
        permissions = [
            (
                "website_visitor_geolocator_enabled",
                "Is the website visitor geolocator enabled for the user",
            ),
        ]


class WebsiteVisitorGeolocatorUser(models.Model):
    class Meta:
        db_table = "website_visitor_geolocator_core_user"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="website_visitor_geolocator_user",
    )

    def __str__(self):
        return str(self.user.email)


class Domain(models.Model):
    class Meta:
        db_table = "website_visitor_geolocator_core_domain"

    domain = models.URLField(
        max_length=255,
        help_text="The domain of the website to track eg. https://www.example.com",
    )
    api_key = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        help_text="The API key which is used to authenticate requests",
    )
    created_by = models.ForeignKey(
        WebsiteVisitorGeolocatorUser,
        on_delete=models.CASCADE,
        help_text="The user who created the domain",
    )
    active = models.BooleanField(default=True)

    geolocation_api_token_ipinfo = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="The access token to the IPInfo API",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.domain)

    def save(self, *args, **kwargs):
        """Removes all paths from the domain"""
        self.domain = self.domain.split("/")[0] + "//" + self.domain.split("/")[2]
        super().save(*args, **kwargs)


class Visitor(models.Model):
    class Meta:
        db_table = "website_visitor_geolocator_core_visitor"

    domain = models.ForeignKey(Domain, on_delete=models.CASCADE)

    ip_address = models.GenericIPAddressField()
    location = gis_models.PointField(srid=4326)

    location_description = models.CharField(max_length=255)
    timezone = models.CharField(max_length=255)

    user_agent = models.CharField(max_length=510)
    user_agent_parsed = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.ip_address} - {self.domain} - {self.created_at}"

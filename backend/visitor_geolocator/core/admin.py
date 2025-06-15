from django.contrib import admin

from visitor_geolocator.core.models import Domain, Visitor


@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ("domain", "api_key", "created_by")
    search_fields = ("domain", "api_key")
    list_filter = ("created_at", "created_by")


@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    list_display = ("ip_address", "domain", "created_at")
    search_fields = ("ip_address", "domain")
    list_filter = ("created_at",)

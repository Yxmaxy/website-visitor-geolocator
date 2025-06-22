from django.contrib import admin

from visitor_geolocator.notifications.models import PushSubscription


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "website_visitor_geolocator_user",
        "endpoint",
        "created_at",
        "updated_at",
    )
    list_filter = ("created_at", "updated_at")
    search_fields = (
        "website_visitor_geolocator_user__user__username",
        "website_visitor_geolocator_user__user__email",
        "endpoint",
    )
    readonly_fields = ("created_at", "updated_at")

    def has_add_permission(self, request):
        # NOTE: Subscriptions should only be created via the API
        return False

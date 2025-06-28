from django.contrib import admin

from visitor_geolocator.notifications.models import (
    PushSubscription,
    NotificationPreferences,
)


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


@admin.register(NotificationPreferences)
class NotificationPreferencesAdmin(admin.ModelAdmin):
    list_display = (
        "website_visitor_geolocator_user",
        "notification_chance",
        "new_visitor_notifications",
        "daily_summary_notifications",
        "weekly_summary_notifications",
        "notification_vibration",
        "created_at",
        "updated_at",
    )
    list_filter = (
        "new_visitor_notifications",
        "daily_summary_notifications",
        "weekly_summary_notifications",
        "notification_vibration",
        "created_at",
        "updated_at",
    )
    search_fields = ("website_visitor_geolocator_user__user__email",)
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        ("User", {"fields": ("website_visitor_geolocator_user",)}),
        (
            "Notification Settings",
            {
                "fields": (
                    "notification_chance",
                    "new_visitor_notifications",
                    "daily_summary_notifications",
                    "weekly_summary_notifications",
                )
            },
        ),
        ("Timing", {"fields": ("quiet_hours_start", "quiet_hours_end")}),
        ("Effects", {"fields": ("notification_vibration",)}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

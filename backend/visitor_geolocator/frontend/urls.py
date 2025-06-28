from django.urls import path

from visitor_geolocator.frontend import views


urlpatterns = [
    # User
    path(
        "user/",
        views.UserAPIView.as_view(),
        name="retrieve_user_api",
    ),
    path(
        "logout/",
        views.LogoutView.as_view(),
        name="logout_api",
    ),
    # Domain management
    path(
        "domain/",
        views.DomainListCreateAPIView.as_view(),
        name="domain_list_create_api",
    ),
    path(
        "domain/<int:pk>/",
        views.DomainRetrieveUpdateDestroyAPIView.as_view(),
        name="domain_retrieve_update_destroy_api",
    ),
    # Settings
    path(
        "settings/notifications/",
        views.NotificationPreferencesAPIView.as_view(),
        name="notification_preferences_api",
    ),
]

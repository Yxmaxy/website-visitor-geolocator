from django.urls import path

from visitor_geolocator.notifications import views

app_name = "wvg_notifications"

urlpatterns = [
    path("subscribe/", views.PushSubscriptionView.as_view(), name="subscribe_push"),
    path("unsubscribe/", views.PushSubscriptionView.as_view(), name="unsubscribe_push"),
    path("status/", views.SubscriptionStatusView.as_view(), name="subscription_status"),
    path(
        "service-worker-push/",
        views.ServiceWorkerPushView.as_view(),
        name="service_worker_push",
    ),
]

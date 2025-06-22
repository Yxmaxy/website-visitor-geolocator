from django.urls import path
from . import views

app_name = "wvg_notifications"

urlpatterns = [
    path("subscribe/", views.subscribe_push, name="subscribe_push"),
    path("unsubscribe/", views.unsubscribe_push, name="unsubscribe_push"),
    path("status/", views.get_subscription_status, name="subscription_status"),
    path("service-worker-push/", views.service_worker_push, name="service_worker_push"),
]

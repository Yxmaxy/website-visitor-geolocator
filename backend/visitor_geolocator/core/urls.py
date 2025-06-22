from django.urls import path
from . import views

app_name = "wvg_core"

urlpatterns = [
    path(
        "user/",
        views.retrieve_user,
        name="retrieve_user",
    ),
    path(
        "visitor/",
        views.visitor,
        name="website_visitor_geolocator_visitor",
    ),
    path(
        "tracking.js",
        views.tracking_script,
        name="website_visitor_geolocator_tracking_script",
    ),
]

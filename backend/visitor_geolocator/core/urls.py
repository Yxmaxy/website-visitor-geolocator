from django.urls import path
from . import views

app_name = "wvg_core"

urlpatterns = [
    path(
        "visitor/",
        views.track_visitor,
        name="website_visitor_geolocator_visitor",
    ),
    path(
        "tracking.js",
        views.tracking_script,
        name="website_visitor_geolocator_tracking_script",
    ),
]

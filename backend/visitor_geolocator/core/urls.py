from django.urls import path
from . import views

app_name = "wvg_core"

urlpatterns = [
    path(
        "track-visitor/",
        views.track_visitor,
        name="website_visitor_geolocator_track_visitor",
    ),
    path(
        "tracking.js",
        views.tracking_script,
        name="website_visitor_geolocator_tracking_script",
    ),
]

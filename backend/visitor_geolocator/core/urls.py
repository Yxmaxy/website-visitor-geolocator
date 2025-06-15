from django.urls import path
from . import views

urlpatterns = [
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

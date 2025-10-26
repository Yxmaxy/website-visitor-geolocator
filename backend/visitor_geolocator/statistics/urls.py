from django.urls import path

from visitor_geolocator.statistics import views

app_name = "wvg_statistics"

urlpatterns = [
    path(
        "geometries/", views.AreaGeometriesAPIView.as_view(), name="area_geometries_api"
    ),
    path("area/", views.AreaStatisticsAPIView.as_view(), name="area_statistics_api"),
    path(
        "visitor/list/",
        views.VisitorListAPIView.as_view(),
        name="visitor_list_api",
    ),
    path(
        "user-agents/",
        views.UserAgentDistributionAPIView.as_view(),
        name="user_agent_distribution_api",
    ),
]

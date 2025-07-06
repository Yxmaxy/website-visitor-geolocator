from django.urls import path

from visitor_geolocator.statistics import views

app_name = "wvg_statistics"

urlpatterns = [
    path("area/", views.AreaStatisticsAPIView.as_view(), name="area_statistics_api"),
    path(
        "geometries/", views.AreaGeometriesAPIView.as_view(), name="area_geometries_api"
    ),
    path(
        "visitors/",
        views.LatestVisitorsAPIView.as_view(),
        name="latest_visitors_api",
    ),
    path(
        "user-agents/",
        views.UserAgentDistributionAPIView.as_view(),
        name="user_agent_distribution_api",
    ),
]

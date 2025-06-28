from django.urls import path
from . import views

urlpatterns = [
    # User
    path(
        "user/",
        views.retrieve_user,
        name="retrieve_user",
    ),
    # Domain management
    path(
        "domain/list/",
        views.domain_list,
        name="domain_list",
    ),
    path(
        "domain/create/",
        views.domain_create,
        name="domain_create",
    ),
    path(
        "domain/<int:domain_id>/",
        views.domain_detail,
        name="domain_detail",
    ),
]

from django.urls import reverse
from django.conf import settings
from django.http.request import HttpRequest
from django.http.response import HttpResponse
from django.views.decorators.http import require_http_methods
from django.template.loader import render_to_string
from django.views.decorators.cache import cache_page

from visitor_geolocator.core.services import DomainService
from visitor_geolocator.notifications.services import VisitorNotificationService


def _add_cors_headers(response: HttpResponse) -> HttpResponse:
    """Add CORS headers to the response for visitor tracking endpoint."""
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, X-Access-Token"
    return response


@require_http_methods(["GET"])
@cache_page(settings.WEBSITE_VISITOR_GEOLOCATOR_TRACKING_SCRIPT_CACHE_MAX_AGE)
def tracking_script(request: HttpRequest):
    """Serves the tracking script that will be embedded on client websites."""

    host = f"{request.scheme}://{request.get_host()}"
    endpoint = reverse("wvg_core:website_visitor_geolocator_track_visitor")
    api_key = request.GET.get("api_key")

    script_content = render_to_string(
        "tracking_script.txt",
        {
            "host": host,
            "endpoint": endpoint,
            "api_key": api_key,
            "cookie_expiration": settings.WEBSITE_VISITOR_GEOLOCATOR_TRACKING_COOLDOWN,
        },
    )
    response = HttpResponse(script_content, content_type="application/javascript")
    response["Access-Control-Allow-Origin"] = "*"

    # headers for caching in browser
    response["Cache-Control"] = (
        f"private, max-age={settings.WEBSITE_VISITOR_GEOLOCATOR_TRACKING_SCRIPT_CACHE_MAX_AGE}"
    )
    response["ETag"] = f'"{hash(script_content)}"'

    return response


@require_http_methods(["GET", "OPTIONS"])
def track_visitor(request: HttpRequest):
    """Creates a visitor record based on the request."""

    if request.method == "OPTIONS":
        return _add_cors_headers(HttpResponse(status=200))

    # get domain and visitor data from request
    origin = DomainService.extract_domain_name(request)
    api_key = request.headers.get("X-Access-Token")
    domain = DomainService.get_domain(origin, api_key)

    if not domain:
        return _add_cors_headers(
            HttpResponse(status=403, content="Invalid credentials")
        )

    visitor, success = DomainService.save_domain_visitor(domain, request)
    if not success:
        return _add_cors_headers(
            HttpResponse(status=500, content="Failed to save visitor")
        )

    # Send notification for new visitor
    if visitor and settings.WEBSITE_VISITOR_GEOLOCATOR_NOTIFICATIONS_ENABLED:
        VisitorNotificationService.handle_new_visitor(visitor)

    return _add_cors_headers(HttpResponse(status=200))

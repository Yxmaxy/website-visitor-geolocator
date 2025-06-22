from django.http import HttpRequest
from django.urls import reverse


class VisitorCorsMiddleware:
    """Middleware to handle CORS for visitor tracking endpoint."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        response = self.get_response(request)

        # Only allow all origins for visitor tracking endpoint
        if reverse("wvg_core:website_visitor_geolocator_visitor") in request.path:
            response["Access-Control-Allow-Origin"] = "*"
            response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, X-Access-Token"

        return response

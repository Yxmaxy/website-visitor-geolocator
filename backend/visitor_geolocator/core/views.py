from django.urls import reverse
from django.conf import settings
from django.http.request import HttpRequest
from django.http.response import HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods

from visitor_geolocator.core.services import DomainService
from visitor_geolocator.notifications.services import NotificationService
from visitor_geolocator.core.models import WebsiteVisitorGeolocatorUser


@login_required
@require_http_methods(["GET"])
def retrieve_user(request: HttpRequest):
    """Retrieves the user from the request."""
    user, _ = WebsiteVisitorGeolocatorUser.objects.get_or_create(user=request.user)
    return JsonResponse({"success": True, "user": user.user.email})


@require_http_methods(["GET"])
def tracking_script(request: HttpRequest):
    """Serves the tracking script that will be embedded on client websites."""

    host = f"{request.scheme}://{request.get_host()}"
    endpoint = reverse("wvg_core:website_visitor_geolocator_visitor")
    api_key = request.GET.get("api_key")

    script_content = f"""
    (async function() {{
        // Check if cookie exists
        function getCookie(name) {{
            const value = '; ' + document.cookie;
            const parts = value.split('; ' + name + '=');
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        }}

        if (getCookie('_wvg_tracking')) {{
            return;
        }}

        const endpoint = "{host}{endpoint}";
        const apiKey = "{api_key}";
        
        if (!apiKey) {{
            console.error("Website Visitor Geolocator: API key is required");
            return;
        }}

        try {{
            const response = await fetch(endpoint, {{
                method: "GET",
                headers: {{
                    "X-Access-Token": apiKey
                }}
            }});
            
            if (response.ok) {{
                // Set cookie that expires in 10 hours
                const expires = new Date();
                expires.setTime(expires.getTime() + (10 * 60 * 60 * 1000));
                document.cookie = '_wvg_tracking=true; expires=' + expires.toUTCString() + '; path=/';
            }}
        }} catch (error) {{
            console.error("Website Visitor Geolocator:", error);
        }}
    }})();
    """
    response = HttpResponse(script_content, content_type="application/javascript")
    response["Access-Control-Allow-Origin"] = "*"
    return response


@require_http_methods(["GET", "OPTIONS"])
def visitor(request: HttpRequest):
    """Creates a visitor record based on the request."""

    # TODO: add ip to cache - don't process on every request
    # refresh cookie on every request

    # handle CORS preflight request
    if request.method == "OPTIONS":
        return HttpResponse(status=200)

    # get domain and visitor data from request
    origin = request.headers.get("Origin")
    api_key = request.headers.get("X-Access-Token")
    domain = DomainService.get_domain(origin, api_key)

    if not domain:
        return HttpResponse(status=403, content="Invalid credentials")

    visitor, success = DomainService.save_domain_visitor(domain, request)
    if not success:
        return HttpResponse(status=500, content="Failed to save visitor")

    # Send notification for new visitor
    if settings.WEBSITE_VISITOR_GEOLOCATOR_NOTIFICATIONS_ENABLED:
        NotificationService.handle_new_visitor(visitor)

    return HttpResponse(status=200)

from django.http.request import HttpRequest
from django.http.response import HttpResponse
from django.urls import reverse

from visitor_geolocator.core.services import DomainService


def tracking_script(request: HttpRequest):
    """Serves the tracking script that will be embedded on client websites."""

    host = f"{request.scheme}://{request.get_host()}"
    endpoint = reverse("website_visitor_geolocator_visitor")
    api_key = request.GET.get("api_key")

    script_content = f"""
    (function() {{
        // Check if cookie exists
        function getCookie(name) {{
            const value = `; ${{document.cookie}}`;
            const parts = value.split(`; ${{name}}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
        }}

        if (getCookie('_wvg_tracking')) {{
            return;
        }}

        // Set cookie that expires in 10 hours
        const expires = new Date();
        expires.setTime(expires.getTime() + (10 * 60 * 60 * 1000));
        document.cookie = '_wvg_tracking=true; expires=' + expires.toUTCString() + '; path=/';

        const endpoint = "{host}{endpoint}";
        const apiKey = "{api_key}";
        
        if (!apiKey) {{
            console.error("Website Visitor Geolocator: API key is required");
            return;
        }}

        fetch(endpoint, {{
            method: "GET",
            headers: {{
                "X-Access-Token": apiKey
            }}
        }}).catch(error => {{
            console.error("Website Visitor Geolocator:", error);
        }});
    }})();
    """
    response = HttpResponse(script_content, content_type="application/javascript")
    response["Access-Control-Allow-Origin"] = "*"
    return response


def visitor(request: HttpRequest):
    """Creates a visitor record based on the request."""

    def _add_cors_headers(response: HttpResponse):
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, X-Access-Token"
        return response

    # handle CORS preflight request
    if request.method == "OPTIONS":
        return _add_cors_headers(HttpResponse(status=200))

    # get domain and visitor data from request
    origin = request.headers.get("Origin")
    api_key = request.headers.get("X-Access-Token")
    domain = DomainService.get_domain(origin, api_key)

    if not domain:
        return _add_cors_headers(HttpResponse(status=404, content="Domain not found"))

    if not DomainService.save_domain_visitor(domain, request):
        return _add_cors_headers(
            HttpResponse(status=500, content="Failed to save visitor")
        )

    # if settings.WEBSITE_VISITOR_GEOLOCATOR_NOTIFICATIONS_ENABLED:
    #     NotificationService.handle_new_visitor(domain, request)
    return _add_cors_headers(HttpResponse(status=200))

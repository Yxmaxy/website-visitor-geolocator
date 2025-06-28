import json

from django.http import HttpRequest, JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods

from visitor_geolocator.core.models import Domain, WebsiteVisitorGeolocatorUser
from visitor_geolocator.core.services import DomainService
from .serializers import serialize_domain


@login_required
@require_http_methods(["GET"])
def retrieve_user(request: HttpRequest):
    """Retrieves the user from the request."""
    user, _ = WebsiteVisitorGeolocatorUser.objects.get_or_create(user=request.user)
    return JsonResponse({"success": True, "user": user.user.email})


# Domain management


@login_required
@require_http_methods(["GET"])
def domain_list(request: HttpRequest):
    """Get all domains for the authenticated user."""
    domains = Domain.objects.filter(
        created_by=request.user.website_visitor_geolocator_user
    )
    domains_data = []

    for domain in domains:
        domains_data.append(
            serialize_domain(
                domain,
                script_url=DomainService.get_script_url(domain, request),
            )
        )

    return JsonResponse(domains_data, safe=False)


@login_required
@require_http_methods(["POST"])
def domain_create(request: HttpRequest):
    """Create a new domain for the authenticated user."""
    data = json.loads(request.body)
    domain_url = data.get("domain", "").strip()
    ipinfo_token = data.get("geolocation_api_token_ipinfo", "").strip()

    if not domain_url:
        return JsonResponse({"error": "Domain is required"}, status=400)

    domain = Domain.objects.create(
        domain=domain_url,
        geolocation_api_token_ipinfo=ipinfo_token,
        created_by=request.user.website_visitor_geolocator_user,
    )

    domain_data = serialize_domain(
        domain,
        script_url=DomainService.get_script_url(domain, request),
    )

    return JsonResponse(domain_data, status=201)


@login_required
@require_http_methods(["GET", "PUT", "DELETE"])
def domain_detail(request: HttpRequest, domain_id: int):
    """Get, update, or delete a specific domain."""
    try:
        domain = Domain.objects.get(
            id=domain_id, created_by=request.user.website_visitor_geolocator_user
        )
    except Domain.DoesNotExist:
        return JsonResponse({"error": "Domain not found"}, status=404)

    if request.method == "GET":
        domain_data = serialize_domain(domain)
        return JsonResponse(domain_data)

    if request.method == "PUT":
        data = json.loads(request.body)

        domain.domain = data["domain"].strip()
        domain.geolocation_api_token_ipinfo = data[
            "geolocation_api_token_ipinfo"
        ].strip()
        domain.active = data["active"]

        domain.save()

        domain_data = serialize_domain(domain)
        return JsonResponse(domain_data)

    if request.method == "DELETE":
        domain.delete()
        return JsonResponse({}, status=204)

    return HttpResponse(status=405)

from visitor_geolocator.core.models import Domain


def serialize_domain(domain: Domain, **kwargs):
    return {
        "id": domain.id,
        "domain": domain.domain,
        "api_key": str(domain.api_key),
        "geolocation_api_token_ipinfo": domain.geolocation_api_token_ipinfo,
        "active": domain.active,
        "created_at": domain.created_at.isoformat(),
        **kwargs,
    }

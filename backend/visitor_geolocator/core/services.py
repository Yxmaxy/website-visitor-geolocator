from typing import Optional
from ipware import get_client_ip
import requests

from django.http.request import HttpRequest
from django.core.cache import cache
from django.contrib.gis.geos import Point

from visitor_geolocator.core.models import Domain, Visitor


class DomainService:
    @staticmethod
    def get_domain(
        domain_name: str, api_key: str, ignore_cache: bool = False
    ) -> Optional[Domain]:
        cache_key = f"domain_{domain_name}"

        if not ignore_cache:
            if domain := cache.get(cache_key):
                return domain

        domain = None
        try:
            domain = Domain.objects.get(domain=domain_name, api_key=api_key)
        except Domain.DoesNotExist:
            pass

        if domain:
            cache.set(cache_key, domain, timeout=60 * 60 * 24)  # 24 hours

        return domain

    @staticmethod
    def save_domain_visitor(domain: Domain, request: HttpRequest) -> bool:
        ip_address, _ = get_client_ip(request)

        visitor = GeolocationService.get_visitor_ipinfo(
            ip_address, domain.geolocation_api_token_ipinfo
        )
        if not visitor:
            visitor = GeolocationService.get_visitor_ipapi(ip_address)
            if not visitor:
                return False

        # add request data
        visitor.domain = domain
        visitor.user_agent = request.META.get("HTTP_USER_AGENT")

        visitor.save()
        return True


class GeolocationService:
    @staticmethod
    def get_visitor_ipinfo(
        ip_address: str, access_token: str, ignore_cache: bool = False
    ) -> Optional[Visitor]:
        if ip_address in ["127.0.0.1", "localhost"]:
            return Visitor(
                ip_address=ip_address,
                location=Point(x=0, y=0),
                location_description="Localhost",
                timezone="UTC",
            )

        cache_key = f"visitor_ipinfo_{ip_address}"
        visitor_data = cache.get(cache_key)
        if not visitor_data or ignore_cache:
            response = requests.get(
                f"https://ipinfo.io/{ip_address}?token={access_token}", timeout=20
            )
            try:
                visitor_data: dict = response.json()
                cache.set(cache_key, visitor_data, timeout=60 * 60 * 24)  # 24 hours
            except requests.exceptions.JSONDecodeError:
                return None

        # parse values
        location = None
        lat, lng = visitor_data.get("loc", ",").split(",")
        if lat and lng:
            location = Point(x=float(lng), y=float(lat))

        location_description = [
            visitor_data.get("city"),
            visitor_data.get("region"),
            visitor_data.get("country"),
        ]
        location_description = ", ".join(dict.fromkeys(location_description))

        visitor = Visitor(
            ip_address=ip_address,
            location=location,
            location_description=location_description,
            timezone=visitor_data.get("timezone"),
        )
        return visitor

    @staticmethod
    def get_visitor_ipapi(
        ip_address: str, ignore_cache: bool = False
    ) -> Optional[Visitor]:
        if ip_address in ["127.0.0.1", "localhost"]:
            return Visitor(
                ip_address=ip_address,
                location=Point(x=0, y=0),
                location_description="Localhost",
                timezone="UTC",
            )

        cache_key = f"visitor_ipapi_{ip_address}"
        visitor_data = cache.get(cache_key)
        if not visitor_data or ignore_cache:
            response = requests.get(f"https://ip-api.com/json/{ip_address}", timeout=20)
            try:
                visitor_data: dict = response.json()
                cache.set(cache_key, visitor_data, timeout=60 * 60 * 24)  # 24 hours
            except requests.exceptions.JSONDecodeError:
                return None

        # parse values
        location = Point(x=visitor_data.get("lon"), y=visitor_data.get("lat"))

        location_description = [
            visitor_data.get("city"),
            visitor_data.get("regionName"),
            visitor_data.get("countryCode"),
        ]
        location_description = ", ".join(dict.fromkeys(location_description))

        visitor = Visitor(
            ip_address=ip_address,
            location=location,
            location_description=location_description,
            timezone=visitor_data.get("timezone"),
        )
        return visitor

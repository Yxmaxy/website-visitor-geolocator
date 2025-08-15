from typing import Optional
from urllib.parse import urlparse
from datetime import timedelta
from ipware import get_client_ip
import requests

from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
from django.http.request import HttpRequest
from django.contrib.gis.geos import Point
from django.contrib.auth.models import AbstractUser
from django.db.models import QuerySet

from visitor_geolocator.core.models import Domain, Visitor, WebsiteVisitorGeolocatorUser


# pylint: disable=too-few-public-methods
class UserService:
    @staticmethod
    def get_wvg_user(user: AbstractUser) -> WebsiteVisitorGeolocatorUser:
        wvg_user, _ = WebsiteVisitorGeolocatorUser.objects.get_or_create(user=user)
        return wvg_user


class DomainService:
    @staticmethod
    def extract_domain_name(request: HttpRequest) -> str:
        if domain_name := request.headers.get("Origin"):
            return domain_name

        if referer := request.headers.get("Referer"):
            parsed_url = urlparse(referer)
            return f"{parsed_url.scheme}://{parsed_url.netloc}"

        if host := request.headers.get("Host"):
            return f"{request.scheme}://{host}"

        return None

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
    def get_owner_domains(user: WebsiteVisitorGeolocatorUser) -> QuerySet[Domain]:
        return Domain.objects.filter(created_by=user)

    @staticmethod
    def is_visitor_in_cooldown(ip_address: str, domain: Domain) -> bool:
        return Visitor.objects.filter(
            ip_address=ip_address,
            domain=domain,
            created_at__gte=timezone.now()
            - timedelta(seconds=settings.WEBSITE_VISITOR_GEOLOCATOR_TRACKING_COOLDOWN),
        ).exists()

    @staticmethod
    def save_domain_visitor(
        domain: Domain, request: HttpRequest
    ) -> tuple[Visitor, bool]:
        ip_address, _ = get_client_ip(request)

        visitor = GeolocationService.get_visitor_ipinfo(
            ip_address, domain.geolocation_api_token_ipinfo
        )
        if not visitor:
            visitor = GeolocationService.get_visitor_ipapi(ip_address)
            if not visitor:
                return None, False

        # add request data
        visitor.domain = domain
        visitor.user_agent = request.META.get("HTTP_USER_AGENT")

        if DomainService.is_visitor_in_cooldown(ip_address, domain):
            return None, True

        visitor.save()
        return visitor, True

    @staticmethod
    def get_script_url(domain: Domain, request: HttpRequest):
        host = f"{request.scheme}://{request.get_host()}"
        return f"{host}/wvg/tracking.js?api_key={domain.api_key}"


class GeolocationService:
    @staticmethod
    def _create_localhost_visitor(ip_address: str) -> Visitor:
        return Visitor(
            ip_address=ip_address,
            location=Point(x=14.505751, y=46.056946, srid=4326),
            location_description="Localhost",
            timezone="UTC",
        )

    @staticmethod
    def _get_cached_or_fetch_data(
        cache_key: str, url: str, ignore_cache: bool = False, **request_kwargs
    ) -> Optional[dict]:
        visitor_data = cache.get(cache_key)
        if not visitor_data or ignore_cache:
            response = requests.get(url, timeout=20, **request_kwargs)
            try:
                visitor_data = response.json()
                cache.set(cache_key, visitor_data, timeout=60 * 60 * 24)  # 24 hours
            except requests.exceptions.JSONDecodeError:
                return None
        return visitor_data

    @staticmethod
    def _create_visitor_from_data(
        ip_address: str,
        visitor_data: dict,
        location_parser: callable,
        description_fields: list,
    ) -> Visitor:
        location = location_parser(visitor_data)

        location_description = [visitor_data.get(field) for field in description_fields]
        location_description = ", ".join(dict.fromkeys(location_description))

        return Visitor(
            ip_address=ip_address,
            location=location,
            location_description=location_description,
            timezone=visitor_data.get("timezone"),
        )

    @staticmethod
    def get_visitor_ipinfo(
        ip_address: str, access_token: str, ignore_cache: bool = False
    ) -> Optional[Visitor]:
        if ip_address in ["127.0.0.1", "localhost"]:
            return GeolocationService._create_localhost_visitor(ip_address)

        cache_key = f"visitor_ipinfo_{ip_address}"
        url = f"https://ipinfo.io/{ip_address}?token={access_token}"

        visitor_data = GeolocationService._get_cached_or_fetch_data(
            cache_key, url, ignore_cache
        )
        if not visitor_data:
            return None

        def parse_ipinfo_location(data: dict) -> Optional[Point]:
            lat, lng = data.get("loc", ",").split(",")
            if lat and lng:
                return Point(x=float(lng), y=float(lat))
            return None

        return GeolocationService._create_visitor_from_data(
            ip_address,
            visitor_data,
            parse_ipinfo_location,
            ["city", "region", "country"],
        )

    @staticmethod
    def get_visitor_ipapi(
        ip_address: str, ignore_cache: bool = False
    ) -> Optional[Visitor]:
        if ip_address in ["127.0.0.1", "localhost"]:
            return GeolocationService._create_localhost_visitor(ip_address)

        cache_key = f"visitor_ipapi_{ip_address}"
        url = f"https://ip-api.com/json/{ip_address}"

        visitor_data = GeolocationService._get_cached_or_fetch_data(
            cache_key, url, ignore_cache
        )
        if not visitor_data:
            return None

        def parse_ipapi_location(data: dict) -> Point:
            return Point(x=data.get("lon"), y=data.get("lat"))

        return GeolocationService._create_visitor_from_data(
            ip_address,
            visitor_data,
            parse_ipapi_location,
            ["city", "regionName", "countryCode"],
        )

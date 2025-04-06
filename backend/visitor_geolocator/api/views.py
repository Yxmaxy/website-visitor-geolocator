from django.http import HttpRequest, JsonResponse

from visitor_geolocator.models import Domain, GeolocationAPI


def ping(request: HttpRequest) -> JsonResponse:
    return JsonResponse({"message": "pong"})

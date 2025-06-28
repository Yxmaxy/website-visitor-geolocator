import json

from django.http.request import HttpRequest
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required

from visitor_geolocator.notifications.services import NotificationService


@login_required
@require_http_methods(["POST"])
def subscribe_push(request: HttpRequest):
    """Subscribe to push notifications"""
    try:
        data = json.loads(request.body)
        endpoint = data.get("endpoint")
        p256dh = data.get("keys", {}).get("p256dh")
        auth = data.get("keys", {}).get("auth")

        if not all([endpoint, p256dh, auth]):
            return JsonResponse(
                {"success": False, "error": "Missing required subscription data"},
                status=400,
            )

        NotificationService.create_subscription(
            user=request.user, endpoint=endpoint, p256dh=p256dh, auth=auth
        )

        return JsonResponse(
            {
                "success": True,
                "message": "Successfully subscribed to push notifications",
            }
        )

    except Exception as e:  # pylint: disable=broad-exception-caught
        return JsonResponse(
            {"success": False, "error": str(e)},
            status=500,
        )


@login_required
@require_http_methods(["DELETE"])
def unsubscribe_push(request: HttpRequest):
    """Unsubscribe from push notifications"""
    try:
        if not NotificationService.delete_subscription(request.user):
            return JsonResponse(
                {"success": False, "error": "Failed to unsubscribe"},
                status=500,
            )
        return JsonResponse(
            {
                "success": True,
                "message": "Successfully unsubscribed from push notifications",
            }
        )

    except Exception as e:  # pylint: disable=broad-exception-caught
        return JsonResponse(
            {"success": False, "error": str(e)},
            status=500,
        )


@login_required
@require_http_methods(["GET"])
def get_subscription_status(request: HttpRequest):
    """Get current subscription status"""
    try:
        subscription = NotificationService.get_user_subscription(request.user)

        return JsonResponse(
            {
                "success": True,
                "subscribed": subscription is not None,
                "subscription": subscription.to_dict() if subscription else None,
            }
        )

    except Exception as e:  # pylint: disable=broad-exception-caught
        return JsonResponse(
            {"success": False, "error": str(e)},
            status=500,
        )


@csrf_exempt
@require_http_methods(["POST"])
def service_worker_push(request: HttpRequest):
    """Endpoint for service worker to receive push messages"""
    # This endpoint is called by the browser's push service
    # We don't need to do anything here as the actual notification
    # is handled by the service worker on the client side
    return HttpResponse(status=200)

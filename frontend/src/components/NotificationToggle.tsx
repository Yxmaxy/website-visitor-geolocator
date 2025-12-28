import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";

import { PushSubscriptionHelper } from "django-simple-notifications";
import { getCookie } from "django-session-api";

import { toast } from "sonner";


interface NotificationToggleProps {
    className?: string;
    disabled?: boolean;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({ disabled = false }) => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const pushService = new PushSubscriptionHelper({
        baseUrl: import.meta.env.VITE_NOTIFICATIONS_URL,
        appName: import.meta.env.VITE_NOTIFICATIONS_APP_NAME,
        vapidPublicKey: import.meta.env.VITE_NOTIFICATIONS_VAPID_PUBLIC_KEY,
        serverRequestParameters: {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken") ?? "",
            },

        },
    });

    useEffect(() => {
        initializeNotifications();
    }, []);

    const initializeNotifications = async () => {
        setIsLoading(true);
        try {
            const supported = await pushService.initialize();
            setIsSupported(supported);

            if (supported) {
                const subscribed = await pushService.isSubscribed();
                setIsSubscribed(subscribed);
            }
        } catch (error) {
            toast.error("Failed to initialize notifications");
        }
        setIsLoading(false);
    };

    const handleToggle = async () => {
        if (!isSupported) return;

        setIsLoading(true);
        try {
            await pushService.initialize();
            if (isSubscribed) {
                const success = await pushService.unsubscribe();
                if (success) {
                    setIsSubscribed(false);
                } else {
                    toast.error("Failed to unsubscribe from notifications");
                }
            } else {
                const success = await pushService.subscribe();
                if (success) {
                    setIsSubscribed(true);
                } else {
                    toast.error("Failed to subscribe to notifications");
                }
            }
        } catch (error) {
            toast.error("An error occurred while toggling notifications");
        }
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <Button variant="outline" disabled className="w-full">
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Loading ...
            </Button>
        );
    }
    if (!isSupported) {
        return (
            <Button variant="outline" disabled className="w-full">
                <BellOff className="h-4 w-4 mr-1" />
                Notifications not supported
            </Button>
        );
    }

    return (
        <Button
            onClick={handleToggle}
            disabled={disabled}
            variant="outline"
            className="w-full"
        >
            {isSubscribed ? <Bell className="h-4 w-4 mr-1" /> : <BellOff className="h-4 w-4 mr-1" />}
            {isSubscribed ? "Notifications ON" : "Notifications OFF"}
        </Button>
    );
};

export default NotificationToggle;

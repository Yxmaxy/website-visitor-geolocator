import { useState, useEffect } from "react";

import PushNotificationService from "@/services/pushNotifications";


interface NotificationToggleProps {
    className?: string;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({ className = "" }) => {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        initializeNotifications();
    }, []);

    const initializeNotifications = async () => {
        try {
            const pushService = PushNotificationService.getInstance();
            const supported = await pushService.initialize();
            setIsSupported(supported);

            if (supported) {
                const subscribed = await pushService.isSubscribed();
                setIsSubscribed(subscribed);
            }
        } catch (err) {
            setError("Failed to initialize notifications");
            console.error("Error initializing notifications:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async () => {
        if (!isSupported) return;

        setIsLoading(true);
        setError(null);

        try {
            const pushService = PushNotificationService.getInstance();

            if (isSubscribed) {
                const success = await pushService.unsubscribe();
                if (success) {
                    setIsSubscribed(false);
                } else {
                    setError("Failed to unsubscribe from notifications");
                }
            } else {
                const success = await pushService.subscribe();
                if (success) {
                    setIsSubscribed(true);
                } else {
                    setError("Failed to subscribe to notifications");
                }
            }
        } catch (err) {
            setError("An error occurred while toggling notifications");
            console.error("Error toggling notifications:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={className}>
                <button disabled>
                    Loading...
                </button>
            </div>
        );
    }

    if (!isSupported) {
        return (
            <div className={className}>
                <button disabled>
                    Notifications not supported
                </button>
            </div>
        );
    }

    return (
        <div className={className}>
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`${isSubscribed ? "subscribed" : "unsubscribed"}`}
            >
                {isSubscribed ? "🔔 Notifications ON" : "🔕 Notifications OFF"}
            </button>
            {error && <div>{error}</div>}
        </div>
    );
};

export default NotificationToggle;

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

import PushNotificationService from "@/services/pushNotifications";


interface NotificationToggleProps {
    className?: string;
    disabled?: boolean;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({ className = "", disabled = false }) => {
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
        } catch (error) {
            setError("Failed to initialize notifications");
            throw error;
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
        } catch (error) {
            setError("An error occurred while toggling notifications");
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={className} >
                <Button disabled={disabled || isLoading} className="w-full">
                    Loading...
                </Button>
            </div>
        );
    }

    if (!isSupported) {
        return (
            <div className={className}>
                <Button disabled={disabled} className="w-full">
                    Notifications not supported
                </Button>
            </div>
        );
    }

    return (
        <div className={className}>
            <Button
                onClick={handleToggle}
                disabled={disabled || isLoading}
                variant={isSubscribed ? "default" : "outline"}
                className="w-full"
            >
                {isSubscribed ? <Bell className="h-4 w-4 mr-1" /> : <BellOff className="h-4 w-4 mr-1" />}
                {isSubscribed ? "Notifications ON" : "Notifications OFF"}
            </Button>
            {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
        </div>
    );
};

export default NotificationToggle;

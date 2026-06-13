import { createDjangoApi } from "@yxmaxy/django-session-api";

const api = createDjangoApi({
    baseUrl: import.meta.env.VITE_BASE_BACKEND_API_URL,
    loginUrl: import.meta.env.VITE_LOGIN_URL,
});

export interface PushNotificationPreferences {
    notification_frequency: number;
    quiet_hours_start: string | null;
    quiet_hours_end: string | null;
    quiet_hours_timezone: string;
}

export interface SummaryNotificationPreferences {
    new_visitor_notifications: boolean;
    daily_summary_notifications: boolean;
    weekly_summary_notifications: boolean;
}

class SettingsApiService {
    static async getPushNotificationPreferences(): Promise<PushNotificationPreferences> {
        return api.get<PushNotificationPreferences>("/settings/notifications/");
    }

    static async updatePushNotificationPreferences(
        preferences: Partial<PushNotificationPreferences>
    ): Promise<PushNotificationPreferences> {
        return api.put<PushNotificationPreferences, any>(
            "/settings/notifications/",
            preferences
        );
    }

    static async getSummaryNotificationPreferences(): Promise<SummaryNotificationPreferences> {
        return api.get<SummaryNotificationPreferences>("/settings/notifications/");
    }

    static async updateSummaryNotificationPreferences(
        preferences: Partial<SummaryNotificationPreferences>
    ): Promise<SummaryNotificationPreferences> {
        return api.put<SummaryNotificationPreferences, any>(
            "/settings/notifications/",
            preferences
        );
    }
}

export default SettingsApiService;

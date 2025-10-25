import { ApiService } from "@/services/api/api";

export interface NotificationPreferences {
    id?: number;
    notification_chance: number;
    new_visitor_notifications: boolean;
    daily_summary_notifications: boolean;
    weekly_summary_notifications: boolean;
    quiet_hours_start: string | null;
    quiet_hours_end: string | null;
    notification_vibration: boolean;
    created_at?: string;
    updated_at?: string;
}

class SettingsApiService {
    static async getNotificationPreferences(): Promise<NotificationPreferences> {
        return ApiService.get<NotificationPreferences>("/settings/notifications/");
    }

    static async updateNotificationPreferences(
        preferences: Partial<NotificationPreferences>
    ): Promise<NotificationPreferences> {
        return ApiService.put<NotificationPreferences>(
            "/settings/notifications/",
            preferences
        );
    }
}

export default SettingsApiService; 

import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import NotificationToggle from "@/components/NotificationToggle";
import InstallButton from "@/components/InstallButton";

import SettingsApiService from "@/services/api/apiSettings";
import type { SummaryNotificationPreferences } from "@/services/api/apiSettings";

import { APP_VERSION } from "@/services/version";

import {
    Settings as SettingsIcon,
    BellRing,
    LogOut,
    AlertCircle,
    Palette,
    User,
    BellDot,
    Download,
    Trash2,
    ExternalLink,
} from "lucide-react";
import CacheService from "@/services/cache";

// Settings Header Component
function SettingsHeader() {
    return (
        <div className="flex items-center mb-6 min-h-12">
            <div className="flex items-center gap-2">
                <SettingsIcon className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Settings</h1>
            </div>
        </div>
    );
}

// Loading Skeleton Component
function LoadingSkeleton() {
    return (
        <div>
            <div className="flex items-center mb-6 min-h-12">
                <div className="flex items-center gap-2">
                    <SettingsIcon className="h-6 w-6" />
                    <h1 className="text-2xl font-bold">Settings</h1>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <Card className="min-h-48">
                        <CardHeader>
                            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        </CardContent>
                    </Card>
                    <Card className="min-h-42">
                        <CardHeader>
                            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                        </CardContent>
                    </Card>
                </div>
                <Card className="min-h-96">
                    <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Error State Component
interface ErrorStateProps {
    error: string;
}

function ErrorState({ error }: ErrorStateProps) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-5">
                <div className="text-center">
                    <AlertCircle className="h-10 w-10 text-red-500 mb-4 mx-auto" />
                    <h3 className="text-lg font-semibold mb-2">{ error }</h3>

                    <Button onClick={() => window.location.reload()}>Try Again</Button>
                </div>
            </CardContent>
        </Card>
    );
}

// Notification Toggle Card Component
interface NotificationToggleCardProps {
    disabled?: boolean;
}

function NotificationToggleCard({ disabled = false }: NotificationToggleCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-1.5">
                    <BellRing className="h-5 w-5" />
                    Push Notifications
                </CardTitle>
                <CardDescription>
                    Enable or disable browser push notifications
                </CardDescription>
            </CardHeader>
            <CardContent>
                <NotificationToggle disabled={disabled} />
            </CardContent>
        </Card>
    );
}

// Account Card Component
interface AccountCardProps {
    onLogout: () => Promise<void>;
    disabled?: boolean;
}

function AccountCard({ onLogout, disabled = false }: AccountCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-1.5">
                    <User className="h-5 w-5" />
                    Account
                </CardTitle>
                <CardDescription>
                    Manage your account settings
                </CardDescription>
            </CardHeader>

            <CardContent>
                <AlertDialog>

                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full" disabled={disabled}>
                            <LogOut className="h-4 w-4 mr-1" />
                            Logout
                        </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>

                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                You will be logged out of your account. You'll need to log in again to access the application.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onLogout}>
                                Logout
                            </AlertDialogAction>
                        </AlertDialogFooter>

                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

function PushNotificationPreferencesCard() {
    const handleOpenNotificationsSettings = () => {
        window.location.href = import.meta.env.VITE_NOTIFICATIONS_MANAGE_URL;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-1.5">
                    <BellDot className="h-5 w-5" />
                    Notification Preferences
                </CardTitle>
                <CardDescription>
                    Customize how and when you receive push notifications
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <Button variant="outline" size="sm" onClick={handleOpenNotificationsSettings} className="w-full">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open Notifications Settings
                </Button>
            </CardContent>
        </Card>
    );
}

// Summary Notification Preferences Card Component (Coming Soon)
interface SummaryNotificationPreferencesCardProps {
    summaryPreferences: SummaryNotificationPreferences;
    setSummaryPreferences: (preferences: SummaryNotificationPreferences) => void;
}

function SummaryNotificationPreferencesCard({
    summaryPreferences,
    setSummaryPreferences,
}: SummaryNotificationPreferencesCardProps) {
    const handleUpdate = (partial: Partial<SummaryNotificationPreferences>) => {
        setSummaryPreferences({ ...summaryPreferences, ...partial });
    };

    return (
        <Card className="relative">
            <div className="absolute top-0 right-0 left-0 bottom-0 bg-gray-500/50 flex items-center justify-center rounded-xl z-20">
                <p className="text-white text-sm">Coming soon</p>
            </div>

            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-1.5">
                    <BellRing className="h-5 w-5" />
                    Summary Notifications
                </CardTitle>
                <CardDescription>
                    Configure periodic summary notifications for your website
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-medium">New Visitor Alerts</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                            Get notified when new visitors arrive
                        </p>
                    </div>
                    <Switch
                        checked={summaryPreferences.new_visitor_notifications}
                        onCheckedChange={(checked) => handleUpdate({ new_visitor_notifications: checked })}
                    />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Daily Summary</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                            Receive a daily summary of your website's activity
                        </p>
                    </div>
                    <Switch
                        checked={summaryPreferences.daily_summary_notifications}
                        onCheckedChange={(checked) => handleUpdate({ daily_summary_notifications: checked })}
                    />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Weekly Summary</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                            Receive a weekly summary of your website's activity
                        </p>
                    </div>
                    <Switch
                        checked={summaryPreferences.weekly_summary_notifications}
                        onCheckedChange={(checked) => handleUpdate({ weekly_summary_notifications: checked })}
                    />
                </div>

            </CardContent>
        </Card>
    );
}

// Appearance Card Component
function AppearanceCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-1.5">
                    <Palette className="h-5 w-5" />
                    Appearance
                </CardTitle>
                <CardDescription>
                    Customize the appearance of the application
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-end justify-between">
                        <div className="space-y-1">
                            <Label className="text-sm font-medium">Theme</Label>
                            <p className="text-sm text-muted-foreground">
                                Choose your preferred theme
                            </p>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Install Button Card Component
function InstallButtonCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-1.5">
                    <Download className="h-5 w-5" />
                    Install PWA
                </CardTitle>
                <CardDescription>
                    Download the app to your device to get the best experience
                </CardDescription>
            </CardHeader>
            <CardContent>
                <InstallButton className="w-full" />
            </CardContent>
        </Card>
    );
}

// Clear Cache Card Component
function ClearCacheCard() {
    function clearCache() {
        CacheService.clear();
        toast.success("Cache cleared successfully");
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-1.5">
                    <Trash2 className="h-5 w-5" />
                    Clear Local Cache
                </CardTitle>
                <CardDescription>
                    Clear the local cache to refresh the application's data.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Clear locally stored data
                        </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will clear all locally stored data which could temporarily slow down the application.
                            </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={clearCache}>
                                Clear cache
                            </AlertDialogAction>
                        </AlertDialogFooter>

                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

// Version Section Component
function VersionSection() {
    return (
        <div className="text-sm text-muted-foreground mt-6">
            v{APP_VERSION}
        </div>
    );
}

// Main Settings Component
function Settings() {
    const [summaryPreferences, setSummaryPreferences] = useState<SummaryNotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            setLoading(true);
            setError(null);
            const summary = await SettingsApiService.getSummaryNotificationPreferences();
            setSummaryPreferences(summary);
        } catch {
            setError("Failed to load notification preferences");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            window.location.href = import.meta.env.VITE_LOGOUT_URL;
        } catch {
            toast.error("Failed to logout");
        }
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (!summaryPreferences) {
        return <ErrorState error={error || "Failed to load notification preferences"} />;
    }

    return (
        <>
            <SettingsHeader />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <InstallButtonCard />
                    <AppearanceCard />
                    <NotificationToggleCard />
                    <AccountCard onLogout={handleLogout} />
                </div>

                <div className="space-y-6">
                    <PushNotificationPreferencesCard />
                    <SummaryNotificationPreferencesCard
                        summaryPreferences={summaryPreferences}
                        setSummaryPreferences={setSummaryPreferences}
                    />
                    <ClearCacheCard />
                </div>
            </div>
            <VersionSection />
        </>
    );
}

export default Settings;

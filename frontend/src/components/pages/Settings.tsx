import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
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
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ui/theme-toggle";

import NotificationToggle from "@/components/NotificationToggle";
import InstallButton from "@/components/InstallButton";

import SettingsApiService from "@/services/apiSettings";
import type { NotificationPreferences } from "@/services/apiSettings";

import {
    Settings as SettingsIcon,
    BellRing,
    Volume2,
    Clock,
    LogOut,
    AlertCircle,
    Save,
    X,
    Timer,
    Palette,
    User,
    BellDot,
    Download,
    Trash2,
} from "lucide-react";
import CacheService from "@/services/cacheService";

// Settings Header Component
interface SettingsHeaderProps {
    handleSaveSettings: () => void;
}

function SettingsHeader({ handleSaveSettings }: SettingsHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6 h-12">
            <div className="flex items-center gap-2">
                <SettingsIcon className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Settings</h1>
            </div>
            <Button onClick={handleSaveSettings}>
                <Save className="w-4 h-4 mr-1" />
                Save Settings
            </Button>
        </div>
    );
}

// Loading Skeleton Component
function LoadingSkeleton() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6 h-12">
                <div className="flex items-center gap-2">
                    <SettingsIcon className="h-6 w-6" />
                    <h1 className="text-2xl font-bold">Settings</h1>
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
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
                            <AlertDialogAction  onClick={onLogout}>
                                Logout
                            </AlertDialogAction>
                        </AlertDialogFooter>

                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

// Notification Preferences Card Component
interface NotificationPreferencesCardProps {
    notificationPreferences: NotificationPreferences;
    setNotificationPreferences: (preferences: NotificationPreferences) => void;
    disabled?: boolean;
}

function NotificationPreferencesCard({ 
    notificationPreferences,
    setNotificationPreferences,
    disabled = false
}: NotificationPreferencesCardProps) {
    const handleSettingsUpdate = (preferences: Partial<NotificationPreferences>) => {
        setNotificationPreferences({...notificationPreferences, ...preferences});
    };

    return (
        <Card className="relative">
            <div className="absolute top-0 right-0 left-0 bottom-0 bg-gray-500/50 flex items-center justify-center rounded-xl z-20">
                <p className="text-white text-sm">Comming soon</p>
            </div>

            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-1.5">
                    <BellDot className="h-5 w-5" />
                    Notification Preferences
                </CardTitle>
                <CardDescription>
                    Customize how and when you receive notifications
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">

                {/* Notification Chance */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium flex items-center gap-2 mb-1">
                            <Timer className="h-4 w-4" />
                            Notification Frequency
                        </Label>
                        <Badge variant="secondary">
                            {notificationPreferences.notification_chance}%
                        </Badge>
                    </div>
                    <Slider
                        value={[notificationPreferences.notification_chance]}
                        onValueChange={(value) => {
                            handleSettingsUpdate({ notification_chance: value[0] });
                        }}
                        max={100}
                        min={0}
                        step={5}
                        disabled={disabled}
                    />
                    <p className="text-sm text-muted-foreground">
                        Lower values mean fewer notifications. Higher values mean more frequent notifications.
                    </p>
                </div>

                <Separator />

                {/* Notification Types */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                        <BellRing className="h-4 w-4" />
                        Notification Types
                    </h4>
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">New Visitor Alerts</Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Get notified when new visitors arrive
                                </p>
                            </div>
                            <Switch
                                checked={notificationPreferences.new_visitor_notifications}
                                onCheckedChange={(checked) => {
                                    handleSettingsUpdate({ new_visitor_notifications: checked });
                                }}
                                disabled={disabled}
                            />
                        </div>
                    </div>

                    {/* <Separator />

                    TODO: maybe monthly instead of daily ...

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Daily Summary Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Get a daily summary of your website's activity
                                </p>
                            </div>
                            <Switch
                                checked={notificationPreferences.daily_summary_notifications}
                                onCheckedChange={(checked) => {
                                    handleSettingsUpdate({ daily_summary_notifications: checked });
                                }}
                                disabled={disabled}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Weekly Summary Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Get a weekly summary of your website's activity
                                </p>
                            </div>
                            <Switch
                                checked={notificationPreferences.weekly_summary_notifications}
                                onCheckedChange={(checked) => {
                                    handleSettingsUpdate({ weekly_summary_notifications: checked });
                                }}
                                disabled={disabled}
                            />
                        </div>
                    </div> */}
                </div>

                <Separator />

                {/* Quiet Hours */}
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium flex items-center gap-2 mb-1">
                                <Clock className="h-4 w-4" />
                                Quiet Hours
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                Set times when you don't want to receive notifications
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-end gap-2">
                        <div className="space-y-2 flex-1 mt-1.5">
                            <Label htmlFor="quiet-start">Start Time</Label>
                            <Input
                                id="quiet-start"
                                type="time"
                                value={notificationPreferences.quiet_hours_start || ""}
                                onChange={(e) => {
                                    handleSettingsUpdate({ quiet_hours_start: e.target.value || null });
                                }}
                                disabled={disabled}
                            />
                        </div>
                        <div className="space-y-2 flex-1 mt-1.5">
                            <Label htmlFor="quiet-end">End Time</Label>
                            <Input
                                id="quiet-end"
                                type="time"
                                value={notificationPreferences.quiet_hours_end || ""}
                                onChange={(e) => {
                                    handleSettingsUpdate({ quiet_hours_end: e.target.value || null });
                                }}
                                disabled={disabled}
                            />
                        </div>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        handleSettingsUpdate({ 
                                            quiet_hours_start: null, 
                                            quiet_hours_end: null 
                                        });
                                    }}
                                    disabled={disabled || (!notificationPreferences.quiet_hours_start && !notificationPreferences.quiet_hours_end)}
                                    className="h-9 w-9"
                                >
                                    <X />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Clear</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                <Separator />

                {/* Notification Effects */}
                <div className="space-y-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        Notification Effects
                    </h4>
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Vibration</Label>
                                <p className="text-sm text-muted-foreground">
                                    Vibrate device when notifications arrive
                                </p>
                            </div>
                            <Switch
                                checked={notificationPreferences.notification_vibration}
                                onCheckedChange={(checked) => {
                                    handleSettingsUpdate({ notification_vibration: checked });
                                }}
                                disabled={disabled}
                            />
                        </div>
                    </div>
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
                            <AlertDialogAction  onClick={clearCache}>
                                Clear cache
                            </AlertDialogAction>
                        </AlertDialogFooter>

                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

// Main Settings Component
function Settings() {
    const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadNotificationPreferences();
    }, []);

    const loadNotificationPreferences = async () => {
        try {
            setLoading(true);
            setError(null);
            const preferences = await SettingsApiService.getNotificationPreferences();
            setNotificationPreferences(preferences);
        } catch (error) {
            setError("Failed to load notification preferences");
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateNotificationPreferences = async (preferences: NotificationPreferences) => {
        if (!notificationPreferences) return;

        setNotificationPreferences(preferences);
    };

    const handleSaveSettings = async () => {
        if (!notificationPreferences) return;

        // Validate quiet hours if both are provided
        if (notificationPreferences.quiet_hours_start && !notificationPreferences.quiet_hours_end) {
            toast.error("Quiet hours end is required if start time is provided");
            return;
        }

        if (notificationPreferences.quiet_hours_end && !notificationPreferences.quiet_hours_start) {
            toast.error("Quiet hours start is required if end time is provided");
            return;
        }

        if (notificationPreferences.quiet_hours_start && notificationPreferences.quiet_hours_end && 
            notificationPreferences.quiet_hours_start >= notificationPreferences.quiet_hours_end) {
            toast.error("Quiet hours start must be before end time");
            return;
        }
        
        try {
            setSaving(true);
            setError(null);

            const updatedPreferences = await SettingsApiService.updateNotificationPreferences(notificationPreferences);
            
            setNotificationPreferences(updatedPreferences);

            toast.success("Settings saved successfully");
        } catch (error) {
            setError("Failed to save settings");
            toast.error("Failed to save settings");
            throw error;
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            window.location.href = import.meta.env.VITE_LOGOUT_URL
        } catch (error) {
            toast.error("Failed to logout");
            throw error;
        }
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (!notificationPreferences) {
        return <ErrorState error={error || "Failed to load notification preferences"} />;
    }

    return (
        <TooltipProvider>
            <SettingsHeader handleSaveSettings={handleSaveSettings} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <InstallButtonCard />
                    <AppearanceCard />
                    <NotificationToggleCard disabled={saving} />
                    <AccountCard onLogout={handleLogout} disabled={saving} />
                </div>

                <div className="space-y-6">
                    <NotificationPreferencesCard
                        notificationPreferences={notificationPreferences}
                        setNotificationPreferences={updateNotificationPreferences}
                        disabled={saving}
                    />

                    <ClearCacheCard />
                </div>
            </div>
        </TooltipProvider>
    );
}

export default Settings;

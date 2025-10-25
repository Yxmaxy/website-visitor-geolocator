import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { BarChart3, Globe, Settings, Gauge } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type { Visitor } from "@/services/api/apiStatistics";
import StatisticsApiService from "@/services/api/apiStatistics";

import { VisitorDataTable } from "@/components/VisitorDataTable";
import NavigationCard from "@/components/NavigationCard";

// Main Dashboard Component
function Dashboard() {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [visitorsLoading, setVisitorsLoading] = useState(true);

    // Load visitors data
    const loadVisitors = useCallback(async () => {
        try {
            setVisitorsLoading(true);
            const visitorsData = await StatisticsApiService.getLatestVisitors(null, 30);
            setVisitors(visitorsData);
        } catch (error) {
            toast.error("Failed to load visitors data");
        } finally {
            setVisitorsLoading(false);
        }
    }, []);

    // Load data on mount
    useEffect(() => {
        loadVisitors();
    }, [loadVisitors]);

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-6 min-h-12">
                <Gauge className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>

            <div className="space-y-6">
                {/* Navigation Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <NavigationCard
                        title="My Domains"
                        description="Manage your tracking domains and settings"
                        icon={<Globe className="h-5 w-5 text-white" />}
                        href="/domains"
                    />
                    <NavigationCard
                        title="Statistics"
                        description="View detailed visitor analytics and trends"
                        icon={<BarChart3 className="h-5 w-5 text-white" />}
                        href="/statistics"
                    />
                    <NavigationCard
                        title="Settings"
                        description="Configure your account and preferences"
                        icon={<Settings className="h-5 w-5 text-white" />}
                        href="/settings"
                    />
                </div>

                {/* Latest Visitors Table */}
                <Card>
                    <CardContent>
                        <VisitorDataTable
                            visitors={visitors}
                            pageSize={5}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default Dashboard;

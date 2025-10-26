import { BarChart3, Globe, Settings, Gauge } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import VisitorDataTable from "@/components/visitor-data-table/Table";
import NavigationCard from "@/components/NavigationCard";


function Dashboard() {
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
                            pageSize={3}
                            preloadedPages={2}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default Dashboard;

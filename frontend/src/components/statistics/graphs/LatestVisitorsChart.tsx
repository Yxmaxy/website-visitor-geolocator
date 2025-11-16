import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { CustomChart } from "@/components/ui/custom-chart";

import StatisticsApiService, { type StatisticsParameters, type VisitorCountByDate } from "@/services/api/apiStatistics";


export default function LatestVisitorsChart({ domainId, fromDate, toDate }: StatisticsParameters) {
    const [apiData, setApiData] = useState<VisitorCountByDate[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!fromDate || !toDate) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const data = await StatisticsApiService.getVisitorCountByDate(
                    { domainId, fromDate, toDate }
                );
                setApiData(data);
            } catch (error) {
                toast.error("Failed to load visitor count data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [domainId, fromDate, toDate]);

    const chartData = useMemo(() => {
        if (!fromDate || !toDate) return [];

        // Generate array of dates from fromDate to toDate
        const dates: string[] = [];
        const startDate = new Date(fromDate);
        const endDate = new Date(toDate);
        
        // Ensure we're working with dates at midnight to avoid timezone issues
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            dates.push(currentDate.toISOString().split("T")[0] || "");
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Create a map from the API data
        const countMap = new Map<string, number>();
        apiData.forEach((item) => {
            countMap.set(item.date, item.count);
        });

        // Create chart data with all dates in range, including zero counts
        return dates.map((date: string) => ({
            date: new Date(date).toLocaleDateString("en-US", { 
                month: "short", 
                day: "numeric" 
            }),
            count: countMap.get(date) || 0
        }));
    }, [apiData, fromDate, toDate]);

    if (loading || !fromDate || !toDate || chartData.length === 0) {
        return <LatestVisitorsChartSkeleton />;
    }

    return (
        <div className="[& *]:outline-transparent">
            <CustomChart
                chartType="line"
                data={chartData}
                config={{
                    type: "line",
                    dataKey: "count",
                    stroke: "var(--chart-1)",
                    strokeWidth: 2,
                    dot: false
                }}
                xAxisDataKey="date"
                xAxisAngle={-45}
                xAxisHeight={80}
                height={300}
            />
        </div>
    );
}

function LatestVisitorsChartSkeleton() {
    return <Skeleton className="h-[300px] w-full rounded-lg animate-none bg-transparent border">
        <div className="flex items-center justify-center h-full gap-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading ...</p>
        </div>
    </Skeleton>
}

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { CustomChart } from "@/components/ui/custom-chart";

import StatisticsApiService, { type StatisticsParameters, type UserAgentDistribution } from "@/services/api/apiStatistics";


export default function LatestVisitorsChart({ domainId, fromDate, toDate }: StatisticsParameters) {
    const [apiData, setApiData] = useState<UserAgentDistribution[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

    useEffect(() => {
        if (!fromDate || !toDate) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const data = await StatisticsApiService.getUserAgentDistribution(
                    { domainId, fromDate, toDate }
                );
                setApiData(data.results);
            } catch (error) {
                toast.error("Failed to load visitor count data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [domainId, fromDate, toDate]);

    const data = useMemo(() => {
        return apiData.map((item, index) => ({
            name: item.browser,
            value: item.count,
            color: COLORS[index % COLORS.length]
        }));

    }, [apiData]);

    if (loading || !fromDate || !toDate || data.length === 0) {
        return <UserAgentPieChartSkeleton />;
    }

    return (
        <div className="[& *]:outline-transparent">
            <CustomChart
                chartType="pie"
                data={data}
                config={{
                    type: "pie",
                    dataKey: "value",
                    nameKey: "name",
                    colors: data.map(entry => entry.color || "var(--chart-1)")
                }}
                height={200}
            />
            
            {/* Custom Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {data.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="truncate">{entry.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function UserAgentPieChartSkeleton() {
    return <Skeleton className={"h-[280px] w-full rounded-lg animate-none bg-transparent border"}>
        <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Loading ...</p>
        </div>
    </Skeleton>
}

import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

import StatisticsHeader from "@/components/statistics/StatisticsHeader";
import VisitorDataTable from "@/components/statistics/tables/visitor-table/VisitorTable";
import type { Domain } from "@/services/api/apiDomain";

function Visitors() {
    const [searchParams] = useSearchParams();
    const initialIp = useMemo(() => searchParams.get("ip") ?? undefined, []);

    const [selectedDomain, setSelectedDomain] = useState<Domain | undefined>(undefined);
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    const keySuffix = useMemo(() => {
        return `${selectedDomain?.id || "all"}-${fromDate}-${toDate}`;
    }, [selectedDomain?.id, fromDate, toDate]);

    return (
        <div>
            <StatisticsHeader
                icon={<Users className="h-6 w-6" />}
                title="Visitors"
                selectedDomain={selectedDomain}
                setSelectedDomain={setSelectedDomain}
                fromDate={fromDate}
                toDate={toDate}
                setFromDate={setFromDate}
                setToDate={setToDate}
            />

            <div className="space-y-6 mt-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                <h2 className="text-lg font-semibold">Latest Visitors</h2>
                            </div>
                        </div>
                        <CardDescription>
                            An overview of recent activity. Click on any row to see detailed information for that IP address.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <VisitorDataTable
                            key={`visitors-table-${keySuffix}`}
                            domainId={selectedDomain?.id ?? undefined}
                            fromDate={fromDate}
                            toDate={toDate}
                            pageSize={20}
                            preloadedPages={5}
                            initialSelectedIp={initialIp}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default Visitors;

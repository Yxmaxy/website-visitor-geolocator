import StatisticsTable, { type StatisticsTableProps } from "@/components/statistics/tables/StatisticsTable";
import StatisticsApiService, { type OperatingSystemDistribution } from "@/services/api/apiStatistics";

import { columns } from "./columns";

export default function OperatingSystemTable({
    domainId,
    fromDate,
    toDate,
    pageSize,
    preloadedPages,
}: StatisticsTableProps) {
    return <StatisticsTable<OperatingSystemDistribution>
        columns={columns}
        dataRetriever={StatisticsApiService.getOperatingSystemDistribution}
        domainId={domainId}
        fromDate={fromDate}
        toDate={toDate}
        pageSize={pageSize}
        preloadedPages={preloadedPages}
    />
}

import StatisticsTable, { type StatisticsTableProps } from "@/components/statistics/tables/StatisticsTable";
import StatisticsApiService, { type AreaStatistics } from "@/services/api/apiStatistics";

import { columns } from "./columns";

export default function AreaTable({
    domainId,
    fromDate,
    toDate,
    level,
    pageSize,
    preloadedPages,
}: StatisticsTableProps) {
    return <StatisticsTable<AreaStatistics>
        columns={columns}
        dataRetriever={StatisticsApiService.getAreaStatistics}
        domainId={domainId}
        fromDate={fromDate}
        toDate={toDate}
        level={level}
        pageSize={pageSize}
        preloadedPages={preloadedPages}
    />
}

import StatisticsTable, { type StatisticsTableProps } from "@/components/statistics/tables/StatisticsTable";
import StatisticsApiService, { type Visitor } from "@/services/api/apiStatistics";

import { columns } from "./columns";

export default function VisitorTable({
    domainId,
    fromDate,
    toDate,
    pageSize,
    preloadedPages,
}: StatisticsTableProps) {
    return <StatisticsTable<Visitor>
        columns={columns}
        dataRetriever={StatisticsApiService.getLatestVisitors}
        domainId={domainId}
        fromDate={fromDate}
        toDate={toDate}
        pageSize={pageSize}
        preloadedPages={preloadedPages}
    />
}

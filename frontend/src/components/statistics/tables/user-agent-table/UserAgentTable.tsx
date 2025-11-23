import StatisticsTable, { type StatisticsTableProps } from "@/components/statistics/tables/StatisticsTable";
import StatisticsApiService, { type UserAgentDistribution } from "@/services/api/apiStatistics";

import { columns } from "./columns";

export default function UserAgentTable({
    domainId,
    fromDate,
    toDate,
    pageSize,
    preloadedPages,
}: StatisticsTableProps) {
    return <StatisticsTable<UserAgentDistribution>
        columns={columns}
        dataRetriever={StatisticsApiService.getUserAgentDistribution}
        domainId={domainId}
        fromDate={fromDate}
        toDate={toDate}
        pageSize={pageSize}
        preloadedPages={preloadedPages}
    />
}

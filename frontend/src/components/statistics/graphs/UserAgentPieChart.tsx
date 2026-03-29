import StatisticsPieChart from "@/components/statistics/graphs/StatisticsPieChart";
import StatisticsApiService, { type StatisticsParameters, type UserAgentDistribution } from "@/services/api/apiStatistics";

export default function UserAgentPieChart(props: StatisticsParameters) {
    return (
        <StatisticsPieChart<UserAgentDistribution>
            {...props}
            dataRetriever={StatisticsApiService.getUserAgentDistribution}
            nameKey="browser"
        />
    );
}

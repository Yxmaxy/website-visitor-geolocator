import StatisticsPieChart from "@/components/statistics/graphs/StatisticsPieChart";
import StatisticsApiService, { type StatisticsParameters, type OperatingSystemDistribution } from "@/services/api/apiStatistics";

export default function OperatingSystemPieChart(props: StatisticsParameters) {
    return (
        <StatisticsPieChart<OperatingSystemDistribution>
            {...props}
            dataRetriever={StatisticsApiService.getOperatingSystemDistribution}
            nameKey="operating_system"
        />
    );
}

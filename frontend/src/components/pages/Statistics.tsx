import { useState, useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import StatisticsHeader from "@/components/statistics/StatisticsHeader";
import LatestVisitorsChart from "@/components/statistics/graphs/LatestVisitorsChart";
import VisitorTable from "@/components/statistics/tables/visitor-table/VisitorTable";
import AreaMap, { AreaRegionSelect, type SelectableRegion } from "@/components/statistics/graphs/AreaMap";
import AreaTable from "@/components/statistics/tables/area-table/AreaTable";
import UserAgentTable from "@/components/statistics/tables/user-agent-table/UserAgentTable";
import UserAgentPieChart from "@/components/statistics/graphs/UserAgentPieChart";

import { LevelChoices } from "@/services/api/apiStatistics";
import type { Domain } from "@/services/api/apiDomain";

import { BarChart3, Clock, Globe, MapPin, Monitor } from "lucide-react";


// Predefined continent regions for better zoom control
const CONTINENT_REGIONS: SelectableRegion[] = [
    { name: "Europe", zoom: 2, center: [54.5260, 15.2551] },
    { name: "Asia", zoom: 1, center: [34.0479, 100.6197] },
    { name: "Africa", zoom: 2, center: [8.7832, 34.5085] },
    { name: "North America", zoom: 2, center: [45.0, -100.0] },
    { name: "South America", zoom: 2, center: [-8.7832, -55.4915] },
    { name: "Oceania", zoom: 2, center: [-25.2744, 133.7751] },
];


function Statistics() {
    // filters
    const [selectedDomain, setSelectedDomain] = useState<Domain | undefined>(undefined);
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    const [selectedCountryRegion, setSelectedCountryRegion] = useState<SelectableRegion | undefined>(undefined);

    const keySuffix = useMemo(() => {
        return `${selectedDomain?.id || 'all'}-${fromDate}-${toDate}`;
    }, [selectedDomain?.id, fromDate, toDate]);

    return (
        <div>
            <StatisticsHeader
                icon={<BarChart3 className="h-6 w-6" />}
                title="Statistics"
                selectedDomain={selectedDomain}
                setSelectedDomain={setSelectedDomain}
                fromDate={fromDate}
                toDate={toDate}
                setFromDate={setFromDate}
                setToDate={setToDate}
            />

            <div className="space-y-6 mt-6">

                {/* Latest visitors */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 mb-2">
                            <Clock className="h-5 w-5" />
                            Latest Visitors
                        </CardTitle>
                        <CardDescription>
                            Recent visitor activity
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LatestVisitorsChart
                            key={`latest-visitors-chart-${keySuffix}`}
                            domainId={selectedDomain?.id}
                            fromDate={fromDate}
                            toDate={toDate}
                        />
                        <VisitorTable
                            key={`visitors-table-${keySuffix}`}
                            domainId={selectedDomain?.id}
                            fromDate={fromDate}
                            toDate={toDate}
                            pageSize={3}
                            preloadedPages={2}
                        />
                    </CardContent>
                </Card>

                {/* Continent Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 mb-2">
                                <Globe className="h-5 w-5" />
                                Visitors by Continent
                            </CardTitle>
                            <CardDescription>
                                Distribution of visitors by continent
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AreaMap
                                key={`area-map-continent-${keySuffix}`}
                                mapLevel={LevelChoices.CONTINENT}
                                domainId={selectedDomain?.id}
                                fromDate={fromDate}
                                toDate={toDate}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 mb-2">
                                <Globe className="h-5 w-5" />
                                Continents
                            </CardTitle>
                            <CardDescription>
                                Visitor statistics by continent
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AreaTable
                                key={`area-table-continent-${keySuffix}`}
                                level={LevelChoices.CONTINENT}
                                domainId={selectedDomain?.id}
                                fromDate={fromDate}
                                toDate={toDate}
                                pageSize={4}
                                preloadedPages={2}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Country Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <div>
                                <CardTitle>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5" />
                                            Visitors by Country
                                        </div>
                                        <div className="font-normal">
                                            <AreaRegionSelect
                                                selectableRegions={CONTINENT_REGIONS}
                                                selectedRegion={selectedCountryRegion}
                                                setSelectedRegion={setSelectedCountryRegion}
                                            />
                                        </div>
                                    </div>
                                </CardTitle>
                                <CardDescription>
                                    Distribution of visitors by country
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <AreaMap
                                key={`area-map-country-${keySuffix}`}
                                mapLevel={LevelChoices.COUNTRY}
                                domainId={selectedDomain?.id}
                                fromDate={fromDate}
                                toDate={toDate}
                                selectedRegion={selectedCountryRegion}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 mb-2">
                                <MapPin className="h-5 w-5" />
                                Countries
                            </CardTitle>
                            <CardDescription>
                                Visitor statistics by country
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AreaTable
                                key={`area-table-country-${keySuffix}`}
                                level={LevelChoices.COUNTRY}
                                domainId={selectedDomain?.id}
                                fromDate={fromDate}
                                toDate={toDate}
                                pageSize={4}
                                preloadedPages={2}
                            />
                        </CardContent>
                    </Card>
                </div>
                

                {/* User Agent Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 mb-2">
                                <Monitor className="h-5 w-5" />
                                Browser Distribution
                            </CardTitle>
                            <CardDescription>
                                Distribution of visitors by browser
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UserAgentPieChart
                                key={`user-agent-pie-chart-${keySuffix}`}
                                domainId={selectedDomain?.id}
                                fromDate={fromDate}
                                toDate={toDate}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 mb-2">
                                <Monitor className="h-5 w-5" />
                                Browsers
                            </CardTitle>
                            <CardDescription>
                                Visitor statistics by browser
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UserAgentTable
                                key={`user-agent-table-${keySuffix}`}
                                domainId={selectedDomain?.id}
                                fromDate={fromDate}
                                toDate={toDate}
                                pageSize={3}
                                preloadedPages={2}
                            />
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}

export default Statistics;

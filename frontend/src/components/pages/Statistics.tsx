import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import LatestVisitorsChart from "@/components/statistics/graphs/LatestVisitorsChart";
import VisitorTable from "@/components/statistics/tables/visitor-table/VisitorTable";
import AreaMap, { AreaRegionSelect, type SelectableRegion } from "@/components/statistics/graphs/AreaMap";
import AreaTable from "@/components/statistics/tables/area-table/AreaTable";
import UserAgentTable from "@/components/statistics/tables/user-agent-table/UserAgentTable";
import UserAgentPieChart from "@/components/statistics/graphs/UserAgentPieChart";

import { LevelChoices } from "@/services/api/apiStatistics";
import { DomainApiService, type Domain } from "@/services/api/apiDomain";

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


interface StatisticsHeaderProps {
    selectedDomain?: Domain;
    setSelectedDomain: (domain?: Domain) => void;
    fromDate: string;
    toDate: string;
    setFromDate: (fromDate: string) => void;
    setToDate: (toDate: string) => void;
}

function StatisticsHeader({
    selectedDomain,
    setSelectedDomain,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
}: StatisticsHeaderProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [domains, setDomains] = useState<Domain[]>([]);
    const [dateRange, setDateRange] = useState<string|undefined>("30");

    const [showCustomDateRange, setShowCustomDateRange] = useState(false);

    useEffect(() => {
        const initialLoad = async () => {
            try {
                const domains = await DomainApiService.getDomains();
                setDomains(domains);

                const domainId = searchParams.get("domain");
                if (domainId && domains.length > 0) {
                    const domain = domains.find(d => d.id.toString() === domainId);
                    if (domain) {
                        setSelectedDomain(domain);
                    }
                }
            } catch (error) {
                toast.error("Failed to load domains");
                throw error;
            }
        }
        initialLoad();
    }, []);

    useEffect(() => {
        if (selectedDomain?.id) {
            setSearchParams({ domain: selectedDomain.id.toString() }, { replace: true });
        } else {
            setSearchParams({}, { replace: true });
        }
    }, [selectedDomain?.id]);

    useEffect(() => {
        if (!dateRange) return;

        const today = new Date();
        const fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - parseInt(dateRange));
        setFromDate(fromDate.toISOString().split("T")[0] || "");

        const toDate = new Date(today);
        toDate.setDate(toDate.getDate() + 1);
        setToDate(toDate.toISOString().split("T")[0] || "");
    }, [dateRange]);

    return (
        <div className="flex flex-col justify-between gap-4 sm:items-center sm:flex-row mb-6 min-h-12">
            <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Statistics</h1>
            </div>
            <div className="flex items-center gap-4 flex-wrap justify-end">

                <div className="flex items-center gap-2">
                    <Select
                        value={selectedDomain?.id?.toString() || "all"}
                        onValueChange={(value) => {
                            if (value === "all") {
                                setSelectedDomain(undefined);
                            } else {
                                const domain = domains.find(d => d.id.toString() === value);
                                setSelectedDomain(domain || undefined);
                            }
                        }}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select domain" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Domains</SelectItem>
                            {domains.map((domain) => (
                                <SelectItem key={domain.id} value={domain.id.toString()}>
                                    {domain.domain}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Select
                        value={dateRange?.toString()}
                        onValueChange={(value) => {
                            if (value === "custom") {
                                setShowCustomDateRange(true);
                                setDateRange(undefined);
                            } else {
                                setShowCustomDateRange(false);
                                setDateRange(value);
                            }
                        }}
                    >
                        <SelectTrigger className="w-38">
                            <SelectValue placeholder="Last days" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">
                                Last 7 days
                            </SelectItem>
                            <SelectItem value="14">
                                Last 14 days
                            </SelectItem>
                            <SelectItem value="30">
                                Last 30 days
                            </SelectItem>
                            <SelectItem value="90">
                                Last 90 days
                            </SelectItem>
                            <SelectItem value="365">
                                Last 365 days
                            </SelectItem>
                            <SelectItem value="custom">
                                Custom
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    {showCustomDateRange && (
                        <div className="flex items-center gap-2">
                            <Input type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                            <Input type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                max={new Date().toISOString().split("T")[0]}
                            />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

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
                                pageSize={5}
                                preloadedPages={2}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Country Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <div>
                                    <CardTitle className="flex items-center gap-2 mb-2">
                                        <MapPin className="h-5 w-5" />
                                        Visitors by Country
                                    </CardTitle>
                                    <CardDescription>
                                        Distribution of visitors by country
                                    </CardDescription>
                                </div>
                                <AreaRegionSelect
                                    selectableRegions={CONTINENT_REGIONS}
                                    selectedRegion={selectedCountryRegion}
                                    setSelectedRegion={setSelectedCountryRegion}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <AreaMap
                                key={`area-map-country-${keySuffix}`}
                                mapLevel={LevelChoices.COUNTRY}
                                domainId={selectedDomain?.id}
                                fromDate={fromDate}
                                toDate={toDate}
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
                                pageSize={5}
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
                                pageSize={4}
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

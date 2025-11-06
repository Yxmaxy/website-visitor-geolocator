import { useState, useEffect, useMemo, memo } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState, PaginationState } from "@tanstack/react-table";

import { CustomChart } from "@/components/ui/custom-chart";
import { MapContainer, GeoJSON } from "react-leaflet";

import "leaflet/dist/leaflet.css";
import type { FeatureCollection } from "geojson";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Skeleton } from "@/components/ui/skeleton";

import type { AreaStatistics, Visitor, UserAgentDistribution, PaginatedResponse } from "@/services/api/apiStatistics";
import StatisticsApiService, { LevelChoices } from "@/services/api/apiStatistics";
import { DomainApiService } from "@/services/api/apiDomain";
import type { Domain } from "@/services/api/apiDomain";
import { getCountryFlag } from "@/services/flags";
import { cn } from "@/services/lib/shadcn-utils";

import {
    BarChart3,
    Clock,
    Globe,
    Loader2,
    MapPin,
    Monitor,
} from "lucide-react";

import VisitorDataTable from "@/components/visitor-data-table/Table";
import { Input } from "../ui/input";

// Statistics Header Component
interface StatisticsHeaderProps {
    selectedDomain?: Domain;
    domains: Domain[];
    onDomainChange: (domain?: Domain) => void;
    fromDate: string;
    toDate: string;
    onFromDateChange: (fromDate: string) => void;
    onToDateChange: (toDate: string) => void;
}

function StatisticsHeader({
    selectedDomain,
    domains,
    onDomainChange,
    fromDate,
    toDate,
    onFromDateChange,
    onToDateChange,
}: StatisticsHeaderProps) {
    const [showCustomDateRange, setShowCustomDateRange] = useState(false);

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
                                onDomainChange(undefined);
                            } else {
                                const domain = domains.find(d => d.id.toString() === value);
                                onDomainChange(domain || undefined);
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
                        onValueChange={(value: number|string) => {
                            if (value === "custom") {
                                setShowCustomDateRange(true);
                            } else {
                                setShowCustomDateRange(false);
                                const today = new Date();
                                const fromDate = new Date(today);
                                fromDate.setDate(fromDate.getDate() - parseInt(value.toString()));
                                onFromDateChange(fromDate.toISOString().split("T")[0] || "");
                                const toDate = new Date(today);
                                toDate.setDate(toDate.getDate() + 1);
                                onToDateChange(toDate.toISOString().split("T")[0] || "");
                                setShowCustomDateRange(false);
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
                                onChange={(e) => onFromDateChange(e.target.value)}
                            />
                            <Input type="date"
                                value={toDate}
                                onChange={(e) => onToDateChange(e.target.value)}
                                max={new Date().toISOString().split("T")[0]}
                            />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

// Map Statistics Card Component
interface UpperRegion {
    name: string;
    zoom: number;
    center: [number, number]; // [latitude, longitude]
}

// Predefined upper regions for better zoom control
const UPPER_REGIONS: UpperRegion[] = [
    { name: "Europe", zoom: 2, center: [54.5260, 15.2551] },
    { name: "Asia", zoom: 1, center: [34.0479, 100.6197] },
    { name: "Africa", zoom: 2, center: [8.7832, 34.5085] },
    { name: "North America", zoom: 2, center: [45.0, -100.0] },
    { name: "South America", zoom: 2, center: [-8.7832, -55.4915] },
    { name: "Oceania", zoom: 2, center: [-25.2744, 133.7751] },
];

interface MapStatisticsCardProps {
    statistics: AreaStatistics[] | null;
    geometries: FeatureCollection | null;
    title: string;
    description: string;
    icon: React.ReactNode;
    upperRegions?: UpperRegion[];
}

function MapStatisticsCard({ statistics, geometries, title, description, icon, upperRegions }: MapStatisticsCardProps) {
    const [map, setMap] = useState<any>(null);
    const [geoJSON, setGeoJSON] = useState<any>(null);
    const [selectedUpperLevel, setSelectedUpperLevel] = useState<string>("all");

    useEffect(() => {
        fitToBounds();
    }, [map, geoJSON]);

    useEffect(() => {
        if (selectedUpperLevel === "all") {
            fitToBounds();
        } else {
            const selectedRegion = upperRegions?.find(region => region.name === selectedUpperLevel);
            if (selectedRegion && map) {
                // Set the center and zoom level for the selected region
                map.setView(selectedRegion.center, selectedRegion.zoom);
            }
        }
    }, [selectedUpperLevel, upperRegions, map]);

    function fitToBounds() {
        if (geometries && map && geoJSON) {
            map.invalidateSize();
            map.fitBounds(geoJSON.getBounds());
        }
    }

    // color intensity based on visitor count    
    const visitorCountMap = new Map(statistics?.map(area => [area.area_name, area.visitor_count]) || []);
    const maxVisitorCount = Math.max(...Array.from(visitorCountMap.values()), 1);

    const style = (feature: any) => {
        const visitorCount = visitorCountMap.get(feature.properties.name) || 0;
        const intensity = visitorCount / (maxVisitorCount * 1.5) + 0.1;
        return {
            weight: 0,
            color: "var(--muted-foreground)",
            opacity: 1,
            fillColor: "var(--primary)",
            fillOpacity: intensity,
        };
    };

    // add popup with visitor count
    const onEachFeature = (feature: any, layer: any) => {    
        const visitorCount = visitorCountMap.get(feature.properties.name) || 0;
        if (visitorCount > 0) {
            layer.bindTooltip(
                `<b>${feature.properties.name}</b><br/>Visitors: ${visitorCount}`,
                { permanent: false, sticky: true, className: "text-black" }
            );
        }
    };

    if (!geometries) {
        return <MapStatisticsSkeleton title={title} description={description} icon={icon} />
    }

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between gap-0.5">
                <div>
                    <CardTitle className="flex items-center gap-2 mb-2">
                        {icon}
                        {title}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>

                {upperRegions && (
                    <div className="flex items-center gap-2">
                        <Select value={selectedUpperLevel} onValueChange={setSelectedUpperLevel}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {upperRegions.map((region) => (
                                    <SelectItem key={region.name} value={region.name}>
                                        {region.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="relative h-[280px]">
                    <MapContainer
                        ref={setMap}
                        center={[0, 0]}
                        zoom={1}
                        zoomControl={false}
                        dragging={false}
                        attributionControl={false}
                        doubleClickZoom={false}
                        boxZoom={false}
                        scrollWheelZoom={false}
                        touchZoom={false}
                        keyboard={false}
                        style={{ height: "100%", width: "100%", minHeight: "280px" }}
                        className="rounded-lg !bg-transparent"
                    >
                        <GeoJSON
                            ref={setGeoJSON}
                            data={geometries}
                            style={style}
                            onEachFeature={onEachFeature}
                            interactive={true}
                        />
                    </MapContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// Data Table Component for Area Statistics
interface AreaStatisticsTableProps {
    statistics: AreaStatistics[] | null;
    title: string;
    description: string;
    showFlag?: boolean;
    icon: React.ReactNode;
}

function AreaStatisticsTable({ statistics, title, description, showFlag = false, icon }: AreaStatisticsTableProps) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 3,
    })

    const columns: ColumnDef<AreaStatistics>[] = [
        {
            accessorKey: "area_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Continent" />
            ),
            cell: ({ row }) => {
                const areaName = row.getValue("area_name") as string;
                const countryFlag = getCountryFlag(areaName);
                
                return (
                    <div className="flex items-center gap-2">
                        {!showFlag && <span className="text-lg">{countryFlag}</span>}
                        <span className="font-medium truncate">{areaName}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "visitor_count",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Visitors" />
            ),
            cell: ({ row }) => {
                const count = row.getValue("visitor_count") as number;
                return (
                    <div className="font-medium">
                        {count.toLocaleString()}
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data: statistics || [],
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            pagination,
        },
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-2">
                    {icon}
                    {title}
                </CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="h-full">
                <div className="space-y-4 flex flex-col h-full justify-between">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id} className="min-w-0">
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="min-w-0">
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-36 text-center text-muted-foreground"
                                        >
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <DataTablePagination table={table} />
                </div>
            </CardContent>
        </Card>
    );
}

// Latest Visitors Chart Component
interface LatestVisitorsChartProps {
    selectedDomain?: number;
    fromDate: string;
    toDate: string;
}

const LatestVisitorsChart = memo(({ selectedDomain, fromDate, toDate }: LatestVisitorsChartProps) => {
    const chartData = useMemo(() => {
        if (lastDays === 1) return [];

        // Generate array of dates for the last N days
        const dates: string[] = [];
        const today = new Date();
        for (let i = lastDays - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split("T")[0] || ""); // YYYY-MM-DD format
        }

        // Group visitors by date
        const groupedVisitors = visitors.reduce((acc, visitor) => {
            const dateParts = new Date(visitor.created_at).toISOString().split("T");
            const date = dateParts[0]; // YYYY-MM-DD format
            if (date && date.length > 0) {
                acc[date] = (acc[date] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        // Create chart data with all dates in range, including zero counts
        return dates.map((date: string) => ({
            date: new Date(date).toLocaleDateString("en-US", { 
                month: "short", 
                day: "numeric" 
            }),
            count: groupedVisitors[date] || 0
        }));
    }, [visitors, lastDays]);

    if (lastDays === 1 || chartData.length === 0) {
        return <></>;
    }

    return (
        <div className="[& *]:outline-transparent">
            <CustomChart
                chartType="line"
                data={chartData}
                config={{
                    type: "line",
                    dataKey: "count",
                    stroke: "var(--chart-1)",
                    strokeWidth: 2,
                    dot: false
                }}
                xAxisDataKey="date"
                xAxisAngle={-45}
                xAxisHeight={80}
                height={300}
            />
        </div>
    );
});

// User Agent Pie Chart Component
interface UserAgentPieChartProps {
    userAgentDistribution: UserAgentDistribution[];
    title: string;
    description: string;
    icon: React.ReactNode;
}

function UserAgentPieChart({ userAgentDistribution, title, description, icon }: UserAgentPieChartProps) {
    const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

    const data = userAgentDistribution.map((item, index) => ({
        name: item.browser,
        value: item.count,
        color: COLORS[index % COLORS.length]
    }));

    if (data.length === 0) {
        return <UserAgentPieChartSkeleton title={title} description={description} noData={true} icon={icon} />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-2">
                    <Monitor className="h-5 w-5" />
                    {title}
                </CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    );
}

// User Agent Table Component
interface UserAgentTableProps {
    userAgentDistribution: UserAgentDistribution[];
    title: string;
    description: string;
    icon: React.ReactNode;
}

function UserAgentTable({ userAgentDistribution, title, description, icon }: UserAgentTableProps) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 5,
    })

    const columns: ColumnDef<UserAgentDistribution>[] = [
        {
            accessorKey: "browser",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Browser" />
            ),
            cell: ({ row }) => {
                const browser = row.getValue("browser") as string;
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{browser}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "count",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Count" />
            ),
            cell: ({ row }) => {
                const count = row.getValue("count") as number;
                return (
                    <div className="font-medium">
                        {count.toLocaleString()}
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data: userAgentDistribution || [],
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            pagination,
        },
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-2">
                    {icon}
                    {title}
                </CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="h-full">
                <div className="space-y-4 flex flex-col h-full justify-between">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id} className="min-w-0">
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="min-w-0">
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-36 text-center text-muted-foreground"
                                        >
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <DataTablePagination table={table} />
                </div>
            </CardContent>
        </Card>
    );
}

// Skeleton Components
function LatestVisitorsSkeleton({ icon }: { icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    {icon}
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-5" />
                </div>
                <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-[300px] w-full" />
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function MapStatisticsSkeleton({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-2">
                    {icon}
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Skeleton className={cn("h-[280px] w-full rounded-lg animate-none bg-transparent border")}>
                    <div className="flex items-center justify-center h-full gap-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading ...</p>
                    </div>
                </Skeleton>
            </CardContent>
        </Card>
    );
}

function AreaStatisticsTableSkeleton({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-2">
                    {icon}
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="h-full">
                <div className="space-y-4 flex flex-col h-full justify-between">
                    <div className="rounded-md border">
                        <div className="p-4 space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-8 w-32" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function UserAgentPieChartSkeleton({ title, description, noData = false, icon }: { title: string; description: string; noData?: boolean; icon: React.ReactNode }) {
    const text = noData ? "No data available" : "Loading ...";
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-2">
                    {icon}
                    {title}
                </CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Skeleton className={cn("h-[280px] w-full rounded-lg", noData && "animate-none bg-transparent border")}>
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                </Skeleton>
            </CardContent>
        </Card>
    );
}

function UserAgentTableSkeleton({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 mb-2">
                    {icon}
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="h-full">
                <div className="space-y-4 flex flex-col h-full justify-between">
                    <div className="rounded-md border">
                        <div className="p-4 space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-8 w-32" />
                        <div className="flex gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Main Statistics Component
function Statistics() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [domains, setDomains] = useState<Domain[]>([]);
    const [selectedDomain, setSelectedDomain] = useState<Domain | undefined>(undefined);
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    // Data states
    const [loading, setLoading] = useState<boolean>(false);
    const [countryStatistics, setCountryStatistics] = useState<AreaStatistics[]>([]);
    const [continentStatistics, setContinentStatistics] = useState<AreaStatistics[]>([]);
    const [visitors, setVisitors] = useState<PaginatedResponse<Visitor> | null>(null);
    const [userAgentDistribution, setUserAgentDistribution] = useState<UserAgentDistribution[]>([]);

    // Geometries
    const [continentGeometries, setContinentGeometries] = useState<FeatureCollection | null>(null);
    const [countryGeometries, setCountryGeometries] = useState<FeatureCollection | null>(null);

    // Load static data on mount (geometries and domains)
    useEffect(() => {
        StatisticsApiService
            .getAreaGeometries(LevelChoices.CONTINENT)
            .then(setContinentGeometries)
            .catch(() => toast.error("Failed to load continent geometries"));
        StatisticsApiService
            .getAreaGeometries(LevelChoices.COUNTRY)
            .then(setCountryGeometries)
            .catch(() => toast.error("Failed to load country geometries"));
        DomainApiService
            .getDomains()
            .then(setDomains)
            .catch(() => toast.error("Failed to load domains"));
    }, []);

    // Handle initial URL parameter and set selected domain
    useEffect(() => {
        const domainId = searchParams.get("domain");
        if (domainId && domains.length > 0) {
            const domain = domains.find(d => d.id.toString() === domainId);
            if (domain) {
                setSelectedDomain(domain);
            }
        }
    }, [searchParams, domains]);

    // Load statistics data when domain or fromDate or toDate changes
    useEffect(() => {
        // Skip if domains haven't loaded yet
        if (domains.length === 0) return;

        const loadStatisticsData = async () => {
            setLoading(true);
            try {
                const domainId = selectedDomain?.id || undefined;
                
                // Update URL params (but don't trigger a re-render)
                if (selectedDomain) {
                    setSearchParams({ domain: selectedDomain.id.toString() }, { replace: true });
                } else {
                    setSearchParams({}, { replace: true });
                }

                // Load all statistics data
                const [countryStats, continentStats, visitorsData, userAgentData] = await Promise.all([
                    StatisticsApiService.getAreaStatistics(domainId, fromDate, toDate, LevelChoices.COUNTRY),
                    StatisticsApiService.getAreaStatistics(domainId, fromDate, toDate, LevelChoices.CONTINENT),
                    StatisticsApiService.getLatestVisitors(domainId, fromDate, toDate),
                    StatisticsApiService.getUserAgentDistribution(domainId, fromDate, toDate)
                ]);

                setCountryStatistics(countryStats);
                setContinentStatistics(continentStats);
                setVisitors(visitorsData);
                setUserAgentDistribution(userAgentData);
            } catch (error) {
                toast.error("Failed to load statistics data");
            } finally {
                setLoading(false);
            }
        };

        loadStatisticsData();
    }, [selectedDomain?.id, fromDate, toDate, domains.length]);

    return (
        <div>
            <StatisticsHeader
                selectedDomain={selectedDomain}
                domains={domains}
                onDomainChange={setSelectedDomain}
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
            />

            <div className="space-y-6 mt-6">
                {/* Latest visitors */}
                {loading ? (
                    <LatestVisitorsSkeleton icon={<Clock className="h-5 w-5" />} />
                ) : (
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
                                key={`visitors-${selectedDomain?.id || 'all'}-${fromDate}-${toDate}`}
                                visitors={visitors}
                                fromDate={fromDate}
                                toDate={toDate}
                            />
                            <VisitorDataTable
                                key={`visitors-table-${selectedDomain?.id || 'all'}-${fromDate}-${toDate}`}
                                fromDate={fromDate}
                                toDate={toDate}
                                pageSize={5}
                                preloadedPages={2}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Continent Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {loading ? (
                        <MapStatisticsSkeleton
                            title="Visitors by Continent"
                            description="Distribution of visitors by continent"
                            icon={<Globe className="h-5 w-5" />}
                        />
                    ) : (
                        <MapStatisticsCard
                            key={`continent-map-${selectedDomain?.id || 'all'}-${fromDate}-${toDate}`}
                            statistics={continentStatistics}
                            geometries={continentGeometries}
                            icon={<Globe className="h-5 w-5" />}
                            title="Visitors by Continent"
                            description="Distribution of visitors by continent"
                        />
                    )}
                    {loading ? (
                        <AreaStatisticsTableSkeleton
                            title="Continents"
                            description="Visitor statistics by continent"
                            icon={<Globe className="h-5 w-5" />}
                        />
                    ) : (
                        <AreaStatisticsTable
                            key={`continent-table-${selectedDomain?.id || 'all'}-${fromDate}-${toDate}`}
                            statistics={continentStatistics}
                            title="Continents"
                            description="Visitor statistics by continent"
                            showFlag={true}
                            icon={<Globe className="h-5 w-5" />}
                        />
                    )}
                </div>

                {/* Country Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {loading ? (
                        <MapStatisticsSkeleton
                            title="Visitors by Country"
                            description="Distribution of visitors by country"
                            icon={<MapPin className="h-5 w-5" />}
                        />
                    ) : (
                        <MapStatisticsCard
                            key={`country-map-${selectedDomain?.id || 'all'}-${fromDate}-${toDate}`}
                            statistics={countryStatistics}
                            geometries={countryGeometries}
                            upperRegions={UPPER_REGIONS}
                            icon={<MapPin className="h-5 w-5" />}
                            title="Visitors by Country"
                            description="Distribution of visitors by country"
                        />
                    )}
                    {loading ? (
                        <AreaStatisticsTableSkeleton
                            title="Countries"
                            description="Visitor statistics by country"
                            icon={<MapPin className="h-5 w-5" />}
                        />
                    ) : (
                        <AreaStatisticsTable
                            key={`country-table-${selectedDomain?.id || 'all'}-${fromDate}-${toDate}`}
                            statistics={countryStatistics}
                            title="Countries"
                            description="Visitor statistics by country"
                            icon={<MapPin className="h-5 w-5" />}
                        />
                    )}
                </div>

                {/* User Agent Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {loading ? (
                        <UserAgentPieChartSkeleton
                            title="Browser Distribution"
                            description="Distribution of visitors by browser"
                            icon={<Monitor className="h-5 w-5" />}
                        />
                    ) : (
                        <UserAgentPieChart
                            key={`user-agent-chart-${selectedDomain?.id || 'all'}-${fromDate}-${toDate}`}
                            userAgentDistribution={userAgentDistribution}
                            title="Browser Distribution"
                            description="Distribution of visitors by browser"
                            icon={<Monitor className="h-5 w-5" />}
                        />
                    )}
                    {loading ? (
                        <UserAgentTableSkeleton
                            title="Browsers"
                            description="Visitor statistics by browser"
                            icon={<Monitor className="h-5 w-5" />}
                        />
                    ) : (
                        <UserAgentTable
                            key={`user-agent-table-${selectedDomain?.id || 'all'}-${fromDate}-${toDate}`}
                            userAgentDistribution={userAgentDistribution}
                            title="Browsers"
                            description="Visitor statistics by browser"
                            icon={<Monitor className="h-5 w-5" />}
                        />
                    )}
                </div>

            </div>
        </div>
    );
}

export default Statistics;

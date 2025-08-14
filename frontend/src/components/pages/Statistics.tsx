import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState, PaginationState } from "@tanstack/react-table";

import { CustomChart } from "@/components/ui/custom-chart";
import { MapContainer, GeoJSON } from "react-leaflet";

import "leaflet/dist/leaflet.css";
import type { GeoJsonObject } from "geojson";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { Skeleton } from "@/components/ui/skeleton";

import type { AreaStatistics, AreaGeometry, Visitor, UserAgentDistribution } from "@/services/apiStatistics";
import StatisticsApiService, { LevelChoices } from "@/services/apiStatistics";
import { DomainApiService } from "@/services/apiDomain";
import type { Domain } from "@/services/apiDomain";
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

// Statistics Header Component
interface StatisticsHeaderProps {
    selectedDomain: Domain | null;
    domains: Domain[];
    onDomainChange: (domain: Domain | null) => void;
    lastDays: number;
    onLastDaysChange: (days: number) => void;
}

function StatisticsHeader({ selectedDomain, domains, onDomainChange, lastDays, onLastDaysChange }: StatisticsHeaderProps) {
    const validDays = [1, 7, 14, 30, 60, 90, 180, 365];

    return (
        <div className="flex flex-col justify-between gap-4 sm:items-center sm:flex-row mb-6">
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
                                onDomainChange(null);
                            } else {
                                const domain = domains.find(d => d.id.toString() === value);
                                onDomainChange(domain || null);
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
                        value={lastDays.toString()}
                        onValueChange={(value) => onLastDaysChange(parseInt(value))}
                    >
                        <SelectTrigger className="w-38">
                            <SelectValue placeholder="Last days" />
                        </SelectTrigger>
                        <SelectContent>
                            {validDays.map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                    {day === 1 ? 'Last day' : `Last ${day} days`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

            </div>
        </div>
    );
}

// Map Statistics Card Component
interface MapStatisticsCardProps {
    statistics: AreaStatistics[] | null;
    level: LevelChoices;
    title: string;
    description: string;
    icon: React.ReactNode;
}

function MapStatisticsCard({ statistics, level, title, description, icon }: MapStatisticsCardProps) {
    const [geometries, setGeometries] = useState<AreaGeometry[] | null>(null);
    const [map, setMap] = useState<any>(null);
    const [geoJSON, setGeoJSON] = useState<any>(null);

    useEffect(() => {
        const fetchGeometries = async () => {
            const geometries = await StatisticsApiService.getAreaGeometries(level);
            setGeometries(geometries);

            fitToBounds();
        };
        fetchGeometries();
    }, [level]);

    useEffect(() => {
        fitToBounds();
    }, [map, geoJSON]);

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

    if (!geometries || geometries?.length === 0) {
        return <MapStatisticsSkeleton title={title} description={description} icon={icon} />
    }

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
                <div className="relative h-[250px]">
                    <MapContainer
                        ref={setMap}
                        key={`${level}-${statistics?.length || 0}`}
                        // center={[51.505, -0.09]}
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
                        style={{ height: "100%", width: "100%", minHeight: "250px" }}
                        className="rounded-lg !bg-transparent"
                    >
                        <GeoJSON
                            ref={setGeoJSON}
                            key={`${level}-${geometries?.length || 0}`}
                            data={geometries as unknown as GeoJsonObject}
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
}

function AreaStatisticsTable({ statistics, title, description, showFlag = false }: AreaStatisticsTableProps) {
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
    visitors: Visitor[];
    lastDays: number;
}

function LatestVisitorsChart({ visitors, lastDays }: LatestVisitorsChartProps) {
    // Generate array of dates for the last N days
    const generateDateRange = () => {
        const dates: string[] = [];
        const today = new Date();
        for (let i = lastDays - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split("T")[0] || ""); // YYYY-MM-DD format
        }
        return dates;
    };

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
    const dateRange = generateDateRange();
    const chartData = dateRange.map((date: string) => ({
        date: new Date(date).toLocaleDateString("en-US", { 
            month: "short", 
            day: "numeric" 
        }),
        count: groupedVisitors[date] || 0
    }));
    
    if (lastDays === 1) {
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
}

// Latest Visitors Data Table Component
interface LatestVisitorsDataTableProps {
    visitors: Visitor[];
}

function LatestVisitorsDataTable({ visitors }: LatestVisitorsDataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 5,
    })

    const columns: ColumnDef<Visitor>[] = [
        {
            accessorKey: "ip_address",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="IP Address" />
            ),
            cell: ({ row }) => <div className="font-medium">{row.getValue("ip_address")}</div>,
        },
        {
            accessorKey: "location_description",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Location" />
            ),
            cell: ({ row }) => <div className="max-w-[150px] truncate">{row.getValue("location_description")}</div>,
        },
        {
            accessorKey: "domain",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Domain" />
            ),
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.getValue("domain")}
                </Badge>
            ),
        },
        {
            accessorKey: "created_at",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Timestamp" />
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue("created_at"))
                return <div className="max-w-[150px] truncate" title={date.toLocaleString()}>{date.toLocaleString()}</div>
            },
        },
        {
            accessorKey: "user_agent",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="User Agent" />
            ),
            cell: ({ row }) => {
                const userAgent = row.getValue("user_agent") as string
                return (
                    <div className="max-w-[150px] truncate" title={userAgent}>
                        {userAgent}
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data: visitors || [],
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
    })

    return (
        <div className="space-y-4">

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
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
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
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
    );
}

// User Agent Pie Chart Component
interface UserAgentPieChartProps {
    userAgentDistribution: UserAgentDistribution[];
    title: string;
    description: string;
}

function UserAgentPieChart({ userAgentDistribution, title, description }: UserAgentPieChartProps) {
    const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

    const data = userAgentDistribution.map((item, index) => ({
        name: item.browser,
        value: item.count,
        color: COLORS[index % COLORS.length]
    }));

    if (data.length === 0) {
        return <UserAgentPieChartSkeleton title={title} description={description} noData={true} />;
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
}

function UserAgentTable({ userAgentDistribution, title, description }: UserAgentTableProps) {
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
function LatestVisitorsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-32" />
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
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Skeleton className={cn("h-[250px] w-full rounded-lg animate-none bg-transparent border")}>
                    <div className="flex items-center justify-center h-full gap-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading ...</p>
                    </div>
                </Skeleton>
            </CardContent>
        </Card>
    );
}

function AreaStatisticsTableSkeleton({ title, description }: { title: string; description: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="mb-2">{title}</CardTitle>
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

function UserAgentPieChartSkeleton({ title, description, noData = false }: { title: string; description: string; noData?: boolean }) {
    const text = noData ? "No data available" : "Loading ...";
    
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
                <Skeleton className={cn("h-[250px] w-full rounded-lg", noData && "animate-none bg-transparent border")}>
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                </Skeleton>
            </CardContent>
        </Card>
    );
}

function UserAgentTableSkeleton({ title, description }: { title: string; description: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="mb-2">{title}</CardTitle>
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
    const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
    const [lastDays, setLastDays] = useState<number>(30);

    // Individual loading states
    const [countryStatisticsLoading, setCountryStatisticsLoading] = useState(true);
    const [continentStatisticsLoading, setContinentStatisticsLoading] = useState(true);
    const [visitorsLoading, setVisitorsLoading] = useState(true);
    const [userAgentDistributionLoading, setUserAgentDistributionLoading] = useState(true);

    // Data states
    const [countryStatistics, setCountryStatistics] = useState<AreaStatistics[]>([]);
    const [continentStatistics, setContinentStatistics] = useState<AreaStatistics[]>([]);
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [userAgentDistribution, setUserAgentDistribution] = useState<UserAgentDistribution[]>([]);

    // Load domains independently
    const loadDomains = useCallback(async () => {
        try {
            const domainsData = await DomainApiService.getDomains();
            setDomains(domainsData);
        } catch (error) {
            toast.error("Failed to load domains");
        }
    }, []);

    // Handle domain selection from URL parameter
    const handleDomainChange = useCallback((domain: Domain | null) => {
        setSelectedDomain(domain);
        
        // Update URL parameters
        if (domain) {
            setSearchParams({ domain: domain.id.toString() });
        } else {
            setSearchParams({});
        }
    }, [setSearchParams]);

    // Set initial domain from URL parameter
    useEffect(() => {
        const domainId = searchParams.get("domain");
        if (domainId && domains.length > 0) {
            const domain = domains.find(d => d.id.toString() === domainId);
            if (domain) {
                setSelectedDomain(domain);
            }
        }
    }, [searchParams, domains]);

    // Load country statistics independently
    const loadCountryStatistics = useCallback(async () => {
        try {
            setCountryStatisticsLoading(true);
            const areaStatsData = await StatisticsApiService.getAreaStatistics(selectedDomain?.id, LevelChoices.COUNTRY, lastDays);
            setCountryStatistics(areaStatsData);
        } catch (error) {
            toast.error("Failed to load country statistics");
        } finally {
            setCountryStatisticsLoading(false);
        }
    }, [selectedDomain?.id, lastDays]);

    // Load continent statistics independently
    const loadContinentStatistics = useCallback(async () => {
        try {
            setContinentStatisticsLoading(true);
            const continentStatsData = await StatisticsApiService.getAreaStatistics(selectedDomain?.id, LevelChoices.CONTINENT, lastDays);
            setContinentStatistics(continentStatsData);
        } catch (error) {
            toast.error("Failed to load continent statistics");
        } finally {
            setContinentStatisticsLoading(false);
        }
    }, [selectedDomain?.id, lastDays]);

    // Load visitors independently
    const loadVisitors = useCallback(async () => {
        try {
            setVisitorsLoading(true);
            const visitorsData = await StatisticsApiService.getLatestVisitors(selectedDomain?.id, lastDays);
            setVisitors(visitorsData);
        } catch (error) {
            toast.error("Failed to load visitors data");
        } finally {
            setVisitorsLoading(false);
        }
    }, [selectedDomain?.id, lastDays]);

    // Load user agent distribution independently
    const loadUserAgentDistribution = useCallback(async () => {
        try {
            setUserAgentDistributionLoading(true);
            const userAgentDistributionData = await StatisticsApiService.getUserAgentDistribution(selectedDomain?.id, lastDays);
            setUserAgentDistribution(userAgentDistributionData);
        } catch (error) {
            toast.error("Failed to load user agent distribution");
        } finally {
            setUserAgentDistributionLoading(false);
        }
    }, [selectedDomain?.id, lastDays]);

    // Load domains on mount
    useEffect(() => {
        loadDomains();
    }, [loadDomains]);

    // Load statistics when domain or days change
    useEffect(() => {
        loadCountryStatistics();
        loadContinentStatistics();
        loadVisitors();
        loadUserAgentDistribution();
    }, [loadCountryStatistics, loadContinentStatistics, loadVisitors, loadUserAgentDistribution]);
    
    return (
        <div>
            <StatisticsHeader
                selectedDomain={selectedDomain}
                domains={domains}
                onDomainChange={handleDomainChange}
                lastDays={lastDays}
                onLastDaysChange={setLastDays}
            />

            <div className="space-y-6 mt-6">
                {/* Latest visitors */}
                {visitorsLoading ? (
                    <LatestVisitorsSkeleton />
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
                                visitors={visitors}
                                lastDays={lastDays}
                            />
                            <LatestVisitorsDataTable
                                visitors={visitors}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Continent Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {continentStatisticsLoading ? (
                        <MapStatisticsSkeleton
                            title="Visitors by Continent"
                            description="Distribution of visitors by continent"
                            icon={<Globe className="h-5 w-5" />}
                        />
                    ) : (
                        <MapStatisticsCard
                            statistics={continentStatistics}
                            level={LevelChoices.CONTINENT}
                            icon={<Globe className="h-5 w-5" />}
                            title="Visitors by Continent"
                            description="Distribution of visitors by continent"
                        />
                    )}
                    {continentStatisticsLoading ? (
                        <AreaStatisticsTableSkeleton
                            title="Continents"
                            description="Visitor statistics by continent"
                        />
                    ) : (
                        <AreaStatisticsTable
                            statistics={continentStatistics}
                            title="Continents"
                            description="Visitor statistics by continent"
                            showFlag={true}
                        />
                    )}
                </div>

                {/* Country Statistics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {countryStatisticsLoading ? (
                        <MapStatisticsSkeleton
                            title="Visitors by Country"
                            description="Distribution of visitors by country"
                            icon={<MapPin className="h-5 w-5" />}
                        />
                    ) : (
                        <MapStatisticsCard
                            statistics={countryStatistics}
                            level={LevelChoices.COUNTRY}
                            icon={<MapPin className="h-5 w-5" />}
                            title="Visitors by Country"
                            description="Distribution of visitors by country"
                        />
                    )}
                    {countryStatisticsLoading ? (
                        <AreaStatisticsTableSkeleton
                            title="Countries"
                            description="Visitor statistics by country"
                        />
                    ) : (
                        <AreaStatisticsTable
                            statistics={countryStatistics}
                            title="Countries"
                            description="Visitor statistics by country"
                        />
                    )}
                </div>

                {/* User Agent Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {userAgentDistributionLoading ? (
                        <UserAgentPieChartSkeleton
                            title="Browser Distribution"
                            description="Distribution of visitors by browser"
                        />
                    ) : (
                        <UserAgentPieChart
                            userAgentDistribution={userAgentDistribution}
                            title="Browser Distribution"
                            description="Distribution of visitors by browser"
                        />
                    )}
                    {userAgentDistributionLoading ? (
                        <UserAgentTableSkeleton
                            title="Browsers"
                            description="Visitor statistics by browser"
                        />
                    ) : (
                        <UserAgentTable
                            userAgentDistribution={userAgentDistribution}
                            title="Browsers"
                            description="Visitor statistics by browser"
                        />
                    )}
                </div>

            </div>
        </div>
    );
}

export default Statistics;

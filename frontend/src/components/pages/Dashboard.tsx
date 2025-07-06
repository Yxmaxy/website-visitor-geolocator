import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Link } from "react-router";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState, PaginationState } from "@tanstack/react-table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import type { Visitor } from "@/services/apiStatistics";
import StatisticsApiService from "@/services/apiStatistics";

import {
    BarChart3,
    Globe,
    Settings,
    TrendingUp,
    Users,
    ArrowRight,
    Gauge,
} from "lucide-react";

// Navigation Card Component
interface NavigationCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
}

function NavigationCard({ title, description, icon, href }: NavigationCardProps) {
    return (
        <Link to={href} className="block">
            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg bg-black`}>
                            {icon}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-lg mb-2">{title}</CardTitle>
                    <CardDescription className="text-sm">{description}</CardDescription>
                </CardContent>
            </Card>
        </Link>
    );
}

// Visitor Trends Chart Component
interface VisitorTrendsChartProps {
    visitors: Visitor[];
    title: string;
    description: string;
}

function VisitorTrendsChart({ visitors, title, description }: VisitorTrendsChartProps) {
    // Generate data for last 7, 14, and 30 days
    const generateTrendData = () => {
        const periods = [7, 14, 30];
        const data = periods.map(days => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            const visitorsInPeriod = visitors.filter(visitor => 
                new Date(visitor.created_at) >= cutoffDate
            );
            
            return {
                period: `${days} days`,
                visitors: visitorsInPeriod.length
            };
        });
        
        return data;
    };

    const chartData = generateTrendData();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {title}
                </CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="[& *]:outline-transparent">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="period" 
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis />
                            <Tooltip />
                            <Line 
                                type="monotone" 
                                dataKey="visitors" 
                                stroke="#000000" 
                                strokeWidth={2}
                                dot={{ fill: "#000000", strokeWidth: 2, r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
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
            cell: ({ row }) => <div>{row.getValue("location_description")}</div>,
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
                return <div>{date.toLocaleString()}</div>
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Latest Visitors</h3>
                </div>
                <Link to="/statistics">
                    <Button variant="outline" size="sm">
                        View All Statistics
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>

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
                                    className="h-24 text-center"
                                >
                                    No visitors found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

// Skeleton Components
function VisitorTrendsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-[300px] w-full" />
            </CardContent>
        </Card>
    );
}

function LatestVisitorsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-6 w-32" />
                    </div>
                    <Skeleton className="h-8 w-32" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-md border">
                    <div className="p-4 space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-32" />
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
            </CardContent>
        </Card>
    );
}

// Main Dashboard Component
function Dashboard() {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [visitorsLoading, setVisitorsLoading] = useState(true);

    // Load visitors data
    const loadVisitors = useCallback(async () => {
        try {
            setVisitorsLoading(true);
            const visitorsData = await StatisticsApiService.getLatestVisitors(undefined, 30);
            setVisitors(visitorsData);
        } catch (error) {
            toast.error("Failed to load visitors data");
        } finally {
            setVisitorsLoading(false);
        }
    }, []);

    // Load data on mount
    useEffect(() => {
        loadVisitors();
    }, [loadVisitors]);

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-6 h-12">
                <Gauge className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Dashboard</h1>
            </div>

            <div className="space-y-6">
                {/* Navigation Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <NavigationCard
                        title="Statistics"
                        description="View detailed visitor analytics and trends"
                        icon={<BarChart3 className="h-5 w-5 text-white" />}
                        href="/statistics"
                    />
                    <NavigationCard
                        title="My Domains"
                        description="Manage your tracking domains and settings"
                        icon={<Globe className="h-5 w-5 text-white" />}
                        href="/domains"
                    />
                    <NavigationCard
                        title="Settings"
                        description="Configure your account and preferences"
                        icon={<Settings className="h-5 w-5 text-white" />}
                        href="/settings"
                    />
                </div>

                {/* Visitor Trends Chart */}
                {visitorsLoading ? (
                    <VisitorTrendsSkeleton />
                ) : (
                    <VisitorTrendsChart
                        visitors={visitors}
                        title="Visitor Trends"
                        description="Number of visitors in the last 7, 14, and 30 days"
                    />
                )}

                {/* Latest Visitors Table */}
                {visitorsLoading ? (
                    <LatestVisitorsSkeleton />
                ) : (
                    <Card>
                        <CardContent>
                            <LatestVisitorsDataTable visitors={visitors} />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default Dashboard;

import { useState, memo, useMemo } from "react";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState, PaginationState } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

import type { Visitor } from "@/services/apiStatistics";

// Latest Visitors Data Table Component
interface VisitorTableProps {
    visitors: Visitor[];
    pageSize?: number;
    hideColumns?: string[];
    domainId?: number | null;
}

export const VisitorDataTable = memo(function VisitorDataTable({ visitors, pageSize, hideColumns, domainId }: VisitorTableProps) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: pageSize || 10,
    })
    const [selectedIP, setSelectedIP] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleRowClick = (ipAddress: string) => {
        setSelectedIP(ipAddress);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedIP(null);
    };

    const allColumns: ColumnDef<Visitor>[] = [
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

    const columns = useMemo(() => {
        return allColumns.filter((column) => {
            const columnId = (column as any).accessorKey || column.id;
            return !hideColumns?.includes(columnId);
        });
    }, [hideColumns])


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
                                    onClick={() => handleRowClick(row.getValue("ip_address") as string)}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
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
});

import { useState, useEffect, memo, useCallback } from "react";
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import type { SortingState, PaginationState } from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

import StatisticsApiService, { type Visitor } from "@/services/api/apiStatistics";
import { useVisitorColumns } from "./columns";

interface VisitorDataTableProps {
    fromDate?: Date;
    toDate?: Date;
    pageSize: number;
    preloadedPages: number;
    hideColumns?: string[];
}

// Latest Visitors Data Table Component
function VisitorDataTable({
    fromDate = undefined,
    toDate = undefined,
    pageSize = 5,
    preloadedPages = 1,
    hideColumns = []
}: VisitorDataTableProps) {
    const columns = useVisitorColumns(hideColumns);
    const [sorting, setSorting] = useState<SortingState>([])
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: pageSize,
    })

    const [allData, setAllData] = useState<Visitor[]>([]);
    
    const [currentBackendPage, setCurrentBackendPage] = useState<number | undefined>(1);
    const [fetchedPages, setFetchedPages] = useState<number[]>([]);
    const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    const handleRowClick = (ipAddress: string) => {
        console.log(ipAddress)
    };

    const loadData = useCallback(async () => {
        setIsLoading(true);
        if (fetchedPages.includes(currentBackendPage as number) || !currentBackendPage) {
            return;
        }

        try {
            const response = await StatisticsApiService.getLatestVisitors(
                undefined, // domain_id
                fromDate?.toISOString().split("T")[0],
                toDate?.toISOString().split("T")[0],
                currentBackendPage,
                pageSize * preloadedPages,
            );
            setFetchedPages([...fetchedPages, currentBackendPage || 1]);
            setAllData([...allData, ...response.results]);
            setTotalPages(response.total_pages * preloadedPages);
            setCurrentBackendPage(response.next || undefined);
        } finally {
            setIsLoading(false);
        }
    }, [currentBackendPage]);

    // Fetch data when the backend page changes or when the first page is loaded
    useEffect(() => {
        if (currentBackendPage && (pagination.pageIndex) % preloadedPages === 0) {
            loadData();
        }
    }, [pagination.pageIndex]);

    const table = useReactTable({
        data: allData,
        columns,
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        state: {
            sorting,
            pagination,
        },
    })

    return (
        <div className="space-y-4">
            
            <div className="rounded-md border">
                <Table>
                    {/* Table Header */}
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

                    {/* Table Body */}
                    <TableBody>
                        {
                            (table.getRowModel().rows.map((row) => (
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
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination
                table={table}
                totalPages={totalPages}
                nextAvailable={currentBackendPage !== undefined}
                isFetching={isLoading}
            />
        </div>
    );
}

export default memo(VisitorDataTable);

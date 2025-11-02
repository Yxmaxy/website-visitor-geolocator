import { useState, useEffect, memo, useMemo } from "react";
import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table";
import type { SortingState, PaginationState } from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

import StatisticsApiService, { type PaginatedResponse, type Visitor } from "@/services/api/apiStatistics";
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

    const [paginatedData, setPaginatedData] = useState<Record<number, Visitor[]>>({});

    const [totalPages, setTotalPages] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    const loadData = async (backendPage: number) => {
        setIsLoading(true);
        const pagesToPreload = preloadedPages + 1;
        const response = await StatisticsApiService.getLatestVisitors(
            undefined, // domain_id
            fromDate?.toISOString().split("T")[0],
            toDate?.toISOString().split("T")[0],
            (backendPage / pagesToPreload) + 1,
            pageSize * pagesToPreload,
        );
        setIsLoading(false);
        return response;
    };

    useEffect(() => {
        loadData(0).then((data: PaginatedResponse<Visitor>) => {
            setPaginatedData({ 0: data.results });
            setTotalPages(Math.ceil(data.count / (pageSize)));
        });
    }, []);

    useEffect(() => {
        const currentPage = pagination.pageIndex + 1;
        if (paginatedData.hasOwnProperty(currentPage)) {
            return;
        }
        if (totalPages !== undefined && currentPage >= totalPages) {
            return;
        }
        if (currentPage % (preloadedPages + 1) === 0) {
            loadData(pagination.pageIndex + 1).then((data: PaginatedResponse<Visitor>) => {
                setPaginatedData(prev => ({ ...prev, [currentPage]: data.results }));
            });
        }
    }, [pagination.pageIndex, preloadedPages]);

    const data = useMemo(() => {
        return Object.values(paginatedData).flat();
    }, [paginatedData]);

    const table = useReactTable({
        data: data,
        columns,
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        state: {
            sorting,
            pagination,
        },
        autoResetPageIndex: false,
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
                                    // onClick={() => handleRowClick(row.getValue("ip_address") as string)}
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
                isPageFetching={isLoading}
            />
        </div>
    );
}

export default memo(VisitorDataTable);

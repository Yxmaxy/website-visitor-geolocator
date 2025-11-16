import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Badge } from "@/components/ui/badge";

import type { Visitor } from "@/services/api/apiStatistics";


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

const useVisitorColumns = (hideColumns?: string[]) => {
    return useMemo<ColumnDef<Visitor>[]>(() => {
        return allColumns.filter((column) => {
            const columnId = (column as any).accessorKey || column.id;
            return !hideColumns?.includes(columnId);
        });
    }, [hideColumns])
}

export { useVisitorColumns };

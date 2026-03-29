import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Badge } from "@/components/ui/badge";

import type { Visitor } from "@/services/api/apiStatistics";


export const columns: ColumnDef<Visitor>[] = [
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
            return <div className="max-w-[150px] truncate">{date.toLocaleString()}</div>
        },
    },
    {
        id: "browser",
        accessorFn: (row) => row.user_agent_parsed?.browser ?? "Unknown",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Browser" />
        ),
        cell: ({ row }) => <div className="max-w-[150px] truncate">{row.getValue("browser")}</div>,
    },
    {
        id: "os",
        accessorFn: (row) => row.user_agent_parsed?.os ?? "Unknown",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Operating System" />
        ),
        cell: ({ row }) => <div className="max-w-[150px] truncate">{row.getValue("os")}</div>,
    },
]

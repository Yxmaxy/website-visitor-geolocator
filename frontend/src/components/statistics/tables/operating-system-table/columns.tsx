import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

import type { OperatingSystemDistribution } from "@/services/api/apiStatistics";


export const columns: ColumnDef<OperatingSystemDistribution>[] = [
    {
        accessorKey: "operating_system",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Operating System" />
        ),
        cell: ({ row }) => {
            const os = row.getValue("operating_system") as string;
            return (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{os}</span>
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
    {
        id: "percentage",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Percentage" />
        ),
        cell: ({ row, table }) => {
            const count = row.getValue("count") as number;
            const total = table.getCoreRowModel().rows.reduce(
                (sum, r) => sum + (r.getValue("count") as number), 0
            );
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
            return (
                <div className="font-medium text-muted-foreground">
                    {percentage}%
                </div>
            );
        },
    },
]

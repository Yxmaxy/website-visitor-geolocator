import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

import type { UserAgentDistribution } from "@/services/api/apiStatistics";


export const columns: ColumnDef<UserAgentDistribution>[] = [
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
]

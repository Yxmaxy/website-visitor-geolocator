import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { getCountryFlag } from "@/services/flags";

import type { AreaStatistics } from "@/services/api/apiStatistics";


export const columns: ColumnDef<AreaStatistics>[] = [
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
                    <span className="text-lg leading-0.5">{countryFlag}</span>
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
]

import type { ColumnDef } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { getCountryFlag } from "@/services/flags";

import { LevelChoices, type AreaStatistics } from "@/services/api/apiStatistics";


export const columns = (level: LevelChoices = LevelChoices.COUNTRY): ColumnDef<AreaStatistics>[] => [
    {
        accessorKey: "area_name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={level === LevelChoices.CONTINENT ? "Continent" : "Country"} />
        ),
        cell: ({ row }) => {
            const areaName = row.getValue("area_name") as string;
            const countryFlag = getCountryFlag(areaName);
            return (
                <div className="flex items-center gap-2">
                    {level === LevelChoices.COUNTRY && <span className="text-lg leading-0.5">{countryFlag}</span>}
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
    {
        id: "percentage",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Percentage" />
        ),
        cell: ({ row, table }) => {
            const count = row.getValue("visitor_count") as number;
            const total = table.getCoreRowModel().rows.reduce(
                (sum, r) => sum + (r.getValue("visitor_count") as number), 0
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

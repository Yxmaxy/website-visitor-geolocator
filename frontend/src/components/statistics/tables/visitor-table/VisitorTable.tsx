import { useState, useEffect } from "react";

import StatisticsTable, { type StatisticsTableProps } from "@/components/statistics/tables/StatisticsTable";
import { IPDetailsModal } from "@/components/IPDetailsModal";
import StatisticsApiService, { type Visitor } from "@/services/api/apiStatistics";

import { columns } from "./columns";

interface VisitorTableProps extends StatisticsTableProps {
    initialSelectedIp?: string;
    disableRowClick?: boolean;
}

export default function VisitorTable({
    domainId,
    fromDate,
    toDate,
    ipAddress,
    pageSize,
    preloadedPages,
    hideColumns,
    initialSelectedIp,
    disableRowClick,
}: VisitorTableProps) {
    const [selectedIp, setSelectedIp] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (initialSelectedIp) {
            setSelectedIp(initialSelectedIp);
            setIsModalOpen(true);
        }
    }, [initialSelectedIp]);

    const handleRowClick = (row: Visitor) => {
        setSelectedIp(row.ip_address);
        setIsModalOpen(true);
    };

    return (
        <>
            <StatisticsTable<Visitor>
                columns={columns}
                dataRetriever={StatisticsApiService.getLatestVisitors}
                domainId={domainId}
                fromDate={fromDate}
                toDate={toDate}
                ipAddress={ipAddress}
                pageSize={pageSize}
                preloadedPages={preloadedPages}
                hideColumns={hideColumns}
                onRowClick={disableRowClick ? undefined : handleRowClick}
            />
            {selectedIp && (
                <IPDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedIp(null);
                    }}
                    ipAddress={selectedIp}
                    domainId={domainId ?? null}
                />
            )}
        </>
    );
}

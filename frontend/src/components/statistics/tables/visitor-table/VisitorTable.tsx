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
    const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (initialSelectedIp) {
            StatisticsApiService.getLatestVisitors({
                ipAddress: initialSelectedIp,
                domainId: domainId ?? undefined,
                pageSize: 1,
                page: 1,
            }).then((data) => {
                if (data.results[0]) {
                    setSelectedVisitor(data.results[0]);
                    setIsModalOpen(true);
                }
            });
        }
    }, [initialSelectedIp]);

    const handleRowClick = (row: Visitor) => {
        setSelectedVisitor(row);
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
            {selectedVisitor && (
                <IPDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedVisitor(null);
                    }}
                    visitor={selectedVisitor}
                    domainId={domainId ?? null}
                />
            )}
        </>
    );
}

import { useState, useEffect } from "react";
import { MapPin, Globe, Clock, Calendar as CalendarIcon, Monitor } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import VisitorDataTable from "@/components/statistics/tables/visitor-table/VisitorTable";
import StatisticsApiService, { type Visitor } from "@/services/api/apiStatistics";

interface IPDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    ipAddress: string;
    domainId?: number | null;
}

function MetadataItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2">
            <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium truncate">{value}</p>
            </div>
        </div>
    );
}

export function IPDetailsModal({ isOpen, onClose, ipAddress, domainId }: IPDetailsModalProps) {
    const [metadata, setMetadata] = useState<Visitor | null>(null);
    const [metadataLoading, setMetadataLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !ipAddress) return;

        setMetadataLoading(true);

        // Fetch most recent visit for metadata
        StatisticsApiService.getLatestVisitors({
            ipAddress,
            domainId: domainId ?? undefined,
            pageSize: 1,
            page: 1,
        }).then((data) => {
            setMetadata(data.results[0] ?? null);
            setMetadataLoading(false);
        });
    }, [isOpen, ipAddress, domainId]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent aria-describedby={undefined} className="sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        IP Address Details: {ipAddress}
                    </DialogTitle>
                </DialogHeader>

                {/* Metadata Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Visitor Info</CardTitle>
                        <CardDescription>Latest known information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {metadataLoading ? (
                            <div className="grid grid-cols-2 gap-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <Skeleton className="h-4 w-4 mt-0.5" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-3 w-16" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>
                                ))}
                                <div className="col-span-2 flex items-start gap-2">
                                    <Skeleton className="h-4 w-4 mt-0.5" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-4 w-64" />
                                    </div>
                                </div>
                            </div>
                        ) : metadata ? (
                            <div className="grid grid-cols-2 gap-4">
                                <MetadataItem icon={Globe} label="Location" value={metadata.location_description} />
                                <MetadataItem icon={Clock} label="Timezone" value={metadata.timezone || "Unknown"} />
                                <MetadataItem icon={CalendarIcon} label="Last Seen" value={new Date(metadata.created_at).toLocaleString()} />
                                <MetadataItem icon={MapPin} label="Domain" value={metadata.domain} />
                                <div className="col-span-2">
                                    <MetadataItem icon={Monitor} label="User Agent" value={metadata.user_agent} />
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No visit data available.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Visits Table */}
                <Card className="min-w-0">
                    <CardHeader>
                        <CardTitle className="text-lg">All Visits</CardTitle>
                        <CardDescription>
                            Complete history of visits from this IP address
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <VisitorDataTable
                            domainId={domainId ?? undefined}
                            ipAddress={ipAddress}
                            fromDate={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()}
                            toDate={new Date().toISOString()}
                            pageSize={10}
                            preloadedPages={3}
                            hideColumns={["ip_address"]}
                            disableRowClick
                        />
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
}

import { MapPin, Globe, Clock, Calendar as CalendarIcon, Monitor, Smartphone, Laptop, Bot, Tablet } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import VisitorLocationMap from "@/components/VisitorLocationMap";
import VisitorDataTable from "@/components/statistics/tables/visitor-table/VisitorTable";
import type { Visitor } from "@/services/api/apiStatistics";

interface IPDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    visitor: Visitor;
    domainId?: number | null;
}

function MetadataItem({ icon: Icon, label, value, wrap }: { icon: React.ElementType; label: string; value: string; wrap?: boolean }) {
    return (
        <div className="flex items-start gap-2">
            <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-sm font-medium ${wrap ? "break-all" : "truncate"}`}>{value}</p>
            </div>
        </div>
    );
}

export function IPDetailsModal({ isOpen, onClose, visitor, domainId }: IPDetailsModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent aria-describedby={undefined} className="sm:max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        IP Address Details: {visitor.ip_address}
                    </DialogTitle>
                </DialogHeader>

                {/* Metadata Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Visitor Info</CardTitle>
                        <CardDescription>Information for this visit</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left column: 6 metadata rows */}
                            <div className="grid grid-cols-1 gap-4 order-1">
                                <MetadataItem icon={MapPin} label="IP address" value={visitor.ip_address} />
                                <MetadataItem icon={Globe} label="Location" value={visitor.location_description} />
                                <MetadataItem icon={Clock} label="Timezone" value={visitor.timezone || "Unknown"} />
                                <MetadataItem icon={CalendarIcon} label="Visited At" value={new Date(visitor.created_at).toLocaleString()} />
                                {visitor.user_agent_parsed ? (
                                    <>
                                        <MetadataItem
                                            icon={Globe}
                                            label="Browser"
                                            value={[visitor.user_agent_parsed.browser, visitor.user_agent_parsed.browser_version].filter(Boolean).join(" ")}
                                        />
                                        <MetadataItem
                                            icon={Monitor}
                                            label="Operating System"
                                            value={[visitor.user_agent_parsed.os, visitor.user_agent_parsed.os_version].filter(Boolean).join(" ")}
                                        />
                                        <MetadataItem
                                            icon={visitor.user_agent_parsed.is_bot ? Bot : visitor.user_agent_parsed.is_tablet ? Tablet : visitor.user_agent_parsed.is_mobile ? Smartphone : Laptop}
                                            label="Device"
                                            value={[
                                                visitor.user_agent_parsed.device_family,
                                                visitor.user_agent_parsed.device_brand,
                                                visitor.user_agent_parsed.device_model !== visitor.user_agent_parsed.device_family ? visitor.user_agent_parsed.device_model : null,
                                            ].filter(Boolean).join(" - ") || (
                                                visitor.user_agent_parsed.is_bot ? "Bot" :
                                                visitor.user_agent_parsed.is_tablet ? "Tablet" :
                                                visitor.user_agent_parsed.is_mobile ? "Mobile" : "PC"
                                            )}
                                        />
                                    </>
                                ) : (
                                    <MetadataItem icon={Monitor} label="Device" value="Unknown" />
                                )}
                            </div>

                            {/* Full-width row: raw user agent — before map on small, after on md+ */}
                            <div className="md:col-span-2 order-2 md:order-3">
                                <MetadataItem icon={Monitor} label="User Agent" value={visitor.user_agent} wrap />
                            </div>

                            {/* Right column: map spanning all rows */}
                            {visitor.latitude != null && visitor.longitude != null && (
                                <div className="h-[260px] md:h-full md:min-h-[260px] rounded-lg overflow-hidden border order-3 md:order-2">
                                    <VisitorLocationMap latitude={visitor.latitude} longitude={visitor.longitude} />
                                </div>
                            )}
                        </div>
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
                            ipAddress={visitor.ip_address}
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

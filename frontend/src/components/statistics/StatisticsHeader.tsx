import { useState, useEffect, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { DomainApiService, type Domain } from "@/services/api/apiDomain";


interface StatisticsHeaderProps {
    icon: ReactNode;
    title: string;
    selectedDomain?: Domain;
    setSelectedDomain: (domain?: Domain) => void;
    fromDate: string;
    toDate: string;
    setFromDate: (fromDate: string) => void;
    setToDate: (toDate: string) => void;
}

function StatisticsHeader({
    icon,
    title,
    selectedDomain,
    setSelectedDomain,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
}: StatisticsHeaderProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const [domains, setDomains] = useState<Domain[]>([]);
    const [dateRange, setDateRange] = useState<string|undefined>("30");

    const [showCustomDateRange, setShowCustomDateRange] = useState(false);

    useEffect(() => {
        const initialLoad = async () => {
            try {
                const domains = await DomainApiService.getDomains();
                setDomains(domains);

                const domainId = searchParams.get("domain");
                if (domainId && domains.length > 0) {
                    const domain = domains.find(d => d.id.toString() === domainId);
                    if (domain) {
                        setSelectedDomain(domain);
                    }
                }
            } catch (error) {
                toast.error("Failed to load domains");
                throw error;
            }
        }
        initialLoad();
    }, []);

    useEffect(() => {
        if (selectedDomain?.id) {
            setSearchParams({ domain: selectedDomain.id.toString() }, { replace: true });
        } else {
            setSearchParams({}, { replace: true });
        }
    }, [selectedDomain?.id]);

    useEffect(() => {
        if (!dateRange) return;

        const today = new Date();
        const fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - parseInt(dateRange));
        setFromDate(fromDate.toISOString().split("T")[0] || "");

        const toDate = new Date(today);
        toDate.setDate(toDate.getDate() + 1);
        setToDate(toDate.toISOString().split("T")[0] || "");
    }, [dateRange]);

    return (
        <div className="flex flex-col justify-between gap-4 sm:items-center sm:flex-row mb-6 min-h-12">
            <div className="flex items-center gap-2">
                {icon}
                <h1 className="text-2xl font-bold">{title}</h1>
            </div>
            <div className="flex items-center gap-4 flex-wrap justify-end">

                <div className="flex items-center gap-2">
                    <Select
                        value={selectedDomain?.id?.toString() || "all"}
                        onValueChange={(value) => {
                            if (value === "all") {
                                setSelectedDomain(undefined);
                            } else {
                                const domain = domains.find(d => d.id.toString() === value);
                                setSelectedDomain(domain || undefined);
                            }
                        }}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select domain" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Domains</SelectItem>
                            {domains.map((domain) => (
                                <SelectItem key={domain.id} value={domain.id.toString()}>
                                    {domain.domain}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Select
                        value={dateRange?.toString()}
                        onValueChange={(value) => {
                            if (value === "custom") {
                                setShowCustomDateRange(true);
                                setDateRange(undefined);
                            } else {
                                setShowCustomDateRange(false);
                                setDateRange(value);
                            }
                        }}
                    >
                        <SelectTrigger className="w-38">
                            <SelectValue placeholder="Last days" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">
                                Last 7 days
                            </SelectItem>
                            <SelectItem value="14">
                                Last 14 days
                            </SelectItem>
                            <SelectItem value="30">
                                Last 30 days
                            </SelectItem>
                            <SelectItem value="90">
                                Last 90 days
                            </SelectItem>
                            <SelectItem value="365">
                                Last 365 days
                            </SelectItem>
                            <SelectItem value="custom">
                                Custom
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    {showCustomDateRange && (
                        <div className="flex items-center gap-2">
                            <Input type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                            <Input type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                max={new Date().toISOString().split("T")[0]}
                            />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

export default StatisticsHeader;

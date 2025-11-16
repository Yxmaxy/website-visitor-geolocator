import { useState, useEffect } from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import type { FeatureCollection } from "geojson";
import { toast } from "sonner";

import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import StatisticsApiService, { LevelChoices, type AreaStatistics } from "@/services/api/apiStatistics";

interface AreaMapProps {    
    domainId?: number;
    fromDate?: string;
    toDate?: string;

    mapLevel: LevelChoices;
    selectedRegion?: SelectableRegion;
}

export default function AreaMap({
    domainId = undefined,
    fromDate = undefined,
    toDate = undefined,
    mapLevel = LevelChoices.CONTINENT,
    selectedRegion = undefined,
}: AreaMapProps) {
    const [map, setMap] = useState<any>(null);
    const [geoJSON, setGeoJSON] = useState<any>(null);
    const [geometries, setGeometries] = useState<FeatureCollection | null>(null);

    const [statistics, setStatistics] = useState<AreaStatistics[] | null>(null);

    function fitToBounds() {
        if (geometries && map && geoJSON) {
            map.invalidateSize();
            map.fitBounds(geoJSON.getBounds());
        }
    }

    useEffect(() => {
        fitToBounds();
    }, [map, geoJSON]);

    useEffect(() => {
        if (selectedRegion === undefined) {
            fitToBounds();
        } else if (map) {
            // Set the center and zoom level for the selected region
            map.setView(selectedRegion.center, selectedRegion.zoom);
        }
    }, [selectedRegion, map]);

    useEffect(() => {
        StatisticsApiService
            .getAreaGeometries(mapLevel)
            .then(setGeometries)
            .catch(() => toast.error("Failed to load geometries"));
    }, [mapLevel]);

    useEffect(() => {
        StatisticsApiService
            .getAreaStatistics({ domainId, fromDate, toDate, level: mapLevel })
            .then(response => setStatistics(response.results))
            .catch(() => toast.error("Failed to load statistics"));
    }, [domainId, fromDate, toDate, mapLevel]);

    // color intensity based on visitor count
    const visitorCountMap = new Map(statistics?.map(area => [area.area_name, area.visitor_count]) || []);
    const maxVisitorCount = Math.max(...Array.from(visitorCountMap.values()), 1);

    const style = (feature: any) => {
        const visitorCount = visitorCountMap.get(feature.properties.name) || 0;
        const intensity = visitorCount / (maxVisitorCount * 1.5) + 0.1;
        return {
            weight: 0,
            color: "var(--muted-foreground)",
            opacity: 1,
            fillColor: "var(--primary)",
            fillOpacity: intensity,
        };
    };

    const onEachFeature = (feature: any, layer: any) => {    
        const visitorCount = visitorCountMap.get(feature.properties.name) || 0;
        if (visitorCount > 0) {
            layer.bindTooltip(
                `<b>${feature.properties.name}</b><br/>Visitors: ${visitorCount}`,
                { permanent: false, sticky: true, className: "text-black" }
            );
        }
    };

    if (!geometries || !statistics) {
        return <AreaMapSkeleton />
    }

    return (
        <div className="relative h-[280px]">
            <MapContainer
                ref={setMap}
                center={[0, 0]}
                zoom={1}
                zoomControl={false}
                dragging={false}
                attributionControl={false}
                doubleClickZoom={false}
                boxZoom={false}
                scrollWheelZoom={false}
                touchZoom={false}
                keyboard={false}
                style={{ height: "100%", width: "100%", minHeight: "280px" }}
                className="rounded-lg !bg-transparent"
            >
                <GeoJSON
                    ref={setGeoJSON}
                    data={geometries}
                    style={style}
                    onEachFeature={onEachFeature}
                    interactive={true}
                />
            </MapContainer>
        </div>
    );
}

export interface SelectableRegion {
    name: string;
    zoom: number;
    center: [number, number]; // [latitude, longitude]
}

interface AreaRegionSelectProps {
    selectableRegions: SelectableRegion[];
    selectedRegion: SelectableRegion | undefined;
    setSelectedRegion: (region: SelectableRegion | undefined) => void;
}

export function AreaRegionSelect({ selectableRegions, selectedRegion, setSelectedRegion }: AreaRegionSelectProps) {
    function setSelectedRegionFromName(name: string) {
        setSelectedRegion(selectableRegions?.find(region => region.name === name));
    }

    return (
        <div className="flex items-center gap-2">
            <Select
                value={selectedRegion?.name}
                onValueChange={setSelectedRegionFromName}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {selectableRegions.map((region) => (
                        <SelectItem key={region.name} value={region.name}>
                            {region.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function AreaMapSkeleton() {
    return (
        <Skeleton className="h-[280px] w-full rounded-lg animate-none bg-transparent border">
            <div className="flex items-center justify-center h-full gap-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">Loading ...</p>
            </div>
        </Skeleton>
    );
}

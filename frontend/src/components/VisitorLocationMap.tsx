import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import { useTheme } from "next-themes";
import "leaflet/dist/leaflet.css";

interface VisitorLocationMapProps {
    latitude: number;
    longitude: number;
}

const TILE_URLS = {
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

export default function VisitorLocationMap({ latitude, longitude }: VisitorLocationMapProps) {
    const { resolvedTheme } = useTheme();
    const [map, setMap] = useState<any>(null);

    const tileUrl = resolvedTheme === "dark" ? TILE_URLS.dark : TILE_URLS.light;

    useEffect(() => {
        if (map) {
            map.invalidateSize();
        }
    }, [map]);

    return (
        <MapContainer
            ref={setMap}
            center={[latitude, longitude]}
            zoom={9}
            zoomControl={false}
            attributionControl={false}
            dragging={false}
            doubleClickZoom={false}
            boxZoom={false}
            scrollWheelZoom={false}
            touchZoom={false}
            keyboard={false}
            style={{ height: "100%", width: "100%", minHeight: "180px" }}
            className="rounded-lg"
        >
            <TileLayer url={tileUrl} />
            <CircleMarker
                center={[latitude, longitude]}
                radius={8}
                pathOptions={{
                    color: "#ffffff",
                    fillColor: "#0073ab",
                    fillOpacity: 1,
                    weight: 2,
                }}
            />
        </MapContainer>
    );
}

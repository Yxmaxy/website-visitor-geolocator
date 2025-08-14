import { ApiService } from "@/services/api";
import CacheService from "@/services/cacheService";
import type { FeatureCollection } from "geojson";

export enum LevelChoices {
    COUNTRY = 1,
    CONTINENT = 0,
}

export interface AreaStatistics {
    area_name: string;
    visitor_count: number;
}

export interface AreaGeometry {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        properties: {
            name: string;
            level: number;
        };
        geometry: any; // GeoJSON geometry
    }>;
}

export interface Visitor {
    id: number;
    ip_address: string;
    location_description: string;
    timezone: string;
    user_agent: string;
    created_at: string;
    domain: string;
}

export interface UserAgentDistribution {
    browser: string;
    count: number;
}

class StatisticsApiService {
    static buildQueryString(params: any): string {
        // helper function to build query string from params
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                searchParams.append(key, value?.toString() ?? "");
            }
        }
        return searchParams.toString();
    }

    // area
    static async getAreaGeometries(level: LevelChoices = LevelChoices.COUNTRY): Promise<FeatureCollection> {
        const cacheKey = `area_geometries_${level}`;
        const cacheTime = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

        // Check if cached result is available and not expired
        const cachedGeometries = await CacheService.getWithFallback<FeatureCollection>(cacheKey);
        if (cachedGeometries) {
            return cachedGeometries;
        }

        // fetch from API if not cached or expired
        const queryString = this.buildQueryString({ level });
        const geometries = await ApiService.get<any>(`/statistics/geometries/?${queryString}`);

        // cache the result with automatic expiration
        if (geometries && geometries.features.length > 0) {
            await CacheService.setWithFallback(cacheKey, geometries, cacheTime);
        }
        return geometries;
    }

    static async getAreaStatistics(domain_id: number | null, level: LevelChoices = LevelChoices.COUNTRY, days: number = 30): Promise<AreaStatistics[]> {
        const queryString = this.buildQueryString({ domain_id, level, days });
        return ApiService.get<AreaStatistics[]>(`/statistics/area/?${queryString}`);
    }

    static async getLatestVisitors(domain_id: number | null, days: number = 30): Promise<Visitor[]> {
        const queryString = this.buildQueryString({ domain_id, days });
        return ApiService.get<Visitor[]>(`/statistics/visitors/?${queryString}`);
    }

    static async getUserAgentDistribution(domain_id: number | null, days: number = 30): Promise<UserAgentDistribution[]> {
        const queryString = this.buildQueryString({ domain_id, days });
        return ApiService.get<UserAgentDistribution[]>(`/statistics/user-agents/?${queryString}`);
    }
}

export default StatisticsApiService;

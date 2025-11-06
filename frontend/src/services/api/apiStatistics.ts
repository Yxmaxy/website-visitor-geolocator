import { ApiService } from "@/services/api/api";

import CacheService from "@/services/cache";
import type { FeatureCollection } from "geojson";

export enum LevelChoices {
    COUNTRY = 1,
    CONTINENT = 0,
}

export interface PaginatedResponse<T> {
    count: number;
    next?: number;
    previous?: number;
    results: T[];
    total_pages: number;
}

export interface AreaStatistics {
    area_name: string;
    visitor_count: number;
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
    private static geometryPromises: Record<string, Promise<FeatureCollection>> = {};

    static buildQueryString(params: Record<string, any>): string {
        // helper function to build query string from params
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && typeof value !== "undefined") {
                searchParams.append(key, value?.toString() ?? "");
            }
        }
        return searchParams.toString();
    }

    // area
    static async getAreaGeometries(level: LevelChoices = LevelChoices.COUNTRY): Promise<FeatureCollection> {
        const cacheKey = `area_geometries_${level}`;
        const cacheTime = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

        const cachedGeometries = await CacheService.get<FeatureCollection>(cacheKey);
        if (cachedGeometries) {
            return cachedGeometries;
        }

        // returns promise if request is already in progress
        if (this.geometryPromises[cacheKey]) {
            return await this.geometryPromises[cacheKey];
        } else {
            const queryString = this.buildQueryString({ level });
            this.geometryPromises[cacheKey] = ApiService.get(`/statistics/geometries/?${queryString}`);
        }

        const geometries = await this.geometryPromises[cacheKey];
        if (geometries && geometries.features.length > 0) {
            await CacheService.set(cacheKey, geometries, cacheTime);
        }
        return geometries;
    }

    static async getAreaStatistics(
        domain_id?: number,
        from_date?: string,
        to_date?: string,
        level: LevelChoices = LevelChoices.COUNTRY,
    ): Promise<AreaStatistics[]> {
        const queryString = this.buildQueryString({ domain_id, from_date, to_date,level });
        return ApiService.get<AreaStatistics[]>(`/statistics/area/?${queryString}`);
    }

    static async getLatestVisitors(
        domain_id?: number,
        from_date?: string,
        to_date?: string,
        page?: number,
        page_size?: number,
        ordering?: string,
    ): Promise<PaginatedResponse<Visitor>> {
        const queryString = this.buildQueryString({ domain_id, from_date, to_date, page, page_size, ordering });
        return ApiService.get<PaginatedResponse<Visitor>>(`/statistics/visitor/list/?${queryString}`);
    }

    static async getUserAgentDistribution(
        domain_id?: number,
        from_date?: string,
        to_date?: string,
    ): Promise<UserAgentDistribution[]> {
        const queryString = this.buildQueryString({ domain_id, from_date, to_date });
        return ApiService.get<UserAgentDistribution[]>(`/statistics/user-agents/?${queryString}`);
    }
}

export default StatisticsApiService;

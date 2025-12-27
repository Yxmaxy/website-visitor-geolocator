import { createDjangoApi } from "django-session-api";

import CacheService from "@/services/cache";
import type { FeatureCollection } from "geojson";

const api = createDjangoApi({
    baseUrl: import.meta.env.VITE_BASE_BACKEND_API_URL,
    loginUrl: import.meta.env.VITE_LOGIN_URL,
});

export enum LevelChoices {
    COUNTRY = 1,
    CONTINENT = 0,
}

export interface StatisticsParameters {
    domainId?: number,
    fromDate?: string,
    toDate?: string,
    level?: LevelChoices,
};

export interface PaginatedStatisticsParameters extends StatisticsParameters {
    page?: number,
    pageSize?: number,
    ordering?: string,
};

export interface PaginatedResponse<T> {
    count: number;
    next?: number;
    previous?: number;
    results: T[];
    total_pages: number;
}

// data models
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

export interface VisitorCountByDate {
    date: string;
    count: number;
}


class StatisticsApiService {
    static buildQueryString(params: Record<string, any>): string {
        // helper function to build query string from params
        // removes undefined and null values
        // converts keys from camelCase to snake_case
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null && typeof value !== "undefined") {
                const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
                searchParams.append(snakeKey, value?.toString() ?? "");
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

        const queryString = StatisticsApiService.buildQueryString({ level });
        const geometries = await api.get<FeatureCollection>(`/statistics/geometries/?${queryString}`);

        if (geometries && geometries.features.length > 0) {
            await CacheService.set(cacheKey, geometries, cacheTime);
        }
        return geometries ?? { type: "FeatureCollection", features: [] };
    }

    static async getAreaStatistics(options: PaginatedStatisticsParameters): Promise<PaginatedResponse<AreaStatistics>> {
        const queryString = StatisticsApiService.buildQueryString(options);
        return api.get<PaginatedResponse<AreaStatistics>>(`/statistics/area/?${queryString}`);
    };

    static async getLatestVisitors(options: PaginatedStatisticsParameters): Promise<PaginatedResponse<Visitor>> {
        const queryString = StatisticsApiService.buildQueryString(options);
        return api.get<PaginatedResponse<Visitor>>(`/statistics/visitor/list/?${queryString}`);
    }

    static async getUserAgentDistribution(options: PaginatedStatisticsParameters): Promise<PaginatedResponse<UserAgentDistribution>> {
        const queryString = StatisticsApiService.buildQueryString(options);
        return api.get<PaginatedResponse<UserAgentDistribution>>(`/statistics/user-agents/?${queryString}`);
    }

    static async getVisitorCountByDate(options: StatisticsParameters): Promise<VisitorCountByDate[]> {
        const queryString = StatisticsApiService.buildQueryString(options);
        return api.get<VisitorCountByDate[]>(`/statistics/visitor/count/?${queryString}`);
    }
}

export default StatisticsApiService;

import { ApiService } from "@/services/api";

export interface Domain {
    id: number;
    domain: string;
    api_key: string;
    geolocation_api_token_ipinfo: string;
    active: boolean;
    created_at: string;
    updated_at: string;
    script_url?: string;
    script_tag?: string;
}

export interface DomainCreate {
    domain: string;
    geolocation_api_token_ipinfo?: string;
}

export interface DomainUpdate {
    domain?: string;
    geolocation_api_token_ipinfo?: string;
    active?: boolean;
}

export interface DomainScript {
    script_url: string;
    script_tag: string;
    api_key: string;
}

export class DomainApiService {
    static async getDomains(): Promise<Domain[]> {
        return ApiService.get<Domain[]>("/domain/list/");
    }

    static async createDomain(data: DomainCreate): Promise<Domain> {
        return ApiService.post<Domain, DomainCreate>("/domain/create/", data);
    }

    static async updateDomain(domainId: number, data: DomainUpdate): Promise<Domain> {
        return ApiService.put<Domain, DomainUpdate>(`/domain/${domainId}/`, data);
    }

    static async deleteDomain(domainId: number): Promise<void> {
        return ApiService.delete(`/domain/${domainId}/`);
    }
}

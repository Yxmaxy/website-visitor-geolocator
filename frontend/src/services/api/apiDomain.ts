import { createDjangoApi } from "@yxmaxy/django-session-api";

const api = createDjangoApi({
    baseUrl: import.meta.env.VITE_BASE_BACKEND_API_URL,
    loginUrl: import.meta.env.VITE_LOGIN_URL,
});

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
        return api.get<Domain[]>("/domain/");
    }

    static async createDomain(data: DomainCreate): Promise<Domain> {
        return api.post<Domain, DomainCreate>("/domain/", data);
    }

    static async updateDomain(domainId: number, data: DomainUpdate): Promise<Domain> {
        return api.put<Domain, DomainUpdate>(`/domain/${domainId}/`, data);
    }

    static async deleteDomain(domainId: number): Promise<void> {
        return api.delete(`/domain/${domainId}/`);
    }
}

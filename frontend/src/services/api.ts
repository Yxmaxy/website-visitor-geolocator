// Types and Interfaces
export interface ApiResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    ok: boolean;
}

export interface ApiError {
    message: string;
    status: number;
    statusText: string;
    url: string;
    timestamp: string;
}

export interface RequestConfig {
    timeout?: number;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    useNotificationUrl?: boolean;
}

// Custom Error Classes
export class ApiError extends Error {
    public status: number;
    public statusText: string;
    public url: string;
    public timestamp: string;

    constructor(message: string, status: number, statusText: string, url: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.statusText = statusText;
        this.url = url;
        this.timestamp = new Date().toISOString();
    }
}

export class NetworkError extends Error {
    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = "NetworkError";
    }
}

export class TimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TimeoutError";
    }
}

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AuthenticationError";
    }
}

// Authentication handling
function handleAuthenticationError(status: number): void {
    if (status === 403 || status === 401) {
        const loginUrl = import.meta.env.VITE_LOGIN_URL;
        if (loginUrl) {
            // Redirect to login page
            window.location.href = loginUrl;
        } else {
            console.error('VITE_LOGIN_URL is not configured');
        }
        throw new AuthenticationError(`Authentication required. Status: ${status}`);
    }
}

// Utility Functions
export function getCookie(name: string): string | null {
    let cookieValue: string | null = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i]?.trim();
            if (cookie && cookie.substring(0, name.length + 1) === (name + "=")) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function createTimeoutSignal(timeoutMs: number): AbortSignal {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller.signal;
}

function buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...customHeaders,
    };
    
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
        headers["X-CSRFToken"] = csrfToken;
    }
    
    return headers;
}

async function handleResponse<T>(response: Response, url: string): Promise<T> {
    if (!response.ok) {
        // Handle authentication errors first
        handleAuthenticationError(response.status);
        
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        throw new ApiError(errorMessage, response.status, response.statusText, url);
    }
    
    try {
        // Handle empty responses
        const text = await response.text();
        if (!text) {
            return {} as T;
        }
        return JSON.parse(text) as T;
    } catch (parseError) {
        throw new ApiError(
            `Failed to parse response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
            response.status,
            response.statusText,
            url
        );
    }
}

export class ApiService {
    private static readonly DEFAULT_TIMEOUT = 10000; // 10 seconds
    private static readonly BASE_URL = import.meta.env.VITE_BASE_BACKEND_API_URL;
    private static readonly NOTIFICATIONS_URL = import.meta.env.VITE_NOTIFICATIONS_URL;

    static async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
        const timeout = config?.timeout ?? this.DEFAULT_TIMEOUT;
        const signal = config?.signal ?? createTimeoutSignal(timeout);
        const headers = buildHeaders(config?.headers);

        try {
            const response = await fetch(`${config?.useNotificationUrl ? this.NOTIFICATIONS_URL : this.BASE_URL}${url}`, {
                method: "GET",
                credentials: "include",
                headers,
                signal,
            });
            
            return await handleResponse<T>(response, url);
        } catch (error) {
            if (error instanceof ApiError || error instanceof AuthenticationError) {
                throw error;
            }
            
            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    throw new TimeoutError(`Request timeout after ${timeout}ms`);
                }
                throw new NetworkError(`Network error: ${error.message}`, error);
            }
            
            throw new NetworkError("Unknown network error occurred");
        }
    }

    static async post<T = any, D = any>(url: string, data: D, config?: RequestConfig): Promise<T> {
        const timeout = config?.timeout ?? this.DEFAULT_TIMEOUT;
        const signal = config?.signal ?? createTimeoutSignal(timeout);
        const headers = buildHeaders(config?.headers);

        try {
            const response = await fetch(`${config?.useNotificationUrl ? this.NOTIFICATIONS_URL : this.BASE_URL}${url}`, {
                method: "POST",
                credentials: "include",
                headers,
                body: JSON.stringify(data),
                signal,
            });
            
            return await handleResponse<T>(response, url);
        } catch (error) {
            if (error instanceof ApiError || error instanceof AuthenticationError) {
                throw error;
            }
            
            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    throw new TimeoutError(`Request timeout after ${timeout}ms`);
                }
                throw new NetworkError(`Network error: ${error.message}`, error);
            }
            
            throw new NetworkError("Unknown network error occurred");
        }
    }

    static async put<T = any, D = any>(url: string, data: D, config?: RequestConfig): Promise<T> {
        const timeout = config?.timeout ?? this.DEFAULT_TIMEOUT;
        const signal = config?.signal ?? createTimeoutSignal(timeout);
        const headers = buildHeaders(config?.headers);

        try {
            const response = await fetch(`${config?.useNotificationUrl ? this.NOTIFICATIONS_URL : this.BASE_URL}${url}`, {
                method: "PUT",
                credentials: "include",
                headers,
                body: JSON.stringify(data),
                signal,
            });
            
            return await handleResponse<T>(response, url);
        } catch (error) {
            if (error instanceof ApiError || error instanceof AuthenticationError) {
                throw error;
            }
            
            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    throw new TimeoutError(`Request timeout after ${timeout}ms`);
                }
                throw new NetworkError(`Network error: ${error.message}`, error);
            }
            
            throw new NetworkError("Unknown network error occurred");
        }
    }

    static async delete(url: string, config?: RequestConfig): Promise<void> {
        const timeout = config?.timeout ?? this.DEFAULT_TIMEOUT;
        const signal = config?.signal ?? createTimeoutSignal(timeout);
        const headers = buildHeaders(config?.headers);

        try {
            const response = await fetch(`${config?.useNotificationUrl ? this.NOTIFICATIONS_URL : this.BASE_URL}${url}`, {
                method: "DELETE",
                credentials: "include",
                headers,
                signal,
            });
            
            if (!response.ok) {
                // Handle authentication errors first
                handleAuthenticationError(response.status);
                
                const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                throw new ApiError(errorMessage, response.status, response.statusText, url);
            }
        } catch (error) {
            if (error instanceof ApiError || error instanceof AuthenticationError) {
                throw error;
            }
            
            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    throw new TimeoutError(`Request timeout after ${timeout}ms`);
                }
                throw new NetworkError(`Network error: ${error.message}`, error);
            }
            
            throw new NetworkError("Unknown network error occurred");
        }
    }

    // Utility method to check if an error is an ApiError
    static isApiError(error: unknown): error is ApiError {
        return error instanceof ApiError;
    }

    // Utility method to check if an error is a NetworkError
    static isNetworkError(error: unknown): error is NetworkError {
        return error instanceof NetworkError;
    }

    // Utility method to check if an error is a TimeoutError
    static isTimeoutError(error: unknown): error is TimeoutError {
        return error instanceof TimeoutError;
    }

    // Utility method to check if an error is an AuthenticationError
    static isAuthenticationError(error: unknown): error is AuthenticationError {
        return error instanceof AuthenticationError;
    }
}

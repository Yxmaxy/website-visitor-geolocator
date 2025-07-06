interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

class CacheService {
    private static dbName = "WebsiteVisitorGeolocatorCache";
    private static dbVersion = 1;
    private static storeName = "cache";
    private static db: IDBDatabase | null = null;

    static async init(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: "key" });
                }
            };
        });
    }

    static async set<T>(key: string, data: T, ttlMs: number = 3 * 24 * 60 * 60 * 1000): Promise<void> {
        await this.init();

        const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttlMs
        };

        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized"));
                return;
            }

            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.put({ key, ...item });

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    static async get<T>(key: string): Promise<T | null> {
        await this.init();

        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve(null);
                return;
            }

            const transaction = this.db.transaction([this.storeName], "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const result = request.result;
                if (!result) {
                    resolve(null);
                    return;
                }

                const item: CacheItem<T> = {
                    data: result.data,
                    timestamp: result.timestamp,
                    expiresAt: result.expiresAt
                };

                // Check if expired
                if (Date.now() > item.expiresAt) {
                    this.delete(key);
                    resolve(null);
                    return;
                }

                resolve(item.data);
            };
        });
    }

    static async delete(key: string): Promise<void> {
        await this.init();

        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve();
                return;
            }

            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    static async clear(): Promise<void> {
        await this.init();

        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve();
                return;
            }

            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    // Fallback to localStorage for small data (under 1MB)
    static async setWithFallback<T>(key: string, data: T, ttlMs: number = 3 * 24 * 60 * 60 * 1000): Promise<void> {
        const dataSize = JSON.stringify(data).length;
        const oneMB = 1024 * 1024;

        if (dataSize < oneMB) {
            // Use localStorage for small data
            const item: CacheItem<T> = {
                data,
                timestamp: Date.now(),
                expiresAt: Date.now() + ttlMs
            };
            localStorage.setItem(key, JSON.stringify(item));
        } else {
            // Use IndexedDB for large data
            await this.set(key, data, ttlMs);
        }
    }

    static async getWithFallback<T>(key: string): Promise<T | null> {
        // Try localStorage first
        const localStorageItem = localStorage.getItem(key);
        if (localStorageItem) {
            try {
                const item: CacheItem<T> = JSON.parse(localStorageItem);
                if (Date.now() <= item.expiresAt) {
                    return item.data;
                } else {
                    localStorage.removeItem(key);
                }
            } catch (error) {
                localStorage.removeItem(key);
            }
        }

        // Try IndexedDB
        return await this.get<T>(key);
    }

    static async deleteWithFallback(key: string): Promise<void> {
        localStorage.removeItem(key);
        await this.delete(key);
    }
}

export default CacheService;

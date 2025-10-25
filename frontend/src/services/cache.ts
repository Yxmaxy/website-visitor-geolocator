interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}


class CacheServiceIndexedDB {
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
}


class CacheServiceLocalStorage {
    static async set<T>(key: string, data: T, ttlMs: number = 3 * 24 * 60 * 60 * 1000): Promise<void> {
        const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttlMs
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    static async get<T>(key: string): Promise<T | null> {
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
        return null;
    }

    static async delete(key: string): Promise<void> {
        localStorage.removeItem(key);
    }

    static async clear(): Promise<void> {
        localStorage.clear();
    }
}


export default class CacheService {
    static async set<T>(key: string, data: T, ttlMs: number = 3 * 24 * 60 * 60 * 1000): Promise<void> {
        const dataSize = JSON.stringify(data).length;
        const oneMB = 1024 * 1024;

        if (dataSize < oneMB) {
            await CacheServiceLocalStorage.set(key, data, ttlMs);
        } else {
            await CacheServiceIndexedDB.set(key, data, ttlMs);
        }
    }

    static async get<T>(key: string): Promise<T | null> {
        return await CacheServiceLocalStorage.get<T>(key) || await CacheServiceIndexedDB.get<T>(key);
    }

    static async delete(key: string): Promise<void> {
        await CacheServiceLocalStorage.delete(key);
        await CacheServiceIndexedDB.delete(key);
    }

    static async clear(): Promise<void> {
        await CacheServiceLocalStorage.clear();
        await CacheServiceIndexedDB.clear();
    }
}

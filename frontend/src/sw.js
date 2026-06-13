import { clientsClaim } from "workbox-core"
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching"
import { serviceWorkerPushHandler } from "@yxmaxy/django-simple-notifications";

import { APP_VERSION } from "@/services/version";

const DEBUG = import.meta.env.MODE === "development";
const CACHE_NAME = `wvg-cache-v1 ${APP_VERSION}`;

clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("install", (event) => {
    if (DEBUG) console.log(`Service worker installing version ${APP_VERSION}`);
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    if (DEBUG) console.log(`Service worker activating version ${APP_VERSION}`);
    event.waitUntil(clientsClaim());
});

// network first strategy
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.status !== 403 && response.status !== 401) {
                    // Clone the response and store it in the cache
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // If network fails, try to get it from the cache
                return caches.match(event.request);
            })
    );
});

self.addEventListener("push", (event) => {
    serviceWorkerPushHandler(self.registration, event);
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const url = event.notification.data?.url || "/";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            return clients.openWindow(url);
        })
    );
});

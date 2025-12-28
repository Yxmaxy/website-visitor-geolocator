import { clientsClaim } from "workbox-core"
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching"
import { serviceWorkerPushHandler } from "django-simple-notifications";

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

// // Notification click event
// self.addEventListener("notificationclick", (event) => {
//     console.log("Notification clicked:", event);

//     event.notification.close();

//     if (event.action === "view") {
//         // Open the dashboard
//         event.waitUntil(
//             clients.openWindow("/dashboard")
//         );
//     } else if (event.action === "dismiss") {
//         // Just close the notification
//         event.notification.close();
//     } else {
//         // Default action - open the main page
//         event.waitUntil(
//             clients.openWindow("/")
//         );
//     }
// });

// // Notification close event
// self.addEventListener("notificationclose", (event) => {
//     console.log("Notification closed:", event);
// });

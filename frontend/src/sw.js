import { clientsClaim } from "workbox-core"
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching"

const VERSION = "0.0.0";
const DEBUG = import.meta.env.MODE === "development";

clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("install", (event) => {
    if (DEBUG) console.log(`Service worker installing version ${VERSION}`);
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    if (DEBUG) console.log(`Service worker activating version ${VERSION}`);
    event.waitUntil(clientsClaim());
});

// cache first strategy
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
            })
    );
});

self.addEventListener("push", (event) => {
    let notificationData = {
        title: "New Notification",
        body: "You have a new notification",
        icon: "/logo.svg",
        badge: "/logo.svg",
        data: {}
    };

    // override default data
    if (event.data) {
        try {
            const pushData = event.data.json();
            notificationData = {
                ...notificationData,
                ...pushData
            };
        } catch (e) {
            console.error("Error parsing push data:", e);
        }
    }

    const options = {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        vibrate: notificationData.vibrate || [200, 100, 200],
        data: notificationData.data,
        requireInteraction: false,
        // actions: [
        //     {
        //         action: "view",
        //         title: "View Details",
        //         icon: "/logo.svg"
        //     },
        //     {
        //         action: "dismiss",
        //         title: "Dismiss",
        //         icon: "/logo.svg"
        //     }
        // ]
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
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

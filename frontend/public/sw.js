// Service Worker for push notifications
const CACHE_NAME = "website-visitor-geolocator-v1";
const urlsToCache = [
    "/",
    "/static/css/",
    "/static/js/",
    "/static/img/"
];

// Install event
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
    if (event.data) {
        console.log("Event data methods:", Object.getOwnPropertyNames(event.data));
        console.log("Event data text:", event.data.text ? event.data.text() : "no text method");
    }

    let notificationData = {
        title: "New Notification",
        body: "You have a new notification",
        icon: "/static/img/notification-icon.png",  // TODO: add icons
        badge: "/static/img/badge-icon.png",
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
        vibrate: notificationData.vibrate,
        data: notificationData.data,
        // requireInteraction: true,
        // actions: [
        //     {
        //         action: "view",
        //         title: "View Details",
        //         icon: "/static/img/view-icon.png"
        //     },
        //     {
        //         action: "dismiss",
        //         title: "Dismiss",
        //         icon: "/static/img/dismiss-icon.png"
        //     }
        // ]
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// Notification click event
// self.addEventListener("notificationclick", (event) => {
//     console.log("Notification clicked:", event);

//     event.notification.close();

//     if (event.action === "view") {
//         // Open the dashboard or specific page
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

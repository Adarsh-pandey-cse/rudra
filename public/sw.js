// Rudra Service Worker for Background Push Notifications

self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || "New Notification";
    const options = {
      body: data.body || "You have a new update in Rudra.",
      icon: "/favicon.ico",
      badge: "/favicon.ico", // Usually a small monochrome icon
      vibrate: [200, 100, 200],
      data: data.url || "/", // URL to open on click
      tag: data.tag || "rudra-notification", // Prevents duplicate notifications
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close(); // Close the notification

  // Open the URL specified in the notification data
  const urlToOpen = event.notification.data;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, just focus it.
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// We use self.firebaseConfig injected during build or initialized here.
// Since it's a static file, the safest way is to use URL parameters or just leave it blank and let Next.js 
// environment variables handle it. However, the service worker runs in a separate context without access to 
// process.env. To keep it fully dynamic, we can just intercept the push and use it. 
// Firebase actually expects us to initialize app here. 

// A better way is to pass the config from the client via query params when registering, but for now 
// we'll just handle raw push events if possible. If you need full FCM payload support, 
// replace these with your actual Firebase config (these are public anyway).

// Placeholder for config. You must replace this with your actual Firebase config in production.
const firebaseConfig = {
  apiKey: "REPLACE_WITH_API_KEY",
  authDomain: "REPLACE_WITH_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_PROJECT_ID",
  storageBucket: "REPLACE_WITH_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_APP_ID"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body,
      icon: '/icons/icon-192x192.svg',
      data: payload.data,
    };
  
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch(e) {
  // If config is not replaced, this will fail gracefully.
  console.log("Firebase SW init failed (missing config).");
}

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.link || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

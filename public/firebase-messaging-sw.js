
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

const params = new URL(location).searchParams;
const firebaseConfig = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId")
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // If the payload already has a notification object, Firebase's default SW behavior 
  // will automatically show it. We only need to manually show if it's a data-only payload.
  if (payload.notification) {
    console.log('Payload has notification, letting Firebase handle it.');
    return;
  }

  const notificationTitle = payload.data?.title || 'New Notification';
  const notificationOptions = {
    body: payload.data?.body || payload.data?.message || '',
    icon: '/icons/icon-192x192.png',
    data: {
      link: payload.data?.link || '/'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Firebase automatically displays the notification in the background because
// we send a `notification` payload from the server.
// We only need to handle the click event if we want custom behavior not covered by fcmOptions.

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.link || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Check if there is already a window/tab open
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url.includes('/') && 'focus' in client) {
          const targetUrl = new URL(urlToOpen, self.location.origin).href;
          if (client.url !== targetUrl && 'navigate' in client) {
             client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

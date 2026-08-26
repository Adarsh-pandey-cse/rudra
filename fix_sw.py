import re

with open("public/firebase-messaging-sw.js", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the messaging.onBackgroundMessage to return the promise
# AND check if we shouldn't show it manually if notification is present (Firebase does it)

new_code = """messaging.onBackgroundMessage(function(payload) {
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
});"""

content = re.sub(
    r'messaging\.onBackgroundMessage\(function\(payload\) \{.*?self\.registration\.showNotification.*?\}\);',
    new_code,
    content,
    flags=re.DOTALL
)

with open("public/firebase-messaging-sw.js", "w", encoding="utf-8") as f:
    f.write(content)

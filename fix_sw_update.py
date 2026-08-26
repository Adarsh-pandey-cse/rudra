import re

with open("public/firebase-messaging-sw.js", "r", encoding="utf-8") as f:
    content = f.read()

# Add skipWaiting and claim
install_code = """
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
"""

if "self.skipWaiting" not in content:
    content = install_code + "\n" + content

with open("public/firebase-messaging-sw.js", "w", encoding="utf-8") as f:
    f.write(content)

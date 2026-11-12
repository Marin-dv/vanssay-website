/* Vanssay admin: Web Push only. No fetch handler, so it never touches caching
   or any other page on vanssay.net. Registered from admin.html. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { /* plain text push */ }
  // iOS requires every push to show a notification (no silent pushes).
  event.waitUntil(
    self.registration.showNotification(d.title || "Vanssay", {
      body: d.body || "",
      icon: "/assets/admin/icon-192.png",
      badge: "/assets/admin/icon-192.png",
      tag: d.tag || "vanssay-alert",
      data: { url: d.url || "/admin.html#/costs" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/admin.html", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.location.origin + "/admin") && "focus" in c) {
          if ("navigate" in c) c.navigate(url).catch(() => undefined);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

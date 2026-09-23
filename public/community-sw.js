// Service worker for The LifeCharter Collective (installable app + web push).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "The LifeCharter Collective", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "The LifeCharter Collective";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/community-icons/icon-192.png",
      badge: "/community-icons/badge-96.png",
      tag: data.tag || undefined,
      data: { href: data.href || "/community" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "/community";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (new URL(w.url).pathname.startsWith("/community") && "focus" in w) {
          w.navigate(href);
          return w.focus();
        }
      }
      return self.clients.openWindow(href);
    })
  );
});

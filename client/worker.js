console.log("Service Worker Loaded...");

self.addEventListener("push", event => {
  console.log("Push Received...", event);

  let data = {};

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    console.error("Error parsing push data", err);
  }

  const title = data.title || "Default title";
  const body = data.body || "Default body from push";
  const icon = "/icon.png"; // зроби, щоб такий файл реально існував

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
    })
      .then(() => {
        console.log("Notification shown");
      })
      .catch(err => {
        console.error("showNotification error:", err);
      })
  );
});
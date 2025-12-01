# Web push notifications about weather

This project sends push notifications about the weather, at the time you specify, depending on factors such as the temperature at certain hours.


## Introduction

The application begins by presenting a form that collects geolocation data and notification permissions. Using this interface [https://staging.d1c7rbnguh0mrc.amplifyapp.com/
](https://staging.d1c7rbnguh0mrc.amplifyapp.com/), users configure the preferred delivery time for weather updates and the conditions under which a notification should be triggered. Further details are available on the page itself.

---

## High-Level System Architecture

The overall design may be represented as a multi‑stage pipeline:

```
User Browser
    ↓
HTML Interface → Client JavaScript → Service Worker (worker.js)
    ↓
Google Web Push Service
    ↓
AWS API Gateway → Lambda (index.mjs) → DynamoDB (Weather Table)


Scheduled Lambda (post.mjs) → Weather API Evaluation → Push Notification
```



---

## User Interface and HTML Structure

Upon accessing the application, the user is presented with an interface that performs two fundamental actions:

1. Requests **geolocation permission**, required to identify the user’s position.
2. Requests **notification permission**, enabling browser-level push notifications.

After permissions are granted, the user may configure:

- A **time** at which a weather notification should be evaluated.
- A **criterion**, such as:
  - Temperature above X°C  
  - Temperature below Y°C  

A simplified representation of the HTML form is shown below:

```
<form id="rule-form">
    <input type="time" id="rule-time" />
    <select id="rule-condition">
        <option value="temp-above">Temperature Above</option>
        <option value="temp-below">Temperature Below</option>
    </select>
    <input type="number" id="rule-value" />
    <button id="add-rule">Add Rule</button>
</form>
```

---

## Client-Side JavaScript Logic

The client-side JavaScript fulfills several academic and architectural responsibilities:

### 1. Permission Acquisition

The system requests:

- **Geolocation** using `navigator.geolocation.getCurrentPosition`.
- **Push notification permission** using `Notification.requestPermission`.

Example structure:

```
navigator.geolocation.getCurrentPosition(...)
Notification.requestPermission(...)
```

### 2. Service Worker Registration

The browser installs a service worker (`worker.js`) responsible for processing background push notifications:

```
navigator.serviceWorker.register("worker.js")
```

### 3. Push Subscription Creation

The client generates a Web Push subscription using:

```
registration.pushManager.subscribe(...)
```

This generates endpoint and cryptographic keys stored later in DynamoDB.

### 4. Rule Submission

When a user submits the rule form, the client constructs a JSON object such as:

```
{
    lon,
    lat,
    timezone: "Europe/Kyiv",
    subscription: { endpoint, keys },
    time: "08:00",

    tempOp: "<",
    tempVal: -5,
    tempStart: 0,
    tempEnd: 23,

    windOp: ">",
    windVal: 20,
    windStart: 20,
    windEnd: 8,

    msg: "It's cold, wear a jacket"
}
```

This JSON is POSTed to AWS API Gateway(Lambda):

```
fetch("https://t707hb4dxg.execute-api.eu-west-1.amazonaws.com/prod/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule)
    })
```

---

## Service Worker Logic (worker.js)

The service worker is a persistent background script responsible for interpreting incoming push events.

### Push Event Lifecycle

```
Google Push Service
    ↓
Browser Receives Push
    ↓
worker.js "push" Event Listener
    ↓
Notification Display
```

A conceptual push handler:

```
self.addEventListener("push", event => {
    let data = event.data.json();
    self.registration.showNotification(data.title, { body: data.body });
});
```

The worker may also respond to notification clicks by opening or focusing a browser tab.

---

## Backend Architecture and AWS Components

### 1. API Gateway and index.mjs (Rule Storage Lambda)

The API Gateway acts as the public interface, forwarding POST requests to **index.mjs**, a Lambda function that:

- Stores the full rule object in the DynamoDB *Weather* table.

The execution pipeline:

```
Client → POST → API Gateway → Lambda (index.mjs) → DynamoDB
```

The Weather table stores recieved JSON strings

---

### 2. Scheduled Lambda (post.mjs) for Weather Evaluation

Every 5 minutes, AWS triggers the **post.mjs** Lambda function using Amazon EventBridge:

```
EventBridge Cron (*/5 * * * *) → Lambda (post.mjs)
```

This function:

1. Reads the **entire Weather table**.
2. Iterates over all stored rules.
3. Validates each rule.
4. Queries an external weather API.
5. Compares weather conditions against user criteria.
6. If conditions are met, sends a push notification.

Conceptual loop:

```
for each rule in DynamoDB:
    fetch weather for rule.coordinates
    if weather meets rule.criteria:
        send push notification
```

### Notification Transmission Diagram

```
post.mjs
    ↓
push.mjs (Web Push Sender)
    ↓
Google Web Push Service
    ↓
Browser
    ↓
worker.js (Notification Display)
```

The system is asynchronous and event-driven, making it suitable for scale and fault tolerance.

---

## Conclusion

The Web Push Weather Notification System demonstrates a comprehensive integration of browser technologies, serverless computing, and external APIs. It is structured into distinct but cooperating components:

The system consists:

- **Frontend** – handles geolocation and notification permissions, registers the service worker, creates the push subscription, and sends a JSON rule to the backend.

- **Service Worker** – receives push messages from the browser’s push service and displays notifications to the user.

- **Backend** – implemented using AWS:
  - **API Gateway** forwards POST requests from the client.
  - **index.mjs** writes the received JSON rule directly into the DynamoDB Weather table.
  - **push.mjs** performs all backend processing: reads stored rules, fetches weather data, evaluates criteria, and sends push notifications when conditions are met.





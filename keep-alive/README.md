# BTP App Keep-Alive

A simple Node.js utility to keep your SAP BTP application alive by pinging it
at a regular interval, preventing the platform from stopping it due to inactivity.

---

## 📁 Files in this folder

| File | Purpose |
|------|---------|
| `keep-alive.js` | Main script — pings the URL and logs results |
| `keep-alive.config.json` | **Edit this file** — set your URL and interval |
| `start-keep-alive.bat` | Double-click to run manually |
| `install-task-scheduler.bat` | Run once as Admin to auto-start on Windows login |
| `keep-alive.log` | Auto-created — contains ping history |

---

## 🚀 Quick Setup (3 steps)

### Step 1 — Set your BTP app URL

Open `keep-alive.config.json` and replace the URL:

```json
{
  "urls": [
    "https://YOUR-BTP-APP-URL.hana.ondemand.com"
  ],
  "intervalHours": 1,
  "maxLogLines": 500
}
```

- **`urls`** — Your BTP app URL(s). You can list more than one.
- **`intervalHours`** — How often to ping. `1` = every hour, `5` = every 5 hours.
- **`maxLogLines`** — How many log lines to keep before auto-trimming.

### Step 2 — Test it manually

Double-click **`start-keep-alive.bat`**

You should see output like:
```
[2026-04-17 16:00:00] ✅ ALIVE  | https://your-app.hana.ondemand.com | HTTP 200 | 342ms
[2026-04-17 16:00:00] ✔  All 1 URL(s) responded successfully.
[2026-04-17 16:00:00] ⏳ Next ping in 1 hour(s).
```

### Step 3 — Auto-start on Windows login (recommended)

Right-click **`install-task-scheduler.bat`** → **Run as Administrator**

This registers a Windows Task that:
- Starts automatically every time you log in
- Runs in the background (won't bother you)
- Keeps pinging 24/7 without any manual action

---

## ✅ How to check if it's working

Look at `keep-alive.log` — it will have a timestamped entry every hour.

---

## ❌ How to stop it

- **Manual mode**: Close the `start-keep-alive.bat` window.
- **Task Scheduler mode**: Open Task Scheduler → find `BTP-App-Keep-Alive` → Right-click → Disable or Delete.

---

## ⚙️ Multiple URLs

If you have more than one BTP app, add all URLs:

```json
{
  "urls": [
    "https://app1.hana.ondemand.com",
    "https://app2.hana.ondemand.com"
  ],
  "intervalHours": 1
}
```

All URLs will be pinged at the same time.

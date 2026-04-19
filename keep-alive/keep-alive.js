/**
 * ============================================================
 *  BTP App Keep-Alive Script
 *  Pings your SAP BTP app URL at a regular interval so the
 *  app never goes to sleep due to inactivity.
 * ============================================================
 *
 *  Usage:
 *    node keep-alive.js
 *
 *  Config is read from keep-alive.config.json in the same folder.
 *  Logs are written to keep-alive.log in the same folder.
 * ============================================================
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// ─── Load Config ─────────────────────────────────────────────
const CONFIG_FILE = path.join(__dirname, "keep-alive.config.json");

let config;
try {
  config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
} catch (e) {
  console.error(
    "❌ Could not read keep-alive.config.json. Did you create it?\n",
    e.message
  );
  process.exit(1);
}

const APP_URLS = Array.isArray(config.urls) ? config.urls : [config.url];
const INTERVAL_HOURS = config.intervalHours || 1;
const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;
const LOG_FILE = path.join(__dirname, "keep-alive.log");
const MAX_LOG_LINES = config.maxLogLines || 500;

// ─── Logger ──────────────────────────────────────────────────
function log(message) {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  const line = `[${timestamp}] ${message}`;
  console.log(line);

  // Append to log file and trim if needed
  try {
    let existing = "";
    if (fs.existsSync(LOG_FILE)) {
      existing = fs.readFileSync(LOG_FILE, "utf8");
    }
    const lines = existing.split("\n").filter(Boolean);
    lines.push(line);

    // Keep only last N lines to prevent huge log files
    const trimmed =
      lines.length > MAX_LOG_LINES
        ? lines.slice(lines.length - MAX_LOG_LINES)
        : lines;

    fs.writeFileSync(LOG_FILE, trimmed.join("\n") + "\n", "utf8");
  } catch (err) {
    // Non-fatal: log to console only
    console.error("Could not write to log file:", err.message);
  }
}

// ─── Ping a single URL ───────────────────────────────────────
function pingUrl(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const lib = url.startsWith("https") ? https : http;

    const req = lib.get(url, { timeout: 30000 }, (res) => {
      const elapsed = Date.now() - startTime;
      log(
        `✅ ALIVE  | ${url} | HTTP ${res.statusCode} | ${elapsed}ms`
      );
      // Drain the response so the connection closes cleanly
      res.resume();
      resolve({ url, success: true, status: res.statusCode, elapsed });
    });

    req.on("timeout", () => {
      req.destroy();
      log(`⏱️ TIMEOUT | ${url} | No response within 30s`);
      resolve({ url, success: false, error: "timeout" });
    });

    req.on("error", (err) => {
      log(`❌ ERROR   | ${url} | ${err.message}`);
      resolve({ url, success: false, error: err.message });
    });
  });
}

// ─── Ping all URLs ───────────────────────────────────────────
async function pingAll() {
  log(`🔔 Pinging ${APP_URLS.length} URL(s)...`);
  const results = await Promise.all(APP_URLS.map(pingUrl));
  const failed = results.filter((r) => !r.success);
  if (failed.length === 0) {
    log(`✔  All ${APP_URLS.length} URL(s) responded successfully.`);
  } else {
    log(`⚠️  ${failed.length} URL(s) did NOT respond.`);
  }
  log(`⏳ Next ping in ${INTERVAL_HOURS} hour(s).`);
}

// ─── Start ───────────────────────────────────────────────────
log("═══════════════════════════════════════════════");
log(` BTP Keep-Alive started`);
log(` Interval : every ${INTERVAL_HOURS} hour(s)`);
log(` URLs     : ${APP_URLS.join(", ")}`);
log("═══════════════════════════════════════════════");

// First ping immediately on startup
pingAll();

// Then ping on a regular interval
setInterval(pingAll, INTERVAL_MS);

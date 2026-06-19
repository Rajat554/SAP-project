const db = require('better-sqlite3')('db.sqlite');
const rows = db.prepare("SELECT * FROM WashWizardService_ServiceAnalyticsSet LIMIT 10").all();
console.log("ServiceAnalyticsSet entries count:", rows.length);
console.log("Entries:", JSON.stringify(rows, null, 2));
db.close();

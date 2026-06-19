const db = require('better-sqlite3')('db.sqlite');
const tables = db.prepare("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY name").all();
console.log(JSON.stringify(tables, null, 2));
db.close();

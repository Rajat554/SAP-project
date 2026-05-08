const cds = require('@sap/cds');

async function run() {
  await cds.connect.to('db');
  let result = await cds.db.read('WashWizard.Users').where({ Username: 'admin', Password: 'admin123' });
  console.log("DB RESULT:", result);
  process.exit(0);
}
run();

const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

// Zip a single micro-app folder into a .zip file
// Usage: node zip.js <appName>
// Example: node zip.js admin
//          -> zips app/portal/webapp/admin/ into app/portal/webapp/admin/admin.zip

const appName = process.argv[2];
if (!appName) {
  console.error("Usage: node zip.js <appName>");
  console.error("Available apps: admin, analytics, catalog, service-entries, service-records");
  process.exit(1);
}

const appDir = path.join(__dirname, 'app', appName, 'webapp');

if (!fs.existsSync(appDir)) {
  console.error(`App folder not found: ${appDir}`);
  process.exit(1);
}

const outputZip = path.join(appDir, `${appName}.zip`);
console.log(`Zipping ${appDir} -> ${outputZip} ...`);

const zip = new AdmZip();

// Add all files/folders in the app directory, excluding any existing .zip files
fs.readdirSync(appDir).forEach(file => {
  if (file.endsWith('.zip')) return; // skip existing zips
  const filePath = path.join(appDir, file);
  if (fs.statSync(filePath).isDirectory()) {
    zip.addLocalFolder(filePath, file);
  } else {
    zip.addLocalFile(filePath);
  }
});

zip.writeZip(outputZip);
console.log(`Successfully zipped ${appName}!`);

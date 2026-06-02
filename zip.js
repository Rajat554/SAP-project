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

// 1. Create manifest-bundle.zip (Required by SAP Build Work Zone)
const bundleZip = new AdmZip();
const manifestPath = path.join(appDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  bundleZip.addLocalFile(manifestPath);
}
const i18nPath = path.join(appDir, 'i18n');
if (fs.existsSync(i18nPath) && fs.statSync(i18nPath).isDirectory()) {
  bundleZip.addLocalFolder(i18nPath, 'i18n');
}
const bundleBuffer = bundleZip.toBuffer();

// 2. Create the main app zip
const mainZip = new AdmZip();

// Add the generated manifest-bundle.zip to the root of the main zip
mainZip.addFile('manifest-bundle.zip', bundleBuffer);

// Add all other files to the main zip
fs.readdirSync(appDir).forEach(file => {
  if (file.endsWith('.zip')) return;
  const filePath = path.join(appDir, file);
  if (fs.statSync(filePath).isDirectory()) {
    mainZip.addLocalFolder(filePath, file);
  } else {
    mainZip.addLocalFile(filePath);
  }
});

console.log(`Zipping ${appDir} -> ${outputZip} (with manifest-bundle.zip) ...`);
mainZip.writeZip(outputZip);
console.log(`Successfully zipped ${appName}!`);

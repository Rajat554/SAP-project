const AdmZip = require('adm-zip');
const path = require('path');
const appName = process.argv[2];
if (!appName) {
  console.error("Please provide app name");
  process.exit(1);
}
const distPath = path.join(__dirname, 'app', appName.replace('washwizard-app-', ''), 'dist');
const zipPath = path.join(distPath, appName + '.zip');

const zip = new AdmZip();
zip.addLocalFolder(distPath);
zip.writeZip(zipPath);
console.log(`Created ${zipPath}`);

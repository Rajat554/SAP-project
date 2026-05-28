const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

const appName = process.argv[2];
if (!appName) {
  console.error("Please specify the app name");
  process.exit(1);
}

const appDir = path.join(__dirname, 'app', appName);
const webappDir = path.join(appDir, 'webapp');
const outputZip = path.join(appDir, `${appName}.zip`);

if (!fs.existsSync(webappDir)) {
  console.error(`Folder not found: ${webappDir}`);
  process.exit(1);
}

console.log(`Zipping ${webappDir} to ${outputZip}...`);
const zip = new AdmZip();
zip.addLocalFolder(webappDir);
zip.writeZip(outputZip);
console.log('Zipped successfully!');

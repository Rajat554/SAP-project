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

if (appName === 'portal') {
  const subApps = ['service-entries', 'service-records', 'analytics', 'catalog', 'admin'];
  subApps.forEach(sub => {
    const srcDir = path.join(__dirname, 'app', sub, 'webapp');
    const destDir = path.join(webappDir, sub);
    if (fs.existsSync(srcDir)) {
      console.log(`Syncing ${srcDir} to ${destDir}...`);
      if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
      }
      fs.mkdirSync(destDir, { recursive: true });
      fs.cpSync(srcDir, destDir, { recursive: true });
    } else {
      console.warn(`Source folder not found: ${srcDir}`);
    }
  });
}

if (!fs.existsSync(webappDir)) {
  console.error(`Folder not found: ${webappDir}`);
  process.exit(1);
}

console.log(`Zipping ${webappDir} to ${outputZip}...`);
const zip = new AdmZip();
zip.addLocalFolder(webappDir);
zip.writeZip(outputZip);
console.log('Zipped successfully!');

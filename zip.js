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

if (!fs.existsSync(webappDir)) {
  console.error(`Folder not found: ${webappDir}`);
  process.exit(1);
}

if (appName === 'portal') {
  const subApps = ['admin', 'analytics', 'catalog', 'service-entries', 'service-records'];
  
  // 1. Zip sub-apps
  subApps.forEach(sub => {
    const subDir = path.join(webappDir, sub);
    const subZip = path.join(appDir, `${sub}.zip`);
    if (fs.existsSync(subDir)) {
      console.log(`Zipping ${subDir} to ${subZip}...`);
      const zip = new AdmZip();
      zip.addLocalFolder(subDir);
      zip.writeZip(subZip);
    }
  });

  // 2. Zip portal root (excluding sub-apps)
  const portalZipFile = path.join(appDir, 'portal.zip');
  console.log(`Zipping portal root to ${portalZipFile}...`);
  const portalZip = new AdmZip();
  fs.readdirSync(webappDir).forEach(file => {
    if (!subApps.includes(file)) {
      const filePath = path.join(webappDir, file);
      if (fs.statSync(filePath).isDirectory()) {
        portalZip.addLocalFolder(filePath, file);
      } else {
        portalZip.addLocalFile(filePath);
      }
    }
  });
  portalZip.writeZip(portalZipFile);
  console.log('Zipped portal successfully!');
} else {
  const outputZip = path.join(appDir, `${appName}.zip`);
  console.log(`Zipping ${webappDir} to ${outputZip}...`);
  const zip = new AdmZip();
  zip.addLocalFolder(webappDir);
  zip.writeZip(outputZip);
  console.log('Zipped successfully!');
}

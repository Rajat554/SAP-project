const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

// Extract arguments passed from mta.yaml
const distDir = process.argv[2]; // e.g. "dist"
const zipName = process.argv[3]; // e.g. "washwizard-app-admin.zip"

if (!distDir || !zipName) {
    console.error("Usage: node zip-app.js <dist-dir> <zip-name>");
    process.exit(1);
}

const zipPath = path.join(distDir, zipName);

// CRITICAL FIX: If the zip file already exists in the dist folder, 
// we MUST delete it first. Otherwise, AdmZip will include the old zip 
// file inside the new zip file, creating a "nested zip" that breaks BTP deployment.
if (fs.existsSync(zipPath)) {
    console.log(`[ZIP] Deleting existing archive: ${zipPath}`);
    fs.unlinkSync(zipPath);
}

console.log(`[ZIP] Archiving directory: ${distDir} into ${zipPath}`);
const zip = new AdmZip();
zip.addLocalFolder(distDir);
zip.writeZip(zipPath);
console.log(`[ZIP] Successfully created ${zipPath}`);

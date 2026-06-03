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

// Delete ANY existing .zip files in the dist folder to avoid nested zips
const files = fs.readdirSync(distDir);
for (const file of files) {
    if (file.endsWith('.zip')) {
        const oldZip = path.join(distDir, file);
        console.log(`[ZIP] Deleting existing archive: ${oldZip}`);
        fs.unlinkSync(oldZip);
    }
}

console.log(`[ZIP] Archiving directory: ${distDir} into ${zipPath}`);
const zip = new AdmZip();
zip.addLocalFolder(distDir);
zip.writeZip(zipPath);
console.log(`[ZIP] Successfully created ${zipPath}`);

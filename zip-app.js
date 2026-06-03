const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

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

// Write the zip to a temp file OUTSIDE the dist directory first,
// so archiver doesn't accidentally include the zip inside itself.
const tmpZipPath = path.join(path.dirname(distDir), `_tmp_${zipName}`);

console.log(`[ZIP] Archiving directory: ${distDir} into ${zipPath}`);

const output = fs.createWriteStream(tmpZipPath);
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
    // Move the completed zip into the dist folder
    fs.renameSync(tmpZipPath, zipPath);
    console.log(`[ZIP] Successfully created ${zipPath} (${archive.pointer()} total bytes)`);
});

archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
        console.warn(err);
    } else {
        // Clean up temp file on error
        if (fs.existsSync(tmpZipPath)) fs.unlinkSync(tmpZipPath);
        throw err;
    }
});

archive.on('error', function(err) {
    if (fs.existsSync(tmpZipPath)) fs.unlinkSync(tmpZipPath);
    throw err;
});

// pipe archive data to the temp file
archive.pipe(output);

// append files from the dist directory, putting its contents at the root of archive
archive.directory(distDir, false);

// finalize the archive (ie we are done appending files but streams have to finish yet)
archive.finalize();

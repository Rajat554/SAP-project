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

console.log(`[ZIP] Archiving directory: ${distDir} into ${zipPath}`);

const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
    console.log(`[ZIP] Successfully created ${zipPath} (${archive.pointer()} total bytes)`);
});

archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
        console.warn(err);
    } else {
        throw err;
    }
});

archive.on('error', function(err) {
    throw err;
});

// pipe archive data to the file
archive.pipe(output);

// append files from a sub-directory, putting its contents at the root of archive
archive.directory(distDir, false);

// finalize the archive (ie we are done appending files but streams have to finish yet)
archive.finalize();

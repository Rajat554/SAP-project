const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Usage: node zip-app.js <src-dir> <out-dir> <zip-name>
//   src-dir  – the built UI5 dist folder to zip up
//   out-dir  – the output directory that will hold ONLY the zip
//   zip-name – filename for the zip (e.g. washwizard-app-shell.zip)
const srcDir  = process.argv[2];
const outDir  = process.argv[3];
const zipName = process.argv[4];

if (!srcDir || !outDir || !zipName) {
    console.error('Usage: node zip-app.js <src-dir> <out-dir> <zip-name>');
    process.exit(1);
}

// Ensure output directory exists and is empty (no stale zips)
if (fs.existsSync(outDir)) {
    for (const f of fs.readdirSync(outDir)) {
        if (f.endsWith('.zip')) {
            fs.unlinkSync(path.join(outDir, f));
            console.log(`[ZIP] Removed stale archive: ${path.join(outDir, f)}`);
        }
    }
} else {
    fs.mkdirSync(outDir, { recursive: true });
}

const zipPath = path.join(outDir, zipName);
console.log(`[ZIP] Archiving: ${srcDir}  →  ${zipPath}`);

const output  = fs.createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    console.log(`[ZIP] Done — ${zipPath} (${archive.pointer()} bytes)`);
});

archive.on('warning', (err) => {
    if (err.code === 'ENOENT') { console.warn(err); }
    else { throw err; }
});

archive.on('error', (err) => { throw err; });

archive.pipe(output);
// Add all files from srcDir flat at the root of the zip
archive.directory(srcDir, false);
archive.finalize();

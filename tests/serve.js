// Minimal static file server for tests. No deps. Used by Playwright.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = process.env.PORT ? +process.env.PORT : 4173;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'text/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md':   'text/markdown; charset=utf-8',
    '.svg':  'image/svg+xml',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.pdf':  'application/pdf',
    '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel === '/') rel = '/index.html';
    const abs = path.join(ROOT, rel);
    if (!abs.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    fs.stat(abs, (err, st) => {
        if (err || !st.isFile()) {
            // SPA fallback for hash routes — but tests use #/ so / always exists.
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
            return;
        }
        const ext = path.extname(abs).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        fs.createReadStream(abs).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`Serving ${ROOT} on http://localhost:${PORT}`);
});

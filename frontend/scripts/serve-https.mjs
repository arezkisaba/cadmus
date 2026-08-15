import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:https';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureCerts } from './ensure-certs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.CADMUS_PORT ?? 4446);
const HOST = process.env.CADMUS_HOST ?? '0.0.0.0';

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
    '.map': 'application/json',
};

const { key, cert } = ensureCerts();

function sendFile(res, filePath) {
    const type = MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    createReadStream(filePath).pipe(res);
}

const server = createServer({ key: readFileSync(key), cert: readFileSync(cert) }, (req, res) => {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(req.url, 'https://localhost').pathname);
    } catch {
        res.writeHead(400).end('Bad Request');
        return;
    }

    if (pathname === '/' || pathname === '') {
        pathname = '/index.html';
    }

    const filePath = normalize(join(DIST, pathname));
    if (!filePath.startsWith(DIST)) {
        res.writeHead(403).end('Forbidden');
        return;
    }

    if (existsSync(filePath) && statSync(filePath).isFile()) {
        sendFile(res, filePath);
        return;
    }

    if (extname(filePath) === '') {
        const index = join(DIST, 'index.html');
        if (existsSync(index)) {
            sendFile(res, index);
            return;
        }
    }

    res.writeHead(404).end('Not Found');
});

server.listen(PORT, HOST, () => {
    console.log(`Cadmus served over HTTPS on https://localhost:${PORT}`);
    console.log('  LAN access: https://<this-machine-ip>:4446');
});

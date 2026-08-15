import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CERTS_DIR = join(ROOT, 'certs');
const KEY_PATH = join(CERTS_DIR, 'cadmus.key');
const CERT_PATH = join(CERTS_DIR, 'cadmus.crt');
const CNF_PATH = join(CERTS_DIR, 'openssl.cnf');

export function certPaths() {
    return { key: KEY_PATH, cert: CERT_PATH };
}

function lanIps() {
    const ips = new Set(['127.0.0.1']);
    for (const infos of Object.values(networkInterfaces())) {
        for (const info of infos ?? []) {
            if (info.family === 'IPv4' && !info.internal) {
                ips.add(info.address);
            }
        }
    }
    const extra = process.env.CADMUS_LAN_IP;
    if (extra) {
        for (const ip of extra.split(',')) {
            const trimmed = ip.trim();
            if (trimmed.length > 0) {
                ips.add(trimmed);
            }
        }
    }
    return [...ips];
}

function hasMkcert() {
    try {
        execFileSync('mkcert', ['-version'], { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function generateWithMkcert() {
    const hosts = ['localhost', '127.0.0.1', ...lanIps()];
    execFileSync('mkcert', ['-key-file', KEY_PATH, '-cert-file', CERT_PATH, ...hosts], { stdio: 'inherit' });
}

function generateWithOpenssl() {
    const sans = ['DNS:localhost', ...lanIps().map((ip) => `IP:${ip}`)];

    const config = [
        '[req]',
        'distinguished_name = dn',
        'x509_extensions = v3_req',
        'prompt = no',
        '[dn]',
        'CN = localhost',
        '[v3_req]',
        `subjectAltName = ${sans.join(',')}`,
        'basicConstraints = CA:FALSE',
        'keyUsage = digitalSignature, keyEncipherment',
        'extendedKeyUsage = serverAuth',
        '',
    ].join('\n');

    writeFileSync(CNF_PATH, config);

    execFileSync(
        'openssl',
        ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', KEY_PATH, '-out', CERT_PATH, '-days', '825', '-config', CNF_PATH],
        { stdio: 'inherit' }
    );
}

export function ensureCerts() {
    if (existsSync(KEY_PATH) && existsSync(CERT_PATH)) {
        return certPaths();
    }

    mkdirSync(CERTS_DIR, { recursive: true });

    if (hasMkcert()) {
        generateWithMkcert();
    } else {
        generateWithOpenssl();
    }

    return certPaths();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const { key, cert } = ensureCerts();
    console.log(`HTTPS certificates ready:\n  cert: ${cert}\n  key:  ${key}`);
}

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => {
    let https;
    if (command === 'serve') {
        const CERTS_DIR = path.resolve(__dirname, 'certs');
        const KEY_PATH = path.resolve(CERTS_DIR, 'cadmus.key');
        const CERT_PATH = path.resolve(CERTS_DIR, 'cadmus.crt');
        if (!existsSync(KEY_PATH) || !existsSync(CERT_PATH)) {
            execSync('node scripts/ensure-certs.mjs', { cwd: __dirname, stdio: 'inherit' });
        }
        https = { key: readFileSync(KEY_PATH), cert: readFileSync(CERT_PATH) };
    }

    return {
        plugins: [react(), tailwindcss()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@shared': path.resolve(__dirname, '../shared/src'),
            },
        },
        server: {
            port: 4445,
            host: true,
            https,
        },
    };
});

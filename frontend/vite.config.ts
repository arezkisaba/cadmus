import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Base path du build : "/" en local, "/cadmus/" sur GitHub Pages (posé par .github/workflows/deploy.yml)
const DEPLOY_BASE = process.env.DEPLOY_BASE ?? '/';

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
        base: DEPLOY_BASE,
        plugins: [
            react(),
            tailwindcss(),
            // Génère un 404.html identique à index.html pour le fallback SPA (nécessaire sur GitHub Pages)
            {
                name: 'spa-404-fallback',
                apply: 'build',
                closeBundle() {
                    const distDir = path.resolve(__dirname, 'dist');
                    const indexPath = path.join(distDir, 'index.html');
                    if (existsSync(indexPath)) {
                        copyFileSync(indexPath, path.join(distDir, '404.html'));
                    }
                },
            },
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@shared': path.resolve(__dirname, '../shared/src'),
            },
        },
        server: {
            port: 4446,
            host: true,
            https,
        },
    };
});

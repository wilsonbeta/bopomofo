import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * GitHub Pages 部署在 https://wilsonbeta.github.io/bopomofo/ 底下，
 * 所以資產路徑要帶 `/bopomofo/` 前綴；本機 dev / preview 也照用同一個 base，
 * 免得「本機好好的、上線 404」這種只在正式站才出現的差異。
 */
export default defineConfig({
    base: '/bopomofo/',
    plugins: [react()],
    resolve: {
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    },
    server: { port: 3000 },
    preview: { port: 4173 }
});

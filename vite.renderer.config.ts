import { randomBytes } from 'node:crypto';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const devNoncePlaceholder = '__QUIZ_STAGE_DEV_NONCE__';

export default defineConfig(({ command }) => ({
  root: 'src/renderer',
  ...(command === 'serve' ? { html: { cspNonce: devNoncePlaceholder } } : {}),
  plugins: [
    react(),
    {
      name: 'quiz-stage-dev-csp',
      apply: 'serve',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          const nonce = randomBytes(16).toString('base64');
          return html
            .replaceAll(devNoncePlaceholder, nonce)
            .replace(/<(script|style|link)\b(?![^>]*\bnonce=)/g, `<$1 nonce="${nonce}"`)
            .replace("script-src 'self'", `script-src 'self' 'nonce-${nonce}'`)
            .replace("style-src 'self'", `style-src 'self' 'nonce-${nonce}'`);
        },
      },
    },
  ],
  build: {
    outDir: '../../.vite/renderer/main_window',
  },
}));

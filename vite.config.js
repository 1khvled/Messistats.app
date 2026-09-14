import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

function cleanEnRouting() {
  const handler = (req, res, next) => {
    let url = req.url.split('?')[0];
    const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    if (url === '/en' || url === '/en/') {
      req.url = '/' + query;
    } else if (url.startsWith('/en/')) {
      const slug = url.slice(4);
      req.url = '/' + slug + '.html' + query;
    } else if (!url.includes('.') && url !== '/') {
      req.url = url + '.html' + query;
    }
    next();
  };
  return {
    name: 'clean-en-routing',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

export default defineConfig({
  base: '/',
  plugins: [cleanEnRouting()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        goalsbyyear: resolve(root, 'goalsbyyear.html'),
        goalsbyseason: resolve(root, 'goalsbyseason.html'),
        dashboard: resolve(root, 'dashboard.html'),
        timeline: resolve(root, 'timeline.html'),
        achievements: resolve(root, 'achievements.html'),
        birthday: resolve(root, 'birthday.html'),
        admin: resolve(root, 'admin.html')
      }
    }
  }
});
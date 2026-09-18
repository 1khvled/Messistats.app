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
    } else if (url === '/es' || url === '/es/') {
      req.url = '/es/index.html' + query;
    } else if (/^\/(pt|fr|ar|bn|hi|ro|uz)(\/)?$/.test(url)) {
      const lang = url.split('/')[1];
      req.url = `/${lang}/index.html` + query;
    } else if (url.startsWith('/en/')) {
      const slug = url.slice(4);
      req.url = '/' + slug + '.html' + query;
    } else if (url.startsWith('/es/')) {
      const slug = url.slice(4);
      req.url = '/es/' + slug + '.html' + query;
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
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        goalsbyyear: resolve(root, 'goalsbyyear.html'),
        goalsbyseason: resolve(root, 'goalsbyseason.html'),
        dashboard: resolve(root, 'dashboard.html'),
        timeline: resolve(root, 'timeline.html'),
        achievements: resolve(root, 'achievements.html'),
        birthday: resolve(root, 'birthday.html'),
        vs_real_madrid: resolve(root, 'vs-real-madrid.html'),
        messi_vs_ronaldo: resolve(root, 'messi-vs-ronaldo.html'),
        champions_league: resolve(root, 'champions-league.html'),
        es_main: resolve(root, 'es/index.html'),
        es_birthday: resolve(root, 'es/birthday.html'),
        es_achievements: resolve(root, 'es/achievements.html'),
        es_goalsbyyear: resolve(root, 'es/goalsbyyear.html'),
        es_goalsbyseason: resolve(root, 'es/goalsbyseason.html'),
        es_dashboard: resolve(root, 'es/dashboard.html'),
        es_timeline: resolve(root, 'es/timeline.html'),
        pt_index: resolve(root, 'pt/index.html'),
        fr_index: resolve(root, 'fr/index.html'),
        ar_index: resolve(root, 'ar/index.html'),
        bn_index: resolve(root, 'bn/index.html'),
        hi_index: resolve(root, 'hi/index.html'),
        ro_index: resolve(root, 'ro/index.html'),
        uz_index: resolve(root, 'uz/index.html'),
        admin: resolve(root, 'admin.html')
      }
    }
  }
});
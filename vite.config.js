import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

function cleanEnRouting() {
  const handler = (req, res, next) => {
    let url = req.url.split('?')[0];
    const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    const langMatch = url.match(/^\/(es|pt|fr|ar|bn|hi|ro|uz)(\/.*)?$/);
    if (langMatch) {
      const lang = langMatch[1];
      const rest = (langMatch[2] || '').replace(/^\/+/, '');
      if (!rest) {
        req.url = `/${lang}/index.html` + query;
      } else if (rest.startsWith('src/') || rest.startsWith('assets/') || rest.startsWith('data/') || rest.startsWith('fonts/') || rest.startsWith('img/') || rest.includes('.')) {
        req.url = `/${rest}` + query;
      } else {
        const slug = rest.replace(/\.html$/, '');
        req.url = `/${lang}/${slug}.html` + query;
      }
    } else if (url === '/en' || url === '/en/') {
      req.url = '/' + query;
    } else if (url.startsWith('/en/')) {
      const rest = url.slice(4);
      if (rest.startsWith('src/') || rest.startsWith('assets/') || rest.startsWith('data/') || rest.startsWith('fonts/') || rest.startsWith('img/') || rest.includes('.')) {
        req.url = '/' + rest + query;
      } else {
        const slug = rest.replace(/\.html$/, '');
        req.url = '/' + slug + '.html' + query;
      }
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

const langs = ['es', 'pt', 'fr', 'ar', 'bn', 'hi', 'ro', 'uz'];
const subpages = [
  'index',
  'dashboard',
  'goalsbyseason',
  'goalsbyyear',
  'timeline',
  'achievements',
  'birthday',
  'messi-vs-ronaldo',
  'vs-real-madrid',
  'champions-league'
];

const rollupInput = {
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
  admin: resolve(root, 'admin.html')
};

for (const l of langs) {
  for (const s of subpages) {
    const key = `${l}_${s.replace(/-/g, '_')}`;
    rollupInput[key] = resolve(root, `${l}/${s}.html`);
  }
}

export default defineConfig({
  base: '/',
  plugins: [cleanEnRouting()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: rollupInput
    }
  }
});
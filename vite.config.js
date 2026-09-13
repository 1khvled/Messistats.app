import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  base: '/',
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
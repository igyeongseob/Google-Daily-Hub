import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // Let Vite serve proxied preview assets under the artifact prefix, but keep
  // the production output relative for GitHub Pages project repositories.
  base:
    command === 'build'
      ? './'
      : process.env.BASE_PATH || '/',
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    host: '0.0.0.0',
    allowedHosts: true,
  },
}));

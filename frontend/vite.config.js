import { defineConfig } from 'vite';
import { bobitaBookPlugin } from './bobita-book-plugin.js';

export default defineConfig({
  plugins: [bobitaBookPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});

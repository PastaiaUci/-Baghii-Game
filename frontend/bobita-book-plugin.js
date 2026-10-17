import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export function bobitaPages(root) {
  try {
    return readdirSync(join(root, 'public/assets/Bobita'), { withFileTypes: true })
      .filter((file) => file.isFile() && /\.(png|jpe?g|webp|avif)$/i.test(file.name) && !/^(bobita|luis|medalion)\./i.test(file.name))
      .map((file) => file.name).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
      .map((name) => `/assets/Bobita/${encodeURIComponent(name)}`);
  } catch { return []; }
}
export function bobitaBookPlugin() {
  let root;
  return {
    name: 'bobita-book-pages',
    configResolved(config) { root = config.root; },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/assets/Bobita/pages.json') return next();
        res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify({ pages: bobitaPages(root) }));
      });
    },
    generateBundle() { this.emitFile({ type: 'asset', fileName: 'assets/Bobita/pages.json', source: JSON.stringify({ pages: bobitaPages(root) }) }); },
  };
}

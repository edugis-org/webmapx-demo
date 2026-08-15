/**
 * Minimal static file server for the repo root.
 *
 * The site is deployed as plain static files (GitHub Pages), so this exists
 * only for local viewing and for the preview generator — nothing here is part
 * of the published output.
 */
import { createServer, type Server } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, normalize, extname, sep } from 'node:path';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.pbf': 'application/x-protobuf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function resolveFile(urlPath: string): Promise<string | null> {
  // Strip query/hash, decode, and refuse anything that escapes ROOT.
  const clean = decodeURIComponent(urlPath.split('?')[0]!.split('#')[0]!);
  const target = normalize(join(ROOT, clean));
  if (target !== ROOT.replace(/[\\/]$/, '') && !target.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep)) {
    return null;
  }
  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      const index = join(target, 'index.html');
      await stat(index);
      return index;
    }
    return target;
  } catch {
    return null;
  }
}

/** Start the server. Port 0 picks a free port; the resolved port is returned. */
export function startServer(port = 0): Promise<{ server: Server; port: number; url: string }> {
  const server = createServer(async (req, res) => {
    const file = await resolveFile(req.url ?? '/');
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, {
      'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
      // Local dev: never cache, so an edit is visible on plain reload.
      'cache-control': 'no-store',
    });
    createReadStream(file).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      const actual = typeof address === 'object' && address ? address.port : port;
      resolve({ server, port: actual, url: `http://127.0.0.1:${actual}` });
    });
  });
}

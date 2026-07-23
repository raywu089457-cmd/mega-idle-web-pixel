// scripts/_serve.mjs — 一次性本地靜態伺服器(ES module 安全 + 手機行動寬度)
// 開瀏覽器:http://127.0.0.1:8765/index.html (桌面) 或 http://<本機 IP>:8765/index.html (手機實機)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

const PORT = Number(process.env.PORT) || 8765;
const ROOT = process.cwd();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

const server = createServer(async (req, res) => {
  try {
    let url = req.url.split('?')[0];
    if (url === '/') url = '/index.html';
    const file = join(ROOT, url);
    // basic no-traversal sanity
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
    await stat(file);
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch (e) { res.writeHead(404); res.end('not found: ' + req.url); }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 http-server ready`);
  console.log(`  桌面:http://localhost:${PORT}/index.html`);
  console.log(`  本機 :http://127.0.0.1:${PORT}/index.html`);
  console.log(`  區網(手機實機):http://<本機 IP>:${PORT}/index.html  (要把 8765/tcp 加到 Windows 防火牆例外才接得到)`);
  console.log(`  Ctrl+C 停止`);
});

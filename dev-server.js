import { watch } from 'fs';

/**
 * Development reload server for Chrome extension hot-reloading.
 *
 * Watches ./dist for rebuilt JS/CSS files and broadcasts a "reload" signal
 * over WebSocket to any connected background service workers, which then
 * reload the active tab and the extension itself.
 *
 * Usage: started automatically by `bun run dev`
 */

const clients = new Set();

const server = Bun.serve({
  port: 8181,
  fetch(req, server) {
    if (server.upgrade(req)) return;
    return new Response('Extension dev reload server');
  },
  websocket: {
    open(ws) {
      clients.add(ws);
      console.log('🔌 Extension connected to reload server');
    },
    close(ws) {
      clients.delete(ws);
    },
    message() {},
  },
});

console.log('🔄 Dev reload server on ws://localhost:8181');
console.log('   Load the extension from ./dist, then edits will auto-reload\n');

let debounceTimer;

// Watch workspace root recursively; macOS FSEvents survives dist recreation.
// Filter to only compiled output so source-file editor saves don't double-fire.
watch('.', { recursive: true }, (event, filename) => {
  if (!filename) return;

  const normalized = filename.replace(/\\/g, '/');
  if (!normalized.startsWith('dist/')) return;
  if (!normalized.endsWith('.js') && !normalized.endsWith('.css')) return;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (clients.size === 0) return;
    console.log(`📦 Rebuilt ${normalized} — reloading extension…`);
    for (const client of clients) {
      client.send('reload');
    }
  }, 400);
});

// Chrome extension build script using Bun
import { existsSync, mkdirSync } from 'fs';
import { build } from 'bun';

// Create dist directory if it doesn't exist
if (!existsSync('./dist')) {
  mkdirSync('./dist', { recursive: true });
}

// Bundle background script
await build({
  entrypoints: ['./background.js'],
  outdir: './dist',
  minify: true,
  target: 'browser',
  format: 'esm',
});

// Bundle content script
await build({
  entrypoints: ['./content.js'],
  outdir: './dist',
  minify: true,
  target: 'browser',
  format: 'esm',
});

// Bundle popup script
await build({
  entrypoints: ['./popup.js'],
  outdir: './dist',
  minify: true,
  target: 'browser',
  format: 'esm',
});

console.log('Build completed successfully!');

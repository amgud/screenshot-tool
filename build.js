import fs from 'fs';
import { spawnSync } from 'child_process';

// Copies static files to the dist directory
// clean up the dist directory if it exists
if (fs.existsSync('./dist')) {
  fs.rmSync('./dist', { recursive: true });
  fs.mkdirSync('./dist');
  fs.mkdirSync('./dist/icons');
}

// Copy static files
const staticFiles = [
  { src: './manifest.json', dest: './dist/manifest.json' },
  { src: './icons/icon-16.png', dest: './dist/icons/icon-16.png' },
  { src: './icons/icon-48.png', dest: './dist/icons/icon-48.png' },
  { src: './icons/icon-128.png', dest: './dist/icons/icon-128.png' },
  { src: './styles.css', dest: './dist/styles.css' },
];

// Copy all files
staticFiles.forEach((file) => {
  try {
    fs.copyFileSync(file.src, file.dest);
    console.log(`Copied ${file.src} to ${file.dest}`);
  } catch (err) {
    console.error(`Error copying ${file.src}:`, err);
  }
});

// Build React application
console.log('Building React application...');
const buildResult = spawnSync(
  'bun',
  [
    'build',
    '--target=browser',
    '--outdir=dist',
    '--entry-naming=[dir]/[name].[ext]',
    'sidepanel.html',
    'background.js',
    'content.js',
    'src/index.jsx',
  ],
  { stdio: 'inherit' }
);

if (buildResult.error) {
  console.error('Error building React application:', buildResult.error);
  process.exit(1);
}

console.log('Build completed successfully');

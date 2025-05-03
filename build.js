import fs from 'fs';

// Copies static files to the dist directory
// clean up the dist directory if it exists
if (fs.existsSync('./dist')) {
  fs.rmSync('./dist', { recursive: true });
}

fs.mkdirSync('./dist');
fs.mkdirSync('./dist/icons');

// Copy static files
const staticFiles = [
  { src: './manifest.json', dest: './dist/manifest.json' },
  { src: './icons/icon-16.png', dest: './dist/icons/icon-16.png' },
  { src: './icons/icon-48.png', dest: './dist/icons/icon-48.png' },
  { src: './icons/icon-128.png', dest: './dist/icons/icon-128.png' },
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

console.log('Static files copied successfully');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetDirs = {
  dist: path.join(rootDir, 'dist'),
  electron: path.join(rootDir, 'dist-electron'),
  release: path.join(rootDir, 'release-build'),
};

export function clean(target = 'all') {
  const toDelete = [];

  if (target === 'all') {
    toDelete.push(targetDirs.dist, targetDirs.electron, targetDirs.release);
  } else if (target === 'build' || target === 'dist') {
    toDelete.push(targetDirs.dist, targetDirs.electron);
  } else if (target === 'release') {
    toDelete.push(targetDirs.release);
  }

  for (const dir of toDelete) {
    if (fs.existsSync(dir)) {
      console.log(`[Clean] Removing ${path.relative(rootDir, dir)}...`);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  console.log('[Clean] Completed successfully.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = process.argv[2] || 'all';
  clean(target);
}

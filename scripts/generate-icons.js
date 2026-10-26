import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'resources');
const sourceIcon = path.join(buildDir, 'icon-source.png');
const targetPng = path.join(buildDir, 'icon.png');
const targetIcns = path.join(buildDir, 'icon.icns');
const targetIco = path.join(buildDir, 'icon.ico');
const iconsDir = path.join(buildDir, 'icons');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 现代 Windows ICO 格式生成器（直接内嵌各分辨率 PNG 二进制，零外部依赖）
 */
function createIcoFromPngs(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  let offset = headerSize + count * entrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);      // Reserved (always 0)
  header.writeUInt16LE(1, 2);      // Image type: 1 = ICO
  header.writeUInt16LE(count, 4);  // Number of images

  const entries = [];
  for (const { width, height, buffer } of pngBuffers) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2);          // Color palette (0 = no palette)
    entry.writeUInt8(0, 3);          // Reserved (0)
    entry.writeUInt16LE(1, 4);        // Color planes (1)
    entry.writeUInt16LE(32, 6);       // Bits per pixel (32-bit RGBA)
    entry.writeUInt32LE(buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(offset, 12);  // Image data offset
    entries.push(entry);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers.map((p) => p.buffer)]);
}

export function generateAllIcons(sourcePath = sourceIcon) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source icon does not exist: ${sourcePath}`);
  }

  ensureDir(buildDir);
  ensureDir(iconsDir);

  console.log(`[IconGen] Processing source icon: ${sourcePath}`);

  // 1. 生成 512x512 主 icon.png
  execSync(`sips -z 512 512 "${sourcePath}" --out "${targetPng}"`, { stdio: 'inherit' });

  // 2. 生成 Linux 各分辨率 PNG (16, 32, 48, 64, 128, 256, 512)
  const linuxSizes = [16, 32, 48, 64, 128, 256, 512];
  for (const size of linuxSizes) {
    const outPng = path.join(iconsDir, `${size}x${size}.png`);
    execSync(`sips -z ${size} ${size} "${sourcePath}" --out "${outPng}"`, { stdio: 'ignore' });
  }
  console.log(`[IconGen] Generated Linux icons in ${iconsDir}`);

  // 3. 生成 macOS .icns (使用原生 sips 和 iconutil)
  const iconsetDir = path.join(buildDir, 'icon.iconset');
  ensureDir(iconsetDir);

  const macSpecs = [
    { name: 'icon_16x16.png', size: 16 },
    { name: 'icon_16x16@2x.png', size: 32 },
    { name: 'icon_32x32.png', size: 32 },
    { name: 'icon_32x32@2x.png', size: 64 },
    { name: 'icon_128x128.png', size: 128 },
    { name: 'icon_128x128@2x.png', size: 256 },
    { name: 'icon_256x256.png', size: 256 },
    { name: 'icon_256x256@2x.png', size: 512 },
    { name: 'icon_512x512.png', size: 512 },
    { name: 'icon_512x512@2x.png', size: 1024 },
  ];

  for (const spec of macSpecs) {
    const dest = path.join(iconsetDir, spec.name);
    execSync(`sips -z ${spec.size} ${spec.size} "${sourcePath}" --out "${dest}"`, { stdio: 'ignore' });
  }

  execSync(`iconutil -c icns "${iconsetDir}" -o "${targetIcns}"`, { stdio: 'inherit' });
  fs.rmSync(iconsetDir, { recursive: true, force: true });
  console.log(`[IconGen] Generated macOS icns: ${targetIcns}`);

  // 4. 生成 Windows .ico (内嵌 16, 32, 48, 64, 128, 256)
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  const tempIcoDir = path.join(buildDir, 'ico_temp');
  ensureDir(tempIcoDir);

  for (const size of icoSizes) {
    const tempFile = path.join(tempIcoDir, `${size}.png`);
    execSync(`sips -z ${size} ${size} "${sourcePath}" --out "${tempFile}"`, { stdio: 'ignore' });
    const buffer = fs.readFileSync(tempFile);
    pngBuffers.push({ width: size, height: size, buffer });
  }
  fs.rmSync(tempIcoDir, { recursive: true, force: true });

  const icoBuffer = createIcoFromPngs(pngBuffers);
  fs.writeFileSync(targetIco, icoBuffer);
  console.log(`[IconGen] Generated Windows ico: ${targetIco}`);

  console.log('[IconGen] All platform icons generated successfully!');
}

// 直接运行脚本支持
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const argSource = process.argv[2] || sourceIcon;
  generateAllIcons(argSource);
}

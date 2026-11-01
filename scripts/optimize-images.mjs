// @ts-check
/**
 * Re-encode site images: strip all metadata (EXIF/GPS) and emit .webp siblings.
 *
 * sharp discards metadata unless .withMetadata() is called, so a plain
 * decode -> encode pass removes EXIF, GPS, and color-profile blocks.
 * Originals are overwritten in place with the cleaned version; a .webp
 * sibling is written next to each for use in <Image> tags (next/image
 * passes src through untouched under `images.unoptimized`).
 *
 * Size variants (VARIANTS below) are then derived from the cleaned .webp
 * files: each is rebuilt when its source is newer.
 *
 * Run: npm run images
 *      node scripts/optimize-images.mjs --variants   (variants only; originals untouched)
 */
import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const TARGETS = [
  'public/images/headshot.jpg',
  ...(await readdir('public/images/thumbnails')).map((f) =>
    path.join('public/images/thumbnails', f),
  ),
].filter((f) => /\.(jpe?g|png)$/i.test(f));

const VARIANTS_ONLY = process.argv.includes('--variants');
/**
 * Small copies for slots that never show the full image (source, size in px, output).
 * The hero avatar (app/page.tsx) shows at 80 CSS px on phones, so 240 px covers 3x.
 * @type {Array<[string, number, string]>}
 */
const VARIANTS = [['public/images/headshot.webp', 240, 'public/images/headshot-240.webp']];

console.log(`[setup] ${VARIANTS_ONLY ? 0 : TARGETS.length} images to process, ${VARIANTS.length} variants`);

for (const [i, file] of (VARIANTS_ONLY ? [] : TARGETS).entries()) {
  const ext = path.extname(file).toLowerCase();
  const webpPath = file.replace(/\.(jpe?g|png)$/i, '.webp');

  // Already cleaned (its .webp is at least as new): skip, so a repeat run
  // does not cost the original another lossy generation.
  const webpTime = await stat(webpPath).then((s) => s.mtimeMs, () => -1);
  if (webpTime >= (await stat(file)).mtimeMs) {
    console.log(`[skip] ${file} already processed`);
    continue;
  }

  // Decode fully into a raw buffer first so the input file handle is
  // released before we overwrite it in place.
  // .rotate() with no angle applies the EXIF orientation first: the tag is
  // stripped on re-encode, so a phone photo would otherwise come out sideways.
  const { data: raw, info } = await sharp(file)
    .rotate()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const base = () =>
    sharp(raw, {
      raw: { width: info.width, height: info.height, channels: info.channels },
    });

  const clean =
    ext === '.png'
      ? await base().png({ compressionLevel: 9, palette: true }).toBuffer()
      : await base().jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  const webp = await base().webp({ quality: 82 }).toBuffer();

  await writeFile(file, clean);
  await writeFile(webpPath, webp);

  console.log(
    `[${i + 1}/${TARGETS.length}] ${file} ${info.width}x${info.height} -> ` +
      `${(clean.length / 1024).toFixed(0)}K, ${path.basename(webpPath)} ${(webp.length / 1024).toFixed(0)}K`,
  );
}

for (const [source, size, out] of VARIANTS) {
  // Rebuilt when its source is newer, so a replaced headshot reaches the hero.
  const outTime = await stat(out).then((s) => s.mtimeMs, () => -1);
  if (outTime >= (await stat(source)).mtimeMs) {
    console.log(`[skip] ${out} is current`);
    continue;
  }
  const buffer = await sharp(source).resize(size, size, { fit: 'cover' }).webp({ quality: 82 }).toBuffer();
  await writeFile(out, buffer);
  console.log(`[variant] ${out} ${size}x${size} ${(buffer.length / 1024).toFixed(0)}K`);
}

console.log(VARIANTS_ONLY ? '[done] variants written' : '[done] all images re-encoded without metadata');

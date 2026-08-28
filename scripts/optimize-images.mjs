/**
 * Re-encode site images: strip all metadata (EXIF/GPS) and emit .webp siblings.
 *
 * sharp discards metadata unless .withMetadata() is called, so a plain
 * decode -> encode pass removes EXIF, GPS, and color-profile blocks.
 * Originals are overwritten in place with the cleaned version; a .webp
 * sibling is written next to each for use in <Image> tags (next/image
 * passes src through untouched under `images.unoptimized`).
 *
 * Run: npm run images
 */
import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const TARGETS = [
  'public/images/headshot.jpg',
  ...(await readdir('public/images/thumbnails')).map((f) =>
    path.join('public/images/thumbnails', f),
  ),
].filter((f) => /\.(jpe?g|png)$/i.test(f));

console.log(`[setup] ${TARGETS.length} images to process`);

for (const [i, file] of TARGETS.entries()) {
  const ext = path.extname(file).toLowerCase();
  const webpPath = file.replace(/\.(jpe?g|png)$/i, '.webp');

  // Decode fully into a raw buffer first so the input file handle is
  // released before we overwrite it in place.
  const { data: raw, info } = await sharp(file)
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

console.log('[done] all images re-encoded without metadata');

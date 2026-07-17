import sharp from "sharp";
import { readdirSync, statSync } from "fs";
import { join } from "path";

const dir = join(import.meta.dirname, "..", "src", "assets", "images");

const sizes = {
  "hero-japan-journey.jpg": 1400,
  "program-bahasa.jpg": 900,
  "program-konstruksi.jpg": 900,
  "program-kaigo.jpg": 900,
  "partners-trust.jpg": 1100,
  "alumni-1.jpg": 320,
  "alumni-2.jpg": 320,
  "alumni-3.jpg": 320,
};

for (const file of readdirSync(dir)) {
  if (!file.endsWith(".jpg")) continue;
  const inputPath = join(dir, file);
  const maxWidth = sizes[file] ?? 1200;
  const before = statSync(inputPath).size;

  const buffer = await sharp(inputPath)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();

  await sharp(buffer).toFile(inputPath);

  const after = statSync(inputPath).size;
  console.log(
    `${file}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB (width ${maxWidth}px)`
  );
}

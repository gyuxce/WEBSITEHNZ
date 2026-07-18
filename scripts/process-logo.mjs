import sharp from "sharp";
import { join } from "path";
import { copyFileSync } from "fs";

const srcDir = join(import.meta.dirname, "..", "src", "assets", "images");
const publicDir = join(import.meta.dirname, "..", "public");
const input = join(srcDir, "logo-hnz.png");

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  if (r < 28 && g < 28 && b < 28) {
    data[i + 3] = 0;
  }
}

const transparent = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
}).png().toBuffer();

const outLogo = join(srcDir, "logo-hnz-transparent.png");
await sharp(transparent).png().toFile(outLogo);
copyFileSync(outLogo, join(publicDir, "logo-hnz.png"));

await sharp(transparent).resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(join(publicDir, "favicon-32.png"));
await sharp(transparent).resize(48, 48, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(join(publicDir, "favicon-48.png"));
await sharp(transparent).resize(64, 64, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(join(publicDir, "favicon.png"));
await sharp(transparent).resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(join(publicDir, "apple-touch-icon.png"));
await sharp(transparent).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(join(publicDir, "logo-512.png"));

console.log("OK: transparent logo + favicons");

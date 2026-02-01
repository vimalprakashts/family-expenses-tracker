#!/usr/bin/env node
/**
 * Blur only numeric/financial values in screenshots using OCR.
 * Run: node scripts/blur-screenshot-numbers.mjs       → creates *-blurred.png
 * Run: node scripts/blur-screenshot-numbers.mjs --replace  → overwrites originals
 */

import { readdir } from 'fs/promises';
import { dirname, join } from 'path';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = join(__dirname, '..', 'screenshots');
const REPLACE = process.argv.includes('--replace');

// Words that look like numbers: digits, ₹, %, commas, decimals
function isNumericWord(text) {
  const cleaned = text.replace(/[\s₹,]/g, '');
  if (!cleaned.length) return false;
  const digitRatio = (cleaned.match(/\d/g) || []).length / cleaned.length;
  return digitRatio >= 0.5 || /^[\d₹,.\-%]+$/.test(cleaned);
}

async function getNumericRegions(imagePath) {
  const worker = await createWorker('eng');
  const { data } = await worker.recognize(imagePath, {}, { blocks: true });
  await worker.terminate();

  const regions = [];
  const padding = 3;

  if (!data.blocks) return regions;

  for (const block of data.blocks) {
    for (const paragraph of block.paragraphs || []) {
      for (const line of paragraph.lines || []) {
        for (const word of line.words || []) {
          if (!isNumericWord(word.text)) continue;
          const { x0, y0, x1, y1 } = word.bbox;
          const w = Math.max(1, x1 - x0 + padding * 2);
          const h = Math.max(1, y1 - y0 + padding * 2);
          const left = Math.max(0, x0 - padding);
          const top = Math.max(0, y0 - padding);
          regions.push([left, top, w, h]);
        }
      }
    }
  }

  return regions;
}

async function blurRegions(inputPath, outputPath, regions) {
  const metadata = await sharp(inputPath).metadata();
  const { width, height } = metadata;

  const composites = [];
  for (const [left, top, w, h] of regions) {
    const l = Math.max(0, left);
    const t = Math.max(0, top);
    const regionWidth = Math.min(Math.ceil(w), width - l);
    const regionHeight = Math.min(Math.ceil(h), height - t);
    if (regionWidth <= 0 || regionHeight <= 0) continue;

    const blurred = await sharp(inputPath)
      .extract({ left: l, top: t, width: regionWidth, height: regionHeight })
      .blur(10)
      .toBuffer();

    composites.push({ input: blurred, left: l, top: t });
  }

  if (composites.length === 0) {
    await sharp(inputPath).toFile(outputPath);
    return 0;
  }

  await sharp(inputPath).composite(composites).toFile(outputPath);
  return composites.length;
}

async function main() {
  const files = await readdir(SCREENSHOTS_DIR);
  const pngs = files.filter((f) => f.endsWith('.png') && !f.includes('-blurred'));

  console.log('Detecting numbers via OCR (this may take a moment)...\n');

  for (const file of pngs) {
    const inputPath = join(SCREENSHOTS_DIR, file);
    const base = file.replace(/\.png$/, '');
    const outputPath = REPLACE ? inputPath : join(SCREENSHOTS_DIR, `${base}-blurred.png`);

    try {
      const regions = await getNumericRegions(inputPath);
      const count = await blurRegions(inputPath, outputPath, regions);
      console.log(`${REPLACE ? 'Updated' : 'Created'} ${base}${REPLACE ? '' : '-blurred'}.png (${count} number regions)`);
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * Pre-compila Tailwind v4 a CSS puro (Angular 22 no procesa @import "tailwindcss").
 * Uso: node scripts/build-css.cjs <path/to/styles.css>
 */
const postcss = require('postcss');
const tailwindcss = require('@tailwindcss/postcss');
const fs = require('fs');
const path = require('path');

async function build(cssPath) {
  const absPath = path.resolve(cssPath);
  const source = fs.readFileSync(absPath, 'utf8');
  console.log('Processing:', path.basename(absPath), '-', (source.length / 1024).toFixed(1) + 'KB');
  const result = await postcss([tailwindcss()]).process(source, { from: absPath });
  fs.writeFileSync(absPath, result.css, 'utf8');
  const sizeKB = (result.css.length / 1024).toFixed(1);
  console.log('Done:', sizeKB + 'KB written');
  console.log('  @theme:', result.css.includes('@theme') ? 'REMAINS' : 'cleaned');
  console.log('  .card:', result.css.includes('.card') ? 'present' : 'missing');
  return result.css;
}

const cssFile = process.argv[2];
if (!cssFile) {
  console.error('Usage: node build-css.cjs <path/to/styles.css>');
  process.exit(1);
}
build(cssFile).catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});

import fs from 'fs-extra';
import path from 'node:path';
import assemble from "./assemble.mjs";

async function forceWriteFile(file, content) {
  await fs.ensureFile(file);
  await fs.writeFile(file, content);
};

const start_time = Date.now();

/**
 * Assemble all the site data
 */
const { pages } = await assemble();

/**
 * Remove old generated files
 */
if (fs.existsSync('html')) await fs.rm('html', { force: true, recursive: true });
if (fs.existsSync('function')) await fs.rm('function', { force: true, recursive: true });

/**
 * Write all the pages
 */
for (let page in pages) {
  const html = pages[page];
  const filePath = page.endsWith('.html')
    ? path.join('html', page)
    : path.join('html', page, 'index.html');
  await forceWriteFile(filePath, html);
}

/**
 * Write all the functions
 * TODO...
 */

/**
 * Copy images???
 */

console.log(`BUILT SITE [${Date.now() - start_time}ms]`);

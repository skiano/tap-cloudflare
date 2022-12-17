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
const { pages, functions } = await assemble();

/**
 * Write all the pages
 */
if (fs.existsSync('html')) await fs.rm('html', { force: true, recursive: true });
for (let page in pages) {
  const html = pages[page];
  const filePath = page.endsWith('.html')
    ? path.join('html', page)
    : path.join('html', page, 'index.html');
  await forceWriteFile(filePath, html);
}

/**
 * Write all the functions
 */
if (fs.existsSync('functions')) await fs.rm('functions', { force: true, recursive: true });
for (let fn in functions) {
  const code = functions[fn];
  const filePath = path.join('functions', `${fn}.mjs`)
  await forceWriteFile(filePath, code);
}

/**
 * Copy images???
 */

console.log(`BUILT SITE [${Date.now() - start_time}ms]`);

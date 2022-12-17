import fs from 'fs-extra';
import util from 'node:util';
import path from 'node:path';
import assert from 'node:assert';
import rawGlob from 'glob';
import { parse as parseYml } from 'yaml';

const glob = util.promisify(rawGlob);

export default async function assemble() {
  const buff = await fs.readFile('config.yml');
  const config = parseYml(buff.toString());

  /**
   * Create a map from template id to template renderer
   */
  const templates = await glob('templates/**/*.mjs');
  const templateMap = (await Promise.all(templates.map(async (template) => {
    const id = path.basename(template, '.mjs');
    const { default: render } = await import(path.join('..', template));
    return { id, render };
  }))).reduce((map, { id, render }) => {
    return { ...map, [id]: render };
  }, {});
  
  /**
   * Create all the pages
   */
  assert(Array.isArray(config.pages), 'Config must include an array of pages');
  for (let idx = 0; idx < config.pages.length; idx++) {
    const page = config.pages[idx];
    assert(page.path, 'All pages must have a path');
    assert(templateMap[page.template], `Page ${idx} (${page.path}) uses missing template [${page.template}].\n\n\tValid templates: \n\t  -${Object.keys(templateMap).join('\n\t  -')}\n`);

    if (page.markdown) {
      page.markdown = Array.isArray(page.markdown) ? page.markdown : [page.markdown];
      const markdownMap = (await Promise.all(page.markdown.map(async (md) => {
        const buff = await fs.readFile(path.join('markdown', md))
        console.log(buff.toString());
        return { id: 1, html: '' }
      }))).reduce((map, { id, html }) => {
        return { ...map, [id]: html };
      }, {});
    }

    templateMap[page.template]({
      ...page.props,
    })
  }
}

assemble();


import fs from 'fs-extra';
import util from 'node:util';
import path from 'node:path';
import assert from 'node:assert';
import rawGlob from 'glob';
import md2html from './markdown.mjs';
import makeFunction from './function.mjs';
import { toString } from 'genz';
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
   * Get the page wrapper
   */
  const Page = templateMap[config.site.template_base];
  assert(Page, `Could not find template_base [${config.site.template_base}]`);
  
  /**
   * Create all the pages
   */
  assert(Array.isArray(config.pages), 'Config must include an array of pages');

  const pages = {};
  for (let idx = 0; idx < config.pages.length; idx++) {
    const page = config.pages[idx];
    assert(page.path, 'All pages must have a path');
    assert(templateMap[page.template], `Page ${idx} (${page.path}) uses missing template [${page.template}].\n\n\tValid templates: \n\t  -${Object.keys(templateMap).join('\n\t  -')}\n`);

    /**
     * Load any associated markdown files for the page
     * TODO: validate page.markdown?
     */
    const markdownMap = (await Promise.all(Object.entries(page.markdown || {}).map(async ([key, md]) => {
      assert(!page.props.hasOwnProperty(key), `Page ${idx} (${page.path}) has key collision [${key}] for markdown and props`);
      try {
        const buff = await fs.readFile(path.join('markdown', md));
        const html = md2html(buff.toString());
        return { key, html }
      } catch (err) {
        err.message = `Could not load markdown [${md}]\n\n${err.message}`;
        throw err;
      }
    }))).reduce((map, { key, html }) => {
      return { ...map, [`${key}`]: html };
    }, {});

    /**
     * Render the page html
     */
    const finalProps = { ...markdownMap, ...page.props };
    const finalHtml = toString(Page({
      css: 'html { background: yellow }', // TODO: get the css
      props: finalProps,
      ctx: config,
    }, templateMap[page.template]({ props: finalProps, ctx: config })));

    pages[page.path] = finalHtml;
  }


  // todo: validate functions...
  const functionConfig = config.functions || [];
  const functions = {};
  for (let f = 0; f < functionConfig.length; f++) {
    const fn = functionConfig[f];

    assert(fn.path, 'All functions must have a path');
    assert(templateMap[fn.template], `Function ${f} (${fn.path}) uses missing template [${fn.template}].\n\n\tValid templates: \n\t  -${Object.keys(templateMap).join('\n\t  -')}\n`);

    const code = makeFunction({
      css: 'html { background: yellow }', // TODO: get the css
      ctx: config,
      props: fn.props || {},
      template_page: config.site.template_base,
      template_notes: fn.template,
      secret_name_tap_key: fn.secret_name_tap_key,
      secret_name_tap_url: fn.secret_name_tap_url,
    });

    functions[fn.path] = code;
  }

  return { pages, functions };
}

import fs from 'fs-extra';
import util from 'util';
import path from 'path';
import sizeOf from 'image-size';
import assert from 'assert';
import globRaw from 'glob';
import wordcount from 'wordcount';
import MarkdownIt from 'markdown-it';
import MarkdownFootnote from 'markdown-it-footnote';
import { toString } from 'genz';
import { parse as parseYml } from 'yaml';
import { minify as minifyCss } from 'csso';

import Page from './content/templates/page.mjs';
import Home from './content/templates/home.mjs';
import Article from './content/templates/article.mjs';
import NotFound from './content/templates/404.mjs';

const AVERAGE_READING_SPEED = 238;

// @see https://www.npmjs.com/package/markdown-it
const md = new MarkdownIt({
  typographer: true,
  html: true,
}).use(MarkdownFootnote); // @see https://github.com/markdown-it/markdown-it-footnote

// @see: https://github.com/markdown-it/markdown-it-footnote/blob/master/index.js
md.renderer.rules.footnote_anchor = function render_footnote_anchor(tokens, idx, options, env, slf) {
  var id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
  if (tokens[idx].meta.subId > 0) id += ':' + tokens[idx].meta.subId;
  /* ↩ with escape code to prevent display as Apple Emoji on iOS */
  return '&nbsp;<a href="#fnref' + id + '" class="footnote-backref">\u21a9\uFE0E</a>';
  // return '&nbsp;<a href="#fnref' + id + '" class="footnote-backref">[↑]</a>';
}

const glob = util.promisify(globRaw);
const size = util.promisify(sizeOf);

async function forceWriteFile(file, content) {
  await fs.ensureFile(file);
  await fs.writeFile(file, content);
};

// TODO: think about where i want this to run
const buff = fs.readFileSync(path.join('content', 'styles', 'main.css'));
const mainCSS = minifyCss(buff.toString()).css;

async function loadConfig() {
  const c = await fs.readFile('config.yml');
  return parseYml(c.toString());
}

async function data() {
  const config = await loadConfig();

  for (let a = 0; a < config.articles.length; a++) {
    const article = config.articles[a];
    const md = await fs.readFile(path.join('content', 'articles', `${article.id}.md`));

    article.url = `${config.site.url}/${article.id}`;
    article.content = md.toString().replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,"");
    article.wordCount = wordcount(article.content);
    article.readingTime = Math.ceil(article.wordCount / AVERAGE_READING_SPEED);

    if (article.cover) {
      const { width, height } = await size(path.join('html', 'images', article.cover));
      article.cover = {
        url: `/images/${article.cover}`,
        width, 
        height,
      }
    }

    const author = config.authors.find(a => a.id = article.author);
    assert(author, `${article.title} must have a matching author object`);
    article.author = author;
    author.articles = [...(author.articles || []), article];
  }

  return config;
}

function html(data) {
  const files = [];

  files.push({
    path: 'index.html',
    html: toString(Page({
      css: mainCSS,
      og: {
        title: 'thv.ink',
        image: `${data.site.url}/images/main-share.jpg`,
        description: `Words by Greg Skiano`,
      },
      content: Home(data)
    })),
  });

  files.push({
    path: '404.html',
    html: toString(Page({
      css: mainCSS,
      content: NotFound()
    })),
  });

  data.articles.forEach((article) => {
    files.push({
      path: path.join(article.id, 'index.html'),
      html: toString(
        Page({
          css: mainCSS,
          og: {
            title: article.title,
            image: `${data.site.url}${article.cover.url}`,
            type: 'article',
            description: `by ${article.author.name} | ${article.readingTime} min read` + (article.description ? ` | ${article.description}` : ''),
          },
          content: Article({
            ...article,
            content: md.render(article.content),
          })
        })
      )
    });
  });

  return files;
}

async function write(html) {
  if (fs.existsSync('html')) {
    const old = await glob('html/**/*.html');
    for (let o = 0; o < old.length; o++) await fs.rm(old[o])
  }
  for (let f = 0; f < html.length; f++) {
    const file = html[f];
    forceWriteFile(path.join('html', file.path), file.html);
  }

  // expose the css so it can be imported inside functions...
  forceWriteFile(path.join('functions', 'style.js'), `export default \`${mainCSS}\``);
}

const start = Date.now();
await write(
  html(
    await data()
  )
);
console.log(`CREATED SITE [${Date.now() - start}ms]`)
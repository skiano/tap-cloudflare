import MarkdownIt from 'markdown-it';
import MarkdownFootnote from 'markdown-it-footnote';

/**
 * Setup and configure markdown
 * @see https://www.npmjs.com/package/markdown-it
 */
const md = new MarkdownIt({
  typographer: true,
  html: true,
});

/**
 * Add any extensions
 * @see https://github.com/markdown-it/markdown-it-footnote
 */
md.use(MarkdownFootnote);

/**
 * Override any renderers
 * @see: https://github.com/markdown-it/markdown-it-footnote/blob/master/index.js
 */
md.renderer.rules.footnote_anchor = function render_footnote_anchor(tokens, idx, options, env, slf) {
  var id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
  if (tokens[idx].meta.subId > 0) id += ':' + tokens[idx].meta.subId;
  /* ↩ with escape code to prevent display as Apple Emoji on iOS */
  return '&nbsp;<a href="#fnref' + id + '" class="footnote-backref">\u21a9\uFE0E</a>';
}

export default function md2html(txt) {
  return md.render(txt);
}
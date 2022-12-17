import smartypants from 'smartypants';
import { _, toString } from 'genz';
import mainCSS from './style';
import Page from '../content/templates/page.mjs';

// TODO: how can i cache this...
// TODO: can i bust the cahce from some sort of webhook from /tap?
// @see https://developers.cloudflare.com/workers/runtime-apis/fetch-event/#waituntil

export async function onRequestGet(context) {
  const res = await fetch('https://api.tatatap.com/notes/v1/4DjN9gfwK8qOSj', {
    headers: {
      'x-api-key': context.env.TAP_API_KEY,
    }
  });

  const notes = await res.json();

  const html = toString(Page({
    css: mainCSS,
    og: {
      title: 'thv.ink',
      // TODO: make an image for sharing quotations
      description: `Quotations selected by Greg Skiano`,
    },
    content: [
      _.nav(
        { style: 'margin-bottom: 20px;' },
        _.a({ href: '/' }, 'thv.ink')
      ),
      _.h1('Quotations'),
      _.ul({ style: 'padding: 0;' },
        notes.map((note) => {
          const frags = note.note_body.split("--");
          const citation = frags.pop();
          const quote = smartypants(frags.join('--'));
          const lines = quote.split('\\');
          return _.li({ style: 'margin: 40px 0; padding: 0; list-style: none; line-height: 1.3;'}, [
            lines.map(l => _.div({ style: 'margin: 0;'}, l)),
            _.div({ style: 'margin-top: 15px;' }, `– ${citation}`)
          ])
        })
      )
    ]
  }));
  const response = new Response(html);
  response.headers.set("Content-Type", "text/html; charset=utf-8");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "unsafe-url");
  response.headers.set("Feature-Policy", "none");
  return response;
}
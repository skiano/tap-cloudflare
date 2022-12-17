/**
 * This creates a cloudflare function
 * that connects to tap and exposes the notes and function context to a specific template
 */

const code = `
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

  const html = toString(Page({}));
  const response = new Response(html);
  response.headers.set("Content-Type", "text/html; charset=utf-8");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "unsafe-url");
  response.headers.set("Feature-Policy", "none");
  return response;
}`


// TODO: error handling?
// TODO: caching strategy?

/**
 * This creates a cloudflare function
 * that connects to tap and exposes the notes and function context to a specific template
 */
export default function makeFunction({
  css,
  ctx,
  props,
  template_page,
  template_notes,
  secret_name_tap_url,
  secret_name_tap_key,
}) {
return (`
////////////////////////////////////
// NOTE: THIS FILE IS GENERATED   //
// @see config.yml & function.mjs //
////////////////////////////////////

import { _, toString } from 'genz';
import Page from '../templates/${template_page}.mjs';
import Content from '../templates/${template_notes}.mjs';

const css = \`${css}\`;
const ctx = ${JSON.stringify(ctx, null, 2)};
const props = ${JSON.stringify(props, null, 2)};

export async function onRequestGet(context) {
  const res = await fetch(context.env.${secret_name_tap_url}, {
    headers: {
      'x-api-key': context.env.${secret_name_tap_key},
    }
  });

  props.tap_notes = await res.json();
  props.request_context = context;

  const html = toString(Page({
    css,
    props,
  }, Content({ props, ctx })));

  const response = new Response(html);
  response.headers.set("Content-Type", "text/html; charset=utf-8");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "unsafe-url");
  response.headers.set("Feature-Policy", "none");
  return response;
}`).trim();
}

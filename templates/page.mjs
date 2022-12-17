import { _ } from 'genz';

// FOR OpenGraph meta tags
// @see https://ogp.me/
// @see https://developers.facebook.com/tools/debug/

// Consider twitter???
// <meta name="twitter:card" content="summary" />
// <meta name="twitter:site" content="@myawesomeblog" />
// <meta name="twitter:creator" content="@myawesomeblogger" />

export default function Page({ content, og, css }) {
  og = { ...og };
  return _.html({ lang: 'en' },
    _.head(
      _.title('thv.ink'),
      _.link({ rel: 'icon', type: 'image/png', href: '/images/favicon.png', sizes: '64x64' }),
      _.meta({ name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
      _.meta({ charset: 'UTF-8' }),
      og.title && _.meta({ property: 'og:title', content: og.title }),
      og.description && _.meta({ property: 'og:description', content: og.description }),
      og.image && _.meta({ property: 'og:image', content: og.image }),
      og.url && _.meta({ property: 'og:url', content: og.url }),
      og.type && _.meta({ property: 'og:type', content: og.type }),
      og.author && _.meta({ property: 'og:article:author', content: og.author }),
      _.meta({ property: 'og:site_name', content: 'thv.ink' }),
      _.style(css),
    ),
    _.body(
      _.main(content)
    ),
  )
}
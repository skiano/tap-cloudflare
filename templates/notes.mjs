import { _ } from 'genz';

export default function Article(props, ctx) {
  return [
    _.h1('Article'),
    _.pre(JSON.stringify(props, null, 2)),
    _.pre(JSON.stringify(ctx, null, 2))
  ];
}
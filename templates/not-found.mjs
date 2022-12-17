import { _ } from 'genz';

export default function NotFound() {
  return [
    _.h1('Not Found'),
    _.div({ style: 'margin: 30px 0;'},
      _.p('Sorry! We could not find this page.'),
      _.a({ href: '/' }, 'Go home')
    )
  ];
}
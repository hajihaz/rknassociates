const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const pages = ['index', 'about', 'services', 'projects', 'contact', 'interior', '404'];
const editable = { index: 'home', about: 'about', services: 'services', projects: 'projects', contact: 'contact', interior: 'interior' };

test('HVD fonts are declared on public pages and CMS-served page templates', () => {
  for (const page of pages) {
    const paths = [`${page}.html`];
    if (editable[page]) paths.push(`website-lib/templates/${editable[page]}.html`);
    for (const pathname of paths) {
      const html = read(pathname);
      assert.match(html, /family=Bodoni\+Moda:/, pathname);
      assert.match(html, /family=IBM\+Plex\+Sans:/, pathname);
      assert.match(html, /family=Noto\+Sans\+Tamil:/, pathname);
      assert.doesNotMatch(html, /Cormorant\+Garamond|family=Jost:/, pathname);
      assert.equal((html.match(/fonts\.googleapis\.com\/css2/g) || []).length, 1, pathname);
    }
  }
});

test('Shared font aliases resolve to HVD faces without changing the Tamil stack', () => {
  const css = read('assets/shared.css');
  assert.match(css, /--ff-display:\s*'Bodoni Moda'/);
  assert.match(css, /--ff-body:\s*'IBM Plex Sans'/);
  assert.match(css, /--ff-serif:\s*var\(--ff-display\)/);
  assert.match(css, /--ff-sans:\s*var\(--ff-body\)/);
  assert.match(css, /--ff-tamil:\s*'Noto Sans Tamil'/);
});

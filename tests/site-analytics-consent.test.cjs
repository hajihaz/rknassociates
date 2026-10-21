const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '../assets/customer-analytics.js'), 'utf8');
function pageHarness({ dnt = false } = {}) {
  const data = new Map();
  const session = new Map();
  const events = new Map();
  const sent = [];
  let reloads = 0;
  let ids = 0;
  class Element {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.listeners = {}; this.parent = null; this.style = {}; }
    appendChild(child) { child.parent = this; this.children.push(child); return child; }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
    setAttribute(key, value) { this[key] = value; }
    getAttribute(key) { return this[key] ?? null; }
    addEventListener(type, handler) { (this.listeners[type] ??= []).push(handler); }
    click() { for (const fn of this.listeners.click ?? []) fn({ target: this }); }
    closest(selector) { if (selector.includes('form')) return null; if (this.id && selector.includes('#' + this.id)) return this; return null; }
  }
  const body = new Element('body');
  const document = {
    body, readyState: 'complete', visibilityState: 'visible',
    documentElement: { hasAttribute: () => false },
    createElement: tag => new Element(tag),
    getElementById(id) { const find = node => node.id === id ? node : node.children.map(find).find(Boolean); return find(body) || null; },
    addEventListener(type, fn) { (events.get(type) ?? events.set(type, []).get(type)).push(fn); },
  };
  const localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, val) => data.set(key, val), removeItem: key => data.delete(key) };
  const sessionStorage = { getItem: key => session.get(key) ?? null, setItem: (key, val) => session.set(key, val), removeItem: key => session.delete(key) };
  const location = { pathname: '/', origin: 'https://rkn.test', reload: () => { reloads++; } };
  vm.runInNewContext(source, {
    window: { addEventListener() {} }, document, Element,
    navigator: { doNotTrack: dnt ? '1' : '0', globalPrivacyControl: false },
    location, localStorage, sessionStorage, Date, URL,
    crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++ids).padStart(12, '0')}` },
    fetch: async (url, opts) => { sent.push(JSON.parse(opts.body)); return { ok: true }; },
    setInterval() {},
  }, { timeout: 1000 });
  return { sent, data, session, events, document, reloads: () => reloads };
}
function choose(dialog, label) {
  const button = dialog.children.find(el => el.tagName === 'BUTTON' && el.textContent === label);
  assert.ok(button, `Missing ${label} consent control`);
  button.click();
}

test('no collection before consent, opt in, opt out, and allow re-selection', () => {
  const ctx = pageHarness();
  assert.equal(ctx.sent.length, 0);
  assert.ok(ctx.document.getElementById('rkn-analytics-choice'));
  assert.ok(ctx.document.getElementById('rkn-analytics-manage'));
  choose(ctx.document.getElementById('rkn-analytics-choice'), 'Allow analytics');
  assert.deepEqual(ctx.sent.map(ev => ev.kind), ['visit', 'view']);
  ctx.document.getElementById('rkn-analytics-manage').click();
  choose(ctx.document.getElementById('rkn-analytics-choice'), 'No thanks');
  assert.equal(ctx.data.get('rkn-analytics-consent-v1'), 'no');
  assert.equal(ctx.data.has('rkn-analytics-visitor-v1'), false);
  assert.equal(ctx.session.has('rkn-analytics-session-v1'), false);
  for (const fn of ctx.events.get('click') ?? []) fn({ target: new (ctx.document.body.constructor)('a') });
  assert.equal(ctx.sent.length, 2, 'after withdrawal, do not collect additional events');
  ctx.document.getElementById('rkn-analytics-manage').click();
  choose(ctx.document.getElementById('rkn-analytics-choice'), 'Allow analytics');
  assert.equal(ctx.reloads(), 1, 'reload rather than duplicate previously installed listeners');
});

test('do-not-track prevents both prompt and analytics collection', () => {
  const ctx = pageHarness({ dnt: true });
  assert.equal(ctx.sent.length, 0);
  assert.equal(ctx.document.getElementById('rkn-analytics-choice'), null);
  assert.equal(ctx.document.getElementById('rkn-analytics-manage'), null);
});

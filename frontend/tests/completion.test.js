import test from 'node:test';
import assert from 'node:assert/strict';
import { findPartyPath, giveVictoryBook, openBook, closeBook } from '../src/completion.js';

test('party path goes around an obstacle and remains inside arena bounds', () => {
  const bounds = { x: 0, y: 0, width: 240, height: 200 };
  const obstacle = { left: 90, right: 130, top: 50, bottom: 130 };
  const path = findPartyPath({ x: 30, y: 90 }, { x: 210, y: 90 }, bounds, [obstacle]);
  assert(path.length > 0);
  assert(path.some(({ y }) => y < 40 || y > 140));
  assert(path.every(({ x, y }) => x >= 0 && x < 240 && y >= 0 && y < 200));
  assert(path.every(({ x, y }) => !(x > 76 && x < 144 && y > 40 && y < 140)));
});

test('victory grants one book without replacing the coupon or duplicating rewards', () => {
  const scene = { inventory: [{ type: 'coupon' }, { type: 'empty' }], updateInventoryList() {}, updateHotbarState() {} };
  giveVictoryBook(scene);
  giveVictoryBook(scene);
  assert.equal(scene.inventory[0].type, 'coupon');
  assert.equal(scene.inventory.filter(({ type }) => type === 'book').length, 1);
});

class Element {
  constructor() { this.nodes = new Map(); this.listeners = {}; this.children = []; this.classList = { add() {}, remove() {} }; }
  querySelector(selector) { if (!this.nodes.has(selector)) this.nodes.set(selector, new Element()); return this.nodes.get(selector); }
  addEventListener(name, handler) { this.listeners[name] = handler; }
  appendChild(node) { this.children.push(node); }
  replaceChildren() { this.children = []; }
  remove() { this.removed = true; }
  focus() {}
}

function bookScene(pages) {
  globalThis.document = { createElement: () => new Element(), body: new Element() };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ pages }) });
  return { player: { setVelocity() {} }, events: { once() {} } };
}

test('book shows one image per page and supports forward/backward navigation', async () => {
  const scene = bookScene(['/assets/book/01.jpg', '/assets/book/02.png']);
  await openBook(scene);
  const overlay = scene.bookOverlay;
  const page = overlay.querySelector('.book-page');
  assert.equal(page.children.length, 1);
  assert.equal(page.children[0].src, '/assets/book/01.jpg');
  assert.equal(overlay.querySelector('.book-prev').disabled, true);
  overlay.querySelector('.book-next').listeners.click();
  assert.equal(page.children[0].src, '/assets/book/02.png');
  assert.equal(overlay.querySelector('.book-count').textContent, '2 / 2');
  assert.equal(overlay.querySelector('.book-next').disabled, true);
  overlay.querySelector('.book-prev').listeners.click();
  assert.equal(page.children[0].src, '/assets/book/01.jpg');
  closeBook(scene);
  assert.equal(scene.bookOpen, false);
  assert.equal(overlay.removed, true);
});

test('book can be opened before images are supplied', async () => {
  const scene = bookScene([]);
  await openBook(scene);
  assert.equal(scene.bookOverlay.querySelector('.book-count').textContent, '1 / 1');
  assert.equal(scene.bookOverlay.querySelector('.book-next').disabled, true);
  assert.equal(scene.bookOverlay.querySelector('.book-page').children[0].textContent, 'Cartea nu are încă fotografii.');
});

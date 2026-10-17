import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bobitaPages } from '../bobita-book-plugin.js';

test('book discovers only image files, orders numbered pages, and escapes filenames', () => {
  const root = mkdtempSync(join(tmpdir(), 'bobita-book-test-'));
  const dirs = ['public', 'public/assets', 'public/assets/Bobita'];
  const names = ['10.jpg', '2 space.PNG', '1.webp', 'README.md', 'Bobita.png', 'Luis.png', 'medalion.png'];
  try {
    dirs.forEach(dir => mkdirSync(join(root, dir)));
    names.forEach(name => writeFileSync(join(root, dirs[2], name), 'test fixture'));
    assert.deepEqual(bobitaPages(root), ['/assets/Bobita/1.webp', '/assets/Bobita/2%20space.PNG', '/assets/Bobita/10.jpg']);
  } finally {
    names.forEach(name => unlinkSync(join(root, dirs[2], name)));
    dirs.reverse().forEach(dir => rmdirSync(join(root, dir))); rmdirSync(root);
  }
  assert.deepEqual(bobitaPages(root), []);
});

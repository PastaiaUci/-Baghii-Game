import test from 'node:test';
import assert from 'node:assert/strict';
import { hasGambledAwayLevel } from '../src/dice-defeat.js';

const state = () => ({ hasCoupon: false, gold: 99, goldPickups: [{ collected: true }, { collected: true }] });

test('hidden defeat requires all coins collected, no coupon and under 100 gold', () => {
  assert.equal(hasGambledAwayLevel(state()), true);
  assert.equal(hasGambledAwayLevel({ ...state(), gold: 0 }), true);
  assert.equal(hasGambledAwayLevel({ ...state(), gold: 100 }), false);
  assert.equal(hasGambledAwayLevel({ ...state(), hasCoupon: true }), false);
  assert.equal(hasGambledAwayLevel({ ...state(), goldPickups: [{ collected: false }] }), false);
  assert.equal(hasGambledAwayLevel({ ...state(), goldPickups: [] }), false);
  assert.equal(hasGambledAwayLevel({ ...state(), bossRoomActive: true }), false);
  assert.equal(hasGambledAwayLevel({ ...state(), currentLevel: 2 }), false);
});

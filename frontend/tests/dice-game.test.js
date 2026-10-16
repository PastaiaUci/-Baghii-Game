import test from 'node:test';
import assert from 'node:assert/strict';
import { playDiceRound } from '../src/dice-game.js';

function scene(gold = 100) {
  return { gold, updates: 0, updateGoldHud() { this.updates += 1; } };
}
function sequence(values) { return () => values.shift(); }

test('winning returns twice the paid stake and rolls two independent dice per player', () => {
  const s = scene();
  const result = playDiceRound(s, 25, sequence([0.99, 0.6, 0, 0.2]));
  assert.deepEqual(result.player, [6, 4]);
  assert.deepEqual(result.opponent, [1, 2]);
  assert.equal(result.payout, 50);
  assert.equal(s.gold, 125);
  assert.equal(s.updates, 1);
});
test('losing the entire balance leaves zero gold; ties refund the stake', () => {
  const s = scene(25);
  const loss = playDiceRound(s, 25, sequence([0, 0, 0.99, 0.99]));
  assert.equal(loss.outcome, -1);
  assert.equal(s.gold, 0);
  assert.match(playDiceRound(s, 1).error, /buzunarele goale/);
  const tied = scene(25);
  assert.equal(playDiceRound(tied, 25, () => 0.5).outcome, 0);
  assert.equal(tied.gold, 25);
});
test('invalid and unaffordable stakes cannot roll dice or change gold', () => {
  const s = scene(20);
  for (const stake of [-1, 0, 1.5, NaN, Infinity, 21]) {
    assert.ok(playDiceRound(s, stake, () => { throw new Error('Must not roll'); }).error);
    assert.equal(s.gold, 20);
  }
  assert.equal(s.updates, 0);
});

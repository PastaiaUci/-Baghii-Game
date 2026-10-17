import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeSave, decodeSave, readSave, writeSave, clearSave, nextSaveProfile, SAVE_KEY, BACKUP_KEY, SAVE_VERSION } from '../src/save-data.js';
import { captureProgress } from '../src/save-state.js';

function sample() {
  return { place: 'village', gold: 123, level: 2, xp: 50, points: 3, health: 12,
    stats: { speed: 10, strength: 12, agility: 10, intelligence: 10, vitality: 11 },
    inventory: Array.from({ length: 27 }, (_, i) => i === 0 ? { type: 'sword', label: 'Sword' } : { type: 'empty' }),
    equipment: { helmet: { type: 'helmet', armorRemaining: 2.5 }, shield: { type: 'shield', durability: 17 } },
    flags: { hasCoupon: true }, reward: null, party: null, selected: 'slot-2', villagers: [false, true, false, true, true],
    tavern: { status: 'serving', step: 3, correct: 3, lastScore: 3, position: { x: 580, y: 218 } },
    luis: null, winter: null, coins: [{ x: 280, y: 610, value: 20, collected: true }, { x: 390, y: 610, value: 20, collected: false }],
    medallions: [], beerDrops: [], stones: [], cooldowns: { potion: 1500 }, audioVolume: 0.4, audioEnabled: false };
}
function storage() { const map = new Map(); return { map, getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) }; }

test('Bobita party health, cooldown, reward flags, book and equipped necklace survive saving', () => {
  const data = sample(); data.place = 'alpine'; data.flags.bossDefeated = true; data.reward = 'beer';
  data.luis = { status: 'completed', count: 3 }; data.winter = { status: 'ready', opened: [], correctChest: null };
  data.mountainRescue = { status: 'thawed', target: 8, broken: [8], calls: 4, rewards: { book: true, necklace: true } };
  data.bobita = { health: 0, sleeping: true, healRemaining: 3200 };
  data.equipment.necklace = { type: 'gold-necklace', statBonuses: { strength: 4, vitality: 6 } }; data.inventory[5] = { type: 'bobita-book' };
  const loaded = decodeSave(encodeSave(data)).data;
  assert.deepEqual(loaded.bobita, data.bobita); assert.deepEqual(loaded.mountainRescue.rewards, data.mountainRescue.rewards);
  assert.deepEqual(loaded.equipment.necklace.statBonuses, { strength: 4, vitality: 6 }); assert.equal(loaded.inventory[5].type, 'bobita-book');
  data.bobita.health = 26; assert.throws(() => encodeSave(data));
});

test('mountain rescue survives export at every stage while old saves remain compatible', () => {
  const data = sample();
  assert.equal(decodeSave(encodeSave(data)).data.mountainRescue, null);
  data.place = 'alpine'; data.flags.bossDefeated = true; data.reward = 'beer';
  data.luis = { status: 'completed', count: 3 }; data.winter = { status: 'ready', opened: [2], correctChest: 2 };
  for (const status of ['searching', 'found', 'carrying', 'rescued', 'transporting', 'delivered', 'thawed']) {
    data.mountainRescue = { status, target: 8, broken: status === 'searching' ? [1, 4] : [1, 4, 8], calls: 4 };
    assert.deepEqual(decodeSave(encodeSave(data)).data.mountainRescue, data.mountainRescue);
  }
  data.mountainRescue.target = 999; assert.throws(() => encodeSave(data));
  data.mountainRescue.target = 8; data.mountainRescue.broken = []; assert.throws(() => encodeSave(data));
});

test('firewood progress, sleigh damage and collected quest items survive save validation', () => {
  const data = sample(); data.place = 'alpine'; data.flags.bossDefeated = true; data.reward = 'beer';
  data.luis = { status: 'completed', count: 3 }; data.winter = { status: 'ready', opened: [], correctChest: null };
  data.mountainRescue = { status: 'delivered', target: 8, broken: [8], calls: 4 };
  for (const stage of ['needed', 'chopped', 'collected', 'burning']) {
    data.mountainRescue.firewood = { stage, hp: stage === 'needed' ? 2.5 : 0 };
    data.inventory[4] = stage === 'collected' ? { type: 'firewood', quantity: 3 } : { type: 'empty' };
    assert.deepEqual(decodeSave(encodeSave(data)).data.mountainRescue, data.mountainRescue);
  }
  data.mountainRescue.firewood.stage = 'collected'; assert.throws(() => encodeSave(data));
});

function legacySave() {
  const payload = { version: 1, game: 'The Redemption', savedAt: '2026-10-17T10:00:00.000Z', data: decodeSave(encodeSave(sample())).data };
  let n = 2166136261; const text = JSON.stringify(payload);
  for (let i = 0; i < text.length; i++) n = Math.imul(n ^ text.charCodeAt(i), 16777619);
  return JSON.stringify({ ...payload, checksum: (n >>> 0).toString(16) });
}

test('version-one saves migrate deterministically without changing progress or rewriting storage', () => {
  const text = legacySave(), bank = storage(); bank.setItem(SAVE_KEY, text);
  const loaded = readSave(bank), again = decodeSave(text);
  assert.equal(loaded.version, SAVE_VERSION); assert.equal(loaded.migratedFrom, 1);
  assert.deepEqual(loaded.data, again.data); assert.equal(loaded.profile.id, again.profile.id);
  assert.equal(loaded.data.gold, 123); assert.equal(loaded.data.points, 3);
  assert.equal(bank.getItem(SAVE_KEY), text); assert.equal(bank.getItem(BACKUP_KEY), null);
  writeSave(bank, encodeSave(loaded.data, undefined, nextSaveProfile(loaded.profile)));
  assert.equal(bank.getItem(BACKUP_KEY), text); assert.equal(readSave(bank).migratedFrom, null);
  assert.equal(readSave(bank).profile.id, loaded.profile.id);
  const corrupted = JSON.parse(text); corrupted.data.points++;
  assert.throws(() => decodeSave(JSON.stringify(corrupted)));
});

test('identity and creation date survive revisions, export and import', () => {
  const created = '2026-10-17T10:00:00.000Z', first = nextSaveProfile(null, created);
  const second = nextSaveProfile(first, '2026-10-18T10:00:00.000Z');
  assert.equal(second.id, first.id); assert.equal(second.createdAt, created);
  assert.equal(second.revision, 2); assert.equal(second.parentRevision, 1);
  assert.equal(first.revision, 1);
  const loaded = decodeSave(encodeSave(sample(), undefined, second));
  assert.deepEqual(loaded.profile, second);
  const exported = encodeSave(loaded.data, loaded.savedAt, loaded.profile);
  assert.deepEqual(decodeSave(exported).profile, second);
});

test('an older client cannot silently overwrite a save from a newer game version', () => {
  const bank = storage(), future = JSON.parse(encodeSave(sample())); future.version = 999;
  const raw = JSON.stringify(future); bank.setItem(SAVE_KEY, raw);
  assert.throws(() => writeSave(bank, encodeSave(sample())), { name: 'UnsupportedSaveVersionError' });
  assert.equal(bank.getItem(SAVE_KEY), raw);
});

test('versioned export/import preserves inventory order, gear wear, quests, stats and uncollected coins', () => {
  const data = sample(), loaded = decodeSave(encodeSave(data)).data;
  assert.equal(loaded.gold, 123); assert.equal(loaded.inventory[0].type, 'sword'); assert.equal(loaded.inventory[26].key, '27');
  assert.equal(loaded.equipment.helmet.armorRemaining, 2.5); assert.equal(loaded.equipment.shield.durability, 17);
  assert.deepEqual(loaded.villagers, data.villagers); assert.deepEqual(loaded.tavern, data.tavern);
  assert.deepEqual(loaded.coins, data.coins); assert.equal(loaded.audioVolume, 0.4);
  data.inventory[0].label = '<img src=x onerror="alert(1)">';
  assert.doesNotMatch(decodeSave(encodeSave(data)).data.inventory[0].label, /[<>"&]/);
});

test('corruption and incompatible versions are rejected without replacing the existing bank', () => {
  const bank = storage(), original = encodeSave(sample()); writeSave(bank, original);
  const corrupted = JSON.parse(original); corrupted.data.gold++;
  assert.throws(() => writeSave(bank, JSON.stringify(corrupted)));
  assert.equal(bank.getItem(SAVE_KEY), original);
  corrupted.version = 999; assert.throws(() => decodeSave(JSON.stringify(corrupted)), /Versiunea/);
  for (const mutate of [d => d.gold = -1, d => d.inventory[0].type = 'unknown', d => d.equipment.shield.durability = 51, d => d.level = 0, d => d.winter = { status: 'searching', opened: [9] }]) {
    const data = sample(); mutate(data); assert.throws(() => encodeSave(data));
  }
});

test('a valid previous save is retained independently and recovered if the primary is damaged', () => {
  const bank = storage(), first = encodeSave(sample()); writeSave(bank, first);
  const updated = sample(); updated.gold = 456; writeSave(bank, encodeSave(updated));
  assert.equal(readSave(bank).data.gold, 456); assert.equal(bank.getItem(BACKUP_KEY), first);
  bank.setItem(SAVE_KEY, 'broken'); assert.equal(readSave(bank).data.gold, 123); assert.equal(readSave(bank).fromBackup, true);
  writeSave(bank, encodeSave(updated)); assert.equal(bank.getItem(BACKUP_KEY), first);
  clearSave(bank); assert.equal(readSave(bank), null);
});

test('quota failures preserve an existing primary and do not pretend to save', () => {
  const bank = storage(), original = encodeSave(sample()); writeSave(bank, original);
  bank.setItem = () => { const error = new Error('Full'); error.name = 'QuotaExceededError'; throw error; };
  assert.throws(() => writeSave(bank, original)); assert.equal(bank.getItem(SAVE_KEY), original);
});

test('snapshot uses the active interior clock, preserves drop destinations and records a lost gambling run', () => {
  const data = sample();
  const scene = { inventory: data.inventory, characterStats: data.stats, gold: 0, playerHealth: 12, selectedWeapon: 'slot-1',
    time: { now: 100 }, game: { loop: { now: 2000 } }, houseActive: true,
    activeHouse: { time: { now: 2000 }, rushSkill: { readyAt: 3000 } },
    npcs: data.villagers.map(alive => ({ alive })), goldPickups: [{ sprite: { x: 1, y: 2 }, savePosition: { x: 100, y: 200 }, value: 20, collected: true }],
    metinStones: [], partyBeerDrops: [], luisMedallions: [], potionReadyAt: 3000,
  };
  const snapshot = captureProgress(scene);
  assert.equal(snapshot.cooldowns.rush, 1000); assert.equal(snapshot.cooldowns.potion, 1000);
  assert.equal(snapshot.flags.lost, true); assert.equal(snapshot.coins[0].x, 100);
});

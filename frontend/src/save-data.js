export const SAVE_KEY = 'the-redemption.save.v1';
export const BACKUP_KEY = `${SAVE_KEY}.backup`;
// Keep the storage keys stable; only the envelope version changes.
export const SAVE_VERSION = 2;
const TYPES = new Set(['empty', 'sword', 'coupon', 'book', 'bobita-book', 'gold-necklace', 'health-potion', 'revival-beer', 'helmet', 'wind-boots', 'shield', 'flashlight', 'gold-medallion', 'winter-coat', 'migan-ointment', 'firewood']);
const STATS = ['speed', 'strength', 'agility', 'intelligence', 'vitality'];
const assert = (condition) => { if (!condition) throw new Error('Salvare invalidă sau deteriorată.'); };
const number = (n, max = 1e9) => Number.isFinite(n) && n >= 0 && n <= max;
const integer = (n, max = 1e9) => Number.isSafeInteger(n) && number(n, max);
const hash = (text) => { let n = 2166136261; for (let i = 0; i < text.length; i++) n = Math.imul(n ^ text.charCodeAt(i), 16777619); return (n >>> 0).toString(16); };

function item(value, index = 0) {
  assert(value && TYPES.has(value.type));
  const result = { type: value.type, key: String(index + 1), label: typeof value.label === 'string' ? value.label.slice(0, 250).replace(/[<>"&\u0000-\u001f]/g, '') : value.type };
  for (const field of ['quantity', 'armorRemaining', 'durability']) {
    if (value[field] !== undefined) { assert(number(value[field])); result[field] = value[field]; }
  }
  if (value.quantity !== undefined) assert(integer(value.quantity) && value.quantity > 0);
  if (value.type === 'firewood') assert(value.quantity === 3);
  if (value.type === 'gold-medallion') assert(integer(value.quantity) && value.quantity > 0);
  if (value.type === 'helmet') assert(number(value.armorRemaining, 5));
  if (value.type === 'shield') assert(number(value.durability, 50) && value.durability > 0);
  if (value.statBonuses) {
    result.statBonuses = {};
    for (const key of STATS) if (value.statBonuses[key] !== undefined) { assert(number(value.statBonuses[key], 10000)); result.statBonuses[key] = value.statBonuses[key]; }
  }
  if (value.type === 'gold-necklace') result.statBonuses = { strength: 4, vitality: 6 };
  return result;
}

export function validateSave(data) {
  assert(data && ['village', 'boss', 'alpine'].includes(data.place));
  assert(integer(data.gold, 1e12) && integer(data.level, 100000) && data.level >= 1 && integer(data.xp) && data.xp < 100 + (data.level - 1) * 50 && integer(data.points));
  assert(Array.isArray(data.inventory) && data.inventory.length >= 27 && data.inventory.length <= 100);
  assert(number(data.health) && data.stats && STATS.every((key) => integer(data.stats[key], 100000) && data.stats[key] >= 1));
  const equipment = {};
  for (const [slot, type] of Object.entries({ helmet: 'helmet', boots: 'wind-boots', shield: 'shield', armor: 'winter-coat', necklace: 'gold-necklace' })) {
    equipment[slot] = data.equipment?.[slot] ? item(data.equipment[slot]) : null;
    assert(!equipment[slot] || equipment[slot].type === type);
  }
  const flags = {};
  for (const key of ['hasCoupon', 'missionKillVillagers', 'abgPicked', 'bossDefeated', 'teteStatPointsGranted', 'testCheckpointUsed', 'shopHelmetSold', 'metEmperorLuis', 'lost']) flags[key] = Boolean(data.flags?.[key]);
  assert(data.place !== 'alpine' || flags.bossDefeated);
  assert(!flags.bossDefeated || data.place !== 'village');
  const reward = data.reward ?? null; assert([null, 'beer', 'sperma'].includes(reward));
  assert(!reward || flags.bossDefeated); assert(data.place !== 'alpine' || reward);
  const party = data.party ? { health: data.party.health, sleeping: Boolean(data.party.sleeping) } : null;
  assert(!party || flags.bossDefeated && number(party.health, 25));
  assert(Array.isArray(data.villagers) && data.villagers.length === 5 && data.villagers.every((v) => typeof v === 'boolean'));
  const tavern = data.tavern ? { status: data.tavern.status, step: data.tavern.step || 0, correct: data.tavern.correct || 0, lastScore: data.tavern.lastScore || 0 } : null;
  assert(!tavern || ['inactive', 'active', 'walking', 'serving', 'ready', 'completed'].includes(tavern.status) && integer(tavern.step, 3) && integer(tavern.correct, 3) && integer(tavern.lastScore, 3));
  if (tavern && data.tavern.position) { assert(number(data.tavern.position.x, 960) && number(data.tavern.position.y, 640)); tavern.position = { x: data.tavern.position.x, y: data.tavern.position.y }; }
  const luis = data.luis ? { status: data.luis.status, count: data.luis.count } : null;
  assert(!luis || ['active', 'completed'].includes(luis.status) && integer(luis.count, 3));
  let winter = null;
  if (data.winter) {
    const q = data.winter;
    assert(['blocked', 'seek-migan', 'searching', 'ointment-found', 'coat-owned', 'ready'].includes(q.status));
    assert(Array.isArray(q.opened) && q.opened.length <= 6 && q.opened.every((n) => integer(n, 5)));
    assert(q.correctChest == null || integer(q.correctChest, 5));
    winter = { status: q.status, opened: [...new Set(q.opened)], correctChest: q.correctChest ?? null };
  }
  const drops = (values, gold = false) => {
    assert(Array.isArray(values) && values.length <= 5000);
    return values.map((v) => { assert(number(v.x, 1600) && number(v.y, 1200) && (!gold || integer(v.value, 10000) && v.value > 0)); return gold ? { x: v.x, y: v.y, value: v.value, collected: Boolean(v.collected) } : { x: v.x, y: v.y }; });
  };
  let mountainRescue = null;
  if (data.mountainRescue) {
    const q = data.mountainRescue;
    assert(data.place === 'alpine' && luis?.status === 'completed' && winter?.status === 'ready');
    assert(['searching', 'found', 'carrying', 'rescued', 'transporting', 'delivered', 'thawed'].includes(q.status) && integer(q.target, 17) && q.target >= 5);
    assert(Array.isArray(q.broken) && q.broken.length <= 18 && q.broken.every((n) => integer(n, 17)) && integer(q.calls, 4));
    assert(q.status === 'searching' ? !q.broken.includes(q.target) : q.broken.includes(q.target));
    mountainRescue = { status: q.status, target: q.target, broken: [...new Set(q.broken)], calls: q.calls };
    if (q.rewards) { assert(q.status === 'thawed'); mountainRescue.rewards = { book: Boolean(q.rewards.book), necklace: Boolean(q.rewards.necklace) }; }
    if (q.firewood) {
      const wood = q.firewood;
      assert(['delivered', 'thawed'].includes(q.status) && ['needed', 'chopped', 'collected', 'burning'].includes(wood.stage));
      assert(number(wood.hp, 4) && (wood.stage === 'needed' ? wood.hp > 0 : wood.hp === 0));
      assert(q.status !== 'thawed' || wood.stage === 'burning');
      assert(wood.stage !== 'collected' || data.inventory.some((i) => i.type === 'firewood' && i.quantity === 3));
      mountainRescue.firewood = { stage: wood.stage, hp: wood.hp };
    }
  }
  let bobita = null;
  if (data.bobita) {
    assert(mountainRescue?.status === 'thawed' && number(data.bobita.health, 25) && number(data.bobita.healRemaining ?? 5000, 5000));
    bobita = { health: data.bobita.health, sleeping: Boolean(data.bobita.sleeping) || data.bobita.health === 0, healRemaining: data.bobita.healRemaining ?? 5000 };
  }
  assert(Array.isArray(data.stones) && data.stones.length <= 10);
  const stones = data.stones.map((s) => { assert(integer(s.index, 9) && number(s.remaining, 35000)); return { index: s.index, remaining: s.remaining }; });
  const cooldowns = {};
  for (const key of ['rush', 'aura', 'breath', 'flashlight', 'potion']) { assert(number(data.cooldowns?.[key] ?? 0, 60000)); cooldowns[key] = data.cooldowns?.[key] || 0; }
  return { place: data.place, gold: data.gold, level: data.level, xp: data.xp, points: data.points, health: data.health,
    stats: Object.fromEntries(STATS.map((key) => [key, data.stats[key]])), inventory: data.inventory.map(item), equipment, flags, reward, party,
    selected: /^slot-[1-5]$/.test(data.selected) ? data.selected : 'slot-1', villagers: [...data.villagers], tavern, luis, winter, mountainRescue, bobita,
    coins: drops(data.coins, true), medallions: drops(data.medallions), beerDrops: drops(data.beerDrops), stones, cooldowns,
    bootsSold: Boolean(data.bootsSold), audioVolume: number(data.audioVolume, 1) ? data.audioVolume : 0.7, audioEnabled: data.audioEnabled !== false };
}

export function nextSaveProfile(previous = null, savedAt = new Date().toISOString()) {
  return { id: previous?.id || globalThis.crypto?.randomUUID?.() || `save-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    revision: (previous?.revision ?? 0) + 1, parentRevision: previous?.revision ?? null, createdAt: previous?.createdAt || savedAt };
}
function validateProfile(profile) {
  assert(profile && typeof profile.id === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(profile.id));
  assert(Number.isSafeInteger(profile.revision) && profile.revision >= 0);
  assert(profile.parentRevision === null || Number.isSafeInteger(profile.parentRevision) && profile.parentRevision >= 0 && profile.parentRevision < profile.revision);
  assert(typeof profile.createdAt === 'string' && Number.isFinite(Date.parse(profile.createdAt)));
  return { id: profile.id, revision: profile.revision, parentRevision: profile.parentRevision, createdAt: profile.createdAt };
}
// Each migration is pure and advances exactly one version. Never rewrite a bank during read.
const MIGRATIONS = {
  1: (save) => ({ ...save, version: 2, profile: { id: `legacy-${save.checksum}`, revision: 0, parentRevision: null, createdAt: save.savedAt } }),
};
export function encodeSave(data, savedAt = new Date().toISOString(), profile = null) {
  const payload = { version: SAVE_VERSION, game: 'The Redemption', savedAt, data: validateSave(data), profile: validateProfile(profile || nextSaveProfile(null, savedAt)) };
  return JSON.stringify({ ...payload, checksum: hash(JSON.stringify(payload)) });
}
export function decodeSave(text) {
  assert(typeof text === 'string' && text.length <= 1000000);
  let envelope;
  try { envelope = JSON.parse(text); } catch { throw new Error('Fișierul nu conține o salvare validă.'); }
  assert(envelope && typeof envelope === 'object');
  if (!Number.isSafeInteger(envelope.version) || envelope.version < 1 || envelope.version > SAVE_VERSION) {
    const error = new Error('Versiunea acestei salvări nu este compatibilă cu jocul. Actualizează jocul pentru a o deschide.'); error.name = 'UnsupportedSaveVersionError'; throw error;
  }
  const { version, game, savedAt, data } = envelope;
  assert(game === 'The Redemption' && typeof savedAt === 'string' && Number.isFinite(Date.parse(savedAt)));
  const signed = { version, game, savedAt, data };
  if (version >= 2) signed.profile = envelope.profile;
  assert(hash(JSON.stringify(signed)) === envelope.checksum);
  let migrated = envelope;
  while (migrated.version < SAVE_VERSION) {
    const migrate = MIGRATIONS[migrated.version]; assert(typeof migrate === 'function');
    const next = migrate(migrated); assert(next.version === migrated.version + 1); migrated = next;
  }
  return { version: SAVE_VERSION, game, savedAt, data: validateSave(migrated.data), profile: validateProfile(migrated.profile),
    checksum: envelope.checksum, migratedFrom: version < SAVE_VERSION ? version : null };
}
export function readSave(storage) {
  for (const key of [SAVE_KEY, BACKUP_KEY]) {
    try { const raw = storage.getItem(key); if (raw) return { ...decodeSave(raw), fromBackup: key === BACKUP_KEY }; } catch { /* Try the independent backup. */ }
  }
  return null;
}
export function writeSave(storage, text) {
  decodeSave(text);
  const old = storage.getItem(SAVE_KEY);
  if (old) { try { decodeSave(old); storage.setItem(BACKUP_KEY, old); } catch (error) { if (['QuotaExceededError', 'SecurityError', 'UnsupportedSaveVersionError'].includes(error.name)) throw error; } }
  else storage.setItem(BACKUP_KEY, text);
  storage.setItem(SAVE_KEY, text);
}
export function clearSave(storage) { storage.removeItem(SAVE_KEY); storage.removeItem(BACKUP_KEY); }

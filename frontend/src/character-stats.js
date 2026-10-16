export const BASE_STATS = Object.freeze({ speed: 10, strength: 10, agility: 10, intelligence: 10, vitality: 10 });
export const STAT_INFO = {
  speed: ['Speed', 'Viteză de mișcare · +3% pe punct'],
  strength: ['Strength', 'Damage fizic · +5% pe punct'],
  agility: ['Agility', 'Viteză de atac · +4% pe punct'],
  intelligence: ['Intelligence', 'Puterea abilităților · +6% pe punct'],
  vitality: ['Vitality', 'Viață maximă · +3 HP pe punct'],
};
const round = (value) => Math.round(value * 100) / 100;
export function initializeStats(scene) {
  scene.characterStats ||= { ...BASE_STATS };
  scene.statPoints ??= 0;
}
export function effectiveStats(scene) {
  const values = { ...BASE_STATS, ...scene.characterStats };
  const items = new Set([scene.equippedHelmet, scene.equippedBoots, scene.equippedShield, scene.equippedArmor, ...Object.values(scene.equipment || {})]);
  for (const item of items) {
    for (const [key, amount] of Object.entries(item?.statBonuses || {})) {
      if (key in values && Number.isFinite(amount)) values[key] += amount;
    }
  }
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Math.max(1, Number.isFinite(value) ? value : BASE_STATS[key])]));
}
export function derivedStats(scene) {
  const values = effectiveStats(scene);
  const movement = Math.max(0.25, 1 + (values.speed - 10) * 0.03);
  const damage = Math.max(0.1, 1 + (values.strength - 10) * 0.05);
  const attackRate = Math.max(0.25, 1 + (values.agility - 10) * 0.04);
  const spellPower = Math.max(0.1, 1 + (values.intelligence - 10) * 0.06);
  return { values, movement, damage, spellPower, attackMs: Math.max(60, Math.min(640, 160 / attackRate)), maxHealth: Math.max(3, 30 + (values.vitality - 10) * 3),
    walkSpeed: round(180 * movement * (scene.equippedBoots ? 1.25 : 1)), rushBonus: round(0.6 * spellPower),
  };
}
export function physicalDamage(scene, base) { return round(base * derivedStats(scene).damage); }
export function spellDamage(scene, base) { return round(base * derivedStats(scene).spellPower); }
export function syncCharacterStats(scene) {
  initializeStats(scene);
  scene.maxPlayerHealth = derivedStats(scene).maxHealth;
  if (Number.isFinite(scene.playerHealth)) scene.playerHealth = Math.min(scene.playerHealth, scene.maxPlayerHealth);
  scene.refreshStatsUi?.();
}
export function grantStatPoints(scene, count) {
  if (!Number.isSafeInteger(count) || count <= 0) return false;
  initializeStats(scene); scene.statPoints += count; return true;
}
export function grantTeteVictoryPoints(scene) {
  if (scene.teteStatPointsGranted) return false;
  grantStatPoints(scene, 3);
  scene.teteStatPointsGranted = true;
  return true;
}
export function spendStatPoint(scene, stat) {
  initializeStats(scene);
  if (!(stat in BASE_STATS) || scene.statPoints < 1) return false;
  scene.statPoints -= 1; scene.characterStats[stat] += 1; syncCharacterStats(scene); return true;
}

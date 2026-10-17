import { consumeOne } from './consumables.js';

export const BOBITA_MAX_HP = 25;
export const BOBITA_HEAL = 2;
export const BOBITA_HEAL_COOLDOWN = 5000;
export function grantBobitaRewards(farm) {
  if (farm.mountainRescue?.status !== 'thawed') return false;
  const rewards = farm.mountainRescue.rewards ||= { book: false, necklace: false };
  let changed = false;
  for (const [key, type, label, extra] of [
    ['book', 'bobita-book', 'Cartea lui Bobiță · Click sau E pentru a deschide', {}],
    ['necklace', 'gold-necklace', 'Colier de aur · +4 Strength · +6 Vitality · Click pentru echipare', { statBonuses: { strength: 4, vitality: 6 } }],
  ]) {
    if (rewards[key]) continue;
    const slot = farm.inventory.findIndex(({ type }) => type === 'empty');
    if (slot < 0) continue;
    farm.inventory[slot] = { type, label, key: String(slot + 1), ...extra }; rewards[key] = true; changed = true;
  }
  if (!farm.bobitaUnlocked) {
    farm.bobitaUnlocked = true; farm.partyBobitaHealth = BOBITA_MAX_HP; farm.partyBobitaSleeping = false; changed = true;
  }
  if (changed) { farm.updateInventoryList(); farm.updateHotbarState(); }
  return changed;
}
export function consumeBobitaMedallion(farm, item) {
  const slot = farm.inventory.indexOf(item);
  if (!farm.bobitaUnlocked || slot < 0 || item?.type !== 'gold-medallion' || farm.partyBobitaHealth >= BOBITA_MAX_HP) return false;
  if (!consumeOne(farm, slot, 'gold-medallion')) return false;
  farm.partyBobitaHealth = Math.min(BOBITA_MAX_HP, (farm.partyBobitaHealth || 0) + 3);
  const remaining = farm.inventory[slot];
  if (remaining.type === 'gold-medallion') remaining.label = `Medalioane de aur ×${remaining.quantity} · +3 HP pentru Bobiță`;
  if (farm.luisQuest?.status === 'active') farm.luisQuest.count = Math.min(3, farm.inventory.filter(i => i.type === 'gold-medallion').reduce((n, i) => n + i.quantity, 0));
  farm.refreshBobitaHud?.(); farm.updateInventoryList(); farm.updateHotbarState(); farm.saveProgress?.(); return true;
}
export function damageBobita(farm, amount) {
  if (!farm.bobitaUnlocked || farm.partyBobitaSleeping || farm.partyBobitaHealth <= 0 || amount <= 0) return false;
  farm.partyBobitaHealth = Math.max(0, farm.partyBobitaHealth - amount);
  if (!farm.partyBobitaHealth) farm.partyBobitaSleeping = true;
  farm.refreshBobitaHud?.(); return true;
}
export function healTeam(farm, scene) {
  if (!farm.bobitaUnlocked || farm.partyBobitaSleeping || farm.partyBobitaHealth <= 0) return [];
  const healed = [], origin = scene.partyBobita;
  const heal = (target, healthKey, max) => {
    if (!target?.active || farm[healthKey] <= 0 || farm[healthKey] >= max || Math.hypot(target.x - origin.x, target.y - origin.y) > 240) return;
    const amount = Math.min(BOBITA_HEAL, max - farm[healthKey]); farm[healthKey] += amount; healed.push({ target, amount });
  };
  heal(scene.player, 'playerHealth', farm.maxPlayerHealth);
  if (!farm.partyTeteSleeping) heal(scene.partyTete, 'partyTeteHealth', 25);
  heal(origin, 'partyBobitaHealth', BOBITA_MAX_HP);
  return healed;
}

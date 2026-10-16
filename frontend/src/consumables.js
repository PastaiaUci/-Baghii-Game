export const CONSUMABLES = {
  'health-potion': { type: 'health-potion', name: 'Poțiune de viață', price: 20, stat: '+10 HP pentru Gdolf', description: 'Reface 10 puncte de viață, fără să depășească viața maximă.', details: ['Click în inventar sau selectează în hotbar și folosește cu click.', 'Nu se consumă dacă ai viața plină.', 'Stackabilă · Stoc nelimitat.'], icon: 'health-potion-icon' },
  'revival-beer': { type: 'revival-beer', name: 'Bere pentru Tete', price: 10, stat: '+3 HP pentru Tete · Poate învia', description: 'Tete bea o bere și recuperează 3 HP. Dacă are 0 HP, îl învie cu 3 HP; apoi îl poți chema din inventar.', details: ['Click în inventar sau folosește din hotbar.', 'Nu se consumă dacă Tete are 25/25 HP.', 'Stackabilă · Stoc nelimitat.'], icon: 'revival-beer-icon' },
};
export function addConsumable(scene, type, count = 1) {
  const product = CONSUMABLES[type];
  if (!product || !Number.isSafeInteger(count) || count <= 0) return false;
  let item = scene.inventory.find((item) => item.type === type);
  if (item && !Number.isSafeInteger((item.quantity ?? 1) + count)) return false;
  if (!item) {
    const slot = scene.inventory.findIndex(({ type }) => type === 'empty');
    if (slot < 0) return false;
    item = { type, label: `${product.name} · ${product.stat} · Click pentru a folosi`, quantity: 0, key: String(slot + 1) };
    scene.inventory[slot] = item;
  }
  item.quantity = (item.quantity ?? 1) + count;
  return true;
}
export function consumeOne(scene, slot, type) {
  const item = scene.inventory[slot];
  if (item?.type !== type) return false;
  const remaining = (item.quantity ?? 1) - 1;
  if (remaining > 0) item.quantity = remaining;
  else scene.inventory[slot] = { type: 'empty', label: `Slot ${slot + 1}`, key: String(slot + 1) };
  return true;
}
export function buyConsumable(scene, type) {
  const product = CONSUMABLES[type];
  if (!product || scene.currentLevel !== 2) return 'Consumabilele sunt disponibile în magazinul din mapa 2.';
  if (scene.gold < product.price) return `Ai nevoie de ${product.price} gold.`;
  if (!addConsumable(scene, type)) return 'Inventarul este plin. Eliberează un slot.';
  scene.gold -= product.price;
  scene.updateGoldHud(); scene.updateInventoryList(); scene.updateHotbarState();
  return `Ai cumpărat ${product.name}.`;
}

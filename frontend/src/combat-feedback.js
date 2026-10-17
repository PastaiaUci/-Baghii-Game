export function showCombatText(owner, target, message, color = '#ffe2a0') {
  const scene = owner.houseActive && owner.activeHouse ? owner.activeHouse : owner;
  if (scene !== owner && target === owner.player) target = scene.player;
  if (scene !== owner && target === owner.partyTete) target = scene.partyTete;
  if (!target || !scene.add?.text || !scene.tweens?.add) return;
  const offset = ((target.combatTextIndex = (target.combatTextIndex || 0) + 1) % 3 - 1) * 9;
  const text = scene.add.text(target.x + offset, target.y - 35, String(message), {
    fontFamily: 'Arial', fontSize: '10px', fontStyle: 'bold', color, stroke: '#20212b', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(70);
  scene.tweens.add({ targets: text, y: target.y - 61, alpha: 0, duration: 650, ease: 'Sine.easeOut', onComplete: () => text.destroy() });
}

export function showDamage(scene, target, amount, color = '#ffe2a0') {
  if (amount > 0) showCombatText(scene, target, `-${Math.round(amount * 100) / 100}`, color);
}

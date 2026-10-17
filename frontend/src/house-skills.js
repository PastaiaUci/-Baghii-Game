import { transferSkillState } from './skill-state.js';
import { activateRush, updateRush } from './rush.js';
import { activateSwordAura, updateSwordAura } from './skills.js';
import { activateDeathBreath, activateFlashlight, updateRewards } from './rewards.js';
import { movementMultiplier } from './gear.js';

export function createHouseSkills(scene) {
  const owner = scene.farm;
  for (const key of ['characterStats', 'equippedHelmet', 'equippedBoots', 'equippedArmor', 'equippedShield', 'equippedNecklace', 'hasDeathBreath', 'introOverlay', 'menuOpen', 'statsOpen', 'bookOpen']) {
    Object.defineProperty(scene, key, { configurable: true, get: () => owner[key] });
  }
  Object.defineProperty(scene, 'gameOver', { configurable: true, get: () => scene.dead });
  for (const key of ['rushButton', 'rushStatus', 'swordAuraButton', 'swordAuraStatus', 'deathBreathButton', 'deathBreathStatus', 'flashlightButton', 'flashlightStatus']) scene[key] = owner[key];
  transferSkillState(owner, scene, owner.time.now, scene.time.now);
  scene.rushAura = scene.add.graphics().setVisible(false);
  scene.swordAura = scene.add.graphics().setVisible(false);
  scene.rewardAura = scene.add.graphics().setVisible(false);
  scene.flashlightHeld = scene.add.image(0, 0, 'flashlight-item').setScale(0.7).setVisible(false);
}

export function activateHouseSkill(scene, key) {
  if (scene.blocked()) return false;
  if (key === 'q') return activateRush(scene);
  if (key === 'f') return activateSwordAura(scene);
  if (key === 'r') return activateDeathBreath(scene);
  if (key === 'flashlight') return activateFlashlight(scene);
  return false;
}

export function updateHouseSkills(scene) {
  const speed = updateRush(scene) * movementMultiplier(scene);
  updateSwordAura(scene); updateRewards(scene);
  return speed;
}

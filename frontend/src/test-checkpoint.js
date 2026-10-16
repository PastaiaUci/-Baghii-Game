import { showNpcDialogue, hideNpcDialogue } from './dialogue.js';
import { clearBossAttacks, updatePlayerHealth } from './boss.js';
import { joinParty, giveVictoryBook } from './completion.js';
import { grantBossReward } from './rewards.js';
import { createChapterPortal, enterLevelTwo } from './chapter-two.js';
import { grantTeteVictoryPoints } from './character-stats.js';

export function prepareLevelTwoTestState(scene, reward) {
  if (!['beer', 'sperma'].includes(reward)) return false;
  scene.testCheckpointUsed = true;
  grantTeteVictoryPoints(scene);
  scene.hasCoupon = true; scene.abgPicked = true; scene.missionKillVillagers = true;
  scene.villageEnraged = false; scene.gameOver = false;
  scene.gold = 1000;
  scene.playerHealth = scene.maxPlayerHealth;
  scene.inventory = Array.from({ length: 27 }, (_, index) => ({ type: 'empty', label: `Slot ${index + 1}`, key: String(index + 1) }));
  scene.inventory[0] = { type: 'sword', label: 'Sword', key: '1' };
  scene.inventory[1] = { type: 'coupon', label: 'Cupon', key: '2' };
  scene.inventory[2] = { type: 'health-potion', label: 'Poțiune de viață · +10 HP', key: '3' };
  scene.equippedHelmet = { type: 'helmet', label: 'Cască de fier · 5 armură', armorRemaining: 5 };
  scene.shopHelmetSold = true;
  scene.bossLootState = { consumed: reward };
  scene.tavernQuest = { status: 'completed', step: 0, correct: 0 };
  return true;
}

export function startLevelTwoTest(scene, reward) {
  if (scene.testCheckpointUsed || scene.currentLevel === 2 || !['beer', 'sperma'].includes(reward)) return false;
  hideNpcDialogue(scene);
  prepareLevelTwoTestState(scene, reward);
  // Reuse the real boss/party/map setup so testing follows production transitions.
  scene.enterBossRoom();
  hideNpcDialogue(scene);
  clearBossAttacks(scene, true);
  scene.bossFightActive = false; scene.bossDefeated = true; scene.bossHealth = 0;
  scene.npcs.forEach((villager) => { villager.alive = false; villager.health = 0; villager.npc.disableBody(true, true); });
  scene.goldPickups.forEach((pickup) => { pickup.collected = true; });
  scene.villagerArrows?.clear(true, true);
  joinParty(scene, scene.boss); scene.boss = null;
  giveVictoryBook(scene);
  grantBossReward(scene, reward);
  createChapterPortal(scene);
  enterLevelTwo(scene);
  scene.selectWeapon('slot-1');
  scene.updateGoldHud(); scene.updateInventoryList(); scene.updateHotbarState();
  updatePlayerHealth(scene);
  scene.updatePlayerHeadHealth();
  return true;
}

export function createTestCheckpointNpc(scene) {
  const key = 'test-checkpoint-npc';
  scene.createNpcTexture(key, 0xe4d7b9, 0x7259a8, 0xe4b48e, 0xa8e6dc);
  const npc = scene.add.image(340, 260, key).setDepth(15);
  const label = scene.add.text(340, 224, 'TEST · Nivelul 2', { fontFamily: 'Arial', fontSize: '10px', color: '#ceb9ff', stroke: '#292039', strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
  scene.worldObjects.push(npc, label);
  scene.testCheckpointNpc = npc;
}

export function clickTestCheckpoint(scene, point) {
  const npc = scene.testCheckpointNpc;
  if (!npc?.visible || scene.testCheckpointUsed || scene.currentLevel === 2 || Math.abs(point.x - npc.x) > 23 || point.y < npc.y - 45 || point.y > npc.y + 22) return false;
  showNpcDialogue(scene, 'Tester · Checkpoint Nivelul 2', 'Doar pentru testare: sari direct în Austria cu Tete învins și în party (25 HP), sabie, cupon, carte, poțiune, cască echipată și 1000 gold pentru testarea magazinului. Progresul curent este înlocuit. Alege recompensa lui Tete sau apasă Continuă ca să joci normal.');
  const actions = document.createElement('div'); actions.className = 'test-checkpoint-actions';
  for (const [reward, text] of [['beer', 'Testează cu Bere · Death Breath'], ['sperma', 'Testează cu Sperma · Flashlight']]) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = text;
    button.addEventListener('click', () => { actions.remove(); startLevelTwoTest(scene, reward); });
    actions.appendChild(button);
  }
  scene.dialogOkButton.before(actions);
  scene.dialogOkButton.addEventListener('click', () => actions.remove(), { once: true });
  return true;
}

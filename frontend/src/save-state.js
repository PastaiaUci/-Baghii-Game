import { syncCharacterStats } from './character-stats.js';
import { syncAudioVolume } from './audio.js';
import { hideNpcDialogue } from './dialogue.js';
import { clearBossAttacks, updatePlayerHealth } from './boss.js';
import { joinParty } from './completion.js';
import { storePartyTete, updatePartyHud } from './party-storage.js';
import { grantBossReward } from './rewards.js';
import { createChapterPortal, enterLevelTwo } from './chapter-two.js';
import { dropBossLoot } from './boss-loot.js';
import { revealBobitaTrail, updateLuisQuestHint } from './luis-quest.js';
import { winterHint } from './winter-quest.js';
import { showRescuedBobita } from './mountain-rescue.js';
import { dropMedallion } from './metin-stones.js';
import { dropRevivalBeer } from './party-health.js';
import { potionCooldownRemaining } from './consumable-cooldown.js';

export function captureProgress(scene) {
  const active = scene.houseActive && scene.activeHouse ? scene.activeHouse : scene;
  const now = active.time.now;
  const left = (time) => Math.max(0, (time || 0) - now);
  const position = (drop) => ({ x: drop.sprite.x, y: drop.sprite.y });
  const place = scene.currentLevel === 2 ? 'alpine' : scene.bossRoomActive || scene.abgPicked ? 'boss' : 'village';
  const flags = Object.fromEntries(['hasCoupon', 'missionKillVillagers', 'abgPicked', 'bossDefeated', 'teteStatPointsGranted', 'testCheckpointUsed', 'shopHelmetSold', 'metEmperorLuis'].map((key) => [key, Boolean(scene[key])]));
  flags.lost = place === 'village' && !scene.hasCoupon && scene.gold < 100 && scene.goldPickups.length > 0 && scene.goldPickups.every((p) => p.collected);
  return {
    place, gold: scene.gold, level: scene.characterLevel || 1, xp: scene.characterXp || 0, points: scene.statPoints || 0,
    stats: { ...scene.characterStats }, health: scene.playerHealth, inventory: scene.inventory,
    equipment: { helmet: scene.equippedHelmet || null, boots: scene.equippedBoots || null, shield: scene.equippedShield || null, armor: scene.equippedArmor || null, necklace: scene.equippedNecklace || null },
    selected: scene.selectedWeapon, flags, reward: scene.bossLootState?.consumed || null,
    party: scene.partyTete ? { health: scene.partyTeteHealth, sleeping: scene.partyTeteSleeping } : null,
    bobita: scene.bobitaUnlocked ? { health: scene.partyBobitaHealth, sleeping: scene.partyBobitaSleeping, healRemaining: scene.bobitaHealRemaining ?? 5000 } : null,
    villagers: scene.npcs.map((v) => v.alive), tavern: scene.tavernQuest || null, luis: scene.luisQuest || null, winter: scene.winterQuest || null, mountainRescue: scene.mountainRescue || null,
    coins: scene.goldPickups.filter((p) => place !== 'alpine' || !p.collected).map((p) => ({ ...(p.savePosition || position(p)), value: p.value, collected: p.collected })),
    medallions: (scene.luisMedallions || []).filter((p) => !p.collected).map(position),
    beerDrops: (scene.partyBeerDrops || []).map(position),
    stones: (scene.metinStones || []).filter((s) => s.broken).map((s) => ({ index: s.index, remaining: Math.max(1000, s.respawn) })),
    cooldowns: { rush: left(active.rushSkill?.readyAt), aura: left(active.swordAuraSkill?.readyAt), breath: left(active.deathBreath?.readyAt), flashlight: left(active.flashlightReadyAt), potion: potionCooldownRemaining(scene) },
    bootsSold: Boolean(scene.shopGearSold?.['wind-boots']), audioEnabled: scene.audioEnabled, audioVolume: scene.audioVolume,
  };
}

export function restoreProgress(scene, data) {
  scene.restoringSave = true;
  scene.inventory = structuredClone(data.inventory);
  scene.gold = data.gold; scene.characterLevel = data.level; scene.characterXp = data.xp; scene.statPoints = data.points;
  scene.characterStats = { ...data.stats }; Object.assign(scene, data.flags); scene.missionKillVillagers = scene.hasCoupon;
  for (const [slot, value] of Object.entries(data.equipment)) scene[`equipped${slot[0].toUpperCase()}${slot.slice(1)}`] = value ? structuredClone(value) : null;
  scene.shopGearSold = { 'wind-boots': data.bootsSold };
  scene.tavernQuest = data.tavern ? structuredClone(data.tavern) : undefined;
  scene.luisQuest = data.luis ? { ...data.luis } : undefined;
  scene.winterQuest = data.winter ? structuredClone(data.winter) : undefined;
  scene.mountainRescue = data.mountainRescue ? structuredClone(data.mountainRescue) : undefined;
  scene.bobitaUnlocked = Boolean(data.bobita);
  scene.partyBobitaHealth = data.bobita?.health ?? 25; scene.partyBobitaSleeping = data.bobita?.sleeping ?? false; scene.bobitaHealRemaining = data.bobita?.healRemaining ?? 5000;
  syncCharacterStats(scene);
  scene.npcs.forEach((v, index) => {
    if (!data.villagers[index]) {
      v.alive = false; v.health = 0; v.xpAwarded = true;
      v.npc.disableBody(true, true); v.weapon.setVisible(false); v.label.setVisible(false); v.marker.setVisible(false);
    }
  });
  if (scene.inventory.some((item) => item.type === 'sword')) scene.pickupItems.forEach((p) => {
    if (p.id === 'sword' && !p.picked) { p.picked = true; p.sprite.destroy(); p.glow?.destroy(); }
  });
  // Reuse the real world builders without granting victory rewards again.
  scene.bossDefeated = false;
  if (data.place !== 'village') {
    scene.enterBossRoom(); hideNpcDialogue(scene);
    if (data.flags.bossDefeated) {
      clearBossAttacks(scene, true); scene.bossFightActive = false; scene.bossDefeated = true; scene.bossHealth = 0;
      joinParty(scene, scene.boss); scene.boss = null;
      if (data.reward) {
        scene.bossLootState = { consumed: data.reward }; grantBossReward(scene, data.reward, true);
        createChapterPortal(scene); if (data.place === 'alpine') enterLevelTwo(scene);
      } else dropBossLoot(scene, 800, 550);
      scene.partyTeteHealth = data.party?.health ?? 25;
      if (data.party?.sleeping || scene.partyTeteHealth <= 0) storePartyTete(scene);
      updatePartyHud(scene);
    }
  } else if (scene.hasCoupon) {
    if (scene.npcs.every((v) => !v.alive)) scene.spawnABGNpc(); else scene.showVillagerObjective();
  }
  scene.goldPickups.forEach(({ sprite }) => { scene.tweens.killTweensOf(sprite); sprite.destroy(); });
  scene.goldPickups = data.coins.map((p) => ({
    sprite: scene.add.sprite(p.x, p.y, 'gold-coin').setDepth(18).setVisible(!p.collected && !scene.bossRoomActive),
    value: p.value, collected: p.collected, level: data.place === 'alpine' ? 2 : 1,
  }));
  if (data.place === 'alpine') {
    for (const state of data.stones) {
      const stone = scene.metinStones[state.index];
      stone.broken = true; stone.xpAwarded = true; stone.health = 0; stone.respawn = state.remaining;
      stone.sprite.setVisible(false); stone.label.setVisible(false); stone.aura.clear(); stone.body.body.enable = false;
    }
    data.medallions.forEach((p) => dropMedallion(scene, { x: p.x, y: p.y + 7 }));
    data.beerDrops.forEach((p) => dropRevivalBeer(scene, p.x, p.y));
    if (scene.luisQuest?.status === 'completed') revealBobitaTrail(scene); else updateLuisQuestHint(scene);
    winterHint(scene);
    showRescuedBobita(scene);
  }
  scene.playerHealth = data.place === 'boss' && !scene.bossDefeated || data.health <= 0 ? scene.maxPlayerHealth : Math.min(data.health, scene.maxPlayerHealth);
  for (const [key, value] of Object.entries({ rushSkill: data.cooldowns.rush, swordAuraSkill: data.cooldowns.aura, deathBreath: data.cooldowns.breath })) scene[key].readyAt = value ? scene.time.now + value : 0;
  scene.flashlightReadyAt = data.cooldowns.flashlight ? scene.time.now + data.cooldowns.flashlight : 0;
  scene.potionReadyAt = data.cooldowns.potion ? scene.game.loop.now + data.cooldowns.potion : 0;
  scene.selectedWeapon = data.selected; scene.audioVolume = data.audioVolume; scene.audioEnabled = data.audioEnabled; syncAudioVolume(scene);
  scene.updateGoldHud(); scene.updateInventoryList(); scene.updateHotbarState(); scene.refreshXpUi();
  updatePlayerHealth(scene); scene.updatePlayerHeadHealth(); scene.restoringSave = false;
}

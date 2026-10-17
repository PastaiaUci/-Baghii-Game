import { rescueHint } from './mountain-rescue.js';
import { collectFirewood, SLEIGH } from './firewood-quest.js';

export const MATEI_DOOR = { x: 370, y: 478 };
export function pickupVillageBobita(farm) {
  if (farm.mountainRescue?.status !== 'rescued' || Math.hypot(farm.player.x - 960, farm.player.y - 600) > 85) return false;
  farm.mountainRescue.status = 'transporting'; rescueHint(farm); farm.saveProgress?.(); return true;
}
export function enterMateiHouse(farm) {
  if (farm.currentLevel !== 2 || farm.tavernActive || farm.npcDialogueOpen || farm.bookOpen || farm.menuOpen || farm.statsOpen || farm.gameOver || farm.chapterDialogueOpen || farm.levelTransitioning || !farm.inventoryUi.classList.contains('hidden')) return false;
  if (Math.hypot(farm.player.x - MATEI_DOOR.x, farm.player.y - MATEI_DOOR.y) > 78) return false;
  if (!['transporting', 'delivered', 'thawed'].includes(farm.mountainRescue?.status)) return false;
  if (farm.mountainRescue.status === 'transporting') farm.mountainRescue.status = 'delivered';
  farm.player.setVelocity(0, 0); farm.partyTete?.setVelocity(0, 0);
  farm.houseActive = farm.tavernActive = true;
  farm.scene.launch('MateiHouseScene', { farm }); farm.scene.pause(); rescueHint(farm); return true;
}
export function interactMateiQuest(farm) {
  if (farm.currentLevel !== 2 || farm.npcDialogueOpen || farm.tavernActive) return false;
  return collectFirewood(farm) || pickupVillageBobita(farm) || enterMateiHouse(farm);
}
export function clickMateiQuest(farm, point) {
  if (farm.mountainRescue?.firewood?.stage === 'chopped' && Math.hypot(point.x - SLEIGH.x, point.y - SLEIGH.y) < 45) return collectFirewood(farm);
  if (farm.mountainRescue?.status === 'rescued' && Math.hypot(point.x - 960, point.y - 600) < 45) return pickupVillageBobita(farm);
  if (Math.abs(point.x - MATEI_DOOR.x) < 28 && Math.abs(point.y - MATEI_DOOR.y) < 38) return enterMateiHouse(farm);
  return false;
}

import { drawBobita } from './bobita-art.js';
export const SUMMIT_STONES = 18;
export function mountainPath(y) {
  return y < 850 ? { center: 600, half: 490 } : { center: 600 + Math.sin((y - 850) / 420) * 190, half: 225 };
}
export function startRescue(farm, random = Math.random) {
  return farm.mountainRescue ||= { status: 'searching', target: 5 + Math.floor(random() * (SUMMIT_STONES - 5)), broken: [], calls: 0 };
}
export function breakRescueStone(quest, index) {
  if (quest.status !== 'searching' || quest.broken.includes(index)) return false;
  quest.broken.push(index);
  if (index !== quest.target) return false;
  quest.status = 'found'; return true;
}
export function enterMountains(farm) {
  if (farm.mountainActive || farm.equippedArmor?.type !== 'winter-coat' || farm.luisQuest?.status !== 'completed') return false;
  startRescue(farm);
  farm.player.setVelocity(0, 0); farm.partyTete?.setVelocity(0, 0);
  farm.mountainActive = farm.houseActive = farm.tavernActive = true;
  farm.scene.launch('MountainScene', { farm }); farm.scene.pause(); return true;
}
export function rescueHint(farm) {
  const status = farm.mountainRescue?.status;
  const text = { searching: ['Pe urmele lui Bobiță', 'Urcă prin munți. Sparge pietrele de pe platoul înghețat.'], found: ['Bobiță este înghețat!', 'Apropie-te de blocul de gheață și apasă E pentru a-l lua.'], carrying: ['Înapoi în sat', 'Îl cari pe Bobiță. Coboară la portalul de la poalele muntelui.'], rescued: ['Bobiță a ajuns în sat', 'L-ai adus pe Bobiță înghețat lângă Luis. Trebuie să găsiți o cale să-l dezghețați.'] };
  if (text[status]) farm.setQuest(...text[status]);
  const matei = { rescued: ['Casa lui F0ngel', 'Ridică-l pe Bobiță de lângă Luis cu E / click. Du-l la casa lui F0ngel, în nord-vestul satului.'], transporting: ['La căldură, la F0ngel', 'Îl cari pe Bobiță. Intră cu E / click în casa lui F0ngel din nord-vest.'], delivered: ['Dezghețarea lui Bobiță', 'Bobiță este lângă șemineu. Intră în casa lui F0ngel și vorbește cu el.'], thawed: ['Bobiță în party', 'Bobiță s-a alăturat echipei. Ai primit cartea și colierul de aur.'] };
  if (matei[status]) farm.setQuest(...matei[status]);
  if (status === 'thawed' && farm.mountainRescue.rewards && (!farm.mountainRescue.rewards.book || !farm.mountainRescue.rewards.necklace)) farm.setQuest('Recompensele lui Bobiță', 'Eliberează loc în inventar pentru carte și colier. Recompensele te așteaptă.');
  const wood = farm.mountainRescue?.firewood;
  if (status === 'delivered' && wood) {
    const steps = { needed: ['Lemne pentru F0ngel', 'Sparge cu sabia sania lui Moș Crăciun, în vestul satului.'], chopped: ['Ridică lemnele', 'Ai spart sania. Ia lemnele cu E / click.'], collected: ['Înapoi la F0ngel', 'Du cele 3 lemne în casa lui F0ngel și vorbește cu el.'], burning: ['Foc pentru Bobiță', 'Focul este aprins. Așteaptă lângă șemineu să se dezghețe Bobiță.'] };
    if (steps[wood.stage]) farm.setQuest(...steps[wood.stage]);
  }
}
export function drawFrozenBobita(scene, x, y) {
  return drawBobita(scene, x, y, true);
}

export function showRescuedBobita(farm) {
  if (!['rescued', 'transporting'].includes(farm.mountainRescue?.status) || farm.frozenBobita) return;
  farm.frozenBobita = drawFrozenBobita(farm, 960, 600);
  const label = farm.add.text(960, 635, 'Bobiță · E / click pentru a-l ridica', { fontSize: '10px', color: '#e2f8ff', stroke: '#24384c', strokeThickness: 3 }).setOrigin(0.5).setDepth(51);
  const update = () => {
    const status = farm.mountainRescue?.status, carrying = status === 'transporting';
    farm.frozenBobita.setVisible(['rescued', 'transporting'].includes(status) && !farm.tavernActive);
    label.setVisible(status === 'rescued' && !farm.tavernActive);
    if (carrying) farm.frozenBobita.setPosition(farm.player.x, farm.player.y - 43).setScale(0.8).setDepth(farm.player.depth + 1);
  };
  farm.events.on('postupdate', update); update(); farm.events.once('shutdown', () => farm.events.off('postupdate', update));
  rescueHint(farm);
}

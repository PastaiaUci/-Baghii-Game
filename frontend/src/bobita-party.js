import { drawBobita } from './bobita-art.js';
import { BOBITA_MAX_HP, BOBITA_HEAL_COOLDOWN, grantBobitaRewards, healTeam } from './bobita-rewards.js';
import { findPartyPath } from './completion.js';
import { updatePartyHud } from './party-storage.js';
import { updatePlayerHealth } from './boss.js';
import { showCombatText } from './combat-feedback.js';
import { rescueHint } from './mountain-rescue.js';

function spawnPoint(scene) {
  const bounds = scene.physics.world.bounds;
  const obstacles = (scene.solids || scene.level2Solids || scene.arenaSolids)?.getChildren().map(o => o.body).filter(b => b && b.enable !== false) || [];
  for (const radius of [50, 75, 100]) for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6, x = scene.player.x + Math.cos(angle) * radius, y = scene.player.y + Math.sin(angle) * radius;
    if (x < bounds.x + 20 || x > bounds.right - 20 || y < bounds.y + 25 || y > bounds.bottom - 30) continue;
    if (!obstacles.some(b => x > b.left - 16 && x < b.right + 16 && y > b.top - 25 && y < b.bottom + 16)) return { x, y };
  }
  return { x: scene.player.x, y: scene.player.y };
}

export function installBobitaParty(farm) {
  let hud = null, actorScene = null;
  const actors = new Map();
  const refresh = () => {
    if (!hud) return;
    if (farm.partyHud) hud.style.top = `${farm.partyHud.getBoundingClientRect().bottom + 10}px`;
    hud.querySelector('span').textContent = `${farm.partyBobitaHealth}/${BOBITA_MAX_HP} HP · ${farm.partyBobitaSleeping ? 'La somn' : 'Vindecător'}`;
    hud.querySelector('.party-sleep').textContent = farm.partyBobitaSleeping ? 'Summon' : 'La somn';
    const warning = hud.querySelector('.party-danger');
    warning.hidden = farm.partyBobitaHealth > 8;
    warning.textContent = farm.partyBobitaHealth <= 0 ? 'Dă-i un medalion pentru a-l învia!' : 'Viață mică · Dă-i un medalion!';
    hud.classList.toggle('party-low-health', farm.partyBobitaHealth <= 8);
    hud.classList.toggle('party-sleeping', farm.partyBobitaSleeping);
  };
  farm.refreshBobitaHud = refresh;
  const createHud = () => {
    hud = document.createElement('div'); hud.className = 'party-hud bobita-party-hud'; hud.tabIndex = 0; hud.setAttribute('role', 'group'); hud.setAttribute('aria-label', 'Party Bobiță');
    hud.innerHTML = '<button type="button" class="party-sleep" hidden>La somn</button><button type="button" class="party-portrait" aria-label="Opțiuni Bobiță" aria-expanded="false"><img src="/assets/Bobita/Bobita.png" alt="Bobiță"></button><div><small>PARTY · HEAL</small><strong>Bobiță</strong><span></span><p class="party-danger" role="status" hidden></p><p class="party-feedback" role="status"></p></div>';
    farm.bobitaPartyHud = hud;
    const toggle = () => { const button = hud.querySelector('.party-sleep'); button.hidden = !button.hidden; hud.querySelector('.party-portrait').setAttribute('aria-expanded', String(!button.hidden)); };
    hud.onclick = (event) => {
      event.stopPropagation();
      if (!event.target.closest('.party-sleep')) { toggle(); return; }
      if (farm.menuOpen || farm.statsOpen || farm.journalOpen || farm.bookOpen || farm.npcDialogueOpen || actorScene?.npcDialogueOpen || farm.chapterDialogueOpen || farm.gameOver) return;
      if (farm.partyBobitaSleeping && farm.partyBobitaHealth <= 0) { hud.querySelector('.party-feedback').textContent = 'Folosește un medalion din inventar.'; return; }
      farm.partyBobitaSleeping = !farm.partyBobitaSleeping;
      hud.querySelector('.party-sleep').hidden = true; hud.querySelector('.party-portrait').setAttribute('aria-expanded', 'false'); hud.querySelector('.party-feedback').textContent = ''; refresh(); farm.saveProgress?.();
    };
    hud.onkeydown = (e) => { if (e.target === hud && ['Enter', ' '].includes(e.key)) { e.preventDefault(); toggle(); } };
    document.body.appendChild(hud); refresh();
  };
  const createActor = (scene) => {
    const spawn = spawnPoint(scene);
    const sprite = scene.physics.add.sprite(spawn.x, spawn.y, 'player').setAlpha(0).setCollideWorldBounds(true);
    sprite.body.setSize(20, 12).setOffset(6, 26);
    const solids = scene.solids || scene.level2Solids || scene.arenaSolids;
    if (solids) scene.physics.add.collider(sprite, solids);
    const art = drawBobita(scene, sprite.x, sprite.y);
    const staff = scene.add.graphics(), effect = scene.add.graphics();
    const label = scene.add.text(0, 0, '', { fontSize: '10px', color: '#b9f5d5', stroke: '#233f38', strokeThickness: 3 }).setOrigin(0.5);
    const bar = scene.add.graphics();
    const quip = scene.add.text(0, 0, 'Gustos!', { fontSize: '9px', color: '#d3efae', stroke: '#263f35', strokeThickness: 3 }).setOrigin(0.5).setVisible(false);
    const actor = { sprite, art, staff, effect, label, bar, quip, elapsed: 0, cast: 0, nextPath: 0, path: [], healed: [] };
    actors.set(scene, actor); scene.partyBobita = sprite;
    scene.events.once('shutdown', () => { actors.delete(scene); scene.partyBobita = null; });
    return actor;
  };
  const update = () => {
    if (farm.restoringSave || !farm.introOverlay.classList.contains('hidden')) return;
    if (grantBobitaRewards(farm)) { rescueHint(farm); farm.saveProgress?.(); }
    if (!farm.bobitaUnlocked) return;
    if (!hud) createHud();
    const scene = farm.activeHouse || (farm.scene.isActive('TavernScene') ? farm.scene.get('TavernScene') : farm);
    if (!scene?.player) return;
    actorScene = scene;
    scene.npcPortraits ||= {}; scene.npcPortraits['Bobiță'] = '/assets/Bobita/Bobita.png';
    if (scene.sys.settings.key === 'MateiHouseScene') { scene.bobita?.setVisible(false); scene.bobitaLabel?.setVisible(false); }
    const a = actors.get(scene) || createActor(scene), visible = !farm.partyBobitaSleeping && farm.partyBobitaHealth > 0;
    for (const [other, actor] of actors) {
      const show = other === scene && visible;
      for (const key of ['art', 'staff', 'effect', 'label', 'bar']) actor[key].setVisible(show);
      if (!show) actor.quip.setVisible(false);
      if (!show) actor.sprite.disableBody(true, true);
    }
    refresh();
    if (!visible) return;
    if (!a.sprite.active) { const spawn = spawnPoint(scene); a.sprite.enableBody(true, spawn.x, spawn.y, true, true).setAlpha(0); }
    const blocked = !scene.scene.isActive() || scene.npcDialogueOpen || farm.menuOpen || farm.statsOpen || farm.journalOpen || farm.bookOpen || farm.chapterDialogueOpen || farm.gameOver || !farm.inventoryUi.classList.contains('hidden') || scene.dead;
    if (blocked) { a.sprite.setVelocity(0, 0); return; }
    const dt = Math.min(farm.game.loop.delta, 50); a.elapsed += dt;
    const distance = Math.hypot(scene.player.x - a.sprite.x, scene.player.y - a.sprite.y);
    const solids = (scene.solids || scene.level2Solids || scene.arenaSolids)?.getChildren().map(o => o.body).filter(b => b?.enable !== false && b) || [];
    if (distance > 500) { a.sprite.setPosition(scene.player.x, scene.player.y); a.path = []; }
    if (distance > 80) {
      if (a.elapsed >= a.nextPath) { a.nextPath = a.elapsed + 450; a.path = findPartyPath(a.sprite.body.center, scene.player.body.center, scene.physics.world.bounds, solids); }
      while (a.path.length && Math.hypot(a.path[0].x - a.sprite.x, a.path[0].y - a.sprite.y) < 15) a.path.shift();
      const target = a.path[0];
      if (target) { const dx = target.x - a.sprite.x, dy = target.y - a.sprite.y, len = Math.hypot(dx, dy) || 1; a.sprite.setVelocity(dx / len * 200, dy / len * 200); }
      else a.sprite.setVelocity(0, 0);
    } else a.sprite.setVelocity(0, 0);
    farm.bobitaHealRemaining = Math.max(0, (farm.bobitaHealRemaining ?? BOBITA_HEAL_COOLDOWN) - dt);
    if (!farm.bobitaHealRemaining) {
      const healed = healTeam(farm, scene);
      if (healed.length) {
        a.cast = 900; a.healed = healed;
        healed.forEach(({ target, amount }) => showCombatText(scene, target, `+${amount} HP`, '#9effcb'));
        updatePlayerHealth(farm); farm.updatePlayerHeadHealth(); updatePartyHud(farm); refresh();
      }
      farm.bobitaHealRemaining = BOBITA_HEAL_COOLDOWN;
    }
    a.cast = Math.max(0, a.cast - dt);
    const gag = (a.elapsed - 6500) % 14000, puff = a.elapsed >= 6500 && gag < 1300 && !a.cast;
    const lift = a.cast ? Math.sin(a.cast / 900 * Math.PI) * 12 : 0;
    const bob = Math.sin(a.elapsed / (distance > 80 ? 90 : 400)) * (distance > 80 ? 1.2 : 0.4);
    const { x, y } = a.sprite, depth = 10 + (y + 22) / 100;
    a.art.setPosition(x, y + bob).setDepth(depth).setRotation(puff ? Math.sin(gag / 1300 * Math.PI) * 0.06 : 0);
    a.quip.setVisible(puff && gag < 1000).setPosition(x, y - 105).setDepth(depth + 3);
    a.label.setPosition(x, y - 88).setDepth(depth + 1).setText(`Bobiță · ${Math.ceil(farm.partyBobitaHealth)}/25`);
    a.bar.clear().setPosition(x - 18, y - 79).setDepth(depth + 1).fillStyle(0x243a35).fillRect(0, 0, 36, 4).fillStyle(0x8fddb1).fillRect(1, 1, 34 * farm.partyBobitaHealth / 25, 2);
    const staff = a.staff.clear().setPosition(x + 23, y + bob - lift).setDepth(depth + 0.1);
    staff.lineStyle(4, 0x624931).lineBetween(0, 17, 0, -53).lineStyle(1, 0xd2b37b).lineBetween(-1, 15, -1, -52);
    staff.lineStyle(3, 0xe9c46e).strokeEllipse(0, -57, 18, 22);
    staff.fillStyle(a.cast ? 0xa7ffcf : 0x65cba9).fillTriangle(-5, -58, 0, -68, 6, -58).fillTriangle(-5, -58, 6, -58, 0, -49);
    if (a.cast) staff.fillStyle(0x96ffca, 0.2).fillCircle(0, -58, 17 + Math.sin(a.elapsed / 60) * 3);
    const fx = a.effect.clear().setDepth(depth + 2);
    if (a.cast) {
      const p = 1 - a.cast / 900;
      for (const { target } of a.healed) {
        fx.lineStyle(2, 0x9dffcf, (1 - p) * 0.8).strokeEllipse(target.x, target.y + 17, 28 + p * 75, 12 + p * 30);
        const tx = x + 23 + (target.x - x - 23) * p, ty = y - 58 - lift + (target.y - y + 58 + lift) * p - Math.sin(p * Math.PI) * 30;
        fx.fillStyle(0xc9ffe3, 1 - p).fillCircle(tx, ty, 4).fillCircle(tx - 7, ty + 5, 2);
      }
    }
    if (puff) {
      const p = gag / 1300;
      for (let i = 0; i < 5; i++) fx.fillStyle(i % 2 ? 0xb2c879 : 0x83a56c, (1 - p) * 0.2).fillEllipse(x - 12 - p * 35 - i * 5, y + 9 - p * 18 + Math.sin(i * 2) * 5, 9 + p * 19, 7 + p * 12);
    }
  };
  farm.game.events.on('poststep', update);
  farm.events.once('shutdown', () => { farm.game.events.off('poststep', update); hud?.remove(); });
}

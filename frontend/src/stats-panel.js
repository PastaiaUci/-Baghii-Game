import { STAT_INFO, derivedStats, initializeStats, spendStatPoint, physicalDamage } from './character-stats.js';
import { characterName } from './leveling.js';
import { shiftMenuTimers } from './pause-menu.js';
import { drawHelmet } from './armor.js';
import { drawExtraGear } from './gear.js';

export function installStatsPanel(farm) {
  initializeStats(farm);
  const button = document.createElement('button'); button.type = 'button'; button.className = 'stats-toggle';
  button.title = 'Statusurile lui Gdolf'; button.setAttribute('aria-label', 'Deschide statusurile');
  button.innerHTML = '<span class="stats-toggle-symbol">♜</span><span>Statusuri</span>';
  document.body.appendChild(button);
  let overlay = null, paused = null, started = 0, previousFocus = null;
  const close = () => {
    if (!overlay) return;
    overlay.remove(); overlay = null; farm.statsOpen = false;
    shiftMenuTimers(paused, Math.max(0, farm.game.loop.now - started));
    paused.input.keyboard.resetKeys(); paused.scene.resume(); paused = null;
    button.setAttribute('aria-expanded', 'false'); previousFocus?.focus();
  };
  farm.closeStats = close;
  const render = () => {
    const stats = derivedStats(farm);
    overlay.querySelector('.stats-avatar strong').textContent = characterName(farm);
    overlay.querySelector('.stats-points').textContent = `Puncte disponibile: ${farm.statPoints}`;
    overlay.querySelector('.stats-rows').innerHTML = Object.entries(STAT_INFO).map(([id, [name, detail]]) => `<div class="stats-row"><div><strong>${name}</strong><small>${detail}</small></div><span title="Bază ${farm.characterStats[id]} · Bonus echipament ${Math.round((stats.values[id] - farm.characterStats[id]) * 100) / 100}">${stats.values[id]}</span><button type="button" data-stat="${id}" aria-label="Crește ${name}" ${farm.statPoints ? '' : 'disabled'}>+</button></div>`).join('');
    overlay.querySelectorAll('[data-stat]').forEach((control) => control.addEventListener('click', () => { spendStatPoint(farm, control.dataset.stat); render(); }));
    overlay.querySelector('.stats-effects').innerHTML = `<span>Mers <b>${stats.walkSpeed} px/s</b></span><span>Damage sabie <b>${physicalDamage(farm, 1)} · ${physicalDamage(farm, 2)} boss</b></span><span>Atac <b>${Math.round(stats.attackMs)} ms</b></span><span>Abilități <b>×${stats.spellPower.toFixed(2)}</b></span><span>Viață <b>${farm.playerHealth}/${stats.maxHealth} HP</b></span><span>Iureș <b>+${Math.round(stats.rushBonus * 100)}%</b></span>`;
    const canvas = overlay.querySelector('canvas'), ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 160, 200); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(farm.textures.get('player').getSourceImage(), 16, 20, 128, 160);
    if (farm.equippedHelmet) drawHelmet(ctx, 16, 20, 4);
    drawExtraGear(ctx, farm, 16, 20, 4);
  };
  button.addEventListener('click', () => {
    if (overlay) { close(); return; }
    if (farm.journalOpen || farm.menuOpen || farm.bookOpen || farm.gameOver || farm.chapterDialogueOpen || farm.npcDialogueOpen || farm.levelTransitioning || !farm.introOverlay.classList.contains('hidden')) return;
    paused = farm.scene.isActive('MateiHouseScene') ? farm.scene.get('MateiHouseScene') : farm.scene.isActive('MountainScene') ? farm.scene.get('MountainScene') : farm.scene.isActive('MiganHouseScene') ? farm.scene.get('MiganHouseScene') : farm.scene.isActive('TavernScene') ? farm.scene.get('TavernScene') : farm;
    if (paused.npcDialogueOpen) return;
    previousFocus = document.activeElement; started = farm.game.loop.now; farm.statsOpen = true;
    paused.player?.setVelocity(0, 0); paused.input.keyboard.resetKeys(); paused.scene.pause();
    overlay = document.createElement('div'); overlay.className = 'stats-overlay';
    overlay.innerHTML = '<section class="stats-panel" role="dialog" aria-modal="true" aria-labelledby="stats-title"><header><div><small>GDOLF · CARACTER</small><h2 id="stats-title">Statusuri</h2></div><button type="button" class="stats-close" aria-label="Închide statusurile">×</button></header><div class="stats-body"><div class="stats-avatar"><canvas width="160" height="200" aria-label="Gdolf cu echipamentul său"></canvas><strong>Gdolf</strong><p class="stats-points"></p></div><div class="stats-rows"></div></div><div class="stats-effects"></div><p class="stats-note">Valorile includ echipamentul purtat. Punctele câștigate pot fi distribuite cu +.</p></section>';
    document.body.appendChild(overlay); render();
    overlay.querySelector('.stats-close').addEventListener('click', close);
    overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
    overlay.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const controls = [...overlay.querySelectorAll('button:not(:disabled)')];
      const current = controls.indexOf(document.activeElement);
      event.preventDefault(); controls[(current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
    });
    button.setAttribute('aria-expanded', 'true'); overlay.querySelector('.stats-close').focus();
  });
  farm.events.once('shutdown', () => { overlay?.remove(); button.remove(); farm.statsOpen = false; });
}

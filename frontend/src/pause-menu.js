import { setAudioVolume, unlockAudio } from './audio.js';
import { shiftVillageTimers } from './tavern-access.js';

export function shiftMenuTimers(scene, elapsed) {
  const shift = (object, keys) => keys.forEach((key) => { if (object && typeof object[key] === 'number' && object[key] > 0) object[key] += elapsed; });
  shift(scene.rushSkill, ['activeUntil', 'readyAt']);
  shift(scene.swordAuraSkill, ['until', 'readyAt']);
  shift(scene.deathBreath, ['until', 'readyAt', 'nextTick']);
  shift(scene, ['flashlightReadyAt', 'slowVisualUntil', 'nextVillagerDamageAt']);
  scene.npcs?.forEach(({ npc }) => shift(npc, ['slowUntil']));
  shift(scene.boss, ['slowUntil']);
  if (scene.bossFightActive) {
    shift(scene, ['nextBeerAt', 'nextPuddleAt', 'nextPuddleDamageAt']);
    scene.bossPuddles?.forEach((puddle) => { puddle.createdAt += elapsed; });
    scene.bossProjectiles?.getChildren().forEach((beer) => { beer.expiresAt += elapsed; });
  }
  shiftVillageTimers(scene, elapsed);
  // Dialogue has its own time compensation; exclude time already covered by the menu.
  if (scene.npcDialogueOpen) scene.npcDialogueStartedAt += elapsed;
}

export function buildControlsHelp(farm) {
  return `
  <h3>Mișcare și interacțiuni</h3>
  <dl>
    <dt>W A S D</dt><dd>Mișcă-l pe Gdolf.</dd>
    <dt>Click stânga</dt><dd>Atacă folosind sabia echipată. Click direct pe un NPC pentru dialog sau pe un obiect pentru interacțiune.</dd>
    ${farm.equippedShield || farm.inventory?.some(({ type }) => type === 'shield') ? '<dt>Ține click dreapta</dt><dd>Blochează cu scutul echipat. Absoarbe maximum 50 damage în total; la 0 rezistență se sparge și dispare.</dd>' : ''}
    ${farm.equippedBoots || farm.inventory?.some(({ type }) => type === 'wind-boots') ? '<dt>Papuci de Vânt</dt><dd>+25% viteză cât sunt echipați. Click în inventar pentru echipare sau pe slotul de cizme pentru dezechipare.</dd>' : ''}
    <dt>1 – 5</dt><dd>Selectează un obiect din hotbar. Primele 5 sloturi ale inventarului apar în hotbar în aceeași ordine; trage obiectele între sloturi pentru a le organiza.</dd>
    <dt>E</dt><dd>Interacționează în apropiere: Lavinia, dropuri, ușa cârciumii sau portal.</dd>
    <dt>I</dt><dd>Deschide sau închide inventarul.</dd>
    <dt>Esc</dt><dd>Închide cartea sau inventarul dacă sunt deschise. Altfel, deschide/închide meniul.</dd>
  </dl>
  <h3>Abilități</h3>
  <dl>
    <dt>Q · Iureș</dt><dd>+60% viteză timp de 5 secunde. Cooldown: 15 secunde de la activare.</dd>
    <dt>F · Aura Sabiei</dt><dd>Necesită sabia în mână. Timp de 5 secunde: +1 damage la săteni și +2 la boss. Cooldown: 15 secunde.</dd>
    ${farm.hasDeathBreath ? '<dt>R · Death Breath</dt><dd>Dă damage inamicilor din jur timp de 3 secunde. Cooldown: 12 secunde.</dd>' : ''}
    ${farm.inventory?.some(({ type }) => type === 'flashlight') ? '<dt>Flashlight</dt><dd>Selectează itemul și dă click sau folosește butonul său: slow 50% pentru 4 secunde în jurul tău. Cooldown: 10 secunde.</dd>' : ''}
  </dl>
  <h3>Lucruri utile</h3>
  <ul>
    <li>Sabia se ridică automat când te apropii de ea.</li>
    <li>Cupon Keeper cere 100 de bănuți. Sătenii sunt imuni până cumperi cuponul; prima lovitură îi înfurie pe toți.</li>
    <li>Dialogurile se continuă cu butonul „Continuă”. Jocul stă pe loc cât citești.</li>
    <li>Cartea se deschide cu E când este selectată în hotbar sau prin click în inventar. Tastele 1–5 doar selectează obiectul. Schimbă paginile cu butoanele Înapoi/Înainte.</li>
    ${farm.tavernQuest?.status === 'completed' || farm.inventory?.some(({ type }) => type === 'health-potion') ? '<li>Poțiunea de viață reface 10 HP. Click pe ea în inventar sau selecteaz-o în hotbar și dă click în joc. La viață maximă nu se consumă.</li>' : ''}
    <li>La cârciumă: E lângă ușă sau click pe ușă pentru intrare. E lângă ieșire sau „Înapoi în sat” pentru întoarcere.</li>
    <li>După Tete poți consuma doar unul dintre cele două dropuri. Tete intră în party, iar portalul duce în Nivelul 2.</li>
  </ul>`;
}

export function installPauseMenu(farm) {
  let overlay = null, pausedScene = null, startedAt = 0, infoOpen = false, oldFocus = null;
  let lastVolume = farm.audioVolume || 0.7;
  const menuHint = document.createElement('button');
  menuHint.className = 'menu-hint';
  menuHint.type = 'button';
  menuHint.textContent = 'Esc - Menu';
  menuHint.addEventListener('click', () => open());
  document.body.appendChild(menuHint);
  const close = () => {
    if (!overlay) return;
    overlay.remove(); overlay = null;
    shiftMenuTimers(pausedScene, Math.max(0, farm.game.loop.now - startedAt));
    farm.menuOpen = false;
    pausedScene.input.keyboard.resetKeys();
    pausedScene.scene.resume();
    if (oldFocus?.isConnected) oldFocus.focus();
    pausedScene = null;
  };
  const open = () => {
    if (overlay) return;
    pausedScene = farm.scene.isActive('TavernScene') ? farm.scene.get('TavernScene') : farm;
    oldFocus = document.activeElement;
    startedAt = farm.game.loop.now;
    farm.menuOpen = true;
    pausedScene.input.keyboard.resetKeys();
    pausedScene.scene.pause();
    overlay = document.createElement('div');
    overlay.className = 'pause-overlay';
    overlay.innerHTML = `<section class="pause-panel" role="dialog" aria-modal="true" aria-labelledby="pause-title"><header><small>ESC · MENIU</small><h2 id="pause-title">Joc în pauză</h2></header><div class="pause-settings"><label for="game-volume">Volum <output id="volume-value"></output></label><input id="game-volume" type="range" min="0" max="100" step="1"><div class="pause-buttons"><button class="pause-mute">Oprește sunetul</button><button class="pause-info">Info · Controale și abilități</button><button class="pause-resume">Continuă jocul →</button></div></div><div class="pause-help" hidden>${buildControlsHelp(farm)}<button class="pause-back">← Înapoi la meniu</button></div></section>`;
    document.body.appendChild(overlay);
    const slider = overlay.querySelector('#game-volume'), output = overlay.querySelector('#volume-value');
    const mute = overlay.querySelector('.pause-mute');
    const sync = () => {
      const volume = farm.audioEnabled ? farm.audioVolume : 0;
      slider.value = String(Math.round(volume * 100));
      output.textContent = `${slider.value}%`;
      mute.textContent = volume > 0 ? 'Oprește sunetul' : 'Pornește sunetul';
    };
    slider.addEventListener('input', () => {
      setAudioVolume(farm, Number(slider.value) / 100);
      if (farm.audioVolume > 0) { lastVolume = farm.audioVolume; unlockAudio(farm); }
      sync();
    });
    mute.addEventListener('click', () => {
      if (farm.audioEnabled && farm.audioVolume > 0) { lastVolume = farm.audioVolume; setAudioVolume(farm, 0); }
      else { setAudioVolume(farm, lastVolume); unlockAudio(farm); }
      sync();
    });
    const setInfo = (value) => {
      infoOpen = value;
      overlay.querySelector('.pause-settings').hidden = value;
      overlay.querySelector('.pause-help').hidden = !value;
      overlay.querySelector('#pause-title').textContent = value ? 'Controale și abilități' : 'Joc în pauză';
      overlay.querySelector(value ? '.pause-back' : '.pause-info').focus();
    };
    overlay.showInfo = setInfo;
    overlay.querySelector('.pause-info').addEventListener('click', () => setInfo(true));
    overlay.querySelector('.pause-back').addEventListener('click', () => setInfo(false));
    overlay.querySelector('.pause-resume').addEventListener('click', close);
    sync(); infoOpen = false;
    overlay.querySelector('.pause-resume').focus();
  };
  const keydown = (event) => {
    if (event.key === 'Escape') {
      if (!overlay && farm.bookOpen) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (event.repeat) return;
      if (!overlay && farm.inventoryUi && !farm.inventoryUi.classList.contains('hidden')) {
        farm.toggleInventory(false);
        return;
      }
      if (overlay && infoOpen) overlay.showInfo(false);
      else if (overlay) close();
      else open();
    } else if (overlay && event.key === 'Tab') {
      const focusable = [...overlay.querySelectorAll('button, input')].filter((element) => !element.closest('[hidden]'));
      const current = focusable.indexOf(document.activeElement);
      const next = (current + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length;
      event.preventDefault(); focusable[next].focus();
    }
  };
  document.addEventListener('keydown', keydown, true);
  farm.events.once('shutdown', () => { overlay?.remove(); menuHint.remove(); document.removeEventListener('keydown', keydown, true); farm.menuOpen = false; });
}

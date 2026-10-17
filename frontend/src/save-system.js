import { encodeSave, decodeSave, readSave, writeSave, clearSave, nextSaveProfile, SAVE_KEY, BACKUP_KEY } from './save-data.js';
import { captureProgress, restoreProgress } from './save-state.js';
import { unlockAudio } from './audio.js';

const storage = () => window.localStorage;
const hasStoredSave = () => Boolean(storage().getItem(SAVE_KEY) || storage().getItem(BACKUP_KEY));
function exportFile(text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url;
  link.download = `The-Redemption-${new Date().toISOString().slice(0, 10)}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function installSaveControls(parent, scene) {
  const panel = document.createElement('div'); panel.className = 'save-controls';
  panel.innerHTML = '<button type="button" class="save-export">Exportă salvarea</button><button type="button" class="save-import">Importă salvarea</button><input type="file" accept=".json,application/json" class="save-file" hidden><p class="save-feedback" role="status"></p>';
  parent.appendChild(panel);
  const feedback = panel.querySelector('.save-feedback');
  const file = panel.querySelector('input');
  panel.querySelector('.save-export').onclick = () => {
    try {
      let text;
      if (scene.saveEnabled) {
        const persisted = scene.saveProgress();
        text = encodeSave(captureProgress(scene), new Date().toISOString(), persisted ? scene.saveProfile : nextSaveProfile(scene.saveProfile));
      } else {
        const saved = readSave(storage()); if (!saved) throw new Error('Nu există o salvare de exportat.');
        text = encodeSave(saved.data, saved.savedAt, saved.profile);
      }
      exportFile(text); feedback.textContent = 'Salvarea a fost exportată.';
    } catch (error) { feedback.textContent = error.message; }
  };
  panel.querySelector('.save-import').onclick = () => file.click();
  file.onchange = async () => {
    try {
      const selected = file.files[0]; if (!selected) return;
      if (selected.size > 1000000) throw new Error('Fișierul este prea mare pentru o salvare.');
      const imported = decodeSave(await selected.text());
      if ((scene.saveEnabled || hasStoredSave()) && !window.confirm('Înlocuiești progresul curent cu salvarea importată?')) return;
      const enabled = scene.saveEnabled; scene.saveEnabled = false;
      try { writeSave(storage(), encodeSave(imported.data, imported.savedAt, imported.profile)); } catch (error) { scene.saveEnabled = enabled; throw error; }
      if (!enabled && !scene.loadFailed) scene.continueSavedGame();
      else { try { window.sessionStorage.setItem('redemption.resume-once', '1'); } catch { /* Continue is also available on the start menu. */ } window.location.reload(); }
    } catch (error) { feedback.textContent = error.message || 'Salvarea nu a putut fi importată.'; }
    finally { file.value = ''; }
  };
}

export function installSaveSystem(scene) {
  scene.saveEnabled = false;
  const badge = document.createElement('div'); badge.className = 'save-status'; badge.setAttribute('role', 'status'); badge.hidden = true;
  document.body.appendChild(badge);
  let lastSignature = '', lastWrite = 0;
  const signature = (data) => JSON.stringify({ ...data, health: undefined, cooldowns: undefined,
    party: data.party ? { sleeping: data.party.sleeping, dead: data.party.health <= 0 } : null,
    coins: data.coins.map((p) => [p.value, p.collected]), medallions: data.medallions.length, beerDrops: data.beerDrops.length,
    stones: data.stones.map((p) => p.index) });
  scene.saveProgress = () => {
    if (!scene.saveEnabled || scene.restoringSave || scene.levelTransitioning) return false;
    try {
      const data = captureProgress(scene), profile = nextSaveProfile(scene.saveProfile);
      writeSave(storage(), encodeSave(data, new Date().toISOString(), profile)); scene.saveProfile = profile;
      lastSignature = signature(data); lastWrite = scene.game.loop.now;
      badge.hidden = false; badge.textContent = '✓ Salvat local'; badge.classList.remove('save-error'); return true;
    } catch { badge.hidden = false; badge.textContent = 'Salvarea locală nu este disponibilă · Folosește Exportă'; badge.classList.add('save-error'); return false; }
  };
  scene.resetSavedGame = () => { scene.saveEnabled = false; clearSave(storage()); scene.saveProfile = null; };
  const panel = scene.introOverlay.querySelector('.intro-panel');
  const start = panel.querySelector('#start-game-btn'); start.textContent = 'Joc nou';
  const resume = document.createElement('button'); resume.type = 'button'; resume.className = 'save-continue'; resume.textContent = 'Continuă'; start.before(resume);
  const info = document.createElement('p'); info.className = 'save-info'; panel.appendChild(info);
  const refresh = () => {
    const saved = readSave(storage()); resume.disabled = !saved || saved.data.flags.lost;
    info.textContent = saved ? saved.data.flags.lost ? 'Nivel pierdut la barbut. Începe un joc nou.' : `${saved.fromBackup ? 'Copie de rezervă recuperată · ' : ''}Lv. ${saved.data.level} · ${saved.data.place === 'alpine' ? 'Austria' : saved.data.place === 'boss' ? 'Camera lui Tete' : 'Satul Bețivilor'} · ${new Date(saved.savedAt).toLocaleString('ro-RO')}` : hasStoredSave() ? 'Salvarea nu poate fi citită. Poți importa o copie sau începe un joc nou.' : 'Progresul se salvează în acest browser. Poți exporta o copie pentru alt dispozitiv.';
  };
  scene.continueSavedGame = () => {
    if (scene.saveEnabled) return;
    const saved = readSave(storage()); if (!saved || saved.data.flags.lost) { refresh(); return; }
    try {
      restoreProgress(scene, saved.data);
      scene.saveProfile = saved.profile;
      scene.introOverlay.classList.add('hidden'); unlockAudio(scene); scene.saveEnabled = true;
      lastSignature = signature(captureProgress(scene)); lastWrite = scene.game.loop.now;
      badge.hidden = false; badge.textContent = saved.fromBackup ? 'Copie de rezervă încărcată' : 'Progres încărcat';
      if (saved.migratedFrom) scene.saveProgress();
    } catch { scene.saveEnabled = false; scene.loadFailed = true; info.textContent = 'Salvarea nu a putut fi încărcată. Exportă o copie sau începe un joc nou.'; }
  };
  resume.onclick = scene.continueSavedGame;
  start.onclick = () => {
    let exists = false; try { exists = hasStoredSave(); } catch { /* Offline export still works. */ }
    if (exists && !window.confirm('Începi un joc nou? Salvarea curentă și copia ei de rezervă vor fi șterse.')) return;
    try { scene.resetSavedGame(); } catch { /* Starting a game still works without storage. */ }
    if (scene.loadFailed) { window.location.reload(); return; }
    scene.startNewStory(); scene.saveEnabled = true; scene.saveProgress();
  };
  installSaveControls(panel, scene);
  try { refresh(); } catch { info.textContent = 'Stocarea browserului nu este disponibilă. Poți folosi export/import.'; resume.disabled = true; }
  let tickAt = 0;
  const tick = () => {
    const now = scene.game.loop.now;
    if (!scene.saveEnabled || now - tickAt < 1000 || scene.restoringSave || scene.levelTransitioning) return;
    tickAt = now;
    const data = captureProgress(scene);
    const combat = scene.bossFightActive || scene.villageEnraged || (scene.houseActive ? scene.activeHouse.mobs : scene.metinMobs)?.some((mob) => mob.alive);
    if (signature(data) !== lastSignature || !combat && now - lastWrite >= 15000) scene.saveProgress();
  };
  const hide = () => { if (document.visibilityState === 'hidden') scene.saveProgress(); };
  window.addEventListener('pagehide', scene.saveProgress); window.addEventListener('beforeunload', scene.saveProgress);
  document.addEventListener('visibilitychange', hide); scene.game.events.on('poststep', tick);
  scene.events.once('shutdown', () => {
    badge.remove(); scene.game.events.off('poststep', tick); window.removeEventListener('pagehide', scene.saveProgress);
    window.removeEventListener('beforeunload', scene.saveProgress); document.removeEventListener('visibilitychange', hide);
  });
  try {
    if (window.sessionStorage.getItem('redemption.resume-once') === '1') { window.sessionStorage.removeItem('redemption.resume-once'); scene.time.delayedCall(0, scene.continueSavedGame); }
  } catch { /* The explicit Continue button remains available. */ }
}

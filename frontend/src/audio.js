export function createGameAudio(scene) {
  const button = document.createElement('button');
  button.className = 'audio-toggle';
  button.type = 'button';
  button.textContent = 'Sunet: pornit';
  button.title = 'Pornește sau oprește sunetele jocului';
  scene.audioEnabled = true;
  scene.audioVolume = 0.7;
  scene.audioToggleButton = button;
  button.addEventListener('click', () => {
    scene.audioEnabled = !scene.audioEnabled;
    if (scene.audioEnabled && !scene.audioVolume) scene.audioVolume = 0.7;
    syncAudioVolume(scene);
    if (scene.audioEnabled) unlockAudio(scene);
  });
  document.body.appendChild(button);
  syncAudioVolume(scene);
  scene.events.once('shutdown', () => { button.remove(); scene.gameAudio?.close(); });
}

export function syncAudioVolume(scene) {
  const volume = scene.audioEnabled ? scene.audioVolume : 0;
  if (scene.audioMaster) scene.audioMaster.gain.setValueAtTime(volume, scene.gameAudio.currentTime);
  if (scene.audioToggleButton) {
    scene.audioToggleButton.textContent = volume > 0 ? `Sunet: ${Math.round(volume * 100)}%` : 'Sunet: oprit';
    scene.audioToggleButton.setAttribute('aria-pressed', String(volume > 0));
  }
}

export function setAudioVolume(scene, volume) {
  scene.audioVolume = Math.max(0, Math.min(1, Number(volume) || 0));
  scene.audioEnabled = scene.audioVolume > 0;
  syncAudioVolume(scene);
}

export function unlockAudio(scene) {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return;
  try {
    scene.gameAudio ||= new Context();
    if (!scene.audioMaster) {
      scene.audioMaster = scene.gameAudio.createGain();
      scene.audioMaster.connect(scene.gameAudio.destination);
      syncAudioVolume(scene);
    }
    scene.gameAudio.resume().catch(() => {});
  } catch { /* Gameplay remains available without audio support. */ }
}

export function playSound(scene, type) {
  const context = scene.gameAudio;
  if (!scene.audioEnabled || context?.state !== 'running') return;
  const sounds = {
    step: [95, 45, 0.045, 'triangle', 0.025],
    hit: [160, 50, 0.12, 'sawtooth', 0.045],
    swing: [430, 90, 0.10, 'triangle', 0.025],
    arrow: [1100, 280, 0.13, 'triangle', 0.035],
    rage: [180, 350, 0.28, 'sawtooth', 0.04],
    bird: [1700, 2400, 0.16, 'sine', 0.025],
    chicken: [600, 350, 0.13, 'triangle', 0.035],
    sheep: [180, 150, 0.35, 'sawtooth', 0.018],
    cow: [100, 65, 0.5, 'sawtooth', 0.022],
    clink: [1400, 1000, 0.25, 'sine', 0.035],
  };
  const [start, end, duration, wave, volume] = sounds[type] || sounds.hit;
  const oscillator = context.createOscillator(), gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(start, now);
  oscillator.frequency.exponentialRampToValueAtTime(end, now + duration);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain); gain.connect(scene.audioMaster || context.destination);
  oscillator.start(); oscillator.stop(now + duration + 0.02);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}

export function updateGameAudio(scene) {
  if (scene.bookOpen || scene.chapterDialogueOpen || scene.npcDialogueOpen || scene.gameOver) return;
  const now = scene.time.now;
  if (scene.player.body.speed > 20 && now >= (scene.nextStepSound || 0)) {
    scene.nextStepSound = now + 290;
    playSound(scene, 'step');
  }
}

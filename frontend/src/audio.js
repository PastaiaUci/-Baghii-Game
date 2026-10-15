export function createGameAudio(scene) {
  const button = document.createElement('button');
  button.className = 'audio-toggle';
  button.type = 'button';
  button.textContent = 'Sunet: pornit';
  button.title = 'Pornește sau oprește sunetele jocului';
  scene.audioEnabled = true;
  button.addEventListener('click', () => {
    scene.audioEnabled = !scene.audioEnabled;
    button.textContent = scene.audioEnabled ? 'Sunet: pornit' : 'Sunet: oprit';
    button.setAttribute('aria-pressed', String(scene.audioEnabled));
    if (scene.audioEnabled) unlockAudio(scene);
  });
  document.body.appendChild(button);
  scene.events.once('shutdown', () => { button.remove(); scene.gameAudio?.close(); });
}

export function unlockAudio(scene) {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return;
  try {
    scene.gameAudio ||= new Context();
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
  oscillator.connect(gain); gain.connect(context.destination);
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
  if (!scene.bossRoomActive && scene.currentLevel !== 2 && now >= (scene.nextAmbientSound || 0)) {
    scene.nextAmbientSound = now + 2600 + Math.random() * 2400;
    const nearAnimal = scene.animals?.find(({ sprite }) => Math.hypot(sprite.x - scene.player.x, sprite.y - scene.player.y) < 230);
    if (Math.hypot(scene.player.x - 430, scene.player.y - 330) < 240 && Math.random() < 0.5) playSound(scene, 'clink');
    else playSound(scene, nearAnimal?.kind || 'bird');
  }
}

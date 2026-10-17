export function recordReceivedDamage(scene, source, amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  scene.lastReceivedDamage = {
    enemy: source?.enemy || 'Inamic necunoscut', attack: source?.attack || 'Atac necunoscut',
    damage: Math.round(amount * 100) / 100,
  };
}

export function deathSummary(scene) {
  const hit = scene.lastReceivedDamage;
  if (!hit) return 'Cauza înfrângerii nu a putut fi identificată.';
  return `Te-a învins: ${hit.enemy}\nAtac: ${hit.attack}\nUltima lovitură: ${hit.damage} HP pierdut`;
}

export function appendDeathSummary(overlay, scene) {
  const paragraph = overlay.querySelector('p');
  paragraph.textContent = `${paragraph.textContent || ''}\n\n${deathSummary(scene)}`;
  paragraph.style && (paragraph.style.whiteSpace = 'pre-line');
}

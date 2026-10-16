import { createPartyBeer, updatePartyBeer } from './party-beer.js';

export function findPartyPath(start, goal, bounds, obstacles, cell = 20) {
  const cols = Math.floor(bounds.width / cell), rows = Math.floor(bounds.height / cell);
  const index = (p) => [Math.max(0, Math.min(cols - 1, Math.floor((p.x - bounds.x) / cell))), Math.max(0, Math.min(rows - 1, Math.floor((p.y - bounds.y) / cell)))];
  const point = (x, y) => ({ x: bounds.x + (x + 0.5) * cell, y: bounds.y + (y + 0.5) * cell });
  const [sx, sy] = index(start), [gx, gy] = index(goal);
  const key = (x, y) => y * cols + x;
  const origin = key(sx, sy), destination = key(gx, gy);
  const queue = [[sx, sy]], parents = new Map([[origin, null]]);
  for (let i = 0; i < queue.length; i += 1) {
    const [x, y] = queue[i];
    if (key(x, y) === destination) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || parents.has(k)) continue;
      const p = point(nx, ny);
      if (obstacles.some((b) => p.x > b.left - 14 && p.x < b.right + 14 && p.y > b.top - 10 && p.y < b.bottom + 10)) continue;
      parents.set(k, key(x, y));
      queue.push([nx, ny]);
    }
  }
  if (!parents.has(destination)) return [];
  const path = [];
  for (let k = destination; k !== origin; k = parents.get(k)) path.push(point(k % cols, Math.floor(k / cols)));
  return path.reverse();
}

export function joinParty(scene, sprite) {
  sprite.clearTint().setScale(0.9).setVelocity(0, 0);
  scene.partyTete = sprite;
  scene.partyTeteHealth = 25;
  scene.partyTeteSleeping = false;
  createPartyBeer(scene);
  scene.partyPath = [];
  scene.partyNextPathAt = 0;
  scene.partyLabel = scene.add.text(sprite.x, sprite.y - 43, 'Tete · Party', {
    fontFamily: 'Arial', fontSize: '10px', color: '#bce6cb', stroke: '#17231f', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(30);
  scene.partyShadow = scene.add.ellipse(sprite.x, sprite.y + 27, 38, 12, 0x101019, 0.35).setDepth(3);
  scene.partyHealthBar = scene.add.graphics().setDepth(30);
  scene.partyCollider = scene.physics.add.collider(sprite, scene.arenaSolids);
  const hud = document.createElement('div');
  hud.className = 'party-hud';
  hud.innerHTML = '<img src="/assets/Tete.png" alt="Tete"><div><small>PARTY</small><strong>Tete</strong><span>Te urmează</span></div>';
  scene.partyHud = hud;
  hud.querySelector('span').textContent = '25/25 HP · Te urmează';
  document.body.appendChild(hud);
  scene.events.once('shutdown', () => hud.remove());
}

export function updateParty(scene) {
  const npc = scene.partyTete;
  if (!npc?.active || scene.partyTeteSleeping) return;
  const start = npc.body.center, goal = scene.player.body.center;
  const distance = Math.hypot(goal.x - start.x, goal.y - start.y);
  if (scene.bookOpen || scene.chapterDialogueOpen || scene.levelTransitioning || distance < 52) {
    npc.setVelocity(0, 0);
    scene.partyPath = [];
  } else {
    if (scene.time.now >= scene.partyNextPathAt) {
      scene.partyNextPathAt = scene.time.now + 450;
      const obstacles = (scene.level2Solids || scene.arenaSolids).getChildren().map(({ body }) => body).filter(Boolean);
      scene.partyPath = findPartyPath(start, goal, scene.physics.world.bounds, obstacles);
    }
    while (scene.partyPath.length && Math.hypot(scene.partyPath[0].x - start.x, scene.partyPath[0].y - start.y) < 8) scene.partyPath.shift();
    const target = scene.partyPath[0];
    if (target) {
      const dx = target.x - start.x, dy = target.y - start.y;
      const length = Math.hypot(dx, dy) || 1;
      const speed = distance > 170 ? 235 : 150;
      npc.setVelocity(dx / length * speed, dy / length * speed);
    } else npc.setVelocity(0, 0);
  }
  npc.setDepth(10 + npc.body.bottom / 100);
  scene.partyLabel.setPosition(npc.x, npc.y - 49).setText(`Tete · ${scene.partyTeteHealth}/25`);
  scene.partyHealthBar.clear().setPosition(npc.x - 18, npc.y - 42);
  scene.partyHealthBar.fillStyle(0x25372e).fillRoundedRect(0, 0, 36, 4, 1);
  scene.partyHealthBar.fillStyle(0x93cba6).fillRect(1, 1, 34 * scene.partyTeteHealth / 25, 2);
  scene.partyShadow.setPosition(npc.x, npc.body.bottom - 3);
  updatePartyBeer(scene);
}

export function showLevelOneTitle(scene) {
  const overlay = document.createElement('div');
  overlay.className = 'level-complete level-intro-title';
  overlay.innerHTML = '<div class="complete-emblem">I</div><strong>Level 1 - Find Tete</strong><span>Satul Betivilor</span>';
  document.body.appendChild(overlay);
  scene.time.delayedCall(4000, () => overlay.remove());
  scene.events.once('shutdown', () => overlay.remove());
}

export function showLevelComplete(scene) {
  const overlay = document.createElement('div');
  overlay.className = 'level-complete';
  overlay.innerHTML = '<div class="complete-emblem">I</div><small>VICTORIE</small><strong>Level 1 – Complete</strong><span>+3 puncte de status · Cartea primită · Tete s-a alăturat party-ului</span>';
  document.body.appendChild(overlay);
  scene.time.delayedCall(3200, () => overlay.remove());
  scene.events.once('shutdown', () => overlay.remove());
}

export function giveVictoryBook(scene) {
  if (scene.inventory.some(({ type }) => type === 'book')) return;
  const slot = scene.inventory.findIndex(({ type }) => type === 'empty');
  if (slot < 0) return;
  scene.inventory[slot] = { type: 'book', label: 'Cartea lui Tete · Click pentru a deschide', key: String(slot + 1) };
  scene.updateInventoryList();
  scene.updateHotbarState();
}

export function closeBook(scene) {
  scene.bookOverlay?.remove();
  scene.bookOverlay = null;
  scene.bookOpen = false;
}

export async function openBook(scene) {
  if (scene.bookOpen) return;
  scene.bookOpen = true;
  scene.player.setVelocity(0, 0);
  const overlay = document.createElement('div');
  scene.bookOverlay = overlay;
  overlay.className = 'book-overlay';
  overlay.innerHTML = '<section class="book-panel" role="dialog" aria-modal="true" aria-label="Cartea lui Tete"><header><div><small>RECOMPENSĂ · LEVEL 1</small><h2>Cartea lui Tete</h2></div><button class="book-close" aria-label="Închide cartea">×</button></header><div class="book-page"><p>Se deschide cartea…</p></div><footer><button class="book-prev">← Înapoi</button><span class="book-count"></span><button class="book-next">Înainte →</button></footer></section>';
  document.body.appendChild(overlay);
  overlay.querySelector('.book-close').addEventListener('click', () => closeBook(scene));
  overlay.addEventListener('click', (event) => { if (event.target === overlay) closeBook(scene); });
  const page = overlay.querySelector('.book-page');
  const count = overlay.querySelector('.book-count');
  const prev = overlay.querySelector('.book-prev'), next = overlay.querySelector('.book-next');
  prev.disabled = next.disabled = true;
  overlay.querySelector('.book-close').focus();
  scene.events.once('shutdown', () => closeBook(scene));
  let pages = [];
  try {
    const response = await fetch('/assets/book/pages.json');
    if (!response.ok) throw new Error('No pages');
    const data = await response.json();
    pages = data.pages.filter((src) => typeof src === 'string' && src.startsWith('/assets/') && !src.includes('..'));
  } catch { /* The book can be opened before its photographs have been supplied. */ }
  if (scene.bookOverlay !== overlay) return;
  let index = 0;
  const render = () => {
    page.replaceChildren();
    if (!pages.length) {
      const message = document.createElement('p');
      message.textContent = 'Cartea nu are încă fotografii.';
      page.appendChild(message);
    } else {
      const photo = document.createElement('img');
      photo.src = pages[index];
      photo.alt = `Pagina ${index + 1}`;
      photo.addEventListener('error', () => { photo.replaceWith(document.createTextNode('Fotografia nu este disponibilă.')); });
      page.appendChild(photo);
    }
    count.textContent = `${index + 1} / ${Math.max(1, pages.length)}`;
    prev.disabled = index === 0;
    next.disabled = index >= pages.length - 1;
    page.classList.remove('turning');
    void page.offsetWidth;
    page.classList.add('turning');
  };
  prev.addEventListener('click', () => { if (index > 0) { index -= 1; render(); } });
  next.addEventListener('click', () => { if (index + 1 < pages.length) { index += 1; render(); } });
  render();
}

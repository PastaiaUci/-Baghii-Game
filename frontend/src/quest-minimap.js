export function questMapInfo(scene) {
  if (scene.farm) return { x: 80, y: 105, width: 800, height: 465, title: 'Han · Misiuni', theme: 'tavern' };
  if (scene.bossRoomActive) return { ...scene.bossRoomBounds, title: 'Camera lui Tete', theme: 'boss' };
  return { x: 0, y: 0, width: 1600, height: 1200, title: scene.currentLevel === 2 ? 'Austria · Misiuni' : 'Sat · Misiuni', theme: scene.currentLevel === 2 ? 'alpine' : 'village' };
}

export function questMapTargets(scene) {
  const targets = [];
  const push = (id, name, x, y, status) => targets.push({ id, name, x, y, status });
  const farm = scene.farm || scene, tavern = farm.tavernQuest?.status || 'inactive';
  if (scene.farm) {
    const visitor = (name, status) => {
      const npc = scene.tavernVisitors?.[name]?.group;
      if (npc) push(name, name, npc.x, npc.y, status);
    };
    if (tavern === 'inactive') { visitor('Haralamb', 'available'); visitor('Chinezu', 'available'); }
    if (tavern === 'active') visitor('Sniku', 'objective');
    if (tavern === 'walking') visitor('Sniku', 'waiting');
    if (tavern === 'ready') visitor('Haralamb', 'ready');
    return targets;
  }
  if (scene.currentLevel === 2) {
    const npc = scene.emperorLuis;
    if (npc?.visible && scene.luisQuest?.status !== 'completed') {
      const count = scene.luisQuest?.count || 0;
      push('luis', `Luis · ${scene.luisQuest ? `${count}/3 medalioane` : 'Întreabă de Bobiță'}`, npc.x, npc.y, !scene.luisQuest ? 'available' : count >= 3 ? 'ready' : 'waiting');
    }
    if (scene.mountainPortal) push('mountain-portal', 'Portal spre munți · În curând', scene.mountainPortal.x, scene.mountainPortal.y, 'objective');
    return targets;
  }
  if (scene.bossRoomActive) {
    if (scene.bossFightActive && scene.boss) push('tete', 'Tete · Învinge bossul', scene.boss.x, scene.boss.y, 'objective');
    if (scene.bossDefeated && !scene.bossLootState?.consumed) {
      scene.bossLoot?.forEach((item) => push(`loot-${item.type}`, `Recompensă · ${item.name}`, item.sprite.x, item.sprite.y, 'ready'));
    }
    if (scene.chapterPortal) push('portal', 'Portal · Nivelul 2', scene.chapterPortal.x, scene.chapterPortal.y, 'objective');
    return targets;
  }
  if (!scene.hasCoupon && scene.couponKeeper?.visible) push('keeper', 'Cupon Keeper · Cupon 100 gold', scene.couponKeeper.x, scene.couponKeeper.y, scene.gold >= 100 ? 'ready' : 'available');
  if (!scene.abgPicked && scene.abgNpc?.visible) push('lavinia', 'Lavinia Gauncan', scene.abgNpc.x, scene.abgNpc.y, 'objective');
  if (tavern !== 'completed') push('han', tavern === 'active' ? 'Sniku · În han' : tavern === 'ready' ? 'Haralamb · Ridică poțiunea din han' : 'Haralamb & Chinezu · Misiune în han', 430, 390, tavern === 'ready' ? 'ready' : tavern === 'active' ? 'objective' : tavern === 'walking' ? 'waiting' : 'available');
  return targets;
}

export function updateQuestMinimap(scene) {
  if (!scene.minimapSurface || !scene.player) return;
  const map = questMapInfo(scene);
  scene.minimap.querySelector('.minimap-label').textContent = map.title;
  scene.minimapSurface.dataset.theme = map.theme;
  const position = (node, x, y) => {
    node.style.left = `${Math.max(4, Math.min(96, (x - map.x) / map.width * 100))}%`;
    node.style.top = `${Math.max(7, Math.min(93, (y - map.y) / map.height * 100))}%`;
  };
  position(scene.minimapPlayer, scene.player.x, scene.player.y);
  scene.questMinimapNodes ||= new Map();
  const targets = questMapTargets(scene), ids = new Set(targets.map(({ id }) => id));
  for (const [id, node] of scene.questMinimapNodes) {
    if (!ids.has(id)) { node.remove(); scene.questMinimapNodes.delete(id); }
  }
  for (const target of targets) {
    let node = scene.questMinimapNodes.get(target.id);
    if (!node) {
      node = document.createElement('span'); scene.minimapSurface.appendChild(node); scene.questMinimapNodes.set(target.id, node);
    }
    node.className = `minimap-quest minimap-quest-${target.status}`;
    node.textContent = target.status === 'available' ? '!' : target.status === 'waiting' ? '◇' : '▼';
    node.title = target.name; node.setAttribute('aria-label', target.name);
    position(node, target.x, target.y);
  }
}

export function createTavernMinimap(scene) {
  const map = document.createElement('div'); map.className = 'minimap tavern-minimap';
  map.innerHTML = '<div class="minimap-label">Han · Misiuni</div><div class="minimap-surface"><div class="minimap-player"></div></div><div class="minimap-legend">! Misiune · ▼ Obiectiv</div>';
  scene.minimap = map; scene.minimapSurface = map.querySelector('.minimap-surface'); scene.minimapPlayer = map.querySelector('.minimap-player');
  document.body.appendChild(map);
  const update = () => updateQuestMinimap(scene);
  scene.events.on('update', update); update();
  scene.events.once('shutdown', () => { scene.events.off('update', update); map.remove(); });
}

export function getSelectedItem(scene) {
  const match = /^slot-([1-5])$/.exec(scene.selectedWeapon);
  return match ? scene.inventory[Number(match[1]) - 1] : undefined;
}

export function swapInventorySlots(scene, from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 ||
      from >= scene.inventory.length || to >= scene.inventory.length || from === to || scene.inventory[from].type === 'empty') return false;
  [scene.inventory[from], scene.inventory[to]] = [scene.inventory[to], scene.inventory[from]];
  [from, to].forEach((index) => {
    scene.inventory[index].key = String(index + 1);
    if (scene.inventory[index].type === 'empty') scene.inventory[index].label = `Slot ${index + 1}`;
  });
  scene.updateInventoryList();
  scene.updateHotbarState();
  return true;
}

export function installInventoryDragging(scene) {
  const list = scene.inventoryList;
  const clear = () => {
    scene.inventoryDragSource = null;
    scene.inventoryClickBlockedUntil = scene.game.loop.now + 200;
    list.querySelectorAll('.dragging, .drop-target').forEach((element) => element.classList.remove('dragging', 'drop-target'));
  };
  list.addEventListener('dragstart', (event) => {
    const slot = event.target.closest('[data-inventory-index]');
    const index = slot ? Number(slot.dataset.inventoryIndex) : -1;
    if (index < 0 || scene.inventory[index]?.type === 'empty') { event.preventDefault(); return; }
    scene.inventoryDragSource = index;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
    slot.classList.add('dragging');
  });
  list.addEventListener('dragover', (event) => {
    if (!Number.isInteger(scene.inventoryDragSource)) return;
    const slot = event.target.closest('[data-inventory-index]');
    if (!slot) return;
    event.preventDefault(); event.dataTransfer.dropEffect = 'move';
    list.querySelectorAll('.drop-target').forEach((element) => element.classList.remove('drop-target'));
    slot.classList.add('drop-target');
  });
  list.addEventListener('dragleave', (event) => event.target.closest('[data-inventory-index]')?.classList.remove('drop-target'));
  list.addEventListener('drop', (event) => {
    const slot = event.target.closest('[data-inventory-index]');
    if (!slot || !Number.isInteger(scene.inventoryDragSource)) return;
    event.preventDefault();
    swapInventorySlots(scene, scene.inventoryDragSource, Number(slot.dataset.inventoryIndex));
    clear();
  });
  list.addEventListener('dragend', clear);
}

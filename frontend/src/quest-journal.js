import { shiftMenuTimers } from './pause-menu.js';

export function journalQuests(farm) {
  const quests = [];
  const add = (id, name, kind, state, objective, reward = '') => quests.push({ id, name, kind, state, objective, reward });
  const killed = farm.npcs?.filter((npc) => !npc.alive).length || 0;
  const allKilled = killed === 5 || farm.abgPicked || farm.bossDefeated;
  add('coupon', 'Cuponul pentru Tete', 'Principală · Satul Bețivilor', farm.hasCoupon ? 'completed' : 'active', farm.hasCoupon ? 'Cupon cumpărat de la Cupon Keeper.' : `Adună gold și vorbește cu Cupon Keeper: ${Math.min(farm.gold || 0, 100)}/100 gold.`);
  if (farm.hasCoupon) add('villagers', 'Satul s-a răsculat', 'Principală · Satul Bețivilor', allKilled ? 'completed' : 'active', allKilled ? 'Cei cinci săteni au fost învinși.' : `Învinge sătenii ostili: ${killed}/5.`);
  if (allKilled) add('lavinia', 'Lavinia Gauncan', 'Principală · Satul Bețivilor', farm.abgPicked ? 'completed' : 'active', farm.abgPicked ? 'Ai găsit-o pe Lavinia.' : 'Caut-o pe Lavinia în centrul satului și vorbește cu ea.');
  if (farm.abgPicked || farm.bossRoomActive || farm.bossDefeated) add('tete', 'Găsește-l pe Tete', 'Principală · Camera bossului', farm.bossDefeated ? 'completed' : 'active', farm.bossDefeated ? 'Tete a fost învins și s-a alăturat party-ului.' : 'Învinge-l pe Tete. Evită berea și bălțile albe.', '100 XP · 3 puncte de status · Cartea lui Tete');
  if (farm.bossDefeated) add('reward', 'Alegerea lui Tete', 'Principală · Camera bossului', farm.bossLootState?.consumed ? 'completed' : 'active', farm.bossLootState?.consumed ? 'Ai ales recompensa. Portalul spre Austria este deschis.' : 'Alege unul dintre cele două lichide lăsate de Tete.');
  const tavern = farm.tavernQuest?.status || 'inactive';
  const sniku = {
    inactive: 'Vorbește cu Haralamb sau Chinezu în han pentru a afla ce au nevoie.',
    active: `Trezește-l pe Sniku alegând replicile potrivite. Conversație: ${Math.min(farm.tavernQuest?.step || 0, 3)}/3 replici.`,
    walking: 'Sniku s-a trezit. Așteaptă să ajungă la barman.',
    serving: 'Barmanul îi pregătește băutura lui Sniku. Așteaptă să fie servit.',
    ready: 'Sniku a primit băutura. Întoarce-te la Haralamb pentru recompensă.',
    completed: 'Sniku s-a trezit și a fost servit. Ai primit recompensa de la Haralamb.',
  };
  if (farm.currentLevel !== 2 || tavern !== 'inactive') add('sniku', 'Trezește-l pe Sniku', 'Secundară · Han', tavern === 'completed' ? 'completed' : tavern === 'inactive' ? 'available' : 'active', sniku[tavern], '75 XP · Poțiune de viață (+10 HP)');
  if (farm.currentLevel === 2) {
    const rescue = farm.mountainRescue;
    if (rescue) add('mountain-rescue', 'Bobiță în ghețuri', 'Principală · Trecătoarea înghețată', ['rescued', 'transporting', 'delivered', 'thawed'].includes(rescue.status) ? 'completed' : 'active', { searching: `Urcă la platou și sparge pietrele: ${rescue.broken.length}/18 cercetate.`, found: 'Bobiță este prins într-un bloc de gheață. Apropie-te și ridică-l cu E.', carrying: 'Coboară cu Bobiță la portal și adu-l înapoi în sat.', rescued: 'L-ai adus pe Bobiță înghețat în sat, lângă Luis.', transporting: 'Bobiță a fost salvat din munți.', delivered: 'Bobiță a fost adus la F0ngel.', thawed: 'Bobiță este la căldură.' }[rescue.status]);
    if (rescue && ['rescued', 'transporting', 'delivered', 'thawed'].includes(rescue.status)) add('matei-thaw', 'La căldură, la F0ngel', 'Principală · Satul alpin', rescue.status === 'thawed' ? 'completed' : 'active', { rescued: 'Ridică-l pe Bobiță de lângă Luis cu E / click și du-l la casa lui F0ngel din nord-vest.', transporting: 'Îl cari pe Bobiță. Intră în casa lui F0ngel cu E / click.', delivered: 'Ajută-l pe F0ngel să facă focul: are nevoie de lemne din sania Moșului.', thawed: 'Bobiță s-a dezghețat și s-a alăturat party-ului.' }[rescue.status]);
    if (rescue?.firewood) add('matei-firewood', 'Lemne din sania Moșului', 'Secundară · Foc pentru Bobiță', rescue.firewood.stage === 'burning' ? 'completed' : 'active', { needed: 'Sparge cu sabia sania ruptă a lui Moș Crăciun, în vestul satului.', chopped: 'Ridică cele 3 lemne cu E / click. Ai nevoie de un slot liber.', collected: 'Du lemnele la F0ngel și vorbește cu el.', burning: 'Ai adus lemnele și focul este aprins.' }[rescue.firewood.stage]);
    const luis = farm.luisQuest;
    add('luis', 'Pe urmele lui Bobiță', 'Principală · Austria', luis?.status === 'completed' ? 'completed' : 'active', !luis ? 'Vorbește cu Împăratul Luis al XIV-lea despre Bobiță.' : luis.status === 'completed' ? 'Luis ți-a arătat drumul spre portalul din nord.' : `${Math.min(luis.count || 0, 3)}/3 medalioane de aur. Sparge pietrele cu aură și du-i medalioanele lui Luis.`, '100 XP · Traseul spre munți');
    const winter = farm.winterQuest?.status;
    const objectives = { blocked: 'Portalul nu te lasă să treci. Întoarce-te la Luis să afli de ce.', 'seek-migan': 'Intră în casa lui Miganul, în sud-vestul satului, și cere-i o scurtă.', searching: 'Caută alifia în cuferele casei lui Miganul.', 'ointment-found': 'Ai alifia. Du-o lui Miganul pentru a primi scurta.', 'coat-owned': 'Ai primit Scurta de Iarnă. Echipeaz-o și întoarce-te la portal.', ready: 'Scurta este echipată și ești pregătit pentru continuarea drumului prin munți.' };
    if (winter) add('winter', 'O Scurtă de Iarnă', 'Principală · Austria', ['coat-owned', 'ready'].includes(winter) ? 'completed' : 'active', objectives[winter], '80 XP · Scurta de Iarnă');
  }
  return quests;
}

export function installQuestJournal(farm) {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'journal-toggle';
  button.textContent = 'J · Misiuni'; button.setAttribute('aria-label', 'Deschide jurnalul de misiuni'); button.setAttribute('aria-expanded', 'false');
  document.body.appendChild(button);
  let overlay = null, paused = null, started = 0, previousFocus = null, filter = 'all';
  const close = () => {
    if (!overlay) return;
    overlay.remove(); overlay = null; farm.journalOpen = false;
    shiftMenuTimers(paused, Math.max(0, farm.game.loop.now - started)); paused.input.keyboard.resetKeys(); paused.scene.resume(); paused = null;
    button.setAttribute('aria-expanded', 'false'); previousFocus?.focus();
  };
  farm.closeJournal = close;
  const render = () => {
    const quests = journalQuests(farm), list = overlay.querySelector('.journal-list'); list.replaceChildren();
    overlay.querySelector('.journal-progress').textContent = `${quests.filter((q) => q.state === 'completed').length}/${quests.length} misiuni încheiate`;
    for (const quest of quests.filter((q) => filter === 'all' || (filter === 'active' ? q.state !== 'completed' : q.state === 'completed'))) {
      const card = document.createElement('article'); card.className = `journal-card journal-card-${quest.state}`;
      card.innerHTML = '<small></small><header><h3></h3><span></span></header><p></p><footer></footer>';
      card.querySelector('small').textContent = quest.kind; card.querySelector('h3').textContent = quest.name;
      card.querySelector('span').textContent = { completed: 'Încheiată', active: 'În curs', available: 'Disponibilă' }[quest.state];
      card.querySelector('p').textContent = quest.objective; card.querySelector('footer').textContent = quest.reward ? `Recompensă: ${quest.reward}` : '';
      list.appendChild(card);
    }
    if (!list.childElementCount) { const empty = document.createElement('p'); empty.textContent = 'Nicio misiune în această categorie.'; list.appendChild(empty); }
    overlay.querySelectorAll('[data-journal-filter]').forEach((tab) => tab.setAttribute('aria-pressed', String(tab.dataset.journalFilter === filter)));
  };
  const toggle = () => {
    if (overlay) { close(); return; }
    if (farm.menuOpen || farm.statsOpen || farm.bookOpen || farm.gameOver || farm.chapterDialogueOpen || farm.npcDialogueOpen || farm.levelTransitioning || !farm.introOverlay.classList.contains('hidden')) return;
    paused = farm.scene.isActive('MateiHouseScene') ? farm.scene.get('MateiHouseScene') : farm.scene.isActive('MountainScene') ? farm.scene.get('MountainScene') : farm.scene.isActive('MiganHouseScene') ? farm.scene.get('MiganHouseScene') : farm.scene.isActive('TavernScene') ? farm.scene.get('TavernScene') : farm;
    if (paused.npcDialogueOpen || paused.dead || paused.leaving) { paused = null; return; }
    farm.toggleInventory(false); previousFocus = document.activeElement; started = farm.game.loop.now;
    paused.input.keyboard.resetKeys(); paused.scene.pause(); farm.journalOpen = true;
    overlay = document.createElement('div'); overlay.className = 'journal-overlay';
    overlay.innerHTML = '<section class="journal-panel" role="dialog" aria-modal="true" aria-labelledby="journal-title"><header class="journal-heading"><div><small>AVENTURA LUI GDOLF</small><h2 id="journal-title">Jurnal de misiuni</h2><p class="journal-progress"></p></div><button type="button" class="journal-close" aria-label="Închide jurnalul">×</button></header><nav aria-label="Categorii misiuni"><button type="button" data-journal-filter="all">Toate</button><button type="button" data-journal-filter="active">Active</button><button type="button" data-journal-filter="completed">Încheiate</button></nav><div class="journal-list"></div><p class="journal-hint">J / Esc · Închide jurnalul</p></section>';
    overlay.querySelector('.journal-close').onclick = close;
    overlay.querySelectorAll('[data-journal-filter]').forEach((tab) => { tab.onclick = () => { filter = tab.dataset.journalFilter; render(); }; });
    overlay.onclick = (event) => { if (event.target === overlay) close(); };
    document.body.appendChild(overlay); render(); button.setAttribute('aria-expanded', 'true'); overlay.querySelector('.journal-close').focus();
  };
  button.onclick = toggle;
  const keydown = (event) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName) || event.target?.isContentEditable) return;
    if (event.key.toLowerCase() === 'j' || overlay && event.key === 'Escape') {
      event.preventDefault(); event.stopImmediatePropagation(); if (!event.repeat) toggle();
    } else if (overlay) {
      event.stopImmediatePropagation();
      if (event.key === 'Tab') {
        const controls = [...overlay.querySelectorAll('button')], index = controls.indexOf(document.activeElement);
        event.preventDefault(); controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
      }
    }
  };
  document.addEventListener('keydown', keydown, true);
  farm.events.once('shutdown', () => { overlay?.remove(); button.remove(); document.removeEventListener('keydown', keydown, true); farm.journalOpen = false; });
}

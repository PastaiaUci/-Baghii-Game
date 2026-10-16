export function playDiceRound(scene, stake, random = Math.random) {
  if (!Number.isSafeInteger(stake) || stake <= 0) return { error: 'Alege o miză întreagă, mai mare decât zero.' };
  if (scene.gold < stake) return { error: scene.gold === 0 ? 'N-ai niciun gold! Ai venit la barbut cu buzunarele goale? Ha-ha!' : 'N-ai destul gold pentru miza asta. Mai numără o dată bănuții!' };
  const roll = () => [1 + Math.floor(random() * 6), 1 + Math.floor(random() * 6)];
  const player = roll(), opponent = roll();
  const total = (dice) => dice[0] + dice[1];
  const outcome = Math.sign(total(player) - total(opponent));
  // Stake is paid first; a win returns twice the stake, a draw returns the stake.
  scene.gold -= stake;
  const payout = outcome > 0 ? stake * 2 : outcome === 0 ? stake : 0;
  scene.gold += payout;
  scene.updateGoldHud();
  return { player, opponent, outcome, payout, stake };
}

export function openDiceGame(scene, person) {
  const panel = document.createElement('form');
  panel.className = 'dice-game';
  panel.innerHTML = `<p>Două zaruri fiecare. Suma mai mare câștigă. La victorie primești 2× miza; la egalitate o primești înapoi.</p>
    <label>Miza în gold <input aria-label="Miza în gold" type="number" min="1" step="1" required value="10"></label>
    <div class="dice-bet-presets"><button type="button" data-bet="10">10</button><button type="button" data-bet="25">25</button><button type="button" data-bet="50">50</button></div>
    <button type="submit" class="dice-play">Aruncă zarurile</button><div class="dice-result" role="status" aria-live="polite"></div><p class="dice-balance"></p>`;
  scene.dialogBox.querySelector('.dice-game')?.remove();
  scene.dialogOkButton.before(panel);
  scene.dialogOkButton.addEventListener('click', () => panel.remove(), { once: true });
  const input = panel.querySelector('input');
  const result = panel.querySelector('.dice-result');
  const balance = panel.querySelector('.dice-balance');
  const syncBalance = () => {
    balance.textContent = `Ai ${scene.gold} gold.`;
    if (scene.gold === 0) {
      scene.dialogText.textContent = `${person.name}: Ha-ha! N-ai niciun bănuț, Gdolf! La barbut se vine cu gold, nu cu buzunarele goale!`;
    }
  };
  panel.querySelectorAll('[data-bet]').forEach((button) => button.addEventListener('click', () => { input.value = button.dataset.bet; }));
  let rolling = false;
  panel.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (rolling) return;
    const round = playDiceRound(scene, Number(input.value));
    if (round.error) { result.textContent = round.error; syncBalance(); return; }
    rolling = true;
    const controls = [...panel.querySelectorAll('button, input'), scene.dialogOkButton];
    controls.forEach((control) => { control.disabled = true; });
    result.replaceChildren();
    const tray = document.createElement('div');
    tray.className = 'dice-throw-tray';
    const orientations = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] };
    const pipPositions = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
    const animations = [];
    [round.player, round.opponent].forEach((values, side) => {
      const lane = document.createElement('div');
      lane.className = 'dice-throw-lane';
      const label = document.createElement('strong');
      label.textContent = side ? person.name : 'Gdolf';
      const pair = document.createElement('div');
      pair.className = 'dice-cube-pair';
      lane.append(label, pair);
      values.forEach((value, index) => {
        const space = document.createElement('div');
        space.className = 'dice-cube-space';
        const cube = document.createElement('div');
        cube.className = 'dice-cube';
        cube.setAttribute('aria-label', `Zar: ${value}`);
        for (let face = 1; face <= 6; face += 1) {
          const surface = document.createElement('div');
          surface.className = `dice-cube-face dice-face-${face}`;
          surface.setAttribute('aria-hidden', 'true');
          pipPositions[face].forEach((position) => {
            const pip = document.createElement('i');
            pip.style.gridArea = `${Math.floor((position - 1) / 3) + 1} / ${(position - 1) % 3 + 1}`;
            surface.appendChild(pip);
          });
          cube.appendChild(surface);
        }
        const [x, y] = orientations[value];
        const rest = `rotateX(${x}deg) rotateY(${y}deg)`;
        cube.style.transform = rest;
        space.appendChild(cube); pair.appendChild(space);
        const direction = index ? 1 : -1;
        animations.push(cube.animate([
          { transform: `translate(${direction * 45}px, -45px) rotateX(${x + 720}deg) rotateY(${y + 540}deg)`, opacity: 0 },
          { transform: `translate(${direction * -8}px, 5px) rotateX(${x + 310}deg) rotateY(${y + 260}deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(3px, -15px) rotateX(${x + 100}deg) rotateY(${y + 80}deg)`, offset: 0.72 },
          { transform: `translate(-2px, 2px) rotateX(${x + 12}deg) rotateY(${y + 8}deg)`, offset: 0.9 },
          { transform: rest },
        ], { duration: 1250 + side * 170 + index * 120, easing: 'ease-out', fill: 'backwards' }).finished);
      });
      const total = document.createElement('span');
      total.className = 'dice-throw-total';
      total.textContent = `Total: ${values[0] + values[1]}`;
      total.hidden = true;
      lane.appendChild(total); tray.appendChild(lane);
    });
    const status = document.createElement('p');
    status.textContent = 'Zarurile se rostogolesc…';
    result.append(tray, status);
    await Promise.allSettled(animations);
    tray.querySelectorAll('.dice-throw-total').forEach((total) => { total.hidden = false; });
    status.remove();
    const message = document.createElement('p');
    message.textContent = round.outcome > 0 ? `Ai câștigat! Primești ${round.payout} gold (+${round.stake} profit).` : round.outcome < 0 ? `Ai pierdut ${round.stake} gold. ${person.name}: „Mai exersează, Gdolf!”` : 'Egalitate! Miza ți-a fost returnată.';
    result.appendChild(message);
    controls.forEach((control) => { control.disabled = false; });
    rolling = false;
    syncBalance();
  });
  syncBalance();
}

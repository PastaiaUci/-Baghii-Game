const SKILL_TIMERS = {
  rushSkill: ['activeUntil', 'readyAt'], swordAuraSkill: ['until', 'readyAt'], deathBreath: ['until', 'readyAt', 'nextTick'],
};
const EFFECT_TIMERS = ['flashlightReadyAt', 'slowVisualUntil'];

// Interior scenes use their own Phaser clock. Preserve remaining durations on entry/exit.
export function transferSkillState(source, target, sourceNow, targetNow) {
  const convert = (value) => value > sourceNow ? targetNow + value - sourceNow : 0;
  for (const [key, timers] of Object.entries(SKILL_TIMERS)) {
    if (!source[key]) continue;
    target[key] = Object.assign(Object.create(Object.getPrototypeOf(source[key])), source[key]);
    for (const timer of timers) target[key][timer] = convert(source[key][timer]);
  }
  for (const key of EFFECT_TIMERS) target[key] = convert(source[key]);
}

export function shiftSkillTimers(scene, elapsed) {
  for (const [key, timers] of Object.entries(SKILL_TIMERS)) {
    for (const timer of timers) if (scene[key]?.[timer] > 0) scene[key][timer] += elapsed;
  }
  for (const key of EFFECT_TIMERS) if (scene[key] > 0) scene[key] += elapsed;
}

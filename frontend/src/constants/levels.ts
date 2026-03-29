export const LEVELS = [
  { title: "Beginner", minXp: 0, maxXp: 79 },
  { title: "Prep Pro", minXp: 80, maxXp: 179 },
  { title: "Pan Whisperer", minXp: 180, maxXp: 349 },
  { title: "Flavor Architect", minXp: 350, maxXp: 599 },
  { title: "Master Chef", minXp: 600, maxXp: Number.MAX_SAFE_INTEGER },
] as const;

export const XP_REWARDS = {
  scan: 24,
  save: 14,
  chat: 10,
} as const;

export function getLevelForXp(xp: number) {
  return LEVELS.find((level) => xp >= level.minXp && xp <= level.maxXp) ?? LEVELS[0];
}

export function getLevelProgress(xp: number) {
  const level = getLevelForXp(xp);
  const nextLevel = LEVELS.find((entry) => entry.minXp > level.minXp);
  if (!nextLevel) {
    return {
      level,
      nextLevel: null,
      progress: 1,
      currentLevelXp: xp - level.minXp,
      xpToNext: 0,
    };
  }

  const span = nextLevel.minXp - level.minXp;
  const earned = Math.max(0, xp - level.minXp);
  return {
    level,
    nextLevel,
    progress: Math.min(earned / span, 1),
    currentLevelXp: earned,
    xpToNext: Math.max(nextLevel.minXp - xp, 0),
  };
}

import type { InnateTalent, StatBlock, SuperStat } from "@/types/character";

export const innateTalentStatLabels: Record<keyof StatBlock, string> = {
  str: "Str",
  dex: "Dex",
  con: "Con",
  int: "Int",
  ego: "Ego",
  pre: "Pre",
  rec: "Rec",
  end: "End",
};

const statNameToKey: Record<string, keyof StatBlock> = {
  Strength: "str",
  Dexterity: "dex",
  Constitution: "con",
  Intelligence: "int",
  Ego: "ego",
  Presence: "pre",
  Recovery: "rec",
  Endurance: "end",
};

export function getSelectedStatKeys(superStats: (SuperStat | null)[]) {
  return new Set(
    superStats
      .map((stat) => (stat ? statNameToKey[stat.name] : undefined))
      .filter((statKey) => statKey !== undefined),
  );
}

export function getInnateTalentStatEntries(
  talent: InnateTalent,
  selectedStatKeys: Set<keyof StatBlock>,
) {
  return Object.entries(innateTalentStatLabels)
    .filter(([statKey]) => talent.stats[statKey as keyof StatBlock] > 5)
    .map(([statKey, label]) => {
      const key = statKey as keyof StatBlock;

      return {
        key,
        label,
        matchesSelectedStat: selectedStatKeys.has(key),
        value: talent.stats[key],
      };
    });
}

export function countMatchingStats(
  talent: InnateTalent,
  selectedStatKeys: Set<keyof StatBlock>,
) {
  return getInnateTalentStatEntries(talent, selectedStatKeys).filter(
    (entry) => entry.matchesSelectedStat,
  ).length;
}

export function getMatchingInnateTalentStatValue(
  talent: InnateTalent,
  selectedStatKeys: Set<keyof StatBlock>,
) {
  return getInnateTalentStatEntries(talent, selectedStatKeys)
    .filter((entry) => entry.matchesSelectedStat)
    .reduce((total, entry) => total + entry.value, 0);
}

export function countInnateTalentVisibleStats(talent: InnateTalent) {
  return getInnateTalentStatEntries(talent, new Set()).length;
}

export function getInnateTalentProfilePriority(talent: InnateTalent) {
  const visibleStatCount = countInnateTalentVisibleStats(talent);

  if (visibleStatCount === 2) {
    return 0;
  }

  if (visibleStatCount === 3) {
    return 1;
  }

  return 2;
}

export function getInnateTalentMatchPriority(
  talent: InnateTalent,
  selectedStatKeys: Set<keyof StatBlock>,
) {
  const visibleStatCount = countInnateTalentVisibleStats(talent);
  const matchingStatCount = countMatchingStats(talent, selectedStatKeys);

  if (visibleStatCount === 2 && matchingStatCount === 2) {
    return 0;
  }

  if (matchingStatCount >= 3) {
    return 1;
  }

  if (matchingStatCount === 2) {
    return 2;
  }

  if (matchingStatCount === 1) {
    return 3;
  }

  return 4;
}

export function getInnateTalentTip(talent: InnateTalent) {
  const stats = Object.entries(innateTalentStatLabels)
    .map(([statKey, label]) => {
      const value = talent.stats[statKey as keyof StatBlock];

      return `${label}: ${value}`;
    })
    .join("\n");

  return [talent.overrideTip, stats].filter(Boolean).join("\n\n");
}

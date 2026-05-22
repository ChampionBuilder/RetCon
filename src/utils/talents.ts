import type { StatBlock, Talent } from "@/types/character";
import { innateTalentStatLabels } from "./innateTalents";

export function getTalentStatEntries(
  talent: Talent,
  selectedStatKeys: Set<keyof StatBlock>,
) {
  return Object.entries(innateTalentStatLabels)
    .filter(([statKey]) => talent.stats[statKey as keyof StatBlock] > 0)
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

export function countMatchingTalentStats(
  talent: Talent,
  selectedStatKeys: Set<keyof StatBlock>,
) {
  return getTalentStatEntries(talent, selectedStatKeys).filter(
    (entry) => entry.matchesSelectedStat,
  ).length;
}

export function getMatchingTalentStatValue(
  talent: Talent,
  selectedStatKeys: Set<keyof StatBlock>,
) {
  return getTalentStatEntries(talent, selectedStatKeys)
    .filter((entry) => entry.matchesSelectedStat)
    .reduce((total, entry) => total + entry.value, 0);
}

export function countTalentVisibleStats(talent: Talent) {
  return getTalentStatEntries(talent, new Set()).length;
}

export function getFocusedTalentMatchPriority(
  talent: Talent,
  selectedStatKeys: Set<keyof StatBlock>,
) {
  const visibleStatCount = countTalentVisibleStats(talent);
  const matchingStatCount = countMatchingTalentStats(talent, selectedStatKeys);

  if (matchingStatCount === 0) {
    return 2;
  }

  return visibleStatCount <= 2 ? 0 : 1;
}

export function getSortedTalents(
  talents: Talent[],
  selectedStatKeys: Set<keyof StatBlock>,
  sortBySelectedStats: boolean,
) {
  const talentList = talents
    .filter((talent) => talent.id > 0)
    .map((talent, index) => ({ index, talent }));

  talentList.sort((a, b) => {
    const statCountDifference =
      countTalentVisibleStats(a.talent) - countTalentVisibleStats(b.talent);

    return statCountDifference || a.index - b.index;
  });

  if (sortBySelectedStats) {
    talentList.sort((a, b) => {
      const priorityDifference =
        getFocusedTalentMatchPriority(a.talent, selectedStatKeys) -
        getFocusedTalentMatchPriority(b.talent, selectedStatKeys);
      const matchedValueDifference =
        getMatchingTalentStatValue(b.talent, selectedStatKeys) -
        getMatchingTalentStatValue(a.talent, selectedStatKeys);
      const matchDifference =
        countMatchingTalentStats(b.talent, selectedStatKeys) -
        countMatchingTalentStats(a.talent, selectedStatKeys);
      const statCountDifference =
        countTalentVisibleStats(a.talent) - countTalentVisibleStats(b.talent);

      return (
        priorityDifference ||
        matchedValueDifference ||
        matchDifference ||
        statCountDifference ||
        a.index - b.index
      );
    });
  }

  return talentList.map(({ talent }) => talent);
}

export function getTalentTip(talent: Talent) {
  return Object.entries(innateTalentStatLabels)
    .filter(([statKey]) => talent.stats[statKey as keyof StatBlock] > 0)
    .map(([statKey, label]) => {
      const value = talent.stats[statKey as keyof StatBlock];

      return `${label}: ${value}`;
    })
    .join("\n");
}

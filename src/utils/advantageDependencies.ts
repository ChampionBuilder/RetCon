import type { Advantage } from "@/types/advantages";

export function getRequiredAdvantage(
  advantage: Advantage,
  slotAdvantages: Advantage[],
) {
  if (advantage.name !== "Rank 3") {
    return null;
  }

  return slotAdvantages.find((candidate) => candidate.name === "Rank 2") ?? null;
}

export function getDependentAdvantageIds(
  advantage: Advantage,
  slotAdvantages: Advantage[],
) {
  return slotAdvantages
    .filter(
      (candidate) =>
        getRequiredAdvantage(candidate, slotAdvantages)?.advantage_id ===
        advantage.advantage_id,
    )
    .map((candidate) => candidate.advantage_id);
}

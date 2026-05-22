import type { Advantage } from "@/types/advantages";
import type { Power } from "@/types/powers";

export function getPowerAdvantages(
  power: Power | null | undefined,
  advantages: Advantage[],
) {
  if (!power) {
    return [];
  }

  const advantagesById = new Map(
    advantages.map((advantage) => [advantage.advantage_id, advantage]),
  );

  return power.advantages
    .map((advantageId) => advantagesById.get(advantageId))
    .filter((advantage): advantage is Advantage => advantage !== undefined);
}

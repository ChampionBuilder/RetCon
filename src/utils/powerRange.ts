import type { Power } from "@/types/powers";

export type PowerRangeFilter = number | "100+" | null;

const volumePattern = /\b(?:cone|cylinder|cuminder|sphere|degree)\b/i;
const targetPattern =
  /\b(?:affect|affects|target|targets|friend|foe|player|self|ally)\b/i;

function extractMaxNumber(value: string) {
  const numbers = Array.from(
    value.replace(/,/g, ".").matchAll(/\d+(?:\.\d+)?/g),
    (match) => Number(match[0]),
  ).filter(Number.isFinite);

  return numbers.length > 0 ? Math.max(...numbers) : null;
}

function isRangeCandidate(value: string) {
  return /\b(?:feet|foot|ft|lunge)\b/i.test(value);
}

function isPreferredRangeCandidate(value: string) {
  return (
    isRangeCandidate(value) &&
    !volumePattern.test(value) &&
    !targetPattern.test(value)
  );
}

export function getPowerRangeFeet(power: Power) {
  const rangeTags = power.range_tags ?? [];

  if (rangeTags.length === 0) {
    return null;
  }

  const preferredRangeTag = rangeTags.find(isPreferredRangeCandidate);

  if (preferredRangeTag) {
    return extractMaxNumber(preferredRangeTag);
  }

  const fallbackRangeTag = rangeTags.find(
    (rangeTag) => isRangeCandidate(rangeTag) && !targetPattern.test(rangeTag),
  );

  if (fallbackRangeTag) {
    return extractMaxNumber(fallbackRangeTag);
  }

  const targetsSelfOnly =
    rangeTags.length === 1 && /\btargets?\s+self\b/i.test(rangeTags[0] ?? "");

  return targetsSelfOnly ? 0 : null;
}

export function getPowerRangeFilterSteps(powers: Power[]) {
  const rangeValues = new Set<number>();
  let hasLongRange = false;

  powers.forEach((power) => {
    const range = getPowerRangeFeet(power);

    if (range === null || range === 0) {
      return;
    }

    if (range > 100) {
      hasLongRange = true;
      return;
    }

    rangeValues.add(range);
  });

  return [
    null,
    ...Array.from(rangeValues).sort((a, b) => a - b),
    ...(hasLongRange ? ["100+" as const] : []),
  ];
}

export function formatPowerRangeFilterLabel(range: PowerRangeFilter) {
  if (range === null) {
    return "Any range";
  }

  if (range === "100+") {
    return "100+ ft";
  }

  return `${range} ft`;
}

export function powerMatchesExactRange(
  power: Power,
  expectedRange: Exclude<PowerRangeFilter, null>,
) {
  const powerRange = getPowerRangeFeet(power);

  if (expectedRange === "100+") {
    return powerRange !== null && powerRange > 100;
  }

  return powerRange === expectedRange;
}

import type { Power } from "@/types/powers";
import type { Advantage } from "@/types/advantages";
import { getNormalizedPowerType, getPowerType } from "./powerTypes";

export type AdvantageTooltipData = {
  id: number;
  name: string;
  pointsCost: number | null;
  tooltip: string | null;
  tags: string[];
};

export type PowerTooltipData = {
  title: string;
  framework: string | null;
  tier: string | null;
  powerType: string | null;
  activationType: string | null;
  metrics: string[];
  rangeTags: string[];
  tags: string[];
  effects: string[];
  advantages: AdvantageTooltipData[];
  fallbackText: string | null;
};

function formatIdentifier(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatSeconds(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(String(value));

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return `${numericValue} sec`;
}

function formatTier(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  if (value === -1) {
    return "Energy Builder";
  }

  if (value === 4) {
    return "Ultimate";
  }

  return `Tier ${value}`;
}

function isPowerVariantDevice(power: Power) {
  return power.powerset_id?.toLowerCase() === "pvd";
}

function formatHeaderMeta(power: Power) {
  if (isPowerVariantDevice(power)) {
    return power.tier === 4 ? "Ultimate Variant" : "Power Variant";
  }

  return formatTier(power.tier);
}

function formatTitle(power: Power) {
  const normalizedPowerType = getNormalizedPowerType(power);

  if (
    normalizedPowerType !== "TOGGLE_FORM" &&
    normalizedPowerType !== "ENERGY_UNLOCK"
  ) {
    return power.name;
  }

  const scalingStats = (power.scaling_stats ?? [])
    .map((stat) => stat.trim().toUpperCase())
    .filter(Boolean);

  return scalingStats.length > 0
    ? `${power.name} - ${scalingStats.join(" - ")}`
    : power.name;
}

function isChargeActivationType(value: string | null | undefined) {
  const normalizedValue = value?.replace(/[_-]/g, " ").trim().toLowerCase();

  return (
    normalizedValue === "blast" ||
    normalizedValue === "charge" ||
    normalizedValue === "full charge"
  );
}

function cleanTooltipText(tooltip: string | null | undefined) {
  return (
    tooltip
      ?.replace(/<br\s*\/?>/gi, " ")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

function cleanMultilineTooltipText(tooltip: string | null | undefined) {
  const text = tooltip
    ?.replace(/<br\s*\/?>/gi, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();

  return text || null;
}

function getAdvantageTooltipData(
  power: Power,
  advantagesById: ReadonlyMap<number, Advantage> | null | undefined,
) {
  if (!advantagesById) {
    return [];
  }

  return power.advantages
    .map((advantageId) => advantagesById.get(advantageId))
    .filter((advantage): advantage is Advantage => Boolean(advantage))
    .filter((advantage) => advantage.name !== "Rank 2" && advantage.name !== "Rank 3")
    .map((advantage) => ({
      id: advantage.advantage_id,
      name: advantage.name,
      pointsCost: advantage.points_cost,
      tooltip: cleanMultilineTooltipText(advantage.tooltip),
      tags: (advantage.tags ?? [])
        .map((tag) => formatIdentifier(tag))
        .filter((tag): tag is string => Boolean(tag)),
    }));
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function stripTrailingPeriod(value: string) {
  return value.replace(/\.$/, "").trim();
}

function splitEffects(text: string) {
  const normalizedText = text.replace(/^Features:\s*/i, "").trim();

  if (!normalizedText) {
    return [];
  }

  if (/(?:^|\s)[+-]\s+/.test(normalizedText)) {
    return normalizedText
      .split(/(?:^|\s)(?=[+-]\s+)/)
      .map((effect) => effect.replace(/^[+-]\s*/, "").trim())
      .filter(Boolean);
  }

  return splitSentences(normalizedText);
}

export function getPowerTooltipData(
  power: Power | null | undefined,
  advantagesById?: ReadonlyMap<number, Advantage> | null,
): PowerTooltipData | null {
  if (!power) {
    return null;
  }

  const tooltipText = cleanTooltipText(power.tooltip);
  const tooltipSentences = splitSentences(tooltipText);

  if (
    tooltipSentences[0] &&
    stripTrailingPeriod(tooltipSentences[0]).toLowerCase() ===
      power.name.toLowerCase()
  ) {
    tooltipSentences.shift();
  }

  const remainingText = tooltipSentences.join(" ");
  const activationTime = formatSeconds(power.activation_time);
  const maxDuration = formatSeconds(power.max_duration);
  const tickRate = formatSeconds(power.tick_rate);
  const cooldown = formatSeconds(power.cooldown);
  const maxDurationLabel = isChargeActivationType(power.activation_type)
    ? "Charge time"
    : "Duration";
  const metrics = [
    activationTime ? `Activation ${activationTime}` : null,
    maxDuration ? `${maxDurationLabel} ${maxDuration}` : null,
    tickRate ? `Tick every ${tickRate}` : null,
    cooldown ? `Cooldown ${cooldown}` : null,
  ].filter((value): value is string => Boolean(value));
  const rangeTags = (power.range_tags ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean);
  const tags = (power.tags ?? [])
    .map((tag) => formatIdentifier(tag))
    .filter((tag): tag is string => Boolean(tag));

  return {
    title: formatTitle(power),
    framework: formatIdentifier(power.framework_id),
    tier: formatHeaderMeta(power),
    powerType: formatIdentifier(getPowerType(power)),
    activationType: formatIdentifier(power.activation_type),
    metrics,
    rangeTags,
    tags,
    effects: splitEffects(remainingText),
    advantages: getAdvantageTooltipData(power, advantagesById),
    fallbackText: tooltipText || null,
  };
}

export function getPowerTooltipAttribute(
  power: Power | null | undefined,
  advantagesById?: ReadonlyMap<number, Advantage> | null,
) {
  const tooltip = getPowerTooltipData(power, advantagesById);

  return tooltip ? JSON.stringify(tooltip) : undefined;
}

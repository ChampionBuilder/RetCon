import type { Power } from "../types/powers";

export type PowerTooltipData = {
  title: string;
  framework: string | null;
  powerType: string | null;
  metrics: string[];
  rangeTags: string[];
  tags: string[];
  overview: string[];
  effects: string[];
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

function cleanTooltipText(tooltip: string | null | undefined) {
  return (
    tooltip
      ?.replace(/<br\s*\/?>/gi, " ")
      .replace(/\s+/g, " ")
      .trim() ?? ""
  );
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function isOverviewSentence(sentence: string) {
  const trimmedSentence = sentence.trim();

  return (
    trimmedSentence.length <= 110 &&
    (/^(Targets|Affects|Passive|Energy Unlock|Form)\b/i.test(
      trimmedSentence,
    ) ||
      /^\d+\s+feet\b/i.test(trimmedSentence) ||
      trimmedSentence.includes("/"))
  );
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
): PowerTooltipData | null {
  if (!power) {
    return null;
  }

  const tooltipText = cleanTooltipText(power.tooltip);
  const tooltipSentences = splitSentences(tooltipText);
  const overview: string[] = [];

  if (
    tooltipSentences[0] &&
    stripTrailingPeriod(tooltipSentences[0]).toLowerCase() ===
      power.name.toLowerCase()
  ) {
    tooltipSentences.shift();
  }

  while (tooltipSentences[0] && isOverviewSentence(tooltipSentences[0])) {
    overview.push(stripTrailingPeriod(tooltipSentences.shift() ?? ""));
  }

  const remainingText = tooltipSentences.join(" ");
  const activationTime = formatSeconds(power.activation_time);
  const maxDuration = formatSeconds(power.max_duration);
  const tickRate = formatSeconds(power.tick_rate);
  const cooldown = formatSeconds(power.cooldown);
  const metrics = [
    activationTime ? `Activation ${activationTime}` : null,
    maxDuration ? `Max duration ${maxDuration}` : null,
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
    title: power.name,
    framework: formatIdentifier(power.framework_id),
    powerType: formatIdentifier(power.Power_Type ?? power.POWER_TYPE),
    metrics,
    rangeTags,
    tags,
    overview,
    effects: splitEffects(remainingText),
    fallbackText: tooltipText || null,
  };
}

export function getPowerTooltipAttribute(
  power: Power | null | undefined,
) {
  const tooltip = getPowerTooltipData(power);

  return tooltip ? JSON.stringify(tooltip) : undefined;
}
